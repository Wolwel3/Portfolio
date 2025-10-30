/**
 * projectsData.js
 * -------------------------------------------------------------
 * Джерело (in-memory) даних проектів. У реальному застосунку може
 * бути замінено на fetch до API / CMS. Поточний формат зручний для
 * швидкого прототипування й фільтрації на клієнті.
 *
 * ЩО ЗБЕРІГАЄ:
 *  - Масив PROJECTS з уніфікованими полями (див. typedef Project).
 *  - findProjects(filter) — простий пошук по title / tags / tech / short.
 *  - quickAddProject() — lightweight додавання мінімальної карточки (для команда /addproj).
 *
 * МОЖЛИВІ ПОКРАЩЕННЯ:
 *  - Валідація схеми (zod / ajv) перед пушем.
 *  - Сортування за priority / останнім оновленням.
 *  - Стани завантаження / помилки при переході на реальне API.
 */

/**
 * @typedef {Object} Project
 * @property {string} id Unique slug
 * @property {string} title Display title
 * @property {string} short Short 1–2 line description
 * @property {string} [long] Extended multi-paragraph description (optional)
 * @property {number|string} year Year or year range
 * @property {string} role Primary role (e.g. 'Front-end', 'Full-stack')
 * @property {string[]} tech Technologies (subset of canonical stack)
 * @property {string} [thumb] Image path or placeholder
 * @property {{ repo?: string, live?: string, demo?: string }} [links]
 * @property {string} [problem]
 * @property {string[]|string} [approach]
 * @property {string[]|string} [results]
 * @property {string[]} [highlights]
 * @property {string[]} [challenges]
 * @property {string} [status] 'active' | 'archived' | 'concept'
 * @property {string[]} [tags]
 * @property {number} [priority]
 */

/** @type {Project[]} */
export const PROJECTS = [
  {
    id: 'tea-site',
    title: 'Tea Landing',
    short: { uk: 'Простий лендинг про різні сорти чаю.', en: 'Simple landing page about different types of tea.' },
    year: 2025,
    role: 'Front-end',
    tech: ['HTML','CSS','JavaScript'],
    status: 'concept',
    tags: ['landing','content'],
    thumb: 'public/projectImg/Tealux.png',
    links: { live: 'https://storied-squirrel-72686a.netlify.app/' }
  }
  ,{
    id: 'iphone-landing',
    title: 'iPhone Product Page',
    short: { uk: 'Вітрина з ключовими фічами та секцією порівняння.', en: 'Showcase with key features and a comparison section.' },
    year: 2025,
    role: 'Front-end',
    tech: ['HTML','CSS','JavaScript'],
    status: 'concept',
    tags: ['landing','device'],
    thumb: 'public/projectImg/Iphone.png',
    links: { live: 'https://silver-narwhal-2a7963.netlify.app/' }
  }
  ,{
    id: 'restart-ukraine',
    title: 'Re:Start Ukraine',
    short: { uk: 'Інформаційно-освітня платформа для відновлення та розвитку України.', en: 'An informational and educational platform for Ukraine’s recovery and development.' },
    year: 2025,
    role: 'Front-end',
    tech: ['HTML','CSS','JavaScript'],
    status: 'concept',
    tags: ['civic','education','landing'],
    thumb: 'public/projectImg/ReStart.png',
    links: { live: 'https://restartukraine.netlify.app/' }
  }
  ,{
    id: 'vintopia',
    title: 'Vintopia',
    short: { uk: 'Сторінка про винний досвід / дегустації (концепт).', en: 'A page about wine experiences/tastings (concept).' },
    year: 2025,
    role: 'Front-end',
    tech: ['HTML','CSS','JavaScript'],
    status: 'concept',
    tags: ['landing','lifestyle'],
    thumb: 'public/projectImg/Vintopia.png',
    links: { live: 'https://kaleidoscopic-dodol-ba7aa.netlify.app/' }
  }
];

export function findProjects(filter) {
  if (!filter) return PROJECTS;
  const f = String(filter).toLowerCase();
  return PROJECTS.filter(p => {
    const inTech = p.tech.some(t => String(t).toLowerCase().includes(f));
    const inTags = (p.tags && p.tags.some(tag => String(tag).toLowerCase().includes(f))) || false;
    const inTitle = String(p.title).toLowerCase().includes(f);
    let inShort = false;
    if (typeof p.short === 'string') {
      inShort = p.short.toLowerCase().includes(f);
    } else if (p.short && (p.short.uk || p.short.en)) {
      const uk = String(p.short.uk || '').toLowerCase();
      const en = String(p.short.en || '').toLowerCase();
      inShort = uk.includes(f) || en.includes(f);
    }
    return inTech || inTags || inTitle || inShort;
  });
}

// Quick add helper for runtime prototyping
export function quickAddProject({ id, title, short, tech }) {
  if (!id || !title) return false;
  if (PROJECTS.find(p=>p.id===id)) return false;
  const shortObj = typeof short === 'string' ? { uk: short, en: short } : (short || { uk: '', en: '' });
  PROJECTS.push({ id, title, short: shortObj, year: new Date().getFullYear(), role: 'Front-end', tech: (tech&&tech.length)? tech : ['HTML','CSS','JavaScript'], status: 'concept' });
  return true;
}
