import { spawn as spawnProcess, type ChildProcess } from 'node:child_process'
import type { BrowserWindow } from 'electron'

type PtyProcess = {
  onData: (callback: (data: string) => void) => void
  onExit: (callback: (event: { exitCode: number }) => void) => void
  resize: (cols: number, rows: number) => void
  write: (data: string) => void
  kill: () => void
}

type PtyModule = {
  spawn: (
    file: string,
    args: string[],
    options: {
      name: string
      cols: number
      rows: number
      cwd: string
      env: Record<string, string>
    }
  ) => PtyProcess
}

let ptyModule: PtyModule | null = null

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ptyModule = require('node-pty') as PtyModule
} catch (error) {
  console.warn('Failed to load node-pty, falling back to child_process.spawn:', error)
}

export class ClaudeSession {
  private ptyProcess: PtyProcess | null = null
  private childProcess: ChildProcess | null = null
  private readonly mainWindow: BrowserWindow
  private readonly projectPath: string
  private isPtyMode = false
  private exitCallback: ((exitCode: number) => void) | null = null

  constructor(mainWindow: BrowserWindow, projectPath: string) {
    this.mainWindow = mainWindow
    this.projectPath = projectPath
  }

  public setExitCallback(callback: (exitCode: number) => void): void {
    this.exitCallback = callback
  }

  private sendToRenderer(channel: string, ...args: unknown[]): void {
    if (!this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, ...args)
    }
  }

  private handleExit(exitCode: number): void {
    this.sendToRenderer('claude-session-ended', exitCode)
    this.exitCallback?.(exitCode)
  }

  public start(cols?: number, rows?: number): void {
    this.isPtyMode = ptyModule !== null

    if (this.isPtyMode && ptyModule) {
      try {
        const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash'
        const args: string[] = []

        if (process.platform === 'win32') {
          args.push('-NoExit', '-Command', 'chcp 65001; clear; claude')
        }

        this.ptyProcess = ptyModule.spawn(shell, args, {
          name: 'xterm-color',
          cols: cols ?? 100,
          rows: rows ?? 30,
          cwd: this.projectPath,
          env: process.env as Record<string, string>
        })

        this.ptyProcess.onData((data: string) => {
          this.sendToRenderer('claude-output', data)
        })

        this.ptyProcess.onExit(({ exitCode }: { exitCode: number }) => {
          this.handleExit(exitCode)
        })

        if (process.platform !== 'win32') {
          this.ptyProcess.write('claude\r')
        }

        return
      } catch (error) {
        console.error('PTY spawn failed, falling back to standard spawn:', error)
        this.isPtyMode = false
      }
    }

    this.startStandardSpawn(cols, rows)
  }

  private startStandardSpawn(cols?: number, rows?: number): void {
    const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash'
    const args: string[] = []

    if (process.platform === 'win32') {
      const nextCols = cols ?? 100
      const nextRows = rows ?? 30
      args.push(
        '-NoExit',
        '-Command',
        `chcp 65001; $Host.UI.RawUI.BufferSize = New-Object System.Management.Automation.Host.Size(${nextCols}, 1000); $Host.UI.RawUI.WindowSize = New-Object System.Management.Automation.Host.Size(${nextCols}, ${nextRows}); clear; claude`
      )
    }

    this.childProcess = spawnProcess(shell, args, {
      cwd: this.projectPath,
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        LANG: 'en_US.UTF-8',
        LC_ALL: 'en_US.UTF-8'
      }
    })

    this.childProcess.stdout?.on('data', (data: Buffer | string) => {
      this.sendToRenderer('claude-output', data.toString())
    })

    this.childProcess.stderr?.on('data', (data: Buffer | string) => {
      this.sendToRenderer('claude-output', data.toString())
    })

    this.childProcess.on('exit', (code: number | null) => {
      this.handleExit(code ?? 0)
    })

    if (process.platform !== 'win32') {
      this.childProcess.stdin?.write('claude\n')
    }
  }

  public write(data: string): void {
    if (this.isPtyMode && this.ptyProcess) {
      this.ptyProcess.write(data)
      return
    }

    this.childProcess?.stdin?.write(data)
  }

  public resize(cols: number, rows: number): void {
    if (this.isPtyMode && this.ptyProcess) {
      try {
        this.ptyProcess.resize(cols, rows)
      } catch (error) {
        console.error('Resize error:', error)
      }
    }
  }

  public kill(): void {
    if (this.ptyProcess) {
      try {
        this.ptyProcess.kill()
      } catch (error) {
        console.error('Error killing PTY:', error)
      }
      this.ptyProcess = null
    }

    if (this.childProcess) {
      try {
        this.childProcess.kill()
      } catch (error) {
        console.error('Error killing child process:', error)
      }
      this.childProcess = null
    }
  }
}
