export interface ClaudeCheckResult {
  installed: boolean
  version: string
  error?: string
}

export interface DBProject {
  id: string
  name: string
  path: string
  lastOpenedAt: number
}

export type TaskStatus = 'running' | 'completed' | 'failed'

export interface DBTask {
  id: string
  projectId: string
  title: string
  prompt: string
  status: TaskStatus
  createdAt: number
  finishedAt?: number
  exitCode?: number | null
  usesSnapshot?: boolean
}

export interface StudioApi {
  selectDirectory: () => Promise<string | null>
  checkClaude: () => Promise<ClaudeCheckResult>
  startSession: (path: string, cols?: number, rows?: number) => void
  sendSessionInput: (data: string) => void
  resizeSession: (cols: number, rows: number) => void
  onClaudeOutput: (callback: (data: string) => void) => () => void
  onClaudeSessionEnded: (callback: (exitCode: number) => void) => () => void
  getProjects: () => Promise<DBProject[]>
  saveProject: (project: { id: string; name: string; path: string }) => Promise<DBProject>
  getTasks: (projectId: string) => Promise<DBTask[]>
  saveTask: (task: DBTask) => Promise<boolean>
  closeRunningTasks: (
    projectId: string,
    status: Exclude<TaskStatus, 'running'>,
    exitCode?: number | null
  ) => Promise<boolean>
  checkClaudeMd: (path: string) => Promise<boolean>
  readClaudeMd: (path: string) => Promise<string>
  saveClaudeMd: (path: string, content: string) => Promise<boolean>
  checkGitRepo: (path: string) => Promise<boolean>
  createSnapshot: (path: string, taskId: string) => Promise<boolean>
  getSnapshotChangedFiles: (path: string, taskId: string) => Promise<string[]>
  getFileContent: (path: string) => Promise<string>
  snapshotRollbackFile: (path: string, taskId: string, relativeFilePath: string) => Promise<boolean>
  snapshotRollbackAll: (path: string, taskId: string) => Promise<boolean>
  readSnapshotContent: (taskId: string, relativeFilePath: string) => Promise<string>
}
