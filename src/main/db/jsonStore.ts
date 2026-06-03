import { app } from 'electron'
import * as fs from 'node:fs'
import * as path from 'node:path'

import type { DBProject, DBTask, TaskStatus } from '../../shared/studio'

interface DatabaseSchema {
  projects: DBProject[]
  tasks: DBTask[]
}

export class JsonStore {
  private readonly dbPath: string
  private cache: DatabaseSchema = { projects: [], tasks: [] }

  constructor() {
    const userDataPath = app.getPath('userData')
    this.dbPath = path.join(userDataPath, 'db.json')
    this.load()
  }

  private load(): void {
    try {
      if (fs.existsSync(this.dbPath)) {
        const data = fs.readFileSync(this.dbPath, 'utf8')
        this.cache = JSON.parse(data) as DatabaseSchema
        this.cache.projects ??= []
        this.cache.tasks ??= []
        return
      }

      this.save()
    } catch (error) {
      console.error('Failed to load JSON database:', error)
      this.cache = { projects: [], tasks: [] }
    }
  }

  private save(): void {
    try {
      const dir = path.dirname(this.dbPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      fs.writeFileSync(this.dbPath, JSON.stringify(this.cache, null, 2), 'utf8')
    } catch (error) {
      console.error('Failed to save JSON database:', error)
    }
  }

  public getProjects(): DBProject[] {
    this.load()
    return [...this.cache.projects].sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)
  }

  public saveProject(project: Omit<DBProject, 'lastOpenedAt'>): DBProject {
    this.load()

    const existingIndex = this.cache.projects.findIndex((item) => item.path === project.path)
    const now = Date.now()
    const nextProject: DBProject =
      existingIndex > -1
        ? { ...this.cache.projects[existingIndex], ...project, lastOpenedAt: now }
        : { ...project, lastOpenedAt: now }

    if (existingIndex > -1) {
      this.cache.projects[existingIndex] = nextProject
    } else {
      this.cache.projects.push(nextProject)
    }

    this.save()
    return nextProject
  }

  public getTasks(projectId: string): DBTask[] {
    this.load()
    return this.cache.tasks
      .filter((task) => task.projectId === projectId)
      .sort((a, b) => b.createdAt - a.createdAt)
  }

  public saveTask(task: DBTask): void {
    this.load()

    const existingIndex = this.cache.tasks.findIndex((item) => item.id === task.id)
    if (existingIndex > -1) {
      this.cache.tasks[existingIndex] = task
    } else {
      this.cache.tasks.push(task)
    }

    this.save()
  }

  public updateTaskStatus(
    taskId: string,
    status: TaskStatus,
    options: { finishedAt?: number; exitCode?: number | null } = {}
  ): boolean {
    this.load()

    const task = this.cache.tasks.find((item) => item.id === taskId)
    if (!task) {
      return false
    }

    task.status = status
    if (options.finishedAt !== undefined) {
      task.finishedAt = options.finishedAt
    }
    if (options.exitCode !== undefined) {
      task.exitCode = options.exitCode
    }

    this.save()
    return true
  }

  public closeRunningTasksForProject(
    projectId: string,
    status: Exclude<TaskStatus, 'running'>,
    exitCode: number | null = null
  ): void {
    this.load()

    let changed = false
    for (const task of this.cache.tasks) {
      if (task.projectId === projectId && task.status === 'running') {
        task.status = status
        task.finishedAt = Date.now()
        task.exitCode = exitCode
        changed = true
      }
    }

    if (changed) {
      this.save()
    }
  }
}
