/**
 * userProfile.js
 * -------------------------------------------------------------
 * Завантажує profile.json (дані автора) і застосовує їх у DOM (hero,
 * контакти, бренд, about). Дає глобальний доступ до профілю для AI промптів.
 *
 * API:
 *  - loadUserProfile(url?): Promise<Profile|null>
 *  - getUserProfile(): Profile|null (кешований обʼєкт)
 *
 * ДЕТАЛІ РЕАЛІЗАЦІЇ:
 *  - Кеш у модулі (cachedProfile) + дублювання в window.__USER_PROFILE.
 *  - Утиліти нормалізують хендли контактів (github / telegram / linkedin ...).
 *
 * ІДЕЇ ДЛЯ ПОКРАЩЕННЯ:
 *  - Додавати timestamp оновлення.
 *  - Валідувати структуру profile.json перед застосуванням.
 *  - Опціонально — lazy оновлення секцій (MutationObserver).
 */

import { getLang, t } from './core/i18n.js';

let cachedProfile = null;

export async function loadUserProfile(url = './src/profile.json') {
  if (cachedProfile) return cachedProfile;
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    cachedProfile = data;
    window.__USER_PROFILE = data; // експортуємо глобально для AI контексту
    applyProfileToDOM(data);
    return data;
  } catch (err) {
    console.warn('[profile] Не вдалося завантажити профіль:', err);
    return null;
  }
}

export function getUserProfile() {
  return cachedProfile || window.__USER_PROFILE || null;
}

function applyProfileToDOM(p) {
  if (!p) return;
  const lang = (typeof getLang === 'function') ? getLang() : 'uk';
  // Оновлення брендового імені
  const brand = document.querySelector('.brand__text');
  if (brand && p.name && !brand.hasAttribute('data-i18n')) brand.textContent = p.name;

  // Hero блок (знайти h1.hero__title і subtitle)
  // ВАЖЛИВО: не перезаписуємо .gradient-text повним ім'ям, щоб не конфліктувати з i18n,
  // який керує коротким ім'ям (t('hero_name')). Якщо потрібно — можна керувати через i18n.
  // const heroTitle = document.querySelector('.hero__title .gradient-text');
  // if (heroTitle && p.shortName) heroTitle.textContent = p.shortName;

  const heroSubtitle = document.querySelector('.hero__subtitle');
  if (heroSubtitle && p.role) {
    if (lang === 'uk') {
      heroSubtitle.textContent = `${p.role} з ${p.location || '...'}. ${p.tagline || ''}`.trim();
    } else if (typeof t === 'function') {
      heroSubtitle.textContent = t('hero_subtitle');
    }
  }

  // Info-block "Про мене" перший абзац
  const aboutInfo = document.querySelector('[data-info-blocks] .info-block:nth-child(1) .info-block__body p');
  if (aboutInfo) {
    if (lang === 'uk') {
      aboutInfo.textContent = `Я — ${p.name}, ${p.role}${p.location ? ' (' + p.location + ')' : ''}. ${p.tagline || ''}`.trim();
    } else if (typeof t === 'function') {
      aboutInfo.textContent = t('ib_about_p1');
    }
  }

  // Контактні email посилання
  if (p.email || p?.contacts?.email) {
    const emailVal = p.email || p.contacts.email;
    document.querySelectorAll('a[data-social="email"]').forEach(a => {
      a.setAttribute('href', `mailto:${emailVal}`);
    });
  }

  // Узагальнена обробка контактів (github, telegram, linkedin, phone ...)
  if (p.contacts) {
    const mapBuilder = {
      github: v => v ? `https://github.com/${stripUrlHandle(v)}` : null,
      telegram: v => v ? (v.startsWith('http') ? v : `https://t.me/${stripAt(v)}`) : null,
      linkedin: v => v ? (v.startsWith('http') ? v : `https://www.linkedin.com/in/${stripSlash(v)}`) : null,
      twitter: v => v ? (v.startsWith('http') ? v : `https://twitter.com/${stripAt(v)}`) : null,
      website: v => v && v.startsWith('http') ? v : null,
      devto: v => v ? (v.startsWith('http') ? v : `https://dev.to/${stripSlash(v)}`) : null,
      medium: v => v ? (v.startsWith('http') ? v : `https://medium.com/@${stripAt(v)}`) : null,
      phone: v => v ? `tel:${v.replace(/\s+/g,'')}` : null
    };
    for (const [key, rawVal] of Object.entries(p.contacts)) {
      if (!rawVal) continue;
      const builder = mapBuilder[key];
      const href = builder ? builder(rawVal) : null;
      if (!href) continue;
      document.querySelectorAll(`a[data-social="${key}"]`).forEach(a => {
        a.setAttribute('href', href);
        if (key === 'phone') {
          a.textContent = rawVal; // показати номер
        }
      });
    }
  }
}

// Helpers
function stripAt(v){ return String(v).replace(/^@/, ''); }
function stripSlash(v){ return String(v).replace(/\/$/, ''); }
function stripUrlHandle(v){
  // дозволяємо передати повний URL або handle
  if (/github\.com\//i.test(v)) {
    const m = v.match(/github\.com\/(.+?)(?:$|\/)/i); return m? m[1] : v; }
  return String(v).replace(/^[\/@]/,'');
}
