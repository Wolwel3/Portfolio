/**
 * ui/theme.js
 * -------------------------------------------------------------
 * Централізоване керування темою (dark/light): встановлення режиму,
 * збереження у localStorage та відображення стану на кнопці.
 */
// ui/theme.js — Централізоване керування темою в застосунку
import { t } from '../core/i18n.js';

export function setTheme(mode = 'toggle') {
  const body = document.body;
  const isLight = body.classList.contains('light-theme');
  const m = (mode || 'toggle').toLowerCase();
  if (m === 'light') {
    if (!isLight) {
      body.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
    }
    reflectThemeButton();
    return 'light';
  }
  if (m === 'dark') {
    if (isLight) {
      body.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
    }
    reflectThemeButton();
    return 'dark';
  }
  // toggle
  if (isLight) {
    body.classList.remove('light-theme');
    localStorage.setItem('theme', 'dark');
    reflectThemeButton();
    return 'dark';
  } else {
    body.classList.add('light-theme');
    localStorage.setItem('theme', 'light');
    reflectThemeButton();
    return 'light';
  }
}

export function reflectThemeButton(){
  try {
    const btn = document.querySelector('[data-theme-toggle]');
    if (!btn) return;
    const isLight = document.body.classList.contains('light-theme');
    btn.setAttribute('aria-pressed', String(isLight));
    const nextFinal = isLight ? (t('toggle_to_dark') || 'Увімкнути темну тему') : (t('toggle_to_light') || 'Увімкнути світлу тему');
    btn.setAttribute('aria-label', nextFinal);
    btn.setAttribute('title', nextFinal);
  } catch {}
}
