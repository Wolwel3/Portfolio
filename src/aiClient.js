/**
 * aiClient.js
 * -------------------------------------------------------------
 * Легкий універсальний клієнт для виклику моделей (OpenAI / OpenRouter / Gemini) у фронтенді.
 * Мета: уніфікований виклик askLLM(prompt, { system, maxTokens, history }).
 *
 * ОСНОВНІ МОЖЛИВОСТІ:
 *  - Автовизначення провайдера за префіксом ключа (sk-or-, AIza, ...).
 *  - Ізольований buildRequestConfig() для OpenAI/OpenRouter.
 *  - Історія (history) обрізається за кількістю повідомлень та символів.
 *  - Підтримка Gemini через окремий формат (generateContent API).
 *  - Таймаут через AbortController.
 *
 * ОБМЕЖЕННЯ / БЕЗПЕКА:
 *  - Фронтенд не є безпечним місцем для зберігання приватних ключів.
 *  - Рекомендовано винести в бекенд-проксі (див. закоментований приклад).
 *
 * РОЗШИРЕННЯ (ідеї):
 *  - Стріминг (EventSource / fetch streaming) — зараз повертає тільки фінальний текст.
 *  - Ретрі та експоненційний бекоф.
 *  - Перемикання моделей на рівні команди / конфіг UI.
 */

// =============================================================
// 1. Конфігурація (базові значення / endpoints / таймаут)
// =============================================================
export const AI_CONFIG = {
  // НЕ ЗБЕРІГАЙТЕ приватний ключ тут. Для локального тесту в консолі:
  // window.__AI_KEY = 'sk-...';    // OpenAI
  // window.__AI_KEY = 'sk-or-...'; // OpenRouter
  // Продакшен: зробити бекенд-проксі /api/ai і ключ тримати на сервері.
  API_KEY: 'AIzaSyCf3zK65RYzenmUyVKw7klTH_JaZq7Jn0E', // (порожньо навмисно)

  // Провайдер: 'auto' | 'openai' | 'openrouter' | 'gemini'
  PROVIDER: 'auto',

  // Моделі за замовчуванням
  OPENAI_MODEL: 'gpt-4o-mini',
  OPENROUTER_MODEL: 'openai/gpt-4o-mini',
  GEMINI_MODEL: 'gemini-2.0-flash',

  // Endpoint-и
  OPENAI_ENDPOINT: 'https://api.openai.com/v1/chat/completions',
  OPENROUTER_ENDPOINT: 'https://openrouter.ai/api/v1/chat/completions',
  GEMINI_ENDPOINT_BASE: 'https://generativelanguage.googleapis.com/v1beta/models',
  
  TIMEOUT_MS: 20000,
  MAX_TOKENS_DEFAULT: 400,
  MAX_TOKENS_LONG: 500 // для довших відповідей (можна змінити)
  ,HISTORY_MAX_MESSAGES: 12,
  HISTORY_MAX_CHARS: 4000
};

// =============================================================
// 2. Визначення провайдера по ключу і ручному значенню PROVIDER
//    - Якщо користувач явно задав PROVIDER = 'openai' | 'openrouter' — беремо його.
//    - Інакше авто-визначення: ключ, що починається з 'sk-or-' => OpenRouter.
// =============================================================
function detectProvider(key) {
  // Явно задано
  if (['openai','openrouter','gemini'].includes(AI_CONFIG.PROVIDER)) return AI_CONFIG.PROVIDER;
  if (typeof key !== 'string') return 'openai';
  if (key.startsWith('sk-or-')) return 'openrouter';
  if (key.startsWith('AIza')) return 'gemini';
  return 'openai';
}

// =============================================================
// 3. Отримання ключа: пріоритет window.__AI_KEY (тимчасово) → AI_CONFIG.API_KEY.
//    Кидає помилку, якщо ключ відсутній.
// =============================================================
function getApiKeyInternal() {
  const w = (typeof window !== 'undefined') ? window : {};
  return (
    w.__AI_KEY ||
    w.__OPENAI_KEY ||
    w.__OPENROUTER_KEY ||
    w.__GEMINI_KEY ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('AI_KEY') : '') ||
    AI_CONFIG.API_KEY ||
    ''
  ).trim();
}

export function setAIKey(key) {
  if (typeof key !== 'string' || !key.trim()) return false;
  const clean = key.trim();
  if (typeof window !== 'undefined') {
    window.__AI_KEY = clean; // універсальний слот
    try { localStorage.setItem('AI_KEY', clean); } catch {}
  }
  return true;
}

export function getAIKey() {
  return getApiKeyInternal();
}

import { t } from './core/i18n.js';

function getApiKey() {
  const key = getApiKeyInternal();
  if (!key) {
    // Повертаємо помилку як виняток — логіка зверху покаже дружнє повідомлення.
    throw new Error(t('err_no_api_key') || 'Немає API ключа. Використай /setkey <ключ> або window.__AI_KEY = "sk-..."');
  }
  return key;
}

// =============================================================
// 4. Побудова параметрів запиту (endpoint, headers, body)
//    - Враховує різницю OpenAI / OpenRouter (додаткові заголовки)
//    - Санітує X-Title до ASCII для уникнення fetch помилки (ISO-8859-1)
// =============================================================
function buildRequestConfig(provider, key, system, userPrompt, maxTokens, history) {
  const isOpenRouter = provider === 'openrouter';
  const endpoint = isOpenRouter ? AI_CONFIG.OPENROUTER_ENDPOINT : AI_CONFIG.OPENAI_ENDPOINT;
  const model = isOpenRouter ? AI_CONFIG.OPENROUTER_MODEL : AI_CONFIG.OPENAI_MODEL;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${key}`
  };

  // Додаткові заголовки лише для OpenRouter
  if (isOpenRouter) {
    const origin = (location.origin && location.origin !== 'null') ? location.origin : 'http://localhost';
    headers['HTTP-Referer'] = origin;
    // Санітуємо значення заголовка до ASCII, щоби уникнути помилки ISO-8859-1
    const ascii = (str) => String(str || '').replace(/[^\x20-\x7E]/g, '').slice(0, 120);
    headers['X-Title'] = ascii(document.title) || 'App';
  }

  const baseMessages = [
    { role: 'system', content: system || 'You are a helpful assistant.' }
  ];
  if (Array.isArray(history) && history.length) {
    for (const m of history) {
      if (!m || !m.role || !m.content) continue;
      // Безпека: обрізати надто довгі шматки
      baseMessages.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content).slice(0, 1500) });
    }
  }
  baseMessages.push({ role: 'user', content: userPrompt });

  const body = {
    model,
    messages: baseMessages,
    temperature: 0.4,
    max_tokens: Math.min(Math.max(50, maxTokens || AI_CONFIG.MAX_TOKENS_DEFAULT), 4096)
  };

  return { endpoint, headers, body };
}

// =============================================================
// 5. Основна функція askLLM(userPrompt, options)
//    - Створює AbortController з таймаутом
//    - Робить POST запит на обраний endpoint
//    - Повертає текст відповіді (content) або кидає помилку
// =============================================================
/**
 * Викликає LLM (OpenAI або OpenRouter) і повертає текст відповіді.
 * @param {string} userPrompt - Текст користувача.
 * @param {Object} [opts]
 * @param {string} [opts.system='You are a helpful assistant.'] - Системний промпт.
 * @returns {Promise<string>} Вміст першої відповіді моделі.
 * @throws {Error} Якщо ключ відсутній, HTTP помилка або порожня відповідь.
 */
export async function askLLM(userPrompt, { system = 'You are a helpful assistant.', maxTokens, history = [] } = {}) {
  const key = getApiKey();
  const provider = detectProvider(key);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_CONFIG.TIMEOUT_MS);

  try {
    if (provider === 'gemini') {
      // Форматування історії в текстовий префікс
      let historyPrefix = '';
      if (Array.isArray(history) && history.length) {
        const limited = history.slice(-AI_CONFIG.HISTORY_MAX_MESSAGES);
        const mapped = [];
        let total = 0;
        for (const msg of limited) {
          const role = msg.role === 'assistant' ? 'AI' : 'Користувач';
            let content = String(msg.content || '').replace(/\s+/g,' ').trim();
            if (!content) continue;
            content = content.slice(0, 500);
            total += content.length;
            if (total > AI_CONFIG.HISTORY_MAX_CHARS) break;
            mapped.push(`${role}: ${content}`);
        }
        if (mapped.length) historyPrefix = `Контекст попереднього діалогу:\n${mapped.join('\n')}\n---\n`;
      }
      const enrichedPrompt = historyPrefix + userPrompt;
      return await requestGemini(key, system, enrichedPrompt, controller.signal, maxTokens);
    } else {
      const { endpoint, headers, body } = buildRequestConfig(provider, key, system, userPrompt, maxTokens, history);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal
      });
      if (!res.ok) {
        const text = await safeReadText(res);
        let hint = '';
        if (res.status === 401 || res.status === 403) {
          hint = ' Перевір правильність ключа та відповідність провайдера (OpenAI vs OpenRouter).';
        }
        throw new Error(`HTTP ${res.status}: ${text || res.statusText}.${hint}`);
      }
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content?.trim?.();
      if (!content) throw new Error('Відповідь порожня або у неочікуваному форматі.');
      return content;
    }
  } finally {
    clearTimeout(timeout);
  }
}

// =============================================================
// 6. Допоміжна безпечна функція читання тексту з респонсу (для помилок)
//    - Обрізає до ~2000 символів, ігнорує збої.
// =============================================================
async function safeReadText(res) {
  try {
    const text = await res.text();
    return text?.slice?.(0, 2000) || '';
  } catch {
    return '';
  }
}

// =============================================================
// 8. Gemini support (generateContent)
// =============================================================
async function requestGemini(key, system, userPrompt, signal, maxTokens) {
  const prompt = system ? `${system}\n\n${userPrompt}` : userPrompt;
  const endpoint = `${AI_CONFIG.GEMINI_ENDPOINT_BASE}/${AI_CONFIG.GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`;
  const body = { 
    contents: [ { parts: [ { text: prompt } ] } ],
    generationConfig: { maxOutputTokens: Math.min(Math.max(50, maxTokens || AI_CONFIG.MAX_TOKENS_DEFAULT), 2048) }
  };
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal
  });
  if (!res.ok) {
    const txt = await safeReadText(res);
    let hint = '';
    if (res.status === 401 || res.status === 403) hint = ' (Gemini: перевір обмеження ключа)';
    throw new Error(`Gemini HTTP ${res.status}: ${txt || res.statusText}${hint}`);
  }
  const data = await res.json();
  const answer = data?.candidates?.[0]?.content?.parts?.map(p=>p.text).join('\n').trim();
  if (!answer) throw new Error('Gemini: порожня відповідь або формат змінився.');
  return answer;
}

// =============================================================
// 7. Альтернатива (бекенд-проксі) — приклад за коментарем
//    Цей варіант безпечніший: ключ зберігається на сервері.
// =============================================================
// export async function askLLM(prompt) {
//   const res = await fetch('/api/ai', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ prompt })
//   });
//   if (!res.ok) throw new Error('Proxy error');
//   const { answer } = await res.json();
//   return answer;
// }
