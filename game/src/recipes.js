// WARUNG RUSH — recipes: the dishes on the warung menu and the ingredients
// each one needs. Every dish is an original Indonesian street-food plate;
// nothing here copies a commercial game's menu or characters.

// Ingredient ids. Each one has a short label, a key (1..0) and a draw colour
// used by render.js to draw it as a distinct vector shape on the counter.
export const INGREDIENTS = [
  { id: 'nasi',   label: 'Nasi',   key: '1', color: '#fdf6e3', edge: '#d8c9a3' },
  { id: 'mie',    label: 'Mie',    key: '2', color: '#f2c14e', edge: '#c98f1e' },
  { id: 'ayam',   label: 'Ayam',   key: '3', color: '#b06a2e', edge: '#7c4213' },
  { id: 'telur',  label: 'Telur',  key: '4', color: '#fffdf5', edge: '#d8cfae' },
  { id: 'sawi',   label: 'Sawi',   key: '5', color: '#3f9e4d', edge: '#256b31' },
  { id: 'bawang', label: 'Bawang', key: '6', color: '#e8b4d8', edge: '#b57ba0' },
  { id: 'kecap',  label: 'Kecap',  key: '7', color: '#4a2c14', edge: '#2c1808' },
  { id: 'sambal', label: 'Sambal', key: '8', color: '#d33a2c', edge: '#8f1f14' },
  { id: 'teh',    label: 'Teh',    key: '9', color: '#c97b2e', edge: '#8f4d12' },
  { id: 'es',     label: 'Es Batu',key: '0', color: '#bfe6f5', edge: '#6fa8c4' },
];

export const INGREDIENT_BY_ID = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));

// A recipe: name, the ingredient ids in build order, price, and whether it
// must pass through the wok (stove) before it can be served.
export const RECIPES = [
  { id: 'nasgor', name: 'Nasi Goreng', needs: ['nasi', 'telur', 'kecap', 'bawang'], price: 25, cook: true,  color: '#e8a13c' },
  { id: 'mieayam', name: 'Mie Ayam',   needs: ['mie', 'ayam', 'sawi', 'bawang'],  price: 28, cook: true,  color: '#f2c14e' },
  { id: 'sate',   name: 'Sate Ayam',  needs: ['ayam', 'kecap', 'sambal'],         price: 30, cook: true,  color: '#b06a2e' },
  { id: 'esteh',  name: 'Es Teh',     needs: ['teh', 'es'],                       price: 12, cook: false, color: '#c97b2e' },
  { id: 'nasitelur', name: 'Nasi Telur', needs: ['nasi', 'telur', 'sambal'],      price: 18, cook: true,  color: '#f5d76e' },
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

/** The recipe whose ingredient multiset exactly matches `ids`, or null. */
export function matchRecipe(ids) {
  const sorted = [...ids].sort().join(',');
  for (const recipe of RECIPES) {
    if ([...recipe.needs].sort().join(',') === sorted) return recipe;
  }
  return null;
}

/** True when the plate so far can still become `recipe` (no wrong ingredient). */
export function plateFitsRecipe(ids, recipe) {
  const pool = [...recipe.needs];
  for (const id of ids) {
    const at = pool.indexOf(id);
    if (at === -1) return false;
    pool.splice(at, 1);
  }
  return true;
}

/** True when the plate holds a wrong ingredient for every recipe (dead plate). */
export function plateIsDead(ids) {
  if (ids.length === 0) return false;
  return !RECIPES.some((recipe) => plateFitsRecipe(ids, recipe));
}
