import { readFile, writeFile, readdir } from 'node:fs/promises';

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const versionName = String(pkg.version || '').trim();
const versionCode = Number(pkg.swoleCat?.androidVersionCode);
const gradleUrl = new URL('../android/app/build.gradle', import.meta.url);
const manifestUrl = new URL('../android/app/src/main/AndroidManifest.xml', import.meta.url);
const ANDROID_AUTH_SCHEME='com.jlingenfelter.swolecat.testing';
const ANDROID_AUTH_HOST='auth';
const ANDROID_AUTH_PATH='/callback';

async function findFileRecursive(dirUrl,fileName){
  const entries=await readdir(dirUrl,{withFileTypes:true});
  for(const entry of entries){
    const child=new URL(entry.name+(entry.isDirectory()?'/':''),dirUrl);
    if(entry.isFile()&&entry.name===fileName)return child;
    if(entry.isDirectory()){
      const found=await findFileRecursive(child,fileName);
      if(found)return found;
    }
  }
  return null;
}


async function configureAndroidUpdater(){
  const javaRoot=new URL('../android/app/src/main/java/',import.meta.url);
  const mainActivityUrl=await findFileRecursive(javaRoot,'MainActivity.java');
  if(!mainActivityUrl)throw new Error('Could not find generated MainActivity.java for updater');

  let activity=await readFile(mainActivityUrl,'utf8');
  const packageMatch=activity.match(/package\s+([A-Za-z0-9_.]+)\s*;/);
  if(!packageMatch)throw new Error('Could not determine Android package for updater');
  const packageName=packageMatch[1];

  const templateRoot=new URL('./android/',import.meta.url);
  const pluginTemplate=await readFile(new URL('SwoleCatUpdaterPlugin.java.template',templateRoot),'utf8');
  const receiverTemplate=await readFile(new URL('SwoleCatUpdateReceiver.java.template',templateRoot),'utf8');
  const pluginUrl=new URL('SwoleCatUpdaterPlugin.java',mainActivityUrl);
  const receiverUrl=new URL('SwoleCatUpdateReceiver.java',mainActivityUrl);
  await writeFile(pluginUrl,pluginTemplate.replaceAll('__PACKAGE_NAME__',packageName));
  await writeFile(receiverUrl,receiverTemplate.replaceAll('__PACKAGE_NAME__',packageName));

  if(!activity.includes('registerPlugin(SwoleCatUpdaterPlugin.class);')){
    if(!activity.includes('import android.os.Bundle;')){
      activity=activity.replace(
        /package\s+[A-Za-z0-9_.]+\s*;/,
        match=>match+'\n\nimport android.os.Bundle;'
      );
    }
    if(/public class MainActivity extends BridgeActivity\s*\{\s*\}/s.test(activity)){
      activity=activity.replace(
        /public class MainActivity extends BridgeActivity\s*\{\s*\}/s,
        \`public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SwoleCatUpdaterPlugin.class);
        super.onCreate(savedInstanceState);
    }
}\`
      );
    }else if(/super\.onCreate\(savedInstanceState\);/.test(activity)){
      activity=activity.replace(
        /super\.onCreate\(savedInstanceState\);/,
        'registerPlugin(SwoleCatUpdaterPlugin.class);\n        super.onCreate(savedInstanceState);'
      );
    }else{
      throw new Error('Could not safely register SwoleCatUpdaterPlugin in MainActivity');
    }
    await writeFile(mainActivityUrl,activity);
  }

  let manifest=await readFile(manifestUrl,'utf8');
  const installPermission='<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />';
  if(!manifest.includes('android.permission.REQUEST_INSTALL_PACKAGES')){
    const manifestOpen=manifest.match(/<manifest[^>]*>/);
    if(!manifestOpen)throw new Error('Could not find Android manifest root');
    manifest=manifest.replace(manifestOpen[0],manifestOpen[0]+'\n    '+installPermission);
  }

  if(!manifest.includes('SwoleCatUpdateReceiver')){
    const receiverBlock=\`
        <receiver
            android:name=".SwoleCatUpdateReceiver"
            android:exported="false" />\`;
    if(!/<\/application>/.test(manifest))throw new Error('Could not find Android application closing tag');
    manifest=manifest.replace(/\s*<\/application>/,receiverBlock+'\n    </application>');
  }
  await writeFile(manifestUrl,manifest);

  return {mainActivityUrl,pluginUrl,receiverUrl};
}

async function configureAndroidSecureAuthStorage(){
  const javaRoot=new URL('../android/app/src/main/java/',import.meta.url);
  const mainActivityUrl=await findFileRecursive(javaRoot,'MainActivity.java');
  if(!mainActivityUrl)throw new Error('Could not find generated MainActivity.java');

  let activity=await readFile(mainActivityUrl,'utf8');
  const packageMatch=activity.match(/package\s+([A-Za-z0-9_.]+)\s*;/);
  if(!packageMatch)throw new Error('Could not determine Android package from MainActivity.java');
  const packageName=packageMatch[1];
  const pluginUrl=new URL('SwoleCatSecureStoragePlugin.java',mainActivityUrl);

  const pluginSource=`package ${packageName};

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.nio.charset.StandardCharsets;
import java.security.KeyStore;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

@CapacitorPlugin(name = "SwoleCatSecureStorage")
public class SwoleCatSecureStoragePlugin extends Plugin {
    private static final String PREFS_NAME = "swole_cat_secure_auth_v1";
    private static final String KEY_ALIAS = "swole_cat_auth_aes_gcm_v1";
    private static final String ANDROID_KEYSTORE = "AndroidKeyStore";
    private static final String CIPHER = "AES/GCM/NoPadding";
    private SharedPreferences preferences;

    @Override
    public void load() {
        preferences = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    private SecretKey getOrCreateSecretKey() throws Exception {
        KeyStore keyStore = KeyStore.getInstance(ANDROID_KEYSTORE);
        keyStore.load(null);
        if (keyStore.containsAlias(KEY_ALIAS)) {
            KeyStore.SecretKeyEntry entry =
                (KeyStore.SecretKeyEntry) keyStore.getEntry(KEY_ALIAS, null);
            return entry.getSecretKey();
        }

        KeyGenerator generator =
            KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEYSTORE);
        KeyGenParameterSpec spec = new KeyGenParameterSpec.Builder(
            KEY_ALIAS,
            KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT
        )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256)
            .build();
        generator.init(spec);
        return generator.generateKey();
    }

    private String encrypt(String value) throws Exception {
        Cipher cipher = Cipher.getInstance(CIPHER);
        cipher.init(Cipher.ENCRYPT_MODE, getOrCreateSecretKey());
        byte[] ciphertext = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));
        String iv = Base64.encodeToString(cipher.getIV(), Base64.NO_WRAP);
        String body = Base64.encodeToString(ciphertext, Base64.NO_WRAP);
        return iv + "." + body;
    }

    private String decrypt(String encoded) throws Exception {
        String[] parts = encoded.split("\\\\.", 2);
        if (parts.length != 2) throw new IllegalArgumentException("Invalid secure value");
        byte[] iv = Base64.decode(parts[0], Base64.NO_WRAP);
        byte[] ciphertext = Base64.decode(parts[1], Base64.NO_WRAP);
        Cipher cipher = Cipher.getInstance(CIPHER);
        cipher.init(
            Cipher.DECRYPT_MODE,
            getOrCreateSecretKey(),
            new GCMParameterSpec(128, iv)
        );
        return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
    }

    private String requireKey(PluginCall call) {
        String key = call.getString("key");
        if (key == null || key.trim().isEmpty()) {
            call.reject("Secure storage key is required.");
            return null;
        }
        return key;
    }

    @PluginMethod
    public void getItem(PluginCall call) {
        String key = requireKey(call);
        if (key == null) return;
        try {
            JSObject result = new JSObject();
            String encoded = preferences.getString(key, null);
            if (encoded != null) result.put("value", decrypt(encoded));
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Could not read secure auth storage.", error);
        }
    }

    @PluginMethod
    public void setItem(PluginCall call) {
        String key = requireKey(call);
        if (key == null) return;
        String value = call.getString("value");
        if (value == null) {
            call.reject("Secure storage value is required.");
            return;
        }
        try {
            boolean saved = preferences.edit().putString(key, encrypt(value)).commit();
            if (!saved) throw new IllegalStateException("Secure preferences commit failed");
            call.resolve();
        } catch (Exception error) {
            call.reject("Could not write secure auth storage.", error);
        }
    }

    @PluginMethod
    public void removeItem(PluginCall call) {
        String key = requireKey(call);
        if (key == null) return;
        try {
            boolean saved = preferences.edit().remove(key).commit();
            if (!saved) throw new IllegalStateException("Secure preferences commit failed");
            call.resolve();
        } catch (Exception error) {
            call.reject("Could not remove secure auth storage.", error);
        }
    }

    @PluginMethod
    public void keys(PluginCall call) {
        try {
            JSArray keys = new JSArray();
            for (String key : preferences.getAll().keySet()) keys.put(key);
            JSObject result = new JSObject();
            result.put("keys", keys);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Could not inspect secure auth storage.", error);
        }
    }
}
`;
  await writeFile(pluginUrl,pluginSource);

  if(!activity.includes('registerPlugin(SwoleCatSecureStoragePlugin.class);')){
    if(!activity.includes('import android.os.Bundle;')){
      activity=activity.replace(
        /package\s+[A-Za-z0-9_.]+\s*;/,
        match=>match+'\n\nimport android.os.Bundle;'
      );
    }
    if(/public class MainActivity extends BridgeActivity\s*\{\s*\}/s.test(activity)){
      activity=activity.replace(
        /public class MainActivity extends BridgeActivity\s*\{\s*\}/s,
        `public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SwoleCatSecureStoragePlugin.class);
        super.onCreate(savedInstanceState);
    }
}`
      );
    }else if(/super\.onCreate\(savedInstanceState\);/.test(activity)){
      activity=activity.replace(
        /super\.onCreate\(savedInstanceState\);/,
        'registerPlugin(SwoleCatSecureStoragePlugin.class);\n        super.onCreate(savedInstanceState);'
      );
    }else{
      throw new Error('Could not safely register SwoleCatSecureStoragePlugin in MainActivity');
    }
    await writeFile(mainActivityUrl,activity);
  }

  return {mainActivityUrl,pluginUrl};
}


if (!versionName) throw new Error('package.json is missing version');
if (!Number.isInteger(versionCode) || versionCode < 1) {
  throw new Error('package.json swoleCat.androidVersionCode must be a positive integer');
}

let gradle = await readFile(gradleUrl, 'utf8');

if (!/\bversionCode\s+\d+/.test(gradle)) {
  throw new Error('Could not find versionCode in android/app/build.gradle');
}
if (!/\bversionName\s+["'][^"']+["']/.test(gradle)) {
  throw new Error('Could not find versionName in android/app/build.gradle');
}

gradle = gradle.replace(/\bversionCode\s+\d+/, `versionCode ${versionCode}`);
gradle = gradle.replace(/\bversionName\s+["'][^"']+["']/, `versionName "${versionName}"`);

const signingEnabled = process.env.SWOLE_CAT_ENABLE_SIGNING === '1';
const signingBuildType = String(process.env.SWOLE_CAT_SIGNING_BUILD_TYPE || 'release').trim().toLowerCase();

if (signingEnabled) {
  const required = [
    'SWOLE_CAT_SIGNING_STORE_FILE',
    'SWOLE_CAT_SIGNING_STORE_PASSWORD',
    'SWOLE_CAT_SIGNING_KEY_ALIAS',
    'SWOLE_CAT_SIGNING_KEY_PASSWORD'
  ];
  const missing = required.filter(name => !String(process.env[name] || '').trim());
  if (missing.length) throw new Error('Signing enabled but required environment variables are missing: '+missing.join(', '));
  if (!['debug','release'].includes(signingBuildType)) throw new Error('SWOLE_CAT_SIGNING_BUILD_TYPE must be debug or release');

  if (!gradle.includes('signingConfigs {')) {
    const signingBlock = `
    signingConfigs {
        swoleCat {
            storeFile file(System.getenv("SWOLE_CAT_SIGNING_STORE_FILE"))
            storePassword System.getenv("SWOLE_CAT_SIGNING_STORE_PASSWORD")
            keyAlias System.getenv("SWOLE_CAT_SIGNING_KEY_ALIAS")
            keyPassword System.getenv("SWOLE_CAT_SIGNING_KEY_PASSWORD")
        }
    }
`;
    if (!/\n\s*buildTypes\s*\{/.test(gradle)) throw new Error('Could not find buildTypes block in android/app/build.gradle');
    gradle = gradle.replace(/\n(\s*)buildTypes\s*\{/, `\n${signingBlock}\n$1buildTypes {`);
  }

  const signingLine='signingConfig signingConfigs.swoleCat';
  if (signingBuildType === 'debug') {
    if (!/debug\s*\{/.test(gradle)) {
      if (!/release\s*\{/.test(gradle)) throw new Error('Could not find release build type in android/app/build.gradle');
      gradle = gradle.replace(/release\s*\{/, `debug {\n            ${signingLine}\n        }\n        release {`);
    } else if (!/debug\s*\{[\s\S]*?signingConfig signingConfigs\.swoleCat[\s\S]*?\}/.test(gradle)) {
      gradle = gradle.replace(/debug\s*\{/, `debug {\n            ${signingLine}`);
    }
  } else {
    if (!/release\s*\{/.test(gradle)) throw new Error('Could not find release build type in android/app/build.gradle');
    if (!/release\s*\{[\s\S]*?signingConfig signingConfigs\.swoleCat[\s\S]*?\}/.test(gradle)) {
      gradle = gradle.replace(/release\s*\{/, `release {\n            ${signingLine}`);
    }
  }
}

await writeFile(gradleUrl, gradle);

let manifest=await readFile(manifestUrl,'utf8');
if(!manifest.includes(`android:scheme="${ANDROID_AUTH_SCHEME}"`)){
  const filter=`
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data
                    android:scheme="${ANDROID_AUTH_SCHEME}"
                    android:host="${ANDROID_AUTH_HOST}"
                    android:pathPrefix="${ANDROID_AUTH_PATH}" />
            </intent-filter>`;
  if(!/<\/activity>/.test(manifest)){
    throw new Error('Could not find MainActivity closing tag in AndroidManifest.xml');
  }
  manifest=manifest.replace(/\s*<\/activity>/,filter+'\n        </activity>');
}
await writeFile(manifestUrl,manifest);

const secureAuth=await configureAndroidSecureAuthStorage();
const updater=await configureAndroidUpdater();

console.log(
  `Configured Android versionName=${versionName}, versionCode=${versionCode}, authRedirect=${ANDROID_AUTH_SCHEME}://${ANDROID_AUTH_HOST}${ANDROID_AUTH_PATH}, secureAuth=AndroidKeyStore, updater=PackageInstaller` +
  (signingEnabled ? `, ${signingBuildType} signing enabled` : '')
);
console.log(`Secure auth plugin: ${secureAuth.pluginUrl.pathname}`);
console.log(`Updater plugin: ${updater.pluginUrl.pathname}`);
