/**
 * stackData.js
 * -------------------------------------------------------------
 * Канонічне джерело правди щодо технологічного стеку: групи + плоский перелік
 * + короткі описи (STACK_DESCRIPTIONS). Використовується для:
 *  - Формування системного промпта (buildSystemPrompt у main.js)
 *  - Візуального рендеру (stackRender.js)
 *  - Потенційних AI функцій (фільтрація, перевірка на валідність технологій).
 *
 * ДОПОМОЖНІ ФУНКЦІЇ:
 *  - flattenAuthorStack() → унікалізований плоский список.
 *  - stackAsMarkdown() → markdown-представлення (для логів / експорту).
 */

export const AUTHOR_STACK_CATEGORIES = {
  frontend: ['HTML','CSS','JavaScript','TypeScript','React'],
  backend: ['Node.js'],
  performance: ['Оптимізація білду','Кешування','Lighthouse аналіз'],
  ai: ['LLM інтеграції','Prompt design','Обробка контексту'],
  tooling: ['CI/CD','Git flow','Автоматизація'],
  learning: ['GraphQL production patterns','Edge / CDN оптимізація','Advanced Prompting']
};

// Short one‑line descriptions per technology / concept (UA).
// Keep them concise (~6‑14 words) for compact UI rendering.
export const STACK_DESCRIPTIONS = {
  // Frontend
  'HTML': 'Семантична розмітка й структурні патерни для доступності',
  'CSS': 'Адаптивні layout-и, performance-first, сучасні фічі (grid/flex)',
  'JavaScript': 'ESNext підхід, модульність, чиста архітектура клієнта',
  'TypeScript': 'Типобезпека, контрактний дизайн, зниження runtime багів',
  'React': 'Компонентна архітектура, hooks, оптимізація ререндерів',

  // Backend
  'Node.js': 'Легкі API, стріми, оптимізація cold start / build',

  // Performance
  'Оптимізація білду': 'Code splitting, мінімізація, tree-shaking стратегія',
  'Кешування': 'HTTP/Edge кеш шари для швидшого TTFB',
  'Lighthouse аналіз': 'Цільові метрики + actionable refactor чеклісти',

  // AI
  'LLM інтеграції': 'Інкапсуляція викликів, токен економія, fallback логіка',
  'Prompt design': 'Структуровані промпти, контроль тону та контексту',
  'Обробка контексту': 'Chunking, релевантність, динамічне вікно пам’яті',

  // Tooling
  'CI/CD': 'Автоматизація збірок, тестів та релізних артефактів',
  'Git flow': 'Упорядковані релізні гілки й релізні теги',
  'Автоматизація': 'Скрипти скорочують ручні кроки дев процесу',

  // Learning / Growth
  'GraphQL production patterns': 'Схеми, кешування, перформанс @scale',
  'Edge / CDN оптимізація': 'Зменшення latency через edge комп’ютинг',
  'Advanced Prompting': 'Рольові патерни, self-refine, валідація відповідей'
};

// Localized group display titles
export const GROUP_TITLES = {
  uk: {
    frontend: 'Фронтенд',
    backend: 'Бекенд',
    performance: 'Продуктивність',
    ai: 'AI',
    tooling: 'Інструменти',
    learning: 'Навчання'
  },
  en: {
    frontend: 'Frontend',
    backend: 'Backend',
    performance: 'Performance',
    ai: 'AI',
    tooling: 'Tooling',
    learning: 'Learning'
  }
};

// Localized item display titles (for items written in UA)
export const ITEM_TITLES = {
  uk: {
    'Оптимізація білду': 'Оптимізація білду',
    'Кешування': 'Кешування',
    'Lighthouse аналіз': 'Lighthouse аналіз',
    'LLM інтеграції': 'LLM інтеграції',
    'Обробка контексту': 'Обробка контексту',
    'Автоматизація': 'Автоматизація',
    'Edge / CDN оптимізація': 'Edge / CDN оптимізація'
  },
  en: {
    'Оптимізація білду': 'Build optimization',
    'Кешування': 'Caching',
    'Lighthouse аналіз': 'Lighthouse analysis',
    'LLM інтеграції': 'LLM integrations',
    'Обробка контексту': 'Context processing',
    'Автоматизація': 'Automation',
    'Edge / CDN оптимізація': 'Edge/CDN optimization'
  }
};

// Localized descriptions
export const STACK_DESCRIPTIONS_I18N = {
  uk: {
    'HTML': 'Семантична розмітка й структурні патерни для доступності',
    'CSS': 'Адаптивні layout-и, performance-first, сучасні фічі (grid/flex)',
    'JavaScript': 'ESNext підхід, модульність, чиста архітектура клієнта',
    'TypeScript': 'Типобезпека, контрактний дизайн, зниження runtime багів',
    'React': 'Компонентна архітектура, hooks, оптимізація ререндерів',
    'Node.js': 'Легкі API, стріми, оптимізація cold start / build',
    'Оптимізація білду': 'Code splitting, мінімізація, tree-shaking стратегія',
    'Кешування': 'HTTP/Edge кеш шари для швидшого TTFB',
    'Lighthouse аналіз': 'Цільові метрики + actionable refactor чеклісти',
    'LLM інтеграції': 'Інкапсуляція викликів, токен економія, fallback логіка',
    'Prompt design': 'Структуровані промпти, контроль тону та контексту',
    'Обробка контексту': 'Chunking, релевантність, динамічне вікно пам’яті',
    'CI/CD': 'Автоматизація збірок, тестів та релізних артефактів',
    'Git flow': 'Упорядковані релізні гілки й релізні теги',
    'Автоматизація': 'Скрипти скорочують ручні кроки дев процесу',
    'GraphQL production patterns': 'Схеми, кешування, перформанс @scale',
    'Edge / CDN оптимізація': 'Зменшення latency через edge комп’ютинг',
    'Advanced Prompting': 'Рольові патерни, self-refine, валідація відповідей'
  },
  en: {
    'HTML': 'Semantic markup and structure for accessibility',
    'CSS': 'Responsive layouts, performance-first, modern features (grid/flex)',
    'JavaScript': 'ESNext approach, modularity, clean client architecture',
    'TypeScript': 'Type safety, contract-driven design, fewer runtime bugs',
    'React': 'Component architecture, hooks, render optimization',
    'Node.js': 'Lightweight APIs, streams, cold-start/build optimization',
    'Оптимізація білду': 'Code splitting, minification, tree-shaking strategy',
    'Кешування': 'HTTP/Edge cache layers for faster TTFB',
    'Lighthouse аналіз': 'Targeted metrics + actionable refactor checklists',
    'LLM інтеграції': 'Call encapsulation, token efficiency, fallback logic',
    'Prompt design': 'Structured prompts, tone and context control',
    'Обробка контексту': 'Chunking, relevance, dynamic memory window',
    'CI/CD': 'Automated builds, tests and release artifacts',
    'Git flow': 'Structured release branches and tags',
    'Автоматизація': 'Scripts reduce manual dev steps',
    'GraphQL production patterns': 'Schemas, caching, performance at scale',
    'Edge / CDN оптимізація': 'Lower latency via edge computing',
    'Advanced Prompting': 'Role patterns, self-refine, answer validation'
  }
};

export function flattenAuthorStack() {
  return [...new Set(Object.values(AUTHOR_STACK_CATEGORIES).flat())];
}

// Helper to form markdown summary
export function stackAsMarkdown() {
  return Object.entries(AUTHOR_STACK_CATEGORIES)
    .map(([k, arr]) => `**${k}**: ${arr.join(', ')}`)
    .join('\n');
}
