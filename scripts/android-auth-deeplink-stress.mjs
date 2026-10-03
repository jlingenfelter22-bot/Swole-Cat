import fs from 'node:fs';
import assert from 'node:assert/strict';

const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const provider=fs.readFileSync('src/js/10c-supabase-auth-provider.js','utf8');
const configure=fs.readFileSync('scripts/configure-android.mjs','utf8');
const capacitor=JSON.parse(fs.readFileSync('capacitor.config.json','utf8'));

assert.equal(pkg.version,'0.67.2');
assert.equal(pkg.swoleCat.androidVersionCode,85);
assert.equal(pkg.dependencies['@capacitor/browser'],'8.0.5','Android OAuth should use the pinned official Browser plugin');
assert.equal(capacitor.appId,'com.jlingenfelter.swolecat');

assert.match(provider,/com\.jlingenfelter\.swolecat:\/\/auth\/callback/);
assert.match(provider,/skipBrowserRedirect:true/);
assert.match(provider,/exchangeCodeForSession\(code\)/);
assert.match(provider,/addListener\?\.\('appUrlOpen'/);
assert.match(provider,/getLaunchUrl\?\.\(\)/);
assert.match(provider,/capacitorPlugin\('Browser'\)/);
assert.match(provider,/scope:'local'/,'sign-out must remain device-local');
assert.match(provider,/detectSessionInUrl:!isNativeApp\(\)/);

assert.match(configure,/ANDROID_AUTH_SCHEME='com\.jlingenfelter\.swolecat'/);
assert.match(configure,/ANDROID_AUTH_HOST='auth'/);
assert.match(configure,/ANDROID_AUTH_PATH='\/callback'/);
assert.match(configure,/android\.intent\.action\.VIEW/);
assert.match(configure,/android\.intent\.category\.BROWSABLE/);
assert.match(configure,/android:pathPrefix=/);

console.log('Swole Cat v0.67.2 Android OAuth deep-link contract PASS');
