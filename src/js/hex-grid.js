/**
 * hex-grid.js
 * Hex grid math using axial coordinates with pointy-top orientation.
 *
 * Axial coordinates (q, r):
 *   q = column axis (right)
 *   r = row axis (down-right)
 *   s = -q - r  (implicit third cube axis)
 *
 * A hex board of radius N contains all positions where max(|q|, |r|, |q+r|) ≤ N.
 * Standard Catan = radius 2 = 19 hexes.
 */

export const HEX_SIZE = 60 // pixels, center-to-vertex distance

export const SQRT3 = Math.sqrt(3)

/**
 * Six neighbor direction vectors in axial coordinates.
 * Index corresponds to edge index: edge[i] is shared with neighbor in DIRECTIONS[i].
 * For pointy-top hexes, going clockwise from East:
 *   0 = E, 1 = NE, 2 = NW, 3 = W, 4 = SW, 5 = SE
 */
export const DIRECTIONS = [
  { q: +1, r:  0 }, // 0 East
  { q: +1, r: -1 }, // 1 NE
  { q:  0, r: -1 }, // 2 NW
  { q: -1, r:  0 }, // 3 West
  { q: -1, r: +1 }, // 4 SW
  { q:  0, r: +1 }, // 5 SE
]

/**
 * Convert axial coordinates to pixel center (pointy-top hexes).
 * @param {number} q
 * @param {number} r
 * @param {number} [size]
 * @returns {{ x: number, y: number }}
 */
export function axialToPixel(q, r, size = HEX_SIZE) {
  return {
    x: size * (SQRT3 * q + (SQRT3 / 2) * r),
    y: size * (1.5 * r),
  }
}

/**
 * Compute the 6 corner points of a pointy-top hex centered at (cx, cy).
 * Corners are ordered clockwise starting from upper-right (30°).
 * @param {number} cx
 * @param {number} cy
 * @param {number} [size]
 * @returns {Array<{x: number, y: number}>}
 */
export function hexCorners(cx, cy, size = HEX_SIZE) {
  const corners = []
  for (let i = 0; i < 6; i++) {
    const angleDeg = 60 * i + 30
    const angleRad = (Math.PI / 180) * angleDeg
    corners.push({
      x: cx + size * Math.cos(angleRad),
      y: cy + size * Math.sin(angleRad),
    })
  }
  return corners
}

/**
 * Return the SVG polygon points string for a hex.
 * @param {number} cx
 * @param {number} cy
 * @param {number} [size]
 * @returns {string}
 */
export function hexPoints(cx, cy, size = HEX_SIZE) {
  return hexCorners(cx, cy, size)
    .map(c => `${c.x.toFixed(2)},${c.y.toFixed(2)}`)
    .join(' ')
}

/**
 * Get the hex distance (cube distance) between two axial positions.
 * Two hexes are adjacent if and only if distance === 1.
 * @param {{ q: number, r: number }} a
 * @param {{ q: number, r: number }} b
 * @returns {number}
 */
export function hexDistance(a, b) {
  const dq = a.q - b.q
  const dr = a.r - b.r
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2
}

/**
 * Check if two hex positions are adjacent (distance === 1).
 * @param {{ q: number, r: number }} a
 * @param {{ q: number, r: number }} b
 * @returns {boolean}
 */
export function areAdjacent(a, b) {
  return hexDistance(a, b) === 1
}

/**
 * Build a Set<"q,r"> for fast membership testing.
 * @param {Array<{q: number, r: number}>} positions
 * @returns {Set<string>}
 */
export function buildHexSet(positions) {
  return new Set(positions.map(p => `${p.q},${p.r}`))
}

/**
 * Get the outward normal direction (as unit vector) for a hex edge.
 * The edge 'dir' faces away from the hex center toward DIRECTIONS[dir].
 * @param {number} cx  - hex center x
 * @param {number} cy  - hex center y
 * @param {number} dir - edge index (0-5)
 * @param {number} [size]
 * @returns {{ nx: number, ny: number, edgeMidX: number, edgeMidY: number }}
 */
export function edgeOutwardNormal(cx, cy, dir, size = HEX_SIZE) {
  const corners = hexCorners(cx, cy, size)
  // For pointy-top hexes with corners starting at 30°, the edge for direction dir
  // connects corners[(5-dir)] and corners[(6-dir)%6].
  //   dir=0 (E):  corners[5] (330°) ↔ corners[0] (30°)  → midpoint at 0°   ✓
  //   dir=1 (NE): corners[4] (270°) ↔ corners[5] (330°) → midpoint at 300° ✓
  //   dir=2 (NW): corners[3] (210°) ↔ corners[4] (270°) → midpoint at 240° ✓
  //   dir=3 (W):  corners[2] (150°) ↔ corners[3] (210°) → midpoint at 180° ✓
  //   dir=4 (SW): corners[1] (90°)  ↔ corners[2] (150°) → midpoint at 120° ✓
  //   dir=5 (SE): corners[0] (30°)  ↔ corners[1] (90°)  → midpoint at 60°  ✓
  const c1 = corners[5 - dir]
  const c2 = corners[(6 - dir) % 6]
  const edgeMidX = (c1.x + c2.x) / 2
  const edgeMidY = (c1.y + c2.y) / 2
  const dx = edgeMidX - cx
  const dy = edgeMidY - cy
  const len = Math.sqrt(dx * dx + dy * dy)
  return {
    nx: dx / len,
    ny: dy / len,
    edgeMidX,
    edgeMidY,
  }
}
