# CC Studio

CC Studio is a local desktop workspace for beginners using Claude Code.

It wraps a Claude Code terminal session in a simple Electron UI with:

- guided task templates
- slash command shortcuts
- project-level `CLAUDE.md` editing
- task-scoped snapshots and rollback
- visual diff review for files changed during a task

## Current Scope

This MVP is designed for **local Claude Code usage on your own machine**.

- Windows-first support
- local folders only
- no cloud sync
- no team collaboration
- no attempt to replace Claude Code itself

## Safety Model

CC Studio does **not** inspect Claude Code's internal tool calls.

Use Claude Code's built-in permission system for command safety.
CC Studio's safety layer is focused on:

- creating a pre-task snapshot before write operations
- showing task-scoped file changes
- rolling back files to the task baseline

## Project Setup

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

### Verification

```bash
npm run test:node
npm run typecheck
npm run lint
```

### Build

```bash
npm run build:win
npm run build:mac
npm run build:linux
```

## Tech Stack

- Electron
- React
- TypeScript
- electron-vite
- xterm.js

## Status

This is an early MVP. Expect rough edges, but the core workflow is already usable:

1. Open a local project
2. Start a Claude Code session
3. Use a guided task template
4. Review task-scoped file diffs
5. Roll back to the task baseline if needed

## License

[MIT](./LICENSE)
