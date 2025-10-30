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
    <p>Це інтерактивний сайт-портфоліо з AI Console. Введи команди на кшталт <code>/help</code>, <code>/stack</code>, <code>/projects react</code> — і побачиш миттєву реакцію інтерфейсу.</p>

    <div class="welcome-modal__doc" role="document" aria-label="Документація">
      <h4 style="margin:.1rem 0 .6rem">Опис роботи</h4>
      <ul class="welcome-modal__list">
        <li><strong>Мета:</strong> показати взаємодію користувача через запити до нейромережі та рендер дій на сторінці.</li>
        <li><strong>Концепція:</strong> мінімалістичний інтерфейс з AI Console, що відкриває панелі, фільтрує проєкти, показує контакти й журнал.</li>
        <li><strong>Як працює:</strong> поле чату приймає команди → парсер визначає намір → AI Hub відображає Live/Стек/Команди/Журнал; список проєктів фільтрується миттєво.</li>
        <li><strong>Зображення:</strong> превʼю підключені статично як <code>&lt;img src="/projectImg/..."&gt;</code> з папки <code>public/</code>.</li>
      </ul>

      <h4 style="margin:1rem 0 .5rem">Використані технології</h4>
      <ul class="welcome-modal__list">
        <li>HTML5: семантика, ARIA.</li>
        <li>CSS3: Variables, Grid/Flex, адаптивність.</li>
        <li>JavaScript ES Modules: рендер і фільтр проєктів, керування панелями.</li>
        <li>Vite: dev server + HMR, білд, <code>public/</code> для статичних ассетів.</li>
      </ul>

      <h4 style="margin:1rem 0 .5rem">Архітектура модулів</h4>
      <ul class="welcome-modal__list">
        <li><code>main.js</code> — ініціалізація, обробка команд AI Console.</li>
        <li><code>projectsRender.js</code> — рендер/фільтр проєктів.</li>
        <li><code>infoBlocks.js</code>, <code>stackRender.js</code>, <code>socialIcons.js</code> — UI підпанелі.</li>
      </ul>

      <h4 style="margin:1rem 0 .5rem">Швидкий старт</h4>
      <ul class="welcome-modal__list">
        <li>Відкрийте чат унизу й надішли <code>/help</code>.</li>
        <li>Спробуйте <code>/projects civic</code> щоб відфільтрувати список.</li>
        <li>Команда <code>/contact</code> відкриє контакти.</li>
        <li>Якщо написати в чат: <code>"Приховай форму/команди/журнал/живий вивід"</code>, то елементи зникнуть, як і з'являть при написанні у чат: <code>"Покажи форму/команди/журнал/живий вивід"</code> (взаємодія відбувається у AI Hub)</li>
      </ul>
    </div>

    <p style="opacity:.85">Підказка: команди працюють і з клавіатури. Enter — надіслати, Shift+Enter — новий рядок.</p>
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
