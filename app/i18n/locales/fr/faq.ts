/** FAQ - French */
const faq = {
  'faq.badge':       'FAQ.md',
  'faq.metaSuffix':  'Questions fréquentes ',
  'faq.metaUnit':    'éléments',
  'faq.title1':      'Tout sur',
  'faq.titleAccent': 'Agent Skills',
  'faq.title2':      'répondu',
  'faq.lead':        'Que vous souhaitiez comprendre le protocole SKILL.md, explorer le déploiement offline ou tirer le meilleur des agents comme Claude Code — toutes les réponses sont ici.',
  'faq.q1': 'Qu\'est-ce qu\'un fichier SKILL.md exactement ?',
  'faq.a1': 'SKILL.md est un fichier Markdown simple qui « enseigne » une capacité spécifique à votre assistant IA — comme réaliser un audit de sécurité, structurer les messages de commit ou scaffolder un nouveau projet. Placé dans le répertoire de skills de votre workspace, il est automatiquement détecté par des outils comme Claude Code.',
  'faq.q2': 'Quelle différence avec un system prompt ou Cursor Rules ?',
  'faq.a2': 'Les system prompts et Cursor Rules configurent le comportement général de l\'agent. Les Agent Skills sont modulaires et composables — chaque SKILL.md se concentre sur une tâche bien définie et peut être chargé sélectivement, sans alourdir un seul et unique prompt.',
  'faq.q3': 'Comment ajouter un skill à mon projet ?',
  'faq.a3': 'Sur la page de détail d\'un skill, cliquez sur « Télécharger » pour obtenir le ZIP, ou « Copier la commande » pour placer directement le SKILL.md dans votre dossier de skills en une seule ligne. L\'outil compatible le détectera automatiquement à la prochaine session.',
  'faq.q4': 'Ces skills sont-ils sûrs ?',
  'faq.a4': 'Tous les skills indexés proviennent de dépôts GitHub publics. Nous affichons l\'auteur, le lien vers le dépôt, le nombre d\'étoiles et le contenu brut du SKILL.md pour que vous puissiez prendre une décision éclairée avant utilisation — comme pour toute dépendance open source.',
  'faq.q5': 'Puis-je utiliser plusieurs skills simultanément ?',
  'faq.a5': 'Oui, et c\'est l\'un des plus grands avantages. Chaque skill étant un fichier Markdown indépendant, il n\'y a aucun conflit. Votre agent peut les enchaîner : d\'abord un skill « débogage systématique », puis « développement piloté par les tests », enfin « commit Git » pour finaliser.',
  'faq.q6': 'Comment publier mon propre skill sur le marketplace ?',
  'faq.a6': 'Écrivez votre skill selon la spécification SKILL.md ouverte et poussez-le dans un dépôt GitHub public. Notre crawler scanne régulièrement les dépôts conformes au standard — aucune soumission manuelle n\'est nécessaire. Un fichier SKILL.md valide à un chemin reconnu suffit.',
} as const

export default faq
