/**
 * main.js
 * Entry point: wires up UI controls to the board generator and renderer.
 *
 * Features:
 *   - Pre-generated board pool for instant shuffles (no loading / no failures)
 *   - Background refilling via requestIdleCallback / setTimeout
 *   - Generate button → pops a board from the pool instantly
 *   - Keyboard shortcut: Space or Enter = shuffle a new board
 *   - Constraint checkboxes control generation rules
 *   - SVG fade transition for smooth continuous shuffling
 *   - If pool is empty, generates synchronously with silent constraint relaxation
 */

import { generateBoard } from './generator.js'
import { renderBoard } from './renderer.js'
import { getConfig } from './board-config.js'
import { DEFAULT_CONSTRAINTS } from './constraints.js'
import { catanBg } from './assets.js'

// ─── Page background ────────────────────────────────────────────────────────

document.body.style.backgroundImage = `url(${catanBg})`
document.body.style.backgroundSize = 'cover'
document.body.style.backgroundPosition = 'center'
document.body.style.backgroundAttachment = 'fixed'

// ─── DOM references ──────────────────────────────────────────────────────────

const boardSvg    = document.getElementById('board-svg')
const generateBtn = document.getElementById('btn-generate')
const statsEl     = document.getElementById('stats')

// ─── Constraints ─────────────────────────────────────────────────────────────

const CHECKBOX_MAP = {
  'cb-68-touch':      'allow68Touch',
  'cb-212-touch':     'allow212Touch',
  'cb-samenum-touch': 'allowSameNumTouch',
  'cb-sameres-touch': 'allowSameResTouch',
}

function readConstraints() {
  const constraints = { ...DEFAULT_CONSTRAINTS }
  for (const [id, key] of Object.entries(CHECKBOX_MAP)) {
    const el = document.getElementById(id)
    if (el) constraints[key] = el.checked
  }
  return constraints
}

/** Serialize constraints to a string key for cache invalidation */
function constraintKey(constraints) {
  return JSON.stringify(constraints)
}

// ─── Board pool ──────────────────────────────────────────────────────────────

const POOL_SIZE = 8           // keep this many boards ready
const config = getConfig('standard')

let pool = []                 // pre-generated boards
let poolConstraintKey = null  // tracks which constraints the pool was built for
let bgTaskId = null           // ID for cancelling background generation

/**
 * Generate one board synchronously and return the result.
 * Always succeeds thanks to the fallback in generator.js.
 */
function generateOne(constraints) {
  return generateBoard(config, constraints)
}

/** Schedule background generation to refill the pool */
function scheduleRefill() {
  if (bgTaskId != null) return // already scheduled

  const schedule = typeof requestIdleCallback === 'function'
    ? (fn) => requestIdleCallback(fn, { timeout: 200 })
    : (fn) => setTimeout(fn, 16)

  function refillStep() {
    bgTaskId = null
    const constraints = readConstraints()
    const key = constraintKey(constraints)

    // If constraints changed since scheduling, pool was already flushed
    if (key !== poolConstraintKey) return

    if (pool.length < POOL_SIZE) {
      const result = generateOne(constraints)
      // Only add if constraints haven't changed during generation
      if (constraintKey(readConstraints()) === key) {
        pool.push(result)
      }
      // Schedule next one
      if (pool.length < POOL_SIZE) {
        bgTaskId = schedule(refillStep)
      }
    }
  }

  bgTaskId = schedule(refillStep)
}

/** Flush pool and start refilling for current constraints */
function resetPool() {
  pool = []
  if (bgTaskId != null) {
    if (typeof cancelIdleCallback === 'function') cancelIdleCallback(bgTaskId)
    else clearTimeout(bgTaskId)
    bgTaskId = null
  }
  poolConstraintKey = constraintKey(readConstraints())
  scheduleRefill()
}

/**
 * Get the next board — from pool if available, otherwise generate on the spot.
 */
function getNextBoard() {
  const constraints = readConstraints()
  const key = constraintKey(constraints)

  // If constraints changed, flush pool
  if (key !== poolConstraintKey) {
    resetPool()
  }

  let result
  if (pool.length > 0) {
    result = pool.shift()
  } else {
    // Pool empty — generate synchronously (always succeeds with fallback)
    result = generateOne(constraints)
  }

  // Trigger background refill
  scheduleRefill()

  return result
}

// ─── Render ──────────────────────────────────────────────────────────────────

function generate() {
  boardSvg.style.opacity = '0'

  requestAnimationFrame(() => {
    const result = getNextBoard()

    renderBoard(boardSvg, result)

    if (result.relaxed) {
      statsEl.textContent = 'Some constraints were relaxed to generate this board.'
    } else {
      statsEl.textContent = `Shuffled in ${result.attempts} attempt${result.attempts === 1 ? '' : 's'}.`
    }

    boardSvg.style.opacity = '1'
  })
}

// ─── Event listeners ─────────────────────────────────────────────────────────

generateBtn.addEventListener('click', generate)

document.addEventListener('keydown', (e) => {
  if (document.activeElement && document.activeElement !== document.body) {
    const tag = document.activeElement.tagName
    if (tag === 'INPUT' || tag === 'BUTTON' || tag === 'SELECT' || tag === 'TEXTAREA') {
      if (e.key === ' ') return
      if (e.key === 'Enter' && tag !== 'BUTTON') return
    }
  }

  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    generate()
  }
})

// On constraint change: flush pool and regenerate
for (const id of Object.keys(CHECKBOX_MAP)) {
  const el = document.getElementById(id)
  if (el) el.addEventListener('change', () => {
    resetPool()
    generate()
  })
}

// ─── Initialise ──────────────────────────────────────────────────────────────

// Set checkboxes to match defaults
for (const [id, key] of Object.entries(CHECKBOX_MAP)) {
  const el = document.getElementById(id)
  if (el) el.checked = DEFAULT_CONSTRAINTS[key]
}

// Initialise pool and render first board
poolConstraintKey = constraintKey(readConstraints())
generate()
