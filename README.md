# WARUNG RUSH — best-cooking-game-20261125-0137

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/dillahhhh/best-cooking-game-entry/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/dillahhhh/best-cooking-game-entry/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**WARUNG RUSH** is an original one-screen Indonesian street-food rush cooking game.
You run the busiest warung in the village: tickets arrive on the order board,
you assemble dishes from ten ingredients on the counter, cook them on the wok
before they burn, and serve before each customer's patience runs out.

## How to play

- **Click ingredients** on the counter (or press `1–9`, `0`) to assemble a dish
  on the plate. Each ticket shows exactly what it wants.
- **MASAK (`M`)** sends a complete plate into the wok — and the plate is
  empty again at once, so you assemble the NEXT dish while the first one
  cooks. Pull the wok dish off with **ANGKAT (`M`)** once it is cooked —
  leave it too long and it burns. Cook A → assemble B → lift A → serve A.
- **SAJIKAN (`S`)**, or click the ticket itself, serves the finished dish on
  the serve counter. Fast serves earn bigger tips; serving in a row builds a
  combo that raises every tip.
- Watch the ticket badges: **PEDAS** swaps bawang for sambal, **NO BAWANG**
  drops bawang, **PRIORITAS** pays 1.5× tip but walks out faster. Re-click
  the last ingredient to take it back off the plate; `P` pauses (also
  auto-pauses when the tab loses focus).
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
