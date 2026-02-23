/**
 * generator.js
 * Board generation algorithm using Fisher-Yates shuffle with constraint checking.
 *
 * Two-stage nested approach for efficiency:
 *   Stage 1 (outer): Shuffle resources → check resource constraints → retry if violated
 *   Stage 2 (inner): Shuffle numbers  → check number constraints  → retry if violated
 * When stage 2 fails, only the number placement is re-shuffled (keeping the valid
 * resource layout), dramatically improving success rates under strict constraints.
 *
 * If constrained generation still fails, constraints are progressively relaxed
 * (same-resource → same-number → 2&12 → 6&8) so the user always gets a board.
 *
 * Ports: always shuffled (no placement constraints in standard Catan).
 */

import { checkResourceConstraints, checkNumberConstraints } from './constraints.js'

const MAX_RESOURCE_ATTEMPTS = 200
const MAX_NUMBER_ATTEMPTS   = 50

/**
 * Fisher-Yates in-place shuffle (mutates the input array).
 * @template T
 * @param {T[]} array
 * @returns {T[]}
 */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = array[i]
    array[i] = array[j]
    array[j] = tmp
  }
  return array
}

/**
 * Try to generate a board with specific constraints.
 * Returns { tiles, attempts } where tiles is null on failure.
 */
function tryGenerate(config, constraints) {
  const { hexPositions, resources, numbers } = config

  let tiles = null
  let totalAttempts = 0

  for (let resAttempt = 0; resAttempt < MAX_RESOURCE_ATTEMPTS; resAttempt++) {
    totalAttempts++

    const shuffledResources = shuffle([...resources])
    const draftTiles = hexPositions.map((pos, i) => ({
      q: pos.q,
      r: pos.r,
      resource: shuffledResources[i],
      number: null,
    }))

    if (!checkResourceConstraints(draftTiles, constraints)) continue

    for (let numAttempt = 0; numAttempt < MAX_NUMBER_ATTEMPTS; numAttempt++) {
      totalAttempts++

      const shuffledNumbers = shuffle([...numbers])
      let numIdx = 0
      for (const tile of draftTiles) {
        if (tile.resource !== 'desert') {
          tile.number = shuffledNumbers[numIdx++]
        } else {
          tile.number = null
        }
      }

      const numberedTiles = draftTiles.filter(t => t.number !== null)
      if (!checkNumberConstraints(numberedTiles, constraints)) continue

      tiles = draftTiles
      break
    }

    if (tiles) break
  }

  return { tiles, attempts: totalAttempts }
}

/**
 * Constraint relaxation order: relax the hardest constraints first.
 * Each step allows one more thing, making generation progressively easier.
 */
const RELAXATION_KEYS = [
  'allowSameResTouch',   // hardest to satisfy — relax first
  'allowSameNumTouch',
  'allow212Touch',
  'allow68Touch',        // easiest / most important — relax last
]

/**
 * Generate a valid Catan board. Always succeeds — if the requested constraints
 * are too strict, constraints are silently relaxed one by one until a board is found.
 *
 * @param {object} config       - Board configuration from board-config.js
 * @param {object} constraints  - Constraint flags from constraints.js
 * @returns {{
 *   tiles: Array<{q, r, resource, number}>,
 *   ports: Array<{hex, dir, type}>,
 *   attempts: number,
 *   success: boolean,
 *   relaxed: boolean
 * }}
 */
export function generateBoard(config, constraints) {
  const { portSlots, portTypes } = config

  // Try with the user's exact constraints first
  let result = tryGenerate(config, constraints)
  let relaxed = false

  // If that fails, progressively relax constraints until it works
  if (!result.tiles) {
    const relaxedConstraints = { ...constraints }
    for (const key of RELAXATION_KEYS) {
      if (relaxedConstraints[key]) continue // already allowed, skip
      relaxedConstraints[key] = true        // relax this constraint
      result = tryGenerate(config, relaxedConstraints)
      relaxed = true
      if (result.tiles) break
    }
  }

  // Ports: always shuffle, no constraints
  const shuffledPortTypes = shuffle([...portTypes])
  const ports = portSlots.map((slot, i) => ({
    imgX: slot.imgX,
    imgY: slot.imgY,
    type: shuffledPortTypes[i],
  }))

  return {
    tiles: result.tiles,
    ports,
    attempts: result.attempts,
    success: result.tiles !== null,
    relaxed,
  }
}
