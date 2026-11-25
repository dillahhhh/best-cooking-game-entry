// WARUNG RUSH — shots: deterministic staged states for the 4 screenshots.
// Each shot builds a REAL game state through the same constructors the live
// game uses (seeded RNG, real orders, real plate/wok state) and renders it
// with the same draw() — so every screenshot is a true render of the code.
import { SHIFT_SECONDS } from './config.js';
import { createBoard, makeOrder } from './orders.js';
import { createKitchen } from './kitchen.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

function stageOrders(state, specs) {
  // specs: [{ recipeId, patienceRatio }] — build real orders, then override
  // only the patience clock so the frame shows the intended rush.
  state.board = createBoard();
  for (const spec of specs) {
    const order = makeOrder(state.elapsed, state.rng);
    order.recipeId = spec.recipeId;
    const recipeName = { nasgor: 'Nasi Goreng', mieayam: 'Mie Ayam', sate: 'Sate Ayam', esteh: 'Es Teh', nasitelur: 'Nasi Telur' }[spec.recipeId];
    order.name = recipeName;
    const needs = { nasgor: ['nasi', 'telur', 'kecap', 'bawang'], mieayam: ['mie', 'ayam', 'sawi', 'bawang'], sate: ['ayam', 'kecap', 'sambal'], esteh: ['teh', 'es'], nasitelur: ['nasi', 'telur', 'sambal'] }[spec.recipeId];
    order.needs = [...needs];
    order.patience = order.patienceMax * spec.patienceRatio;
    state.board.orders.push(order);
  }
}

/**
 * Stage `state` for the named shot and return the screen to draw.
 * cover: mid-game, everything visible. rush: low patience, wok burning.
 * serve: a finished plate + coin popup. start: the title screen.
 */
export function stageShot(name, state) {
  state.now = 0;
  state.floaters = [];
  if (name === 'start') {
    state.screen = SCREEN_TITLE;
    return SCREEN_TITLE;
  }
  state.screen = SCREEN_PLAY;
  state.kitchen = createKitchen();
  if (name === 'cover') {
    state.elapsed = 48;
    state.timeLeft = SHIFT_SECONDS - 48;
    state.coins = 145;
    state.score = 1620;
    state.combo = 3;
    stageOrders(state, [
      { recipeId: 'nasgor', patienceRatio: 0.72 },
      { recipeId: 'mieayam', patienceRatio: 0.45 },
      { recipeId: 'esteh', patienceRatio: 0.9 },
    ]);
    // Mid-assembly: Nasi Goreng with 2 of 4 ingredients on the plate,
    // and a finished Es Teh already waiting on the serve counter.
    state.kitchen.plate = ['nasi', 'telur'];
    state.kitchen.stage = 'building';
    state.kitchen.servedDish = 'esteh';
    return SCREEN_PLAY;
  }
  if (name === 'rush') {
    state.elapsed = 133;
    state.timeLeft = SHIFT_SECONDS - 133;
    state.coins = 312;
    state.score = 3480;
    state.combo = 5;
    stageOrders(state, [
      { recipeId: 'mieayam', patienceRatio: 0.18 },
      { recipeId: 'sate', patienceRatio: 0.3 },
      { recipeId: 'nasgor', patienceRatio: 0.12 },
    ]);
    // Wok: Sate Ayam cooked and about to burn — the rush moment.
    state.kitchen.plate = ['ayam', 'kecap', 'sambal'];
    state.kitchen.stage = 'cooking';
    state.kitchen.cookTime = 4.6;
    state.kitchen.cookedRecipeId = 'sate';
    state.kitchen.message = 'MATANG! Angkat sebelum gosong!';
    state.kitchen.messageUntil = 999;
    return SCREEN_PLAY;
  }
  if (name === 'serve') {
    state.elapsed = 82;
    state.timeLeft = SHIFT_SECONDS - 82;
    state.coins = 210;
    state.score = 2310;
    state.combo = 4;
    stageOrders(state, [
      { recipeId: 'mieayam', patienceRatio: 0.55 },
      { recipeId: 'esteh', patienceRatio: 0.8 },
    ]);
    // Finished Mie Ayam on the serve counter + the coin popup of a serve.
    state.kitchen.servedDish = 'mieayam';
    state.floaters = [
      { x: 1118, y: 440, text: '+40 koin', color: '#7CFC98', until: 999 },
      { x: 1118, y: 470, text: 'tip +12 • combo x4', color: '#ffd34d', until: 999 },
    ];
    return SCREEN_PLAY;
  }
  if (name === 'over') {
    state.screen = SCREEN_OVER;
    state.elapsed = SHIFT_SECONDS;
    state.timeLeft = 0;
    state.coins = 428;
    state.score = 5120;
    state.served = 14;
    state.walkedOut = 2;
    state.strikes = 2;
    return SCREEN_OVER;
  }
  return SCREEN_TITLE;
}
