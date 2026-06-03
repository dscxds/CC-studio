# CC Studio

Local-first desktop workspace for using Claude Code with guided tasks, task-scoped snapshots, and visual diff review.

[![Repo](https://img.shields.io/badge/GitHub-shushu03--yan%2FCC--studio-181717?logo=github)](https://github.com/shushu03-yan/CC-studio)
[![Chinese README](https://img.shields.io/badge/README-%E4%B8%AD%E6%96%87-0ea5e9)](./README_ZN.md)
[![License](https://img.shields.io/badge/License-MIT-10b981.svg)](./LICENSE)

## ✨ What It Does

CC Studio wraps a local Claude Code terminal session in a desktop UI so beginners can work with a project folder without starting from a raw terminal workflow.

Core capabilities:

- guided task templates
- quick access to Claude slash commands
- built-in `CLAUDE.md` editing
- task-scoped snapshots before write operations
- visual diff review and rollback
- recent project history for reopening local folders

## 👥 Who It Is For

CC Studio is aimed at people who want to use Claude Code locally with more structure:

- beginners learning Claude Code
- indie builders and solo developers
- designers or product people crossing into coding
- developers who want a more visual local workflow

## 🧭 How It Works

1. Open CC Studio.
2. Click `Open Local Project`.
3. Choose any local project folder you want Claude to work on.
4. Start from a guided task template or send your own prompt.
5. Review changed files for the current task.
6. Roll back files or the whole task to the task baseline if needed.

## 📦 Do You Need To Clone Anything?

Short answer: **yes, if you want CC Studio to work on a repository, that repository needs to exist on your local machine first.**

Two common cases:

### 1. You want to run or modify CC Studio itself

Clone this repository locally:

```bash
git clone https://github.com/shushu03-yan/CC-studio.git
cd CC-studio
```

### 2. You want CC Studio to help with another project

That target project also needs to be local. For example:

```bash
git clone https://github.com/your-name/your-project.git
```

Then open that target folder inside CC Studio.

Important:

- CC Studio works with **local folders**
- it does **not** edit a GitHub repo directly in the cloud
- your target project does **not** need to live inside the `CC-studio` folder

## ⚙️ Prerequisites

Before running CC Studio, make sure you have:

- Node.js with `npm`
- Claude Code CLI installed and available in your terminal
- a Claude Code login/session that already works locally
- Git recommended for normal project workflows

CC Studio is currently **Windows-first**.

## 🚀 Quick Start

Install dependencies:

```bash
npm install
```

Run in development:

```bash
npm run dev
```

Build the app:

```bash
npm run build
```

Platform builds:

```bash
npm run build:win
npm run build:mac
npm run build:linux
```

## 🛠️ Typical Usage

Once the app is running:

1. Open a local folder.
2. Wait for CC Studio to detect Claude CLI.
3. Use a task template such as project analysis, bug fixing, feature implementation, README generation, or code review.
4. Edit and save `CLAUDE.md` if you want project-specific rules.
5. Watch task-scoped file changes in the sidebar.
6. Open diffs before keeping changes.
7. Roll back a single file or the current task if the result is not what you want.

## 📁 Project Structure

```text
src/
  main/       Electron main process, Claude session management, snapshots, project logic
  preload/    Electron preload bridge
  renderer/   React UI
  shared/     Shared types
resources/    Static assets
build/        Build resources
```

## 📜 Scripts

- `npm run dev` - start the Electron app in development
- `npm run build` - typecheck and build
- `npm run build:win` - build Windows package
- `npm run build:mac` - build macOS package
- `npm run build:linux` - build Linux package
- `npm run lint` - run ESLint
- `npm run typecheck` - run TypeScript checks
- `npm run test:node` - run the Node-side test currently in the repo

## 🔒 Scope

Current scope:

- local folders only
- single-user workflow
- Claude Code focused
- Windows-first support

Not in scope right now:

- cloud sync
- team collaboration
- multi-agent orchestration
- direct editing of remote GitHub repositories without cloning

## 📘 Chinese Guide

For a fuller Chinese walkthrough, including local setup guidance and a step-by-step usage explanation, see [README_ZN.md](./README_ZN.md).

## 📄 License

[MIT](./LICENSE)
