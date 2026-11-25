# WARUNG RUSH — best-cooking-game-20261125-0137

[![bounty](https://img.shields.io/badge/bounty-best--cooking--game--20261125--0137-orange)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://img.shields.io/badge/rank-awaiting%20judgement-blue)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://img.shields.io/badge/reward-%24250%20top%2010-gold)](https://make.fun/bounty/best-cooking-game-20261125-0137)

**WARUNG RUSH** is an original one-screen Indonesian street-food rush cooking game.
You run the busiest warung in the village: tickets arrive on the order board,
you assemble dishes from ten ingredients on the counter, cook them on the wok
before they burn, and serve before each customer's patience runs out.

## How to play

- **Click ingredients** on the counter (or press `1–9`, `0`) to assemble a dish
  on the plate. Each ticket shows exactly what it wants.
- **MASAK (`M`)** sends a complete plate to the stove. Pull it off with
  **ANGKAT (`M`)** once it is cooked — leave it too long and it burns.
- **SAJIKAN (`S`)**, or click the ticket itself, serves the finished dish on
  the serve counter. Fast serves earn bigger tips; serving in a row builds a
  combo that raises every tip.
- A wrong ingredient or a wrong serve costs every waiting customer patience.
  Three customers walking out ends the shift early.
- One shift lasts **180 seconds**. Orders arrive faster and recipes get longer
  as the shift heats up. `T` throws a plate away, `P` pauses, `R` restarts.

Menu: **Nasi Goreng • Mie Ayam • Sate Ayam • Es Teh • Nasi Telur** — all art is
original vector drawing (canvas 2D), all sounds are synthesized WebAudio
bleeps, no network request, no borrowed assets.

## Run it

```sh
node serve.ts            # serves game/ on http://localhost:8080
```

Open http://localhost:8080 in a desktop browser and play with mouse +
keyboard. Screenshots are staged through `?shot=cover|rush|serve|start`
(the same game code, deterministic states) — see `game/src/shots.js`.

## Layout

- `game/index.html` — the page, one 1280×720 canvas
- `game/src/config.js` — canvas, shift length, difficulty curve, palette
- `game/src/recipes.js` — the menu: ingredients and recipes, matching rules
- `game/src/orders.js` — the ticket board: spawning, patience, tips
- `game/src/kitchen.js` — the assembly plate, the wok, the serve counter
- `game/src/render.js` — every pixel: vector-drawn food, tickets, HUD
- `game/src/input.js` — mouse + keyboard mapping
- `game/src/audio.js` — synthesized WebAudio sounds
- `game/src/shots.js` — deterministic staged states for screenshots
- `game/src/main.js` — game state, update loop, action handling
- `main.ts` — the hand-in program (copies `game/` + `screenshots/` to
  `/output` and writes `dossier.json`)
- `vendor/makefun-game.ts` — vendored make.fun library, unchanged from the kit

## License

MIT — see [LICENSE](LICENSE).
