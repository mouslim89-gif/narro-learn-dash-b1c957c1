# Capacitor packaging with hot reload

Goal: run Tsundoku as a real native app (Android first, iOS ready) on a device, with live reload pointing at the Lovable preview so you see changes instantly without rebuilding.

## What gets added

1. Capacitor dependencies: `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/ios`.
2. `capacitor.config.ts` at the project root:
   - `appId`: `app.lovable.tsundoku` (final store ID can be changed later, before first store upload)
   - `appName`: `Tsundoku`
   - `webDir`: `dist`
   - `server.url`: the Lovable preview URL + `cleartext: true` so the native shell loads the live app (this is the hot reload switch)
3. Safe-area handling check: the app already uses `viewport-fit=cover` and `env(safe-area-inset-*)`, so status bar / gesture bar spacing stays correct in the native shell.
4. Optional small additions kept minimal and on-theme: status bar style matching the current `theme-color`, and keeping the splash flow as the existing in-app `SplashScreen`.

Nothing else in the app changes. No UI, no business logic.

## Two modes, one config

- **Hot reload (dev)**: `server.url` present, the APK is a thin shell around the preview URL. Edit in Lovable, pull to refresh or just navigate, changes appear on the phone.
- **Store build (later)**: remove/comment `server.url`, run `npm run build` then `npx cap sync`, and the app runs from bundled `dist` assets. This is required for Play Store / App Store submission.

## Steps you run locally (Capacitor cannot build APKs inside Lovable)

```text
1. Export project to GitHub, then git pull locally
2. npm install
3. npx cap add android      (and: npx cap add ios, on a Mac)
4. npm run build
5. npx cap sync android
6. npx cap run android      (device or emulator, Android Studio required)
```

After that, day-to-day dev is: change code in Lovable, the phone reloads from the preview URL. Re-run `npx cap sync` only when native deps or the config change.

## Notes on in-app purchases

`src/lib/iap.ts` already expects `window.Tsundoku.iap` to be provided by the native shell. Capacitor alone does not provide it. Once the shell runs, the next step is a purchases plugin (RevenueCat or `@capacitor-community/in-app-purchases`) wired to expose that same interface, so no app code changes are needed. Out of scope for this plan unless you want it now.

## Technical details

- `android/` and `ios/` folders are generated locally by `cap add` and are not created here.
- Cleartext is enabled only because the dev server URL is used; the store build has no `server` block.
- The Cloud/Supabase auth flow works unchanged in the WebView since it uses localStorage and the same origin as the preview.
