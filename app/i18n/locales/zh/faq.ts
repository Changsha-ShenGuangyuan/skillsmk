/** FAQ 翻译 - 中文 */
const faq = {
  'faq.badge':    'FAQ.md',
  'faq.metaSuffix': '常见问题解答 · 共',
  'faq.metaUnit':   '项',
  'faq.title1':   '一切关于',
  'faq.titleAccent': 'Agent Skills',
  'faq.title2':   '的全方位解答',
  'faq.lead':     '无论您是想了解 SKILL.md 的工作协议，探究如何离线部署技能流，或是想让 Claude Code、Codex 这样的智能体发挥最佳效能，都能在这里找到答案。',

  /** FAQ 条目 */
  'faq.q1': 'SKILL.md 文件究竟是什么？',
  'faq.a1': 'SKILL.md 是一个结构化的 Markdown 文件，用于向 AI 助手"教授"某一项特定能力——例如如何进行安全审计、如何规范提交信息，或如何搭建新项目的脚手架。将它放入工作区的技能目录后，Claude Code 等工具会自动检测并将其加载为 Agent 的上下文知识。',

  'faq.q2': '它和系统提示词（System Prompt）或 Cursor Rules 有什么区别？',
  'faq.a2': '系统提示词和 Cursor Rules 配置的是 Agent 的整体行为风格。Agent Skills 则是模块化、可组合的——每一个 SKILL.md 只聚焦于一项具体任务，可以按需加载，不会污染主提示词。您可以在不同项目和团队之间自由组合和共享，远比一个臃肿的系统提示词更易维护。',

  'faq.q3': '如何把一个技能添加到我的项目？',
  'faq.a3': '在任意技能详情页中，点击「下载」即可获取 ZIP 包；或点击「复制安装命令」，粘贴后一键将 SKILL.md 放入项目的技能文件夹。Claude Code 等兼容工具在下次对话时会自动识别，无需重启或额外配置。',

  'faq.q4': '使用这些技能安全吗？',
  'faq.a4': '所有收录的技能均来自 GitHub 上的公开仓库。本站展示了每个技能的作者、仓库链接、Star 数量及完整的 SKILL.md 原文，方便您在使用前做出自己的判断——和评估任何开源依赖库的方式一样。建议在导入生产环境前，先仔细阅读技能内容。',

  'faq.q5': '我是否可以同时使用多个技能？',
  'faq.a5': '可以，这也是 Agent Skills 最大的优势之一。因为每个技能都是独立的 Markdown 文件，多个技能之间不存在冲突。您的 Agent 可以将它们无缝串联——例如：先用「系统性调试」技能定位根本原因，再用「测试驱动开发」技能写出 failing test，最后由「Git 提交」技能规范完成提交。',

  'faq.q6': '如何将我自己写的技能发布到市场？',
  'faq.a6': '按照开放的 SKILL.md 规范撰写技能文件，推送到任意公开的 GitHub 仓库即可。我们的爬虫会定期扫描并索引符合标准的仓库，不需要人工提交申请——只要仓库中的 SKILL.md 文件路径被识别，技能就会自然出现在市场中。',
} as const

export default faq
