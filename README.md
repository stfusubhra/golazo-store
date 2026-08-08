# GOLAZO — Classic Match Balls

A single-screen, snap-scrolling 3D storefront for the iconic 32-panel football. Scroll through the night-match showcase, switch between the classic colorways, add a ball to your cart, or design your own one-of-one — all with a custom cursor that tints to the active ball's accent shade.

## Features

- **Scroll-driven 3D ball** — a 32-panel truncated icosahedron rendered with React Three Fiber, with a stadium-night section (floodlights, tinted beams, turf glow) and a true-flight metrics page
- **Four classic takes** — TELSTAR 70, TANGO 78, ROYAL 82, NOIR 26, each recoloring the shared ball geometry
- **Add to cart** — ghost-ball flight animation into the cart icon with sound feedback and a slide-in cart drawer
- **MY BALL customizer** — pick panel and line colors to mint your own one-of-one ball
- **Custom cursor** — a slamdunk-style dot + ring (`mix-blend-difference`) that expands and tints to the active ball's accent on hover over any button or link

## Tech stack

- React 19 + Vite 7
- @react-three/fiber, @react-three/drei, three
- GSAP (scroll/scroll-driven animation + cursor `quickTo`)
- Tailwind CSS v4

## Getting started

```bash
npm install
npm run dev
```

## Build & preview

```bash
npm run build    # outputs to dist/
npm run preview  # serves the production build on :4173
```

## Deploy

**Live: https://golazo-store-two.vercel.app** (auto-deploys from `main` via the Vercel GitHub integration)

Push to GitHub and import the repo into Vercel — the Vite framework preset is auto-detected (build `npm run build`, output `dist`). No environment variables required. The project is linked to this repo, so pushes to `main` deploy automatically.

The production bundle is split into stable vendor chunks (`three`, `react`, `gsap`) for parallel loading and long-term caching.
