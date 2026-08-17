# Capacitor: point the app at the published URL, then build natively

## The URL question

You are right. The current config points at the preview URL:

`https://34e6052a-072a-48df-b850-628e648a6614.lovable.app`

Preview URLs require a Lovable login, so a native shell loading it shows a login wall or a blank screen. The published URL `https://narro-learn-dash.lovable.app` is public and works everywhere.

Note: "hot reload" here just means the native shell loads a remote URL instead of bundled files. With the published URL, changes appear on the device after you click Update in the publish dialog. True instant reload only works with a local `bun dev` server on your Wi‑Fi IP, which cannot be run from here.

## Change to make

Update `capacitor.config.ts`:

- `server.url` -> `https://narro-learn-dash.lovable.app`
- remove `cleartext: true` (only needed for plain http local dev)
- keep a commented block showing how to swap in `http://<your-lan-ip>:8080` for local dev, and how to remove `server` entirely for a store build

Optional: rename the published slug from `narro-learn-dash` to `tsundoku` so the URL becomes `https://tsundoku.lovable.app`. If you want that, I do the rename first and use the new URL in the config.

## What you do next (on your own machine)

Capacitor native builds need Xcode / Android Studio, so these steps run locally, not here.

1. Push to GitHub from Lovable, then `git clone` and `bun install`
2. `bunx cap add ios` and/or `bunx cap add android` (the native folders are not committed yet)
3. `bun run build` then `bunx cap sync`
4. `bunx cap run ios` (Mac + Xcode) or `bunx cap run android` (Android Studio)

Since `server.url` is set, the device loads the live published site; step 3 only needs repeating when native config or plugins change.

## For the real store release

Remove the whole `server` block, `bun run build`, `bunx cap sync`, then archive in Xcode / generate a signed AAB in Android Studio. At that point we also add: app icons and splash assets, `@capacitor/status-bar` and safe-area handling, and the in-app-purchase plugin wired to the existing `iap.ts` bridge (currently a stub). I can prepare all of that in a follow-up.
