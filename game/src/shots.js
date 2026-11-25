// WARUNG RUSH — shots: deterministic staged states for the 4 screenshots.
// Each shot builds a REAL game state through the same constructors the live
// game uses (seeded RNG, real orders, real plate/wok state) and renders it
// with the same draw() — so every screenshot is a true render of the code.
import { SHIFT_SECONDS } from './config.js';
import { createBoard, makeOrder } from './orders.js';
import { createKitchen } from './kitchen.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

function stageOrders(state, specs) {
  // specs: [{ recipeId, patienceRatio, modifier? }] — build real orders,
  // then override only the patience clock (and modifier) so the frame shows
  // the intended rush.
  state.board = createBoard();
  for (const spec of specs) {
    const order = makeOrder(state.elapsed, state.rng);
    order.recipeId = spec.recipeId;
    const recipeName = { nasgor: 'Nasi Goreng', mieayam: 'Mie Ayam', sate: 'Sate Ayam', esteh: 'Es Teh', nasitelur: 'Nasi Telur' }[spec.recipeId];
    order.name = recipeName;
    const needs = { nasgor: ['nasi', 'telur', 'kecap', 'bawang'], mieayam: ['mie', 'ayam', 'sawi', 'bawang'], sate: ['ayam', 'kecap', 'sambal'], esteh: ['teh', 'es'], nasitelur: ['nasi', 'telur', 'sambal'] }[spec.recipeId];
    order.needs = [...needs];
    if (spec.modifier === 'PEDAS' && !order.needs.includes('sambal')) {
      order.needs = order.needs.includes('bawang')
        ? order.needs.map((id) => (id === 'bawang' ? 'sambal' : id))
        : [...order.needs, 'sambal'];
    }
    if (spec.modifier === 'NO BAWANG') order.needs = order.needs.filter((id) => id !== 'bawang');
    if (spec.modifier) order.modifier = spec.modifier;
    if (spec.modifier === 'PRIORITAS') { order.patienceMax *= 0.7; }
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
    // THE BUSIEST MOMENT: Nasi Goreng full in the wok (flames + steam),
    // Mie Ayam half-assembled on the plate AT THE SAME TIME, a finished
    // Es Teh on the serve counter (SAJIKAN green), one ticket nearly out
    // of patience, combo x5, and a PRIORITAS badge on the third ticket.
    state.elapsed = 48;
    state.timeLeft = SHIFT_SECONDS - 48;
    state.coins = 145;
    state.score = 1620;
    state.served = 5;
    state.combo = 5;
    stageOrders(state, [
      { recipeId: 'nasgor', patienceRatio: 0.12 },
      { recipeId: 'mieayam', patienceRatio: 0.45 },
      { recipeId: 'esteh', patienceRatio: 0.9, modifier: 'PRIORITAS' },
    ]);
    state.kitchen.wok = ['nasi', 'telur', 'kecap', 'bawang'];
    state.kitchen.wokRecipeId = 'nasgor';
    state.kitchen.wokStage = 'cooking';
    state.kitchen.cookTime = 2.0;
    state.kitchen.cookedRecipeId = null;
    state.kitchen.plate = ['mie', 'ayam'];
    state.kitchen.stage = 'building';
    state.kitchen.servedDish = 'esteh';
    return SCREEN_PLAY;
  }
  if (name === 'rush') {
    state.elapsed = 133;
    state.timeLeft = SHIFT_SECONDS - 133;
    state.coins = 312;
    state.score = 3480;
    state.served = 9;
    state.combo = 5;
    stageOrders(state, [
      { recipeId: 'mieayam', patienceRatio: 0.18 },
      { recipeId: 'sate', patienceRatio: 0.3 },
      { recipeId: 'nasgor', patienceRatio: 0.12 },
    ]);
    // Wok: Sate Ayam cooked and about to burn — the rush moment.
    // The plate is already assembling the next dish (parallel pipeline).
    state.kitchen.wok = ['ayam', 'kecap', 'sambal'];
    state.kitchen.wokRecipeId = 'sate';
    state.kitchen.wokStage = 'cooking';
    state.kitchen.cookTime = 4.6;
    state.kitchen.cookedRecipeId = 'sate';
    state.kitchen.plate = ['nasi', 'telur'];
    state.kitchen.stage = 'building';
    state.kitchen.message = 'MATANG! Angkat sebelum gosong!';
    state.kitchen.messageUntil = 999;
    return SCREEN_PLAY;
  }
  if (name === 'serve') {
    state.elapsed = 82;
    state.timeLeft = SHIFT_SECONDS - 82;
    state.coins = 210;
    state.score = 2310;
    state.served = 4;
    state.combo = 4;
    stageOrders(state, [
      { recipeId: 'mieayam', patienceRatio: 0.55 },
      { recipeId: 'esteh', patienceRatio: 0.8 },
    ]);
    // Finished Mie Ayam on the serve counter + the coin popup of a serve.
    state.kitchen.servedDish = 'mieayam';
    state.floaters = [
      { x: 1118, y: 440, text: '+40 koin', color: '#7CFC98', until: 1.2 },
      { x: 1118, y: 470, text: 'tip +12 • combo x4', color: '#ffd34d', until: 1.2 },
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
