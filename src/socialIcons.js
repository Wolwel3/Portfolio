import { assetUrl } from './assetUrl.js';
/**
 * socialIcons.js
 * -------------------------------------------------------------
 * Автоматичне підвантаження та вставка SVG-іконок у посилання з атрибутом
 * data-social (email, github, telegram, linkedin, ...). Робить інтерфейс
 * більш впізнаваним без ручного дублювання SVG у HTML.
 *
 * ЛОГІКА:
 *  - Кешує запити (Map) — уникає повторного fetch того ж SVG.
 *  - Коригує відступи для уже стилізованих контактних посилань.
 *  - Безпечно пропускає елементи без відповідності у SVG_MAP.
 *
 * РОЗШИРЕННЯ:
 *  - Lazy-ініціалізація (IntersectionObserver) для великих списків.
 *  - Вбудований fallback (initials) якщо SVG недоступний.
 */

const SVG_MAP = {
  email: 'icons8-gmail-logo.svg',
  github: 'icons8-github.svg',
  telegram: 'icons8-telegram.svg',
  linkedin: 'icons8-linkedin.svg',
  twitter: 'icons8-twitter.svg',
  instagram: 'icons8-instagram-logo.svg',
  phone: 'accept-call-icon.svg'
};

function fetchSvg(path) {
  return fetch(path).then(r => r.ok ? r.text() : null).catch(()=>null);
}

async function injectSocialIcons() {
  const links = document.querySelectorAll('a[data-social]');
  const cache = new Map();
  for (const a of links) {
    if (a.dataset.iconInjected === '1') continue;
    const key = a.dataset.social;
    const file = SVG_MAP[key];
    if (!file) continue;
    if (!cache.has(file)) {
      cache.set(file, fetchSvg(assetUrl(`public/${file}`)));
    }
    const svgText = await cache.get(file);
    if (!svgText) continue;
    const span = document.createElement('span');
    span.className = 'soc-ic';
    span.innerHTML = svgText.trim();
    // Якщо вже є текст чи іконка — вставимо на початок
    a.prepend(span);
    // Видалити стару буквено/символьну іконку якщо залишилась
    const legacy = a.querySelector('.cl-ic');
    if (legacy) legacy.remove();
    // Якщо посилання мало додатковий внутрішній відступ під стару іконку — скоригуємо
    if (a.classList.contains('contact-link')) {
      // Оригінально padding-left:2.05rem; Тепер для маленької svg можемо зменшити
      a.style.paddingLeft = '1.55rem';
    }
    a.dataset.iconInjected = '1';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectSocialIcons);
} else {
  injectSocialIcons();
}

console.info('[social-icons] init');
