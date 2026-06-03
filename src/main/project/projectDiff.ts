import * as fs from 'node:fs'
import * as path from 'node:path'

export const EXCLUDED_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'out',
  'build',
  '.worktrees',
  '.vscode',
  '.idea'
]

function toPortableRelativePath(fromPath: string): string {
  return fromPath.split(path.sep).join('/')
}

export function collectProjectFiles(
  dir: string,
  baseDir: string = dir,
  excludeDirs: string[] = EXCLUDED_DIRS
): string[] {
  const results: string[] = []

  if (!fs.existsSync(dir)) {
    return results
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (excludeDirs.includes(entry.name)) {
        continue
      }

      results.push(...collectProjectFiles(path.join(dir, entry.name), baseDir, excludeDirs))
      continue
    }

    if (entry.isFile()) {
      results.push(toPortableRelativePath(path.relative(baseDir, path.join(dir, entry.name))))
    }
  }

  return results.sort()
}

export function snapshotDirectory(
  sourceDir: string,
  targetDir: string,
  excludeDirs: string[] = EXCLUDED_DIRS
): void {
  if (!fs.existsSync(sourceDir)) {
    return
  }

  fs.mkdirSync(targetDir, { recursive: true })

  const entries = fs.readdirSync(sourceDir, { withFileTypes: true })
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name)
    const targetPath = path.join(targetDir, entry.name)

    if (entry.isDirectory()) {
      if (excludeDirs.includes(entry.name)) {
        continue
      }

      snapshotDirectory(sourcePath, targetPath, excludeDirs)
      continue
    }

    if (entry.isFile()) {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true })
      fs.copyFileSync(sourcePath, targetPath)
    }
  }
}

export function diffDirectories(
  beforeDir: string,
  afterDir: string,
  excludeDirs: string[] = EXCLUDED_DIRS
): string[] {
  const beforeFiles = collectProjectFiles(beforeDir, beforeDir, excludeDirs)
  const afterFiles = collectProjectFiles(afterDir, afterDir, excludeDirs)
  const afterFileSet = new Set(afterFiles)
  const changed = new Set<string>()

  for (const relativePath of beforeFiles) {
    const beforePath = path.join(beforeDir, relativePath)
    const afterPath = path.join(afterDir, relativePath)

    if (!fs.existsSync(afterPath)) {
      changed.add(relativePath)
      continue
    }

    const beforeContent = fs.readFileSync(beforePath)
    const afterContent = fs.readFileSync(afterPath)
    if (!beforeContent.equals(afterContent)) {
      changed.add(relativePath)
    }
  }

  for (const relativePath of afterFiles) {
    if (!beforeFiles.includes(relativePath) && afterFileSet.has(relativePath)) {
      changed.add(relativePath)
    }
  }

  return Array.from(changed).sort()
}
