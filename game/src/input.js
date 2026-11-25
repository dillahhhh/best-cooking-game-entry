// WARUNG RUSH — input: mouse clicks and keyboard, mapped to game actions
// through the layout rects from render.js. No action fires twice per press.
import { layout } from './render.js';
import { INGREDIENTS } from './recipes.js';

function pointIn(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

/**
 * Translate a click at canvas coordinates (x, y) into an action object:
 * { kind: 'bin', id } | { kind: 'cook' } | { kind: 'trash' } | { kind: 'serve' }
 * | { kind: 'ticket', orderId } | { kind: 'mute' } | { kind: 'start' } | null
 */
export function clickAction(state, x, y) {
  const L = layout();
  if (pointIn(L.muteBtn, x, y)) return { kind: 'mute' };
  if (state.screen === 'title' && pointIn(L.startBtn, x, y)) return { kind: 'start' };
  if (state.screen !== 'play') return null;
  for (const bin of L.bins) {
    if (pointIn(bin, x, y)) return { kind: 'bin', id: bin.id };
  }
  if (pointIn(L.cookBtn, x, y)) return { kind: 'cook' };
  if (pointIn(L.trashBtn, x, y)) return { kind: 'trash' };
  if (pointIn(L.serveBtn, x, y)) return { kind: 'serve' };
  for (let i = 0; i < state.board.orders.length; i += 1) {
    if (pointIn(L.tickets[i], x, y)) return { kind: 'ticket', orderId: state.board.orders[i].id };
  }
  if (pointIn(L.plate, x, y)) return { kind: 'plate' };
  if (pointIn(L.stove, x, y)) return { kind: 'cook' };
  return null;
}

/** Hover target for highlighting ingredient bins. */
export function hoverTarget(state, x, y) {
  if (state.screen !== 'play') return null;
  const L = layout();
  for (const bin of L.bins) {
    if (pointIn(bin, x, y)) return { kind: 'bin', id: bin.id };
  }
  return null;
}

/**
 * Translate a keydown into an action object. Returns null for unbound keys.
 * Ingredient keys 1..9,0 map to the ingredient list in counter order.
 */
export function keyAction(key) {
  const lower = key.toLowerCase();
  if (lower === ' ') return { kind: 'start' };
  if (lower === 'm') return { kind: 'cook' };
  if (lower === 's') return { kind: 'serve' };
  if (lower === 't') return { kind: 'trash' };
  if (lower === 'p') return { kind: 'pause' };
  if (lower === 'r') return { kind: 'restart' };
  if (lower === 'escape') return { kind: 'pause' };
  const ing = INGREDIENTS.find((i) => i.key === key);
  if (ing) return { kind: 'bin', id: ing.id };
  return null;
}
