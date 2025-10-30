/**
 * assetUrl.js
 * -------------------------------------------------------------
 * Допоміжна функція для побудови коректних URL до статичних ресурсів
 * з папки `public/` у проєктах на Vite. Працює у дев-режимі та білді,
 * враховує базовий префікс (BASE_URL) і не змінює зовнішні посилання.
 *
 * Використання: assetUrl('projectImg/Tealux.png') → абсолютний URL.
 */
/**
 * Повертає абсолютний URL для ресурсу з Vite `public/`.
 * - Прибирає початкові './' і опціональний префікс 'public/'.
 * - Не змінює зовнішні посилання (http(s)://) і data URI.
 * - Враховує import.meta.env.BASE_URL; інакше fallback до <base> або '/'.
 * @param {string} path
 * @returns {string}
 */
export function assetUrl(path) {
  if (!path) return path;
  // Залишити абсолютні HTTP(S) URL та data URI без змін
  if (/^(?:https?:)?\/\//i.test(path) || /^data:/i.test(path)) return path;
  // Нормалізація шляху: забрати './' і префікс 'public/'
  const clean = String(path)
    .replace(/^\.?\//, '')
    .replace(/^public\//, '');

  // Перевага змінній середовища Vite BASE_URL, якщо є
  let viteBase = null;
  try {
  // import.meta доступний в ESM; перевірка на сумісність
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) {
      viteBase = import.meta.env.BASE_URL;
    }
  } catch (_) {}

  // Резерв: <base href> з документа або '/'
  const docBase = (typeof document !== 'undefined')
    ? (document.querySelector('base')?.getAttribute('href') || '/')
    : '/';

  const base = (viteBase || docBase);

  try {
  // Побудова абсолютного URL; коректне склеювання та кодування
    return new URL(clean.replace(/^\//, ''), base.endsWith('/') ? base : base + '/').toString();
  } catch (_) {
  // Дуже обережне fallback-склеювання
    const b = base.endsWith('/') ? base : base + '/';
    return b + clean.replace(/^\//, '');
  }
}
