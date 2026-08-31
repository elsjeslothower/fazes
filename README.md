# Fazes

A PWA that suggests workouts and foods based on where you are in your
menstrual cycle. Installable on iOS/iPadOS via "Add to Home Screen," built
with a later path to a native iOS app (via Capacitor) in mind.

Built with Vite + Preact, backed by Supabase (auth + Postgres). See
[the implementation plan](.claude/plans) referenced during development for the
full set of architecture decisions and why they were made.

## Project structure

```
index.html                  Vite entry HTML
vite.config.js               Vite + Preact + vite-plugin-pwa config
.env.example                  Copy to .env.local and fill in your Supabase values
supabase/schema.sql            Run once in your Supabase project's SQL editor
src/
  main.jsx                     Bootstraps the app: session, service worker, install banner
  app.jsx                       Auth gate + router outlet
  router.js                     Small hash-based router
  styles.css                    All app styles, incl. safe-area-inset padding for the notch
  sw.js                         Service worker source (see "How the service worker works" below)
  state/                        session.js (auth state), cycleStore.js (cycles + profile)
  auth/                         supabaseClient.js, auth.js
  data/                         cyclesRepo.js, profileRepo.js, localCache.js
  cycle/phaseEngine.js           Pure cycle-phase calculation logic
  content/phaseContent.js        Static workout/food suggestion copy per phase
  views/                         AuthView, OnboardingView, DashboardView, LogView, PhaseGuideView, SettingsView
  components/                    NavBar, PhaseBadge
  pwa/                           sw-register.js, ios-install-banner.js, install-prompt.js
public/
  manifest.json, icons/, offline.html   copied verbatim into the build
scripts/generate-icons.js        Regenerates the placeholder icons
```

## First-time setup

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Create a Supabase project** at [supabase.com](https://supabase.com) (free
   tier is enough).
   - In **Project Settings → Data API**: leave **Enable Data API** on
     (required — `supabase-js` depends on it), leave **Enable automatic RLS**
     on, and turn **Automatically expose new tables** off (access should be
     explicit given the data is sensitive; `schema.sql` already includes the
     `grant` statements this requires).
   - In the project's SQL editor, run the contents of
     [`supabase/schema.sql`](supabase/schema.sql) — this creates the `profiles`
     and `cycles` tables with Row Level Security enabled, so each user can only
     ever read or write their own rows.
3. **Copy env config:**
   ```bash
   cp .env.example .env.local
   ```
   Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your
   project's Settings → API page. The anon key is safe to expose client-side
   — RLS is what protects the data, not secrecy of that key.
4. **Run it:**
   ```bash
   npm run dev
   ```

## Available commands

```bash
npm run dev       # Vite dev server with hot reload
npm run build     # Production build to dist/
npm run preview   # Serve the dist/ build locally, close to production behavior
npm run icons     # Regenerate the placeholder PNG icons in public/icons/
```

## How the service worker works

`vite-plugin-pwa` is configured with the **injectManifest** strategy: our own
hand-written service worker logic lives in [`src/sw.js`](src/sw.js) (network-first
for page navigations with an offline fallback, cache-first for static
assets, a skip-waiting update flow), and the plugin's only job is swapping the
`self.__WB_MANIFEST` placeholder in that file for the actual list of built
asset URLs (hashed JS/CSS filenames plus everything in `public/`) at build
time. This keeps the custom offline/update behavior fully under our control
while still solving the "the file names change on every build" problem a
bundler introduces.

If you add new static assets, they're picked up automatically — no manual
list to maintain. If you change what the service worker's `fetch` handler
*does*, bump `CACHE_VERSION` in `src/sw.js` so returning users get the new
cache instead of a stale one.

## Testing on real iOS Safari (no Mac required)

iOS only ships WebKit — "Chrome" and "Edge" on iPhone/iPad are WebKit with a
different UI skin, so testing in Chrome/Edge on Windows tells you very little
about how this behaves on an iPhone. You need actual Safari/WebKit. Three
practical options, roughly in order of usefulness:

### 1. A real iPhone/iPad over an HTTPS tunnel (best option)

Outside of `localhost`, service workers require HTTPS. Your phone can't reach
your PC's `localhost`, and a plain `http://<your-LAN-IP>:5173` won't satisfy
that requirement — so tunnel it (run `npm run dev` or `npm run preview` first):

```bash
npx localtunnel --port 5173
# or
npx ngrok http 5173
```

Both print a public `https://...` URL. Open that URL in Safari on your
iPhone/iPad, then test:
- Does it load and look right (safe-area padding around the notch/home indicator)?
- Sign up, complete onboarding, log a period — does the dashboard reflect it?
- Share → **Add to Home Screen** → does it install with the right icon/name?
- Launch from the home screen icon — does it open standalone (no Safari chrome)?
- Turn on Airplane Mode after one online visit — does the cached app shell still load?

**Debugging without a Mac:** you can't attach Safari's Web Inspector without
one. If real-device console access matters, temporarily add an on-page debug
console like [eruda](https://github.com/liriliri/eruda) while testing, and
remove it before shipping. If you ever get occasional access to any Mac,
Safari's **Develop → [Your iPhone] → localhost** menu gives you full real Web
Inspector against your device over USB.

### 2. Cloud real-device testing (BrowserStack / LambdaTest)

Good for visual/layout checks across iOS versions and screen sizes. Weaker for
the full "Add to Home Screen → relaunch → offline" cycle, since you don't keep
the device between sessions. Treat it as a rendering/compatibility check, not
a substitute for testing the install flow on a device you actually own.

### 3. Borrowed/secondhand device

If you can get hold of any iPhone or iPad even briefly, it's worth doing a
full pass with your own tunnel URL — the only way to test the complete
install → relaunch → offline → update cycle end to end.

## iOS PWA quirks this app already accounts for

- **No `beforeinstallprompt` on iOS.** iOS Safari has never implemented it, so
  [`src/pwa/ios-install-banner.js`](src/pwa/ios-install-banner.js) shows a
  manual Share → Add to Home Screen banner instead, dismissable for a week at
  a time. Android/desktop get the native prompt via
  [`src/pwa/install-prompt.js`](src/pwa/install-prompt.js).
- **Safe areas.** `viewport-fit=cover` + `env(safe-area-inset-*)` in
  [`src/styles.css`](src/styles.css) handle the notch/Dynamic Island and home
  indicator.
- **Manifest support is decent but incomplete**, so the legacy
  `apple-mobile-web-app-*` meta tags and `apple-touch-icon` link stay in
  [`index.html`](index.html) alongside `manifest.json`.

## iOS PWA quirks to keep in mind as you build

- **Storage isn't guaranteed to stick around.** Safari's anti-tracking storage
  policy can evict `localStorage`/Cache Storage for a site that goes
  unvisited for a while. This is exactly why cycle data lives in Supabase as
  the source of truth — [`src/data/localCache.js`](src/data/localCache.js) is
  only an instant-load/offline convenience cache, not the durable copy.
- **Web Push is limited** and needs a real push backend (VAPID keys, a server
  that sends payloads) — not part of this build. If you add it later, note
  iOS only supports it (16.4+) for a PWA already installed to the home screen.
- **New web platform features land on iOS later than Chrome/Android**, if at
  all. Check [webkit.org/status](https://webkit.org/status/) before depending
  on something exotic — Chrome DevTools device emulation will happily let you
  use an API that doesn't exist on a real iPhone.

## Data privacy notes

Cycle data is sensitive personal health data tied to an account. A few things
this build already does because of that, worth keeping in mind as you extend
it:
- Both Supabase tables have RLS policies scoping every row to its owner —
  don't add a table without one.
- No analytics/tracking SDKs are wired in. If you ever add one, keep cycle
  data out of anything sent to it.
- The suggestion content carries a permanent non-medical-advice disclaimer
  ([`src/content/phaseContent.js`](src/content/phaseContent.js)) — keep it
  visible if you touch those views.
- Data export and account/data deletion aren't built yet (deferred as a
  fast-follow, not core MVP) — worth prioritizing before this has real users,
  both as good practice and because Apple scrutinizes health-adjacent apps'
  data handling more closely during App Store review.

## Icons

The icons in `public/icons/` are placeholders generated by
[`scripts/generate-icons.js`](scripts/generate-icons.js) — a solid color
square with a white circle, no external image tools required. Regenerate with
`npm run icons`. Swap in real branded icons when you have them — a
maskable-safe 512×512 via [maskable.app](https://maskable.app/editor).

## Next steps

Open items to come back to — not urgent, just tracked so they don't get lost:

- **Confirm the "new version available" toast behaves correctly.** A race
  in [`src/pwa/sw-register.js`](src/pwa/sw-register.js) could make it fire on
  a genuine first install (our `sw.js` calls `self.clients.claim()` in
  `activate`, which could flip `navigator.serviceWorker.controller` before
  the update-check callback read it) — this has been fixed by capturing that
  flag *before* calling `register()` instead of re-checking it live. Still
  needs a clean confirmation: in DevTools → Application → Service Workers,
  find the entry whose **Scope** matches the app's actual URL (e.g.
  `http://localhost:4173/`, not an unrelated extension's
  `chrome-extension://...` entry — that panel lists registrations across all
  origins, not just the current page's) and confirm only one registration
  exists with no unexpected prior version before a fresh load.
- **Data export and account/data deletion** aren't built yet — see the "Data
  privacy notes" section above for why this one's worth prioritizing before
  real users.

## Future feature ideas (not started)

Bigger, longer-horizon ideas — noted for context now, not planned in detail
yet:

- **Apple Watch / Fitness / Health integration.** This has no web API at all
  — HealthKit is only reachable from a native app, so this depends on the
  Capacitor step below actually happening, not just being an option. Worth
  knowing when it's time: HealthKit has purpose-built types for exactly this
  domain — `HKCategoryTypeIdentifier.menstrualFlow` (and related cycle-tracking
  sample types, iOS 13+) for period data, and `HKWorkout` for pulling in
  actual completed workouts from Apple Watch. Community Capacitor HealthKit
  plugins exist but their menstrual-cycle-specific coverage has historically
  been inconsistent — check the current state of the plugin ecosystem when
  this is actually prioritized rather than assuming one will just work.
- **Location-based in-season food suggestions.** Unlike the other two, this
  doesn't need native wrapping — iOS Safari has supported the browser's
  Geolocation API for years, so it can be built directly into the PWA.
  Two decisions to make at implementation time rather than now: (1) precise
  GPS needs reverse-geocoding to a region, which means a geocoding API/key —
  a coarser one-time "what country/hemisphere are you in" ask avoids that
  entirely and is likely enough precision for "in-season," and (2) the
  seasonal-produce data itself is slow-changing, so a small curated static
  dataset (same pattern as `phaseContent.js`) is probably a better fit than
  taking on a live third-party API dependency for it.
- **Real Xcode app / App Store submission.** Same step as "wrapping this as a
  native iOS app" below — restating it here because Health/Watch integration
  turns it from optional-later into a hard prerequisite, since there's no way
  to reach HealthKit from the web.

## Later: wrapping this as a native iOS app (Capacitor)

Nothing to do now — the biggest Capacitor-migration foot-gun is scattering
browser-only API calls throughout the app. They're isolated in `src/pwa/`
and `src/auth/`/`src/data/` (a thin repo layer over Supabase), so a native
build needing an equivalent later (e.g. the Push Notifications plugin instead
of Web Push, or a native SQLite store instead of the Supabase JS client) is a
change in one place, not a search through every view.

When you're ready:

```bash
npm run build
npx cap init
npx cap add ios
```

Point Capacitor's `webDir` at `dist/`. Xcode is required for the native build
step and App Store submission — at that point, unlike Safari testing, there
isn't a good way around needing a Mac at least for the release build.
