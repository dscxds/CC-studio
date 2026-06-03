export interface TaskField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'checkbox'
  required: boolean
  placeholder?: string
  options?: string[]
  defaultValue?: string
}

export interface TaskTemplate {
  id: string
  name: string
  category: string
  description: string
  riskLevel: 'read-only' | 'modify-files' | 'run-commands'
  fields: TaskField[]
  promptTemplate: (vals: Record<string, string>) => string
}

export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: 'analyze-project',
    name: '理解项目结构',
    category: '项目理解',
    description: '深度分析项目代码架构、核心目录划分和依赖。',
    riskLevel: 'read-only',
    fields: [
      {
        id: 'focus',
        label: '侧重点',
        type: 'text',
        required: false,
        placeholder: '例：核心业务逻辑 / 路由配置'
      }
    ],
    promptTemplate: (
      v
    ) => `Please analyze this project structure. ${v.focus ? `Focus primarily on: ${v.focus}.` : ''} 
Analyze what this project does, list key folders, and identify major dependencies. Do not modify any files.`
  },
  {
    id: 'explain-file',
    name: '解释当前文件',
    category: '项目理解',
    description: '分析选中文件的结构和逻辑细节。',
    riskLevel: 'read-only',
    fields: [
      {
        id: 'fileName',
        label: '文件路径/名称',
        type: 'text',
        required: true,
        placeholder: '例：src/main.ts'
      },
      {
        id: 'detail',
        label: '解释深度',
        type: 'select',
        required: true,
        options: ['概览', '逐行细节'],
        defaultValue: '概览'
      }
    ],
    promptTemplate: (v) =>
      `Please explain the file "${v.fileName}". Detail level: ${v.detail}. Analyze imports, key exports, logic flow, and potential issues. Do not modify the file.`
  },
  {
    id: 'fix-bug',
    name: '修复报错',
    category: '开发任务',
    description: '诊断和修复系统报错或逻辑漏洞。',
    riskLevel: 'modify-files',
    fields: [
      {
        id: 'errorLog',
        label: '报错日志/堆栈',
        type: 'textarea',
        required: true,
        placeholder: '粘贴终端报错或运行错误堆栈...'
      },
      {
        id: 'context',
        label: '操作上下文',
        type: 'text',
        required: false,
        placeholder: '在执行什么操作时发生的？'
      },
      {
        id: 'runTest',
        label: '允许运行测试验证',
        type: 'checkbox',
        required: false,
        defaultValue: 'true'
      }
    ],
    promptTemplate: (v) =>
      `I encountered the following error:\n${v.errorLog}\n\nContext: ${v.context || 'Unknown'}\n\nPlease analyze the root cause, explain the issue, and implement a fix. ${v.runTest === 'true' ? 'You may run relevant tests to verify your changes.' : 'Do not run tests.'}`
  },
  {
    id: 'implement-feature',
    name: '实现新功能',
    category: '开发任务',
    description: '向项目中添加新的功能或页面。',
    riskLevel: 'modify-files',
    fields: [
      {
        id: 'desc',
        label: '功能描述',
        type: 'textarea',
        required: true,
        placeholder: '详细描述您想添加的功能...'
      },
      {
        id: 'module',
        label: '影响的页面或模块',
        type: 'text',
        required: false,
        placeholder: '例：用户登录页面 / 侧边导航栏'
      },
      {
        id: 'planFirst',
        label: '强制执行前展示方案 (Plan-first)',
        type: 'checkbox',
        required: false,
        defaultValue: 'true'
      }
    ],
    promptTemplate: (v) =>
      `Please implement the following feature:\n${v.desc}\n${v.module ? `Target module/file: ${v.module}\n` : ''}\n${v.planFirst === 'true' ? 'Propose an implementation plan first. Do not modify any files until I approve the plan.' : 'You can modify files directly.'}`
  },
  {
    id: 'refactor-code',
    name: '重构代码',
    category: '开发任务',
    description: '优化已有代码结构，提升可读性和性能。',
    riskLevel: 'modify-files',
    fields: [
      {
        id: 'filePath',
        label: '重构目标路径',
        type: 'text',
        required: true,
        placeholder: '例：src/utils/helper.ts'
      },
      {
        id: 'goal',
        label: '重构核心目标',
        type: 'select',
        required: true,
        options: ['可读性', '性能优化', '模块解耦', '类型完善'],
        defaultValue: '可读性'
      }
    ],
    promptTemplate: (v) =>
      `Please refactor "${v.filePath}" to improve ${v.goal}. Keep all functional requirements intact. Propose a plan first before editing.`
  },
  {
    id: 'generate-readme',
    name: '生成 README',
    category: '文档与 Git',
    description: '根据项目结构，生成或重构项目 README 简介文档。',
    riskLevel: 'modify-files',
    fields: [
      {
        id: 'language',
        label: '文档语言',
        type: 'select',
        required: true,
        options: ['中文', 'English'],
        defaultValue: '中文'
      }
    ],
    promptTemplate: (v) =>
      `Please generate or improve the README.md file in this project. Language: ${v.language}. Ensure it includes project overview, setup guides, scripts, and folder architecture.`
  },
  {
    id: 'add-comments',
    name: '生成注释',
    category: '文档与 Git',
    description: '为已有代码添加清晰的注解或 JSDoc/TSDoc。',
    riskLevel: 'modify-files',
    fields: [
      {
        id: 'target',
        label: '目标文件/目录',
        type: 'text',
        required: true,
        placeholder: '例：src/components/TerminalView.tsx'
      }
    ],
    promptTemplate: (v) =>
      `Please add clean, meaningful JSDoc/TSDoc comments and inline annotations to "${v.target}" to make the code easier to follow. Keep the logic unchanged.`
  },
  {
    id: 'generate-tests',
    name: '生成测试',
    category: '质量检查',
    description: '为特定文件编写单元测试用例。',
    riskLevel: 'modify-files',
    fields: [
      {
        id: 'file',
        label: '目标代码文件',
        type: 'text',
        required: true,
        placeholder: '例：src/utils/math.ts'
      },
      {
        id: 'framework',
        label: '测试框架',
        type: 'select',
        required: true,
        options: ['Jest', 'Vitest', 'Mocha'],
        defaultValue: 'Vitest'
      }
    ],
    promptTemplate: (v) =>
      `Please write unit tests for the file "${v.file}" using ${v.framework}. Ensure coverage for key branches and edge cases.`
  },
  {
    id: 'code-review',
    name: '代码审查',
    category: '质量检查',
    description: '审查代码改动或仓库代码，识别隐藏缺陷。',
    riskLevel: 'read-only',
    fields: [
      {
        id: 'focus',
        label: '审查核心要点',
        type: 'select',
        required: true,
        options: ['代码质量', '安全漏洞', '内存泄露', '综合评估'],
        defaultValue: '综合评估'
      }
    ],
    promptTemplate: (v) =>
      `Please review the code changes or core project files. Focus primarily on: ${v.focus}. Identify problems and list recommended refactorings. Do not modify files.`
  },
  {
    id: 'git-commit',
    name: '生成 Commit',
    category: '文档与 Git',
    description: '分析当前 Git Diff 并自动生成规范的 Commit Message。',
    riskLevel: 'run-commands',
    fields: [
      {
        id: 'type',
        label: '提交规范风格',
        type: 'select',
        required: true,
        options: ['Angular (feat/fix)', '简单概要'],
        defaultValue: 'Angular (feat/fix)'
      }
    ],
    promptTemplate: (v) =>
      `Please inspect the current git diff, and generate a standardized commit message following the "${v.type}" format. Send the commit message output.`
  }
]
