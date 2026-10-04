// v0.67.4 Supabase Auth provider for the optional account shell.
// Supabase JS is pinned and lazy-loaded only when auth is actually needed.
const SWOLE_CAT_SUPABASE_JS_VERSION='2.117.2';
const SWOLE_CAT_SUPABASE_JS_URL='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@'+SWOLE_CAT_SUPABASE_JS_VERSION;
const SWOLE_CAT_SUPABASE_STORAGE_KEY='swolecat-auth-session-v1';
const SWOLE_CAT_CLOUD_REAUTH_PENDING_KEY='swolecat-reauth-pending-v1';
const SWOLE_CAT_CLOUD_REAUTH_VERIFIED_KEY='swolecat-reauth-verified-v1';
const SWOLE_CAT_CLOUD_REAUTH_MAX_AGE_MS=10*60*1000;
const SWOLE_CAT_ANDROID_AUTH_REDIRECT='com.jlingenfelter.swolecat.testing://auth/callback';
let swoleCatSupabaseLoadPromise=null;
let swoleCatSupabaseClient=null;
let swoleCatSupabaseProviderRegistered=false;

function loadPinnedSupabaseJs(){
  if(window.supabase?.createClient)return Promise.resolve(window.supabase);
  if(swoleCatSupabaseLoadPromise)return swoleCatSupabaseLoadPromise;
  swoleCatSupabaseLoadPromise=new Promise((resolve,reject)=>{
    const existing=document.querySelector('script[data-swolecat-supabase]');
    if(existing){
      existing.addEventListener('load',()=>window.supabase?.createClient?resolve(window.supabase):reject(new Error('Supabase Auth library did not initialize.')),{once:true});
      existing.addEventListener('error',()=>reject(new Error('Could not load the Supabase Auth library.')),{once:true});
      return;
    }
    const script=document.createElement('script');
    script.src=SWOLE_CAT_SUPABASE_JS_URL;
    script.async=true;
    script.crossOrigin='anonymous';
    script.referrerPolicy='no-referrer';
    script.dataset.swolecatSupabase=SWOLE_CAT_SUPABASE_JS_VERSION;
    script.onload=()=>window.supabase?.createClient?resolve(window.supabase):reject(new Error('Supabase Auth library did not initialize.'));
    script.onerror=()=>reject(new Error('Could not load the Supabase Auth library.'));
    document.head.appendChild(script);
  });
  return swoleCatSupabaseLoadPromise;
}

function swoleCatWebAuthRedirectUrl({reauth=false}={}){
  const url=new URL(window.location.href);
  url.search='';
  url.hash='';
  if(url.pathname.endsWith('/index.html'))url.pathname=url.pathname.slice(0,-'index.html'.length);
  if(reauth)url.searchParams.set('swolecat_reauth','1');
  return url.toString();
}
function isSwoleCatWebReauthReturn(){
  if(isNativeApp())return false;
  try{return new URL(window.location.href).searchParams.get('swolecat_reauth')==='1'}catch(error){return false}
}
function clearSwoleCatWebAuthReturnParams(){
  if(isNativeApp())return;
  try{
    const url=new URL(window.location.href);
    for(const key of ['swolecat_reauth','code','error','error_code','error_description'])url.searchParams.delete(key);
    window.history.replaceState(window.history.state,'',url.toString());
  }catch(error){}
}

function parseSwoleCatAuthJson(raw){
  try{return JSON.parse(String(raw||''))}catch(error){return null}
}
async function clearSwoleCatReauth(authStorage){
  await authStorage?.removeItem?.(SWOLE_CAT_CLOUD_REAUTH_PENDING_KEY);
  await authStorage?.removeItem?.(SWOLE_CAT_CLOUD_REAUTH_VERIFIED_KEY);
}
async function finishPendingSwoleCatReauth(client,authStorage,user){
  const raw=await authStorage?.getItem?.(SWOLE_CAT_CLOUD_REAUTH_PENDING_KEY);
  if(!raw)return false;
  const pending=parseSwoleCatAuthJson(raw);
  const startedAt=Number(pending?.startedAt||0);
  const stale=!startedAt||Date.now()-startedAt>15*60*1000;
  if(stale){
    await clearSwoleCatReauth(authStorage);
    return false;
  }
  if(!user?.id||String(user.id)!==String(pending?.userId||'')){
    await clearSwoleCatReauth(authStorage);
    try{await client.auth.signOut({scope:'local'})}catch(error){}
    throw new Error('That Google account does not match the Swole Cat account you are trying to verify.');
  }
  await authStorage.setItem(SWOLE_CAT_CLOUD_REAUTH_VERIFIED_KEY,JSON.stringify({
    userId:String(user.id),
    verifiedAt:Date.now()
  }));
  await authStorage.removeItem(SWOLE_CAT_CLOUD_REAUTH_PENDING_KEY);
  return true;
}
async function requireFreshSwoleCatReauth(client,authStorage){
  const {data,error}=await client.auth.getSession();
  if(error)throw error;
  const user=data?.session?.user;
  if(!user?.id)throw new Error('Your cloud session is no longer available. Sign in again.');
  const verified=parseSwoleCatAuthJson(await authStorage?.getItem?.(SWOLE_CAT_CLOUD_REAUTH_VERIFIED_KEY));
  const age=Date.now()-Number(verified?.verifiedAt||0);
  if(String(verified?.userId||'')!==String(user.id)||age<0||age>SWOLE_CAT_CLOUD_REAUTH_MAX_AGE_MS){
    throw new Error('Verify your Google account again before deleting the cloud account.');
  }
  return user;
}

async function getSwoleCatSupabaseClient(){
  if(swoleCatSupabaseClient)return swoleCatSupabaseClient;
  const config=SwoleCatRuntime.getService('cloudConfig')?.read?.();
  if(!config?.configured)throw new Error('Swole Cat Cloud is not configured.');
  const sdk=await loadPinnedSupabaseJs();
  const authStorage=SwoleCatRuntime.getService('identity')?.authStorage?.();
  if(!authStorage)throw new Error('Swole Cat auth storage is unavailable.');
  swoleCatSupabaseClient=sdk.createClient(config.supabaseUrl,config.supabasePublishableKey,{
    auth:{
      storage:authStorage,
      storageKey:SWOLE_CAT_SUPABASE_STORAGE_KEY,
      persistSession:true,
      autoRefreshToken:true,
      detectSessionInUrl:!isNativeApp(),
      flowType:'pkce'
    }
  });
  return swoleCatSupabaseClient;
}

const swoleCatSupabaseIdentityProvider={
  async restoreSession({authStorage}){
    const client=await getSwoleCatSupabaseClient();
    const {data,error}=await client.auth.getSession();
    if(error)throw error;
    const user=data?.session?.user||null;
    let reauthenticated=false;
    if(user&&isSwoleCatWebReauthReturn()){
      reauthenticated=await finishPendingSwoleCatReauth(client,authStorage,user);
      clearSwoleCatWebAuthReturnParams();
    }
    return {user,reauthenticated};
  },
  async signInWithGoogle({authStorage}){
    const client=await getSwoleCatSupabaseClient();
    await clearSwoleCatReauth(authStorage);
    const native=isNativeApp();
    const {data,error}=await client.auth.signInWithOAuth({
      provider:'google',
      options:{
        redirectTo:native?SWOLE_CAT_ANDROID_AUTH_REDIRECT:swoleCatWebAuthRedirectUrl(),
        scopes:'openid email profile',
        ...(native?{skipBrowserRedirect:true}:{})
      }
    });
    if(error)throw error;
    if(native){
      if(!data?.url)throw new Error('Supabase did not return a Google sign-in URL.');
      const browser=capacitorPlugin('Browser');
      if(!browser?.open)throw new Error('Android browser handoff is unavailable.');
      await browser.open({url:data.url});
      return {redirecting:true,user:null};
    }
    return {redirecting:!!data?.url,user:null};
  },
  async reauthenticateWithGoogle({authStorage,user}){
    const client=await getSwoleCatSupabaseClient();
    const {data:sessionData,error:sessionError}=await client.auth.getSession();
    if(sessionError)throw sessionError;
    const currentUser=sessionData?.session?.user;
    if(!currentUser?.id||String(currentUser.id)!==String(user?.id||'')){
      throw new Error('Your cloud session changed. Sign in again before verifying.');
    }
    await authStorage.setItem(SWOLE_CAT_CLOUD_REAUTH_PENDING_KEY,JSON.stringify({
      userId:String(currentUser.id),
      startedAt:Date.now()
    }));
    await authStorage.removeItem(SWOLE_CAT_CLOUD_REAUTH_VERIFIED_KEY);
    const native=isNativeApp();
    const {data,error}=await client.auth.signInWithOAuth({
      provider:'google',
      options:{
        redirectTo:native?SWOLE_CAT_ANDROID_AUTH_REDIRECT:swoleCatWebAuthRedirectUrl({reauth:true}),
        scopes:'openid email profile',
        queryParams:{prompt:'select_account'},
        ...(native?{skipBrowserRedirect:true}:{})
      }
    });
    if(error){
      await authStorage.removeItem(SWOLE_CAT_CLOUD_REAUTH_PENDING_KEY);
      throw error;
    }
    if(native){
      if(!data?.url)throw new Error('Supabase did not return a Google verification URL.');
      const browser=capacitorPlugin('Browser');
      if(!browser?.open)throw new Error('Android browser handoff is unavailable.');
      await browser.open({url:data.url});
      return {redirecting:true};
    }
    return {redirecting:!!data?.url};
  },
  async deleteAccount({authStorage}){
    const client=await getSwoleCatSupabaseClient();
    await requireFreshSwoleCatReauth(client,authStorage);
    const {data,error}=await client.functions.invoke('delete-account',{body:{confirm:true}});
    if(error)throw new Error(error?.message||'Could not delete the cloud account.');
    if(!data?.ok)throw new Error(data?.error||'Could not delete the cloud account.');
    try{await client.auth.signOut({scope:'local'})}catch(error){}
    await authStorage.removeItem(SWOLE_CAT_SUPABASE_STORAGE_KEY);
    await clearSwoleCatReauth(authStorage);
    return {ok:true};
  },
  async signOut({authStorage}){
    const client=await getSwoleCatSupabaseClient();
    const {error}=await client.auth.signOut({scope:'local'});
    if(error)throw error;
    await clearSwoleCatReauth(authStorage);
    return {ok:true};
  }
};

async function ensureSupabaseIdentityProviderReady(){
  if(swoleCatSupabaseProviderRegistered)return true;
  await loadPinnedSupabaseJs();
  await SwoleCatRuntime.getService('identity')?.registerProvider?.(swoleCatSupabaseIdentityProvider);
  swoleCatSupabaseProviderRegistered=true;
  return true;
}

SwoleCatRuntime.registerService('identityProviderLoader',{
  ensureReady:ensureSupabaseIdentityProviderReady,
  provider:'supabase',
  sdkVersion:SWOLE_CAT_SUPABASE_JS_VERSION
});

function isSwoleCatAndroidAuthUrl(rawUrl){
  try{
    const url=new URL(String(rawUrl||''));
    return url.protocol==='com.jlingenfelter.swolecat.testing:' &&
      url.hostname==='auth' &&
      (url.pathname==='/callback'||url.pathname.startsWith('/callback/'));
  }catch(error){
    return false;
  }
}
async function finishSwoleCatAndroidAuth(rawUrl){
  if(!isNativeApp()||!isSwoleCatAndroidAuthUrl(rawUrl))return false;
  try{
    const url=new URL(rawUrl);
    const providerError=url.searchParams.get('error_description')||url.searchParams.get('error');
    if(providerError)throw new Error(providerError);
    const code=url.searchParams.get('code');
    if(!code)throw new Error('Google sign-in returned without an authorization code.');

    await ensureSupabaseIdentityProviderReady();
    const client=await getSwoleCatSupabaseClient();
    const authStorage=SwoleCatRuntime.getService('identity')?.authStorage?.();
    const hadPendingReauth=!!(await authStorage?.getItem?.(SWOLE_CAT_CLOUD_REAUTH_PENDING_KEY));
    const {data,error}=await client.auth.exchangeCodeForSession(code);
    if(error)throw error;
    const reauthenticated=hadPendingReauth
      ?await finishPendingSwoleCatReauth(client,authStorage,data?.session?.user||null)
      :false;

    try{await capacitorPlugin('Browser')?.close?.()}catch(error){}
    try{closeModal()}catch(error){}
    const state=await initializeCloudIdentity();
    if(!state?.signedIn)throw new Error(state?.lastError||'Google sign-in could not be completed.');
    if(reauthenticated){
      SwoleCatRuntime.events.dispatchEvent(new CustomEvent('identity:reauthenticated',{detail:{provider:'google'}}));
    }
    try{showToast(reauthenticated?'Google verification complete':'Cloud account connected')}catch(error){}
    return true;
  }catch(error){
    try{await capacitorPlugin('Browser')?.close?.()}catch(closeError){}
    setCloudIdentityState({
      status:'signed_out',
      signedIn:false,
      user:null,
      lastError:error?.message||String(error)
    });
    try{alert('Could not finish Google sign-in: '+(error?.message||error))}catch(alertError){}
    return false;
  }
}
let swoleCatAndroidAuthListenersInstalled=false;
function installSwoleCatAndroidAuthHandlers(){
  if(swoleCatAndroidAuthListenersInstalled||!isNativeApp())return;
  swoleCatAndroidAuthListenersInstalled=true;
  const app=capacitorPlugin('App');
  if(!app)return;
  try{
    app.addListener?.('appUrlOpen',event=>{
      if(event?.url)finishSwoleCatAndroidAuth(event.url);
    });
  }catch(error){}
  try{
    Promise.resolve(app.getLaunchUrl?.()).then(result=>{
      if(result?.url)finishSwoleCatAndroidAuth(result.url);
    }).catch(()=>{});
  }catch(error){}
}

SwoleCatRuntime.events.addEventListener('app:ready',()=>{
  const config=SwoleCatRuntime.getService('cloudConfig')?.read?.();
  const authStorage=SwoleCatRuntime.getService('identity')?.authStorage?.();
  if(!config?.configured)return;
  if(isNativeApp())installSwoleCatAndroidAuthHandlers();
  const hasAuth=typeof authStorage?.hasAnyAsync==='function'
    ?authStorage.hasAnyAsync()
    :Promise.resolve(!!authStorage?.hasAny?.());
  Promise.resolve(hasAuth).then(found=>{
    if(!found)return;
    return ensureSupabaseIdentityProviderReady();
  }).catch(error=>{
    console.warn('Swole Cat cloud session restore unavailable:',error?.message||error);
  });
},{once:true});
