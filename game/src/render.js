// WARUNG RUSH — render: every pixel is drawn with canvas 2D vector shapes.
// No images, no emoji, no borrowed art. Food is drawn as distinct coloured
// shapes per ingredient so each dish reads at a glance.
import { COLORS, H, W } from './config.js';
import { INGREDIENTS, INGREDIENT_BY_ID, RECIPE_BY_ID } from './recipes.js';
import { burnCountdown, canCook, cookProgress, isBurning, isWokBurnt, plateHint } from './kitchen.js';

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
/** A finished dish on a plate: big, layered, instantly recognisable per recipe. */
function drawDish(ctx, recipeId, cx, cy, r) {
  const recipe = RECIPE_BY_ID[recipeId];
  ctx.save();
  // Plate with a rim + shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.72, r * 1.18, r * 0.34, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = COLORS.plate; ctx.strokeStyle = COLORS.plateEdge; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.55, r * 1.15, r * 0.42, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#e8ddc8'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.55, r * 0.9, r * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
  // Food mound, layered by recipe.
  ctx.fillStyle = recipe.color;
  ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.18, r * 0.92, r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath(); ctx.ellipse(cx - r * 0.2, cy - r * 0.05, r * 0.5, r * 0.25, 0, 0, Math.PI * 2); ctx.fill();
  const ids = recipe.needs;
  ids.forEach((id, i) => {
    const a = (i / ids.length) * Math.PI * 2 - Math.PI / 2;
    drawIngredientShape(ctx, id, cx + Math.cos(a) * r * 0.45, cy + r * 0.12 + Math.sin(a) * r * 0.24, r * 0.32);
  });
  // Recipe signature topping, so each dish reads at a glance.
  if (recipeId === 'nasgor' || recipeId === 'nasitelur') {
    drawIngredientShape(ctx, 'telur', cx, cy - r * 0.28, r * 0.42);
  } else if (recipeId === 'sate') {
    ctx.strokeStyle = '#8a5a33'; ctx.lineWidth = 4;
    for (const dy of [-0.15, 0.1]) {
      ctx.beginPath(); ctx.moveTo(cx - r * 0.7, cy + dy * r); ctx.lineTo(cx + r * 0.7, cy + dy * r); ctx.stroke();
    }
    ctx.fillStyle = '#b06a2e';
    for (const [dx, dy] of [[-0.4, -0.15], [0, -0.15], [0.4, -0.15], [-0.2, 0.1], [0.2, 0.1]]) {
      ctx.beginPath(); ctx.arc(cx + dx * r, cy + dy * r, r * 0.16, 0, Math.PI * 2); ctx.fill();
    }
  } else if (recipeId === 'mieayam') {
    drawIngredientShape(ctx, 'ayam', cx - r * 0.25, cy - r * 0.3, r * 0.38);
    drawIngredientShape(ctx, 'sawi', cx + r * 0.35, cy - r * 0.25, r * 0.34);
  } else if (recipeId === 'esteh') {
    drawIngredientShape(ctx, 'teh', cx - r * 0.2, cy - r * 0.25, r * 0.45);
    drawIngredientShape(ctx, 'es', cx + r * 0.35, cy - r * 0.3, r * 0.32);
  }
  ctx.restore();
}

function drawPatienceBar(ctx, x, y, w, ratio) {
  ctx.fillStyle = '#e5d5b8'; rr(ctx, x, y, w, 12, 6); ctx.fill();
  const color = ratio > 0.5 ? COLORS.ok : ratio > 0.25 ? COLORS.warn : COLORS.bad;
  ctx.fillStyle = color;
  if (ratio > 0.02) { rr(ctx, x, y, Math.max(10, w * ratio), 12, 6); ctx.fill(); }
}

function drawTicket(ctx, order, rect, index) {
  const ratio = Math.max(0, order.patience / order.patienceMax);
  const mood = ratio > 0.5 ? 'happy' : ratio > 0.25 ? 'worried' : 'angry';
  ctx.save();
  ctx.fillStyle = COLORS.ticket; ctx.strokeStyle = mood === 'angry' ? COLORS.bad : COLORS.ticketEdge; ctx.lineWidth = mood === 'angry' ? 3 : 2;
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 10); ctx.fill(); ctx.stroke();
  // Modifier badge.
  if (order.modifier) {
    const badgeColor = order.modifier === 'PRIORITAS' ? '#7c3aed' : order.modifier === 'PEDAS' ? '#d33a2c' : '#2e7d9e';
    ctx.fillStyle = badgeColor; rr(ctx, rect.x + rect.w - 108, rect.y + 8, 100, 22, 11); ctx.fill();
    text(ctx, order.modifier, rect.x + rect.w - 58, rect.y + 24, 12, '#fff', 800, 'center');
  }
  // Customer character: face, hair, expression follows patience.
  const fx = rect.x + 34, fy = rect.y + 36;
  ctx.fillStyle = `hsl(${order.hue} 55% 45%)`; // hair
  ctx.beginPath(); ctx.arc(fx, fy - 6, 23, Math.PI, 0); ctx.fill();
  ctx.fillRect(fx - 23, fy - 8, 46, 8);
  ctx.fillStyle = '#f2c89b'; // face
  ctx.beginPath(); ctx.arc(fx, fy + 2, 20, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c98f5a'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#3a2415'; // eyes
  if (mood === 'angry') {
    ctx.beginPath(); ctx.arc(fx - 7, fy, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(fx + 7, fy, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3a2415'; ctx.lineWidth = 2.5; // angled brows
    ctx.beginPath(); ctx.moveTo(fx - 12, fy - 12); ctx.lineTo(fx - 3, fy - 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(fx + 12, fy - 12); ctx.lineTo(fx + 3, fy - 7); ctx.stroke();
    ctx.strokeStyle = '#8f1f14'; ctx.lineWidth = 2.5; // open frown
    ctx.beginPath(); ctx.arc(fx, fy + 16, 7, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke();
  } else if (mood === 'worried') {
    ctx.beginPath(); ctx.arc(fx - 7, fy, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(fx + 7, fy, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3a2415'; ctx.lineWidth = 2; // raised brows
    ctx.beginPath(); ctx.moveTo(fx - 12, fy - 10); ctx.lineTo(fx - 3, fy - 12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(fx + 12, fy - 10); ctx.lineTo(fx + 3, fy - 12); ctx.stroke();
    ctx.strokeStyle = '#3a2415'; ctx.lineWidth = 2; // flat worried mouth
    ctx.beginPath(); ctx.moveTo(fx - 5, fy + 12); ctx.lineTo(fx + 5, fy + 12); ctx.stroke();
    ctx.fillStyle = '#7ec8f5'; // sweat drop
    ctx.beginPath(); ctx.arc(fx + 20, fy - 8, 4, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.beginPath(); ctx.arc(fx - 7, fy, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(fx + 7, fy, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e88a8a'; // blush
    ctx.beginPath(); ctx.arc(fx - 12, fy + 7, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(fx + 12, fy + 7, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3a2415'; ctx.lineWidth = 2; // smile
    ctx.beginPath(); ctx.arc(fx, fy + 6, 8, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  }
  text(ctx, `#${index + 1}`, rect.x + 64, rect.y + 26, 13, COLORS.muted, 700);
  text(ctx, order.name, rect.x + 64, rect.y + 48, 20, COLORS.ink, 800);
  // Required ingredients, as mini shapes + labels.
  const needW = (rect.w - 20) / order.needs.length;
  order.needs.forEach((id, i) => {
    const cx = rect.x + 10 + needW * (i + 0.5);
    drawIngredientShape(ctx, id, cx, rect.y + 92, 20);
    text(ctx, INGREDIENT_BY_ID[id].label, cx, rect.y + 126, 12, COLORS.ink, 700, 'center');
  });
  drawPatienceBar(ctx, rect.x + 12, rect.y + rect.h - 20, rect.w - 24, ratio);
  text(ctx, mood === 'angry' ? 'BURU-BURU!' : mood === 'worried' ? 'mulai kesal…' : 'menunggu…', rect.x + rect.w - 12, rect.y + 68, 11, mood === 'angry' ? COLORS.bad : COLORS.muted, 700, 'right');
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
  // Score / combo / strikes / dishes served (coins had no sink, so they are
  // no longer shown in the HUD — the score is the currency that matters).
  text(ctx, `Skor ${state.score}`, 760, 40, 22, '#fff6e0', 800);
  text(ctx, `Disajikan ${state.served}`, 920, 40, 20, '#ffd34d', 800);
  text(ctx, state.combo > 1 ? `Combo x${state.combo}` : '', 1060, 40, 20, '#7CFC98', 800);
  text(ctx, '✖'.repeat(state.strikes), 1170, 40, 20, '#ff8a7a', 800);
  drawButton(ctx, L.muteBtn, state.audio.muted ? '🔇' : '🔊', '', true, '#5a3a22', '#3a2415');

  // Warung atmosphere: bunting flags + a hanging lamp over the kitchen.
  const flagColors = ['#e2571e', '#f5b301', '#2e9e4f', '#2e7d9e'];
  for (let i = 0; i < 16; i += 1) {
    const fx = 20 + i * 80;
    ctx.fillStyle = flagColors[i % 4];
    ctx.beginPath(); ctx.moveTo(fx, 66); ctx.lineTo(fx + 34, 66); ctx.lineTo(fx + 17, 78); ctx.closePath(); ctx.fill();
  }
  ctx.strokeStyle = '#3a2415'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(640, 64); ctx.lineTo(640, 76); ctx.stroke();
  ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.arc(640, 82, 6, 0, Math.PI * 2); ctx.fill();

  // Order board.
  ctx.fillStyle = COLORS.board; ctx.strokeStyle = COLORS.boardEdge; ctx.lineWidth = 3;
  rr(ctx, L.board.x, L.board.y, L.board.w, L.board.h, 12); ctx.fill(); ctx.stroke();
  text(ctx, 'PESANAN', L.board.x + 16, L.board.y + 34, 22, COLORS.ink, 800);
  text(ctx, `${state.board.orders.length}/${3} pelanggan`, L.board.x + L.board.w - 16, L.board.y + 32, 13, COLORS.muted, 700, 'right');
  state.board.orders.forEach((order, i) => drawTicket(ctx, order, L.tickets[i], i));
  for (let i = state.board.orders.length; i < 3; i += 1) {
    const rect = L.tickets[i];
    ctx.save();
    ctx.fillStyle = '#f3e6c8'; ctx.strokeStyle = '#d9c49a'; ctx.setLineDash([6, 5]); ctx.lineWidth = 2;
    rr(ctx, rect.x, rect.y, rect.w, rect.h, 10); ctx.fill(); ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, 'kursi kosong', rect.x + rect.w / 2, rect.y + 70, 16, COLORS.muted, 700, 'center');
    text(ctx, 'pelanggan berikutnya segera datang…', rect.x + rect.w / 2, rect.y + 96, 12, COLORS.muted, 600, 'center');
    ctx.restore();
  }
  if (state.board.orders.length === 0 && screen === SCREEN_PLAY) {
    text(ctx, 'Semua pelanggan terlayani!', L.board.x + L.board.w / 2, L.board.y + 300, 16, COLORS.muted, 700, 'center');
  }

  // Counter bins.
  text(ctx, 'COUNTER BAHAN — klik untuk merakit', 324, 84, 15, COLORS.ink, 800);
  L.bins.forEach((bin) => drawBin(ctx, bin, hover && hover.kind === 'bin' && hover.id === bin.id));

  // Stove (wok): a real wok even when empty — flames under it, oil sheen
  // on the steel, a handle, and visible food + steam while it cooks.
  ctx.fillStyle = COLORS.counter; ctx.strokeStyle = COLORS.counterEdge; ctx.lineWidth = 2;
  rr(ctx, L.stove.x, L.stove.y, L.stove.w, L.stove.h, 12); ctx.fill(); ctx.stroke();
  text(ctx, 'KOMPOR', L.stove.x + 16, L.stove.y + 28, 16, '#fff', 800);
  const wokCooking = state.kitchen.wokStage === 'cooking';
  const wokBurnt = isWokBurnt(state.kitchen);
  const wokActive = wokCooking || wokBurnt;
  // Flames under the wok (always lit — this is a warung, the fire never dies).
  const flameH = wokCooking ? 26 + Math.sin(state.now * 9) * 5 : 14;
  ctx.fillStyle = wokCooking ? '#ff7a1a' : '#e2571e';
  for (const fx of [110, 150, 190]) {
    ctx.beginPath();
    ctx.moveTo(L.stove.x + fx - 16, L.stove.y + 142);
    ctx.quadraticCurveTo(L.stove.x + fx, L.stove.y + 142 - flameH - 12, L.stove.x + fx + 16, L.stove.y + 142);
    ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = '#ffd34d';
  for (const fx of [125, 165]) {
    ctx.beginPath();
    ctx.moveTo(L.stove.x + fx - 9, L.stove.y + 142);
    ctx.quadraticCurveTo(L.stove.x + fx, L.stove.y + 142 - flameH * 0.55, L.stove.x + fx + 9, L.stove.y + 142);
    ctx.closePath(); ctx.fill();
  }
  // Wok body: steel bowl + rim + handle, glowing orange-red while cooking.
  ctx.fillStyle = wokCooking ? '#ff8a3d' : '#4a4a4a';
  ctx.beginPath(); ctx.ellipse(L.stove.x + 150, L.stove.y + 105, 105, 34, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = wokCooking ? '#c33d0a' : '#2b2b2b';
  ctx.beginPath(); ctx.ellipse(L.stove.x + 150, L.stove.y + 98, 88, 26, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#1c1c1c'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(L.stove.x + 252, L.stove.y + 100); ctx.lineTo(L.stove.x + 292, L.stove.y + 88); ctx.stroke();
  if (!wokActive) {
    // Empty wok still reads as a wok: oil sheen + a wooden spatula resting in it.
    ctx.fillStyle = 'rgba(245,179,1,0.35)';
    ctx.beginPath(); ctx.ellipse(L.stove.x + 150, L.stove.y + 98, 62, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8a5a33'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(L.stove.x + 120, L.stove.y + 60); ctx.lineTo(L.stove.x + 185, L.stove.y + 100); ctx.stroke();
    text(ctx, 'wajan siap — api menyala', L.stove.x + 150, L.stove.y + 178, 14, '#ffe9d6', 700, 'center');
  } else {
    // Food visible inside the wok while it cooks.
    state.kitchen.wok.forEach((id, i) => drawIngredientShape(ctx, id, L.stove.x + 95 + i * 36, L.stove.y + 94, 15));
    // Steam while cooking.
    if (wokCooking) {
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i += 1) {
        const sx = L.stove.x + 115 + i * 36;
        const sway = Math.sin(state.now * 3 + i * 2) * 6;
        ctx.beginPath(); ctx.moveTo(sx, L.stove.y + 62);
        ctx.quadraticCurveTo(sx + sway, L.stove.y + 48, sx - sway, L.stove.y + 34); ctx.stroke();
      }
    }
    const prog = cookProgress(state.kitchen);
    const col = wokBurnt ? COLORS.bad : isBurning(state.kitchen) ? '#ff7a1a' : COLORS.gold;
    ctx.fillStyle = '#5a3a22'; rr(ctx, L.stove.x + 40, L.stove.y + 150, 220, 16, 8); ctx.fill();
    ctx.fillStyle = col; rr(ctx, L.stove.x + 40, L.stove.y + 150, 220 * Math.min(prog, 1), 16, 8); ctx.fill();
    if (wokBurnt) {
      text(ctx, 'GOSONG! Tekan T untuk buang.', L.stove.x + 150, L.stove.y + 190, 16, '#ffb3ab', 800, 'center');
    } else if (isBurning(state.kitchen)) {
      text(ctx, `MATANG — ANGKAT! Gosong ${burnCountdown(state.kitchen).toFixed(1)} dtk`, L.stove.x + 150, L.stove.y + 190, 15, '#ffd34d', 800, 'center');
    } else {
      text(ctx, `memasak… gosong ${burnCountdown(state.kitchen).toFixed(1)} dtk`, L.stove.x + 150, L.stove.y + 190, 14, '#fff', 800, 'center');
    }
  }

  // Assembly plate.
  ctx.fillStyle = COLORS.counter; ctx.strokeStyle = COLORS.counterEdge; ctx.lineWidth = 2;
  rr(ctx, L.plate.x, L.plate.y, L.plate.w, L.plate.h, 12); ctx.fill(); ctx.stroke();
  text(ctx, 'PIRING RAKITAN', L.plate.x + 16, L.plate.y + 28, 16, '#fff', 800);
  ctx.fillStyle = COLORS.plate; ctx.strokeStyle = COLORS.plateEdge; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(L.plate.x + 150, L.plate.y + 125, 105, 42, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  if (state.kitchen.plate.length === 0) {
    text(ctx, state.kitchen.wokStage === 'cooking' ? 'wajan memasak — rakit di sini!' : 'piring kosong', L.plate.x + 150, L.plate.y + 130, 15, COLORS.muted, 700, 'center');
  } else {
    state.kitchen.plate.forEach((id, i) => {
      const a = (i / Math.max(state.kitchen.plate.length, 1)) * Math.PI * 2 - Math.PI / 2;
      drawIngredientShape(ctx, id, L.plate.x + 150 + Math.cos(a) * 52, L.plate.y + 122 + Math.sin(a) * 20, 24);
    });
  }
  text(ctx, plateHint(state.kitchen, state.board.orders), L.plate.x + 150, L.plate.y + 190, 14, '#ffe9d6', 700, 'center');

  // Serve counter.
  ctx.fillStyle = COLORS.counter; ctx.strokeStyle = COLORS.counterEdge; ctx.lineWidth = 2;
  rr(ctx, L.serveCounter.x, L.serveCounter.y, L.serveCounter.w, L.serveCounter.h, 12); ctx.fill(); ctx.stroke();
  text(ctx, 'MEJA SAJI', L.serveCounter.x + 16, L.serveCounter.y + 28, 16, '#fff', 800);
  if (state.kitchen.servedDish) {
    drawDish(ctx, state.kitchen.servedDish, L.serveCounter.x + 146, L.serveCounter.y + 92, 58);
    text(ctx, RECIPE_BY_ID[state.kitchen.servedDish].name, L.serveCounter.x + 146, L.serveCounter.y + 185, 18, '#fff', 800, 'center');
  } else {
    text(ctx, 'belum ada hidangan', L.serveCounter.x + 146, L.serveCounter.y + 120, 15, '#ffe9d6', 700, 'center');
  }

  // Action buttons.
  const canCookNow = canCook(state.kitchen, state.board.orders);
  const burning = isBurning(state.kitchen);
  const burnt = isWokBurnt(state.kitchen);
  const plateComplete = state.kitchen.stage === 'building' && state.kitchen.plate.length > 0;
  const cookLabel = burning ? 'ANGKAT [M]' : burnt ? 'BUANG [T]' : 'MASAK [M]';
  const cookSub = burning ? 'ke meja saji' : burnt ? 'wajan gosong' : canCookNow ? 'ke kompor' : plateComplete ? 'wajan dipakai' : 'rakit dulu';
  drawButton(ctx, L.cookBtn, cookLabel, cookSub, canCookNow || burning, COLORS.button, COLORS.buttonEdge);
  drawButton(ctx, L.trashBtn, 'BUANG [T]', state.kitchen.plate.length > 0 ? 'kosongkan piring' : burnt ? 'buang gosong' : 'piring / wajan', state.kitchen.plate.length > 0 || state.kitchen.wokStage !== 'empty', '#7a5a3a', '#4a3220');
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

  // Golden flash border right after a serve.
  if (state.serveFlashUntil && state.now < state.serveFlashUntil) {
    ctx.save();
    ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, W - 10, H - 10);
    ctx.restore();
  }

  // Bottom hint bar.
  ctx.fillStyle = '#3a2415'; ctx.fillRect(0, 656, W, 64);
  text(ctx, 'Rakit di piring sambil wajan memasak — MASAK kirim piring ke wajan, piring langsung kosong lagi. Klik bahan terakhir 2x = lepas.', 20, 682, 15, '#ffe9b8', 600);
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
    '• Hidangan lengkap → MASAK: piring masuk wajan, piring kosong lagi —',
    '  rakit hidangan BERIKUTNYA sambil yang pertama dimasak!',
    '• Perhatikan label tiket: PEDAS / NO BAWANG ubah bahan,',
    '  PRIORITAS bayar lebih tapi cepat pergi.',
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
  text(ctx, state.strikes >= 3 ? 'SHIFT BERAKHIR' : 'SHIFT SELESAI!', 640, 225, 40, COLORS.accent, 800, 'center');
  text(ctx, state.strikes >= 3 ? 'Terlalu banyak pelanggan pergi.' : 'Warung tutup — kerja bagus!', 640, 265, 18, COLORS.ink, 700, 'center');
  const stars = state.served >= 14 ? '★★★' : state.served >= 10 ? '★★☆' : state.served >= 6 ? '★☆☆' : '☆☆☆';
  text(ctx, stars, 640, 310, 34, COLORS.gold, 800, 'center');
  text(ctx, `Hidangan disajikan: ${state.served}`, 640, 350, 22, COLORS.ink, 700, 'center');
  text(ctx, `Pelanggan pergi: ${state.walkedOut}`, 640, 384, 22, COLORS.ink, 700, 'center');
  text(ctx, `Combo terbaik: x${state.bestCombo}`, 640, 418, 22, COLORS.ink, 700, 'center');
  text(ctx, `Skor akhir: ${state.score}`, 640, 462, 26, COLORS.ink, 800, 'center');
  text(ctx, 'Tekan R untuk main lagi', 640, 500, 17, COLORS.muted, 700, 'center');
}
