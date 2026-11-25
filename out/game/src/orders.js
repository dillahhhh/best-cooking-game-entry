// WARUNG RUSH — orders: the ticket board. Customers arrive, wait with a
// draining patience bar, and walk out (a strike) if nobody serves them.
import { RECIPES } from './recipes.js';
import { MAX_ORDERS, WRONG_PENALTY_SECONDS } from './config.js';

let nextOrderId = 1;

/** Patience (seconds) a fresh ticket starts with, shrinking as the shift heats up. */
export function patienceFor(elapsedSeconds) {
  const t = Math.min(elapsedSeconds / 180, 1);
  return 52 - 22 * t; // 52s early, ~30s late in the shift
}

/** Gap (seconds) between new tickets, shrinking as the shift heats up. */
export function spawnGapFor(elapsedSeconds) {
  const t = Math.min(elapsedSeconds / 180, 1);
  return 11 - 5 * t; // 11s early, ~6s late
}

/** Pick a recipe for a new ticket. Early tickets are short recipes; longer
 *  recipes (4 ingredients) join the menu as the shift heats up. */
export function pickRecipe(elapsedSeconds, rng) {
  const late = elapsedSeconds > 75;
  const pool = late ? RECIPES : RECIPES.filter((r) => r.needs.length <= 3);
  return pool[Math.floor(rng() * pool.length)];
}

export function makeOrder(elapsedSeconds, rng) {
  const recipe = pickRecipe(elapsedSeconds, rng);
  const patience = patienceFor(elapsedSeconds);
  return {
    id: nextOrderId,
    recipeId: recipe.id,
    name: recipe.name,
    needs: [...recipe.needs],
    patience,
    patienceMax: patience,
    // A friendly face: each customer gets a hue + a one-letter initial.
    hue: Math.floor(rng() * 360),
    initial: 'ABCDEFGHJKLMNPRSTW'[Math.floor(rng() * 20)],
  };
}

/** Create the board state. */
export function createBoard() {
  return { orders: [], spawnIn: 1.5 };
}

/** Fill the board at shift start so the first frame already shows tickets. */
export function seedBoard(board, rng) {
  nextOrderId = 1;
  board.orders = [makeOrder(0, rng), makeOrder(0, rng)];
  board.spawnIn = 6;
}

/**
 * Advance the board by `dt` seconds. Returns the ids of customers who walked
 * out this tick (each one is a strike).
 */
export function updateBoard(board, dt, elapsedSeconds, rng) {
  const walkedOut = [];
  for (const order of board.orders) order.patience -= dt;
  for (let i = board.orders.length - 1; i >= 0; i -= 1) {
    if (board.orders[i].patience <= 0) {
      walkedOut.push(board.orders[i].id);
      board.orders.splice(i, 1);
    }
  }
  board.spawnIn -= dt;
  if (board.spawnIn <= 0 && board.orders.length < MAX_ORDERS) {
    board.orders.push(makeOrder(elapsedSeconds, rng));
    board.spawnIn = spawnGapFor(elapsedSeconds);
  }
  return walkedOut;
}

/** Remove the ticket with `orderId` (served). Returns the order or null. */
export function takeOrder(board, orderId) {
  const at = board.orders.findIndex((o) => o.id === orderId);
  if (at === -1) return null;
  return board.orders.splice(at, 1)[0];
}

/** A wrong serve costs every waiting customer some patience. */
export function penaliseBoard(board) {
  for (const order of board.orders) {
    order.patience = Math.max(1, order.patience - WRONG_PENALTY_SECONDS);
  }
}

/** Tip for serving `order` now: base price plus a patience bonus. */
export function serveValue(order, combo) {
  const recipe = RECIPES.find((r) => r.id === order.recipeId);
  const patienceRatio = Math.max(0, order.patience / order.patienceMax);
  const tip = Math.round(4 + 12 * patienceRatio + 2 * Math.min(combo, 8));
  return { price: recipe.price, tip, total: recipe.price + tip };
}
