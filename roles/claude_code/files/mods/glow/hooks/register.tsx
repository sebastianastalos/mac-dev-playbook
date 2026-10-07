import { atom, read, update } from 'claude-code'
import type { Register, Timer } from 'claude-code'

import type { Mood } from '../types'
import { activity, diffStat, dotColor, displayName, summary } from './rows'
import { cells, COLUMNS, FRAMES, ROWS } from './sprite'

const mood = atom({ plugin: 'glow', key: 'mood' } as const, 'idle' as Mood)
const doing = atom({ plugin: 'glow', key: 'activity' } as const, '')
const frame = atom({ plugin: 'glow', key: 'frame' } as const, 0)

const MOOD_TEXT: Record<Mood, { label: string; color: string }> = {
  idle: { label: 'idle', color: '#888888' },
  working: { label: 'working', color: '#d97757' },
  failed: { label: 'something failed', color: '#ff6b6b' },
  done: { label: 'done', color: '#6cc070' },
}

export const register: Register = on => {
  let ticker: Timer | undefined
  let settle: Timer | undefined

  on('prompt.submit', async ($, e, next) => {
    settle?.cancel()
    await update($, mood, () => 'working')
    await update($, doing, () => 'Thinking…')
    ticker?.cancel()
    ticker = $.clock.every(450, () => void update($, frame, n => n + 1))
    return next(e)
  }).catch(($, e, next) => next(e))

  on('tool.call', async ($, e, next) => {
    const now = activity(e.tool, e, await $.session.cwd())
    await update($, doing, () => now)
    if ((await read($, mood)) !== 'failed') await update($, mood, () => 'working')
    const ran = await next(e)
    if (e.tool === 'Bash') await update($, mood, () => (ran.isError ? 'failed' : 'working'))
    return ran
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    ticker?.cancel()
    const failed = (await read($, mood)) === 'failed' || e.reason === 'error'
    await update($, mood, () => (failed ? 'failed' : 'done'))
    await update($, doing, () => (failed ? 'Needs a look' : e.reason === 'aborted' ? 'Interrupted' : 'All done'))
    settle?.cancel()
    settle = $.clock.after(60_000, () => {
      void update($, mood, () => 'idle')
      void update($, doing, () => '')
    })
    return next(e)
  })

  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    if (e.surface !== 'terminal' && e.surface !== 'desktop') return next(e)
    const { Box, Text } = $.ui.resolve(e)
    const { tool, input, isRunning, isErrored, isInterrupted } = e.props
    const cwd = await $.session.cwd()
    const stat = diffStat(tool, input)
    const dot = isErrored ? '#ff6b6b' : isInterrupted ? '#666666' : dotColor(tool)
    const args = summary(tool, input, cwd)

    return (
      <Box flexDirection="row" justifyContent="space-between">
        <Box flexDirection="row" flexShrink={1}>
          <Text color={dot} dimColor={isRunning}>{isRunning ? '○ ' : '● '}</Text>
          <Text bold>{displayName(tool)}</Text>
          {args ? <Text wrap="truncate-end"> ({args})</Text> : null}
          {isInterrupted ? <Text dimColor> · interrupted</Text> : null}
        </Box>
        {stat ? (
          <Box flexDirection="row" flexShrink={0}>
            <Text color="#6cc070"> +{stat.added}</Text>
            <Text color="#ff6b6b"> -{stat.removed}</Text>
          </Box>
        ) : null}
      </Box>
    )
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.surface !== 'terminal' || e.props.hasSurvey || e.props.maxRows < ROWS) return next(e)
    const { Box, Text, Raster } = $.ui.resolve(e)
    const m = await read($, mood)
    const frames = FRAMES[m]
    const pixels = frames[(await read($, frame)) % frames.length]
    const text = await read($, doing)

    return (
      <Box flexDirection="row" gap={2} alignItems="center">
        <Raster key="pal" columns={COLUMNS} rows={ROWS} cells={cells(pixels)} />
        <Box flexDirection="column">
          {text ? <Text color={MOOD_TEXT[m].color} bold>◇ {text}</Text> : null}
          <Text dimColor>{MOOD_TEXT[m].label}</Text>
        </Box>
      </Box>
    )
  })
}
