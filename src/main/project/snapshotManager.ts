import * as fs from 'node:fs'
import * as path from 'node:path'
import { app } from 'electron'

import { diffDirectories, snapshotDirectory } from './projectDiff'

export class SnapshotManager {
  private getBackupDir(taskId: string): string {
    return path.join(app.getPath('temp'), 'cc-studio-backups', taskId)
  }

  public createSnapshot(projectPath: string, taskId: string): boolean {
    try {
      const backupDir = this.getBackupDir(taskId)
      if (fs.existsSync(backupDir)) {
        fs.rmSync(backupDir, { recursive: true, force: true })
      }

      snapshotDirectory(projectPath, backupDir)
      return true
    } catch (error) {
      console.error('Failed to create snapshot:', error)
      return false
    }
  }

  public getSnapshotChangedFiles(projectPath: string, taskId: string): string[] {
    const backupDir = this.getBackupDir(taskId)
    if (!fs.existsSync(backupDir)) {
      return []
    }

    return diffDirectories(backupDir, projectPath)
  }

  public rollbackFile(projectPath: string, taskId: string, relativeFilePath: string): boolean {
    try {
      const backupDir = this.getBackupDir(taskId)
      const sourceBackup = path.join(backupDir, relativeFilePath)
      const targetProject = path.join(projectPath, relativeFilePath)

      if (fs.existsSync(sourceBackup)) {
        fs.mkdirSync(path.dirname(targetProject), { recursive: true })
        fs.copyFileSync(sourceBackup, targetProject)
      } else if (fs.existsSync(targetProject)) {
        fs.rmSync(targetProject, { force: true })
      }

      return true
    } catch (error) {
      console.error('Snapshot rollback file failed:', error)
      return false
    }
  }

  public rollbackAll(projectPath: string, taskId: string): boolean {
    const changedFiles = this.getSnapshotChangedFiles(projectPath, taskId)
    let okay = true

    for (const relativeFilePath of changedFiles) {
      if (!this.rollbackFile(projectPath, taskId, relativeFilePath)) {
        okay = false
      }
    }

    return okay
  }
}
