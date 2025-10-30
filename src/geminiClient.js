/**
 * geminiClient.js
 * -------------------------------------------------------------
 * Мінімальний ізольований клієнт для запитів до Gemini (Google Generative
 * Language API) у форматі generateContent. Використовується як альтернатива
 * або доповнення до загального aiClient.
 *
 * КОЛИ ВИКОРИСТОВУВАТИ:
 *  - Потрібно протестувати окремо Gemini без автодетекту.
 *  - Хочеш спростити експерименти з prompt інженерією для Gemini.
 *
 * ОБМЕЖЕННЯ:
 *  - Без стрімінгу.
 *  - Ключ зчитується з window.__GEMINI_KEY (небезпечно для продакшену).
 */

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

function getGeminiKey() {
  const k = window.__GEMINI_KEY || window.__GOOGLE_API_KEY || '';
  if (!k) throw new Error('Gemini ключ не заданий. Встанови window.__GEMINI_KEY = "..." у консолі (лише локально).');
  return k.trim();
}

/**
 * Запит до Gemini
 * @param {string} prompt 
 * @returns {Promise<string>}
 */
export async function askGemini(prompt) {
  const key = getGeminiKey();
  const body = {
    contents: [
      {
        parts: [ { text: prompt } ]
      }
    ]
  };

  const res = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': key
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const txt = await safeRead(res);
    throw new Error('Gemini HTTP ' + res.status + ': ' + txt);
  }
  const data = await res.json();
  // Формат: data.candidates[0].content.parts[0].text
  const answer = data?.candidates?.[0]?.content?.parts?.map(p=>p.text).join('\n').trim();
  if (!answer) throw new Error('Порожня відповідь або неочікуваний формат.');
  return answer;
}

async function safeRead(res) { try { return (await res.text()).slice(0,1200); } catch { return ''; } }

console.info('[gemini] client ready');
