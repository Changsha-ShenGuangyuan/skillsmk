/** FAQ translations - English */
const faq = {
  'faq.badge':       'FAQ.md',
  'faq.metaSuffix':  'Frequently Asked Questions ·',
  'faq.metaUnit':    'items',
  'faq.title1':      'Everything about',
  'faq.titleAccent': 'Agent Skills',
  'faq.title2':      'answered',
  'faq.lead':        'Whether you want to understand the SKILL.md protocol, explore offline skill deployment, or get the best out of agents like Claude Code and Codex — you\'ll find all the answers here.',

  'faq.q1': 'What exactly is a SKILL.md file?',
  'faq.a1': 'SKILL.md is a plain Markdown file that teaches your AI assistant a specific capability — like how to conduct a security audit, structure a commit message, or scaffold a new project. When you place it in your workspace\'s skill directory, tools like Claude Code automatically detect and load it as part of the agent\'s working context.',

  'faq.q2': 'How is this different from a system prompt or a Cursor Rule?',
  'faq.a2': 'System prompts and Cursor Rules set general behavior for an agent. Agent Skills are modular and composable — each SKILL.md focuses on one well-defined task and can be loaded selectively. You can combine dozens of skills without polluting a single monolithic prompt, and share them across teams or projects.',

  'faq.q3': 'How do I add a skill to my project?',
  'faq.a3': 'On any skill detail page, click "Download" to get the ZIP package, or "Copy Install Command" to run the one-liner that places the SKILL.md directly into your project\'s skill folder. Claude Code and compatible tools will pick it up on the next session — no restart needed.',

  'faq.q4': 'Are these skills safe to use?',
  'faq.a4': 'All indexed skills come from public GitHub repositories. We surface the author, repository link, star count, and raw SKILL.md content so you can make an informed decision before using it — the same way you evaluate any open-source dependency. We recommend reading the SKILL.md before importing it into a production workspace.',

  'faq.q5': 'Can I run multiple skills at the same time?',
  'faq.a5': 'Yes, and that\'s one of the biggest advantages. Because each skill is a standalone Markdown file, there are no conflicts. Your agent can chain them seamlessly — for example: a "systematic-debugging" skill to locate a root cause, then a "test-driven-development" skill to write a failing test, and finally a "git-commit" skill to finalize the change.',

  'faq.q6': 'How do I publish my own skill to the marketplace?',
  'faq.a6': 'Write a SKILL.md following the open specification and push it to any public GitHub repository. Our crawler periodically indexes repos that match the standard. There is no manual submission step — discoverable skills simply need a valid SKILL.md file at a recognized path inside the repository.',
} as const

export default faq
