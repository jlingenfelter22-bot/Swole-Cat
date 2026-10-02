// v0.67.1 real Supabase Auth provider for the optional account shell.
// Supabase JS is pinned and lazy-loaded only when auth is actually needed.
const SWOLE_CAT_SUPABASE_JS_VERSION='2.117.2';
const SWOLE_CAT_SUPABASE_JS_URL='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@'+SWOLE_CAT_SUPABASE_JS_VERSION;
const SWOLE_CAT_SUPABASE_STORAGE_KEY='swolecat-auth-session-v1';
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
  if(isNativeApp())throw new Error('Android Google sign-in is not enabled in this lab build yet. Use the Swole Cat PWA for account testing.');
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
      detectSessionInUrl:true,
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
    const {data,error}=await client.auth.signInWithOAuth({
      provider:'google',
      options:{
        redirectTo:swoleCatWebAuthRedirectUrl(),
        scopes:'openid email profile'
      }
    });
    if(error)throw error;
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

SwoleCatRuntime.events.addEventListener('app:ready',()=>{
  const config=SwoleCatRuntime.getService('cloudConfig')?.read?.();
  const authStorage=SwoleCatRuntime.getService('identity')?.authStorage?.();
  if(!config?.configured||isNativeApp()||!authStorage?.hasAny?.())return;
  ensureSupabaseIdentityProviderReady().catch(error=>{
    console.warn('Swole Cat cloud session restore unavailable:',error?.message||error);
  });
},{once:true});
