import test from 'node:test'
import assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import { collectProjectFiles, diffDirectories, snapshotDirectory } from './projectDiff.ts'

function makeTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix))
}

function writeFile(root: string, relativePath: string, content: string | Buffer): void {
  const target = path.join(root, relativePath)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, content)
}

test('collectProjectFiles keeps dotfiles, files without extensions, and binary assets', () => {
  const root = makeTempDir('cc-studio-project-files-')

  writeFile(root, '.env', 'TOKEN=secret')
  writeFile(root, 'Dockerfile', 'FROM node:22')
  writeFile(root, 'assets/logo.png', Buffer.from([0, 1, 2, 3]))
  writeFile(root, 'src/index.ts', 'export const ok = true')
  writeFile(root, 'node_modules/pkg/index.js', 'ignored')

  const files = collectProjectFiles(root)

  assert.deepEqual(files, ['.env', 'Dockerfile', 'assets/logo.png', 'src/index.ts'])
})

test('snapshotDirectory and diffDirectories detect task-scoped add, modify, and delete changes', () => {
  const projectRoot = makeTempDir('cc-studio-project-')
  const snapshotRoot = makeTempDir('cc-studio-snapshot-')

  writeFile(projectRoot, 'README.md', '# Before')
  writeFile(projectRoot, 'assets/icon.png', Buffer.from([1, 2, 3]))
  writeFile(projectRoot, 'src/keep.ts', 'export const keep = true')

  snapshotDirectory(projectRoot, snapshotRoot)

  writeFile(projectRoot, 'README.md', '# After')
  writeFile(projectRoot, 'assets/icon.png', Buffer.from([9, 9, 9]))
  fs.rmSync(path.join(projectRoot, 'src/keep.ts'))
  writeFile(projectRoot, '.env.local', 'DEBUG=1')

  const changed = diffDirectories(snapshotRoot, projectRoot)

  assert.deepEqual(changed, ['.env.local', 'README.md', 'assets/icon.png', 'src/keep.ts'])
})
