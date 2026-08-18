# Standalone native build (offline-first APK)

Goal: the app no longer loads the published URL inside a WebView. The APK ships the built files and runs locally, with the backend used only for sync.

## 1. Capacitor config

`capacitor.config.ts`:
- remove the whole `server` block (no more remote URL, no cleartext)
- keep `appId: com.tsundoku.app`, `appName: Tsundoku`, `webDir: dist`
- add `SplashScreen` plugin config: background `#F7F4EF` (paper), no spinner, `launchAutoHide: false` so the JS hides it once React is mounted
- add `android: { backgroundColor }` and keep `ios.contentInset`

## 2. Native chrome bootstrap

New `src/lib/native.ts`, called once from `src/main.tsx`:
- guard with `Capacitor.isNativePlatform()` so the web build is untouched
- StatusBar: `Style.Dark` in light mode / `Style.Light` in dark mode, background matching the app background
- re-apply the status bar style whenever the dark-mode store flips (small subscription in `DarkModeSync`)
- hide the native splash after first paint, which hands over cleanly to the existing `SplashScreen` component

## 3. App icon and splash assets

- generate a 1024x1024 Tsundoku icon (paper background, dark navy serif wordmark mark) plus a 2732x2732 splash into `resources/`
- these feed `bunx @capacitor/assets generate`, which writes every Android/iOS density automatically

## 4. Offline behaviour check

Everything the reader needs is already local: book text (`src/data/books/`), tokens (`src/data/book-tokens/`), dictionary shards (`public/dict/`). Network is only needed for cloud sync, AI lookups of uncached words, TTS and audio sync. No change required, but the plan includes verifying the app boots with no network by relying on the persisted Zustand stores.

## What you run locally after this

```text
git pull
bun install
bunx @capacitor/assets generate --android
bun run build
bunx cap sync android
cd android && .\gradlew.bat assembleDebug
```

The APK is then fully self-contained. Clicking Publish in Lovable no longer updates installed devices; you rebuild and reinstall to ship changes.

## Notes

- Store release still needs a signed keystore and `assembleRelease` / `bundleRelease`; that is a separate step when you are ready to upload.
- In-app purchases still use the stub in `src/lib/iap.ts`. Wiring a real billing plugin is a follow-up, not part of this change.
