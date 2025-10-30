/**
 * core/i18n.js
 * -------------------------------------------------------------
 * Легка клієнтська i18n (UA/EN): словники, застосування через [data-i18n],
 * перемикач мови з localStorage, відображення міток у різних секціях.
 */

const LANG_KEY = 'site-lang';
let current = null;

const STR = {
  uk: {
    // Meta / Head
    meta_title: 'Артем Подоба • Front-end Developer',
    meta_description: 'Портфоліо Артема Подоби — Front-end Developer з Вінниці. Інтерфейси, продуктивність, інтеграція AI.',

    // Header / Navigation
    skip_to_content: 'Пропустити до контенту',
    brand_name: 'Артем Подоба',
    brand_aria: "Лого / Ім'я",
    main_nav_aria: 'Головна навігація',
    nav_about: 'Про мене',
    nav_stack: 'Стек',
    nav_projects: 'Проекти',
    nav_contact: 'Контакт',
    theme_label: 'Тема',
    theme_tip: 'Тема',
    theme_toggle_aria: 'Перемкнути тему',
    theme_toggle_title: 'Перемкнути між темною та світлою темою',

    // Hero
    hero_title_pre: 'Привіт, я',
    hero_name: 'Артем',
    hero_subtitle: 'Front-end Developer з Вінниці. Працюю над швидкими інтерфейсами, продуктивністю та інтеграцією AI у робочі процеси.',
    hero_cta_projects: 'Переглянути проекти',
  hero_cta_contact: `Зв'язатися`,
  hero_note: `У нижньому доку працює AI Console: пиши команди на кшталт /help, /stack, /projects react або просто питання. Модель може відкривати панелі, вмикати світлу тему, показувати контактну форму й опис сайту через спеціальні маркери.`,

    // AI Dock
    dock_title: 'AI Console',
    dock_hint: 'prototype',

    // AI Hub
    aihub_title: 'AI Interaction Hub',
  aihub_tagline: `Центр керування. Тут AI відображає дії, контекст, стек, фільтри проєктів і журнал. Усе пов'язано з командами у чаті.`,
    panel_live: 'Живий Вивід',
    panel_commands: 'Команди',
    panel_log: 'Журнал',
    panel_stack: 'Стек',

    // Sections
    sec_about: 'Про мене',
    sec_stack: 'Стек',
    sec_projects: 'Проекти',
    sec_contact: 'Контакт',

    // Composer
    composer_placeholder: 'Введи команду або текст… (/help)',
    composer_hint: 'Enter — надіслати • Shift+Enter — новий рядок • / — команди',
    composer_send: 'Надіслати',

    // Stats
    stat_commands: 'Команд',
    stat_sessions: 'Сесій',
    stat_ideas: 'Ідей',

    // Dock collapse
    dock_collapse_hint: 'Згорнути',

    // Info blocks titles
    ib_about: 'Про мене',
    ib_skills: 'Скіли',
    ib_principles: 'Принципи',
    ib_highlights: 'Хайлайти',
    ib_contact: 'Контакт',

    // Info blocks content
    ib_about_p1: 'Я — Артем Подоба, Front-end Developer з Вінниці. Прагну поєднати чисту архітектуру, зрозумілий UI та практичні AI-інструменти для прискорення розробки.',
    ib_about_role1: 'Front-end',
    ib_about_role2: 'AI інтеграції',
    ib_about_role3: 'UX орієнтація',
    ib_skills_ui: 'UI: Атомарні системи дизайну, адаптивність',
    ib_skills_code: 'Code: Компонентна архітектура, продуктивність',
    ib_skills_ai: 'AI: LLM prompts, інтеграція API, обробка контексту',
    ib_skills_ops: 'Ops: CI/CD, оптимізація білду',
    ib_princ1: 'Чистота інтерфейсу → швидше сприйняття',
    ib_princ2: 'AI як помічник, а не магія',
    ib_princ3: 'Маленькі ітерації, ранній фідбек',
    ib_princ4: 'Прозорість та вимірність змін',
    ib_high1_label: 'Оптимізація збірки',
    ib_high2_label: 'Час завантаження',
    ib_high3_label: 'Ідей інтеграції AI',
    ib_contact_p1: 'Найшвидше — email або GitHub. Команда в чаті: /contact',

  // Contact form (dynamic block)
  contact_form_title: "Зв'язок / Форма",
  collapse_section: 'Згорнути секцію',
  cf_label_name: "Ім'я",
  cf_placeholder_name: "Твоє ім'я",
  cf_label_email: 'Email',
  cf_placeholder_email: 'you@example.com',
  cf_label_message: 'Повідомлення',
  cf_placeholder_message: 'Коротко опиши запит…',
  cf_submit: 'Надіслати',
  cf_or_email: 'Або напиши напряму:',
  cf_err_invalid_email: 'Вкажи коректний email',
  cf_err_empty_message: 'Повідомлення порожнє',
  cf_opening_mail: 'Відкриваю поштовий клієнт…',
  cf_prepared_prefix: 'Форму підготовлено. Якщо пошта не відкрилась — напиши на',

    // Sections leads
    stack_lead: 'Фокус: фронт + AI складова (стисло нижче).',
    projects_lead: 'Фільтрація вже працює: скористайся командою /projects react або введи тег/технологію — список оновиться миттєво.',
    contact_lead: 'Форма зв\'язку вже доступна: попроси в чаті «контактна форма» або скористайся командою /form show. Або обери з каналів нижче.',
    contacts_updated: 'Контакти оновлено з профілю.',

    // Commands panel labels
    cmd_help: 'усі команди',
    cmd_stack: 'показати стек',
    cmd_projects: 'фільтр проектів',
    cmd_contact: 'контакти',
    cmd_ai: 'LLM запит',
    cmd_clear: 'очистити чат',

    // Event log
    log_init: 'Ініціалізація AI Hub',
    log_wait: 'Очікування користувача…',

    // Footer
    rights_reserved: 'Всі права захищено.'
    ,
  // Site Profile block & modal
  ib_site_profile: 'Про сайт',
  sp_label_what: 'Що',
  sp_label_how: 'Як',
  sp_label_why: 'Навіщо',
  sp_modal_title: 'Про цей сайт',
  sp_close: 'Закрити',
  sp_generated: 'Згенеровано:',
  sp_updated: 'Оновлено:',
  sp_footer_ok: 'Зрозуміло',
  sp_opened_msg: 'Інформацію про сайт відкрито у модальному вікні.'
  ,
  // About section (detailed)
  about_pro_lead: 'Фронтенд-інженер з акцентом на продуктивність, надійність та відтворювані процеси. Працюю на перетині UI, інженерної дисципліни та практичного застосування AI для скорочення циклу від ідеї до релізу.',
  about_pro_lead_sub: 'Моя мета — створювати інтерфейси, які швидко завантажуються, точно відображають бізнес-логіку і легко розширюються без хаосу. Кожна зміна повинна бути вимірюваною.',
  ap_principles_title: 'Принципи',
  ap_pillars_1_title: 'Продуктове мислення',
  ap_pillars_1_desc: 'Рішення виправдані впливом, а не модою',
  ap_pillars_2_title: 'Структура > імпровізація',
  ap_pillars_2_desc: 'Компонентні контракти та контроль складності',
  ap_pillars_3_title: 'Продуктивність як фічa',
  ap_pillars_3_desc: 'Метрики у pipeline: build, LCP, bundle diff',
  ap_pillars_4_title: 'AI як прискорювач',
  ap_pillars_4_desc: 'Генерація чернеток, аналіз дифів, не “магія”',
  ap_pillars_5_title: 'Прозорість процесу',
  ap_pillars_5_desc: 'Документування змін та причин',
  ap_focus_title: 'Фокус',
  ap_values_title: 'Цінності',
  ap_metrics_title: 'Метрики',
  ap_values_1: 'Чистота бази коду',
  ap_values_2: 'Передбачуваність релізів',
  ap_values_3: 'Аналітика рішень',
  ap_values_4: 'Навчання без пауз',
  ap_metrics_1_label: 'час білду (оптимізація пайплайну)',
  ap_metrics_2_label: 'initial load (code-splitting + кеш)',
  ap_metrics_3_label: 'швидкість прототипування (UI kit)',

  // Theme toggle next-state labels
  toggle_to_dark: 'Увімкнути темну тему',
  toggle_to_light: 'Увімкнути світлу тему',

    // Dynamic/system messages
    theme_light: 'Світла тема',
    theme_dark: 'Темна тема',
    theme_activated: 'активована',
    theme_saved: 'Збережено в браузері.',
    msg_action_done: 'Дію виконано.',
    err_error: 'Помилка',
    err_set_key_hint: 'Встанови ключ командою /setkey <ключ>. Довгі відповіді: /ai-long',
  err_no_api_key: 'Немає API ключа. Використай /setkey <ключ> або window.__AI_KEY = "sk-..."',
    ex_ai_hooks: 'Приклад: /ai поясни що таке React hooks',
    ex_ai_long: 'Приклад: /ai-long детальний конспект про WebSockets',
    ex_gemini: 'Приклад: /gemini Поясни що таке інтерпретатор',
    form_hidden: 'Форму приховано.',
    form_toggled: 'Форму перемкнено.',
    form_opened: 'Форму відкрито у блоці AI Hub.',
    sending: 'Відправка…',
    ready: 'Готово.',
    unknown_command: 'Невідома команда',
    try_help: 'Спробуй /help',
    cmd_error: 'Помилка виконання команди.',
    profile_not_loaded: 'Профіль ще не завантажено.'
  },
  en: {
    // Meta / Head
    meta_title: 'Artem Podoba • Front-end Developer',
    meta_description: 'Portfolio of Artem Podoba — Front-end Developer from Vinnytsia. Interfaces, performance, practical AI integration.',

    // Header / Navigation
    skip_to_content: 'Skip to content',
    brand_name: 'Artem Podoba',
    brand_aria: 'Logo / Name',
    main_nav_aria: 'Primary navigation',
    nav_about: 'About',
    nav_stack: 'Stack',
    nav_projects: 'Projects',
    nav_contact: 'Contact',
    theme_label: 'Theme',
    theme_tip: 'Theme',
    theme_toggle_aria: 'Toggle theme',
    theme_toggle_title: 'Toggle between dark and light theme',

    // Hero
    hero_title_pre: 'Hi, I am',
    hero_name: 'Artem',
    hero_subtitle: 'Front-end Developer from Vinnytsia. I build fast interfaces, care about performance, and integrate AI into workflows.',
    hero_cta_projects: 'View projects',
    hero_cta_contact: 'Contact me',
    hero_note: 'Bottom dock runs an AI Console: try /help, /stack, /projects react or ask a question. The model can open panels, switch theme, and show the contact form using markers.',

    // AI Dock
    dock_title: 'AI Console',
    dock_hint: 'prototype',

    // AI Hub
    aihub_title: 'AI Interaction Hub',
    aihub_tagline: 'Control center. AI reflects actions, context, stack, projects filters and a log. All wired to chat commands.',
    panel_live: 'Live Output',
    panel_commands: 'Commands',
    panel_log: 'Log',
    panel_stack: 'Stack',

    // Sections
    sec_about: 'About',
    sec_stack: 'Stack',
    sec_projects: 'Projects',
    sec_contact: 'Contact',

    // Composer
    composer_placeholder: 'Type a command or message… (/help)',
    composer_hint: 'Enter — send • Shift+Enter — new line • / — commands',
    composer_send: 'Send',

    // Stats
    stat_commands: 'Commands',
    stat_sessions: 'Sessions',
    stat_ideas: 'Ideas',

    // Dock collapse
    dock_collapse_hint: 'Collapse',

    // Info blocks titles
    ib_about: 'About',
    ib_skills: 'Skills',
    ib_principles: 'Principles',
    ib_highlights: 'Highlights',
    ib_contact: 'Contact',

    // Info blocks content
    ib_about_p1: 'I\'m Artem Podoba, a Front-end Developer from Vinnytsia. I combine clean architecture, clear UI, and practical AI tools to speed up development.',
    ib_about_role1: 'Front-end',
    ib_about_role2: 'AI integrations',
    ib_about_role3: 'UX focus',
    ib_skills_ui: 'UI: Atomic design systems, responsive',
    ib_skills_code: 'Code: Component architecture, performance',
    ib_skills_ai: 'AI: LLM prompts, API integration, context handling',
    ib_skills_ops: 'Ops: CI/CD, build optimization',
    ib_princ1: 'Clear interface → faster perception',
    ib_princ2: 'AI as an assistant, not magic',
    ib_princ3: 'Small iterations, early feedback',
    ib_princ4: 'Transparency and measurable change',
    ib_high1_label: 'Build optimization',
    ib_high2_label: 'Load time',
    ib_high3_label: 'AI integration ideas',
    ib_contact_p1: 'Fastest — email or GitHub. Chat command: /contact',

  // Contact form (dynamic block)
  contact_form_title: 'Contact / Form',
  collapse_section: 'Collapse section',
  cf_label_name: 'Name',
  cf_placeholder_name: 'Your name',
  cf_label_email: 'Email',
  cf_placeholder_email: 'you@example.com',
  cf_label_message: 'Message',
  cf_placeholder_message: 'Briefly describe your request…',
  cf_submit: 'Send',
  cf_or_email: 'Or write directly:',
  cf_err_invalid_email: 'Enter a valid email',
  cf_err_empty_message: 'Message is empty',
  cf_opening_mail: 'Opening mail client…',
  cf_prepared_prefix: 'Form prepared. If mail didn’t open — write to',

    // Sections leads
    stack_lead: 'Focus: front-end + AI (brief below).',
    projects_lead: 'Filtering works: try /projects react or type a tag/tech — the list updates instantly.',
    contact_lead: 'Contact form is available: ask in chat “contact form” or run /form show. Or choose a channel below.',
    contacts_updated: 'Contacts updated from profile.',

    // Commands panel labels
    cmd_help: 'all commands',
    cmd_stack: 'show stack',
    cmd_projects: 'projects filter',
    cmd_contact: 'contacts',
    cmd_ai: 'LLM query',
    cmd_clear: 'clear chat',

    // Event log
    log_init: 'AI Hub initialized',
    log_wait: 'Waiting for user…',

    // Footer
    rights_reserved: 'All rights reserved.'
    ,
  // Site Profile block & modal
  ib_site_profile: 'Site Profile',
  sp_label_what: 'What',
  sp_label_how: 'How',
  sp_label_why: 'Why',
  sp_modal_title: 'About this site',
  sp_close: 'Close',
  sp_generated: 'Generated:',
  sp_updated: 'Updated:',
  sp_footer_ok: 'Got it',
  sp_opened_msg: 'Site information opened in a modal window.'
  ,
  // About section (detailed)
  about_pro_lead: 'Front-end engineer focused on performance, reliability and repeatable processes. I work at the intersection of UI, engineering discipline and practical AI to shorten the idea-to-release cycle.',
  about_pro_lead_sub: 'My goal is to build interfaces that load fast, reflect business logic precisely, and scale without chaos. Every change must be measurable.',
  ap_principles_title: 'Principles',
  ap_pillars_1_title: 'Product thinking',
  ap_pillars_1_desc: 'Decisions justified by impact, not fashion',
  ap_pillars_2_title: 'Structure > improvisation',
  ap_pillars_2_desc: 'Component contracts and complexity control',
  ap_pillars_3_title: 'Performance as a feature',
  ap_pillars_3_desc: 'Metrics in the pipeline: build, LCP, bundle diff',
  ap_pillars_4_title: 'AI as an accelerator',
  ap_pillars_4_desc: 'Draft generation, diff analysis, not “magic”',
  ap_pillars_5_title: 'Process transparency',
  ap_pillars_5_desc: 'Documenting changes and reasons',
  ap_focus_title: 'Focus',
  ap_values_title: 'Values',
  ap_metrics_title: 'Metrics',
  ap_values_1: 'Clean codebase',
  ap_values_2: 'Predictable releases',
  ap_values_3: 'Decision analytics',
  ap_values_4: 'Continuous learning',
  ap_metrics_1_label: 'build time (pipeline optimization)',
  ap_metrics_2_label: 'initial load (code-splitting + cache)',
  ap_metrics_3_label: 'prototyping speed (UI kit)',

  // Theme toggle next-state labels
  toggle_to_dark: 'Enable dark theme',
  toggle_to_light: 'Enable light theme',

    // Dynamic/system messages
    theme_light: 'Light theme',
    theme_dark: 'Dark theme',
    theme_activated: 'activated',
    theme_saved: 'Saved in the browser.',
    msg_action_done: 'Action completed.',
    err_error: 'Error',
    err_set_key_hint: 'Set a key via /setkey <key>. For longer answers use /ai-long',
  err_no_api_key: 'No API key. Use /setkey <key> or window.__AI_KEY = "sk-..."',
    ex_ai_hooks: 'Example: /ai explain React hooks',
    ex_ai_long: 'Example: /ai-long a detailed WebSockets outline',
    ex_gemini: 'Example: /gemini Explain what an interpreter is',
    form_hidden: 'Form hidden.',
    form_toggled: 'Form toggled.',
    form_opened: 'Form opened in the AI Hub block.',
    sending: 'Sending…',
    ready: 'Ready.',
    unknown_command: 'Unknown command',
    try_help: 'Try /help',
    cmd_error: 'Command execution error.',
    profile_not_loaded: 'Profile not loaded yet.'
  }
};

export function t(key) {
  const lang = current || getLang();
  return (STR[lang] && STR[lang][key]) || (STR.uk && STR.uk[key]) || key;
}

export function getLang() {
  return current || localStorage.getItem(LANG_KEY) || 'uk';
}

export function setLanguage(lang = 'uk', { apply = true } = {}) {
  current = lang === 'en' ? 'en' : 'uk';
  localStorage.setItem(LANG_KEY, current);
  document.documentElement.setAttribute('lang', current);
  reflectLangButton();
  if (apply) {
    applyTranslations();
    try { if (window.renderStackSection) window.renderStackSection(true); } catch {}
    try { if (window.renderProjects) window.renderProjects(); } catch {}
    // Refresh dynamic UI blocks that render text (do not auto-create)
    try {
      if (document.querySelector('[data-contact-form]') && window.addOrUpdateContactFormBlock) {
        window.addOrUpdateContactFormBlock({ purpose: '', scroll: false });
      }
    } catch {}
    try {
      if (window.__LAST_SITE_PROFILE) {
        if (window.addOrUpdateSiteProfileBlock) window.addOrUpdateSiteProfileBlock(window.__LAST_SITE_PROFILE);
        // Update modal labels if open without re-opening
        const modal = document.querySelector('#site-profile-modal');
        if (modal && modal.classList.contains('is-open')) {
          if (window.refreshSiteProfileModalTexts) window.refreshSiteProfileModalTexts();
        }
      }
    } catch {}
  }
}

export function toggleLanguage() {
  setLanguage(getLang() === 'uk' ? 'en' : 'uk');
}

export function initI18n() {
  // initialize current language and hooks
  setLanguage(getLang(), { apply: false });
  ensureI18nHooks();
  wireLangButton();
  applyTranslations();
  try { if (window.renderStackSection) window.renderStackSection(true); } catch {}
  try { if (window.renderProjects) window.renderProjects(); } catch {}
  try {
    if (document.querySelector('[data-contact-form]') && window.addOrUpdateContactFormBlock) {
      window.addOrUpdateContactFormBlock({ purpose: '', scroll: false });
    }
  } catch {}
}

function wireLangButton() {
  const btn = document.querySelector('.lang-toggle');
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleLanguage();
    });
  } else {
    document.addEventListener('click', (e) => {
      const t = e.target.closest && e.target.closest('.lang-toggle');
      if (!t) return;
      e.preventDefault();
      toggleLanguage();
    });
  }
  reflectLangButton();
}

export function applyTranslations(root = document) {
  // Generic [data-i18n]
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (!key) return;
    el.textContent = t(key);
  });

  // Head meta/title if present in DOM (SSR index.html)
  try {
    const titleEl = document.querySelector('head > title');
    if (titleEl) titleEl.textContent = t('meta_title');
    const desc = document.querySelector('head > meta[name="description"]');
    if (desc) desc.setAttribute('content', t('meta_description'));
  } catch {}

  // Skip link, brand, nav aria
  const skip = root.querySelector('.skip-link');
  if (skip && !skip.hasAttribute('data-i18n')) skip.textContent = t('skip_to_content');
  const brandText = root.querySelector('.brand__text');
  if (brandText && !brandText.hasAttribute('data-i18n')) brandText.textContent = t('brand_name');
  const brand = root.querySelector('.brand');
  if (brand) brand.setAttribute('aria-label', t('brand_aria'));
  const nav = root.querySelector('.nav');
  if (nav) nav.setAttribute('aria-label', t('main_nav_aria'));

  // Header nav (if no data-i18n present)
  const navMap = [
    ['.nav a[href="#about"]', 'nav_about'],
    ['.nav a[href="#stack"]', 'nav_stack'],
    ['.nav a[href="#projects"]', 'nav_projects'],
    ['.nav a[href="#contact"]', 'nav_contact'],
  ];
  for (const [sel, key] of navMap) {
    const el = root.querySelector(sel);
    if (el && !el.hasAttribute('data-i18n')) el.textContent = t(key);
  }

  // Section titles
  const aboutTitle = root.querySelector('#about-title');
  if (aboutTitle && !aboutTitle.hasAttribute('data-i18n')) aboutTitle.textContent = t('sec_about');
  const stackTitle = root.querySelector('#stack-title');
  if (stackTitle && !stackTitle.hasAttribute('data-i18n')) stackTitle.textContent = t('sec_stack');
  const projectsTitle = root.querySelector('#projects-title');
  if (projectsTitle && !projectsTitle.hasAttribute('data-i18n')) projectsTitle.textContent = t('sec_projects');
  const contactTitle = root.querySelector('#contact-title');
  if (contactTitle && !contactTitle.hasAttribute('data-i18n')) contactTitle.textContent = t('sec_contact');

  // Section leads
  const stackLead = root.querySelector('section.stack .lead[data-stack-lead]');
  if (stackLead && !stackLead.hasAttribute('data-i18n')) stackLead.textContent = t('stack_lead');
  const projectsLead = root.querySelector('section.projects .lead');
  if (projectsLead && !projectsLead.hasAttribute('data-i18n')) projectsLead.textContent = t('projects_lead');
  const contactLead = root.querySelector('section.contact .lead');
  if (contactLead && !contactLead.hasAttribute('data-i18n')) contactLead.textContent = t('contact_lead');
  const contactsSmall = root.querySelector('section.contact .mono.small');
  if (contactsSmall && !contactsSmall.hasAttribute('data-i18n')) contactsSmall.textContent = t('contacts_updated');

  // Hero pieces
  const heroTitle = root.querySelector('.hero__title');
  if (heroTitle) {
    const nameSpan = heroTitle.querySelector('.gradient-text');
    if (nameSpan) nameSpan.textContent = t('hero_name');
    const raw = t('hero_title_pre');
    heroTitle.childNodes.forEach(n => {
      if (n.nodeType === Node.TEXT_NODE) n.textContent = raw + ' ';
    });
  }
  const heroSub = root.querySelector('.hero__subtitle');
  if (heroSub && !heroSub.hasAttribute('data-i18n')) heroSub.textContent = t('hero_subtitle');
  const heroBtnP = root.querySelector('.hero__cta .btn.primary');
  if (heroBtnP && !heroBtnP.hasAttribute('data-i18n')) heroBtnP.textContent = t('hero_cta_projects');
  const heroBtnG = root.querySelector('.hero__cta .btn.ghost');
  if (heroBtnG && !heroBtnG.hasAttribute('data-i18n')) heroBtnG.textContent = t('hero_cta_contact');
  const heroNote = root.querySelector('.hero__note');
  if (heroNote && !heroNote.hasAttribute('data-i18n')) heroNote.textContent = t('hero_note');

  // About detailed section
  const aboutLead = root.querySelector('.about-pro__lead:not(.about-pro__lead--sub)');
  if (aboutLead && !aboutLead.hasAttribute('data-i18n')) aboutLead.textContent = t('about_pro_lead');
  const aboutLeadSub = root.querySelector('.about-pro__lead--sub');
  if (aboutLeadSub && !aboutLeadSub.hasAttribute('data-i18n')) aboutLeadSub.textContent = t('about_pro_lead_sub');
  const apPillarsTitle = root.querySelector('#ap-pillars-title');
  if (apPillarsTitle && !apPillarsTitle.hasAttribute('data-i18n')) apPillarsTitle.textContent = t('ap_principles_title');
  const apPillars = root.querySelectorAll('.ap-list li');
  if (apPillars[0]) { const s=apPillars[0].querySelector('strong'); const d=apPillars[0].querySelector('span'); if(s) s.textContent=t('ap_pillars_1_title'); if(d) d.textContent=t('ap_pillars_1_desc'); }
  if (apPillars[1]) { const s=apPillars[1].querySelector('strong'); const d=apPillars[1].querySelector('span'); if(s) s.textContent=t('ap_pillars_2_title'); if(d) d.textContent=t('ap_pillars_2_desc'); }
  if (apPillars[2]) { const s=apPillars[2].querySelector('strong'); const d=apPillars[2].querySelector('span'); if(s) s.textContent=t('ap_pillars_3_title'); if(d) d.textContent=t('ap_pillars_3_desc'); }
  if (apPillars[3]) { const s=apPillars[3].querySelector('strong'); const d=apPillars[3].querySelector('span'); if(s) s.textContent=t('ap_pillars_4_title'); if(d) d.textContent=t('ap_pillars_4_desc'); }
  if (apPillars[4]) { const s=apPillars[4].querySelector('strong'); const d=apPillars[4].querySelector('span'); if(s) s.textContent=t('ap_pillars_5_title'); if(d) d.textContent=t('ap_pillars_5_desc'); }
  const apFocusTitle = root.querySelector('#ap-focus-title');
  if (apFocusTitle && !apFocusTitle.hasAttribute('data-i18n')) apFocusTitle.textContent = t('ap_focus_title');
  const apValuesTitle = root.querySelector('#ap-values-title');
  if (apValuesTitle && !apValuesTitle.hasAttribute('data-i18n')) apValuesTitle.textContent = t('ap_values_title');
  const apValues = root.querySelectorAll('.ap-values li');
  if (apValues[0] && !apValues[0].hasAttribute('data-i18n')) apValues[0].textContent = t('ap_values_1');
  if (apValues[1] && !apValues[1].hasAttribute('data-i18n')) apValues[1].textContent = t('ap_values_2');
  if (apValues[2] && !apValues[2].hasAttribute('data-i18n')) apValues[2].textContent = t('ap_values_3');
  if (apValues[3] && !apValues[3].hasAttribute('data-i18n')) apValues[3].textContent = t('ap_values_4');
  const apMetricsTitle = root.querySelector('#ap-metrics-title');
  if (apMetricsTitle && !apMetricsTitle.hasAttribute('data-i18n')) apMetricsTitle.textContent = t('ap_metrics_title');
  const apMetrics = root.querySelectorAll('.ap-metrics li');
  if (apMetrics[0]) { const l=apMetrics[0].querySelector('.metric-l'); if (l && !l.hasAttribute('data-i18n')) l.textContent = t('ap_metrics_1_label'); }
  if (apMetrics[1]) { const l=apMetrics[1].querySelector('.metric-l'); if (l && !l.hasAttribute('data-i18n')) l.textContent = t('ap_metrics_2_label'); }
  if (apMetrics[2]) { const l=apMetrics[2].querySelector('.metric-l'); if (l && !l.hasAttribute('data-i18n')) l.textContent = t('ap_metrics_3_label'); }

  // AI Dock labels
  const dockTitle = root.querySelector('.chat-dock__title');
  if (dockTitle && !dockTitle.hasAttribute('data-i18n')) dockTitle.textContent = t('dock_title');
  const dockHint = root.querySelector('.chat-dock__hint');
  if (dockHint && !dockHint.hasAttribute('data-i18n')) dockHint.textContent = t('dock_hint');
  const collapseHint = root.querySelector('.chat-dock__collapse-hint');
  if (collapseHint && !collapseHint.hasAttribute('data-i18n')) collapseHint.textContent = t('dock_collapse_hint');
  const themeLabel = root.querySelector('.th-label');
  if (themeLabel && !themeLabel.hasAttribute('data-i18n')) themeLabel.textContent = t('theme_label');
  // Tooltip via data attribute (CSS uses content: attr(data-tip))
  const themeBtn = root.querySelector('.theme-toggle--icon');
  if (themeBtn) themeBtn.setAttribute('data-tip', t('theme_tip'));
  const themeToggle = root.querySelector('[data-theme-toggle]');
  if (themeToggle) {
    themeToggle.setAttribute('aria-label', t('theme_toggle_aria'));
    themeToggle.setAttribute('title', t('theme_toggle_title'));
  }

  // AI Hub titles
  const hubTitle = root.querySelector('.ai-hub__title');
  if (hubTitle && !hubTitle.hasAttribute('data-i18n')) hubTitle.textContent = t('aihub_title');
  const hubTagline = root.querySelector('.ai-hub__tagline');
  if (hubTagline && !hubTagline.hasAttribute('data-i18n')) hubTagline.textContent = t('aihub_tagline');

  // Panels
  const liveTitle = root.querySelector('.ai-hub__panel.panel--primary .panel__title');
  if (liveTitle && !liveTitle.hasAttribute('data-i18n')) liveTitle.textContent = t('panel_live');
  const cmdTitle = root.querySelector('.ai-hub__panel.panel--commands .panel__title');
  if (cmdTitle && !cmdTitle.hasAttribute('data-i18n')) cmdTitle.textContent = t('panel_commands');
  const logTitle = root.querySelector('.ai-hub__panel.panel--log .panel__title');
  if (logTitle && !logTitle.hasAttribute('data-i18n')) logTitle.textContent = t('panel_log');
  const stackPanel = root.querySelector('[data-stack-panel]');
  if (stackPanel) {
    const title = stackPanel.closest('.ai-hub__panel')?.querySelector('.panel__title');
    if (title && !title.hasAttribute('data-i18n')) title.textContent = t('panel_stack');
  }

  // Composer placeholders/hints
  const textarea = root.querySelector('#dock-input');
  if (textarea) textarea.setAttribute('placeholder', t('composer_placeholder'));
  const hint = root.querySelector('[data-hint]');
  if (hint && !hint.hasAttribute('data-i18n')) hint.textContent = t('composer_hint');
  const sendBtn = root.querySelector('#chat-form .dock-btn.primary');
  if (sendBtn) sendBtn.setAttribute('aria-label', t('composer_send'));

  // Stats labels (by order)
  const statLabels = root.querySelectorAll('.ai-hub__stats .label');
  if (statLabels[0] && !statLabels[0].hasAttribute('data-i18n')) statLabels[0].textContent = t('stat_commands');
  if (statLabels[1] && !statLabels[1].hasAttribute('data-i18n')) statLabels[1].textContent = t('stat_sessions');
  if (statLabels[2] && !statLabels[2].hasAttribute('data-i18n')) statLabels[2].textContent = t('stat_ideas');

  // Commands panel list
  const cmdItems = root.querySelectorAll('.panel--commands .cmd-list li');
  if (cmdItems && cmdItems.length) {
    const keys = ['cmd_help','cmd_stack','cmd_projects','cmd_contact','cmd_ai','cmd_clear'];
    cmdItems.forEach((li, i) => {
      const span = li.querySelector('span');
      if (span && !span.hasAttribute('data-i18n')) span.textContent = t(keys[i] || '');
    });
  }

  // Event log initial items (first two)
  const evItems = root.querySelectorAll('.panel--log .event-log li');
  if (evItems && evItems.length >= 2) {
    if (evItems[0] && !evItems[0].hasAttribute('data-i18n')) evItems[0].textContent = t('log_init');
    if (evItems[1] && !evItems[1].hasAttribute('data-i18n')) evItems[1].textContent = t('log_wait');
  }

  // AI Hub info blocks content
  const infoBlocks = root.querySelectorAll('[data-info-blocks] .info-block');
  if (infoBlocks && infoBlocks.length >= 5) {
    // About block
    const b0 = infoBlocks[0];
    const h0 = b0.querySelector('.info-block__title'); if (h0) h0.textContent = t('ib_about');
    const p0 = b0.querySelector('.info-block__body p'); if (p0) p0.textContent = t('ib_about_p1');
    const roles = b0.querySelectorAll('.info-tags li');
    if (roles[0]) roles[0].textContent = t('ib_about_role1');
    if (roles[1]) roles[1].textContent = t('ib_about_role2');
    if (roles[2]) roles[2].textContent = t('ib_about_role3');

    // Skills block
    const b1 = infoBlocks[1];
    const h1 = b1.querySelector('.info-block__title'); if (h1) h1.textContent = t('ib_skills');
    const skills = b1.querySelectorAll('.info-list li');
    if (skills[0]) skills[0].textContent = t('ib_skills_ui');
    if (skills[1]) skills[1].textContent = t('ib_skills_code');
    if (skills[2]) skills[2].textContent = t('ib_skills_ai');
    if (skills[3]) skills[3].textContent = t('ib_skills_ops');

    // Principles block
    const b2 = infoBlocks[2];
    const h2 = b2.querySelector('.info-block__title'); if (h2) h2.textContent = t('ib_principles');
    const princ = b2.querySelectorAll('.info-steps li');
    if (princ[0]) princ[0].textContent = t('ib_princ1');
    if (princ[1]) princ[1].textContent = t('ib_princ2');
    if (princ[2]) princ[2].textContent = t('ib_princ3');
    if (princ[3]) princ[3].textContent = t('ib_princ4');

    // Highlights block
    const b3 = infoBlocks[3];
    const h3 = b3.querySelector('.info-block__title'); if (h3) h3.textContent = t('ib_highlights');
    const labels3 = b3.querySelectorAll('.info-grid .label');
    if (labels3[0]) labels3[0].textContent = t('ib_high1_label');
    if (labels3[1]) labels3[1].textContent = t('ib_high2_label');
    if (labels3[2]) labels3[2].textContent = t('ib_high3_label');

    // Contact block
    const b4 = infoBlocks[4];
    const h4 = b4.querySelector('.info-block__title'); if (h4) h4.textContent = t('ib_contact');
    const p4 = b4.querySelector('.info-block__body p'); if (p4) p4.textContent = t('ib_contact_p1');
  }

  reflectLangButton();
}

function ensureI18nHooks() {
  const ensure = (sel, key) => {
    const el = document.querySelector(sel);
    if (el && !el.hasAttribute('data-i18n')) el.setAttribute('data-i18n', key);
  };
  // safe defaults: add hooks only if missing (does not overwrite content)
  ensure('.ai-hub__title', 'aihub_title');
  ensure('.ai-hub__tagline', 'aihub_tagline');
  ensure('.chat-dock__title', 'dock_title');
  ensure('.chat-dock__hint', 'dock_hint');
}

function reflectLangButton() {
  const btn = document.querySelector('.lang-toggle');
  if (!btn) return;
  const isEn = getLang() === 'en';
  const label = btn.querySelector('.lang-toggle__label') || btn;
  label.textContent = isEn ? 'EN' : 'UA';
  btn.setAttribute('aria-pressed', String(isEn));
  btn.setAttribute('aria-label', isEn ? 'Switch to Ukrainian' : 'Switch to English');
  btn.title = isEn ? 'Switch to Ukrainian' : 'Switch to English';
}

// Expose for debugging if needed
window.I18N = { getLang, setLanguage, toggleLanguage, applyTranslations };
