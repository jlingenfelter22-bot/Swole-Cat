// Phase 8.1 account shell.
// This file intentionally performs no workout synchronization and no network calls by itself.
const SWOLE_CAT_CLOUD_AUTH_PREFIX='swolecat_cloud_auth_v1:';
let swoleCatIdentityProvider=null;
let swoleCatIdentityState={
  status:'initializing',
  configured:false,
  signedIn:false,
  user:null,
  providerReady:false,
  lastError:''
};

function cloudAuthLegacyKey(key){
  return SWOLE_CAT_CLOUD_AUTH_PREFIX+String(key||'');
}
function cloudAuthNativeSecurePlugin(){
  if(!isNativeApp()||nativePlatform()!=='android')return null;
  return capacitorPlugin('SwoleCatSecureStorage');
}
function cloudAuthLegacyHasAny(){
  try{
    for(let i=0;i<window.localStorage.length;i++){
      const key=window.localStorage.key(i);
      if(key?.startsWith(SWOLE_CAT_CLOUD_AUTH_PREFIX))return true;
    }
  }catch(error){}
  return false;
}
async function migrateLegacyCloudAuthItem(key,nativeStore){
  const legacyKey=cloudAuthLegacyKey(key);
  const legacy=swoleCatStorage.getItem(legacyKey);
  if(legacy==null)return null;
  await nativeStore.setItem({key:String(key||''),value:String(legacy)});
  const verify=await nativeStore.getItem({key:String(key||'')});
  if(String(verify?.value??'')!==String(legacy)){
    throw new Error('Secure auth migration verification failed.');
  }
  swoleCatStorage.removeItem(legacyKey);
  return String(legacy);
}

const swoleCatCloudAuthStorage=SwoleCatRuntime.registerService('cloudAuthStorage',{
  async getItem(key){
    const normalized=String(key||'');
    const nativeStore=cloudAuthNativeSecurePlugin();
    if(nativeStore?.getItem){
      const result=await nativeStore.getItem({key:normalized});
      if(result?.value!=null)return String(result.value);
      return migrateLegacyCloudAuthItem(normalized,nativeStore);
    }
    return swoleCatStorage.getItem(cloudAuthLegacyKey(normalized));
  },
  async setItem(key,value){
    const normalized=String(key||'');
    if(value==null)return this.removeItem(normalized);
    const nativeStore=cloudAuthNativeSecurePlugin();
    if(nativeStore?.setItem){
      await nativeStore.setItem({key:normalized,value:String(value)});
      swoleCatStorage.removeItem(cloudAuthLegacyKey(normalized));
      return;
    }
    swoleCatStorage.setItem(cloudAuthLegacyKey(normalized),String(value));
  },
  async removeItem(key){
    const normalized=String(key||'');
    const nativeStore=cloudAuthNativeSecurePlugin();
    if(nativeStore?.removeItem)await nativeStore.removeItem({key:normalized});
    swoleCatStorage.removeItem(cloudAuthLegacyKey(normalized));
  },
  hasAny(){
    if(cloudAuthNativeSecurePlugin())return cloudAuthLegacyHasAny();
    return cloudAuthLegacyHasAny();
  },
  async hasAnyAsync(){
    const nativeStore=cloudAuthNativeSecurePlugin();
    if(nativeStore?.keys){
      const result=await nativeStore.keys();
      if(Array.isArray(result?.keys)&&result.keys.length)return true;
      return cloudAuthLegacyHasAny();
    }
    return cloudAuthLegacyHasAny();
  },
  backend(){
    return cloudAuthNativeSecurePlugin()?'android_keystore':'browser_local_storage';
  }
});

function cloudIdentityPublicUser(user){
  if(!user||typeof user!=='object')return null;
  return {
    id:String(user.id||''),
    email:String(user.email||''),
    displayName:String(user.displayName||user.user_metadata?.full_name||user.user_metadata?.name||''),
    provider:String(user.provider||user.app_metadata?.provider||'')
  };
}
function cloudIdentitySnapshot(){
  return {
    status:swoleCatIdentityState.status,
    configured:!!swoleCatIdentityState.configured,
    signedIn:!!swoleCatIdentityState.signedIn,
    user:swoleCatIdentityState.user?{...swoleCatIdentityState.user}:null,
    providerReady:!!swoleCatIdentityState.providerReady,
    lastError:swoleCatIdentityState.lastError||''
  };
}
function emitCloudIdentityChange(){
  SwoleCatRuntime.events.dispatchEvent(new CustomEvent('identity:changed',{detail:cloudIdentitySnapshot()}));
}
function setCloudIdentityState(patch){
  swoleCatIdentityState={...swoleCatIdentityState,...patch};
  emitCloudIdentityChange();
  return cloudIdentitySnapshot();
}
function cloudIdentityConfig(){
  return SwoleCatRuntime.getService('cloudConfig')?.read?.()||{provider:'supabase',configured:false};
}
function validateCloudIdentityProvider(provider){
  if(!provider||typeof provider!=='object')throw new Error('Cloud identity provider is required.');
  for(const name of ['restoreSession','signInWithGoogle','reauthenticateWithGoogle','deleteAccount','signOut']){
    if(typeof provider[name]!=='function')throw new Error('Cloud identity provider is missing '+name+'().');
  }
  return provider;
}
async function initializeCloudIdentity(){
  const config=cloudIdentityConfig();
  if(!config.configured){
    return setCloudIdentityState({
      status:'local_only',
      configured:false,
      signedIn:false,
      user:null,
      providerReady:false,
      lastError:''
    });
  }
  if(!swoleCatIdentityProvider){
    return setCloudIdentityState({
      status:'ready',
      configured:true,
      signedIn:false,
      user:null,
      providerReady:false,
      lastError:''
    });
  }
  setCloudIdentityState({status:'restoring',configured:true,providerReady:true,lastError:''});
  try{
    const result=await swoleCatIdentityProvider.restoreSession({
      config,
      authStorage:swoleCatCloudAuthStorage
    });
    const user=cloudIdentityPublicUser(result?.user);
    const reauthError=result?.reauthError?String(result.reauthError):'';
    const next=setCloudIdentityState({
      status:user?'signed_in':'signed_out',
      signedIn:!!user,
      user,
      lastError:reauthError
    });
    if(reauthError){
      setTimeout(()=>SwoleCatRuntime.events.dispatchEvent(
        new CustomEvent('identity:reauthentication_failed',{detail:{message:reauthError}})
      ),0);
    }
    if(result?.reauthenticated){
      setTimeout(()=>SwoleCatRuntime.events.dispatchEvent(
        new CustomEvent('identity:reauthenticated',{detail:{provider:user?.provider||'google'}})
      ),0);
    }
    return next;
  }catch(error){
    return setCloudIdentityState({
      status:'signed_out',
      signedIn:false,
      user:null,
      lastError:error?.message||String(error)
    });
  }
}
async function registerCloudIdentityProvider(provider){
  swoleCatIdentityProvider=validateCloudIdentityProvider(provider);
  setCloudIdentityState({providerReady:true,lastError:''});
  return initializeCloudIdentity();
}
async function ensureCloudIdentityProvider(){
  if(swoleCatIdentityProvider)return swoleCatIdentityProvider;
  const loader=SwoleCatRuntime.getService('identityProviderLoader');
  if(!loader?.ensureReady)throw new Error('The Google sign-in adapter is not connected yet.');
  await loader.ensureReady();
  if(!swoleCatIdentityProvider)throw new Error('The Google sign-in adapter did not initialize.');
  return swoleCatIdentityProvider;
}
async function cloudSignInWithGoogle(){
  const config=cloudIdentityConfig();
  if(!config.configured)throw new Error('Cloud accounts are not configured in this build.');
  await ensureCloudIdentityProvider();
  setCloudIdentityState({status:'signing_in',lastError:''});
  try{
    const result=await swoleCatIdentityProvider.signInWithGoogle({
      config,
      authStorage:swoleCatCloudAuthStorage
    });
    if(result?.redirecting){
      return setCloudIdentityState({status:'redirecting',signedIn:false,user:null,lastError:''});
    }
    const user=cloudIdentityPublicUser(result?.user);
    if(!user)throw new Error('Google sign-in did not return a Swole Cat account.');
    return setCloudIdentityState({status:'signed_in',signedIn:true,user,lastError:''});
  }catch(error){
    setCloudIdentityState({
      status:'signed_out',
      signedIn:false,
      user:null,
      lastError:error?.message||String(error)
    });
    throw error;
  }
}
async function cloudReauthenticateWithGoogle(){
  const current=cloudIdentitySnapshot();
  if(!current.signedIn||!current.user?.id)throw new Error('Sign in before verifying your Google account.');
  await ensureCloudIdentityProvider();
  setCloudIdentityState({status:'reauthenticating',lastError:''});
  try{
    const result=await swoleCatIdentityProvider.reauthenticateWithGoogle({
      config:cloudIdentityConfig(),
      authStorage:swoleCatCloudAuthStorage,
      user:current.user
    });
    if(result?.redirecting)return cloudIdentitySnapshot();
    SwoleCatRuntime.events.dispatchEvent(new CustomEvent('identity:reauthenticated',{detail:{provider:'google'}}));
    return setCloudIdentityState({status:'signed_in',lastError:''});
  }catch(error){
    setCloudIdentityState({
      status:'signed_in',
      signedIn:true,
      user:current.user,
      lastError:error?.message||String(error)
    });
    throw error;
  }
}
async function cloudDeleteAccount(){
  const current=cloudIdentitySnapshot();
  if(!current.signedIn||!current.user?.id)throw new Error('No cloud account is signed in.');
  await ensureCloudIdentityProvider();
  setCloudIdentityState({status:'deleting_account',lastError:''});
  try{
    await swoleCatIdentityProvider.deleteAccount({
      config:cloudIdentityConfig(),
      authStorage:swoleCatCloudAuthStorage,
      user:current.user
    });
    return setCloudIdentityState({
      status:'signed_out',
      signedIn:false,
      user:null,
      lastError:''
    });
  }catch(error){
    setCloudIdentityState({
      status:'signed_in',
      signedIn:true,
      user:current.user,
      lastError:error?.message||String(error)
    });
    throw error;
  }
}
async function cloudSignOut(){
  if(swoleCatIdentityProvider){
    try{
      await swoleCatIdentityProvider.signOut({
        config:cloudIdentityConfig(),
        authStorage:swoleCatCloudAuthStorage
      });
    }catch(error){
      setCloudIdentityState({lastError:error?.message||String(error)});
      throw error;
    }
  }
  return setCloudIdentityState({
    status:cloudIdentityConfig().configured?'signed_out':'local_only',
    signedIn:false,
    user:null,
    lastError:''
  });
}
function cloudAccountAllowsRemoteFeatures(){
  return !!(cloudIdentityConfig().configured&&swoleCatIdentityState.signedIn&&swoleCatIdentityState.user?.id);
}

const swoleCatIdentityService=SwoleCatRuntime.registerService('identity',{
  snapshot:cloudIdentitySnapshot,
  initialize:initializeCloudIdentity,
  registerProvider:registerCloudIdentityProvider,
  signInWithGoogle:cloudSignInWithGoogle,
  reauthenticateWithGoogle:cloudReauthenticateWithGoogle,
  deleteAccount:cloudDeleteAccount,
  signOut:cloudSignOut,
  isSignedIn(){return cloudIdentitySnapshot().signedIn},
  canUseCloud(){return cloudAccountAllowsRemoteFeatures()},
  authStorage(){return swoleCatCloudAuthStorage}
});

function cloudSettingsHtml(){
  const info=cloudIdentitySnapshot();
  if(!info.configured){
    return '<div class="notice"><b>Local-only mode</b><br>No account is required. Nothing is being sent to Swole Cat cloud services from this build.</div>'+
      '<div class="actions"><button class="btn secondary" onclick="openCloudAccount()">Cloud account</button></div>';
  }
  if(info.signedIn){
    const label=info.user?.email||info.user?.displayName||'Signed in';
    return '<div class="notice"><b>Cloud account connected</b><br>'+esc(label)+'<br><br><span class="mini">Cloud backup is available. Multi-device sync is in Phase 8.3 testing and only sends training records when you explicitly choose Sync Now.</span></div>'+
      '<div class="actions"><button class="btn secondary" onclick="openCloudAccount()">Manage account</button></div>';
  }
  return '<div class="notice"><b>Cloud account available</b><br>Signing in enables private cloud backup and the Phase 8.3 manual sync test. Local workouts still work without an account or network.</div>'+
    '<div class="actions"><button class="btn secondary" onclick="openCloudAccount()">Cloud account</button></div>';
}
function openCloudAccount(){
  const info=cloudIdentitySnapshot();
  if(!info.configured){
    openModal('Swole Cat Cloud','<div class="notice"><b>Local-only mode is active.</b><br><br>This build has no cloud backend configured, so Swole Cat creates no account metadata, makes no cloud requests, and keeps all workout data on this device.</div><div class="actions"><button class="btn secondary" onclick="closeModal()">Done</button></div>');
    return;
  }
  if(info.signedIn){
    const label=info.user?.email||info.user?.displayName||'Swole Cat account';
    openModal('Swole Cat Cloud','<div class="notice"><b>'+esc(label)+'</b><br><br>Account connection is active. Private backup is available, and Phase 8.3 record-level sync runs only when you explicitly choose Sync Now during testing.<br><br><span class="mini">Account recovery and identity verification use your Google account. Swole Cat does not have a separate password.</span></div><div class="actions"><button class="btn secondary" onclick="cloudSignOutFromUi()">Sign out</button><button class="btn danger" onclick="cloudBeginDeleteAccountFromUi()">Delete cloud account</button><button class="btn secondary" onclick="closeModal()">Done</button></div>');
    return;
  }
  const providerNote=info.providerReady
    ?'Google sign-in is ready.'
    :(isNativeApp()
      ?'Google sign-in will open in the system browser and return directly to Swole Cat.'
      :'Google sign-in will load only when you choose to continue.');
  openModal('Swole Cat Cloud','<div class="notice"><b>Optional account</b><br><br>'+esc(providerNote)+'<br><br>Creating an account will not upload workout data in this phase. Cloud backup and sync are separate opt-in capabilities that come later.<br><br><span class="mini">Returning user? Choose the same Google account to recover access. There is no separate Swole Cat password.</span></div><div class="actions"><button class="btn" onclick="cloudSignInWithGoogleFromUi()">Continue with Google</button><button class="btn secondary" onclick="closeModal()">Stay local-only</button></div>');
}
async function cloudSignInWithGoogleFromUi(){
  try{
    const result=await cloudSignInWithGoogle();
    if(result?.status==='redirecting')return;
    closeModal();
    showToast('Cloud account connected');
    openCloudAccount();
  }catch(error){
    alert('Could not sign in: '+(error?.message||error));
  }
}
function cloudBeginDeleteAccountFromUi(){
  const info=cloudIdentitySnapshot();
  if(!info.signedIn)return openCloudAccount();
  openModal('Delete cloud account?','<div class="notice"><b>This permanently deletes your Swole Cat cloud identity.</b><br><br>Your workouts, routines, history, settings, and other local training data on this device will stay exactly where they are.<br><br>Cloud backup and sync are not active yet, so Phase 8.1 has no workout data stored in the cloud.<br><br><span class="mini">To prevent an accidental deletion, verify the same Google account first.</span></div><div class="actions"><button class="btn danger" onclick="cloudReauthenticateForDeletionFromUi()">Verify with Google</button><button class="btn secondary" onclick="openCloudAccount()">Cancel</button></div>');
}
async function cloudReauthenticateForDeletionFromUi(){
  try{
    const result=await cloudReauthenticateWithGoogle();
    if(result?.status==='reauthenticating')return;
  }catch(error){
    alert('Could not verify your Google account: '+(error?.message||error));
  }
}
function openCloudDeleteFinalConfirmation(){
  const info=cloudIdentitySnapshot();
  if(!info.signedIn)return;
  openModal('Delete cloud account','<div class="notice"><b>Google verification complete.</b><br><br>Deleting the cloud account is permanent. Your local Swole Cat workout data will remain on this device and can still be used without an account.</div><div class="actions"><button class="btn danger" onclick="cloudDeleteAccountFromUi()">Permanently delete cloud account</button><button class="btn secondary" onclick="openCloudAccount()">Cancel</button></div>');
}
async function cloudDeleteAccountFromUi(){
  try{
    await cloudDeleteAccount();
    closeModal();
    showToast('Cloud account deleted · local data kept');
  }catch(error){
    alert('Could not delete cloud account: '+(error?.message||error));
  }
}
async function cloudSignOutFromUi(){
  try{
    await cloudSignOut();
    closeModal();
    showToast('Signed out · local data kept');
  }catch(error){
    alert('Could not sign out: '+(error?.message||error));
  }
}

SwoleCatRuntime.events.addEventListener('identity:reauthenticated',()=>openCloudDeleteFinalConfirmation());
SwoleCatRuntime.events.addEventListener('identity:reauthentication_failed',event=>{
  const message=event?.detail?.message||'Google verification was not completed.';
  try{alert('Could not verify your Google account: '+message)}catch(error){}
});
SwoleCatRuntime.events.addEventListener('app:ready',()=>{initializeCloudIdentity()},{once:true});
