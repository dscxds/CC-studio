import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import * as fs from 'node:fs'
import { join } from 'node:path'
import * as path from 'node:path'

import { electronApp, is, optimizer } from '@electron-toolkit/utils'

import icon from '../../resources/icon.png?asset'
import type { DBTask, TaskStatus } from '../shared/studio'
import { checkClaudeInstalled } from './claude/claudeDetector'
import { ClaudeSession } from './claude/claudeSession'
import { JsonStore } from './db/jsonStore'
import { checkIsGitRepo } from './project/gitManager'
import { SnapshotManager } from './project/snapshotManager'

let activeSession: ClaudeSession | null = null
let mainWindow: BrowserWindow | null = null
let activeProjectPath: string | null = null

const store = new JsonStore()
const snapshotManager = new SnapshotManager()

function validatePath(basePath: string, targetPath: string): string {
  const resolvedBase = path.resolve(basePath)
  const resolvedTarget = path.resolve(basePath, targetPath)

  if (!resolvedTarget.startsWith(resolvedBase + path.sep) && resolvedTarget !== resolvedBase) {
    throw new Error(`Path traversal blocked: ${targetPath} escapes ${basePath}`)
  }

  return resolvedTarget
}

function validateAbsolutePath(basePath: string, absolutePath: string): string {
  const resolvedBase = path.resolve(basePath)
  const resolvedTarget = path.resolve(absolutePath)

  if (!resolvedTarget.startsWith(resolvedBase + path.sep) && resolvedTarget !== resolvedBase) {
    throw new Error(`Path traversal blocked: ${absolutePath} escapes ${basePath}`)
  }

  return resolvedTarget
}

function ensureProjectDirectory(projectPath: string): void {
  if (!fs.existsSync(projectPath) || !fs.statSync(projectPath).isDirectory()) {
    throw new Error(`Invalid project path: ${projectPath}`)
  }
}

function closeRunningTasksForActiveProject(
  status: Exclude<TaskStatus, 'running'>,
  exitCode: number
): void {
  if (activeProjectPath) {
    store.closeRunningTasksForProject(activeProjectPath, status, exitCode)
  }
}

function createWindow(): void {
  const nextWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow = nextWindow

  nextWindow.on('ready-to-show', () => {
    nextWindow.show()
  })

  nextWindow.on('closed', () => {
    activeSession?.kill()
    activeSession = null
    mainWindow = null
  })

  nextWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    nextWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    nextWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerIpcHandlers(): void {
  ipcMain.handle('select-directory', async () => {
    const focusedWindow = BrowserWindow.getFocusedWindow()
    if (!focusedWindow) {
      return null
    }

    const result = await dialog.showOpenDialog(focusedWindow, {
      properties: ['openDirectory']
    })

    return result.filePaths[0] || null
  })

  ipcMain.handle('check-claude', async () => checkClaudeInstalled())

  ipcMain.on('start-session', (_event, projectPath: string, cols?: number, rows?: number) => {
    ensureProjectDirectory(projectPath)

    activeSession?.kill()

    if (!mainWindow) {
      return
    }

    activeProjectPath = projectPath
    activeSession = new ClaudeSession(mainWindow, projectPath)
    activeSession.setExitCallback((exitCode: number) => {
      closeRunningTasksForActiveProject(exitCode === 0 ? 'completed' : 'failed', exitCode)
    })
    activeSession.start(cols, rows)
  })

  ipcMain.on('send-session-input', (_event, data: string) => {
    activeSession?.write(data)
  })

  ipcMain.on('resize-session', (_event, cols: number, rows: number) => {
    activeSession?.resize(cols, rows)
  })

  ipcMain.handle('db-get-projects', () => store.getProjects())

  ipcMain.handle('db-save-project', (_event, project: { id: string; name: string; path: string }) =>
    store.saveProject(project)
  )

  ipcMain.handle('db-get-tasks', (_event, projectId: string) => store.getTasks(projectId))

  ipcMain.handle('db-save-task', (_event, task: DBTask) => {
    store.saveTask(task)
    return true
  })

  ipcMain.handle(
    'db-close-running-tasks',
    (
      _event,
      payload: {
        projectId: string
        status: Exclude<TaskStatus, 'running'>
        exitCode?: number | null
      }
    ) => {
      store.closeRunningTasksForProject(payload.projectId, payload.status, payload.exitCode ?? null)
      return true
    }
  )

  ipcMain.handle('check-claude-md', (_event, projectPath: string) => {
    try {
      ensureProjectDirectory(projectPath)
      const target = path.join(projectPath, 'CLAUDE.md')
      validateAbsolutePath(projectPath, target)
      return fs.existsSync(target)
    } catch {
      return false
    }
  })

  ipcMain.handle('read-claude-md', (_event, projectPath: string) => {
    try {
      ensureProjectDirectory(projectPath)
      const target = path.join(projectPath, 'CLAUDE.md')
      validateAbsolutePath(projectPath, target)

      if (fs.existsSync(target)) {
        return fs.readFileSync(target, 'utf8')
      }
    } catch (error) {
      console.error('read-claude-md validation error:', error)
    }

    return ''
  })

  ipcMain.handle('save-claude-md', (_event, payload: { projectPath: string; content: string }) => {
    try {
      ensureProjectDirectory(payload.projectPath)
      const target = path.join(payload.projectPath, 'CLAUDE.md')
      validateAbsolutePath(payload.projectPath, target)
      fs.writeFileSync(target, payload.content, 'utf8')
      return true
    } catch (error) {
      console.error('save-claude-md validation error:', error)
      return false
    }
  })

  ipcMain.handle('git-check-repo', (_event, projectPath: string) => checkIsGitRepo(projectPath))

  ipcMain.handle('snapshot-create', (_event, payload: { projectPath: string; taskId: string }) => {
    ensureProjectDirectory(payload.projectPath)
    return snapshotManager.createSnapshot(payload.projectPath, payload.taskId)
  })

  ipcMain.handle(
    'snapshot-changed-files',
    (_event, payload: { projectPath: string; taskId: string }) => {
      ensureProjectDirectory(payload.projectPath)
      return snapshotManager.getSnapshotChangedFiles(payload.projectPath, payload.taskId)
    }
  )

  ipcMain.handle('get-file-content', (_event, filePath: string) => {
    try {
      const projects = store.getProjects()
      const resolvedFilePath = path.resolve(filePath)
      const isAllowed = projects.some((project) => {
        const resolvedProjectPath = path.resolve(project.path)
        return (
          resolvedFilePath.startsWith(resolvedProjectPath + path.sep) ||
          resolvedFilePath === resolvedProjectPath
        )
      })

      if (!isAllowed) {
        console.error(`get-file-content blocked: ${filePath} is outside all project directories`)
        return ''
      }

      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf8')
      }
    } catch (error) {
      console.error('get-file-content error:', error)
    }

    return ''
  })

  ipcMain.handle(
    'snapshot-rollback-file',
    (_event, payload: { projectPath: string; taskId: string; relativeFilePath: string }) => {
      ensureProjectDirectory(payload.projectPath)
      validatePath(payload.projectPath, payload.relativeFilePath)
      return snapshotManager.rollbackFile(
        payload.projectPath,
        payload.taskId,
        payload.relativeFilePath
      )
    }
  )

  ipcMain.handle(
    'snapshot-rollback-all',
    (_event, payload: { projectPath: string; taskId: string }) => {
      ensureProjectDirectory(payload.projectPath)
      return snapshotManager.rollbackAll(payload.projectPath, payload.taskId)
    }
  )

  ipcMain.handle(
    'read-snapshot-content',
    (_event, payload: { taskId: string; relativeFilePath: string }) => {
      try {
        const backupBase = path.join(app.getPath('temp'), 'cc-studio-backups')
        const backupFilePath = path.join(backupBase, payload.taskId, payload.relativeFilePath)
        validateAbsolutePath(backupBase, backupFilePath)

        if (fs.existsSync(backupFilePath)) {
          return fs.readFileSync(backupFilePath, 'utf8')
        }
      } catch (error) {
        console.error('read-snapshot-content validation error:', error)
      }

      return ''
    }
  )
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.ccstudio.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  activeSession?.kill()
  activeSession = null
})
