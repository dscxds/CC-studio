# CC Studio

A local desktop workspace for beginners to use Claude Code with guided tasks, task-scoped snapshots, and visual diff review.

## What It Is

CC Studio wraps a local Claude Code terminal session in a simple desktop UI.

Instead of asking beginners to learn the CLI first, it gives them a cleaner entry point:

- guided task templates
- quick access to Claude slash commands
- built-in `CLAUDE.md` editing
- task-scoped snapshots before write operations
- visual diff review and rollback

## Who It Is For

CC Studio is aimed at people who want to use Claude Code locally but do not want to start from a raw terminal workflow.

Typical users:

- beginners learning Claude Code
- indie builders and vibe coders
- product or design people crossing into coding
- developers who want a more visual local workflow

## Core Workflow

1. Open a local project folder
2. Start a Claude Code session inside the app
3. Choose a guided task template or send your own prompt
4. Review task-scoped file changes
5. Roll back to the task baseline if needed

## Highlights

- **Local-first**: built for local Claude Code usage on your own machine
- **Beginner-friendly**: common tasks are turned into guided forms instead of memorized commands
- **Task-scoped rollback**: write tasks create a baseline snapshot before changes
- **Visual review**: inspect changed files in a diff modal before deciding what to keep
- **Project rules**: edit `CLAUDE.md` directly from the app

## Scope

Current scope:

- Windows-first support
- local folders only
- single-user workflow
- Claude Code focused

Not in scope right now:

- cloud sync
- team collaboration
- multi-agent orchestration
- support for many coding agents at once

## Safety

CC Studio does not try to replace Claude Code's own permission system.

The app focuses on safer local iteration by:

- creating a snapshot before write tasks
- tracking task-scoped file changes
- allowing rollback to the task baseline

## Quick Start

### Install

```bash
npm install
```

### Run in Development

```bash
npm run dev
```

### Verify

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

## License

[MIT](./LICENSE)
