import type { Mood } from '../types'

// 12×8 pixels, drawn two pixels per cell with half blocks
const PALETTE: Record<string, number> = {
  O: 0xd97757, // body
  D: 0x1e1e1e, // eyes
  B: 0x5fafff, // sweat
  Y: 0xf5d76e, // sparkle
}
const NONE = 0x01000000

const BODY = ['..OOOOOOOO..', '.OOOOOOOOOO.']
const ARMS = ['OOOOOOOOOOOO', '.OOOOOOOOOO.']

export const FRAMES: Record<Mood, string[][]> = {
  idle: [['............', ...BODY, '.OODOOOODOO.', ...ARMS, '..O.O..O.O..', '............']],
  working: [
    ['............', ...BODY, '.OOODOOOODO.', ...ARMS, '..O.O..O.O..', '............'],
    [...BODY, '.ODOOOODOOO.', ...ARMS, '.O.O....O.O.', '............', '............'],
  ],
  failed: [['...........B', ...BODY, '.ODDOOOODDO.', ...ARMS, '..O.O..O.O..', '............']],
  done: [['Y..........Y', '..OOOOOOOO..', '.OODOOOODOO.', '.ODODOODODO.', ...ARMS, '..O.O..O.O..', '............']],
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

const toBase64 = (bytes: Uint8Array) => {
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0)
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63]
    out += i + 1 < bytes.length ? B64[(n >> 6) & 63] : '='
    out += i + 2 < bytes.length ? B64[n & 63] : '='
  }
  return out
}

export const COLUMNS = 12
export const ROWS = 4

export const cells = (pixels: string[]) => {
  const words = new Uint32Array(COLUMNS * ROWS * 3)
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLUMNS; col++) {
      const top = PALETTE[pixels[row * 2][col]]
      const bottom = PALETTE[pixels[row * 2 + 1][col]]
      const at = (row * COLUMNS + col) * 3
      if (top === undefined && bottom === undefined) words.set([0x20, NONE, NONE], at)
      else if (top === undefined) words.set([0x2584, bottom, NONE], at)
      else words.set([0x2580, top, bottom ?? NONE], at)
    }
  }
  return toBase64(new Uint8Array(words.buffer))
}
