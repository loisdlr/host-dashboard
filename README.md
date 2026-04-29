# Cozy Manhattan

A short-term rental management app for 6 units. Built with Expo (React Native + Web), it works as a native mobile app and as an installable PWA on the web.

## Features

- 5-tab dashboard: Home, Calendar, Bookings, Finance, More
- Booking management with channel tagging (Direct, Airbnb, Booking.com, Agoda)
- Per-unit utility bills and dues tracking
- Cleaner roster + job log
- Investor / operator income split
- PDF income statement export (single unit + portfolio)
- Quotation generator (studios + 1BR, weekday/weekend/holiday rates, pets, extra pax)
- Calendar sync notes for OTAs
- Local-first storage with AsyncStorage — no backend required
- PWA: installable on iOS, Android, and desktop with offline support

## Tech

- Expo SDK 54, React Native 0.81, React 19
- expo-router (typed routes)
- AsyncStorage (no backend)
- expo-print + expo-sharing for PDF export
- Service worker + web manifest for PWA

## Quick start (local)

```bash
npm install
npm run web        # open http://localhost:8081
# or
npm run ios        # iOS simulator (requires Xcode)
npm run android    # Android emulator (requires Android Studio)
```

## Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Cozy Manhattan"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## Deploy to Vercel

The repo includes `vercel.json` — Vercel will auto-detect the build settings.

**Option A — One-click via dashboard:**

1. Go to [vercel.com/new](https://vercel.com/new) and import your GitHub repo.
2. Framework preset: leave as **Other** (vercel.json overrides it).
3. Build command: `npx expo export --platform web` (auto-filled).
4. Output directory: `dist` (auto-filled).
5. Click **Deploy**.

**Option B — Vercel CLI:**

```bash
npm i -g vercel
vercel          # preview deployment
vercel --prod   # production deployment
```

That's it. The PWA manifest, service worker, and SPA fallback are all preconfigured.

## Project layout

```
app/                 expo-router screens (file-based routing)
  (tabs)/            5 main tabs
  booking/           booking modals
  expense/           expense modals
  +html.tsx          custom HTML head (PWA tags, SW registration)
  _layout.tsx        root layout, font + provider setup
assets/images/       app icon
components/          shared UI primitives
constants/colors.ts  teal theme palette
contexts/            RentalContext (AsyncStorage-backed state)
hooks/               useColors, useInstallPrompt
public/              static files served as-is (manifest, sw.js, icon)
utils/               finance helpers, PDF generator, PWA setup
```

## Notes

- All data lives in the browser/device via AsyncStorage. Nothing is sent to a server.
- To reset seeded data, clear site data in your browser or reinstall the app.
- The PWA "Install" button in the More tab adapts to the user's browser:
  Chrome/Edge → native install prompt, iOS Safari → Add to Home Screen instructions, others → address-bar install icon hint.

## License

Private project. All rights reserved.
