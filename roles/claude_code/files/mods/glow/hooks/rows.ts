const READ = new Set(['Read', 'Grep', 'Glob', 'WebFetch', 'WebSearch', 'ToolSearch', 'LS'])
const EDIT = new Set(['Edit', 'MultiEdit', 'Write', 'NotebookEdit'])
const DELEGATE = new Set(['Agent', 'Task', 'Skill', 'Workflow'])

export const dotColor = (tool: string) =>
  READ.has(tool) ? '#5fafff'
  : EDIT.has(tool) ? '#e5b567'
  : tool === 'Bash' ? '#6cc070'
  : DELEGATE.has(tool) ? '#b48ead'
  : tool.startsWith('mcp__') ? '#5fd7d7'
  : '#888888'

export const displayName = (tool: string) => {
  if (tool === 'Grep') return 'Search'
  if (tool.startsWith('mcp__')) return tool.split('__').slice(1).join(' · ')
  return tool
}

const str = (v: unknown) => (typeof v === 'string' ? v : undefined)

export const shortPath = (path: string, cwd: string) =>
  path.startsWith(cwd + '/') ? path.slice(cwd.length + 1) : path.replace(/^\/Users\/[^/]+/, '~')

const clip = (s: string, n = 90) => {
  const line = s.split('\n')[0]
  return line.length > n || s.includes('\n') ? line.slice(0, n) + '…' : line
}

export const summary = (tool: string, input: unknown, cwd: string) => {
  const i = (input ?? {}) as Record<string, unknown>
  const path = str(i.file_path) ?? str(i.notebook_path)
  if (path) return shortPath(path, cwd)
  if (tool === 'Bash') return clip(str(i.command) ?? '')
  if (tool === 'Grep') {
    const where = str(i.path) ? ` in ${shortPath(str(i.path)!, cwd)}` : ''
    return `"${clip(str(i.pattern) ?? '', 60)}"${where}`
  }
  if (DELEGATE.has(tool)) {
    const kind = str(i.subagent_type) ?? str(i.skill)
    const what = str(i.description)
    return [kind, what].filter(Boolean).join(': ')
  }
  const first = Object.values(i).find(v => typeof v === 'string')
  return first ? clip(first as string) : ''
}

const lines = (s: unknown) => (typeof s === 'string' && s.length > 0 ? s.split('\n').length : 0)

export const diffStat = (tool: string, input: unknown) => {
  const i = (input ?? {}) as Record<string, unknown>
  if (tool === 'Edit') return { added: lines(i.new_string), removed: lines(i.old_string) }
  if (tool === 'MultiEdit' && Array.isArray(i.edits)) {
    return (i.edits as Record<string, unknown>[]).reduce(
      (acc, ed) => ({ added: acc.added + lines(ed.new_string), removed: acc.removed + lines(ed.old_string) }),
      { added: 0, removed: 0 },
    )
  }
  if (tool === 'Write') return { added: lines(i.content), removed: 0 }
  return undefined
}

export const activity = (tool: string, input: unknown, cwd: string) => {
  const verb =
    READ.has(tool) ? 'Reading' : EDIT.has(tool) ? 'Editing' : tool === 'Bash' ? 'Running' : DELEGATE.has(tool) ? 'Delegating' : 'Using'
  const what = tool === 'Grep' || tool.startsWith('mcp__') || !READ.has(tool) && !EDIT.has(tool) && tool !== 'Bash' && !DELEGATE.has(tool)
    ? `${displayName(tool)} ${summary(tool, input, cwd)}`
    : summary(tool, input, cwd)
  return clip(`${verb} ${what}`.trim(), 60)
}
