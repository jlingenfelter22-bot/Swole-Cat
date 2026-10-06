import fs from 'node:fs';
import assert from 'node:assert/strict';

const updater=fs.readFileSync('src/js/09a-app-updater.js','utf8');
const settings=fs.readFileSync('src/js/09-settings-ui-bootstrap.js','utf8');
const build=fs.readFileSync('scripts/build-web.mjs','utf8');
const configure=fs.readFileSync('scripts/configure-android.mjs','utf8');
const plugin=fs.readFileSync('scripts/android/SwoleCatUpdaterPlugin.java.template','utf8');
const receiver=fs.readFileSync('scripts/android/SwoleCatUpdateReceiver.java.template','utf8');
const workflow=fs.readFileSync('.github/workflows/android.yml','utf8');
const manifest=JSON.parse(fs.readFileSync('updates/testing.json','utf8'));
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));

new Function(updater);

assert.equal(pkg.version,'0.73.1');
assert.equal(pkg.swoleCat.androidVersionCode,104);

assert.match(build,/src\/js\/09a-app-updater\.js/,'web build should include updater module');
assert.match(settings,/App & updates/,'Settings should expose App & updates');
assert.match(settings,/appUpdateHubHtml\(\)/,'Settings should render updater tile');
assert.match(settings,/maybeCheckForAppUpdate\(\)/,'app ready should schedule a passive update check');

assert.match(updater,/updates\/testing\.json/,'Testing app should use the Testing update manifest');
assert.match(updater,/Finish or cancel your active workout before downloading an app update/,'downloads must be blocked during active workouts');
assert.match(updater,/Finish or cancel your active workout before installing an app update/,'installs must be blocked during active workouts');
assert.match(updater,/Download & verify update/,'user must explicitly start update download');
assert.match(updater,/Install update/,'user must explicitly start install handoff');
assert.match(updater,/Updates are never installed silently/,'UI must state the Android approval model');
assert.match(updater,/SwoleCatRuntime\.registerService\('appUpdater'/,'updater should live behind a runtime service boundary');

assert.match(configure,/SwoleCatUpdaterPlugin\.java\.template/,'Android generation should copy updater plugin');
assert.match(configure,/SwoleCatUpdateReceiver\.java\.template/,'Android generation should copy install receiver');
assert.match(configure,/android\.permission\.REQUEST_INSTALL_PACKAGES/,'generated Android app should request installer capability');
assert.match(configure,/registerPlugin\(SwoleCatUpdaterPlugin\.class\)/,'native updater must be registered with Capacitor');

assert.match(plugin,/@CapacitorPlugin\(name = "SwoleCatUpdater"\)/);
assert.match(plugin,/PackageInstaller\.SessionParams\.USER_ACTION_REQUIRED/,'Android 12+ installs must explicitly require user action');
assert.match(plugin,/canRequestPackageInstalls\(\)/,'updater should respect Android unknown-source approval');
assert.match(plugin,/ACTION_MANAGE_UNKNOWN_APP_SOURCES/,'updater should route user to Android settings when approval is required');
assert.match(plugin,/Downloaded APK failed SHA-256 verification/,'APK hash must be verified');
assert.match(plugin,/Downloaded APK package does not match the installed app/,'wrong-package APKs must be rejected');
assert.match(plugin,/Downloaded APK version does not match the update manifest/,'manifest/APK version mismatch must be rejected');
assert.match(plugin,/refuses Android versionCode downgrades or reinstalls/,'normal updater must reject downgrade/reinstall');
assert.match(plugin,/Downloaded APK signing certificate does not match the installed app/,'APK signer must match installed app');
assert.match(plugin,/github\.com\/" \+ GITHUB_REPO \+ "\/releases\/download\//,'APK host should be pinned to this repo release path');
assert.match(receiver,/STATUS_PENDING_USER_ACTION/,'receiver must hand Android user-confirmation intent to the OS UI');

assert.equal(manifest.schema,1);
assert.equal(manifest.channel,'testing');
assert.equal(manifest.packageId,'com.jlingenfelter.swolecat.testing');
assert.equal(manifest.signingCertSha256,'d53f277c5b92311d78e9eb3bdb692ad489734797f2430827400213f38b7cee53');
assert.equal(typeof manifest.enabled,'boolean','Testing feed must explicitly declare whether updates are enabled');
if(manifest.enabled){
  assert(manifest.versionCode>=1,'enabled Testing feed must publish a positive versionCode');
  assert(manifest.versionCode<=pkg.swoleCat.androidVersionCode,'committed Testing feed must not point beyond the source version under validation');
  assert.match(manifest.apkUrl,/^https:\/\/github\.com\/jlingenfelter22-bot\/Swole-Cat\/releases\/download\/testing-v/,'enabled Testing feed must point at a versioned Testing release asset');
  assert.match(manifest.sha256,/^[a-f0-9]{64}$/i,'enabled Testing feed must include a real APK SHA-256');
}

assert.match(workflow,/permissions:\s*\n\s*contents: write/,'Testing publisher needs release/manifest write permission');
assert.match(workflow,/gh release create "\$TAG"/,'Testing build should publish a versioned GitHub prerelease');
assert.match(workflow,/testing-v\$VERSION/,'Testing release tag must be isolated to Testing');
assert.match(workflow,/updates\/testing\.json/,'Testing build should advance only the Testing manifest');
assert.match(workflow,/com\.jlingenfelter\.swolecat\.testing/,'published manifest must target the Testing package');
assert.doesNotMatch(workflow,/updates\/beta\.json/,'ordinary Testing builds must never advance Beta');
assert.match(workflow,/sha256sum/,'published APK must get an explicit SHA-256');

console.log('Swole Cat updater foundation PASS: explicit Android approval, signed/hash/package validation, active-workout deferral, Testing-only feed, and versioned release publication');
