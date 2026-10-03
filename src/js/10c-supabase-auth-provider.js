// v0.67.1 real Supabase Auth provider for the optional account shell.
// Supabase JS is pinned and lazy-loaded only when auth is actually needed.
const SWOLE_CAT_SUPABASE_JS_VERSION='2.117.2';
const SWOLE_CAT_SUPABASE_JS_URL='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@'+SWOLE_CAT_SUPABASE_JS_VERSION;
const SWOLE_CAT_SUPABASE_STORAGE_KEY='swolecat-auth-session-v1';
const SWOLE_CAT_ANDROID_AUTH_REDIRECT='com.jlingenfelter.swolecat://auth/callback';
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

function swoleCatWebAuthRedirectUrl(){
  const url=new URL(window.location.href);
  url.search='';
  url.hash='';
  if(url.pathname.endsWith('/index.html'))url.pathname=url.pathname.slice(0,-'index.html'.length);
  return url.toString();
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
  async restoreSession(){
    const client=await getSwoleCatSupabaseClient();
    const {data,error}=await client.auth.getSession();
    if(error)throw error;
    return {user:data?.session?.user||null};
  },
  async signInWithGoogle(){
    const client=await getSwoleCatSupabaseClient();
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
  async signOut(){
    const client=await getSwoleCatSupabaseClient();
    const {error}=await client.auth.signOut({scope:'local'});
    if(error)throw error;
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
    return url.protocol==='com.jlingenfelter.swolecat:' &&
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
    const {error}=await client.auth.exchangeCodeForSession(code);
    if(error)throw error;

    try{await capacitorPlugin('Browser')?.close?.()}catch(error){}
    await initializeCloudIdentity();
    try{closeModal()}catch(error){}
    try{showToast('Cloud account connected')}catch(error){}
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
  if(!authStorage?.hasAny?.())return;
  ensureSupabaseIdentityProviderReady().catch(error=>{
    console.warn('Swole Cat cloud session restore unavailable:',error?.message||error);
  });
},{once:true});
