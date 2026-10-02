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

const swoleCatCloudAuthStorage=SwoleCatRuntime.registerService('cloudAuthStorage',{
  async getItem(key){
    return swoleCatStorage.getItem(SWOLE_CAT_CLOUD_AUTH_PREFIX+String(key||''));
  },
  async setItem(key,value){
    if(value==null)return this.removeItem(key);
    swoleCatStorage.setItem(SWOLE_CAT_CLOUD_AUTH_PREFIX+String(key||''),String(value));
  },
  async removeItem(key){
    swoleCatStorage.removeItem(SWOLE_CAT_CLOUD_AUTH_PREFIX+String(key||''));
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
  for(const name of ['restoreSession','signInWithGoogle','signOut']){
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
    return setCloudIdentityState({
      status:user?'signed_in':'signed_out',
      signedIn:!!user,
      user,
      lastError:''
    });
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
async function cloudSignInWithGoogle(){
  const config=cloudIdentityConfig();
  if(!config.configured)throw new Error('Cloud accounts are not configured in this build.');
  if(!swoleCatIdentityProvider)throw new Error('The Google sign-in adapter is not connected yet.');
  setCloudIdentityState({status:'signing_in',lastError:''});
  try{
    const result=await swoleCatIdentityProvider.signInWithGoogle({
      config,
      authStorage:swoleCatCloudAuthStorage
    });
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
    return '<div class="notice"><b>Cloud account connected</b><br>'+esc(label)+'<br><br><span class="mini">Workout sync is intentionally OFF in this phase. Signing in does not upload routines, sessions, sets, Coach data, or analytics.</span></div>'+
      '<div class="actions"><button class="btn secondary" onclick="openCloudAccount()">Manage account</button></div>';
  }
  return '<div class="notice"><b>Cloud account available</b><br>Signing in enables the account shell only. Workout data remains local until a later cloud feature is explicitly implemented.</div>'+
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
    openModal('Swole Cat Cloud','<div class="notice"><b>'+esc(label)+'</b><br><br>Account connection is active. Workout backup and multi-device sync are not enabled in Phase 8.1, so your training data is still local-only.</div><div class="actions"><button class="btn secondary" onclick="cloudSignOutFromUi()">Sign out</button><button class="btn secondary" onclick="closeModal()">Done</button></div>');
    return;
  }
  const providerNote=info.providerReady
    ?'Google sign-in is ready for this configured cloud environment.'
    :'The cloud shell is configured, but the Google sign-in adapter has not been connected in this build yet.';
  openModal('Swole Cat Cloud','<div class="notice"><b>Optional account</b><br><br>'+esc(providerNote)+'<br><br>Creating an account will not upload workout data in this phase. Cloud backup and sync are separate opt-in capabilities that come later.</div><div class="actions"><button class="btn" '+(info.providerReady?'':'disabled')+' onclick="cloudSignInWithGoogleFromUi()">Continue with Google</button><button class="btn secondary" onclick="closeModal()">Stay local-only</button></div>');
}
async function cloudSignInWithGoogleFromUi(){
  try{
    await cloudSignInWithGoogle();
    closeModal();
    showToast('Cloud account connected');
    openCloudAccount();
  }catch(error){
    alert('Could not sign in: '+(error?.message||error));
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

SwoleCatRuntime.events.addEventListener('app:ready',()=>{initializeCloudIdentity()},{once:true});
