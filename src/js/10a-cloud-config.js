// Phase 8.1 cloud configuration boundary.
// Empty build values keep Swole Cat fully local-only with zero cloud traffic.
const SWOLE_CAT_CLOUD_BUILD_URL='https://tpdmcuhsvmffpycgwhqb.supabase.co';
const SWOLE_CAT_CLOUD_BUILD_KEY='sb_publishable_w8TRfiOqkBAHM8lXTBw1tQ_Crfrh8iO';
const SWOLE_CAT_GOOGLE_BUILD_CLIENT_ID='__SWOLE_CAT_GOOGLE_WEB_CLIENT_ID__';

function normalizeCloudConfigValue(value){
  const text=String(value||'').trim();
  if(!text||/^__SWOLE_CAT_[A-Z0-9_]+__$/.test(text))return '';
  return text;
}
function resolveSwoleCatCloudConfig(){
  const runtime=isPlainObject(window.SWOLE_CAT_CLOUD_CONFIG)?window.SWOLE_CAT_CLOUD_CONFIG:{};
  const supabaseUrl=normalizeCloudConfigValue(runtime.supabaseUrl||SWOLE_CAT_CLOUD_BUILD_URL);
  const supabasePublishableKey=normalizeCloudConfigValue(runtime.supabasePublishableKey||SWOLE_CAT_CLOUD_BUILD_KEY);
  const googleWebClientId=normalizeCloudConfigValue(runtime.googleWebClientId||SWOLE_CAT_GOOGLE_BUILD_CLIENT_ID);
  return Object.freeze({
    provider:'supabase',
    supabaseUrl,
    supabasePublishableKey,
    googleWebClientId,
    configured:!!(supabaseUrl&&supabasePublishableKey)
  });
}
const swoleCatCloudConfig=resolveSwoleCatCloudConfig();
SwoleCatRuntime.registerService('cloudConfig',{
  read(){return {...swoleCatCloudConfig}},
  configured(){return swoleCatCloudConfig.configured},
  provider(){return swoleCatCloudConfig.provider}
});
