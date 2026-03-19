/** FAQ - Portuguese */
const faq = {
  'faq.badge':       'FAQ.md',
  'faq.metaSuffix':  'Perguntas frequentes ',
  'faq.metaUnit':    'itens',
  'faq.title1':      'Tudo sobre',
  'faq.titleAccent': 'Agent Skills',
  'faq.title2':      'respondido',
  'faq.lead':        'Seja para entender o protocolo SKILL.md, explorar implantação offline de skills ou aproveitar ao máximo agentes como Claude Code — você encontrará todas as respostas aqui.',
  'faq.q1': 'O que é exatamente um arquivo SKILL.md?',
  'faq.a1': 'SKILL.md é um arquivo Markdown simples que "ensina" uma capacidade específica ao seu assistente de IA — como realizar uma auditoria de segurança, estruturar mensagens de commit ou configurar um novo projeto. Ao colocá-lo no diretório de skills do seu workspace, ferramentas como Claude Code o detectam automaticamente e carregam como contexto do agente.',
  'faq.q2': 'Qual é a diferença para um system prompt ou Cursor Rules?',
  'faq.a2': 'System prompts e Cursor Rules configuram o comportamento geral do agente. Agent Skills são modulares e combináveis — cada SKILL.md foca em uma tarefa bem definida e pode ser carregado seletivamente, sem sobrecarregar um único prompt monolítico.',
  'faq.q3': 'Como adiciono um skill ao meu projeto?',
  'faq.a3': 'Na página de detalhes do skill, clique em "Baixar" para obter o ZIP, ou em "Copiar comando" para colocar o SKILL.md diretamente na sua pasta de skills com um único comando. Ferramentas compatíveis o detectarão automaticamente na próxima sessão.',
  'faq.q4': 'Esses skills são seguros de usar?',
  'faq.a4': 'Todos os skills indexados vêm de repositórios públicos do GitHub. Exibimos o autor, link do repositório, número de estrelas e o conteúdo bruto do SKILL.md para que você possa tomar uma decisão informada antes de usar, assim como avaliaria qualquer dependência de código aberto.',
  'faq.q5': 'Posso usar vários skills ao mesmo tempo?',
  'faq.a5': 'Sim, e essa é uma das maiores vantagens. Como cada skill é um arquivo Markdown independente, não há conflitos. Seu agente pode encadeá-los: primeiro "depuração sistemática", depois "desenvolvimento orientado a testes", e finalmente "commit no Git".',
  'faq.q6': 'Como publico meu próprio skill no marketplace?',
  'faq.a6': 'Escreva seu skill seguindo a especificação aberta do SKILL.md e faça push para um repositório público no GitHub. Nosso crawler escaneia periodicamente repositórios que seguem o padrão — nenhum envio manual é necessário. Um arquivo SKILL.md válido em um caminho reconhecido é suficiente.',
} as const

export default faq
