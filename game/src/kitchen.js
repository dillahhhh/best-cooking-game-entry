// WARUNG RUSH — kitchen: the assembly plate, the wok (stove) and the serve
// counter. PARALLEL PIPELINE (fix round 2): the plate and the wok are
// INDEPENDENT. Clicking ingredients always builds on the plate; MASAK moves
// the finished plate INTO the wok and empties the plate, so the player can
// immediately assemble the next dish while the first one cooks. Pipeline:
// cook A -> assemble B -> lift A -> serve A -> cook B. Zero idle seconds.
// The wok holds one dish at a time; the serve counter holds one finished dish.
import { BURN_SECONDS, COOK_SECONDS } from './config.js';
import { matchPlate, plateIsDead } from './recipes.js';

export const PLATE_EMPTY = 'empty';
export const PLATE_BUILDING = 'building';
export const PLATE_COOKING = 'cooking'; // kept for compat: wok is cooking
export const PLATE_BURNT = 'burnt'; // kept for compat: wok is burnt
export const WOK_EMPTY = 'empty';
export const WOK_COOKING = 'cooking';
export const WOK_BURNT = 'burnt';

export function createKitchen() {
  return {
    plate: [], // ingredient ids on the assembly plate, in click order
    stage: PLATE_EMPTY, // plate stage: empty | building (wok state lives in wokStage)
    // --- the wok, independent of the plate ---
    wok: [], // ingredient ids currently in the wok
    wokRecipeId: null, // recipe id cooking in the wok
    wokStage: WOK_EMPTY, // empty | cooking | burnt
    cookTime: 0, // seconds the current wok dish has been on the stove
    cookedRecipeId: null, // recipe id cooked on the stove, ready to pull off
    servedDish: null, // recipe id waiting on the serve counter
    message: '', // short feedback line shown over the counter
    messageUntil: 0,
  };
}

/**
 * Add one ingredient to the plate. The plate is NEVER blocked by the wok:
 * assembling continues while something cooks or even burns.
 * Re-clicking the LAST ingredient on the plate removes it (undo).
 * Returns false only when the plate is full (4 ingredients).
 */
export function addIngredient(kitchen, ingredientId, now, orders = null) {
  if (kitchen.plate.length > 0 && kitchen.plate[kitchen.plate.length - 1] === ingredientId) {
    kitchen.plate.pop();
    kitchen.stage = kitchen.plate.length === 0 ? PLATE_EMPTY : PLATE_BUILDING;
    kitchen.message = 'Bahan terakhir dilepas.';
    kitchen.messageUntil = now + 1.2;
    return true;
  }
  if (kitchen.plate.length >= 4) return false;
  kitchen.plate.push(ingredientId);
  kitchen.stage = PLATE_BUILDING;
  kitchen.message = '';
  if (plateIsDead(kitchen.plate, orders)) {
    kitchen.message = 'Bahan tidak cocok! Buang (T) lalu rakit lagi.';
    kitchen.messageUntil = now + 2.5;
  }
  return true;
}

/** The recipe the current plate completes, or null while it is partial. */
export function plateRecipe(kitchen, orders = null) {
  if (kitchen.plate.length === 0) return null;
  return matchPlate(kitchen.plate, orders);
}

/** True when the plate holds a complete cookable recipe and the wok is free. */
export function canCook(kitchen, orders = null) {
  if (kitchen.stage !== PLATE_BUILDING) return false;
  if (kitchen.wokStage !== WOK_EMPTY) return false;
  const recipe = plateRecipe(kitchen, orders);
  return recipe !== null && recipe.cook;
}

/** True when the wok is busy (so MASAK must wait) but the plate is complete. */
export function wokBusy(kitchen) {
  return kitchen.wokStage !== WOK_EMPTY;
}

/** True when a finished dish is waiting on the serve counter. */
export function canServe(kitchen) {
  return kitchen.servedDish !== null;
}

/**
 * Move a complete plate INTO the wok and start the timer. The plate is
 * emptied at once, so the next dish can be assembled while this one cooks.
 */
export function startCooking(kitchen, orders = null) {
  if (!canCook(kitchen, orders)) return false;
  const recipe = plateRecipe(kitchen, orders);
  kitchen.wok = [...kitchen.plate];
  kitchen.wokRecipeId = recipe.id;
  kitchen.plate = [];
  kitchen.stage = PLATE_EMPTY;
  kitchen.wokStage = WOK_COOKING;
  kitchen.cookTime = 0;
  kitchen.cookedRecipeId = null;
  return true;
}

/** A no-cook dish (Es Teh) skips the stove: it goes straight to the counter. */
export function finishNoCook(kitchen, orders = null) {
  const recipe = plateRecipe(kitchen, orders);
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
  kitchen.wok = [];
  kitchen.wokRecipeId = null;
  kitchen.wokStage = WOK_EMPTY;
  kitchen.cookTime = 0;
  kitchen.cookedRecipeId = null;
  return true;
}

/** Advance the wok. Returns 'burnt' the moment the wok dish burns. */
export function updateKitchen(kitchen, dt, now) {
  if (kitchen.wokStage !== WOK_COOKING) return null;
  kitchen.cookTime += dt;
  if (kitchen.cookTime >= COOK_SECONDS && kitchen.cookedRecipeId === null) {
    kitchen.cookedRecipeId = kitchen.wokRecipeId;
  }
  if (kitchen.cookTime >= BURN_SECONDS) {
    kitchen.wokStage = WOK_BURNT;
    kitchen.cookedRecipeId = null;
    kitchen.message = 'GOSONG! Buang (T) dan rakit lagi.';
    kitchen.messageUntil = now + 3;
    return 'burnt';
  }
  return null;
}

/** Wok progress 0..1 (1 = cooked). Over 1 the dish is burning. */
export function cookProgress(kitchen) {
  return Math.min(kitchen.cookTime / COOK_SECONDS, 1);
}

/** Seconds left before the wok dish burns (0 once cooked... counts down). */
export function burnCountdown(kitchen) {
  return Math.max(0, BURN_SECONDS - kitchen.cookTime);
}

/** True while the wok dish is cooked but still on the stove (burn window). */
export function isBurning(kitchen) {
  return kitchen.wokStage === WOK_COOKING && kitchen.cookTime >= COOK_SECONDS;
}

/** True while the wok dish has burnt and must be thrown away. */
export function isWokBurnt(kitchen) {
  return kitchen.wokStage === WOK_BURNT;
}

/**
 * Throw away: the plate first if it holds anything, otherwise the wok
 * (burnt or still cooking). The shift keeps going either way.
 */
export function trashPlate(kitchen, now) {
  if (kitchen.plate.length > 0) {
    kitchen.plate = [];
    kitchen.stage = PLATE_EMPTY;
    kitchen.message = 'Piring dibuang.';
    kitchen.messageUntil = now + 1.5;
    return 'plate';
  }
  if (kitchen.wokStage !== WOK_EMPTY) {
    kitchen.wok = [];
    kitchen.wokRecipeId = null;
    kitchen.wokStage = WOK_EMPTY;
    kitchen.cookTime = 0;
    kitchen.cookedRecipeId = null;
    kitchen.message = 'Wajan dibuang — gosong dibersihkan.';
    kitchen.messageUntil = now + 1.5;
    return 'wok';
  }
  return null;
}

/** Take the finished dish off the serve counter (served). */
export function takeReadyPlate(kitchen) {
  const recipeId = kitchen.servedDish;
  kitchen.servedDish = null;
  return recipeId;
}

/** Hint line for the plate area: what the player should do next. */
export function plateHint(kitchen, orders = null) {
  if (kitchen.wokStage === WOK_BURNT) return 'Wajan gosong! Tekan T untuk buang.';
  if (kitchen.plate.length === 0) {
    if (kitchen.wokStage === WOK_COOKING) {
      return isBurning(kitchen) ? 'MATANG! Angkat (M) sebelum gosong!' : 'Wajan memasak — rakit hidangan berikut!';
    }
    if (kitchen.servedDish !== null) return 'Siap saji di meja! Klik SAJIKAN.';
    return 'Klik bahan di counter untuk merakit hidangan.';
  }
  const recipe = plateRecipe(kitchen, orders);
  if (recipe) {
    if (!recipe.cook) return `${recipe.name} lengkap — siap disajikan!`;
    if (kitchen.wokStage !== WOK_EMPTY) return `${recipe.name} lengkap — tunggu wajan kosong!`;
    return `${recipe.name} lengkap — tekan M untuk masak!`;
  }
  if (plateIsDead(kitchen.plate, orders)) return 'Bahan salah — tekan T untuk buang.';
  if (kitchen.wokStage === WOK_COOKING) return `Merakit… ${kitchen.plate.length} bahan — wajan tetap memasak.`;
  return `Merakit… ${kitchen.plate.length} bahan di piring.`;
}
