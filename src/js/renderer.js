/**
 * renderer.js
 * SVG-based board renderer.
 *
 * Rendering layers (drawn in order):
 *   0. Board frame — game-background.png (ocean frame with docks)
 *   1. Hex tiles — resource images clipped to hex polygon shape
 *   2. Port tokens — port images rotated to face inland, at dock positions
 *   3. Number tokens — number images centered on each non-desert hex
 *
 * The board frame is rendered INSIDE the SVG so it shares the same coordinate
 * system as the hex tiles and ports, guaranteeing dock-port alignment.
 */

import { axialToPixel, hexCorners, hexPoints, HEX_SIZE } from './hex-grid.js'
import { TILE_IMAGES, NUMBER_IMAGES, PORT_IMAGES, gameBackground } from './assets.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

// SVG viewport: centered at (OFFSET_X, OFFSET_Y)
const VIEW_W = 640
const VIEW_H = 580
const OFFSET_X = VIEW_W / 2   // 320
const OFFSET_Y = VIEW_H / 2   // 290

// Token sizes
const NUMBER_TOKEN_SIZE = 42   // image width/height for number tokens
const PORT_TOKEN_SIZE   = 42   // image width/height for port tokens

// Board frame: image-pixels-to-SVG-pixels scale.
// The game-background.png (1800×1581) has a zigzag cutout whose outermost points
// span ~1230px wide. The hex grid's equivalent span is ~520px in SVG coords.
// Scale = 520 / 1230 ≈ 0.423. Adjust this value to fine-tune frame alignment.
const FRAME_IMAGE_SCALE = 0.38

/**
 * Create an SVG element in the SVG namespace.
 */
function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag)
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, String(v))
  }
  return el
}

/**
 * Get the pixel center of a hex tile.
 */
function tileCenter(q, r) {
  const { x, y } = axialToPixel(q, r)
  return { cx: x + OFFSET_X, cy: y + OFFSET_Y }
}

// ─── Layer 0: Board frame ────────────────────────────────────────────────────

/**
 * Render the game-background.png as the base layer.
 * Sized so its inner cutout aligns with the hex grid perimeter.
 */
function makeFrameBackground() {
  const frameW = 1800 * FRAME_IMAGE_SCALE
  const frameH = 1581 * FRAME_IMAGE_SCALE

  return svgEl('image', {
    href: gameBackground,
    x: OFFSET_X - frameW / 2,
    y: OFFSET_Y - frameH / 2,
    width: frameW,
    height: frameH,
  })
}

// ─── Layer 1: Hex tiles ───────────────────────────────────────────────────────

function makeHexClipPath(q, r) {
  const { cx, cy } = tileCenter(q, r)
  const safeQ = q < 0 ? `n${Math.abs(q)}` : `${q}`
  const safeR = r < 0 ? `n${Math.abs(r)}` : `${r}`
  const id = `hex-clip-${safeQ}-${safeR}`

  const clipPath = svgEl('clipPath', { id })
  const poly = svgEl('polygon', { points: hexPoints(cx, cy) })
  clipPath.appendChild(poly)
  return { clipPath, id }
}

function makeTileImage(tile, clipId) {
  const { cx, cy } = tileCenter(tile.q, tile.r)
  const size = HEX_SIZE
  return svgEl('image', {
    href: TILE_IMAGES[tile.resource],
    x: cx - size,
    y: cy - size,
    width:  size * 2,
    height: size * 2,
    'clip-path': `url(#${clipId})`,
    preserveAspectRatio: 'xMidYMid slice',
  })
}

function makeHexBorder(tile) {
  const { cx, cy } = tileCenter(tile.q, tile.r)
  return svgEl('polygon', {
    points: hexPoints(cx, cy),
    fill: 'none',
    stroke: '#5A3E00',
    'stroke-width': '2',
    'stroke-linejoin': 'round',
  })
}

// ─── Layer 2: Port tokens ─────────────────────────────────────────────────────

/**
 * Build a port token <image> element, positioned at the dock location
 * defined by imgX/imgY in the background image, rotated to face inland.
 */
function makePortImage(port) {
  // Convert image-relative coordinates (0-1) to SVG coordinates
  const frameW = 1800 * FRAME_IMAGE_SCALE
  const frameH = 1581 * FRAME_IMAGE_SCALE
  const frameX = OFFSET_X - frameW / 2
  const frameY = OFFSET_Y - frameH / 2

  const pcx = frameX + port.imgX * frameW
  const pcy = frameY + port.imgY * frameH

  // Rotation: point the port's top (UP) toward the board center
  const angleToCenter = Math.atan2(OFFSET_Y - pcy, OFFSET_X - pcx) * (180 / Math.PI)
  const rotation = angleToCenter + 90

  const half = PORT_TOKEN_SIZE / 2
  return svgEl('image', {
    href: PORT_IMAGES[port.type],
    x: pcx - half,
    y: pcy - half,
    width: PORT_TOKEN_SIZE,
    height: PORT_TOKEN_SIZE,
    transform: `rotate(${rotation.toFixed(1)}, ${pcx.toFixed(1)}, ${pcy.toFixed(1)})`,
  })
}

// ─── Layer 3: Number tokens ───────────────────────────────────────────────────

function makeNumberImage(tile) {
  if (tile.number === null) return null
  const { cx, cy } = tileCenter(tile.q, tile.r)
  const half = NUMBER_TOKEN_SIZE / 2
  return svgEl('image', {
    href: NUMBER_IMAGES[tile.number],
    x: cx - half,
    y: cy - half,
    width: NUMBER_TOKEN_SIZE,
    height: NUMBER_TOKEN_SIZE,
  })
}

// ─── Main render function ─────────────────────────────────────────────────────

export function renderBoard(svgElement, { tiles, ports }) {
  while (svgElement.firstChild) svgElement.removeChild(svgElement.firstChild)

  svgElement.setAttribute('viewBox', `0 0 ${VIEW_W} ${VIEW_H}`)

  // Layer 0: Board frame (game-background.png with ocean + docks)
  svgElement.appendChild(makeFrameBackground())

  // Build <defs> for hex clip paths
  const defs = svgEl('defs')
  const clipIds = {}
  for (const tile of tiles) {
    const { clipPath, id } = makeHexClipPath(tile.q, tile.r)
    defs.appendChild(clipPath)
    const safeQ = tile.q < 0 ? `n${Math.abs(tile.q)}` : `${tile.q}`
    const safeR = tile.r < 0 ? `n${Math.abs(tile.r)}` : `${tile.r}`
    clipIds[`${safeQ},${safeR}`] = id
  }
  svgElement.appendChild(defs)

  // Layer 1a: Tile images (clipped)
  const tileLayer = svgEl('g', { class: 'layer-tiles' })
  for (const tile of tiles) {
    const safeQ = tile.q < 0 ? `n${Math.abs(tile.q)}` : `${tile.q}`
    const safeR = tile.r < 0 ? `n${Math.abs(tile.r)}` : `${tile.r}`
    const id = clipIds[`${safeQ},${safeR}`]
    tileLayer.appendChild(makeTileImage(tile, id))
  }
  svgElement.appendChild(tileLayer)

  // Layer 1b: Hex borders
  const borderLayer = svgEl('g', { class: 'layer-borders' })
  for (const tile of tiles) {
    borderLayer.appendChild(makeHexBorder(tile))
  }
  svgElement.appendChild(borderLayer)

  // Layer 2: Port tokens
  const portLayer = svgEl('g', { class: 'layer-ports' })
  for (const port of ports) {
    portLayer.appendChild(makePortImage(port))
  }
  svgElement.appendChild(portLayer)

  // Layer 3: Number tokens
  const tokenLayer = svgEl('g', { class: 'layer-numbers' })
  for (const tile of tiles) {
    const img = makeNumberImage(tile)
    if (img) tokenLayer.appendChild(img)
  }
  svgElement.appendChild(tokenLayer)
}

export function renderFailure(svgElement) {
  while (svgElement.firstChild) svgElement.removeChild(svgElement.firstChild)
  svgElement.setAttribute('viewBox', `0 0 ${VIEW_W} ${VIEW_H}`)

  svgElement.appendChild(makeFrameBackground())

  const bg = svgEl('rect', {
    x: VIEW_W / 2 - 220, y: VIEW_H / 2 - 50,
    width: 440, height: 100, rx: 12,
    fill: '#FFFFF0', stroke: '#B22222', 'stroke-width': '2',
  })
  const text = svgEl('text', {
    x: VIEW_W / 2, y: VIEW_H / 2 - 8,
    'text-anchor': 'middle', 'dominant-baseline': 'middle',
    'font-size': '16', 'font-family': 'Georgia, serif',
    fill: '#B22222', 'font-weight': 'bold',
  })
  text.textContent = 'Could not generate a valid board.'
  const hint = svgEl('text', {
    x: VIEW_W / 2, y: VIEW_H / 2 + 18,
    'text-anchor': 'middle', 'dominant-baseline': 'middle',
    'font-size': '13', 'font-family': 'Arial, sans-serif', fill: '#666',
  })
  hint.textContent = 'Try relaxing the constraint settings and shuffling again.'
  svgElement.appendChild(bg)
  svgElement.appendChild(text)
  svgElement.appendChild(hint)
}
