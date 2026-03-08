// ── Translations ─────────────────────────────────────────────────────
const T = {
  en: {
    'hero.kicker':'Conversational AI · Rich UI Widgets',
    'hero.h1':'Chat that<br>shows, not<br>just tells.',
    'hero.summary':'LuAI turns AI conversations into rich visual experiences. Ask a question, get a widget — weather, quotes, live data — rendered inline in the chat.',
    'hero.btn1':'The Architecture','hero.btn2':'Live Landing',
    'mockup.question':"What's the weather in Bogotá?",'mockup.cond':'Partly cloudy',
    'mockup.answer':"Here's the live weather for Bogotá.",'mockup.placeholder':'Ask anything...',
    'chip.insurance':'⚡ insurance pack','chip.weather':'🌤 weather pack','chip.add':'＋ add pack',
    'why.kicker':'Why it matters',
    'why.h2':"Users don't want walls of text.<br>They want answers they can see.",
    'why.copy':"Getting text from a model is easy. Turning that response into something visual, structured, and trustworthy — that's the hard part.",
    'bad.label':'Text-only AI','bad.li1':"Long responses users don't read",'bad.li2':'Data buried in paragraphs','bad.li3':'No structure, no visual hierarchy',
    'good.label':'LuAI with flow-packs','good.li1':'Answers rendered as rich UI widgets','good.li2':'Structured data shown visually','good.li3':'Each domain gets its own card design',
    'cap.kicker':'Capabilities','cap.h2':'Chat + Widgets, as one.',
    'cap.card1.h3':'Flow Packs','cap.card1.p':'Each domain ships as an isolated pack with its own tools, prompts, and widget UI. Add new domains without touching the core.',
    'cap.card2.h3':'Build-time Wiring','cap.card2.p':'Packs are registered at build time. No runtime discovery, no hidden magic — explicit, type-safe integrations.',
    'compare.kicker':'Ecosystem','compare.h2':'How we compare.',
    'compare.col1':'Path','compare.col2':'Speed to Market','compare.col3':'Workflow Architecture','compare.col4':'Foundational Layer',
    'compare.r1c1':'Blank Stack','compare.r1c2':'Low','compare.r1c3':'None','compare.r1c4':'No',
    'compare.r2c2':'Maximum','compare.r2c3':'Pack-based & Composable','compare.r2c4':'Yes',
    'tech.kicker':'Technical Credibility','tech.h2':'Opinionated, but not hidden.',
    'tech.copy':'LuAI scans manifests, resolves modules, and generates static mount files during build. Extensible without losing visibility.',
    'docs.kicker':'Documentation','docs.h2':'Everything documented,<br>without digging through the repo.',
    'docs.copy':'LuAI documentation lives in GitBook: product overview, architecture notes, setup guides, and reference material in one place.',
    'docs.note':'Go straight to the docs hub for walkthroughs, implementation details, and deployment guidance.','docs.cta':'Open documentation',
    'flow.pack':'Declares tools, cards, routes & MCP','flow.gen.name':'Code generation','flow.gen.desc':'Scans manifests, resolves modules',
    'flow.app.name':'Running app','flow.app.desc':'Type-safe, zero runtime magic',
    'try.badge':'Open Source','try.h2':'Try today','try.sub':'Clone it, run it, and decide if this should be your next AI foundation.',
    'try.repo':'Open repository','try.download':'Download code','try.step1':'Clone the repo','try.step3':'Ship your pack',
    'pwa.splash':'Desktop / Splash','pwa.android':'Android homescreen','pwa.apple':'Apple touch icon','pwa.maskable':'Maskable (adaptive)',
    'footer':'© 2026 LuAI','topnav.github':'GitHub →',
    'nav.hero':'Hero','nav.why':'Problem','nav.cap':'Capabilities','nav.compare':'Comparison','nav.tech':'Architecture','nav.try':'Try today','nav.docs':'Documentation',
  },
  es: {
    'hero.kicker':'IA Conversacional · Widgets de UI',
    'hero.h1':'Un chat que<br>muestra, no<br>solo responde.',
    'hero.summary':'LuAI convierte conversaciones de IA en experiencias visuales. Haz una pregunta, obtén un widget — clima, cotizaciones, datos — renderizado en el chat.',
    'hero.btn1':'La Arquitectura','hero.btn2':'Landing Live',
    'mockup.question':'¿Cómo está el clima en Bogotá?','mockup.cond':'Parcialmente nublado',
    'mockup.answer':'Aquí está el clima en tiempo real para Bogotá.','mockup.placeholder':'Pregunta lo que quieras...',
    'chip.insurance':'⚡ pack de seguros','chip.weather':'🌤 pack del clima','chip.add':'＋ agregar pack',
    'why.kicker':'Por qué importa',
    'why.h2':'Los usuarios no quieren muros de texto.<br>Quieren respuestas que puedan ver.',
    'why.copy':'Obtener texto de un modelo es fácil. Convertir esa respuesta en algo visual, estructurado y confiable — eso es lo difícil.',
    'bad.label':'IA solo de texto','bad.li1':'Respuestas largas que nadie lee','bad.li2':'Datos enterrados en párrafos','bad.li3':'Sin estructura ni jerarquía visual',
    'good.label':'LuAI con flow-packs','good.li1':'Respuestas como widgets de UI','good.li2':'Datos estructurados mostrados visualmente','good.li3':'Cada dominio tiene su propio diseño',
    'cap.kicker':'Capacidades','cap.h2':'Chat + Widgets, como uno solo.',
    'cap.card1.h3':'Flow Packs','cap.card1.p':'Cada dominio se distribuye como un pack aislado con sus propias herramientas, prompts y widgets. Agrega dominios sin tocar el núcleo.',
    'cap.card2.h3':'Conexiones en Build','cap.card2.p':'Los packs se registran en tiempo de compilación. Sin descubrimiento en runtime, sin magia oculta — integraciones explícitas y tipadas.',
    'compare.kicker':'Ecosistema','compare.h2':'Cómo nos comparamos.',
    'compare.col1':'Camino','compare.col2':'Velocidad al Mercado','compare.col3':'Arquitectura de Flujo','compare.col4':'Capa Fundacional',
    'compare.r1c1':'Stack en Blanco','compare.r1c2':'Baja','compare.r1c3':'Ninguna','compare.r1c4':'No',
    'compare.r2c2':'Máxima','compare.r2c3':'Por Packs & Composable','compare.r2c4':'Sí',
    'tech.kicker':'Credibilidad Técnica','tech.h2':'Con opinión, pero sin secretos.',
    'tech.copy':'LuAI escanea manifiestos, resuelve módulos y genera archivos estáticos en build. Extensible sin perder visibilidad.',
    'docs.kicker':'Documentación','docs.h2':'Todo documentado,<br>sin bucear por el repo.',
    'docs.copy':'La documentación de LuAI vive en GitBook: visión general del producto, notas de arquitectura, guías de setup y material de referencia en un solo lugar.',
    'docs.note':'Ve directo al hub de documentación para walkthroughs, detalles de implementación y guías de despliegue.','docs.cta':'Abrir documentación',
    'flow.pack':'Declara herramientas, cards, rutas y MCP','flow.gen.name':'Generación de código','flow.gen.desc':'Escanea manifiestos, resuelve módulos',
    'flow.app.name':'App en ejecución','flow.app.desc':'Tipado seguro, cero magia en runtime',
    'try.badge':'Código Abierto','try.h2':'Pruébalo hoy','try.sub':'Clónalo, ejecútalo y decide si esta es tu próxima base de IA.',
    'try.repo':'Abrir repositorio','try.download':'Descargar código','try.step1':'Clonar el repo','try.step3':'Publica tu pack',
    'pwa.splash':'Escritorio / Splash','pwa.android':'Pantalla de inicio Android','pwa.apple':'Ícono Apple touch','pwa.maskable':'Maskable (adaptativo)',
    'footer':'© 2026 LuAI','topnav.github':'GitHub →',
    'nav.hero':'Inicio','nav.why':'Problema','nav.cap':'Capacidades','nav.compare':'Comparación','nav.tech':'Arquitectura','nav.try':'Pruébalo','nav.docs':'Docs',
  },
  fr: {
    'hero.kicker':'IA Conversationnelle · Widgets UI',
    'hero.h1':'Un chat qui<br>montre, pas<br>que répond.',
    'hero.summary':"LuAI transforme les conversations IA en expériences visuelles. Posez une question, obtenez un widget — météo, devis, données — intégré dans le chat.",
    'hero.btn1':"L'Architecture",'hero.btn2':'Landing Live',
    'mockup.question':'Quel temps fait-il à Bogotá ?','mockup.cond':'Partiellement nuageux',
    'mockup.answer':'Voici la météo en direct pour Bogotá.','mockup.placeholder':'Posez votre question...',
    'chip.insurance':'⚡ pack assurance','chip.weather':'🌤 pack météo','chip.add':'＋ ajouter pack',
    'why.kicker':'Pourquoi ça compte',
    'why.h2':"Les utilisateurs ne veulent pas de murs de texte.<br>Ils veulent des réponses qu'ils peuvent voir.",
    'why.copy':"Obtenir du texte d'un modèle est facile. Transformer cette réponse en quelque chose de visuel, structuré et fiable — c'est là le vrai défi.",
    'bad.label':'IA texte uniquement','bad.li1':'De longues réponses que personne ne lit','bad.li2':'Données noyées dans des paragraphes','bad.li3':'Aucune structure ni hiérarchie visuelle',
    'good.label':'LuAI avec flow-packs','good.li1':'Réponses sous forme de widgets UI','good.li2':'Données structurées affichées visuellement','good.li3':'Chaque domaine a son propre design',
    'cap.kicker':'Capacités','cap.h2':'Chat + Widgets, en un seul.',
    'cap.card1.h3':'Flow Packs','cap.card1.p':"Chaque domaine est livré comme un pack isolé avec ses propres outils, prompts et widgets. Ajoutez des domaines sans toucher au cœur.",
    'cap.card2.h3':'Câblage au Build','cap.card2.p':'Les packs sont enregistrés au moment de la compilation. Pas de magie cachée — des intégrations explicites et typées.',
    'compare.kicker':'Écosystème','compare.h2':'Notre comparaison.',
    'compare.col1':'Approche','compare.col2':'Rapidité','compare.col3':'Architecture','compare.col4':'Couche Fondamentale',
    'compare.r1c1':'Stack Vide','compare.r1c2':'Faible','compare.r1c3':'Aucune','compare.r1c4':'Non',
    'compare.r2c2':'Maximum','compare.r2c3':'Par Packs & Composable','compare.r2c4':'Oui',
    'tech.kicker':'Crédibilité Technique','tech.h2':'Avec des opinions, mais transparent.',
    'tech.copy':'LuAI analyse les manifestes, résout les modules et génère des fichiers statiques lors du build. Extensible sans perdre en visibilité.',
    'docs.kicker':'Documentation','docs.h2':'Tout documenté,<br>sans fouiller le dépôt.',
    'docs.copy':'La documentation LuAI vit dans GitBook : vue produit, notes d’architecture, guides d’installation et références au même endroit.',
    'docs.note':'Accédez directement au hub de documentation pour les walkthroughs, détails d’implémentation et guides de déploiement.','docs.cta':'Ouvrir la documentation',
    'flow.pack':'Déclare outils, cards, routes & MCP','flow.gen.name':'Génération de code','flow.gen.desc':'Analyse les manifestes, résout les modules',
    'flow.app.name':'App en cours','flow.app.desc':'Typé, zéro magie au runtime',
    'try.badge':'Open Source','try.h2':"Essayez aujourd'hui",'try.sub':"Clonez-le, lancez-le, et décidez si c'est votre prochaine base IA.",
    'try.repo':'Ouvrir le dépôt','try.download':'Télécharger le code','try.step1':'Cloner le dépôt','try.step3':'Publiez votre pack',
    'pwa.splash':'Bureau / Splash','pwa.android':'Écran Android','pwa.apple':'Icône Apple touch','pwa.maskable':'Maskable (adaptatif)',
    'footer':'© 2026 LuAI','topnav.github':'GitHub →',
    'nav.hero':'Accueil','nav.why':'Problème','nav.cap':'Capacités','nav.compare':'Comparaison','nav.tech':'Architecture','nav.try':'Essayer','nav.docs':'Docs',
  },
  it: {
    'hero.kicker':'IA Conversazionale · Widget UI',
    'hero.h1':'Una chat che<br>mostra, non<br>solo risponde.',
    'hero.summary':'LuAI trasforma le conversazioni IA in esperienze visive. Fai una domanda, ottieni un widget — meteo, preventivi, dati — renderizzato nella chat.',
    'hero.btn1':"L'Architettura",'hero.btn2':'Landing Live',
    'mockup.question':'Com\'è il meteo a Bogotá?','mockup.cond':'Parzialmente nuvoloso',
    'mockup.answer':'Ecco il meteo in tempo reale per Bogotá.','mockup.placeholder':'Chiedi qualsiasi cosa...',
    'chip.insurance':'⚡ pack assicurazione','chip.weather':'🌤 pack meteo','chip.add':'＋ aggiungi pack',
    'why.kicker':'Perché è importante',
    'why.h2':'Gli utenti non vogliono muri di testo.<br>Vogliono risposte che possono vedere.',
    'why.copy':'Ottenere testo da un modello è facile. Trasformare quella risposta in qualcosa di visivo, strutturato e affidabile — questa è la parte difficile.',
    'bad.label':'IA solo testo','bad.li1':'Risposte lunghe che nessuno legge','bad.li2':'Dati sepolti nei paragrafi','bad.li3':'Nessuna struttura né gerarchia visiva',
    'good.label':'LuAI con flow-packs','good.li1':'Risposte come widget UI','good.li2':'Dati strutturati mostrati visivamente','good.li3':'Ogni dominio ha il suo design',
    'cap.kicker':'Capacità','cap.h2':'Chat + Widget, come uno.',
    'cap.card1.h3':'Flow Packs','cap.card1.p':'Ogni dominio è distribuito come un pack isolato con i propri strumenti, prompt e widget. Aggiungi domini senza toccare il nucleo.',
    'cap.card2.h3':'Connessioni al Build','cap.card2.p':'I pack vengono registrati al momento della compilazione. Nessuna magia nascosta — integrazioni esplicite e tipizzate.',
    'compare.kicker':'Ecosistema','compare.h2':'Come ci confrontiamo.',
    'compare.col1':'Percorso','compare.col2':'Velocità','compare.col3':'Architettura','compare.col4':'Strato Fondamentale',
    'compare.r1c1':'Stack Vuoto','compare.r1c2':'Bassa','compare.r1c3':'Nessuna','compare.r1c4':'No',
    'compare.r2c2':'Massima','compare.r2c3':'Pack-based & Composable','compare.r2c4':'Sì',
    'tech.kicker':'Credibilità Tecnica','tech.h2':'Con opinioni, ma trasparente.',
    'tech.copy':'LuAI scansiona i manifest, risolve i moduli e genera file statici durante il build. Estensibile senza perdere visibilità.',
    'docs.kicker':'Documentazione','docs.h2':'Tutto documentato,<br>senza scavare nel repo.',
    'docs.copy':'La documentazione di LuAI vive su GitBook: panoramica prodotto, note architetturali, guide di setup e riferimenti in un unico posto.',
    'docs.note':'Vai direttamente all’hub documentale per walkthrough, dettagli di implementazione e guide di deploy.','docs.cta':'Apri la documentazione',
    'flow.pack':'Dichiara strumenti, card, route & MCP','flow.gen.name':'Generazione di codice','flow.gen.desc':'Scansiona manifest, risolve moduli',
    'flow.app.name':'App in esecuzione','flow.app.desc':'Type-safe, zero magia a runtime',
    'try.badge':'Open Source','try.h2':'Prova oggi','try.sub':'Clonalo, eseguilo e decidi se questa è la tua prossima base IA.',
    'try.repo':'Apri il repository','try.download':'Scarica il codice','try.step1':'Clona il repo','try.step3':'Pubblica il tuo pack',
    'pwa.splash':'Desktop / Splash','pwa.android':'Schermata Android','pwa.apple':'Icona Apple touch','pwa.maskable':'Maskable (adattivo)',
    'footer':'© 2026 LuAI','topnav.github':'GitHub →',
    'nav.hero':'Home','nav.why':'Problema','nav.cap':'Capacità','nav.compare':'Confronto','nav.tech':'Architettura','nav.try':'Prova','nav.docs':'Docs',
  },
  pt: {
    'hero.kicker':'IA Conversacional · Widgets de UI',
    'hero.h1':'Um chat que<br>mostra, não<br>só responde.',
    'hero.summary':'LuAI transforma conversas de IA em experiências visuais. Faça uma pergunta, receba um widget — clima, cotações, dados — renderizado no chat.',
    'hero.btn1':'A Arquitetura','hero.btn2':'Landing Live',
    'mockup.question':'Como está o tempo em Bogotá?','mockup.cond':'Parcialmente nublado',
    'mockup.answer':'Aqui está o clima em tempo real para Bogotá.','mockup.placeholder':'Pergunte qualquer coisa...',
    'chip.insurance':'⚡ pack de seguros','chip.weather':'🌤 pack do clima','chip.add':'＋ adicionar pack',
    'why.kicker':'Por que importa',
    'why.h2':'Os usuários não querem muros de texto.<br>Querem respostas que podem ver.',
    'why.copy':'Obter texto de um modelo é fácil. Transformar essa resposta em algo visual, estruturado e confiável — essa é a parte difícil.',
    'bad.label':'IA só de texto','bad.li1':'Respostas longas que ninguém lê','bad.li2':'Dados enterrados em parágrafos','bad.li3':'Sem estrutura nem hierarquia visual',
    'good.label':'LuAI com flow-packs','good.li1':'Respostas como widgets de UI','good.li2':'Dados estruturados exibidos visualmente','good.li3':'Cada domínio tem seu próprio design',
    'cap.kicker':'Capacidades','cap.h2':'Chat + Widgets, como um só.',
    'cap.card1.h3':'Flow Packs','cap.card1.p':'Cada domínio é distribuído como um pack isolado com suas próprias ferramentas, prompts e widgets. Adicione domínios sem tocar no núcleo.',
    'cap.card2.h3':'Conexões no Build','cap.card2.p':'Os packs são registrados no momento da compilação. Sem magia oculta — integrações explícitas e tipadas.',
    'compare.kicker':'Ecossistema','compare.h2':'Como nos comparamos.',
    'compare.col1':'Caminho','compare.col2':'Velocidade','compare.col3':'Arquitetura','compare.col4':'Camada Fundamental',
    'compare.r1c1':'Stack em Branco','compare.r1c2':'Baixa','compare.r1c3':'Nenhuma','compare.r1c4':'Não',
    'compare.r2c2':'Máxima','compare.r2c3':'Por Packs & Composable','compare.r2c4':'Sim',
    'tech.kicker':'Credibilidade Técnica','tech.h2':'Com opiniões, mas transparente.',
    'tech.copy':'LuAI escaneia manifestos, resolve módulos e gera arquivos estáticos no build. Extensível sem perder visibilidade.',
    'docs.kicker':'Documentação','docs.h2':'Tudo documentado,<br>sem cavar pelo repo.',
    'docs.copy':'A documentação do LuAI fica no GitBook: visão do produto, notas de arquitetura, guias de setup e material de referência em um só lugar.',
    'docs.note':'Vá direto ao hub de documentação para walkthroughs, detalhes de implementação e guias de deploy.','docs.cta':'Abrir documentação',
    'flow.pack':'Declara ferramentas, cards, rotas & MCP','flow.gen.name':'Geração de código','flow.gen.desc':'Escaneia manifestos, resolve módulos',
    'flow.app.name':'App em execução','flow.app.desc':'Type-safe, zero magia em runtime',
    'try.badge':'Código Aberto','try.h2':'Experimente hoje','try.sub':'Clone, execute e decida se esta é sua próxima base de IA.',
    'try.repo':'Abrir repositório','try.download':'Baixar código','try.step1':'Clonar o repo','try.step3':'Publique seu pack',
    'pwa.splash':'Desktop / Splash','pwa.android':'Tela inicial Android','pwa.apple':'Ícone Apple touch','pwa.maskable':'Maskable (adaptativo)',
    'footer':'© 2026 LuAI','topnav.github':'GitHub →',
    'nav.hero':'Início','nav.why':'Problema','nav.cap':'Capacidades','nav.compare':'Comparação','nav.tech':'Arquitetura','nav.try':'Experimentar','nav.docs':'Docs',
  },
  de: {
    'hero.kicker':'Konversationelle KI · UI-Widgets',
    'hero.h1':'Ein Chat der<br>zeigt, nicht<br>nur antwortet.',
    'hero.summary':'LuAI verwandelt KI-Gespräche in visuelle Erlebnisse. Stelle eine Frage, erhalte ein Widget — Wetter, Angebote, Live-Daten — direkt im Chat.',
    'hero.btn1':'Die Architektur','hero.btn2':'Live Landing',
    'mockup.question':'Wie ist das Wetter in Bogotá?','mockup.cond':'Teilweise bewölkt',
    'mockup.answer':'Hier ist das aktuelle Wetter für Bogotá.','mockup.placeholder':'Frag mich alles...',
    'chip.insurance':'⚡ Versicherungs-Pack','chip.weather':'🌤 Wetter-Pack','chip.add':'＋ Pack hinzufügen',
    'why.kicker':'Warum es wichtig ist',
    'why.h2':'Nutzer wollen keine Textwände.<br>Sie wollen Antworten, die sie sehen können.',
    'why.copy':'Text aus einem Modell zu bekommen ist einfach. Diesen in etwas Visuelles, Strukturiertes und Vertrauenswürdiges zu verwandeln — das ist die Herausforderung.',
    'bad.label':'Nur-Text-KI','bad.li1':'Lange Antworten, die niemand liest','bad.li2':'Daten in Absätzen vergraben','bad.li3':'Keine Struktur, keine visuelle Hierarchie',
    'good.label':'LuAI mit Flow-Packs','good.li1':'Antworten als UI-Widgets dargestellt','good.li2':'Strukturierte Daten visuell angezeigt','good.li3':'Jede Domäne hat ihr eigenes Kartendesign',
    'cap.kicker':'Fähigkeiten','cap.h2':'Chat + Widgets als Einheit.',
    'cap.card1.h3':'Flow Packs','cap.card1.p':'Jede Domäne wird als isoliertes Pack mit eigenen Tools, Prompts und Widgets geliefert. Neue Domänen ohne Kernänderungen hinzufügen.',
    'cap.card2.h3':'Build-Zeit-Verdrahtung','cap.card2.p':'Packs werden zur Kompilierzeit registriert. Keine Runtime-Magie — explizite, typsichere Integrationen.',
    'compare.kicker':'Ökosystem','compare.h2':'Unser Vergleich.',
    'compare.col1':'Ansatz','compare.col2':'Markteinführung','compare.col3':'Architektur','compare.col4':'Grundschicht',
    'compare.r1c1':'Leerer Stack','compare.r1c2':'Niedrig','compare.r1c3':'Keine','compare.r1c4':'Nein',
    'compare.r2c2':'Maximum','compare.r2c3':'Pack-basiert & Composable','compare.r2c4':'Ja',
    'tech.kicker':'Technische Glaubwürdigkeit','tech.h2':'Meinungsstark, aber transparent.',
    'tech.copy':'LuAI scannt Manifeste, löst Module auf und generiert statische Dateien beim Build. Erweiterbar ohne Sichtverlust.',
    'docs.kicker':'Dokumentation','docs.h2':'Alles dokumentiert,<br>ohne das Repo zu durchforsten.',
    'docs.copy':'Die LuAI-Dokumentation liegt in GitBook: Produktüberblick, Architekturhinweise, Setup-Guides und Referenzen an einem Ort.',
    'docs.note':'Gehe direkt zum Dokumentations-Hub für Walkthroughs, Implementierungsdetails und Deployment-Anleitungen.','docs.cta':'Dokumentation öffnen',
    'flow.pack':'Deklariert Tools, Karten, Routen & MCP','flow.gen.name':'Code-Generierung','flow.gen.desc':'Scannt Manifeste, löst Module auf',
    'flow.app.name':'Laufende App','flow.app.desc':'Typsicher, null Runtime-Magie',
    'try.badge':'Open Source','try.h2':'Jetzt ausprobieren','try.sub':'Klone es, starte es und entscheide, ob das deine nächste KI-Grundlage ist.',
    'try.repo':'Repository öffnen','try.download':'Code herunterladen','try.step1':'Repo klonen','try.step3':'Pack veröffentlichen',
    'pwa.splash':'Desktop / Splash','pwa.android':'Android-Startbildschirm','pwa.apple':'Apple-Touch-Symbol','pwa.maskable':'Maskierbar (adaptiv)',
    'footer':'© 2026 LuAI','topnav.github':'GitHub →',
    'nav.hero':'Start','nav.why':'Problem','nav.cap':'Fähigkeiten','nav.compare':'Vergleich','nav.tech':'Architektur','nav.try':'Ausprobieren','nav.docs':'Docs',
  },
  zh: {
    'hero.kicker':'对话式 AI · 丰富 UI 组件',
    'hero.h1':'AI 对话<br>用界面回答<br>不只是文字。',
    'hero.summary':'LuAI 将 AI 对话转化为丰富的视觉体验。提出问题，获得组件——天气、报价、实时数据——直接在对话中呈现。',
    'hero.btn1':'技术架构','hero.btn2':'在线 Landing',
    'mockup.question':'波哥大现在天气怎么样？','mockup.cond':'多云',
    'mockup.answer':'这是波哥大的实时天气。','mockup.placeholder':'问我任何问题...',
    'chip.insurance':'⚡ 保险组件包','chip.weather':'🌤 天气组件包','chip.add':'＋ 添加组件包',
    'why.kicker':'为什么重要',
    'why.h2':'用户不想要大段文字。<br>他们想要能看得见的答案。',
    'why.copy':'从模型获取文本很容易。将回复转化为视觉化、结构化且可信赖的内容——这才是难点。',
    'bad.label':'纯文本 AI','bad.li1':'没人阅读的长篇回答','bad.li2':'数据埋没在段落中','bad.li3':'没有结构，没有视觉层次',
    'good.label':'LuAI 与 flow-packs','good.li1':'答案以 UI 组件形式呈现','good.li2':'结构化数据可视化展示','good.li3':'每个领域有专属卡片设计',
    'cap.kicker':'核心能力','cap.h2':'对话 + 组件，合二为一。',
    'cap.card1.h3':'流程包','cap.card1.p':'每个领域作为独立包发布，含专属工具、提示词和 UI 组件。无需修改核心即可添加新领域。',
    'cap.card2.h3':'构建时绑定','cap.card2.p':'包在编译时注册。无运行时发现，无隐藏魔法——显式、类型安全的集成。',
    'compare.kicker':'生态系统','compare.h2':'对比分析。',
    'compare.col1':'方案','compare.col2':'上市速度','compare.col3':'工作流架构','compare.col4':'基础层',
    'compare.r1c1':'空白技术栈','compare.r1c2':'低','compare.r1c3':'无','compare.r1c4':'否',
    'compare.r2c2':'最高','compare.r2c3':'包驱动 & 可组合','compare.r2c4':'是',
    'tech.kicker':'技术可信度','tech.h2':'有主见，但不隐藏。',
    'tech.copy':'LuAI 扫描清单、解析模块并在构建时生成静态挂载文件。可扩展且保持可见性。',
    'docs.kicker':'文档','docs.h2':'所有内容都有文档，<br>不用翻完整个仓库。',
    'docs.copy':'LuAI 文档放在 GitBook：产品概览、架构说明、安装指南和参考资料都集中在一个地方。',
    'docs.note':'直接进入文档中心，查看 walkthrough、实现细节和部署指南。','docs.cta':'打开文档',
    'flow.pack':'声明工具、卡片、路由和 MCP','flow.gen.name':'代码生成','flow.gen.desc':'扫描清单，解析模块',
    'flow.app.name':'运行中的应用','flow.app.desc':'类型安全，零运行时魔法',
    'try.badge':'开源','try.h2':'立即体验','try.sub':'克隆、运行，决定这是否是你的下一个 AI 基础框架。',
    'try.repo':'打开仓库','try.download':'下载代码','try.step1':'克隆仓库','try.step3':'发布你的包',
    'pwa.splash':'桌面 / 启动页','pwa.android':'安卓主屏幕','pwa.apple':'苹果触控图标','pwa.maskable':'可遮罩（自适应）',
    'footer':'© 2026 LuAI','topnav.github':'GitHub →',
    'nav.hero':'首页','nav.why':'问题','nav.cap':'能力','nav.compare':'对比','nav.tech':'架构','nav.try':'体验','nav.docs':'文档',
  },
  ja: {
    'hero.kicker':'会話型 AI · リッチ UI ウィジェット',
    'hero.h1':'見せる<br>チャット。<br>答えるだけでなく。',
    'hero.summary':'LuAI は AI との会話をリッチなビジュアル体験に変えます。質問すると、天気・見積もり・ライブデータなどのウィジェットがチャット内に表示されます。',
    'hero.btn1':'アーキテクチャ','hero.btn2':'ライブ Landing',
    'mockup.question':'ボゴタの天気は？','mockup.cond':'一部曇り',
    'mockup.answer':'ボゴタのリアルタイム天気です。','mockup.placeholder':'何でも聞いてください...',
    'chip.insurance':'⚡ 保険パック','chip.weather':'🌤 天気パック','chip.add':'＋ パック追加',
    'why.kicker':'なぜ重要か',
    'why.h2':'ユーザーはテキストの壁を望まない。<br>目で見える答えを求めている。',
    'why.copy':'モデルからテキストを取得するのは簡単です。そのレスポンスをビジュアルで構造化された信頼できるものに変えることが本当の課題です。',
    'bad.label':'テキストのみの AI','bad.li1':'誰も読まない長い回答','bad.li2':'段落に埋もれたデータ','bad.li3':'構造も視覚的階層もなし',
    'good.label':'LuAI with flow-packs','good.li1':'UI ウィジェットとして表示される回答','good.li2':'構造化データの視覚的表示','good.li3':'各ドメイン専用のカードデザイン',
    'cap.kicker':'機能','cap.h2':'チャット + ウィジェット、一体として。',
    'cap.card1.h3':'フローパック','cap.card1.p':'各ドメインは独自のツール・プロンプト・ウィジェットを持つ独立したパックとして提供されます。コアを変更せず新ドメインを追加できます。',
    'cap.card2.h3':'ビルド時の接続','cap.card2.p':'パックはコンパイル時に登録されます。ランタイムの魔法なし——明示的でタイプセーフな統合。',
    'compare.kicker':'エコシステム','compare.h2':'比較。',
    'compare.col1':'アプローチ','compare.col2':'市場投入速度','compare.col3':'アーキテクチャ','compare.col4':'基盤レイヤー',
    'compare.r1c1':'空のスタック','compare.r1c2':'低','compare.r1c3':'なし','compare.r1c4':'いいえ',
    'compare.r2c2':'最大','compare.r2c3':'パックベース & コンポーザブル','compare.r2c4':'はい',
    'tech.kicker':'技術的信頼性','tech.h2':'意見はあるが、隠しなし。',
    'tech.copy':'LuAI はマニフェストをスキャンし、モジュールを解決し、ビルド時に静的マウントファイルを生成します。可視性を失わずに拡張可能です。',
    'docs.kicker':'ドキュメント','docs.h2':'リポジトリを掘らなくても、<br>必要な情報が全部ある。',
    'docs.copy':'LuAI のドキュメントは GitBook にあります。プロダクト概要、アーキテクチャノート、セットアップガイド、リファレンスを一か所にまとめています。',
    'docs.note':'walkthrough、実装詳細、デプロイ手順を確認するにはドキュメントハブへ直接進んでください。','docs.cta':'ドキュメントを開く',
    'flow.pack':'ツール、カード、ルート、MCP を宣言','flow.gen.name':'コード生成','flow.gen.desc':'マニフェストをスキャン、モジュールを解決',
    'flow.app.name':'実行中のアプリ','flow.app.desc':'型安全、ランタイムマジックなし',
    'try.badge':'オープンソース','try.h2':'今すぐ試す','try.sub':'クローンして実行し、次の AI 基盤にするかを判断してください。',
    'try.repo':'リポジトリを開く','try.download':'コードをダウンロード','try.step1':'リポジトリをクローン','try.step3':'パックを公開',
    'pwa.splash':'デスクトップ / スプラッシュ','pwa.android':'Android ホーム画面','pwa.apple':'Apple タッチアイコン','pwa.maskable':'マスカブル（アダプティブ）',
    'footer':'© 2026 LuAI','topnav.github':'GitHub →',
    'nav.hero':'トップ','nav.why':'課題','nav.cap':'機能','nav.compare':'比較','nav.tech':'アーキテクチャ','nav.try':'試す','nav.docs':'Docs',
  },
  ar: {
    'hero.kicker':'ذكاء اصطناعي تحادثي · واجهات مرئية',
    'hero.h1':'دردشة<br>تُظهر،<br>لا تكتفي بالرد.',
    'hero.summary':'يحوّل LuAI المحادثات مع الذكاء الاصطناعي إلى تجارب بصرية غنية. اطرح سؤالاً واحصل على عنصر واجهة — طقس، عروض أسعار، بيانات مباشرة — مُعرَض داخل المحادثة.',
    'hero.btn1':'البنية التقنية','hero.btn2':'الهبوط المباشر',
    'mockup.question':'كيف الطقس في بوغوتا؟','mockup.cond':'غائم جزئياً',
    'mockup.answer':'إليك الطقس المباشر لمدينة بوغوتا.','mockup.placeholder':'اسألني أي شيء...',
    'chip.insurance':'⚡ حزمة التأمين','chip.weather':'🌤 حزمة الطقس','chip.add':'＋ إضافة حزمة',
    'why.kicker':'لماذا هذا مهم',
    'why.h2':'المستخدمون لا يريدون جدراناً من النص.<br>يريدون إجابات يمكنهم رؤيتها.',
    'why.copy':'الحصول على نص من نموذج أمر سهل. تحويل ذلك الرد إلى شيء مرئي ومنظم وموثوق — هذا هو التحدي الحقيقي.',
    'bad.label':'ذكاء اصطناعي نصي فقط','bad.li1':'ردود طويلة لا يقرأها أحد','bad.li2':'بيانات مدفونة في الفقرات','bad.li3':'لا بنية ولا تسلسل هرمي بصري',
    'good.label':'LuAI مع flow-packs','good.li1':'إجابات تُعرض كعناصر واجهة','good.li2':'بيانات منظمة تُعرض بصرياً','good.li3':'لكل مجال تصميم بطاقة خاص به',
    'cap.kicker':'الإمكانيات','cap.h2':'دردشة + واجهات، كيان واحد.',
    'cap.card1.h3':'حزم التدفق','cap.card1.p':'يُشحن كل مجال كحزمة معزولة بأدواتها الخاصة وعناصر واجهتها. أضف مجالات جديدة دون المساس بالنواة.',
    'cap.card2.h3':'التوصيل وقت البناء','cap.card2.p':'تُسجَّل الحزم في وقت الترجمة. لا اكتشاف في وقت التشغيل، لا سحر خفي — تكاملات صريحة وآمنة النوع.',
    'compare.kicker':'النظام البيئي','compare.h2':'كيف نقارن.',
    'compare.col1':'المسار','compare.col2':'سرعة الوصول للسوق','compare.col3':'بنية سير العمل','compare.col4':'الطبقة التأسيسية',
    'compare.r1c1':'مكدس فارغ','compare.r1c2':'منخفضة','compare.r1c3':'لا يوجد','compare.r1c4':'لا',
    'compare.r2c2':'أقصى قدر','compare.r2c3':'قائم على الحزم وقابل للتركيب','compare.r2c4':'نعم',
    'tech.kicker':'المصداقية التقنية','tech.h2':'رأي واضح، لكن بدون أسرار.',
    'tech.copy':'يفحص LuAI الملفات التعريفية ويحل الوحدات ويولّد ملفات تحميل ثابتة أثناء البناء. قابل للتوسيع دون فقدان الرؤية.',
    'docs.kicker':'التوثيق','docs.h2':'كل شيء موثّق،<br>من دون التنقيب داخل المستودع.',
    'docs.copy':'توثيق LuAI موجود في GitBook: نظرة عامة على المنتج، ملاحظات البنية، أدلة الإعداد، والمرجع الفني في مكان واحد.',
    'docs.note':'اذهب مباشرة إلى مركز التوثيق للاطلاع على الشروحات، تفاصيل التنفيذ، وإرشادات النشر.','docs.cta':'افتح التوثيق',
    'flow.pack':'يُعلن عن الأدوات والبطاقات والمسارات و MCP','flow.gen.name':'توليد الكود','flow.gen.desc':'يفحص الملفات التعريفية ويحل الوحدات',
    'flow.app.name':'التطبيق قيد التشغيل','flow.app.desc':'آمن النوع، لا سحر في وقت التشغيل',
    'try.badge':'مفتوح المصدر','try.h2':'جرّبه اليوم','try.sub':'استنسخه، شغّله، وقرر إذا كان أساسك التالي للذكاء الاصطناعي.',
    'try.repo':'فتح المستودع','try.download':'تحميل الكود','try.step1':'استنساخ المستودع','try.step3':'انشر حزمتك',
    'pwa.splash':'سطح المكتب / شاشة البداية','pwa.android':'شاشة البداية أندرويد','pwa.apple':'أيقونة Apple touch','pwa.maskable':'قابل للإخفاء (تكيفي)',
    'footer':'© 2026 LuAI','topnav.github':'GitHub →',
    'nav.hero':'الرئيسية','nav.why':'المشكلة','nav.cap':'الإمكانيات','nav.compare':'المقارنة','nav.tech':'البنية','nav.try':'جرّب','nav.docs':'التوثيق',
  },
};

const SECTION_KEYS = {
  hero: 'nav.hero',
  why: 'nav.why',
  capabilities: 'nav.cap',
  compare: 'nav.compare',
  technical: 'nav.tech',
  try: 'nav.try',
  docs: 'nav.docs',
};

let currentLang = localStorage.getItem('lang');
if (!T[currentLang]) {
  currentLang = 'en';
}

let currentSection = 'hero';

function setLanguage(lang) {
  if (!T[lang]) {
    lang = 'en';
  }

  currentLang = lang;
  localStorage.setItem('lang', lang);
  const dict = T[lang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) el.textContent = dict[key];
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    if (dict[key] !== undefined) el.innerHTML = dict[key];
  });
  document.querySelectorAll('[data-label-i18n]').forEach(el => {
    const key = el.getAttribute('data-label-i18n');
    if (dict[key] !== undefined) el.setAttribute('data-label', dict[key]);
  });
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.body.classList.toggle('lang-cjk', ['zh','ja'].includes(lang));
  document.body.classList.toggle('lang-ar', lang === 'ar');
  updateSectionState(currentSection);
}

function updateSectionState(sectionId) {
  if (!SECTION_KEYS[sectionId]) {
    sectionId = 'hero';
  }

  currentSection = sectionId;

  document.querySelectorAll('.floating-nav a.nav-dot').forEach(dot => {
    dot.classList.toggle('active', dot.getAttribute('href') === `#${sectionId}`);
  });

  const topNavSection = document.getElementById('top-nav-section');
  if (topNavSection) {
    topNavSection.textContent = T[currentLang]?.[SECTION_KEYS[sectionId]] || sectionId;
  }
}

function initTryMotionAccent() {
  const video = document.getElementById('try-motion-video');
  const label = document.getElementById('try-motion-label');
  if (!video || !label) {
    return;
  }

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const saveData = Boolean(connection?.saveData);
  const effectiveType = connection?.effectiveType || '';
  const downlink = Number(connection?.downlink || 10);
  const deviceMemory = Number(navigator.deviceMemory || 8);
  const shouldUseLiteVideo = saveData || (
    effectiveType === '3g' ||
    downlink < 4 ||
    deviceMemory < 4
  );
  const shouldDisableAutoplay = reducedMotion || ['slow-2g', '2g'].includes(effectiveType) || downlink < 0.8;

  const videoSuffix = shouldUseLiteVideo ? '_lite' : '';
  const clips = [
    {
      label: 'Clip 01',
      poster: './loader/loader_1_poster.jpg',
      src: `./loader/loader_1${videoSuffix}.mp4`,
    },
    {
      label: 'Clip 02',
      poster: './loader/loader_2_poster.jpg',
      src: `./loader/loader_2${videoSuffix}.mp4`,
    },
  ];
  const selectedClip = clips[Math.floor(Math.random() * clips.length)];

  label.textContent = selectedClip.label;
  video.poster = selectedClip.poster;

  if (shouldDisableAutoplay) {
    return;
  }

  video.src = selectedClip.src;
  video.load();
  video.play().catch(() => {});
}

document.addEventListener('DOMContentLoaded', () => {
    initTryMotionAccent();

    // Entry Animation Timeline
    const mainTimeline = anime.timeline({ easing: 'easeOutExpo' });

    mainTimeline
        .add({
            targets: '.hero .kicker',
            translateY: [20, 0],
            opacity: [0, 1],
            duration: 800
        })
        .add({
            targets: '.hero h1',
            translateY: [40, 0],
            opacity: [0, 1],
            duration: 1000
        }, '-=400')
        .add({
            targets: '.hero .summary',
            translateY: [20, 0],
            opacity: [0, 1],
            duration: 800
        }, '-=600')
        .add({
            targets: '.hero-actions .btn',
            scale: [0.9, 1],
            opacity: [0, 1],
            duration: 800,
            delay: anime.stagger(150)
        }, '-=400')
        .add({
            targets: '.hero-visual',
            translateX: [60, 0],
            opacity: [0, 1],
            duration: 1100
        }, '-=900')
        .add({
            targets: '.floating-chip',
            scale: [0.6, 1],
            opacity: [0, 1],
            delay: anime.stagger(120),
            duration: 600,
            easing: 'easeOutBack'
        }, '-=400');

    // Floating chips loop
    anime({
        targets: '.chip-1',
        translateY: [-6, 6],
        direction: 'alternate',
        loop: true,
        duration: 2400,
        easing: 'easeInOutSine'
    });
    anime({
        targets: '.chip-2',
        translateY: [5, -5],
        direction: 'alternate',
        loop: true,
        duration: 2800,
        easing: 'easeInOutSine'
    });
    anime({
        targets: '.chip-3',
        translateY: [-4, 4],
        direction: 'alternate',
        loop: true,
        duration: 3200,
        easing: 'easeInOutSine'
    });

    // Scroll Observer for Section Reveals
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const reveals = entry.target.querySelectorAll('.reveal');
                anime({
                    targets: reveals,
                    translateY: [50, 0],
                    opacity: [0, 1],
                    delay: anime.stagger(100),
                    duration: 1200,
                    easing: 'easeOutExpo'
                });

            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -100px 0px' });

    document.querySelectorAll('section, header').forEach(s => sectionObserver.observe(s));

    // Cursor glow
    const glow = document.querySelector('.cursor-glow');
    document.addEventListener('mousemove', (e) => {
        anime({
            targets: glow,
            left: e.clientX,
            top: e.clientY,
            duration: 900,
            easing: 'easeOutExpo'
        });
    });

    // Top nav — show after hero, update section + progress
    const topNav = document.getElementById('top-nav');
    const topNavProgress = document.getElementById('top-nav-progress');
    const fixedLangSwitcher = document.querySelector('.lang-switcher-fixed');
    const trackedSections = [...document.querySelectorAll('section[id], header[id]')]
        .filter(el => SECTION_KEYS[el.id]);

    function updateScrollState() {
        const scrolled = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? Math.min((scrolled / docHeight) * 100, 100) : 0;
        const heroHeight = document.getElementById('hero').offsetHeight;
        const topNavVisible = scrolled > heroHeight * 0.6;

        // Show/hide
        topNav.classList.toggle('visible', topNavVisible);
        fixedLangSwitcher?.classList.toggle('hidden', topNavVisible);

        // Progress bar
        topNavProgress.style.width = progress + '%';

        // Current section
        let current = 'hero';
        trackedSections.forEach(el => {
            if (scrolled >= el.offsetTop - 160) current = el.id;
        });
        updateSectionState(current);

        // Parallax
        anime({ targets: '.mesh-bg', translateY: scrolled * 0.2, duration: 0 });
    }

    window.addEventListener('scroll', updateScrollState);
    window.addEventListener('resize', updateScrollState);

    // Background Parallax (removed, merged above)

    // Magnetic Buttons
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            anime({ targets: btn, translateX: x * 0.45, translateY: y * 0.45, duration: 100, easing: 'easeOutQuad' });
        });
        btn.addEventListener('mouseleave', () => {
            anime({ targets: btn, translateX: 0, translateY: 0, duration: 600, easing: 'easeOutElastic(1, .5)' });
        });
    });

    // 3D card tilt
    document.querySelectorAll('.detail-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            anime({ targets: card, rotateX: -y * 12, rotateY: x * 12, duration: 150, easing: 'easeOutQuad' });
        });
        card.addEventListener('mouseleave', () => {
            anime({ targets: card, rotateX: 0, rotateY: 0, duration: 700, easing: 'easeOutElastic(1, .5)' });
        });
    });

    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const body = document.body;

    if (localStorage.getItem('theme') === 'light') {
        body.classList.add('light-theme');
        updateThemeIcon(true);
    }

    themeToggle.addEventListener('click', () => {
        const isLight = body.classList.toggle('light-theme');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        updateThemeIcon(isLight);
        anime({ targets: themeToggle, rotate: '+=180', duration: 600, easing: 'easeOutElastic(1, .8)' });
    });

    // Language switcher (both fixed and top-nav instances)
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setLanguage(btn.getAttribute('data-lang'));
        });
    });

    // Apply saved language
    setLanguage(currentLang);
    updateScrollState();

    function updateThemeIcon(isLight) {
        themeIcon.innerHTML = isLight
            ? '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>'
            : '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>';
    }

    // ── Hidden game: type "luai" to activate ──────────────────────────
    let secretBuffer = '';
    let gameLoopId = null;

    document.addEventListener('keydown', (e) => {
        if (document.getElementById('game-overlay').classList.contains('active')) return;
        secretBuffer += e.key.toLowerCase();
        if (secretBuffer.length > 4) secretBuffer = secretBuffer.slice(-4);
        if (secretBuffer === 'luai') { secretBuffer = ''; openGame(); }
    });

    function openGame() {
        document.getElementById('game-overlay').classList.add('active');
        startSpaceInvaders();
    }

    function closeGame() {
        document.getElementById('game-overlay').classList.remove('active');
        if (gameLoopId) { cancelAnimationFrame(gameLoopId); gameLoopId = null; }
    }

    function startSpaceInvaders() {
        const canvas = document.getElementById('game-canvas');
        const ctx = canvas.getContext('2d');
        const W = 600, H = 480;
        canvas.width = W; canvas.height = H;

        const LABELS = ['rushed_repo','no_types.js','leaked_domain','magic_runtime',
                        'rebuild_again','tangled_deps','no_registry','bad_arch.ts'];
        const ROWS = 4, COLS = 8;

        let score = 0, lives = 3, wave = 1, over = false;
        let bullets = [], eBullets = [], invaders = [];
        let iDir = 1, iStepTimer = 0, iInterval = 55;
        let lastShot = 0, frame = 0;

        const player = { x: W / 2, y: H - 45, w: 44, h: 22, spd: 5 };
        const keys = {};

        function makeInvaders() {
            invaders = [];
            for (let r = 0; r < ROWS; r++)
                for (let c = 0; c < COLS; c++)
                    invaders.push({ x: 44 + c * 66, y: 55 + r * 44, w: 58, h: 20,
                        alive: true, label: LABELS[(r * COLS + c) % LABELS.length], row: r });
        }
        makeInvaders();

        function reset() {
            score = 0; lives = 3; wave = 1; over = false;
            bullets = []; eBullets = []; iInterval = 55; iDir = 1; frame = 0;
            player.x = W / 2;
            makeInvaders();
            document.getElementById('g-score').textContent = '0';
            document.getElementById('g-wave').textContent = '1';
            document.getElementById('g-lives').textContent = '♥♥♥';
        }

        function flash(text, color) {
            const m = document.getElementById('game-message');
            m.textContent = text; m.style.color = color; m.style.opacity = '1';
            setTimeout(() => { m.style.opacity = '0'; }, 1600);
        }

        const onKey = (e) => {
            keys[e.code] = e.type === 'keydown';
            if (e.code === 'Space' && e.type === 'keydown') { e.preventDefault(); shoot(); }
            if (e.code === 'Escape' && e.type === 'keydown') { closeGame(); cleanup(); }
            if (e.code === 'KeyR' && e.type === 'keydown' && over) reset();
        };
        document.addEventListener('keydown', onKey);
        document.addEventListener('keyup', onKey);

        function cleanup() {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('keyup', onKey);
        }

        function shoot() {
            if (over) return;
            const now = Date.now();
            if (now - lastShot < 320) return;
            lastShot = now;
            bullets.push({ x: player.x, y: player.y - 12, spd: 10 });
        }

        function update() {
            if (over) return;
            frame++;
            if (keys['ArrowLeft']) player.x = Math.max(player.w / 2, player.x - player.spd);
            if (keys['ArrowRight']) player.x = Math.min(W - player.w / 2, player.x + player.spd);

            bullets = bullets.filter(b => { b.y -= b.spd; return b.y > -20; });
            eBullets = eBullets.filter(b => { b.y += b.spd; return b.y < H + 20; });

            // Invader march
            iStepTimer++;
            if (iStepTimer >= iInterval) {
                iStepTimer = 0;
                const alive = invaders.filter(i => i.alive);
                if (!alive.length) return;
                const minX = Math.min(...alive.map(i => i.x));
                const maxX = Math.max(...alive.map(i => i.x + i.w));
                let drop = false;
                if (iDir === 1 && maxX >= W - 10) { drop = true; iDir = -1; }
                if (iDir === -1 && minX <= 10) { drop = true; iDir = 1; }
                alive.forEach(i => { i.x += drop ? 0 : iDir * 18; if (drop) i.y += 18; });
            }

            // Enemy shoots
            if (frame % 55 === 0) {
                const alive = invaders.filter(i => i.alive);
                if (alive.length) {
                    const s = alive[Math.floor(Math.random() * alive.length)];
                    eBullets.push({ x: s.x + s.w / 2, y: s.y + s.h, spd: 4 });
                }
            }

            // Bullet ↔ invader
            bullets.forEach(b => {
                invaders.forEach(inv => {
                    if (!inv.alive) return;
                    if (b.x > inv.x && b.x < inv.x + inv.w && b.y > inv.y && b.y < inv.y + inv.h) {
                        inv.alive = false; b.y = -999;
                        score += (ROWS - inv.row) * 10;
                        document.getElementById('g-score').textContent = score;
                    }
                });
            });

            // Enemy bullet ↔ player
            eBullets.forEach(b => {
                if (Math.abs(b.x - player.x) < player.w / 2 && b.y > player.y - player.h && b.y < player.y + 5) {
                    b.y = H + 999; lives--;
                    document.getElementById('g-lives').textContent = '♥'.repeat(Math.max(lives, 0)) || '💀';
                    if (lives <= 0) { over = true; }
                }
            });

            // Invader reached bottom
            if (invaders.some(i => i.alive && i.y + i.h >= player.y - 10)) { over = true; }

            // Wave clear
            if (invaders.every(i => !i.alive)) {
                wave++; iInterval = Math.max(18, iInterval - 7);
                document.getElementById('g-wave').textContent = wave;
                makeInvaders();
                flash(`WAVE ${wave}`, '#00f2ff');
            }
        }

        function draw() {
            ctx.clearRect(0, 0, W, H);

            // Grid
            ctx.strokeStyle = 'rgba(255,255,255,0.025)';
            ctx.lineWidth = 1;
            for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
            for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

            // Ground
            ctx.strokeStyle = 'rgba(0,242,255,0.12)';
            ctx.beginPath(); ctx.moveTo(0, H - 22); ctx.lineTo(W, H - 22); ctx.stroke();

            // Player ship
            ctx.fillStyle = '#00f2ff';
            ctx.shadowBlur = 14; ctx.shadowColor = '#00f2ff';
            ctx.beginPath();
            ctx.moveTo(player.x, player.y - player.h);
            ctx.lineTo(player.x + player.w / 2, player.y);
            ctx.lineTo(player.x - player.w / 2, player.y);
            ctx.closePath(); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(0,242,255,0.45)';
            ctx.font = '8px IBM Plex Mono, monospace'; ctx.textAlign = 'center';
            ctx.fillText('LuAI.host', player.x, player.y + 13);

            // Player bullets
            bullets.forEach(b => {
                ctx.fillStyle = '#00f2ff'; ctx.shadowBlur = 8; ctx.shadowColor = '#00f2ff';
                ctx.fillRect(b.x - 2, b.y, 3, 12); ctx.shadowBlur = 0;
            });

            // Enemy bullets
            eBullets.forEach(b => {
                ctx.fillStyle = '#ff5f57'; ctx.shadowBlur = 6; ctx.shadowColor = '#ff5f57';
                ctx.fillRect(b.x - 2, b.y, 3, 10); ctx.shadowBlur = 0;
            });

            // Invaders
            invaders.forEach(inv => {
                if (!inv.alive) return;
                const colors = ['#a78bfa','#818cf8','#c084fc','#e879f9'];
                ctx.fillStyle = colors[inv.row % colors.length];
                ctx.shadowBlur = 5; ctx.shadowColor = colors[inv.row % colors.length];
                ctx.fillRect(inv.x, inv.y, inv.w, inv.h);
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#000';
                ctx.font = '7px IBM Plex Mono, monospace'; ctx.textAlign = 'center';
                ctx.fillText(inv.label, inv.x + inv.w / 2, inv.y + inv.h - 4);
            });

            // Game over
            if (over) {
                ctx.fillStyle = 'rgba(0,0,0,0.65)';
                ctx.fillRect(0, 0, W, H);
                ctx.fillStyle = '#ff5f57';
                ctx.font = 'bold 38px Outfit, sans-serif'; ctx.textAlign = 'center';
                ctx.shadowBlur = 20; ctx.shadowColor = '#ff5f57';
                ctx.fillText('GAME OVER', W / 2, H / 2 - 24);
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#64748b';
                ctx.font = '13px IBM Plex Mono, monospace';
                ctx.fillText(`score: ${score}  ·  wave: ${wave}  ·  press R to restart`, W / 2, H / 2 + 18);
            }
        }

        if (gameLoopId) cancelAnimationFrame(gameLoopId);
        function loop() { update(); draw(); gameLoopId = requestAnimationFrame(loop); }
        loop();
    }
    // ── End hidden game ───────────────────────────────────────────────

    // Build flow diagram animation
    let flowAnimated = false;
    new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !flowAnimated) {
                flowAnimated = true;
                const tl = anime.timeline({ easing: 'easeOutExpo' });
                tl.add({
                    targets: ['#fn-pack', '#fa-1'],
                    opacity: [0, 1],
                    translateX: [-20, 0],
                    duration: 600,
                    delay: anime.stagger(150)
                })
                .add({
                    targets: '#fn-gen',
                    opacity: [0, 1],
                    translateX: [-20, 0],
                    duration: 600
                }, '-=200')
                .add({
                    targets: ['#fa-2', '.flow-outputs'],
                    opacity: [0, 1],
                    translateX: [-10, 0],
                    duration: 500
                }, '-=200')
                .add({
                    targets: '.flow-output',
                    opacity: [0, 1],
                    translateX: [-12, 0],
                    delay: anime.stagger(120),
                    duration: 400
                }, '-=100')
                .add({
                    targets: ['#fa-3', '#fn-app'],
                    opacity: [0, 1],
                    translateX: [-20, 0],
                    duration: 600,
                    delay: anime.stagger(150)
                }, '-=100');
            }
        });
    }, { threshold: 0.3 }).observe(document.getElementById('technical'));

    // Typewriter for #try terminal
    const typedCmd = document.getElementById('typed-cmd');
    const command = 'git clone https://github.com/chibchombiano26/luai';
    let typed = false;

    new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !typed) {
                typed = true;
                let i = 0;
                const iv = setInterval(() => {
                    typedCmd.textContent += command[i++];
                    if (i >= command.length) clearInterval(iv);
                }, 38);
                anime({ targets: '.try-step', scale: [0.85, 1], opacity: [0, 1], delay: anime.stagger(150, { start: 600 }), duration: 700, easing: 'easeOutBack' });
                anime({ targets: '.try-step-arrow', translateX: [-10, 0], opacity: [0, 1], delay: anime.stagger(150, { start: 750 }), duration: 500, easing: 'easeOutExpo' });
            }
        });
    }, { threshold: 0.3 }).observe(document.getElementById('try'));
});
