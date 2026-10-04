# Swole Cat Testing Android Signing

The experimental Android channel uses one persistent **Testing-only** signing key.

This is separate from the eventual production / Google Play signing identity.

## Locked Testing identity

- App: **Swole Cat Testing**
- Package ID: `com.jlingenfelter.swolecat.testing`
- Signing certificate SHA-256: `D5:3F:27:7C:5B:92:31:1D:78:E9:EB:3B:DB:69:2A:D4:89:73:47:97:F2:43:08:27:40:02:13:F3:8B:7C:EE:53`

The certificate fingerprint is public information. The private JKS and passwords are not.

## GitHub Actions repository secrets

The Testing Android workflow requires these exact repository secret names:

- `SWOLE_CAT_TESTING_KEYSTORE_B64`
- `SWOLE_CAT_TESTING_STORE_PASSWORD`
- `SWOLE_CAT_TESTING_KEY_ALIAS`
- `SWOLE_CAT_TESTING_KEY_PASSWORD`

The workflow must fail if any are missing. It must never silently fall back to a GitHub runner's ephemeral debug certificate.

## One-time transition

Testing APKs through v0.67.4 were produced with throwaway runner debug certificates.

Therefore the first permanently signed Testing APK cannot update those old Testing installs. The old **Swole Cat Testing** app must be uninstalled once, then the first permanently signed Testing APK installed.

The field-beta **Swole Cat** app is a separate package and is not affected.

After that one reset, every future Testing APK signed with this same key should update in place and retain the Testing app's:
- workout/local data
- settings
- Android Keystore values
- Google/Supabase session
- other app-private state

## Key custody

Keep a private backup of the Testing JKS and its credentials.

Never:
- commit the JKS
- commit passwords or base64 keystore content
- attach the key to a public GitHub issue or release
- reuse this Testing key as the future production Play Store key
- rotate the key casually

Losing the key means already-installed permanently signed Testing apps cannot be updated by a differently signed APK.
