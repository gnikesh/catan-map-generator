/**
 * board-config.js
 * Data-driven board definitions.
 * Adding a new board type (5-6 player, Seafarers, etc.) means adding a new
 * config object to BOARD_CONFIGS — zero changes to algorithmic code.
 */

/**
 * Standard Catan 3-4 player board configuration.
 *
 * Hex positions in axial coordinates (q, r).
 * All positions satisfy: max(|q|, |r|, |q+r|) ≤ 2
 * 19 hexes total: 3 + 4 + 5 + 4 + 3 rows.
 */
export const STANDARD_CONFIG = {
  id: 'standard',
  name: 'Standard (3-4 Players)',

  hexPositions: [
    // Row r = -2  (top row, 3 hexes)
    { q:  0, r: -2 }, { q:  1, r: -2 }, { q:  2, r: -2 },
    // Row r = -1  (4 hexes)
    { q: -1, r: -1 }, { q:  0, r: -1 }, { q:  1, r: -1 }, { q:  2, r: -1 },
    // Row r =  0  (middle row, 5 hexes)
    { q: -2, r:  0 }, { q: -1, r:  0 }, { q:  0, r:  0 }, { q:  1, r:  0 }, { q:  2, r:  0 },
    // Row r =  1  (4 hexes)
    { q: -2, r:  1 }, { q: -1, r:  1 }, { q:  0, r:  1 }, { q:  1, r:  1 },
    // Row r =  2  (bottom row, 3 hexes)
    { q: -2, r:  2 }, { q: -1, r:  2 }, { q:  0, r:  2 },
  ],

  // Resource distribution: 19 tiles total (desert gets no number token)
  resources: [
    'grain', 'grain', 'grain', 'grain',
    'lumber', 'lumber', 'lumber', 'lumber',
    'wool', 'wool', 'wool', 'wool',
    'ore', 'ore', 'ore',
    'brick', 'brick', 'brick',
    'desert',
  ],

  // Number tokens: 18 (one per non-desert hex)
  numbers: [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12],

  /**
   * Port slots: 9 positions defined by their location in game-background.png.
   *
   * imgX/imgY = fractional coordinates (0-1) of the port marker center
   * within the 1800×1581 background image. The renderer converts these to
   * SVG coordinates using FRAME_IMAGE_SCALE and computes rotation toward
   * the board center automatically.
   *
   * Positions measured from the built-in port markers in game-background.png,
   * going clockwise from the upper-left:
   */
  portSlots: [
    { imgX: 0.292, imgY: 0.075 }, // 1. Top-left       (~11 o'clock)
    { imgX: 0.559, imgY: 0.084 }, // 2. Top-center     (~12 o'clock)
    { imgX: 0.791, imgY: 0.223 }, // 3. Upper-right    (~1:30)
    { imgX: 0.925, imgY: 0.510 }, // 4. Right          (~3:30)
    { imgX: 0.795, imgY: 0.771 }, // 5. Lower-right    (~5 o'clock)
    { imgX: 0.562, imgY: 0.927 }, // 6. Bottom-right   (~6:30)
    { imgX: 0.277, imgY: 0.925 }, // 7. Bottom-left    (~7:30)
    { imgX: 0.132, imgY: 0.658 }, // 8. Left           (~9 o'clock)
    { imgX: 0.142, imgY: 0.340 }, // 9. Upper-left     (~10:30)
  ],

  // 9 port types (shuffled among the 9 slots each generation)
  portTypes: [
    'generic', 'generic', 'generic', 'generic',
    'grain', 'lumber', 'wool', 'ore', 'brick',
  ],
}

/**
 * Registry of all board configs.
 * Future expansion packs are added here without touching any other file.
 */
export const BOARD_CONFIGS = {
  standard: STANDARD_CONFIG,
  // 'standard-56': STANDARD_56_CONFIG,   // TODO: 5-6 player expansion
  // 'seafarers': SEAFARERS_CONFIG,         // TODO: Seafarers expansion
}

/**
 * Get a board config by ID (defaults to 'standard').
 * @param {string} [id]
 * @returns {object}
 */
export function getConfig(id = 'standard') {
  const config = BOARD_CONFIGS[id]
  if (!config) throw new Error(`Unknown board config: "${id}"`)
  return config
}
