# Rvin Labrada Web Portfolio

Minimal monochrome portfolio for Rvin Labrada, a Computer Engineering student building frontend, backend, and database-driven web systems.

## Features

- Responsive portfolio layout with left rail navigation on desktop
- Desktop-only interactive lanyard ID built with React Three Fiber
- Mobile-first layout with the heavy lanyard scene skipped on small screens
- Project previews, stack groups, certifications, current focus notes, and contact links
- Browser-viewable resume page at `resume.html`
- Open Graph/social preview metadata and SVG favicon

## Tech Stack

- Vite
- React
- React Three Fiber
- Three.js
- Rapier physics
- HTML, CSS, and vanilla JavaScript

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The production output is generated in `dist/`.

## Vercel

Use these settings:

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`

## Verification

The lanyard behavior can be checked with:

```bash
node scripts/verify-lanyard.mjs
```

The generated `verification/` screenshots are intentionally ignored by Git.
