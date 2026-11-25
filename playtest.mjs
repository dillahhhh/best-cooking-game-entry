// Playtest WARUNG RUSH headlessly: drive the real game logic (createState,
// applyAction, update) through a full shift and assert the rules hold.
// Run: node playtest.mjs
import { applyAction, createState, update } from './game/src/main.js';
import { RECIPES } from './game/src/recipes.js';

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
console.log(`first order: ${recipe.name} (${recipe.needs.join(',')})`);
for (const id of recipe.needs) applyAction(state, { kind: 'bin', id });
check('plate holds the recipe', state.kitchen.plate.join(',') === recipe.needs.join(','));
if (recipe.cook) {
  applyAction(state, { kind: 'cook' });
  check('cooking started', state.kitchen.stage === 'cooking');
  update(state, 2.0);
  check('not cooked yet at 2s', state.kitchen.cookedRecipeId === null);
  update(state, 1.5);
  check('cooked at 3.5s', state.kitchen.cookedRecipeId === recipe.id);
  applyAction(state, { kind: 'cook' }); // pull off the stove
  check('pulled to serve counter', state.kitchen.servedDish === recipe.id);
  check('plate free again', state.kitchen.stage === 'empty' && state.kitchen.plate.length === 0);
} else {
  applyAction(state, { kind: 'cook' });
  check('no-cook dish lands on counter', state.kitchen.servedDish === recipe.id);
}
const coinsBefore = state.coins;
applyAction(state, { kind: 'serve' });
check('serve pays coins', state.coins > coinsBefore);
check('serve counts', state.served === 1);
check('combo rises', state.combo === 1);
console.log(`coins after 1 serve: ${state.coins}`);

// Wrong ingredient -> dead plate -> trash clears it.
applyAction(state, { kind: 'bin', id: 'nasi' });
applyAction(state, { kind: 'bin', id: 'es' });
check('dead plate detected', state.kitchen.message.includes('tidak cocok'));
applyAction(state, { kind: 'trash' });
check('trash clears plate', state.kitchen.plate.length === 0);

// Burn: assemble a cookable recipe, cook, leave it on the stove.
const cookable = RECIPES.find((r) => r.cook);
for (const id of cookable.needs) applyAction(state, { kind: 'bin', id });
applyAction(state, { kind: 'cook' });
update(state, 7.0);
check('plate burns when left on stove', state.kitchen.stage === 'burnt');
check('burnt plate cannot serve', state.kitchen.servedDish === null);
applyAction(state, { kind: 'trash' });
check('burnt plate trashed', state.kitchen.stage === 'empty');

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
