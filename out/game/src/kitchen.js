// WARUNG RUSH — kitchen: the assembly plate and the wok (stove).
// Flow: click ingredients onto the plate -> the plate matches a recipe ->
// MASAK on the stove (progress bar, burn if left too long) -> a finished
// plate waits on the serve counter -> SAJIKAN to the matching ticket.
import { BURN_SECONDS, COOK_SECONDS } from './config.js';
import { matchRecipe, plateFitsRecipe, plateIsDead } from './recipes.js';

export const PLATE_EMPTY = 'empty';
export const PLATE_BUILDING = 'building';
export const PLATE_COOKING = 'cooking';
export const PLATE_BURNT = 'burnt';
// A finished dish waits on the serve counter (servedDish) while the cook
// already assembles the next plate — that is the real rush of a warung.

export function createKitchen() {
  return {
    plate: [], // ingredient ids on the plate, in click order
    stage: PLATE_EMPTY,
    cookTime: 0, // seconds on the stove
    cookedRecipeId: null, // recipe id cooked on the stove, ready to pull off
    servedDish: null, // recipe id waiting on the serve counter
    message: '', // short feedback line shown over the counter
    messageUntil: 0,
  };
}

/** Add one ingredient to the plate. Returns false when the plate is busy. */
export function addIngredient(kitchen, ingredientId, now) {
  if (kitchen.stage === PLATE_COOKING || kitchen.stage === PLATE_BURNT) return false;
  if (kitchen.plate.length >= 4) return false;
  kitchen.plate.push(ingredientId);
  kitchen.stage = PLATE_BUILDING;
  kitchen.message = '';
  if (plateIsDead(kitchen.plate)) {
    kitchen.message = 'Bahan tidak cocok! Buang (T) lalu rakit lagi.';
    kitchen.messageUntil = now + 2.5;
  }
  return true;
}

/** The recipe the current plate completes, or null while it is partial. */
export function plateRecipe(kitchen) {
  if (kitchen.plate.length === 0) return null;
  return matchRecipe(kitchen.plate);
}

/** True when the plate holds a complete recipe and may go on the stove. */
export function canCook(kitchen) {
  if (kitchen.stage !== PLATE_BUILDING) return false;
  const recipe = plateRecipe(kitchen);
  return recipe !== null && recipe.cook;
}

/** True when a finished dish is waiting on the serve counter. */
export function canServe(kitchen) {
  return kitchen.servedDish !== null;
}

/** Move a complete plate onto the stove and start the wok timer. */
export function startCooking(kitchen) {
  if (!canCook(kitchen)) return false;
  kitchen.stage = PLATE_COOKING;
  kitchen.cookTime = 0;
  return true;
}

/** A no-cook dish (Es Teh) skips the stove: it goes straight to the counter. */
export function finishNoCook(kitchen) {
  const recipe = plateRecipe(kitchen);
  if (!recipe || recipe.cook) return false;
  if (kitchen.servedDish !== null) return false; // counter already full
  kitchen.servedDish = recipe.id;
  kitchen.plate = [];
  kitchen.stage = PLATE_EMPTY;
  return true;
}

/** Pull a cooked plate off the stove onto the serve counter. */
export function pullFromStove(kitchen) {
  if (!isBurning(kitchen) || !kitchen.cookedRecipeId) return false;
  if (kitchen.servedDish !== null) return false; // counter already full
  kitchen.servedDish = kitchen.cookedRecipeId;
  kitchen.plate = [];
  kitchen.stage = PLATE_EMPTY;
  kitchen.cookTime = 0;
  kitchen.cookedRecipeId = null;
  return true;
}

/** Advance the wok. Returns 'burnt' the moment the plate burns. */
export function updateKitchen(kitchen, dt, now) {
  if (kitchen.stage !== PLATE_COOKING) return null;
  kitchen.cookTime += dt;
  if (kitchen.cookTime >= COOK_SECONDS && kitchen.cookedRecipeId === null) {
    const recipe = plateRecipe(kitchen);
    kitchen.cookedRecipeId = recipe ? recipe.id : null;
  }
  if (kitchen.cookTime >= BURN_SECONDS) {
    kitchen.stage = PLATE_BURNT;
    kitchen.cookedRecipeId = null;
    kitchen.message = 'GOSONG! Buang (T) dan rakit lagi.';
    kitchen.messageUntil = now + 3;
    return 'burnt';
  }
  return null;
}

/** Wok progress 0..1 (1 = cooked). Over 1 the plate is burning. */
export function cookProgress(kitchen) {
  return Math.min(kitchen.cookTime / COOK_SECONDS, 1);
}

/** True while the plate is cooked but still on the stove (burn window). */
export function isBurning(kitchen) {
  return kitchen.stage === PLATE_COOKING && kitchen.cookTime >= COOK_SECONDS;
}

/** Throw the plate away (trash). Clears any stage, keeps the shift going. */
export function trashPlate(kitchen, now) {
  kitchen.plate = [];
  kitchen.stage = PLATE_EMPTY;
  kitchen.cookTime = 0;
  kitchen.cookedRecipeId = null;
  kitchen.message = 'Piring dibuang.';
  kitchen.messageUntil = now + 1.5;
}

/** Take the finished dish off the serve counter (served). */
export function takeReadyPlate(kitchen) {
  const recipeId = kitchen.servedDish;
  kitchen.servedDish = null;
  return recipeId;
}

/** Hint line for the plate area: what the player should do next. */
export function plateHint(kitchen) {
  if (kitchen.stage === PLATE_BURNT) return 'Gosong! Tekan T untuk buang.';
  if (kitchen.stage === PLATE_COOKING) {
    if (isBurning(kitchen)) return 'MATANG! Angkat (M) sebelum gosong!';
    return 'Memasak di wajan…';
  }
  if (kitchen.servedDish !== null && kitchen.plate.length === 0) return 'Siap saji di meja! Klik SAJIKAN.';
  if (kitchen.plate.length === 0) return 'Klik bahan di counter untuk merakit hidangan.';
  const recipe = plateRecipe(kitchen);
  if (recipe) return recipe.cook ? `${recipe.name} lengkap — tekan M untuk masak!` : `${recipe.name} lengkap — siap disajikan!`;
  if (plateIsDead(kitchen.plate)) return 'Bahan salah — tekan T untuk buang.';
  const remaining = kitchen.plate.length;
  return `Merakit… ${remaining} bahan di piring.`;
}
