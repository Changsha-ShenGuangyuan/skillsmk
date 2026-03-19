/** FAQ - German */
const faq = {
  'faq.badge':       'FAQ.md',
  'faq.metaSuffix':  'Häufige Fragen ',
  'faq.metaUnit':    'Einträge',
  'faq.title1':      'Alles über',
  'faq.titleAccent': 'Agent Skills',
  'faq.title2':      'beantwortet',
  'faq.lead':        'Ob du das SKILL.md-Protokoll verstehen, Offline-Skill-Deployment erkunden oder das Beste aus Agenten wie Claude Code herausholen möchtest — hier findest du alle Antworten.',
  'faq.q1': 'Was genau ist eine SKILL.md-Datei?',
  'faq.a1': 'SKILL.md ist eine einfache Markdown-Datei, die deinem KI-Assistenten eine spezifische Fähigkeit „beibringt" — z. B. wie man ein Sicherheitsaudit durchführt, Commit-Nachrichten strukturiert oder ein neues Projekt anlegt. Im Skill-Verzeichnis deines Workspaces wird sie von Tools wie Claude Code automatisch erkannt und als Kontext geladen.',
  'faq.q2': 'Was ist der Unterschied zu einem System-Prompt oder Cursor Rules?',
  'faq.a2': 'System-Prompts und Cursor Rules konfigurieren das allgemeine Verhalten des Agenten. Agent Skills sind modular und kombinierbar — jede SKILL.md fokussiert sich auf eine konkrete Aufgabe und kann selektiv geladen werden, ohne einen riesigen Monolith-Prompt zu erzeugen.',
  'faq.q3': 'Wie füge ich einen Skill zu meinem Projekt hinzu?',
  'faq.a3': 'Klicke auf der Skill-Detailseite auf „Herunterladen" um das ZIP zu erhalten, oder auf „Installationsbefehl kopieren" um die SKILL.md mit einem Einzeiler direkt in deinen Skill-Ordner zu legen. Kompatible Tools erkennen sie beim nächsten Start automatisch.',
  'faq.q4': 'Sind diese Skills sicher zu verwenden?',
  'faq.a4': 'Alle indizierten Skills stammen aus öffentlichen GitHub-Repositories. Wir zeigen Autor, Repository-Link, Sternanzahl und den rohen SKILL.md-Inhalt an, damit du vor der Nutzung eine fundierte Entscheidung treffen kannst — genau wie bei anderen Open-Source-Abhängigkeiten.',
  'faq.q5': 'Kann ich mehrere Skills gleichzeitig verwenden?',
  'faq.a5': 'Ja, das ist einer der größten Vorteile. Da jeder Skill eine eigenständige Markdown-Datei ist, gibt es keine Konflikte. Dein Agent kann sie nahtlos verketten — erst „systematisches Debugging", dann „testgetriebene Entwicklung", schließlich „Git-Commit".',
  'faq.q6': 'Wie veröffentliche ich meinen eigenen Skill im Marketplace?',
  'faq.a6': 'Schreibe deinen Skill nach der offenen SKILL.md-Spezifikation und pushe ihn in ein öffentliches GitHub-Repository. Unser Crawler scannt regelmäßig konforme Repositories — keine manuelle Einreichung nötig. Eine gültige SKILL.md an einem erkannten Pfad reicht aus.',
} as const

export default faq
