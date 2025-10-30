/**
 * aiPanel.js
 * -------------------------------------------------------------
 * Плаваюча (drag-enabled) панель для відображення потокових або окремих
 * AI-відповідей поза головним чатом. Дає змогу паралельно стежити за
 * декількома відповідями або статусами.
 *
 * ПУБЛІЧНЕ API:
 *  - initAIWindow({ title }) → створює панель.
 *  - appendAIOutput(html, { role, ts }) → додає рядок.
 *  - setAIStatus(text) → тимчасовий статусний бейдж.
 *  - clearAIOutput() → очистити список.
 *
 * ЗАСТОСУВАННЯ:
 *  - Моніторинг стрімінгу токенів.
 *  - Debug лог LLM до/після форматування.
 *
 * ІДЕЇ ДЛЯ РОЗШИРЕННЯ:
 *  - Збереження позиції (localStorage) між перезавантаженнями.
 *  - Фільтри по ролі (user/ai/system).
 *  - Копіювання всього контенту одним кліком.
 */

let panelRoot, listEl, statusEl, toggleBtn;

export function initAIWindow({ mount = document.body, title = 'AI Output' } = {}) {
  if (panelRoot) return getAPI();

  panelRoot = document.createElement('section');
  panelRoot.className = 'ai-float-panel';
  panelRoot.innerHTML = `
    <header class="ai-float-panel__bar" role="toolbar">
      <span class="ai-float-panel__title">${escapeHtml(title)}</span>
      <div class="ai-float-panel__actions">
        <button type="button" data-ai-collapse title="Згорнути/Розгорнути" aria-expanded="true">−</button>
        <button type="button" data-ai-clear title="Очистити" aria-label="Очистити">✕</button>
      </div>
    </header>
    <div class="ai-float-panel__body">
      <ol class="ai-float-panel__list" aria-live="polite"></ol>
      <div class="ai-float-panel__status" aria-live="polite" aria-atomic="true"></div>
    </div>`;

  listEl = panelRoot.querySelector('.ai-float-panel__list');
  statusEl = panelRoot.querySelector('.ai-float-panel__status');
  toggleBtn = panelRoot.querySelector('[data-ai-collapse]');

  panelRoot.addEventListener('click', (e) => {
    if (e.target.matches('[data-ai-clear]')) {
      clearAIOutput();
    } else if (e.target.matches('[data-ai-collapse]')) {
      const collapsed = panelRoot.classList.toggle('is-collapsed');
      e.target.textContent = collapsed ? '+' : '−';
      e.target.setAttribute('aria-expanded', String(!collapsed));
    }
  });

  mount.appendChild(panelRoot);
  dragEnable(panelRoot.querySelector('.ai-float-panel__bar'));
  return getAPI();
}

function getAPI() {
  return { appendAIOutput, setAIStatus, clearAIOutput };
}

export function appendAIOutput(html, { role = 'ai', ts = Date.now() } = {}) {
  if (!listEl) return;
  const li = document.createElement('li');
  li.className = `ai-float-panel__item ai-role-${role}`;
  const time = new Date(ts).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  li.innerHTML = `<div class="ai-float-panel__meta"><span class="ai-float-panel__role">${role}</span><span class="ai-float-panel__time">${time}</span></div><div class="ai-float-panel__content">${html}</div>`;
  listEl.appendChild(li);
  listEl.scrollTop = listEl.scrollHeight;
  return li;
}

export function setAIStatus(text) {
  if (!statusEl) return;
  statusEl.textContent = text || '';
  if (text) {
    statusEl.classList.add('is-active');
    clearTimeout(setAIStatus._t);
    setAIStatus._t = setTimeout(() => statusEl.classList.remove('is-active'), 2500);
  }
}

export function clearAIOutput() {
  if (!listEl) return;
  listEl.innerHTML = '';
  setAIStatus('Очищено');
}

// ============ Draggable ============
function dragEnable(handle) {
  let sx, sy, ox, oy, dragging = false;
  const root = panelRoot;
  handle.style.cursor = 'grab';
  handle.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    dragging = true;
    sx = e.clientX; sy = e.clientY;
    const rect = root.getBoundingClientRect();
    ox = rect.left; oy = rect.top;
    root.classList.add('is-dragging');
    handle.setPointerCapture(e.pointerId);
  });
  handle.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    root.style.left = Math.max(8, ox + dx) + 'px';
    root.style.top = Math.max(8, oy + dy) + 'px';
  });
  handle.addEventListener('pointerup', (e) => {
    dragging = false;
    root.classList.remove('is-dragging');
    handle.releasePointerCapture(e.pointerId);
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]||c));
}
