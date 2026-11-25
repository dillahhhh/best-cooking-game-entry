// WARUNG RUSH — render: every pixel is drawn with canvas 2D vector shapes.
// No images, no emoji, no borrowed art. Food is drawn as distinct coloured
// shapes per ingredient so each dish reads at a glance.
import { COLORS, H, W } from './config.js';
import { INGREDIENTS, INGREDIENT_BY_ID, RECIPE_BY_ID } from './recipes.js';
import { cookProgress, isBurning, plateHint } from './kitchen.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

/** Fixed layout rects, shared with input.js (hit testing). */
export function layout() {
  const bins = INGREDIENTS.map((ing, i) => ({
    id: ing.id,
    x: 324 + (i % 5) * 188,
    y: 92 + Math.floor(i / 5) * 84,
    w: 176,
    h: 72,
  }));
  return {
    topBar: { x: 0, y: 0, w: W, h: 64 },
    muteBtn: { x: 1216, y: 12, w: 48, h: 40 },
    board: { x: 16, y: 80, w: 288, h: 560 },
    tickets: [0, 1, 2].map((i) => ({ x: 28, y: 128 + i * 168, w: 264, h: 156 })),
    bins,
    stove: { x: 324, y: 288, w: 300, h: 200 },
    plate: { x: 648, y: 288, w: 300, h: 200 },
    serveCounter: { x: 972, y: 288, w: 292, h: 200 },
    cookBtn: { x: 324, y: 500, w: 144, h: 52 },
    trashBtn: { x: 480, y: 500, w: 144, h: 52 },
    serveBtn: { x: 972, y: 500, w: 292, h: 52 },
    bottomBar: { x: 0, y: 656, w: W, h: 64 },
    startBtn: { x: 490, y: 520, w: 300, h: 64 },
  };
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, weight = 700, align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
}

function fmtTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Draw one ingredient as a vector shape, centred at (cx, cy), radius r. */
export function drawIngredientShape(ctx, id, cx, cy, r) {
  const ing = INGREDIENT_BY_ID[id];
  ctx.save();
  ctx.lineWidth = 2;
  switch (id) {
    case 'nasi': { // white rice mound with grains
      ctx.fillStyle = ing.color; ctx.strokeStyle = ing.edge;
      ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.25, r, r * 0.62, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#c9b98a'; ctx.beginPath();
      for (let i = -2; i <= 2; i += 1) { ctx.moveTo(cx + i * r * 0.32, cy - r * 0.1); ctx.lineTo(cx + i * r * 0.32 + 3, cy + r * 0.3); }
      ctx.stroke(); break; }
    case 'mie': { // wavy yellow noodles
      ctx.strokeStyle = ing.color; ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (let row = -1; row <= 1; row += 1) {
        ctx.beginPath();
        for (let x = -r; x <= r; x += 4) ctx.lineTo(cx + x, cy + row * r * 0.45 + Math.sin(x * 0.35) * r * 0.18);
        ctx.stroke();
      } break; }
    case 'ayam': { // chicken drumstick
      ctx.fillStyle = ing.color; ctx.strokeStyle = ing.edge;
      ctx.beginPath(); ctx.ellipse(cx - r * 0.1, cy, r * 0.75, r * 0.55, -0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#f5e6c8'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(cx + r * 0.5, cy + r * 0.3); ctx.lineTo(cx + r * 1.05, cy + r * 0.75); ctx.stroke();
      ctx.fillStyle = '#f5e6c8'; ctx.beginPath(); ctx.arc(cx + r * 1.05, cy + r * 0.8, r * 0.22, 0, Math.PI * 2); ctx.fill(); break; }
    case 'telur': { // fried egg: white + yolk
      ctx.fillStyle = ing.color; ctx.strokeStyle = ing.edge;
      ctx.beginPath(); ctx.ellipse(cx, cy, r * 0.95, r * 0.7, 0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f2a007'; ctx.beginPath(); ctx.arc(cx, cy, r * 0.42, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.arc(cx - r * 0.12, cy - r * 0.12, r * 0.18, 0, Math.PI * 2); ctx.fill(); break; }
    case 'sawi': { // green mustard leaves
      ctx.fillStyle = ing.color; ctx.strokeStyle = ing.edge;
      for (const dx of [-0.45, 0.1, 0.55]) {
        ctx.beginPath(); ctx.ellipse(cx + dx * r, cy + (dx > 0 ? -r * 0.15 : r * 0.1), r * 0.42, r * 0.62, dx * 0.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } break; }
    case 'bawang': { // shallot rings
      ctx.strokeStyle = ing.color; ctx.lineWidth = 5;
      for (const rad of [0.85, 0.55, 0.28]) { ctx.beginPath(); ctx.arc(cx, cy, r * rad, 0, Math.PI * 2); ctx.stroke(); }
      ctx.strokeStyle = ing.edge; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2); ctx.stroke(); break; }
    case 'kecap': { // dark soy sauce bottle pour
      ctx.fillStyle = ing.color; ctx.strokeStyle = ing.edge;
      rr(ctx, cx - r * 0.32, cy - r * 0.7, r * 0.64, r * 1.15, r * 0.2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#c98f4a'; ctx.fillRect(cx - r * 0.2, cy - r * 0.95, r * 0.4, r * 0.3);
      ctx.fillStyle = '#6b3f16'; ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.85, r * 0.55, r * 0.2, 0, 0, Math.PI * 2); ctx.fill(); break; }
    case 'sambal': { // red chilli bowl
      ctx.fillStyle = '#fff'; ctx.strokeStyle = ing.edge;
      ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.35, r * 0.95, r * 0.4, 0, 0, Math.PI); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = ing.color; ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.2, r * 0.8, r * 0.32, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#8f1f14'; ctx.beginPath(); ctx.ellipse(cx - r * 0.3, cy + r * 0.05, r * 0.18, r * 0.1, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + r * 0.3, cy + r * 0.1, r * 0.15, r * 0.08, 0, 0, Math.PI * 2); ctx.fill(); break; }
    case 'teh': { // glass of tea
      ctx.fillStyle = '#f5e6c8'; ctx.strokeStyle = ing.edge;
      ctx.beginPath(); ctx.moveTo(cx - r * 0.6, cy - r * 0.7); ctx.lineTo(cx + r * 0.6, cy - r * 0.7); ctx.lineTo(cx + r * 0.4, cy + r * 0.8); ctx.lineTo(cx - r * 0.4, cy + r * 0.8); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = ing.color; ctx.beginPath(); ctx.moveTo(cx - r * 0.5, cy - r * 0.35); ctx.lineTo(cx + r * 0.5, cy - r * 0.35); ctx.lineTo(cx + r * 0.36, cy + r * 0.65); ctx.lineTo(cx - r * 0.36, cy + r * 0.65); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#8f4d12'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx + r * 0.2, cy - r * 0.9); ctx.lineTo(cx + r * 0.45, cy - r * 0.3); ctx.stroke(); break; }
    case 'es': { // ice cubes
      ctx.fillStyle = ing.color; ctx.strokeStyle = ing.edge;
      for (const [dx, dy, rot] of [[-0.35, 0.15, 0.3], [0.3, -0.1, -0.25], [0.05, 0.45, 0.1]]) {
        ctx.save(); ctx.translate(cx + dx * r, cy + dy * r); ctx.rotate(rot);
        ctx.fillRect(-r * 0.32, -r * 0.32, r * 0.64, r * 0.64); ctx.strokeRect(-r * 0.32, -r * 0.32, r * 0.64, r * 0.64);
        ctx.restore();
      } break; }
    default: break;
  }
  ctx.restore();
}

/** A finished dish on a plate: the plate plus its ingredients, small. */
function drawDish(ctx, recipeId, cx, cy, r) {
  const recipe = RECIPE_BY_ID[recipeId];
  ctx.save();
  ctx.fillStyle = COLORS.plate; ctx.strokeStyle = COLORS.plateEdge; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.55, r * 1.15, r * 0.4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = recipe.color;
  ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.2, r * 0.85, r * 0.5, 0, 0, Math.PI * 2); ctx.fill();
  const ids = recipe.needs;
  ids.forEach((id, i) => {
    const a = (i / ids.length) * Math.PI * 2 - Math.PI / 2;
    drawIngredientShape(ctx, id, cx + Math.cos(a) * r * 0.42, cy + r * 0.15 + Math.sin(a) * r * 0.22, r * 0.3);
  });
  ctx.restore();
}

function drawPatienceBar(ctx, x, y, w, ratio) {
  ctx.fillStyle = '#e5d5b8'; rr(ctx, x, y, w, 12, 6); ctx.fill();
  const color = ratio > 0.5 ? COLORS.ok : ratio > 0.25 ? COLORS.warn : COLORS.bad;
  ctx.fillStyle = color;
  if (ratio > 0.02) { rr(ctx, x, y, Math.max(10, w * ratio), 12, 6); ctx.fill(); }
}

function drawTicket(ctx, order, rect, index) {
  ctx.save();
  ctx.fillStyle = COLORS.ticket; ctx.strokeStyle = COLORS.ticketEdge; ctx.lineWidth = 2;
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 10); ctx.fill(); ctx.stroke();
  // Customer face.
  ctx.fillStyle = `hsl(${order.hue} 55% 55%)`;
  ctx.beginPath(); ctx.arc(rect.x + 34, rect.y + 34, 22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(rect.x + 27, rect.y + 30, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(rect.x + 41, rect.y + 30, 3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(rect.x + 34, rect.y + 38, 8, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  text(ctx, `#${index + 1}`, rect.x + 64, rect.y + 26, 13, COLORS.muted, 700);
  text(ctx, order.name, rect.x + 64, rect.y + 48, 21, COLORS.ink, 800);
  // Required ingredients, as mini shapes + labels.
  const needW = (rect.w - 20) / order.needs.length;
  order.needs.forEach((id, i) => {
    const cx = rect.x + 10 + needW * (i + 0.5);
    drawIngredientShape(ctx, id, cx, rect.y + 92, 20);
    text(ctx, INGREDIENT_BY_ID[id].label, cx, rect.y + 126, 12, COLORS.ink, 700, 'center');
  });
  drawPatienceBar(ctx, rect.x + 12, rect.y + rect.h - 20, rect.w - 24, Math.max(0, order.patience / order.patienceMax));
  text(ctx, order.patience <= 10 ? 'BURU-BURU!' : 'menunggu…', rect.x + rect.w - 12, rect.y + 26, 11, order.patience <= 10 ? COLORS.bad : COLORS.muted, 700, 'right');
  ctx.restore();
}

function drawBin(ctx, bin, hover) {
  const ing = INGREDIENT_BY_ID[bin.id];
  ctx.save();
  ctx.fillStyle = hover ? '#ffe9b8' : '#fff8e6'; ctx.strokeStyle = COLORS.boardEdge; ctx.lineWidth = 2;
  rr(ctx, bin.x, bin.y, bin.w, bin.h, 10); ctx.fill(); ctx.stroke();
  drawIngredientShape(ctx, bin.id, bin.x + 36, bin.y + 36, 22);
  text(ctx, ing.label, bin.x + 66, bin.y + 32, 17, COLORS.ink, 800);
  text(ctx, `[ ${ing.key} ]`, bin.x + 66, bin.y + 54, 13, COLORS.muted, 700);
  ctx.restore();
}

function drawButton(ctx, rect, label, sub, enabled, bg, edge) {
  ctx.save();
  ctx.fillStyle = enabled ? bg : '#9a8f80'; ctx.strokeStyle = edge; ctx.lineWidth = 2;
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 10); ctx.fill(); ctx.stroke();
  text(ctx, label, rect.x + rect.w / 2, rect.y + (sub ? 26 : 34), sub ? 19 : 20, '#fff', 800, 'center');
  if (sub) text(ctx, sub, rect.x + rect.w / 2, rect.y + 44, 12, '#ffe9d6', 700, 'center');
  ctx.restore();
}

/** The whole frame. `state` is the game state from main.js. */
export function draw(ctx, state, screen, hover) {
  const L = layout();
  ctx.clearRect(0, 0, W, H);
  // Wall + floor.
  ctx.fillStyle = COLORS.wall; ctx.fillRect(0, 0, W, 656);
  ctx.fillStyle = COLORS.wallStripe;
  for (let x = 0; x < W; x += 96) ctx.fillRect(x, 64, 48, 4);
  ctx.fillStyle = COLORS.floor; ctx.fillRect(0, 656, W, 64);
  // Warung sign strip.
  ctx.fillStyle = '#7c2d12'; ctx.fillRect(0, 0, W, 64);
  ctx.fillStyle = '#ffd34d';
  text(ctx, 'WARUNG RUSH', 20, 42, 30, '#ffd34d', 800);
  text(ctx, 'dapur kaki lima', 300, 40, 15, '#ffe9b8', 600);
  // Timer.
  const timeLeft = state.timeLeft;
  const lowTime = timeLeft <= 30;
  ctx.fillStyle = lowTime ? '#ff6b5e' : '#fff6e0';
  rr(ctx, 560, 10, 160, 44, 10); ctx.fill();
  text(ctx, `⏱ ${fmtTime(timeLeft)}`, 640, 42, 26, lowTime ? COLORS.bad : COLORS.ink, 800, 'center');
  // Coins / score / combo / strikes.
  text(ctx, `Koin ${state.coins}`, 760, 40, 22, '#ffd34d', 800);
  text(ctx, `Skor ${state.score}`, 900, 40, 22, '#fff6e0', 800);
  text(ctx, state.combo > 1 ? `Combo x${state.combo}` : '', 1030, 40, 20, '#7CFC98', 800);
  text(ctx, '✖'.repeat(state.strikes), 1140, 40, 20, '#ff8a7a', 800);
  drawButton(ctx, L.muteBtn, state.audio.muted ? '🔇' : '🔊', '', true, '#5a3a22', '#3a2415');

  // Order board.
  ctx.fillStyle = COLORS.board; ctx.strokeStyle = COLORS.boardEdge; ctx.lineWidth = 3;
  rr(ctx, L.board.x, L.board.y, L.board.w, L.board.h, 12); ctx.fill(); ctx.stroke();
  text(ctx, 'PESANAN', L.board.x + 16, L.board.y + 34, 22, COLORS.ink, 800);
  text(ctx, `${state.board.orders.length}/${3} pelanggan`, L.board.x + L.board.w - 16, L.board.y + 32, 13, COLORS.muted, 700, 'right');
  state.board.orders.forEach((order, i) => drawTicket(ctx, order, L.tickets[i], i));
  if (state.board.orders.length === 0) {
    text(ctx, 'Semua pelanggan terlayani!', L.board.x + L.board.w / 2, L.board.y + 300, 16, COLORS.muted, 700, 'center');
  }

  // Counter bins.
  text(ctx, 'COUNTER BAHAN — klik untuk merakit', 324, 84, 15, COLORS.ink, 800);
  L.bins.forEach((bin) => drawBin(ctx, bin, hover && hover.kind === 'bin' && hover.id === bin.id));

  // Stove (wok).
  ctx.fillStyle = COLORS.counter; ctx.strokeStyle = COLORS.counterEdge; ctx.lineWidth = 2;
  rr(ctx, L.stove.x, L.stove.y, L.stove.w, L.stove.h, 12); ctx.fill(); ctx.stroke();
  text(ctx, 'KOMPOR', L.stove.x + 16, L.stove.y + 28, 16, '#fff', 800);
  const cooking = state.kitchen.stage === 'cooking';
  const burnt = state.kitchen.stage === 'burnt';
  ctx.fillStyle = cooking ? COLORS.stoveHot : COLORS.stove;
  ctx.beginPath(); ctx.ellipse(L.stove.x + 150, L.stove.y + 105, 105, 34, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.ellipse(L.stove.x + 150, L.stove.y + 98, 88, 26, 0, 0, Math.PI * 2); ctx.fill();
  if (cooking || burnt) {
    const prog = cookProgress(state.kitchen);
    const col = burnt ? COLORS.bad : isBurning(state.kitchen) ? '#ff7a1a' : COLORS.gold;
    ctx.fillStyle = '#5a3a22'; rr(ctx, L.stove.x + 40, L.stove.y + 150, 220, 16, 8); ctx.fill();
    ctx.fillStyle = col; rr(ctx, L.stove.x + 40, L.stove.y + 150, 220 * Math.min(prog, 1), 16, 8); ctx.fill();
    text(ctx, burnt ? 'GOSONG!' : isBurning(state.kitchen) ? 'MATANG — ANGKAT!' : 'memasak…', L.stove.x + 150, L.stove.y + 190, 16, burnt ? '#ffb3ab' : '#fff', 800, 'center');
    if (cooking && state.kitchen.plate.length > 0) {
      state.kitchen.plate.forEach((id, i) => drawIngredientShape(ctx, id, L.stove.x + 90 + i * 40, L.stove.y + 96, 15));
    }
  } else {
    text(ctx, 'wajan kosong', L.stove.x + 150, L.stove.y + 175, 15, '#ffe9d6', 700, 'center');
  }

  // Assembly plate.
  ctx.fillStyle = COLORS.counter; ctx.strokeStyle = COLORS.counterEdge; ctx.lineWidth = 2;
  rr(ctx, L.plate.x, L.plate.y, L.plate.w, L.plate.h, 12); ctx.fill(); ctx.stroke();
  text(ctx, 'PIRING RAKITAN', L.plate.x + 16, L.plate.y + 28, 16, '#fff', 800);
  ctx.fillStyle = COLORS.plate; ctx.strokeStyle = COLORS.plateEdge; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(L.plate.x + 150, L.plate.y + 125, 105, 42, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  if (state.kitchen.plate.length === 0) {
    text(ctx, state.kitchen.stage === 'cooking' ? 'di wajan…' : 'piring kosong', L.plate.x + 150, L.plate.y + 130, 15, COLORS.muted, 700, 'center');
  } else if (state.kitchen.stage === 'burnt') {
    ctx.fillStyle = '#1c1c1c';
    ctx.beginPath(); ctx.ellipse(L.plate.x + 150, L.plate.y + 122, 80, 28, 0, 0, Math.PI * 2); ctx.fill();
  } else if (state.kitchen.stage === 'cooking') {
    text(ctx, 'di wajan…', L.plate.x + 150, L.plate.y + 130, 15, COLORS.muted, 700, 'center');
  } else {
    state.kitchen.plate.forEach((id, i) => {
      const a = (i / Math.max(state.kitchen.plate.length, 1)) * Math.PI * 2 - Math.PI / 2;
      drawIngredientShape(ctx, id, L.plate.x + 150 + Math.cos(a) * 52, L.plate.y + 122 + Math.sin(a) * 20, 24);
    });
  }
  text(ctx, plateHint(state.kitchen), L.plate.x + 150, L.plate.y + 190, 14, '#ffe9d6', 700, 'center');

  // Serve counter.
  ctx.fillStyle = COLORS.counter; ctx.strokeStyle = COLORS.counterEdge; ctx.lineWidth = 2;
  rr(ctx, L.serveCounter.x, L.serveCounter.y, L.serveCounter.w, L.serveCounter.h, 12); ctx.fill(); ctx.stroke();
  text(ctx, 'MEJA SAJI', L.serveCounter.x + 16, L.serveCounter.y + 28, 16, '#fff', 800);
  if (state.kitchen.servedDish) {
    drawDish(ctx, state.kitchen.servedDish, L.serveCounter.x + 146, L.serveCounter.y + 95, 46);
    text(ctx, RECIPE_BY_ID[state.kitchen.servedDish].name, L.serveCounter.x + 146, L.serveCounter.y + 185, 18, '#fff', 800, 'center');
  } else {
    text(ctx, 'belum ada hidangan', L.serveCounter.x + 146, L.serveCounter.y + 120, 15, '#ffe9d6', 700, 'center');
  }

  // Action buttons.
  const canCookNow = state.kitchen.stage === 'building' && state.kitchen.plate.length > 0;
  const burning = isBurning(state.kitchen);
  drawButton(ctx, L.cookBtn, burning ? 'ANGKAT [M]' : 'MASAK [M]', burning ? 'ke meja saji' : canCookNow ? 'ke kompor' : 'rakit dulu', canCookNow || burning, COLORS.button, COLORS.buttonEdge);
  drawButton(ctx, L.trashBtn, 'BUANG [T]', 'kosongkan piring', state.kitchen.plate.length > 0, '#7a5a3a', '#4a3220');
  drawButton(ctx, L.serveBtn, 'SAJIKAN [S]', state.kitchen.servedDish ? 'ke pelanggan' : 'belum siap', state.kitchen.servedDish !== null, COLORS.serve, COLORS.serveEdge);

  // Kitchen message line.
  if (state.kitchen.message && state.now < state.kitchen.messageUntil) {
    ctx.fillStyle = '#fff6e0'; rr(ctx, 324, 566, 940, 34, 8); ctx.fill();
    text(ctx, state.kitchen.message, 804, 589, 16, COLORS.bad, 800, 'center');
  }

  // Floating score popups.
  for (const f of state.floaters) {
    const alpha = Math.max(0, Math.min(1, (f.until - state.now) / 0.8));
    ctx.globalAlpha = alpha;
    text(ctx, f.text, f.x, f.y - (f.until - state.now) * 30, 22, f.color, 800, 'center');
    ctx.globalAlpha = 1;
  }

  // Bottom hint bar.
  ctx.fillStyle = '#3a2415'; ctx.fillRect(0, 656, W, 64);
  text(ctx, 'Klik bahan → rakit di piring → MASAK → SAJIKAN ke tiket yang cocok. Bahan salah = pelanggan makin tidak sabar.', 20, 682, 15, '#ffe9b8', 600);
  text(ctx, '1-9,0 bahan   •   M masak   •   S sajikan   •   T buang   •   P jeda   •   klik tiket = sajikan ke pelanggan itu', 20, 706, 14, '#d8b98a', 600);

  // Overlays.
  if (screen === SCREEN_TITLE) drawTitle(ctx, state);
  if (screen === SCREEN_PAUSED) drawPaused(ctx);
  if (screen === SCREEN_OVER) drawOver(ctx, state);
}

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(43,26,18,0.82)'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff6e0'; rr(ctx, 290, 90, 700, 470, 16); ctx.fill();
  ctx.strokeStyle = COLORS.boardEdge; ctx.lineWidth = 3; rr(ctx, 290, 90, 700, 470, 16); ctx.stroke();
  text(ctx, 'WARUNG RUSH', 640, 170, 54, COLORS.accent, 800, 'center');
  text(ctx, 'Dapur kaki lima paling sibuk sedesa!', 640, 210, 20, COLORS.ink, 700, 'center');
  const lines = [
    '• Klik bahan di counter untuk merakit hidangan di piring.',
    '• Hidangan lengkap → MASAK di kompor. Jangan sampai gosong!',
    '• Klik SAJIKAN (atau klik tiketnya) sebelum kesabaran habis.',
    '• Sajikan cepat = tip besar. 3 pelanggan pergi = shift berakhir.',
    '• Shift 180 detik. Order makin cepat & makin panjang.',
  ];
  lines.forEach((line, i) => text(ctx, line, 340, 260 + i * 32, 17, COLORS.ink, 600));
  const L = layout();
  drawButton(ctx, L.startBtn, 'MULAI SHIFT', 'Spasi / klik', true, COLORS.button, COLORS.buttonEdge);
  text(ctx, 'Menu: Nasi Goreng • Mie Ayam • Sate Ayam • Es Teh • Nasi Telur', 640, 620, 15, COLORS.muted, 700, 'center');
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(43,26,18,0.7)'; ctx.fillRect(0, 0, W, H);
  text(ctx, 'JEDA', 640, 340, 64, '#fff6e0', 800, 'center');
  text(ctx, 'Tekan P untuk lanjut', 640, 390, 20, '#ffe9b8', 700, 'center');
}

function drawOver(ctx, state) {
  ctx.fillStyle = 'rgba(43,26,18,0.85)'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff6e0'; rr(ctx, 340, 150, 600, 380, 16); ctx.fill();
  ctx.strokeStyle = COLORS.boardEdge; ctx.lineWidth = 3; rr(ctx, 340, 150, 600, 380, 16); ctx.stroke();
  text(ctx, state.strikes >= 3 ? 'SHIFT BERAKHIR' : 'SHIFT SELESAI!', 640, 230, 40, COLORS.accent, 800, 'center');
  text(ctx, state.strikes >= 3 ? 'Terlalu banyak pelanggan pergi.' : 'Warung tutup — kerja bagus!', 640, 272, 18, COLORS.ink, 700, 'center');
  text(ctx, `Hidangan disajikan: ${state.served}`, 640, 330, 22, COLORS.ink, 700, 'center');
  text(ctx, `Pelanggan pergi: ${state.walkedOut}`, 640, 366, 22, COLORS.ink, 700, 'center');
  text(ctx, `Koin: ${state.coins}`, 640, 410, 26, COLORS.accent, 800, 'center');
  text(ctx, `Skor akhir: ${state.score}`, 640, 452, 26, COLORS.ink, 800, 'center');
  text(ctx, 'Tekan R untuk main lagi', 640, 500, 17, COLORS.muted, 700, 'center');
}
