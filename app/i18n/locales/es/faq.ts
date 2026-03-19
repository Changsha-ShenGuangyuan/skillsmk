/** FAQ - Spanish */
const faq = {
  'faq.badge':       'FAQ.md',
  'faq.metaSuffix':  'Preguntas frecuentes ',
  'faq.metaUnit':    'elementos',
  'faq.title1':      'Todo sobre',
  'faq.titleAccent': 'Agent Skills',
  'faq.title2':      'respondido',
  'faq.lead':        'Ya sea que quieras entender el protocolo SKILL.md, explorar el despliegue de skills sin conexión o sacar lo mejor de agentes como Claude Code — aquí encontrarás todas las respuestas.',
  'faq.q1': '¿Qué es exactamente un archivo SKILL.md?',
  'faq.a1': 'SKILL.md es un archivo Markdown simple que "enseña" una capacidad específica a tu asistente de IA — como realizar una auditoría de seguridad, estructurar mensajes de commit o configurar un nuevo proyecto. Al colocarlo en el directorio de skills de tu workspace, herramientas como Claude Code lo detectan automáticamente y lo cargan como contexto del agente.',
  'faq.q2': '¿Qué diferencia hay con un system prompt o Cursor Rules?',
  'faq.a2': 'Los system prompts y Cursor Rules configuran el comportamiento general del agente. Los Agent Skills son modulares y componibles — cada SKILL.md se enfoca en una tarea bien definida y puede cargarse de forma selectiva, sin sobrecargar un solo prompt monolítico.',
  'faq.q3': '¿Cómo añado un skill a mi proyecto?',
  'faq.a3': 'En la página de detalle del skill, haz clic en "Descargar" para obtener el ZIP, o en "Copiar comando" para colocar el SKILL.md directamente en tu carpeta de skills con una sola línea. Las herramientas compatibles lo detectarán automáticamente en la próxima sesión.',
  'faq.q4': '¿Son seguros estos skills?',
  'faq.a4': 'Todos los skills indexados provienen de repositorios públicos de GitHub. Mostramos el autor, el enlace al repositorio, la cantidad de estrellas y el contenido bruto del SKILL.md para que puedas tomar una decisión informada antes de usarlo, igual que con cualquier dependencia de código abierto.',
  'faq.q5': '¿Puedo usar múltiples skills al mismo tiempo?',
  'faq.a5': 'Sí, y esa es una de las grandes ventajas. Como cada skill es un archivo Markdown independiente, no hay conflictos. Tu agente puede encadenarlos: primero "depuración sistemática", luego "desarrollo guiado por pruebas", y finalmente "commit de Git".',
  'faq.q6': '¿Cómo publico mi propio skill en el marketplace?',
  'faq.a6': 'Escribe tu skill siguiendo la especificación abierta de SKILL.md y súbelo a un repositorio público de GitHub. Nuestro crawler escanea periódicamente los repositorios que cumplen el estándar — no se requiere envío manual. Un archivo SKILL.md válido en una ruta reconocida es suficiente.',
} as const

export default faq
