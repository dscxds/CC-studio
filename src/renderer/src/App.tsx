import type { JSX, KeyboardEvent } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { DBProject, DBTask } from '../../shared/studio'
import { DiffModal } from './components/DiffModal'
import { TaskFormModal } from './components/TaskFormModal'
import { TerminalView } from './components/TerminalView'
import type { ClaudeCommand } from './templates/claudeCommands'
import { CLAUDE_COMMANDS } from './templates/claudeCommands'
import type { TaskTemplate } from './templates/taskTemplates'
import { TASK_TEMPLATES } from './templates/taskTemplates'

type ActiveTab = 'templates' | 'commands'

function getDefaultClaudeMdTemplate(projectPath: string | null): string {
  const folderName = projectPath?.split(/[\\/]/).pop() || 'Project'
  return `# ${folderName} Instructions

## Project Overview
Brief overview of the ${folderName} application.

## Tech Stack
- Frontend: React / TypeScript
- Styling: CSS

## Development Rules
- Propose a plan first before making any large file edits.
- Keep components modular and reusable.
- Verify tests or builds after any core modifications.
`
}

export default function App(): JSX.Element {
  const [projectPath, setProjectPath] = useState<string | null>(null)
  const [isGitRepo, setIsGitRepo] = useState(false)
  const [recentProjects, setRecentProjects] = useState<DBProject[]>([])
  const [claudeStatus, setClaudeStatus] = useState('Checking Claude CLI...')
  const [isInstalled, setIsInstalled] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [activeTemplate, setActiveTemplate] = useState<TaskTemplate | null>(null)
  const [activeCommand, setActiveCommand] = useState<ClaudeCommand | null>(null)
  const [hasClaudeMd, setHasClaudeMd] = useState(false)
  const [isEditingClaudeMd, setIsEditingClaudeMd] = useState(false)
  const [claudeMdContent, setClaudeMdContent] = useState('')
  const [historyTasks, setHistoryTasks] = useState<DBTask[]>([])
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [changedFiles, setChangedFiles] = useState<string[]>([])
  const [activeDiffFile, setActiveDiffFile] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('templates')

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const terminalSizeRef = useRef({ cols: 100, rows: 30 })
  const projectPathRef = useRef<string | null>(null)
  const currentTaskRef = useRef<DBTask | null>(null)

  const currentTask = historyTasks.find((task) => task.id === currentTaskId) ?? null
  const projectName = projectPath?.split(/[\\/]/).pop() ?? null

  useEffect(() => {
    projectPathRef.current = projectPath
  }, [projectPath])

  useEffect(() => {
    currentTaskRef.current = currentTask
  }, [currentTask])

  const stopPollingChangedFiles = useCallback((): void => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
  }, [])

  const fetchChangedFiles = useCallback(async (): Promise<void> => {
    const currentProjectPath = projectPathRef.current
    const selectedTask = currentTaskRef.current

    if (!currentProjectPath || !selectedTask?.usesSnapshot) {
      setChangedFiles([])
      return
    }

    try {
      const files = await window.api.getSnapshotChangedFiles(currentProjectPath, selectedTask.id)
      setChangedFiles(files)
    } catch (error) {
      console.error('Failed to fetch changed files:', error)
      setChangedFiles([])
    }
  }, [])

  const startPollingChangedFiles = useCallback((): void => {
    stopPollingChangedFiles()
    pollIntervalRef.current = setInterval(() => {
      void fetchChangedFiles()
    }, 2500)
    void fetchChangedFiles()
  }, [fetchChangedFiles, stopPollingChangedFiles])

  async function loadRecentProjects(): Promise<void> {
    const projects = await window.api.getProjects()
    setRecentProjects(projects)
  }

  async function loadTasks(forProjectPath?: string | null): Promise<void> {
    const targetProjectPath = forProjectPath ?? projectPathRef.current
    if (!targetProjectPath) {
      setHistoryTasks([])
      setCurrentTaskId(null)
      return
    }

    const tasks = await window.api.getTasks(targetProjectPath)
    setHistoryTasks(tasks)
    setCurrentTaskId((previous) => {
      if (previous && tasks.some((task) => task.id === previous)) {
        return previous
      }

      return tasks[0]?.id ?? null
    })
  }

  const refreshProjectState = useCallback(
    async (nextProjectPath: string): Promise<void> => {
      const [gitRepo, claudeMdExists] = await Promise.all([
        window.api.checkGitRepo(nextProjectPath),
        window.api.checkClaudeMd(nextProjectPath)
      ])

      setIsGitRepo(gitRepo)
      setHasClaudeMd(claudeMdExists)
      await loadTasks(nextProjectPath)
      startPollingChangedFiles()
    },
    [startPollingChangedFiles]
  )

  useEffect(() => {
    let disposed = false

    async function bootstrap(): Promise<void> {
      try {
        const result = await window.api.checkClaude()
        if (disposed) {
          return
        }

        if (result.installed) {
          setClaudeStatus(`Claude CLI detected (${result.version})`)
          setIsInstalled(true)
        } else {
          setClaudeStatus('Claude CLI not detected')
          setIsInstalled(false)
        }

        await loadRecentProjects()
      } catch (error) {
        if (!disposed) {
          console.error('Bootstrap failed:', error)
          setClaudeStatus('Failed to inspect Claude CLI')
        }
      }
    }

    const unsubscribeSessionEnded = window.api.onClaudeSessionEnded((exitCode: number) => {
      const currentProjectPath = projectPathRef.current
      if (!currentProjectPath) {
        return
      }

      void (async () => {
        await window.api.closeRunningTasks(
          currentProjectPath,
          exitCode === 0 ? 'completed' : 'failed',
          exitCode
        )
        await loadTasks(currentProjectPath)
        await fetchChangedFiles()
        setClaudeStatus(
          exitCode === 0
            ? 'Claude session ended cleanly'
            : `Claude session exited with code ${exitCode}`
        )
      })()
    })

    void bootstrap()

    return (): void => {
      disposed = true
      unsubscribeSessionEnded()
      stopPollingChangedFiles()
    }
  }, [fetchChangedFiles, stopPollingChangedFiles])

  useEffect(() => {
    void fetchChangedFiles()
  }, [currentTaskId, fetchChangedFiles, historyTasks])

  async function mountProject(nextProjectPath: string): Promise<void> {
    stopPollingChangedFiles()
    projectPathRef.current = nextProjectPath
    setProjectPath(nextProjectPath)
    setIsEditingClaudeMd(false)
    setActiveDiffFile(null)

    await window.api.saveProject({
      id: Date.now().toString(),
      name: nextProjectPath.split(/[\\/]/).pop() || 'Unnamed Project',
      path: nextProjectPath
    })

    await loadRecentProjects()
    window.api.startSession(
      nextProjectPath,
      terminalSizeRef.current.cols,
      terminalSizeRef.current.rows
    )
    await refreshProjectState(nextProjectPath)
    setClaudeStatus('Claude session connected')
  }

  async function handleSelectDirectory(): Promise<void> {
    try {
      const selectedPath = await window.api.selectDirectory()
      if (selectedPath) {
        await mountProject(selectedPath)
      }
    } catch (error) {
      console.error('Error selecting directory:', error)
    }
  }

  function handleSendInput(text: string): void {
    window.api.sendSessionInput(text)
  }

  const handleResizeSession = useCallback((cols: number, rows: number): void => {
    window.api.resizeSession(cols, rows)
    terminalSizeRef.current = { cols, rows }
  }, [])

  function handleSend(): void {
    if (!inputValue.trim()) {
      return
    }

    handleSendInput(`${inputValue}\r`)
    setInputValue('')
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Enter') {
      handleSend()
    }
  }

  async function handleTaskSubmit(finalPrompt: string): Promise<void> {
    if (!activeTemplate || !projectPath) {
      return
    }

    const taskId = Date.now().toString()
    const usesSnapshot = activeTemplate.riskLevel !== 'read-only'

    await window.api.closeRunningTasks(projectPath, 'completed', null)

    if (usesSnapshot) {
      setClaudeStatus('Creating task baseline snapshot...')
      const snapshotCreated = await window.api.createSnapshot(projectPath, taskId)

      if (!snapshotCreated) {
        window.alert('Failed to create the task baseline snapshot. Task was not sent.')
        setClaudeStatus('Snapshot creation failed')
        return
      }
    }

    const task: DBTask = {
      id: taskId,
      projectId: projectPath,
      title: activeTemplate.name,
      prompt: finalPrompt,
      status: 'running',
      createdAt: Date.now(),
      usesSnapshot
    }

    await window.api.saveTask(task)
    setCurrentTaskId(taskId)
    handleSendInput(`${finalPrompt}\r`)
    setActiveTemplate(null)
    setClaudeStatus('Task sent to Claude')
    await loadTasks(projectPath)
    await fetchChangedFiles()
  }

  async function handleRollbackFile(filePath: string): Promise<void> {
    if (!projectPath || !currentTask?.usesSnapshot) {
      return
    }

    setClaudeStatus('Rolling back file to task baseline...')
    const success = await window.api.snapshotRollbackFile(projectPath, currentTask.id, filePath)

    if (!success) {
      window.alert('Failed to roll back the file.')
      setClaudeStatus('Rollback failed')
      return
    }

    setActiveDiffFile(null)
    setClaudeStatus('File rolled back to task baseline')
    await fetchChangedFiles()
  }

  async function handleRollbackAll(): Promise<void> {
    if (!projectPath || !currentTask?.usesSnapshot) {
      return
    }

    if (!window.confirm('Rollback every file changed since this task started?')) {
      return
    }

    setClaudeStatus('Rolling back task-scoped changes...')
    const success = await window.api.snapshotRollbackAll(projectPath, currentTask.id)

    if (!success) {
      window.alert('Failed to roll back all task-scoped changes.')
      setClaudeStatus('Rollback failed')
      return
    }

    setClaudeStatus('Task-scoped changes rolled back')
    await fetchChangedFiles()
  }

  function handleCommandClick(command: ClaudeCommand): void {
    if (!projectPath) {
      return
    }

    if (command.fields.length === 0) {
      handleSendInput(`${command.commandTemplate({})}\r`)
      return
    }

    setActiveCommand(command)
  }

  async function handleEditClaudeMd(): Promise<void> {
    if (!projectPath) {
      return
    }

    const content = await window.api.readClaudeMd(projectPath)
    setClaudeMdContent(content || getDefaultClaudeMdTemplate(projectPath))
    setIsEditingClaudeMd(true)
  }

  async function handleSaveClaudeMd(): Promise<void> {
    if (!projectPath) {
      return
    }

    const saved = await window.api.saveClaudeMd(projectPath, claudeMdContent)
    if (!saved) {
      window.alert('Failed to save CLAUDE.md.')
      return
    }

    setHasClaudeMd(true)
    setIsEditingClaudeMd(false)
    handleSendInput(
      'I updated the CLAUDE.md file for this project. Please read it and follow those instructions.\r'
    )
  }

  const templateCategories = ['项目理解', '开发任务', '质量检查', '文档与 Git']
  const commandCategories = ['核心交互', '开发与工作流', '系统与配置', '第三方与集成', '辅助指令']

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#09090b',
        color: '#f4f4f5',
        fontFamily: '"Segoe UI", system-ui, sans-serif',
        userSelect: 'none'
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 24px',
          background: 'rgba(18, 18, 20, 0.75)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: isInstalled ? '#10b981' : '#ef4444',
              boxShadow: isInstalled ? '0 0 10px #10b981' : '0 0 10px #ef4444'
            }}
          />
          <h2
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            CC Studio
          </h2>
        </div>
        <div
          style={{
            fontSize: '13px',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '6px 14px',
            borderRadius: '99px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            color: '#a1a1aa'
          }}
        >
          Status{' '}
          <span style={{ color: isInstalled ? '#34d399' : '#f87171', fontWeight: 600 }}>
            {claudeStatus}
          </span>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div
          style={{
            width: '300px',
            display: 'flex',
            flexDirection: 'column',
            background: '#0c0c0e',
            borderRight: '1px solid rgba(255, 255, 255, 0.06)',
            overflowY: 'auto',
            padding: '20px',
            gap: '24px'
          }}
        >
          <div>
            <button
              onClick={() => void handleSelectDirectory()}
              style={{
                width: '100%',
                padding: '10px',
                background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                border: 'none',
                color: '#fff',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px',
                boxShadow: '0 4px 12px rgba(6, 182, 212, 0.25)',
                marginBottom: '14px'
              }}
            >
              Open Local Project
            </button>

            {projectPath && (
              <div
                style={{
                  background: '#18181b',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  fontSize: '11px',
                  wordBreak: 'break-all'
                }}
              >
                <span style={{ color: '#71717a', display: 'block', marginBottom: '4px' }}>
                  Project Type:{' '}
                  <span style={{ color: isGitRepo ? '#34d399' : '#f59e0b', fontWeight: 600 }}>
                    {isGitRepo ? 'Git repository' : 'Local directory'}
                  </span>
                </span>
                <strong style={{ color: '#e4e4e7' }}>{projectName}</strong>
                <span
                  style={{
                    color: '#52525b',
                    display: 'block',
                    fontSize: '10px',
                    marginTop: '2px',
                    fontFamily: 'monospace'
                  }}
                >
                  {projectPath}
                </span>
              </div>
            )}
          </div>

          {projectPath && currentTask?.usesSnapshot && changedFiles.length > 0 && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.03)',
                border: '1px solid rgba(239, 68, 68, 0.15)',
                borderRadius: '8px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <span style={{ fontSize: '12px', color: '#f87171', fontWeight: 600 }}>
                Task-Scoped Changes ({changedFiles.length})
              </span>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  maxHeight: '150px',
                  overflowY: 'auto'
                }}
              >
                {changedFiles.map((file) => (
                  <button
                    key={file}
                    onClick={() => setActiveDiffFile(file)}
                    style={{
                      padding: '6px 8px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      color: '#e4e4e7',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      textAlign: 'left'
                    }}
                    title="Open diff for this file"
                  >
                    {file}
                  </button>
                ))}
              </div>
              <button
                onClick={() => void handleRollbackAll()}
                style={{
                  padding: '8px',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 600
                }}
              >
                Roll Back Current Task
              </button>
            </div>
          )}

          <div>
            <h4
              style={{
                margin: '0 0 10px 0',
                fontSize: '12px',
                color: '#71717a',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Recent Projects
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {recentProjects.slice(0, 4).map((project) => (
                <button
                  key={project.path}
                  onClick={() => void mountProject(project.path)}
                  style={{
                    padding: '8px 10px',
                    background:
                      projectPath === project.path ? 'rgba(6, 182, 212, 0.08)' : 'transparent',
                    border: `1px solid ${
                      projectPath === project.path
                        ? 'rgba(6, 182, 212, 0.2)'
                        : 'rgba(255,255,255,0.04)'
                    }`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    textAlign: 'left'
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      color: projectPath === project.path ? '#22d3ee' : '#e4e4e7'
                    }}
                  >
                    {project.name}
                  </div>
                  <div
                    style={{
                      fontSize: '10px',
                      color: '#52525b',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontFamily: 'monospace',
                      marginTop: '2px'
                    }}
                  >
                    {project.path}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {projectPath && (
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '8px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span style={{ fontSize: '12px', color: '#a1a1aa' }}>CLAUDE.md</span>
                <span
                  style={{
                    fontSize: '9px',
                    padding: '2px 6px',
                    borderRadius: '99px',
                    background: hasClaudeMd ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: hasClaudeMd ? '#10b981' : '#ef4444'
                  }}
                >
                  {hasClaudeMd ? 'Configured' : 'Missing'}
                </span>
              </div>
              <button
                onClick={() => void handleEditClaudeMd()}
                style={{
                  padding: '6px 12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  width: '100%',
                  fontWeight: 500
                }}
              >
                {hasClaudeMd ? 'Edit Rules' : 'Initialize Rules'}
              </button>
            </div>
          )}

          {projectPath && (
            <div>
              <h4
                style={{
                  margin: '0 0 10px 0',
                  fontSize: '12px',
                  color: '#71717a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Task History
              </h4>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  maxHeight: '220px',
                  overflowY: 'auto'
                }}
              >
                {historyTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => setCurrentTaskId(task.id)}
                    style={{
                      padding: '8px',
                      background: currentTaskId === task.id ? '#1a1a1f' : '#141416',
                      border: `1px solid ${
                        currentTaskId === task.id
                          ? 'rgba(34, 211, 238, 0.25)'
                          : 'rgba(255,255,255,0.03)'
                      }`,
                      borderRadius: '4px',
                      fontSize: '11px',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '4px'
                      }}
                    >
                      <strong style={{ color: '#fff' }}>{task.title}</strong>
                      <span
                        style={{
                          fontSize: '9px',
                          color:
                            task.status === 'completed'
                              ? '#10b981'
                              : task.status === 'failed'
                                ? '#ef4444'
                                : '#f59e0b'
                        }}
                      >
                        {task.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '9px', color: '#52525b' }}>
                      {new Date(task.createdAt).toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: '#09090b',
            minWidth: 0
          }}
        >
          {isEditingClaudeMd ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                padding: '24px',
                boxSizing: 'border-box',
                background: '#0e0e11',
                gap: '16px'
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                    Configure CLAUDE.md
                  </h3>
                  <span style={{ fontSize: '11px', color: '#71717a' }}>
                    Define project-level instructions that Claude should follow.
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setIsEditingClaudeMd(false)}
                    style={{
                      padding: '6px 14px',
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#a1a1aa',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={() => void handleSaveClaudeMd()}
                    style={{
                      padding: '6px 16px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: 'none',
                      color: '#fff',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>

              <textarea
                value={claudeMdContent}
                onChange={(event) => setClaudeMdContent(event.target.value)}
                style={{
                  flex: 1,
                  background: '#09090b',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '16px',
                  color: '#fff',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  resize: 'none',
                  outline: 'none'
                }}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div style={{ flex: 1, position: 'relative', minHeight: 0, background: '#121214' }}>
                {projectPath ? (
                  <TerminalView key={projectPath} onResize={handleResizeSession} />
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#52525b',
                      gap: '12px',
                      background: '#09090b'
                    }}
                  >
                    <span style={{ fontSize: '14px', color: '#71717a', fontWeight: 500 }}>
                      Open a local project to start a Claude Code session.
                    </span>
                  </div>
                )}
              </div>

              <footer
                style={{
                  display: 'flex',
                  padding: '16px 24px',
                  background: '#121214',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  gap: '16px',
                  alignItems: 'center'
                }}
              >
                <input
                  disabled={!projectPath}
                  type="text"
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder={
                    projectPath
                      ? 'Send a prompt or slash command to Claude...'
                      : 'Open a project to start sending prompts...'
                  }
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background: '#09090b',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    color: '#fff',
                    borderRadius: '6px',
                    outline: 'none',
                    fontSize: '13px',
                    fontFamily: 'monospace'
                  }}
                />
                <button
                  disabled={!projectPath}
                  onClick={handleSend}
                  style={{
                    padding: '10px 24px',
                    background: projectPath
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : '#27272a',
                    color: projectPath ? '#ffffff' : '#71717a',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: projectPath ? 'pointer' : 'not-allowed',
                    fontWeight: 600,
                    fontSize: '13px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Send
                </button>
              </footer>
            </div>
          )}
        </div>

        <div
          style={{
            width: '320px',
            background: 'rgba(18, 18, 20, 0.65)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            padding: '20px',
            overflowY: 'auto',
            gap: '16px'
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#f4f4f5' }}>
              Actions
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#71717a' }}>
              Use task templates for guided work or send Claude slash commands directly.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '4px'
            }}
          >
            <button
              onClick={() => setActiveTab('templates')}
              style={{
                flex: 1,
                padding: '10px 0',
                background: 'transparent',
                border: 'none',
                borderBottom:
                  activeTab === 'templates' ? '2px solid #22d3ee' : '2px solid transparent',
                color: activeTab === 'templates' ? '#22d3ee' : '#a1a1aa',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Task Templates
            </button>
            <button
              onClick={() => setActiveTab('commands')}
              style={{
                flex: 1,
                padding: '10px 0',
                background: 'transparent',
                border: 'none',
                borderBottom:
                  activeTab === 'commands' ? '2px solid #a78bfa' : '2px solid transparent',
                color: activeTab === 'commands' ? '#a78bfa' : '#a1a1aa',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Claude Commands
            </button>
          </div>

          {activeTab === 'templates'
            ? templateCategories.map((category) => {
                const templates = TASK_TEMPLATES.filter(
                  (template) => template.category === category
                )
                if (templates.length === 0) {
                  return null
                }

                return (
                  <div
                    key={category}
                    style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                  >
                    <h4
                      style={{
                        margin: '0 0 4px 0',
                        fontSize: '11px',
                        color: '#71717a',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                    >
                      {category}
                    </h4>
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        disabled={!projectPath}
                        onClick={() => setActiveTemplate(template)}
                        style={{
                          padding: '12px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          color: '#fff',
                          borderRadius: '8px',
                          textAlign: 'left',
                          cursor: projectPath ? 'pointer' : 'not-allowed',
                          opacity: projectPath ? 1 : 0.55
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '2px'
                          }}
                        >
                          <strong style={{ fontSize: '12px', color: '#22d3ee' }}>
                            {template.name}
                          </strong>
                          <span
                            style={{
                              fontSize: '8px',
                              padding: '1px 4px',
                              borderRadius: '2px',
                              background:
                                template.riskLevel === 'read-only'
                                  ? 'rgba(16, 185, 129, 0.1)'
                                  : 'rgba(245, 158, 11, 0.1)',
                              color: template.riskLevel === 'read-only' ? '#10b981' : '#f59e0b'
                            }}
                          >
                            {template.riskLevel === 'read-only' ? 'read-only' : 'writes files'}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: '10px',
                            color: '#a1a1aa',
                            lineHeight: '1.3',
                            display: 'block'
                          }}
                        >
                          {template.description}
                        </span>
                      </button>
                    ))}
                  </div>
                )
              })
            : commandCategories.map((category) => {
                const commands = CLAUDE_COMMANDS.filter((command) => command.category === category)
                if (commands.length === 0) {
                  return null
                }

                return (
                  <div
                    key={category}
                    style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                  >
                    <h4
                      style={{
                        margin: '0 0 4px 0',
                        fontSize: '11px',
                        color: '#71717a',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                    >
                      {category}
                    </h4>
                    {commands.map((command) => (
                      <button
                        key={command.id}
                        disabled={!projectPath}
                        onClick={() => handleCommandClick(command)}
                        style={{
                          padding: '12px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          color: '#fff',
                          borderRadius: '8px',
                          textAlign: 'left',
                          cursor: projectPath ? 'pointer' : 'not-allowed',
                          opacity: projectPath ? 1 : 0.55
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '2px'
                          }}
                        >
                          <strong style={{ fontSize: '12px', color: '#a78bfa' }}>
                            {command.name}
                          </strong>
                          <span
                            style={{
                              fontSize: '8px',
                              padding: '1px 4px',
                              borderRadius: '2px',
                              background:
                                command.fields.length > 0
                                  ? 'rgba(245, 158, 11, 0.1)'
                                  : 'rgba(16, 185, 129, 0.1)',
                              color: command.fields.length > 0 ? '#f59e0b' : '#10b981'
                            }}
                          >
                            {command.fields.length > 0 ? 'prompted' : 'instant'}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: '10px',
                            color: '#a1a1aa',
                            lineHeight: '1.3',
                            display: 'block'
                          }}
                        >
                          {command.description}
                        </span>
                      </button>
                    ))}
                  </div>
                )
              })}
        </div>
      </div>

      {(activeTemplate || activeCommand) && (
        <TaskFormModal
          key={(activeTemplate || activeCommand)?.id}
          template={(activeTemplate || activeCommand)!}
          onClose={() => {
            setActiveTemplate(null)
            setActiveCommand(null)
          }}
          onSubmit={(prompt: string) => {
            if (activeTemplate) {
              void handleTaskSubmit(prompt)
            } else {
              handleSendInput(`${prompt}\r`)
              setActiveCommand(null)
            }
          }}
        />
      )}

      {projectPath && currentTask?.usesSnapshot && activeDiffFile && (
        <DiffModal
          projectPath={projectPath}
          taskId={currentTask.id}
          relativeFilePath={activeDiffFile}
          onClose={() => setActiveDiffFile(null)}
          onRollbackFile={() => void handleRollbackFile(activeDiffFile)}
        />
      )}
    </div>
  )
}
