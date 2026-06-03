export interface CommandField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'checkbox'
  required: boolean
  placeholder?: string
  options?: string[]
  defaultValue?: string
}

export interface ClaudeCommand {
  id: string
  name: string
  category: string
  description: string
  fields: CommandField[]
  commandTemplate: (vals: Record<string, string>) => string
}

export const CLAUDE_COMMANDS: ClaudeCommand[] = [
  // --- 核心交互 ---
  {
    id: 'help',
    name: '/help',
    category: '核心交互',
    description: '显示帮助信息与可用命令列表。',
    fields: [],
    commandTemplate: () => '/help'
  },
  {
    id: 'exit',
    name: '/exit',
    category: '核心交互',
    description: '退出 CLI。如果是在后台会话中，则退出连接（进程保持运行）。',
    fields: [],
    commandTemplate: () => '/exit'
  },
  {
    id: 'clear',
    name: '/clear',
    category: '核心交互',
    description: '开启新的空上下文会话。旧会话仍可通过 /resume 恢复。',
    fields: [
      {
        id: 'name',
        label: '新会话标签名 (可选)',
        type: 'text',
        required: false,
        placeholder: '例：fix-auth-backup'
      }
    ],
    commandTemplate: (v) => `/clear${v.name ? ' ' + v.name : ''}`
  },
  {
    id: 'compact',
    name: '/compact',
    category: '核心交互',
    description: '通过总结之前的对话来释放上下文空间。',
    fields: [
      {
        id: 'instructions',
        label: '侧重汇总指令 (可选)',
        type: 'text',
        required: false,
        placeholder: '例：保留关于数据库连接的讨论'
      }
    ],
    commandTemplate: (v) => `/compact${v.instructions ? ' ' + v.instructions : ''}`
  },
  {
    id: 'btw',
    name: '/btw',
    category: '核心交互',
    description: '提一个快速的题外话，且不将其写入当前会话的历史中。',
    fields: [
      {
        id: 'question',
        label: '旁支问题',
        type: 'text',
        required: true,
        placeholder: '例：Python 怎么快速获取时间戳？'
      }
    ],
    commandTemplate: (v) => `/btw ${v.question}`
  },
  {
    id: 'copy',
    name: '/copy',
    category: '核心交互',
    description: '复制最近的 AI 回答到剪贴板，带有代码块交互选择器。',
    fields: [
      {
        id: 'N',
        label: '复制倒数第 N 条回答 (可选)',
        type: 'text',
        required: false,
        placeholder: '默认：1'
      }
    ],
    commandTemplate: (v) => `/copy${v.N ? ' ' + v.N : ''}`
  },
  {
    id: 'recap',
    name: '/recap',
    category: '核心交互',
    description: '立即手动生成当前会话的单行总结摘要。',
    fields: [],
    commandTemplate: () => '/recap'
  },
  {
    id: 'rename',
    name: '/rename',
    category: '核心交互',
    description: '重命名当前会话并在提示栏显示。不填参数则自动生成。',
    fields: [
      {
        id: 'name',
        label: '新会话名称',
        type: 'text',
        required: false,
        placeholder: '例：RefactorAuth'
      }
    ],
    commandTemplate: (v) => `/rename${v.name ? ' ' + v.name : ''}`
  },
  {
    id: 'resume',
    name: '/resume',
    category: '核心交互',
    description: '根据会话 ID 或名称恢复某一个会话，或开启会话选择器。',
    fields: [
      {
        id: 'session',
        label: '恢复目标会话名/ID',
        type: 'text',
        required: false,
        placeholder: '例：RefactorAuth'
      }
    ],
    commandTemplate: (v) => `/resume${v.session ? ' ' + v.session : ''}`
  },

  // --- 开发与工作流 ---
  {
    id: 'plan',
    name: '/plan',
    category: '开发与工作流',
    description: '直接进入规划模式（Plan Mode），可附加任务说明。',
    fields: [
      {
        id: 'desc',
        label: '任务描述 (可选)',
        type: 'textarea',
        required: false,
        placeholder: '例：重构用户注册并添加单元测试'
      }
    ],
    commandTemplate: (v) => `/plan${v.desc ? ' ' + v.desc : ''}`
  },
  {
    id: 'goal',
    name: '/goal',
    category: '开发与工作流',
    description: '设定目标，让 Claude 在完成条件前自动多轮次运作。输入 clear 取消。',
    fields: [
      {
        id: 'condition',
        label: '完成条件或目标行为',
        type: 'text',
        required: false,
        placeholder: '例：所有测试全部通过，或输入 clear 清理'
      }
    ],
    commandTemplate: (v) => `/goal${v.condition ? ' ' + v.condition : ''}`
  },
  {
    id: 'run',
    name: '/run',
    category: '开发与工作流',
    description: '构建和驱动项目的运行环境，用于现场观察代码运行结果。',
    fields: [],
    commandTemplate: () => '/run'
  },
  {
    id: 'verify',
    name: '/verify',
    category: '开发与工作流',
    description: '通过构建并运行你的项目，实际观察运行效果以验证修改（代替测试）。',
    fields: [],
    commandTemplate: () => '/verify'
  },
  {
    id: 'batch',
    name: '/batch',
    category: '开发与工作流',
    description: '并行地在整个代码库中编排大规模修改（分治后台子 Agent 并开 PR）。',
    fields: [
      {
        id: 'instruction',
        label: '大规模重构指令',
        type: 'textarea',
        required: true,
        placeholder: '例：migrate src/ from Solid to React'
      }
    ],
    commandTemplate: (v) => `/batch ${v.instruction}`
  },
  {
    id: 'code-review',
    name: '/code-review',
    category: '开发与工作流',
    description: '审查当前改动的 Bug、重用性、可简化度和效率（Simplify 即 review --fix）。',
    fields: [
      {
        id: 'level',
        label: '努力级别',
        type: 'select',
        required: true,
        options: ['none', 'low', 'medium', 'high', 'xhigh', 'max', 'ultra'],
        defaultValue: 'medium'
      },
      {
        id: 'fix',
        label: '直接自动应用修改 (--fix)',
        type: 'checkbox',
        required: false,
        defaultValue: 'false'
      },
      {
        id: 'comment',
        label: '发布为 GitHub 行内评论 (--comment)',
        type: 'checkbox',
        required: false,
        defaultValue: 'false'
      },
      {
        id: 'target',
        label: '目标路径或分支名 (可选)',
        type: 'text',
        required: false,
        placeholder: '例：src/main.ts'
      }
    ],
    commandTemplate: (v) =>
      `/code-review${v.level !== 'none' ? ' ' + v.level : ''}${v.fix === 'true' ? ' --fix' : ''}${v.comment === 'true' ? ' --comment' : ''}${v.target ? ' ' + v.target : ''}`
  },
  {
    id: 'deep-research',
    name: '/deep-research',
    category: '开发与工作流',
    description: '全网搜索指定问题，拉取交叉信息并生成带引用的合成报告。',
    fields: [
      {
        id: 'question',
        label: '深度调研的问题',
        type: 'textarea',
        required: true,
        placeholder: '例：Electron 34 和 React 19 的兼容性陷阱'
      }
    ],
    commandTemplate: (v) => `/deep-research ${v.question}`
  },
  {
    id: 'review',
    name: '/review',
    category: '开发与工作流',
    description: '在本地对某个 Pull Request 分支执行审查（更深审查用 /code-review）。',
    fields: [
      {
        id: 'PR',
        label: 'PR 链接或编号',
        type: 'text',
        required: false,
        placeholder: '例：https://github.com/.../pull/12'
      }
    ],
    commandTemplate: (v) => `/review${v.PR ? ' ' + v.PR : ''}`
  },
  {
    id: 'security-review',
    name: '/security-review',
    category: '开发与工作流',
    description: '深度分析当前分支的 Diff 改动，识别注入、越权、信息暴露等安全漏洞。',
    fields: [],
    commandTemplate: () => '/security-review'
  },
  {
    id: 'ultraplan',
    name: '/ultraplan',
    category: '开发与工作流',
    description: '在云端 ultraplan 会话中规划、浏览器预览并远程执行或拉回本地。',
    fields: [
      {
        id: 'prompt',
        label: '任务描述',
        type: 'textarea',
        required: true,
        placeholder: '例：设计全套单元测试用例'
      }
    ],
    commandTemplate: (v) => `/ultraplan ${v.prompt}`
  },
  {
    id: 'workflows',
    name: '/workflows',
    category: '开发与工作流',
    description: '打开工作流面板，查看、暂停、恢复或存储正运行或已完成的工作流。',
    fields: [],
    commandTemplate: () => '/workflows'
  },

  // --- 系统与配置 ---
  {
    id: 'config',
    name: '/config',
    category: '系统与配置',
    description: '打开交互式设置界面，调整主题、模型、输出格式等首选项。',
    fields: [],
    commandTemplate: () => '/config'
  },
  {
    id: 'context',
    name: '/context',
    category: '系统与配置',
    description: '可视化当前上下文使用率（网格图形式展示容量警告与建议）。',
    fields: [
      {
        id: 'all',
        label: '展开详细列表 (all)',
        type: 'checkbox',
        required: false,
        defaultValue: 'false'
      }
    ],
    commandTemplate: (v) => `/context${v.all === 'true' ? ' all' : ''}`
  },
  {
    id: 'doctor',
    name: '/doctor',
    category: '系统与配置',
    description: '诊断和校验本地 Claude Code 安装依赖，按 f 可以尝试自动修复。',
    fields: [],
    commandTemplate: () => '/doctor'
  },
  {
    id: 'effort',
    name: '/effort',
    category: '系统与配置',
    description: '设置模型的推理努力级别，立即生效。不带参数打开滑块交互。',
    fields: [
      {
        id: 'level',
        label: '选择努力级别',
        type: 'select',
        required: true,
        options: ['none', 'low', 'medium', 'high', 'xhigh', 'max', 'ultracode', 'auto'],
        defaultValue: 'auto'
      }
    ],
    commandTemplate: (v) => `/effort${v.level !== 'none' ? ' ' + v.level : ''}`
  },
  {
    id: 'model',
    name: '/model',
    category: '系统与配置',
    description: '切换 AI 模型的默认值并应用，多轮对话会重读历史缓存。',
    fields: [
      {
        id: 'modelName',
        label: '模型标识符',
        type: 'text',
        required: false,
        placeholder: '例：claude-3-7-sonnet-latest'
      }
    ],
    commandTemplate: (v) => `/model${v.modelName ? ' ' + v.modelName : ''}`
  },
  {
    id: 'permissions',
    name: '/permissions',
    category: '系统与配置',
    description: '管理工具使用的授权允许/询问/拒绝规则，支持按作用域配置。',
    fields: [],
    commandTemplate: () => '/permissions'
  },
  {
    id: 'status',
    name: '/status',
    category: '系统与配置',
    description: '打开状态配置选项（版本、账号、连接性状态），输出期间也可以调用。',
    fields: [],
    commandTemplate: () => '/status'
  },
  {
    id: 'theme',
    name: '/theme',
    category: '系统与配置',
    description: '交互式更改终端 UI 颜色主题，支持明暗、无障碍、ANSI 自适应。',
    fields: [],
    commandTemplate: () => '/theme'
  },
  {
    id: 'usage',
    name: '/usage',
    category: '系统与配置',
    description: '显示会话开销、额度使用上限和按技能划分的数据统计。',
    fields: [],
    commandTemplate: () => '/usage'
  },
  {
    id: 'keybindings',
    name: '/keybindings',
    category: '系统与配置',
    description: '打开或创建自定义终端快捷键 keybindings 配置文件。',
    fields: [],
    commandTemplate: () => '/keybindings'
  },

  // --- 第三方与集成 ---
  {
    id: 'autofix-pr',
    name: '/autofix-pr',
    category: '第三方与集成',
    description: '在网页端挂载自动修复 CI / Review 问题代理，实时推送 CI 错误修复。',
    fields: [
      {
        id: 'prompt',
        label: '限定修复指令 (可选)',
        type: 'text',
        required: false,
        placeholder: '例：only fix lint and type errors'
      }
    ],
    commandTemplate: (v) => `/autofix-pr${v.prompt ? ' ' + v.prompt : ''}`
  },
  {
    id: 'install-github-app',
    name: '/install-github-app',
    category: '第三方与集成',
    description: '为当前仓库配置 Claude GitHub Actions 官方应用引导流程。',
    fields: [],
    commandTemplate: () => '/install-github-app'
  },
  {
    id: 'install-slack-app',
    name: '/install-slack-app',
    category: '第三方与集成',
    description: '安装并在浏览器 OAuth 授权中集成 Claude Slack 应用。',
    fields: [],
    commandTemplate: () => '/install-slack-app'
  },
  {
    id: 'web-setup',
    name: '/web-setup',
    category: '第三方与集成',
    description: '根据本地 GitHub CLI 凭证打通与网页版 Claude Code 的联动。',
    fields: [],
    commandTemplate: () => '/web-setup'
  },
  {
    id: 'mcp',
    name: '/mcp',
    category: '第三方与集成',
    description: '配置并管理 Model Context Protocol（MCP）服务器连接和 OAuth 认证。',
    fields: [],
    commandTemplate: () => '/mcp'
  },
  {
    id: 'chrome',
    name: '/chrome',
    category: '第三方与集成',
    description: '进入配置引导，管理 Chrome 中的 Claude 参数设置。',
    fields: [],
    commandTemplate: () => '/chrome'
  },
  {
    id: 'desktop',
    name: '/desktop',
    category: '第三方与集成',
    description: '将当前终端会话平滑延续加载在 Claude 官方桌面版客户端中运行。',
    fields: [],
    commandTemplate: () => '/desktop'
  },
  {
    id: 'mobile',
    name: '/mobile',
    category: '第三方与集成',
    description: '输出用于下载 iOS 或 Android 移动版客户端的官方二维码。',
    fields: [],
    commandTemplate: () => '/mobile'
  },

  // --- 辅助指令 ---
  {
    id: 'color',
    name: '/color',
    category: '辅助指令',
    description: '设置当前会话的终端输入框底色。无参数将随机切换。',
    fields: [
      {
        id: 'colorName',
        label: '底色方案',
        type: 'select',
        required: true,
        options: ['default', 'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'],
        defaultValue: 'default'
      }
    ],
    commandTemplate: (v) => `/color ${v.colorName}`
  },
  {
    id: 'fast',
    name: '/fast',
    category: '辅助指令',
    description: '切换快速响应模式开启/关闭。',
    fields: [
      {
        id: 'status',
        label: '状态',
        type: 'select',
        required: true,
        options: ['none', 'on', 'off'],
        defaultValue: 'none'
      }
    ],
    commandTemplate: (v) => `/fast${v.status !== 'none' ? ' ' + v.status : ''}`
  },
  {
    id: 'feedback',
    name: '/feedback',
    category: '辅助指令',
    description: '提交产品反馈、错误报告或分享你的整个会话日志（Alias: /bug）。',
    fields: [],
    commandTemplate: () => '/feedback'
  },
  {
    id: 'init',
    name: '/init',
    category: '辅助指令',
    description: '在当前项目里快速初始化生成 CLAUDE.md 引导开发规范文件。',
    fields: [],
    commandTemplate: () => '/init'
  },
  {
    id: 'insights',
    name: '/insights',
    category: '辅助指令',
    description: '生成针对历史会话活跃度、项目领域、摩擦点和高频指令的统计报表。',
    fields: [],
    commandTemplate: () => '/insights'
  },
  {
    id: 'loop',
    name: '/loop',
    category: '辅助指令',
    description: '定时或间隔性重复跑某条指令，不带参数跑 Loop.md 的维护巡检（Alias: /proactive）。',
    fields: [
      {
        id: 'interval',
        label: '循环时间间隔 (可选)',
        type: 'text',
        required: false,
        placeholder: '例：5m / 10s'
      },
      {
        id: 'prompt',
        label: '需循环测试的指令内容 (可选)',
        type: 'text',
        required: false,
        placeholder: '例：check if deploy finished'
      }
    ],
    commandTemplate: (v) =>
      `/loop${v.interval ? ' ' + v.interval : ''}${v.prompt ? ' ' + v.prompt : ''}`
  },
  {
    id: 'memory',
    name: '/memory',
    category: '辅助指令',
    description: '编辑 CLAUDE.md 中的规则，启用/禁用自动记忆文件并查看条目。',
    fields: [],
    commandTemplate: () => '/memory'
  },
  {
    id: 'passes',
    name: '/passes',
    category: '辅助指令',
    description: '分享赠送给朋友的 Claude Code 免费试用周体验券（需账号额度达标）。',
    fields: [],
    commandTemplate: () => '/passes'
  },
  {
    id: 'radio',
    name: '/radio',
    category: '辅助指令',
    description: '在浏览器中打开 Claude FM Lo-Fi 专属电台网页播放音轨。',
    fields: [],
    commandTemplate: () => '/radio'
  },
  {
    id: 'release-notes',
    name: '/release-notes',
    category: '辅助指令',
    description: '交互式查看并检索 Claude CLI 官方各版本的 Changelog 发行注解。',
    fields: [],
    commandTemplate: () => '/release-notes'
  },
  {
    id: 'reload-plugins',
    name: '/reload-plugins',
    category: '辅助指令',
    description: '重载已激活的插件配置以更新改动，无需重启当前会话。',
    fields: [],
    commandTemplate: () => '/reload-plugins'
  },
  {
    id: 'reload-skills',
    name: '/reload-skills',
    category: '辅助指令',
    description: '重新扫描磁盘中的 Skills 和 commands 目录，让新增的脚本立即生效。',
    fields: [],
    commandTemplate: () => '/reload-skills'
  },
  {
    id: 'remote-control',
    name: '/remote-control',
    category: '辅助指令',
    description: '允许此终端在 claude.ai 网页版个人面板中进行远程遥控使用。',
    fields: [],
    commandTemplate: () => '/remote-control'
  },
  {
    id: 'remote-env',
    name: '/remote-env',
    category: '辅助指令',
    description: '配置通过 --remote 开启的网页会话在云端主机的默认底层环境。',
    fields: [],
    commandTemplate: () => '/remote-env'
  },
  {
    id: 'run-skill-generator',
    name: '/run-skill-generator',
    category: '辅助指令',
    description: '教导 /run 和 /verify 从全新环境中构建运行工程（生成专案 Skill）。',
    fields: [],
    commandTemplate: () => '/run-skill-generator'
  },
  {
    id: 'sandbox',
    name: '/sandbox',
    category: '辅助指令',
    description: '切换沙箱模式（在安全虚拟沙盒隔离态内执行指令，需系统支持）。',
    fields: [],
    commandTemplate: () => '/sandbox'
  },
  {
    id: 'scroll-speed',
    name: '/scroll-speed',
    category: '辅助指令',
    description: '交互式滑块调节终端鼠标滑轮滚动速度响应率。',
    fields: [],
    commandTemplate: () => '/scroll-speed'
  },
  {
    id: 'skills',
    name: '/skills',
    category: '辅助指令',
    description: '列出当前可用的所有技能，支持按令牌大小排序或切换隐藏规则。',
    fields: [],
    commandTemplate: () => '/skills'
  },
  {
    id: 'statusline',
    name: '/statusline',
    category: '辅助指令',
    description: '根据你的指示，对话式自定义配置 Claude 状态条显示的信息内容。',
    fields: [],
    commandTemplate: () => '/statusline'
  },
  {
    id: 'stickers',
    name: '/stickers',
    category: '辅助指令',
    description: '打印进入官方申领 Claude Code 贴纸周边的网络访问入口。',
    fields: [],
    commandTemplate: () => '/stickers'
  },
  {
    id: 'stop',
    name: '/stop',
    category: '辅助指令',
    description: '挂起并结束当前的后台 session，工作区将被存留。',
    fields: [],
    commandTemplate: () => '/stop'
  },
  {
    id: 'team-onboarding',
    name: '/team-onboarding',
    category: '辅助指令',
    description: '自动分析近30天终端历史，导出面向新成员的定制化 markdown 入驻指南。',
    fields: [],
    commandTemplate: () => '/team-onboarding'
  },
  {
    id: 'teleport',
    name: '/teleport',
    category: '辅助指令',
    description: '把网页端 Claude Code 上的分支与对话，完美穿越同步同步到本地。',
    fields: [],
    commandTemplate: () => '/teleport'
  },
  {
    id: 'terminal-setup',
    name: '/terminal-setup',
    category: '辅助指令',
    description: '为 IDE 或自带终端自适应修正 Shift+Enter 等高频快捷按键配置。',
    fields: [],
    commandTemplate: () => '/terminal-setup'
  },
  {
    id: 'voice',
    name: '/voice',
    category: '辅助指令',
    description: '配置并开闭语音转写输入模式，支持 hold 触发。',
    fields: [
      {
        id: 'mode',
        label: '语音检测模式',
        type: 'select',
        required: true,
        options: ['none', 'hold', 'tap', 'off'],
        defaultValue: 'none'
      }
    ],
    commandTemplate: (v) => `/voice${v.mode !== 'none' ? ' ' + v.mode : ''}`
  }
]
