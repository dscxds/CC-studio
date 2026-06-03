# CC Studio 中文说明

本项目是一个面向本地工作流的桌面工具，用来把 **Claude Code** 包上一层更容易上手的图形界面，适合不想一开始就完全依赖终端的用户。

[GitHub 仓库](https://github.com/shushu03-yan/CC-studio) | [English README](./README.md)

## ✨ 这是做什么的

CC Studio 会在桌面应用里启动并承载一个本地 Claude Code 会话，然后给你补上这些更易用的能力：

- 图形化打开本地项目文件夹
- 任务模板，减少手写提示词的负担
- 常用 Claude slash commands 快捷入口
- 内置 `CLAUDE.md` 编辑
- 写操作前自动创建任务级快照
- 变更文件列表、diff 查看、单文件或整任务回滚
- 最近项目记录，方便重复打开

一句话理解：

**它不是替代 Claude Code，而是给 Claude Code 做一个更适合新手和本地开发的桌面外壳。**

## 👥 适合谁

这个项目比较适合下面几类人：

- 刚开始接触 Claude Code 的用户
- 想在本地做 AI 辅助开发的个人开发者
- 产品、设计、运营出身，但需要频繁和代码打交道的人
- 不想从纯命令行开始，希望先有图形化入口的人

## 🧭 它怎么工作

典型流程是这样的：

1. 打开 CC Studio。
2. 点击 `Open Local Project`。
3. 选择你电脑上的一个本地项目文件夹。
4. CC Studio 在这个目录里连接 Claude Code 会话。
5. 你可以选择任务模板，或者直接发送 prompt / slash command。
6. 如果这次任务会改文件，CC Studio 会先做一份任务级快照。
7. 修改完成后，你可以查看这次任务造成的文件变更。
8. 如果结果不好，可以回滚单个文件，或者整次任务一起回滚。

## 📦 到底要不要把仓库下到本地？

这个问题要分成两种情况。

### 情况 1：你想运行或开发 CC Studio 这个项目本身

那就需要先把这个仓库 clone 到本地：

```bash
git clone https://github.com/shushu03-yan/CC-studio.git
cd CC-studio
```

然后再安装依赖、启动开发环境。

### 情况 2：你想用 CC Studio 去操作“别的项目”

那你要操作的那个项目，也必须先在你本地。

例如你想让 CC Studio 帮你修改另一个 GitHub 仓库：

```bash
git clone https://github.com/your-name/your-project.git
```

然后在 CC Studio 里点击 `Open Local Project`，打开 `your-project` 对应的本地文件夹。

重点是：

- CC Studio 操作的是 **本地目录**
- 它不是直接连到 GitHub 云端去改仓库
- 你不需要把别的项目放进 `CC-studio` 目录里
- 你只需要保证“目标项目在本地”即可

所以如果你问“要不要把仓库下到本地”，答案是：

- 想运行这个工具，要把 `CC-studio` 下到本地
- 想让这个工具帮你改某个仓库，也要把“那个仓库”下到本地

## ⚙️ 使用前要准备什么

在运行 CC Studio 之前，建议先准备好这些：

- Node.js 和 `npm`
- 本地可用的 Claude Code CLI
- Claude Code 已经在你电脑上登录并能正常使用
- Git

其中：

- `Node.js + npm` 用来安装和运行这个 Electron 项目
- `Claude Code CLI` 是 CC Studio 实际连接的核心能力
- `Git` 虽然不是所有场景都强制，但对于项目开发基本是标配

目前这个项目的定位是 **Windows-first**。

## 🚀 如何启动这个项目

### 1. 克隆仓库

```bash
git clone https://github.com/shushu03-yan/CC-studio.git
cd CC-studio
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发模式

```bash
npm run dev
```

### 4. 构建应用

```bash
npm run build
```

如果你想打包特定平台：

```bash
npm run build:win
npm run build:mac
npm run build:linux
```

## 🛠️ 实际怎么用

下面给一个更贴近真实使用的流程。

### 用法 A：拿它来帮你开发别的本地项目

1. 先把你的目标项目准备到本地。
2. 启动 CC Studio。
3. 点击 `Open Local Project`。
4. 选择目标项目文件夹。
5. 等它检测 Claude CLI 状态。
6. 在右侧选择任务模板，或者在底部输入框直接发 prompt。
7. 如果你想加项目规则，可以编辑 `CLAUDE.md`。
8. 等 Claude 完成任务后，在侧栏查看改动文件。
9. 点开 diff 检查结果，不满意就回滚。

### 用法 B：拿它来开发 CC Studio 自己

1. 打开当前 `CC-studio` 仓库。
2. 用任务模板让 Claude 先分析项目结构。
3. 需要改功能时，用功能实现、Bug 修复、代码审查等模板。
4. 如果涉及写文件，应用会先创建任务快照。
5. 完成后查看这次任务的改动并决定是否保留。

## 🧩 这个项目目前有哪些实际能力

基于当前代码，比较明确的功能包括：

- 本地项目目录选择
- Claude Code 会话连接与终端嵌入
- 最近项目列表
- 任务模板表单
- Claude 常用命令快捷发送
- `CLAUDE.md` 初始化与编辑
- 写任务前的项目快照
- 当前任务变更文件检测
- 单文件回滚
- 整任务回滚

## 📁 项目结构

```text
src/
  main/       Electron 主进程、Claude 会话、快照、项目逻辑
  preload/    Electron preload 通信桥
  renderer/   React 前端界面
  shared/     共享类型
resources/    静态资源
build/        打包资源
```

## 📜 常用命令

- `npm run dev`：开发模式启动
- `npm run build`：类型检查并构建
- `npm run build:win`：打包 Windows 版本
- `npm run build:mac`：打包 macOS 版本
- `npm run build:linux`：打包 Linux 版本
- `npm run lint`：执行 ESLint
- `npm run typecheck`：执行 TypeScript 类型检查
- `npm run test:node`：运行当前仓库里的 Node 侧测试

## 🔒 当前范围与限制

当前更偏向下面这些边界：

- 只面向本地文件夹
- 单用户工作流
- 聚焦 Claude Code
- Windows-first

暂时不在当前范围里的方向：

- 云端同步
- 团队协作
- 多 agent 编排
- 不落地到本地、直接在线改 GitHub 远程仓库

## ✅ 一句建议

如果你只是想“用它来辅助改代码”，最实用的方式就是：

1. 先把目标仓库 clone 到本地。
2. 启动 CC Studio。
3. 直接打开那个本地项目目录。

不用把目标仓库塞进 `CC-studio` 里面，也不用先手动搭很复杂的命令行流程。

## 📄 许可证

[MIT](./LICENSE)
