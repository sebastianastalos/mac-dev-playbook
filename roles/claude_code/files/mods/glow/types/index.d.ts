export type Mood = 'idle' | 'working' | 'failed' | 'done'

declare module 'claude-code' {
  interface PluginState {
    glow: { mood: Mood; activity: string; frame: number }
  }
}
