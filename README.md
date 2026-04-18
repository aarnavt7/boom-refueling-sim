# Boom

Browser-based **3D aerial refueling boom** simulator: fly the boom, watch the synthetic camera feed, and replay runs. Built with **Next.js**, **React Three Fiber**, and **Three.js**.

**Repository:** [github.com/aarnavt7/boom-refueling-sim](https://github.com/aarnavt7/boom-refueling-sim)

![Boom — refueling boom sim](public/boom-logo.svg)

## Features

- **Full 3D scene** — Tanker, receiver, articulated boom, and lighting matched between the landing page and `/sim`.
- **Landing hero** — Cinematic scripted fly-by (no orbit controls): camera sweeps past the formation on load and extends as you scroll.
- **Synthetic camera** — Offscreen render + geometry-based tracking (no ML API required).
- **Safety & metrics** — Limits, staged controller states, and live metrics in the HUD.
- **Replay** — Record and scrub runs from the sim store.
- **Optional cloud saves** — Convex integration for persisting completed runs (configure when deploying).

## Requirements

- [Bun](https://bun.sh) 1.3+ (or use `npm` / `pnpm` with equivalent commands)
- Node 18+ for Next.js

## Setup

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page. Open [http://localhost:3000/sim](http://localhost:3000/sim) for the interactive simulator (orbit camera, full HUD).

## Scripts

| Command | Description |
|--------|-------------|
| `bun run dev` | Development server |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run lint` | ESLint |
| `bun run typecheck` | TypeScript (`tsc --noEmit`) |
| `bun run test` | Tests |
| `bun run convex:dev` / `convex:deploy` | Convex (optional) |

## Environment

Copy `.env.example` to `.env.local` if present and set:

- `NEXT_PUBLIC_SITE_URL` — Canonical site URL for metadata (defaults inferred on Vercel).

For Convex persistence, follow the Convex dashboard and add the generated URL as documented in your Convex project.

## Deploy

The app is a standard Next.js deployment:

1. Push this repository to GitHub.
2. Import the repo in [Vercel](https://vercel.com) (or Netlify, etc.).
3. Set **Install command**: `bun install` (or `npm install`).
4. Set **Build command**: `bun run build` and **Output**: Next.js default.

## License

MIT — see [LICENSE](LICENSE).
