/**
 * ui/contactForm.js
 * -------------------------------------------------------------
 * Рендер блоку контактної форми в AI Hub і обробка відправки (mailto).
 * Оновлює тексти під поточну мову, підставляє email з профілю.
 */
// ui/contactForm.js — Рендер блоку контактної форми та обробка (mailto)

import { t, getLang } from '../core/i18n.js';

export function addOrUpdateContactFormBlock(opts = {}) {
  try {
    const p = (typeof getUserProfile === 'function') ? getUserProfile() : null;
    const toEmail = p?.contacts?.email || 'wwoollwweell@gmail.com';
    const container = document.querySelector('[data-info-blocks]');
    if (!container) return;
    let block = container.querySelector('[data-contact-form]');
    const hash = JSON.stringify({ toEmail, purpose: opts.purpose || '' });
    let wasCreated = false;
    if (!block) {
      block = document.createElement('article');
      block.className = 'info-block';
      block.setAttribute('data-block','');
      block.setAttribute('data-contact-form','');
      block.innerHTML = `
        <header class="info-block__head">
          <h4 class="info-block__title">${t('contact_form_title')}</h4>
          <button class="info-block__toggle" aria-expanded="true" aria-label="${t('collapse_section')}" type="button">−</button>
        </header>
        <div class="info-block__body">
          <form class="contact-form" data-contact-form-el novalidate>
            <div class="cf-row">
              <label class="cf-label" for="cf-name">${t('cf_label_name')}</label>
              <input class="cf-input" id="cf-name" name="name" autocomplete="name" placeholder="${t('cf_placeholder_name')}" />
            </div>
            <div class="cf-row">
              <label class="cf-label" for="cf-email">${t('cf_label_email')}</label>
              <input class="cf-input" id="cf-email" name="email" type="email" autocomplete="email" placeholder="${t('cf_placeholder_email')}" required />
            </div>
            <div class="cf-row">
              <label class="cf-label" for="cf-message">${t('cf_label_message')}</label>
              <textarea class="cf-textarea" id="cf-message" name="message" rows="4" placeholder="${t('cf_placeholder_message')}" required></textarea>
            </div>
            <div class="cf-actions">
              <button type="submit" class="dock-btn primary">${t('cf_submit')}</button>
              <span class="cf-status mono small" aria-live="polite"></span>
            </div>
            <p class="mono small" style="opacity:.7">${t('cf_or_email')} <a href="mailto:${encodeURIComponent(toEmail)}">${escapeHtml(toEmail)}</a></p>
          </form>
        </div>`;
      container.prepend(block);
      wasCreated = true;
    }
    block.dataset.hash = hash;

    // Always refresh localized texts on update
    try {
      const titleEl = block.querySelector('.info-block__title');
      if (titleEl) titleEl.textContent = t('contact_form_title');
      const toggleBtn = block.querySelector('.info-block__toggle');
      if (toggleBtn) toggleBtn.setAttribute('aria-label', t('collapse_section'));
      const lblName = block.querySelector('label[for="cf-name"]');
      if (lblName) lblName.textContent = t('cf_label_name');
      const inputName = block.querySelector('#cf-name');
      if (inputName) inputName.setAttribute('placeholder', t('cf_placeholder_name'));
      const lblEmail = block.querySelector('label[for="cf-email"]');
      if (lblEmail) lblEmail.textContent = t('cf_label_email');
      const inputEmail = block.querySelector('#cf-email');
      if (inputEmail) inputEmail.setAttribute('placeholder', t('cf_placeholder_email'));
      const lblMsg = block.querySelector('label[for="cf-message"]');
      if (lblMsg) lblMsg.textContent = t('cf_label_message');
      const inputMsg = block.querySelector('#cf-message');
      if (inputMsg) inputMsg.setAttribute('placeholder', t('cf_placeholder_message'));
      const submitBtn = block.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.textContent = t('cf_submit');
      const orEmailP = block.querySelector('.info-block__body p.mono.small');
      if (orEmailP) {
        orEmailP.firstChild && (orEmailP.firstChild.textContent = t('cf_or_email') + ' ');
      }
    } catch {}

    const form = block.querySelector('[data-contact-form-el]');
    if (form) {
      const msgEl = form.querySelector('#cf-message');
      if (msgEl && opts.purpose && !msgEl.value) msgEl.value = opts.purpose;
      if (!form.__wired) {
        form.addEventListener('submit', e => {
          e.preventDefault();
          const status = form.querySelector('.cf-status');
          const name = (form.querySelector('#cf-name')?.value || '').trim();
          const email = (form.querySelector('#cf-email')?.value || '').trim();
          const message = (form.querySelector('#cf-message')?.value || '').trim();
          const errs = [];
          if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.push(t('cf_err_invalid_email'));
          if (!message) errs.push(t('cf_err_empty_message'));
          if (errs.length) { if (status) status.textContent = errs.join(' • '); return; }
          const subject = encodeURIComponent(`${getLang()==='uk' ? 'Запит з портфоліо' : 'Portfolio inquiry'}${name? ' — '+name : ''}`);
          const bodyLines = [ name ? `${getLang()==='uk' ? "Ім'я" : 'Name'}: ${name}` : null, `Email: ${email}`, '', message ].filter(Boolean);
          const body = encodeURIComponent(bodyLines.join('\n'));
          const href = `mailto:${toEmail}?subject=${subject}&body=${body}`;
          if (status) status.textContent = t('cf_opening_mail');
          window.location.href = href;
          // optional chat notify bridge
          if (typeof window.__pushChatMessage === 'function') {
            window.__pushChatMessage('bot', `${escapeHtml(t('cf_prepared_prefix'))} <a href="mailto:${escapeHtml(toEmail)}">${escapeHtml(toEmail)}</a>.`);
          }
        });
        form.__wired = true;
      }
    }

    // Auto-scroll to the form when it appears or gets updated (unless explicitly disabled)
    if (opts.scroll !== false) {
      try {
        const target = block;
        // Wait a frame to ensure layout is ready
        requestAnimationFrame(()=> target.scrollIntoView({ behavior:'smooth', block:'start', inline:'nearest' }));
      } catch {}
    }
  } catch(err) {
    console.warn('[contactForm] render error', err);
  }
}

export function showContactForm(){
  let block = document.querySelector('[data-contact-form]');
  if (!block) {
    addOrUpdateContactFormBlock({ purpose: '', scroll: true });
    block = document.querySelector('[data-contact-form]');
  }
  if (block) {
    block.style.display = '';
    try { block.scrollIntoView({ behavior:'smooth', block:'start', inline:'nearest' }); } catch {}
  }
}

export function hideContactForm(){
  const block = document.querySelector('[data-contact-form]');
  if (block) block.style.display = 'none';
}

export function toggleContactForm(){
  let block = document.querySelector('[data-contact-form]');
  if (!block) {
    addOrUpdateContactFormBlock({ purpose: '', scroll: true });
    block = document.querySelector('[data-contact-form]');
  }
  if (!block) return;
  const willShow = (block.style.display === 'none');
  block.style.display = willShow ? '' : 'none';
  if (willShow) {
    try { block.scrollIntoView({ behavior:'smooth', block:'start', inline:'nearest' }); } catch {}
  }
}

function escapeHtml(str) {
  return String(str||'').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]||c));
}

// Expose for i18n refresh hooks (optional)
window.addOrUpdateContactFormBlock = addOrUpdateContactFormBlock;
