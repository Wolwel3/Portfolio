/**
 * aiModules.js
 * -------------------------------------------------------------
 * Віджет модульних карток ("модули AI") для категоризації текстових фрагментів
 * відповіді моделі: резюме, кроки, код, ідеї, стек тощо.
 *
 * ЯК ПРАЦЮЄ:
 *  - initAIModules() створює контейнер та попередньо генерує картки (окрім hidden).
 *  - classifyAnswer(text) — евристика за ключовими словами.
 *  - pushModuleContent(cat, rawText) — додає відформатований блок у відповідний модуль.
 *  - showStackModule()/hideStackModule() — спеціальний модуль для стеку.
 *
 * НЕЗАЛЕЖНІСТЬ:
 *  - Не залежить від зовнішнього стейт-менеджера; внутрішня мапа itemsMap.
 *  - Немає важких залежностей; можна lazily підключати.
 *
 * МОЖЛИВІ ПОКРАЩЕННЯ:
 *  - Сортування модулів за частотою.
 *  - Кнопка "export" (copy all).
 *  - Підтримка markdown списків і заголовків глибше (зараз дуже легкий парсер).
 */

const MODULE_DEFS = [
  { id: 'summary', title: 'Резюме', theme: 'emerald', kw: ['summary','підсум','резюме','overall'] },
  { id: 'stack', title: 'Технології', theme: 'teal', kw: ['stack','технолог','tech','framework','library'], hidden: true }, // hidden by default; shown only via function call
  { id: 'idea', title: 'Ідеї', theme: 'indigo', kw: ['idea','іде','improve','покращ','suggest'] },
  { id: 'steps', title: 'Кроки', theme: 'amber', kw: ['steps','крок','plan','план','todo'] },
  { id: 'code', title: 'Код', theme: 'violet', kw: ['code','snippet','фрагмент','function','class','код'] },
  { id: 'explain', title: 'Пояснення', theme: 'sky', kw: ['explain','поясн','explanation','describe'] },
  { id: 'warn', title: 'Застереження', theme: 'rose', kw: ['warning','увага','обереж','risk','ризик','limit'] },
];

let root, grid;
const itemsMap = new Map();

export function initAIModules({ mountSelector = '#ai-hub .panel--primary .panel__body', insertBefore = null } = {}) {
  if (root) return;
  const mount = document.querySelector(mountSelector) || document.body;
  root = document.createElement('div');
  root.className = 'ai-modules';
  grid = document.createElement('div');
  grid.className = 'ai-modules__grid';
  root.appendChild(grid);
  if (insertBefore) {
    mount.insertBefore(root, insertBefore);
  } else {
    mount.appendChild(root);
  }
  // Pre-create all EXCEPT hidden ones (stack will be lazy)
  MODULE_DEFS.filter(d=>!d.hidden).forEach(def => ensureModuleContainer(def.id, def));
}

function ensureModuleContainer(id, def) {
  if (itemsMap.has(id)) return itemsMap.get(id);
  const card = document.createElement('section');
  card.className = `ai-module-card theme-${def.theme}`;
  card.dataset.module = id;
  card.innerHTML = `<header class="ai-module-card__head"><h4 class="ai-module-card__title">${def.title}</h4><button type="button" data-clear-module title="Очистити" aria-label="Очистити">✕</button></header><div class="ai-module-card__body" data-body></div>`;
  card.addEventListener('click', e => {
    if (e.target.matches('[data-clear-module]')) {
      card.querySelector('[data-body]').innerHTML = '';
    }
  });
  grid.appendChild(card);
  if (def.hidden) {
    card.style.display = 'none';
  }
  itemsMap.set(id, card);
  return card;
}

export function classifyAnswer(text) {
  const lower = text.toLowerCase();
  for (const def of MODULE_DEFS) {
    if (def.kw.some(k => lower.includes(k))) return def.id;
  }
  // fallback choose by simple heuristics: code fence detection
  if (/```|function|const\s+\w+\s*=/.test(text)) return 'code';
  if (/^\s*(1\.|-\s)/m.test(text)) return 'steps';
  return 'explain';
}

export function pushModuleContent(category, rawText) {
  const def = MODULE_DEFS.find(d => d.id === category) || MODULE_DEFS.find(d => d.id === 'explain');
  if (def.hidden && def.id === 'stack') {
    console.warn('[aiModules] stack module is hidden; use showStackModule()');
    return null;
  }
  const card = ensureModuleContainer(def.id, def);
  const body = card.querySelector('[data-body]');
  const block = document.createElement('article');
  block.className = 'ai-chunk';
  block.innerHTML = renderMarkdownLite(rawText);
  body.appendChild(block);
  body.scrollTop = body.scrollHeight;
  return block;
}

// Very small markdown-ish renderer for bold, code, lists.
function renderMarkdownLite(src) {
  let h = src
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/`([^`]+)`/g,'<code>$1</code>');
  // lists
  if (/^\s*[-*] /m.test(h)) {
    h = h.replace(/^(?:[-*]) (.+)$/gm,'<li>$1</li>');
    h = h.replace(/(<li>.+<\/li>)/gs,'<ul>$1</ul>');
  }
  if (/^\s*\d+\. /m.test(h)) {
    h = h.replace(/^\d+\. (.+)$/gm,'<li>$1</li>');
    h = h.replace(/(<li>.+<\/li>)/gs,'<ol>$1</ol>');
  }
  return h.split(/\n{2,}/).map(p => `<p>${p}</p>`).join('');
}

// Explicit function to reveal & populate stack module (for function calling)
export function showStackModule({ authorName = 'Автор', technologies = [] } = {}) {
  const def = MODULE_DEFS.find(d=>d.id==='stack');
  const card = ensureModuleContainer('stack', def);
  card.style.display = '';
  // Add a new chunk
  const body = card.querySelector('[data-body]');
  const block = document.createElement('article');
  block.className = 'ai-chunk';
  const list = (technologies && technologies.length ? technologies : ['JavaScript','HTML','CSS']).map(t=>`- ${t}`).join('\n');
  const md = `**Стек автора:** ${authorName}\n\n${list}`;
  block.innerHTML = renderMarkdownLite(md);
  body.appendChild(block);
  body.scrollTop = body.scrollHeight;
  return { shown: true, count: body.children.length };
}

export function hideStackModule() {
  const card = itemsMap.get('stack');
  if (card) card.style.display = 'none';
}
