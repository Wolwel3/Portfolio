/**
 * ui/siteProfile.js
 * -------------------------------------------------------------
 * Рендер блоку "Про сайт" (What/How/Why) та модальне вікно з тими ж даними.
 * Містить CSS-інʼєкцію, оновлення локалізованих підписів, кеш останніх даних.
 */
// ui/siteProfile.js — Рендер блоку "Про сайт" і керування модалкою (open/close + CSS)

import { t, getLang } from '../core/i18n.js';

// Public API
export function addOrUpdateSiteProfileBlock(data) {
  try {
    if (!data || typeof data !== 'object') return;
    // cache last data for i18n refresh
    window.__LAST_SITE_PROFILE = data;
    const container = document.querySelector('[data-info-blocks]');
    if (!container) return;
    let block = container.querySelector('[data-site-profile]');
    const hash = JSON.stringify(data);
    if (block && block.dataset.hash === hash) {
      const meta = block.querySelector('[data-site-profile-meta]');
      if (meta) meta.textContent = `${t('sp_updated')} ` + formatTimeHM(new Date());
      return;
    }
    if (!block) {
      block = document.createElement('article');
      block.className = 'info-block';
      block.setAttribute('data-block','');
      block.setAttribute('data-site-profile','');
      block.innerHTML = `
        <header class="info-block__head">
          <h4 class="info-block__title">${t('ib_site_profile')}</h4>
          <button class="info-block__toggle" aria-expanded="true" aria-label="${t('collapse_section')}" type="button">−</button>
        </header>
        <div class="info-block__body site-prof">
          <div class="site-prof__row" data-prof-what>
            <div class="site-prof__label">${t('sp_label_what')}</div>
            <div class="site-prof__value" data-prof-what-val></div>
          </div>
          <div class="site-prof__row" data-prof-how>
            <div class="site-prof__label">${t('sp_label_how')}</div>
            <div class="site-prof__value" data-prof-how-val></div>
          </div>
          <div class="site-prof__row" data-prof-why>
            <div class="site-prof__label">${t('sp_label_why')}</div>
            <div class="site-prof__value" data-prof-why-val></div>
          </div>
          <p class="mono small site-prof__meta" data-site-profile-meta></p>
        </div>`;
      container.prepend(block); // show near top
    }
    block.dataset.hash = hash;
    const whatEl = block.querySelector('[data-prof-what-val]');
    const howEl = block.querySelector('[data-prof-how-val]');
    const whyEl = block.querySelector('[data-prof-why-val]');
    const meta = block.querySelector('[data-site-profile-meta]');
    // Refresh static labels
    try {
      const titleEl = block.querySelector('.info-block__title');
      if (titleEl) titleEl.textContent = t('ib_site_profile');
      const tgl = block.querySelector('.info-block__toggle');
      if (tgl) tgl.setAttribute('aria-label', t('collapse_section'));
      const labWhat = block.querySelector('[data-prof-what] .site-prof__label');
      const labHow = block.querySelector('[data-prof-how] .site-prof__label');
      const labWhy = block.querySelector('[data-prof-why] .site-prof__label');
      if (labWhat) labWhat.textContent = t('sp_label_what');
      if (labHow) labHow.textContent = t('sp_label_how');
      if (labWhy) labWhy.textContent = t('sp_label_why');
    } catch {}
    if (whatEl) whatEl.innerHTML = `<p class="site-prof__text">${escapeHtml(data.what||'—')}</p>`;
    if (howEl) {
      const actions = Array.isArray(data.how)? data.how : [];
      howEl.innerHTML = actions.length
        ? `<ul class="site-prof__list mono">${actions.map(a=>`<li class="site-prof__list-item">${escapeHtml(a)}</li>`).join('')}</ul>`
        : '<p class="site-prof__text">—</p>';
    }
    if (whyEl) whyEl.innerHTML = `<p class="site-prof__text">${escapeHtml(data.why||'—')}</p>`;
    if (meta) meta.textContent = `${t('sp_updated')} ` + formatTimeHM(new Date());
  } catch(err) {
    console.warn('[siteProfile] render error', err);
  }
}

let _siteProfileModalRef = null;
export function openSiteProfileModal(data) {
  const root = ensureSiteProfileModalRoot();
  _siteProfileModalRef = root;
  const whatBody = root.querySelector('[data-sp-what-body]');
  const howBody = root.querySelector('[data-sp-how-body]');
  const whyBody = root.querySelector('[data-sp-why-body]');
  const meta = root.querySelector('[data-sp-meta]');
  if (whatBody) whatBody.innerHTML = `<p>${escapeHtml(data.what||'—')}</p>`;
  if (howBody) {
    const actions = Array.isArray(data.how)? data.how : [];
    howBody.innerHTML = `<div class="sp-chips">${actions.map(a=>`<span class="sp-chip">${escapeHtml(a)}</span>`).join('')}</div>`;
  }
  if (whyBody) whyBody.innerHTML = `<p>${escapeHtml(data.why||'—')}</p>`;
  const locale = getLang()==='uk' ? 'uk-UA' : 'en-US';
  if (meta) meta.textContent = `${t('sp_generated')} ` + new Date().toLocaleTimeString(locale,{hour:'2-digit',minute:'2-digit'});
  root.classList.remove('hidden');
  requestAnimationFrame(()=> root.classList.add('is-open'));
  const focusables = root.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])');
  (focusables[0]||root).focus();
  if (!root.__tabTrapWired) {
    root.addEventListener('keydown', e => {
      if (e.key === 'Tab') {
        const f = Array.from(root.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')).filter(x=>!x.disabled);
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length-1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    root.__tabTrapWired = true;
  }
}

export function closeSiteProfileModal() {
  if (!_siteProfileModalRef) return;
  _siteProfileModalRef.classList.remove('is-open');
  setTimeout(()=> {
    _siteProfileModalRef?.classList.add('hidden');
    _siteProfileModalRef = null;
  }, 160);
}

function ensureSiteProfileModalRoot() {
  let root = document.querySelector('#site-profile-modal');
  if (!root) {
    root = document.createElement('div');
    root.id = 'site-profile-modal';
    root.className = 'sp-modal hidden';
    root.innerHTML = `
<div class="sp-modal__backdrop" data-sp-close></div>
  <div class="sp-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="sp-modal-title">
    <div class="sp-modal__glow" aria-hidden="true"></div>
    <header class="sp-modal__head">
      <div class="sp-badge" aria-hidden="true">AI</div>
      <h3 id="sp-modal-title" class="sp-modal__title">${t('sp_modal_title')}</h3>
      <button class="sp-modal__close" type="button" aria-label="${t('sp_close')}" data-sp-close>✕</button>
    </header>
    <div class="sp-modal__content">
      <section class="sp-section" data-sp-what>
        <h4 class="sp-sec__title"><span class="sp-sec__icon" aria-hidden="true">🎯</span><span>${t('sp_label_what')}</span></h4>
        <div class="sp-sec__body" data-sp-what-body></div>
      </section>
      <section class="sp-section" data-sp-how>
        <h4 class="sp-sec__title"><span class="sp-sec__icon" aria-hidden="true">🛠️</span><span>${t('sp_label_how')}</span></h4>
        <div class="sp-sec__body" data-sp-how-body></div>
      </section>
      <section class="sp-section" data-sp-why>
        <h4 class="sp-sec__title"><span class="sp-sec__icon" aria-hidden="true">⚡</span><span>${t('sp_label_why')}</span></h4>
        <div class="sp-sec__body" data-sp-why-body></div>
      </section>
      <footer class="sp-footer">
        <p class="sp-meta mono small" data-sp-meta></p>
        <button class="sp-pill" type="button" data-sp-close>${t('sp_footer_ok')}</button>
      </footer>
    </div>
  </div>`;
    document.body.appendChild(root);
    root.addEventListener('click', e => {
      const btn = e.target && (e.target.closest ? e.target.closest('[data-sp-close]') : null);
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        closeSiteProfileModal();
      }
    });
    document.addEventListener('keydown', e => { if (_siteProfileModalRef && e.key === 'Escape') closeSiteProfileModal(); });
  }
  return root;
}

// Refresh modal static texts (title, labels, buttons) without closing
export function refreshSiteProfileModalTexts() {
  const root = document.querySelector('#site-profile-modal');
  if (!root) return;
  const title = root.querySelector('#sp-modal-title');
  if (title) title.textContent = t('sp_modal_title');
  const closeBtn = root.querySelector('.sp-modal__close');
  if (closeBtn) closeBtn.setAttribute('aria-label', t('sp_close'));
  const w = root.querySelector('[data-sp-what] .sp-sec__title span:last-child');
  const h = root.querySelector('[data-sp-how] .sp-sec__title span:last-child');
  const y = root.querySelector('[data-sp-why] .sp-sec__title span:last-child');
  if (w) w.textContent = t('sp_label_what');
  if (h) h.textContent = t('sp_label_how');
  if (y) y.textContent = t('sp_label_why');
  const ok = root.querySelector('.sp-footer .sp-pill');
  if (ok) ok.textContent = t('sp_footer_ok');
}

(function injectSiteProfileModalCSS(){
  const id = 'site-profile-modal-styles';
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = `.sp-modal.hidden{display:none} .sp-modal{position:fixed;inset:0;z-index:1200;display:flex;align-items:center;justify-content:center;font-family:var(--font-sans);} .sp-modal__backdrop{position:absolute;inset:0;background:linear-gradient(120deg,rgba(12 13 16 / .78),rgba(12 13 16 / .6));backdrop-filter:blur(6px) saturate(1.25);animation:spFade .4s ease;} .sp-modal__dialog{position:relative;max-width:760px;width:clamp(330px,74vw,760px);background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-xl);box-shadow:var(--shadow),0 0 0 1px rgba(var(--accent-rgb)/.15);padding:1.25rem 1.55rem 1.55rem;transform:translateY(26px) scale(.94);opacity:0;transition:transform .55s var(--transition),opacity .5s ease;} .sp-modal.is-open .sp-modal__dialog{transform:translateY(0) scale(1);opacity:1;} .sp-modal__glow{position:absolute;inset:0;border-radius:inherit;background:linear-gradient(140deg,rgba(var(--accent-rgb)/.18),rgba(var(--accent-rgb)/0) 60%);mix-blend-mode:overlay;pointer-events:none;opacity:.9;} .sp-modal__head{display:flex;align-items:center;gap:.85rem;margin:0 0 1rem;padding:0 .05rem;} .sp-badge{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:14px;background:var(--accent);font-weight:600;font-size:.78rem;letter-spacing:.08em;color:#082b1f;box-shadow:0 4px 14px -4px rgba(var(--accent-rgb)/.55),0 0 0 1px rgba(var(--accent-rgb)/.35);} .sp-modal__title{margin:0;font-size:1.22rem;letter-spacing:.5px;font-weight:600;background:var(--gradient-text);-webkit-background-clip:text;background-clip:text;color:transparent;} .sp-modal__close{margin-left:auto;background:var(--glass);color:var(--text);border:1px solid var(--border);border-radius:var(--radius);padding:.55rem .7rem;font-size:.85rem;cursor:pointer;line-height:1;display:inline-flex;align-items:center;gap:.4rem;transition:background .3s,border-color .3s,transform .25s ease,box-shadow .4s;} .sp-modal__close:hover{background:rgba(var(--accent-rgb)/.15);border-color:rgba(var(--accent-rgb)/.45);} .sp-modal__close:focus-visible{outline:none;box-shadow:var(--focus);} .sp-modal__close:active{transform:scale(.92);} .sp-modal__content{font-size:.95rem;line-height:1.55;color:var(--text-dim);max-height:65vh;overflow:auto;padding:0 .15rem;} .sp-section{margin:0 0 1.15rem;padding:0 0 .65rem;border-bottom:1px solid rgba(255 255 255 / .06);} .sp-section:last-of-type{border-bottom:none;margin-bottom:.75rem;} .sp-sec__title{display:flex;align-items:center;gap:.55rem;margin:0 0 .45rem;font-size:.7rem;text-transform:uppercase;letter-spacing:.16em;font-weight:600;color:rgba(var(--accent-rgb)/.8);} .sp-sec__icon{font-size:.95rem;filter:drop-shadow(0 2px 6px rgba(0 0 0 /.4));} .sp-sec__body p{margin:.2rem 0 .4rem;color:var(--text);} .sp-chips{display:flex;flex-wrap:wrap;gap:.5rem;margin:.1rem 0 0;} .sp-chip{position:relative;font-size:.68rem;padding:.5rem .7rem .45rem;border-radius:999px;background:linear-gradient(145deg,rgba(var(--accent-rgb)/.25),rgba(var(--accent-rgb)/.55));color:#fff;font-weight:500;letter-spacing:.35px;line-height:1;display:inline-flex;align-items:center;gap:.35rem;animation:chipPop .55s cubic-bezier(.25,1.4,.4,1) both;box-shadow:0 2px 10px -4px rgba(var(--accent-rgb)/.55),0 0 0 1px rgba(var(--accent-rgb)/.4) inset;} .sp-chip:before{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(120deg,rgba(255 255 255 / .3),rgba(255 255 255 / 0) 60%);mix-blend-mode:overlay;opacity:.75;} .sp-chip:nth-child(odd){background:linear-gradient(145deg,rgba(var(--accent-rgb)/.35),rgba(var(--accent-rgb)/.6));} @keyframes chipPop{0%{transform:scale(.5) translateY(8px);opacity:0}60%{transform:scale(1.08) translateY(-2px);}100%{transform:scale(1) translateY(0);opacity:1}} .sp-footer{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.8rem;margin:.35rem 0 0;} .sp-meta{opacity:.55;margin:0;font-size:.63rem;letter-spacing:.5px;} .sp-pill{background:var(--accent);color:#063726;font-weight:600;border:1px solid rgba(var(--accent-rgb)/.4);cursor:pointer;padding:.7rem 1.15rem .65rem;border-radius:var(--radius-lg);font-size:.72rem;letter-spacing:.1em;display:inline-flex;align-items:center;gap:.55rem;position:relative;overflow:hidden;transition:background .45s,transform .4s,filter .5s;box-shadow:0 4px 20px -6px rgba(var(--accent-rgb)/.55);} .sp-pill:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 30% 20%,rgba(255 255 255 /.55),transparent 60%);mix-blend-mode:overlay;opacity:.55;} .sp-pill:hover{filter:brightness(1.08);} .sp-pill:focus-visible{outline:none;box-shadow:var(--focus);} .sp-pill:active{transform:translateY(2px);} @keyframes spFade{from{opacity:0}to{opacity:1}} @media (max-width:640px){ .sp-modal__dialog{width:92vw;padding:1.05rem 1.05rem 1.2rem;} .sp-sec__title{font-size:.66rem;} .sp-chip{font-size:.6rem;padding:.45rem .6rem .4rem;} } @media (prefers-reduced-motion: reduce){ .sp-modal__dialog, .sp-chip, .sp-modal__backdrop{animation:none!important;transition:none!important;} }`;
  document.head.appendChild(style);
})();

function formatTimeHM(d){
  const hh = String(d.getHours()).padStart(2,'0');
  const mm = String(d.getMinutes()).padStart(2,'0');
  return `${hh}:${mm}`;
}

function escapeHtml(str) {
  return String(str||'').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]||c));
}

// Expose for i18n refresh hooks
window.addOrUpdateSiteProfileBlock = addOrUpdateSiteProfileBlock;
window.openSiteProfileModal = openSiteProfileModal;
window.closeSiteProfileModal = closeSiteProfileModal;
window.refreshSiteProfileModalTexts = refreshSiteProfileModalTexts;
