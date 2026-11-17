# Albuquerque Stories

An unofficial, non-commercial fan-made browser game prototype inspired by the television drama *Breaking Bad*. This project is not affiliated with or endorsed by the rights holders.

## Current prototype
- Third-person 3D Albuquerque neighborhood built from original procedural geometry
- Keyboard and touch movement, camera orbit, proximity interactions
- First mission, dialogue choices, cash and relationship state
- No ripped show footage, logos, music, or copyrighted game assets

## Development
```bash
npm install
npm run dev
npm run build
```

## Cloudflare Pages
Build command: `npm run build`  
Output directory: `dist`

All visuals are generated in code. Replace the prototype geometry with licensed/original assets as production work progresses.


## Deployment
Cloudflare Pages project: `breakingbad-world` (Git-connected, automatic production builds from `main`).

Build trigger check: source path filter now watches all repository paths.


Cloudflare Pages path trigger verified against the main branch.
