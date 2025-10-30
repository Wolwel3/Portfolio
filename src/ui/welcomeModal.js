/**
 * ui/welcomeModal.js
 * -------------------------------------------------------------
 * Прості модальні вітання з коротким описом можливостей сайту.
 * API: openWelcomeModal(), closeWelcomeModal(), initWelcomeModal().
 */
const MODAL_ID = 'welcome-modal';
let modalRoot = null;

function ensureModal() {
  if (modalRoot) return modalRoot;
  modalRoot = document.createElement('div');
  modalRoot.id = MODAL_ID;
  modalRoot.className = 'welcome-modal hidden';
  modalRoot.innerHTML = `
<div class="welcome-modal__backdrop" data-welcome-close></div>
<div class="welcome-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
  <header class="welcome-modal__header">
    <div class="welcome-modal__badge" aria-hidden="true">AI</div>
    <h3 id="welcome-title" class="welcome-modal__title">Вітаю!</h3>
    <button class="welcome-modal__close" type="button" data-welcome-close aria-label="Закрити">✕</button>
  </header>
  <div class="welcome-modal__content">
  <p>Це інтерактивний сайт Артема Подоби, де через запити до нейромережі можна керувати блоками сторінки, відкривати форми й отримувати пояснення про проєкти.</p>
    <ul class="welcome-modal__list">
      <li><strong>AI Console</strong>: приймає команди, відкриває панелі, відповідає на питання.</li>
      <li><strong>AI Hub</strong>: показує живий вивід, стек, командний список та журнал дій.</li>
      <li><strong>Проекти</strong>: фільтрація за технологіями, запити через /projects.</li>
      <li><strong>Контакти</strong>: контактна форма відкривається на вимогу прямо в AI Hub.</li>
    </ul>
    <p>Щоб швидко побачити ці можливості, натисніть кнопку нижче або використайте команду <code>/help</code> у консолі.</p>
  </div>
  <footer class="welcome-modal__footer">
    <button class="welcome-modal__cta" type="button" data-welcome-close>Зрозуміло, перейти до сайту</button>
  </footer>
</div>`;
  document.body.appendChild(modalRoot);
  modalRoot.addEventListener('click', (e) => {
    if (e.target.closest('[data-welcome-close]')) {
      e.preventDefault();
      closeWelcomeModal();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (modalRoot && !modalRoot.classList.contains('hidden') && e.key === 'Escape') {
      closeWelcomeModal();
    }
  });
  return modalRoot;
}

export function openWelcomeModal() {
  const root = ensureModal();
  root.classList.remove('hidden');
  requestAnimationFrame(() => root.classList.add('is-open'));
  const dialog = root.querySelector('.welcome-modal__dialog');
  const focusable = dialog?.querySelector('[data-welcome-close]');
  focusable?.focus({ preventScroll: true });
}

export function closeWelcomeModal() {
  if (!modalRoot) return;
  modalRoot.classList.remove('is-open');
  setTimeout(() => {
    modalRoot?.classList.add('hidden');
  }, 180);
}

export function initWelcomeModal() {
  ensureModal();
}

window.openWelcomeModal = openWelcomeModal;
