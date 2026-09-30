# Swole Cat Android Real-Device Test Checklist

Target build: **v0.29.0 debug**

Use this checklist on a real Android phone before Phase 0 is considered stabilized. If something fails, record the step, device model, Android version, and the Swole Cat version shown in **Settings → Data safety**.

## 1. Clean install and launch

- [ ] APK installs successfully
- [ ] App launches without a blank/white screen
- [ ] Swole Cat onboarding appears on a clean install
- [ ] Settings identifies the app as **Android package**
- [ ] Settings shows **Version 0.29.0**
- [ ] No browser address bar or PWA install prompt appears

## 2. Existing-user migration

Before this test, export a backup from the existing PWA.

- [ ] Import the PWA backup during onboarding or from Settings
- [ ] Existing routines appear
- [ ] Existing programs appear
- [ ] Workout history appears
- [ ] PR/progression history appears
- [ ] Preferences/units are preserved
- [ ] Bodyweight history is preserved
- [ ] App remains correct after fully closing and reopening it

Do not uninstall or clear the old PWA until this section passes.

## 3. Basic navigation

- [ ] Home opens correctly
- [ ] Routines opens correctly
- [ ] Exercise library opens correctly
- [ ] History opens correctly
- [ ] Analytics opens correctly
- [ ] Settings modal opens/closes correctly
- [ ] Android system Back button does not unexpectedly exit or destroy an active workout
- [ ] Scrolling remains smooth on long screens

## 4. Workout flow

Create or open a routine and start a workout.

- [ ] Workout starts normally
- [ ] Weight/reps inputs accept keyboard input correctly
- [ ] Keyboard does not permanently cover the active input/buttons
- [ ] Complete several sets
- [ ] Haptic feedback works when enabled
- [ ] Rest timer runs correctly
- [ ] Background the app during the workout, then return
- [ ] Active workout is still present
- [ ] Fully close/relaunch the app during an active workout
- [ ] Active workout restores correctly
- [ ] Finish and save the workout
- [ ] Saved workout appears in History
- [ ] Analytics reflects the saved workout

## 5. Screen-awake behavior

With **Keep screen awake** enabled:

- [ ] Start an active workout
- [ ] Leave the workout screen open long enough to verify the device does not immediately sleep under its normal timeout
- [ ] End/leave the workout and verify normal device behavior returns

If this does not work on Android, mark it failed. Native keep-awake support can replace the current browser API later.

## 6. Backup and restore inside Android

- [ ] Export a backup from the Android app
- [ ] Android presents/saves the JSON file successfully
- [ ] Make a small visible data change
- [ ] Import the exported backup
- [ ] Import succeeds
- [ ] Pre-import rollback snapshot is offered in Settings
- [ ] Restore pre-import snapshot and verify the previous state returns

## 7. Offline behavior

- [ ] Enable airplane mode
- [ ] Launch Swole Cat
- [ ] Existing routines/history still load
- [ ] Start and log a workout offline
- [ ] Save the workout offline
- [ ] Reopen the app and verify the workout remains

Exercise artwork that comes from an external source may not load if it was never cached. Core workout functionality must still work.

## 8. Rotation / resizing / system UI

- [ ] Portrait layout is clean
- [ ] If auto-rotate is enabled, landscape does not become unusable
- [ ] Status bar does not obscure important controls
- [ ] Bottom navigation is not hidden behind Android gesture/navigation UI
- [ ] Modal sheets are usable with the keyboard open

## 9. Pass criteria

Phase 0 real-device testing passes when:

- no data-loss issue is found
- backup migration works
- active workouts survive normal app background/relaunch behavior
- core navigation/workout/history flows work
- no critical screen is blocked by keyboard or Android system UI

Minor visual issues can be logged for polish. Any data-loss, restore, save, or startup failure is a blocker.
