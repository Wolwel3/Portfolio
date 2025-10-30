/**
 * stackRender.js
 * -------------------------------------------------------------
 * Відповідає за рендер секції "Стек" (групи + короткі описи) з даних
 * stackData.js. Підтримує фільтрацію через атрибут data-stack-groups
 * (наприклад: data-stack-groups="frontend,ai").
 *
 * ХАРАКТЕРИСТИКИ:
 *  - Ідемпотентність: якщо вже відрендерено – повторно не виконує роботу.
 *  - Приховує плейсхолдерний tag-cloud та lead-текст.
 *  - Додає компактний summary-блок, якщо відфільтровано підмножину груп.
 *
 * РОЗШИРЕННЯ:
 *  - Live toggle "показати всі".
 *  - Пошук по технологіях у групах.
 *  - Анімація появи (IntersectionObserver).
 */

import { AUTHOR_STACK_CATEGORIES, STACK_DESCRIPTIONS_I18N, GROUP_TITLES, ITEM_TITLES } from './stackData.js';
import { getLang, t } from './core/i18n.js';

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text) n.textContent = text;
  return n;
}

function renderStackSection(force = false) {
  const section = document.getElementById('stack');
  if (!section) return;
  const shell = section.querySelector('.shell');
  if (!shell) return;

  // Avoid double render
  const existing = shell.querySelector('.stack-groups');
  const existingSummary = shell.querySelector('.stack-summary');
  if (existing && !force) return;
  if (existing && force) existing.remove();
  if (existingSummary && force) existingSummary.remove();

  const placeholderList = shell.querySelector('.tag-cloud');
  const placeholderLead = shell.querySelector('.lead');

  // Determine filtered groups if attribute present
  const attr = section.getAttribute('data-stack-groups');
  let allowed = null;
  if (attr) {
    allowed = attr.split(',').map(s => s.trim()).filter(Boolean);
  }

  const groupsWrap = el('div', 'stack-groups');
  groupsWrap.setAttribute('role', 'list');

  // Optional concise summary (only if focusing subset)
  if (allowed && allowed.length) {
    const summary = el('div', 'stack-summary');
    const lang = getLang();
    const intro = lang === 'en' ? 'Focused slice:' : 'Фокусований зріз:';
    const suffix = lang === 'en' ? '— key competencies that combine product speed and AI integrations.' : '— ключові компетенції, що поєднують продуктову швидкість і AI інтеграції.';
    // Map group keys to localized titles in summary as well
    const titled = allowed.map(k => (GROUP_TITLES[lang] && GROUP_TITLES[lang][k]) || k);
    summary.innerHTML = `
      <p class="stack-summary__p"><strong>${intro}</strong> ${titled.join(' + ')} ${suffix}</p>
    `;
    const anchor = shell.querySelector('#stack-title');
    if (anchor) anchor.insertAdjacentElement('afterend', summary);
  }

  Object.entries(AUTHOR_STACK_CATEGORIES).forEach(([groupKey, items]) => {
    if (allowed && !allowed.includes(groupKey)) return;
    const groupEl = el('section', 'stack-group');
    groupEl.classList.add(`stack-group--${groupKey}`);
    groupEl.setAttribute('role', 'listitem');

    const lang = getLang();
    const groupTitle = (GROUP_TITLES[lang] && GROUP_TITLES[lang][groupKey]) || groupKey;
    const title = el('h3', 'stack-group__title', groupTitle);
    groupEl.appendChild(title);

    const list = el('ul', 'stack-group__list');

    items.forEach(item => {
      const li = el('li', 'stack-item');
      const lang2 = getLang();
      const itemTitle = (ITEM_TITLES[lang2] && ITEM_TITLES[lang2][item]) || item;
      const descText = (STACK_DESCRIPTIONS_I18N[lang2] && STACK_DESCRIPTIONS_I18N[lang2][item]) || '';
      const tech = el('span', 'stack-item__tech', itemTitle);
      const desc = el('span', 'stack-item__desc', descText);
      li.appendChild(tech);
      if (desc.textContent) li.appendChild(desc);
      list.appendChild(li);
    });

    groupEl.appendChild(list);
    groupsWrap.appendChild(groupEl);
  });

  // Insert after title
  const anchor = shell.querySelector('#stack-title');
  if (anchor) {
    anchor.insertAdjacentElement('afterend', groupsWrap);
  } else {
    shell.appendChild(groupsWrap);
  }

  if (placeholderList) placeholderList.style.display = 'none';
  if (placeholderLead) placeholderLead.style.display = 'none';
}

// Defer to next frame to ensure DOM ready if loaded early.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => renderStackSection(false));
} else {
  requestAnimationFrame(() => renderStackSection(false));
}

// Expose for manual refresh (e.g., future dynamic updates)
window.renderStackSection = renderStackSection;
