// WARUNG RUSH — main: game state, the update loop, and action handling.
// One shift: 180 seconds, tickets arrive on the board, the cook assembles
// plates, cooks them on the stove, and serves before patience runs out.
import { MAX_STRIKES, SHIFT_SECONDS } from './config.js';
import { createBoard, penaliseBoard, seedBoard, serveValue, takeOrder, updateBoard } from './orders.js';
import { addIngredient, canCook, canServe, createKitchen, finishNoCook, isBurning, plateRecipe, pullFromStove, startCooking, takeReadyPlate, trashPlate, updateKitchen } from './kitchen.js';
import { createAudio, playAdd, playBad, playBurnt, playClick, playCook, playServe, playStart, playTick, toggleMute, unlockAudio } from './audio.js';
import { clickAction, hoverTarget, keyAction } from './input.js';
import { draw, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createState(seed = 20261125) {
  const rng = mulberry32(seed);
  return {
    screen: SCREEN_TITLE,
    rng,
    now: 0,
    elapsed: 0,
    timeLeft: SHIFT_SECONDS,
    coins: 0,
    score: 0,
    combo: 0,
    bestCombo: 0,
    strikes: 0,
    served: 0,
    walkedOut: 0,
    board: createBoard(),
    kitchen: createKitchen(),
    audio: createAudio(),
    floaters: [],
    hover: null,
    lastTickSecond: -1,
  };
}

function addFloater(state, x, y, text, color) {
  state.floaters.push({ x, y, text, color, until: state.now + 1.4 });
  if (state.floaters.length > 8) state.floaters.shift();
}

function startShift(state) {
  const fresh = createState(Math.floor(Math.random() * 1e9));
  Object.assign(state, fresh);
  state.screen = SCREEN_PLAY;
  seedBoard(state.board, state.rng);
  playStart(state.audio);
}

function endShift(state, reason) {
  state.screen = SCREEN_OVER;
  state.endReason = reason;
}

/** Serve the ready plate. `orderId` targets one ticket; without it the first
 *  ticket wanting that dish is served. Returns true on a successful serve. */
function serveDish(state, orderId = null) {
  if (!canServe(state.kitchen)) return false;
  const recipeId = state.kitchen.servedDish;
  let order = null;
  if (orderId !== null) {
    order = state.board.orders.find((o) => o.id === orderId) ?? null;
    if (!order || order.recipeId !== recipeId) {
      penaliseBoard(state.board);
      addFloater(state, 1118, 470, 'Salah pelanggan! -3 dtk', '#ff8a7a');
      playBad(state.audio);
      return false;
    }
  } else {
    order = state.board.orders.find((o) => o.recipeId === recipeId) ?? null;
    if (!order) {
      addFloater(state, 1118, 470, 'Tak ada yang pesan ini', '#ff8a7a');
      playBad(state.audio);
      return false;
    }
  }
  takeOrder(state.board, order.id);
  takeReadyPlate(state.kitchen);
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  const value = serveValue(order, state.combo);
  state.coins += value.total;
  state.score += value.total * 10 + state.combo * 5;
  state.served += 1;
  addFloater(state, 1118, 440, `+${value.total} koin`, '#7CFC98');
  addFloater(state, 1118, 470, `tip +${value.tip}${state.combo > 1 ? ` • combo x${state.combo}` : ''}`, '#ffd34d');
  playServe(state.audio);
  return true;
}

/** One game action (click or key), applied to the current screen. */
export function applyAction(state, action) {
  if (!action) return;
  unlockAudio(state.audio);
  switch (action.kind) {
    case 'mute': {
      const muted = toggleMute(state.audio);
      state.kitchen.message = muted ? 'Suara dimatikan.' : 'Suara dinyalakan.';
      state.kitchen.messageUntil = state.now + 1.5;
      return;
    }
    case 'start': {
      if (state.screen === SCREEN_TITLE) startShift(state);
      return;
    }
    case 'restart': {
      if (state.screen === SCREEN_OVER) startShift(state);
      return;
    }
    case 'pause': {
      if (state.screen === SCREEN_PLAY) state.screen = SCREEN_PAUSED;
      else if (state.screen === SCREEN_PAUSED) state.screen = SCREEN_PLAY;
      return;
    }
    default: break;
  }
  if (state.screen !== SCREEN_PLAY) return;
  switch (action.kind) {
    case 'bin': {
      if (addIngredient(state.kitchen, action.id, state.now)) playAdd(state.audio);
      else playClick(state.audio);
      break;
    }
    case 'cook': {
      if (state.kitchen.stage === 'building') {
        const recipe = plateRecipe(state.kitchen);
        if (recipe && !recipe.cook) {
          if (finishNoCook(state.kitchen)) playCook(state.audio);
        } else if (canCook(state.kitchen)) {
          if (startCooking(state.kitchen)) playCook(state.audio);
        } else {
          playClick(state.audio);
        }
      } else if (isBurning(state.kitchen)) {
        // Pull the cooked plate off the stove onto the serve counter.
        if (pullFromStove(state.kitchen)) {
          state.kitchen.message = 'Diangkat ke meja saji!';
          state.kitchen.messageUntil = state.now + 2;
          playClick(state.audio);
        }
      }
      break;
    }
    case 'trash': {
      if (state.kitchen.plate.length > 0) {
        trashPlate(state.kitchen, state.now);
        state.combo = 0;
        playClick(state.audio);
      }
      break;
    }
    case 'serve': {
      serveDish(state, null);
      break;
    }
    case 'ticket': {
      if (canServe(state.kitchen)) serveDish(state, action.orderId);
      break;
    }
    case 'plate': {
      // Clicking the plate with a complete no-cook dish finishes it instantly.
      if (state.kitchen.stage === 'building') {
        const recipe = plateRecipe(state.kitchen);
        if (recipe && !recipe.cook) finishNoCook(state.kitchen);
      }
      break;
    }
    default: break;
  }
}

/** Advance the simulation by `dt` seconds (only while playing). */
export function update(state, dt) {
  if (state.screen !== SCREEN_PLAY) return;
  state.now += dt;
  state.elapsed += dt;
  state.timeLeft = Math.max(0, SHIFT_SECONDS - state.elapsed);
  const second = Math.floor(state.timeLeft);
  if (second !== state.lastTickSecond) {
    state.lastTickSecond = second;
    if (second <= 10 && second > 0) playTick(state.audio);
  }
  const walkedOut = updateBoard(state.board, dt, state.elapsed, state.rng);
  for (const id of walkedOut) {
    state.strikes += 1;
    state.walkedOut += 1;
    state.combo = 0;
    addFloater(state, 160, 300, 'Pelanggan pergi!', '#ff8a7a');
    playBad(state.audio);
  }
  const burnt = updateKitchen(state.kitchen, dt, state.now);
  if (burnt === 'burnt') {
    state.combo = 0;
    playBurnt(state.audio);
  }
  state.floaters = state.floaters.filter((f) => f.until > state.now);
  if (state.strikes >= MAX_STRIKES) endShift(state, 'strikes');
  else if (state.timeLeft <= 0) endShift(state, 'time');
}

/** Boot the game on `canvas`. Handles ?shot=cover|rush|serve|start for
 *  screenshots: those render a staged, deterministic real game state. */
export function boot(canvas) {
  const ctx = canvas.getContext('2d');
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const seed = Number(params.get('seed') ?? 20261125) || 20261125;
  const state = createState(seed);
  window.__warung = { state, applyAction, update, createState };
  if (shot) {
    state.screen = stageShot(shot, state);
    draw(ctx, state, state.screen, null);
    return state;
  }
  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    update(state, dt);
    draw(ctx, state, state.screen, state.hover);
    requestAnimationFrame(frame);
  }
  canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 1280;
    const y = ((event.clientY - rect.top) / rect.height) * 720;
    applyAction(state, clickAction(state, x, y));
  });
  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 1280;
    const y = ((event.clientY - rect.top) / rect.height) * 720;
    state.hover = hoverTarget(state, x, y);
  });
  window.addEventListener('keydown', (event) => {
    if ([' ', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.preventDefault();
    applyAction(state, keyAction(event.key));
  });
  requestAnimationFrame(frame);
  return state;
}
