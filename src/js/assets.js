/**
 * assets.js
 * Central import map for all image assets.
 *
 * Vite resolves these imports at build time, producing hashed URLs.
 * To swap in new images later, only change the import paths here —
 * no changes needed in renderer.js or anywhere else.
 */

// --- Background / environment images ---
import catanBg        from '../assets/catan-bg.png'
import gameBackground from '../assets/game-background.png'

export { catanBg, gameBackground }

// --- Tile images (resource hex backgrounds) ---
import grainTile   from '../assets/tiles/grain.png'
import lumberTile  from '../assets/tiles/lumber.png'
import woolTile    from '../assets/tiles/wool.png'
import oreTile     from '../assets/tiles/ore.png'
import brickTile   from '../assets/tiles/brick.png'
import desertTile  from '../assets/tiles/desert.png'

// --- Number token images ---
import num2  from '../assets/numbers/2.svg'
import num3  from '../assets/numbers/3.svg'
import num4  from '../assets/numbers/4.svg'
import num5  from '../assets/numbers/5.svg'
import num6  from '../assets/numbers/6.svg'
import num8  from '../assets/numbers/8.svg'
import num9  from '../assets/numbers/9.svg'
import num10 from '../assets/numbers/10.svg'
import num11 from '../assets/numbers/11.svg'
import num12 from '../assets/numbers/12.svg'

// --- Port token images ---
import portGeneric from '../assets/ports/any-3-to-1.png'
import portGrain   from '../assets/ports/grain-2-to-1.png'
import portLumber  from '../assets/ports/lumber-2-to-1.png'
import portWool    from '../assets/ports/wool-2-to-1.png'
import portOre     from '../assets/ports/ore-2-to-1.png'
import portBrick   from '../assets/ports/brick-2-to-1.png'

/**
 * Map from resource name → tile image URL.
 * @type {Record<string, string>}
 */
export const TILE_IMAGES = {
  grain:  grainTile,
  lumber: lumberTile,
  wool:   woolTile,
  ore:    oreTile,
  brick:  brickTile,
  desert: desertTile,
}

/**
 * Map from number value → token image URL.
 * @type {Record<number, string>}
 */
export const NUMBER_IMAGES = {
  2:  num2,
  3:  num3,
  4:  num4,
  5:  num5,
  6:  num6,
  8:  num8,
  9:  num9,
  10: num10,
  11: num11,
  12: num12,
}

/**
 * Map from port type name → port image URL.
 * @type {Record<string, string>}
 */
export const PORT_IMAGES = {
  generic: portGeneric,
  grain:   portGrain,
  lumber:  portLumber,
  wool:    portWool,
  ore:     portOre,
  brick:   portBrick,
}

/**
 * Fallback accent colors (used in legend and as CSS fallback if images fail to load).
 * @type {Record<string, string>}
 */
export const RESOURCE_COLORS = {
  grain:  '#F5D020',
  lumber: '#2D5A1B',
  wool:   '#8BC34A',
  ore:    '#78909C',
  brick:  '#C1440E',
  desert: '#C8B560',
}

export const PORT_COLORS = {
  generic: '#D4A853',
  grain:   '#F5D020',
  lumber:  '#2D5A1B',
  wool:    '#8BC34A',
  ore:     '#78909C',
  brick:   '#C1440E',
}
