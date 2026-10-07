import fs from 'node:fs';
import assert from 'node:assert/strict';

const cap=JSON.parse(fs.readFileSync('capacitor.config.json','utf8'));
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const updater=fs.readFileSync('src/js/09a-app-updater.js','utf8');
const configure=fs.readFileSync('scripts/configure-android.mjs','utf8');
const release=fs.readFileSync('.github/workflows/release-android.yml','utf8');
const beta=JSON.parse(fs.readFileSync('updates/beta.json','utf8'));

assert.equal(pkg.version,'0.73.1');
assert.equal(pkg.swoleCat.androidVersionCode,104);
assert.equal(cap.appId,'com.jlingenfelter.swolecat','Beta package must use the production Swole Cat application ID');
assert.equal(cap.appName,'Swole Cat','Beta app must not display the Testing name');

assert.match(updater,/testing:'https:\/\/raw\.githubusercontent\.com\/jlingenfelter22-bot\/Swole-Cat\/main\/updates\/testing\.json'/,'shared updater must retain Testing feed');
assert.match(updater,/beta:'https:\/\/raw\.githubusercontent\.com\/jlingenfelter22-bot\/Swole-Cat\/beta\/updates\/beta\.json'/,'shared updater must define Beta feed');
assert.match(updater,/appUpdaterState\.native\?\.channel==='beta'\?'beta':'testing'/,'feed selection must follow the native package channel');

assert.match(configure,/capacitorConfig\.appId/,'Android auth scheme must derive from package identity');
assert.doesNotMatch(configure,/const ANDROID_AUTH_SCHEME='com\.jlingenfelter\.swolecat\.testing'/,'Beta-capable generator must not hardcode Testing auth scheme');

assert.equal(beta.schema,1);
assert.equal(beta.channel,'beta');
assert.equal(beta.packageId,'com.jlingenfelter.swolecat');
assert.equal(beta.version,'0.73.1');
assert.equal(beta.versionCode,104);
assert.equal(beta.enabled,false,'promotion branch must keep Beta feed disabled until signed build succeeds');
assert.equal(beta.apkUrl,'');
assert.equal(beta.sha256,'');

assert.match(release,/branches: \[beta\]/,'Beta signed workflow must only auto-run on beta');
assert.match(release,/test "\$GITHUB_REF_NAME" = "beta"/,'workflow must fail closed outside beta');
assert.match(release,/contents: write/,'Beta publisher needs release and manifest write permission');
assert.match(release,/com\.jlingenfelter\.swolecat/,'workflow must verify production package identity');
assert.match(release,/Swole Cat<\/string>/,'workflow must verify production app name');
assert.match(release,/android:scheme="com\.jlingenfelter\.swolecat"/,'workflow must verify production OAuth redirect');
assert.match(release,/REQUEST_INSTALL_PACKAGES/,'Beta baseline must include updater install capability');
assert.match(release,/PackageInstaller\.SessionParams\.USER_ACTION_REQUIRED/,'Beta updater must preserve explicit Android user approval');
assert.match(release,/apksigner.*--print-certs/,'workflow must inspect the actual Beta signing certificate');
assert.match(release,/sha256sum/,'workflow must hash the Beta APK');
assert.match(release,/beta-v\$VERSION/,'Beta release tags must be isolated from Testing releases');
assert.match(release,/updates\/beta\.json/,'successful workflow must advance only the Beta manifest');
assert.doesNotMatch(release,/updates\/testing\.json/,'Beta release workflow must never advance Testing feed');

console.log('Swole Cat Beta baseline PASS: production identity, channel-aware updater, disabled pre-release feed, signed release verification, and Beta-only publication');
