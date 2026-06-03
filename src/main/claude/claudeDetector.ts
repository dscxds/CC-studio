import { exec } from 'child_process'
import type { ClaudeCheckResult } from '../../shared/studio'

export function checkClaudeInstalled(): Promise<ClaudeCheckResult> {
  return new Promise((resolve) => {
    // Windows/macOS 执行 claude --version
    exec('claude --version', (err, stdout) => {
      if (err) {
        resolve({ installed: false, version: '', error: err.message })
      } else {
        resolve({ installed: true, version: stdout.trim() })
      }
    })
  })
}
