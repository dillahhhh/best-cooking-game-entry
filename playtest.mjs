// Playtest WARUNG RUSH headlessly: drive the real game logic (createState,
// applyAction, update) through a full shift and assert the rules hold.
// Run: node playtest.mjs
import { applyAction, createState, update } from './game/src/main.js';
import { RECIPES, matchPlate } from './game/src/recipes.js';
import { makeOrder } from './game/src/orders.js';

let pass = 0;
let fail = 0;
function check(name, cond) {
  if (cond) { pass += 1; console.log(`PASS ${name}`); }
  else { fail += 1; console.log(`FAIL ${name}`); }
}

const state = createState(7);
check('starts on title', state.screen === 'title');
applyAction(state, { kind: 'start' });
check('space/click starts shift', state.screen === 'play');
check('board seeded with 2 orders', state.board.orders.length === 2);
check('timer starts at 180', state.timeLeft === 180);

// Serve the first order: find its recipe, add its ingredients, cook, pull, serve.
const order = state.board.orders[0];
const recipe = RECIPES.find((r) => r.id === order.recipeId);
console.log(`first order: ${recipe.name} (${recipe.needs.join(',')}) modifier=${order.modifier || 'none'} ticket-needs=${order.needs.join(',')}`);
for (const id of order.needs) applyAction(state, { kind: 'bin', id });
check('plate holds the ticket recipe', state.kitchen.plate.join(',') === order.needs.join(','));
if (recipe.cook) {
  applyAction(state, { kind: 'cook' });
  check('cooking started (wok)', state.kitchen.wokStage === 'cooking');
  check('plate emptied into wok', state.kitchen.plate.length === 0 && state.kitchen.stage === 'empty');
  check('wok holds the recipe', state.kitchen.wok.join(',') === order.needs.join(','));

  // FIX 1 — PARALLEL: assemble the NEXT dish while the first one cooks.
  const next = RECIPES.find((r) => r.cook && r.id !== recipe.id);
  for (const id of next.needs) applyAction(state, { kind: 'bin', id });
  check('plate builds next dish WHILE wok cooks', state.kitchen.plate.join(',') === next.needs.join(','));
  check('wok still cooking first dish', state.kitchen.wokStage === 'cooking' && state.kitchen.wokRecipeId === recipe.id);
  update(state, 2.0);
  check('not cooked yet at 2s', state.kitchen.cookedRecipeId === null);
  check('plate untouched by wok timer', state.kitchen.plate.join(',') === next.needs.join(','));
  update(state, 1.5);
  check('cooked at 3.5s', state.kitchen.cookedRecipeId === recipe.id);
  applyAction(state, { kind: 'cook' }); // pull off the stove
  check('pulled to serve counter', state.kitchen.servedDish === recipe.id);
  check('plate STILL holds next dish after pull', state.kitchen.plate.join(',') === next.needs.join(','));
  check('wok free again', state.kitchen.wokStage === 'empty');
} else {
  applyAction(state, { kind: 'cook' });
  check('no-cook dish lands on counter', state.kitchen.servedDish === recipe.id);
}
const coinsBefore = state.coins;
applyAction(state, { kind: 'serve' });
check('serve pays coins', state.coins > coinsBefore);
check('serve counts', state.served === 1);
check('combo rises', state.combo === 1);
check('serve flash set', state.serveFlashUntil > state.now);
console.log(`coins after 1 serve: ${state.coins}`);

// Undo: re-clicking the last ingredient removes it.
applyAction(state, { kind: 'trash' }); // clear the next dish still on the plate
check('trash clears next dish', state.kitchen.plate.length === 0);
applyAction(state, { kind: 'bin', id: 'nasi' });
applyAction(state, { kind: 'bin', id: 'nasi' });
check('re-click last ingredient removes it', state.kitchen.plate.length === 0);

// Wrong ingredient -> dead plate -> trash clears it.
applyAction(state, { kind: 'bin', id: 'nasi' });
applyAction(state, { kind: 'bin', id: 'es' });
check('dead plate detected', state.kitchen.message.includes('tidak cocok'));
applyAction(state, { kind: 'trash' });
check('trash clears plate', state.kitchen.plate.length === 0);

// Burn: assemble a cookable recipe, cook, leave it on the stove — and the
// plate stays usable while the wok burns.
const cookable = RECIPES.find((r) => r.cook);
for (const id of cookable.needs) applyAction(state, { kind: 'bin', id });
applyAction(state, { kind: 'cook' });
update(state, 7.0);
check('wok burns when left on stove', state.kitchen.wokStage === 'burnt');
check('burnt wok cannot serve', state.kitchen.servedDish === null);
applyAction(state, { kind: 'bin', id: 'teh' });
check('plate still usable while wok burnt', state.kitchen.plate.join(',') === 'teh');
applyAction(state, { kind: 'trash' }); // trash plate first
check('trash clears plate before wok', state.kitchen.plate.length === 0 && state.kitchen.wokStage === 'burnt');
applyAction(state, { kind: 'trash' }); // then the burnt wok
check('burnt wok trashed', state.kitchen.wokStage === 'empty');

// Modifiers: over many seeded orders, all three kinds appear and every
// ticket's needs still match a cookable plate (order-aware matching).
{
  const seen = new Set();
  const rngState = createState(99);
  let unmatchable = 0;
  for (let i = 0; i < 300; i += 1) {
    const o = makeOrder(i % 180, rngState.rng);
    if (o.modifier) seen.add(o.modifier);
    if (!matchPlate([...o.needs], [o])) unmatchable += 1;
    if (o.needs.length > 4) unmatchable += 1;
  }
  console.log(`modifiers seen in 300 orders: ${[...seen].join(',') || 'none'}; unmatchable=${unmatchable}`);
  check('all 3 modifiers appear', seen.has('PEDAS') && seen.has('NO BAWANG') && seen.has('PRIORITAS'));
  check('every ticket plate is matchable (<=4 ingredients)', unmatchable === 0);
}

// Order-aware matching: a PEDAS nasgor plate (bawang -> sambal) completes.
{
  const pedasNasgor = { recipeId: 'nasgor', needs: ['nasi', 'telur', 'kecap', 'sambal'] };
  const matched = matchPlate(['nasi', 'telur', 'kecap', 'sambal'], [pedasNasgor]);
  check('PEDAS plate matches its ticket', matched !== null && matched.id === 'nasgor');
  const noBawang = { recipeId: 'mieayam', needs: ['mie', 'ayam', 'sawi'] };
  const matched2 = matchPlate(['mie', 'ayam', 'sawi'], [noBawang]);
  check('NO BAWANG plate matches its ticket', matched2 !== null && matched2.id === 'mieayam');
  check('plain plate still matches menu', matchPlate(['nasi', 'telur', 'kecap', 'bawang'], [])?.id === 'nasgor');
}

// Strike: let patience run out.
const strikesBefore = state.strikes;
update(state, 60);
check('walk-outs register strikes', state.strikes > strikesBefore);
console.log(`strikes now: ${state.strikes}, walked out: ${state.walkedOut}`);

// Timer end: run the clock out.
update(state, 200);
check('shift ends at 0:00', state.screen === 'over');
check('score recorded', state.score > 0);
console.log(`final: coins=${state.coins} score=${state.score} served=${state.served} walkedOut=${state.walkedOut}`);

// Restart works from the over screen.
applyAction(state, { kind: 'restart' });
check('R restarts a new shift', state.screen === 'play' && state.coins === 0 && state.timeLeft === 180);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
