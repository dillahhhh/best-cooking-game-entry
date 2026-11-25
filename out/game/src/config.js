// WARUNG RUSH — config: canvas size, shift length, difficulty curve, colours.
// A one-screen Indonesian street-food (warung) rush cooking game.
export const W = 1280;
export const H = 720;

export const SHIFT_SECONDS = 180; // one shift lasts 3 minutes
export const MAX_ORDERS = 3; // tickets on the board at once
export const MAX_STRIKES = 3; // three walked-out customers end the shift early
export const COOK_SECONDS = 3.2; // wok time for a full plate
export const BURN_SECONDS = 6.5; // plate left on the stove past this is burnt
export const WRONG_PENALTY_SECONDS = 3; // patience lost by every order on a wrong serve
export const COMBO_TIP_PER_STEP = 2; // extra coins per combo step

// Warm warung palette: orange / cream / brown, readable at a glance.
export const COLORS = {
  bg: '#2b1a12',
  wall: '#f7e8c9',
  wallStripe: '#e8c98f',
  floor: '#8a5a33',
  counter: '#b4713a',
  counterEdge: '#7c4a22',
  board: '#fff6e0',
  boardEdge: '#c98f4a',
  ink: '#3a2415',
  muted: '#8a6a4a',
  ticket: '#fffdf5',
  ticketEdge: '#d9a05b',
  plate: '#fdfdfd',
  plateEdge: '#c9c2b4',
  stove: '#3d3d3d',
  stoveHot: '#e2571e',
  ok: '#2e9e4f',
  warn: '#e8a100',
  bad: '#d33a2c',
  gold: '#f5b301',
  accent: '#e2571e',
  accentDark: '#b23e10',
  button: '#e2571e',
  buttonEdge: '#8f2f08',
  serve: '#2e9e4f',
  serveEdge: '#1c6b34',
};

export const KEY_HINTS = [
  '1-9,0 pilih bahan',
  'M masak',
  'S sajikan',
  'T buang',
  'P jeda',
  'Spasi mulai',
];
