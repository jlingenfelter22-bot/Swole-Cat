import fs from 'node:fs';
import assert from 'node:assert/strict';

const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const identity=fs.readFileSync('src/js/10b-cloud-identity.js','utf8');
const provider=fs.readFileSync('src/js/10c-supabase-auth-provider.js','utf8');
const configure=fs.readFileSync('scripts/configure-android.mjs','utf8');

assert.equal(pkg.version,'0.69.0');
assert.equal(pkg.swoleCat.androidVersionCode,91);

assert.match(identity,/capacitorPlugin\('SwoleCatSecureStorage'\)/);
assert.match(identity,/android_keystore/);
assert.match(identity,/migrateLegacyCloudAuthItem/);
assert.match(identity,/Secure auth migration verification failed/);
assert.match(identity,/swoleCatStorage\.removeItem\(legacyKey\)/);
assert.match(identity,/hasAnyAsync/);
assert.doesNotMatch(identity,/overload_v3/,'auth storage module must not couple migration to workout state');

assert.match(provider,/authStorage\.hasAnyAsync/);
assert.match(configure,/@CapacitorPlugin\(name = "SwoleCatSecureStorage"\)/);
assert.match(configure,/AndroidKeyStore/);
assert.match(configure,/AES\/GCM\/NoPadding/);
assert.match(configure,/KeyGenParameterSpec/);
assert.match(configure,/BLOCK_MODE_GCM/);
assert.match(configure,/ENCRYPTION_PADDING_NONE/);
assert.match(configure,/setKeySize\(256\)/);
assert.match(configure,/registerPlugin\(SwoleCatSecureStoragePlugin\.class\);/);
assert.match(configure,/registerPlugin\(SwoleCatSecureStoragePlugin\.class\);\\n        super\.onCreate/);
assert.match(configure,/swole_cat_secure_auth_v1/);
assert.match(configure,/encoded\.split\("\\\\\\\\.", 2\)/,'generator must emit a Java-safe escaped dot regex');

console.log('Swole Cat v0.69.0 Android Keystore auth storage contract PASS');
