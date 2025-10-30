/**
 * stackFunctionCalling.js
 * -------------------------------------------------------------
 * Експериментальний модуль ("function calling" симуляція) для виявлення наміру
 * користувача показати стек за простими ключовими словами та оновлення
 * (колись) статичного панелю. Зараз панель видалена, тож модуль виконує лише
 * базову евристику й повертає дані (можна адаптувати або видалити).
 *
 * МОЖЛИВІ ШЛЯХИ ДАЛІ:
 *  - Інтегрувати з реальним механізмом AI function-calling.
 *  - Переорієнтувати на виклик window.renderStackSection() з фокусом.
 *  - Повністю видалити після переїзду на єдиний механізм рендеру стеку.
 */

// Простий опис інструмента (для документації / можливої інтеграції)
export const tool_showStack = {
  name: 'showStackModule',
  description: 'Показати модуль стек технологій автора',
  parameters: {
    type: 'object',
    properties: {
      authorName: { type: 'string', description: 'Ім’я або нік автора' },
      technologies: { type: 'array', items: { type: 'string' }, description: 'Список технологій' }
    },
    required: ['authorName']
  }
};

// Простий симулятор: парсимо текст і якщо є ключові слова — викликаємо
export async function processWithStackFunction(userText) {
  const lower = userText.toLowerCase();
  const wantStack = /(покажи|відобрази|show).*(стек|stack|технолог)/.test(lower);
  if (!wantStack) return null; // нічого не робимо

  // Витягуємо потенційні технології (спліт за комами)
  let technologies = [];
  const match = userText.match(/:(.+)$/); // все після двокрапки
  if (match) {
    technologies = match[1].split(/[,;]/).map(s=>s.trim()).filter(Boolean).slice(0,12);
  }

  // Reveal static panel
  const panel = document.querySelector('[data-stack-panel]');
  if (panel) {
    panel.style.display = '';
    const listEl = panel.querySelector('.stack-tags');
    if (listEl && technologies.length) {
      listEl.innerHTML = technologies.map(t => `<li>${t}</li>`).join('');
    }
    // Add log entry if event log exists
    const log = document.querySelector('.event-log');
    if (log) {
      const li = document.createElement('li');
      li.textContent = 'Показано стек (' + (technologies.length? technologies.length + ' tech' : 'default') + ')';
      log.appendChild(li);
    }
    return { shown: true, technologies };
  }
  return null;
}

// Підв’язуємо до window для тесту
window.__stackFuncDemo = { processWithStackFunction };
console.info('[stackFunctionCalling] ready. Викличте window.__stackFuncDemo.processWithStackFunction("Покажи стек: React, Node.js")');
