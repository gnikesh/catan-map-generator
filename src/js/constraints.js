/**
 * constraints.js
 * Constraint checking functions for board generation.
 * All functions are pure — no side effects, no global state.
 */

import { areAdjacent } from './hex-grid.js'

/**
 * Default constraint settings.
 * false = constraint is ACTIVE (that thing is NOT allowed)
 * true  = constraint is OFF (that thing IS allowed)
 */
export const DEFAULT_CONSTRAINTS = {
  allow68Touch:      false, // 6 & 8 cannot be adjacent (default: enforce)
  allow212Touch:     true,  // 2 & 12 CAN be adjacent (default: allow)
  allowSameNumTouch: false, // Same numbers cannot touch (default: enforce)
  allowSameResTouch: false, // Same resources cannot touch (default: enforce)
}

/**
 * Check if a resource assignment satisfies resource adjacency constraints.
 *
 * @param {Array<{q: number, r: number, resource: string}>} tiles
 * @param {object} constraints
 * @returns {boolean} true = valid, false = constraint violated
 */
export function checkResourceConstraints(tiles, constraints) {
  if (constraints.allowSameResTouch) return true

  for (let i = 0; i < tiles.length; i++) {
    const a = tiles[i]
    if (a.resource === 'desert') continue // Only one desert; skip it

    for (let j = i + 1; j < tiles.length; j++) {
      const b = tiles[j]
      if (b.resource === 'desert') continue

      if (a.resource === b.resource && areAdjacent(a, b)) {
        return false
      }
    }
  }
  return true
}

/**
 * Check if a number assignment satisfies number adjacency constraints.
 * Only call this with the non-desert tiles (tiles that have a number).
 *
 * @param {Array<{q: number, r: number, number: number}>} numberedTiles
 * @param {object} constraints
 * @returns {boolean} true = valid, false = constraint violated
 */
export function checkNumberConstraints(numberedTiles, constraints) {
  for (let i = 0; i < numberedTiles.length; i++) {
    for (let j = i + 1; j < numberedTiles.length; j++) {
      if (!areAdjacent(numberedTiles[i], numberedTiles[j])) continue

      const a = numberedTiles[i].number
      const b = numberedTiles[j].number

      // Rule: 6 and 8 cannot be adjacent
      if (!constraints.allow68Touch) {
        if ((a === 6 || a === 8) && (b === 6 || b === 8)) return false
      }

      // Rule: 2 and 12 cannot be adjacent
      if (!constraints.allow212Touch) {
        if ((a === 2 || a === 12) && (b === 2 || b === 12)) return false
      }

      // Rule: same numbers cannot touch
      if (!constraints.allowSameNumTouch) {
        if (a === b) return false
      }
    }
  }
  return true
}
