# Albuquerque Stories

An unofficial, non-commercial browser-game prototype inspired by the television drama *Breaking Bad*. This project is not affiliated with or endorsed by the rights holders.

## Current game

- Third-person 3D Albuquerque neighborhood with car wash, diner, gas station, desert warehouse, street traffic props and desert access road
- Keyboard and touch movement, camera orbit, collision-aware walking and a drivable sedan
- On-screen objective distance, 3D waypoint beacon, nearby minimap and full-screen city map
- Story missions with branching dialogue, delivery run, cash, trust and heat
- Side activities and services: one-time car-wash shift, diner rest and meals, gas-station first aid, and police encounter
- Character and NPC idle/walking animations
- Local save for story progress, player/vehicle positions and choices

## Controls

- **W / S**: walk forward / backward; accelerate / reverse while driving
- **A / D**: strafe while walking; steer while driving
- **Shift**: walk faster
- **E**: interact / enter or exit the sedan
- **M** or tap the minimap: open the full city map
- **Esc**: close map or dialogue
- **Drag**: rotate the camera
- On mobile, use the directional pad and E button; tap the minimap to expand it
- Tap/click a point on the full city map to set a custom navigation pin; use **CLEAR PIN** to return to the story objective
- Optional original ambient wind, footsteps and engine sound can be toggled with **SOUND ON/OFF**

## Development

```bash
npm install
npm run dev
npm run build
```

## Cloudflare Pages

Build command: `npm run build`  
Output directory: `dist`

Cloudflare Pages project: `breakingbad-world` (Git-connected, automatic production builds from `main`).

All visuals are generated in code. Replace prototype geometry with original or properly licensed assets as production work progresses.
