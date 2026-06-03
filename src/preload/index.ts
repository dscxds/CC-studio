import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

import type { DBProject, DBTask, StudioApi, TaskStatus } from '../shared/studio'

function subscribe<T>(channel: string, callback: (payload: T) => void): () => void {
  const listener = (_event: IpcRendererEvent, payload: T): void => {
    callback(payload)
  }

  ipcRenderer.on(channel, listener)

  return (): void => {
    ipcRenderer.off(channel, listener)
  }
}

const api: StudioApi = {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  checkClaude: () => ipcRenderer.invoke('check-claude'),
  startSession: (path: string, cols?: number, rows?: number) =>
    ipcRenderer.send('start-session', path, cols, rows),
  sendSessionInput: (data: string) => ipcRenderer.send('send-session-input', data),
  resizeSession: (cols: number, rows: number) => ipcRenderer.send('resize-session', cols, rows),
  onClaudeOutput: (callback: (data: string) => void) => subscribe('claude-output', callback),
  onClaudeSessionEnded: (callback: (exitCode: number) => void) =>
    subscribe('claude-session-ended', callback),
  getProjects: () => ipcRenderer.invoke('db-get-projects') as Promise<DBProject[]>,
  saveProject: (project: { id: string; name: string; path: string }) =>
    ipcRenderer.invoke('db-save-project', project) as Promise<DBProject>,
  getTasks: (projectId: string) =>
    ipcRenderer.invoke('db-get-tasks', projectId) as Promise<DBTask[]>,
  saveTask: (task: DBTask) => ipcRenderer.invoke('db-save-task', task) as Promise<boolean>,
  closeRunningTasks: (
    projectId: string,
    status: Exclude<TaskStatus, 'running'>,
    exitCode?: number | null
  ) =>
    ipcRenderer.invoke('db-close-running-tasks', {
      projectId,
      status,
      exitCode
    }) as Promise<boolean>,
  checkClaudeMd: (path: string) => ipcRenderer.invoke('check-claude-md', path) as Promise<boolean>,
  readClaudeMd: (path: string) => ipcRenderer.invoke('read-claude-md', path) as Promise<string>,
  saveClaudeMd: (path: string, content: string) =>
    ipcRenderer.invoke('save-claude-md', { projectPath: path, content }) as Promise<boolean>,
  checkGitRepo: (path: string) => ipcRenderer.invoke('git-check-repo', path) as Promise<boolean>,
  createSnapshot: (path: string, taskId: string) =>
    ipcRenderer.invoke('snapshot-create', { projectPath: path, taskId }) as Promise<boolean>,
  getSnapshotChangedFiles: (path: string, taskId: string) =>
    ipcRenderer.invoke('snapshot-changed-files', { projectPath: path, taskId }) as Promise<
      string[]
    >,
  getFileContent: (path: string) => ipcRenderer.invoke('get-file-content', path) as Promise<string>,
  snapshotRollbackFile: (path: string, taskId: string, relativeFilePath: string) =>
    ipcRenderer.invoke('snapshot-rollback-file', {
      projectPath: path,
      taskId,
      relativeFilePath
    }) as Promise<boolean>,
  snapshotRollbackAll: (path: string, taskId: string) =>
    ipcRenderer.invoke('snapshot-rollback-all', { projectPath: path, taskId }) as Promise<boolean>,
  readSnapshotContent: (taskId: string, relativeFilePath: string) =>
    ipcRenderer.invoke('read-snapshot-content', { taskId, relativeFilePath }) as Promise<string>
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  const unsafeWindow = window as Window &
    typeof globalThis & {
      electron: typeof electronAPI
      api: StudioApi
    }
  unsafeWindow.electron = electronAPI
  unsafeWindow.api = api
}
