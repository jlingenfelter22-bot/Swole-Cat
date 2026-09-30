# Swole Cat Android Release Process

This is the production Android release path for Swole Cat.

## What the release workflow produces

The manual GitHub Actions workflow `.github/workflows/release-android.yml` produces:

- a signed installable APK
- a signed Android App Bundle (AAB) for Play distribution
- a `SHA256SUMS.txt` integrity file

The release is built from the same versioned web bundle used by the PWA.

## One-time signing setup

Android updates must continue to use the same signing key. Treat the release keystore as a permanent project credential.

Create the keystore locally on a trusted machine:

```bash
keytool -genkeypair -v -keystore swole-cat-release.jks -alias swolecat -keyalg RSA -keysize 4096 -validity 10000
```

Choose strong passwords and store the keystore plus passwords somewhere secure and backed up. Losing the signing key can prevent normal updates to an installed app.

Convert the keystore to base64 before placing it in GitHub Actions secrets.

PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("swole-cat-release.jks")) | Set-Clipboard
```

macOS/Linux:

```bash
base64 < swole-cat-release.jks | tr -d '\n'
```

Add these repository Actions secrets:

- `SWOLE_CAT_ANDROID_KEYSTORE_B64`
- `SWOLE_CAT_ANDROID_STORE_PASSWORD`
- `SWOLE_CAT_ANDROID_KEY_ALIAS`
- `SWOLE_CAT_ANDROID_KEY_PASSWORD`

The default alias from the example command is `swolecat`.

Never commit the keystore or passwords into the repository.

## Versioning a release

Before each production release:

1. Update `package.json.version`.
2. Increment `package.json.swoleCat.androidVersionCode`.
3. Run the normal validation/debug pipeline.
4. Confirm the build version shown inside Swole Cat Settings.
5. Run **Build Signed Swole Cat Android Release** manually from GitHub Actions.
6. Download the release artifact.
7. Install the signed APK on a test device and perform a short smoke test.
8. Use the AAB for Play Console distribution when store publishing begins.

The Android version code must always increase for new store releases.

## Important signing rule

Once a release build is distributed, do not casually replace the signing key. Future versions need to be signed with the same app signing identity unless a formal store-supported key migration is used.

## Current status

The signed release workflow is implemented in the repository. The first signed build will become available after the four private GitHub Actions secrets above are configured.
