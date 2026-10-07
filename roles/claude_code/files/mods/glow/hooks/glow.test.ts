import { expect, test } from 'claude-code/testing'

import { activity, diffStat, displayName, dotColor, summary } from './rows'
import { cells, COLUMNS, FRAMES, ROWS } from './sprite'

test('every mascot frame is 12×8 and encodes to the raster size', () => {
  for (const frames of Object.values(FRAMES)) {
    for (const pixels of frames) {
      expect(pixels.length).toBe(8)
      for (const row of pixels) expect(row.length).toBe(12)
      const bytes = atob(cells(pixels)).length
      expect(bytes).toBe(COLUMNS * ROWS * 3 * 4)
    }
  }
})

test('tool rows get colours, names and short arguments', () => {
  expect(dotColor('Read')).toBe('#5fafff')
  expect(dotColor('Edit')).toBe('#e5b567')
  expect(dotColor('Bash')).toBe('#6cc070')
  expect(dotColor('Agent')).toBe('#b48ead')
  expect(displayName('Grep')).toBe('Search')
  expect(summary('Read', { file_path: '/repo/src/auth.ts' }, '/repo')).toBe('src/auth.ts')
  expect(summary('Grep', { pattern: 'next=', path: '/repo/src' }, '/repo')).toBe('"next=" in src')
  expect(summary('Agent', { subagent_type: 'Explore', description: 'find callers' }, '/repo')).toBe('Explore: find callers')
  expect(diffStat('Edit', { old_string: 'a\nb', new_string: 'a\nb\nc' })).toEqual({ added: 3, removed: 2 })
  expect(activity('Bash', { command: 'pnpm test' }, '/repo')).toBe('Running pnpm test')
})
