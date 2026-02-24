/**
 * generator.js
 * Board generation with constraint-aware placement.
 *
 * Resource placement uses backtracking graph coloring instead of random
 * shuffle+check, making the same-resource-no-adjacent constraint reliably
 * solvable (hex grids with 5 resource types are well within graph coloring
 * feasibility).
 *
 * Number placement uses shuffle+retry (fast enough with 50 retries per
 * valid resource layout).
 *
 * If constrained generation still fails, constraints are progressively
 * relaxed so the user always gets a board.
 *
 * Ports: always shuffled (no placement constraints in standard Catan).
 */

import { checkResourceConstraints, checkNumberConstraints } from './constraints.js'
import { areAdjacent } from './hex-grid.js'

const MAX_RESOURCE_ATTEMPTS = 10   // backtracking attempts (each is thorough)
const MAX_NUMBER_ATTEMPTS   = 100

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
 * Build adjacency lists for the hex positions.
 * @param {Array<{q, r}>} positions
 * @returns {number[][]} adjacency[i] = array of indices adjacent to position i
 */
function buildAdjacency(positions) {
  const adj = positions.map(() => [])
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      if (areAdjacent(positions[i], positions[j])) {
        adj[i].push(j)
        adj[j].push(i)
      }
    }
  }
  return adj
}

/**
 * Place resources using backtracking (graph coloring with fixed color counts).
 *
 * Positions are processed in order of most-constrained-first (most neighbors).
 * For each position, available resources are tried in random order. A resource
 * is valid if it has remaining count AND no adjacent already-placed tile has
 * the same resource (when the constraint is active).
 *
 * @param {Array<{q,r}>} positions - hex positions
 * @param {string[]} resources - resource pool (e.g., 4 grain, 4 lumber, ...)
 * @param {boolean} enforceNoAdjacentSame - whether same-resource adjacency is forbidden
 * @returns {string[]|null} - resource assignment per position, or null if failed
 */
function placeResourcesBacktracking(positions, resources, enforceNoAdjacentSame) {
  const n = positions.length
  const adj = buildAdjacency(positions)

  // Count available resources
  const pool = {}
  for (const r of resources) {
    pool[r] = (pool[r] || 0) + 1
  }
  const resourceTypes = Object.keys(pool)

  // Order positions: most neighbors first (most constrained first)
  const order = Array.from({ length: n }, (_, i) => i)
  order.sort((a, b) => adj[b].length - adj[a].length)

  const assignment = new Array(n).fill(null)
  const remaining = { ...pool }

  function backtrack(step) {
    if (step === n) return true

    const idx = order[step]
    // Collect which resources are used by already-assigned neighbors
    const neighborResources = new Set()
    if (enforceNoAdjacentSame) {
      for (const ni of adj[idx]) {
        if (assignment[ni] !== null) {
          neighborResources.add(assignment[ni])
        }
      }
    }

    // Try resources in random order
    const candidates = shuffle([...resourceTypes])
    for (const res of candidates) {
      if (remaining[res] <= 0) continue
      if (enforceNoAdjacentSame && neighborResources.has(res)) continue

      // Place
      assignment[idx] = res
      remaining[res]--

      if (backtrack(step + 1)) return true

      // Undo
      assignment[idx] = null
      remaining[res]++
    }

    return false
  }

  const success = backtrack(0)
  return success ? assignment : null
}

/**
 * Try to generate a board with specific constraints.
 * Returns { tiles, attempts } where tiles is null on failure.
 */
function tryGenerate(config, constraints) {
  const { hexPositions, resources, numbers } = config
  const enforceNoAdjacentRes = !constraints.allowSameResTouch

  let tiles = null
  let totalAttempts = 0

  for (let resAttempt = 0; resAttempt < MAX_RESOURCE_ATTEMPTS; resAttempt++) {
    totalAttempts++

    // --- Stage 1: Resource placement via backtracking ---
    const resourceAssignment = placeResourcesBacktracking(
      hexPositions, resources, enforceNoAdjacentRes
    )

    if (!resourceAssignment) continue

    const draftTiles = hexPositions.map((pos, i) => ({
      q: pos.q,
      r: pos.r,
      resource: resourceAssignment[i],
      number: null,
    }))

    // --- Stage 2: Number placement via shuffle+retry ---
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
 */
const RELAXATION_KEYS = [
  'allowSameResTouch',
  'allowSameNumTouch',
  'allow212Touch',
  'allow68Touch',
]

/**
 * Generate a valid Catan board. Always succeeds — if the requested constraints
 * are too strict, constraints are silently relaxed one by one until a board is found.
 */
export function generateBoard(config, constraints) {
  const { portSlots, portTypes } = config

  let result = tryGenerate(config, constraints)
  let relaxed = false

  if (!result.tiles) {
    const relaxedConstraints = { ...constraints }
    for (const key of RELAXATION_KEYS) {
      if (relaxedConstraints[key]) continue
      relaxedConstraints[key] = true
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
