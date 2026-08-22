# Trip Companion

Personal, hands-on travel-planning app. Greek UI, local-only data (no accounts, no live APIs).

## Develop

```bash
npm install
npm run dev
```

## Test

```bash
npm run test
```

## Build

```bash
npm run build   # outputs to dist/
npm run preview # serve the production build locally
```

## Deploy

The app is a static Vite build with no server component — any static host works.

**Vercel**: import the repo at [vercel.com/new](https://vercel.com/new); it auto-detects Vite (build command `npm run build`, output `dist`). No config needed.

**Netlify**: `netlify.toml` is already included (`netlify deploy --prod`, or import the repo at app.netlify.com).

Once deployed, open the URL on your phone — data is stored entirely in that browser's `localStorage`, so add the page to your home screen for quick access during the trip.
