/**
 * core/logger.js
 * -------------------------------------------------------------
 * Легкий подієвий логер для панелі "Журнал" в AI Hub: додавання записів,
 * очищення та ініціалізація тулбара. Зберігає останні ~300 подій у памʼяті.
 */
// core/logger.js — Легкий подієвий логер для панелі Журнал в AI Hub

const EVENT_LOG = [];

function getLogEls(){
  const panel = document.querySelector('#ai-hub .panel--log');
  if (!panel) return {};
  const body = panel.querySelector('.panel__body');
  const list = panel.querySelector('.event-log');
  const toolbar = panel.querySelector('[data-log-toolbar]');
  return { panel, body, list, toolbar };
}

function ensureLogToolbar(){
  const { panel } = getLogEls();
  if (!panel) return;
  if (panel.querySelector('[data-log-toolbar]')) return; // already exists
  const body = panel.querySelector('.panel__body');
  if (!body) return;
  const tb = document.createElement('div');
  tb.className = 'log-toolbar';
  tb.setAttribute('data-log-toolbar','');
  tb.innerHTML = `
    <div class="log-controls">
      <button type="button" class="dock-btn" data-log-clear title="Очистити журнал">Очистити</button>
    </div>
  `;
  body.prepend(tb);
  // Wire handlers
  tb.addEventListener('click', (e)=>{
    if (e.target.matches('[data-log-clear]')) clearLog();
  });
}

function renderLogEntry(evt){
  const { list, body } = getLogEls();
  if (!list) return;
  const li = document.createElement('li');
  li.className = 'log-item lvl-' + (evt.level||'info');
  li.dataset.level = evt.level||'info';
  const t = new Date(evt.time);
  const hh = String(t.getHours()).padStart(2,'0');
  const mm = String(t.getMinutes()).padStart(2,'0');
  const ss = String(t.getSeconds()).padStart(2,'0');
  const ts = `${hh}:${mm}:${ss}`;
  const meta = evt.meta ? ` <span class="mono small" style="opacity:.75">${escapeHtml(JSON.stringify(evt.meta))}</span>` : '';
  li.innerHTML = `[${ts}] <strong>${escapeHtml((evt.level||'info').toUpperCase())}</strong> — ${escapeHtml(evt.msg)}${meta}`;
  list.appendChild(li);
  if (body) { body.scrollTop = body.scrollHeight; }
}

export function logEvent(level, msg, meta){
  const evt = { time: Date.now(), level: (level||'info'), msg: String(msg||''), meta };
  EVENT_LOG.push(evt);
  if (EVENT_LOG.length > 300) EVENT_LOG.splice(0, EVENT_LOG.length - 300);
  renderLogEntry(evt);
}

export function clearLog(){
  EVENT_LOG.splice(0, EVENT_LOG.length);
  const { list } = getLogEls();
  if (list) list.innerHTML = '';
  logEvent('info','Журнал очищено');
}

export function initLogPanelUI(){
  ensureLogToolbar();
  logEvent('info','AI Hub: журнал активовано');
}

function escapeHtml(str){
  return String(str||'').replace(/[&<>'"]/g, c => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":"&#39;"
  }[c]||c));
}
