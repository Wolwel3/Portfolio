/**
 * infoBlocks.js
 * -------------------------------------------------------------
 * Логіка акордеон-подібної взаємодії для "інфо-блоків":
 *  - Додає керування згортанням/розгортанням із ARIA атрибутами.
 *  - Анімує max-height для плавності.
 *  - Підтримує багато блоків у контейнері [data-info-blocks].
 *
 * ДИЗАЙН-РІШЕННЯ:
 *  - Inline max-height знімається після transitionend, щоб адаптуватися до змін контенту.
 *  - Реєстрація події на контейнері (делегування) — менше слухачів.
 *
 * МОЖЛИВІ ПОКРАЩЕННЯ:
 *  - Додавання кнопки "Згорнути всі".
 *  - Збереження стану (localStorage) між сесіями.
 */

function initInfoBlocks() {
  const container = document.querySelector('[data-info-blocks]');
  if (!container) return;

  // Ініціалізація: додати атрибути aria-expanded, якщо відсутні
  container.querySelectorAll('.info-block').forEach(block => {
    const btn = block.querySelector('.info-block__toggle');
    const body = block.querySelector('.info-block__body');
    if (!btn || !body) return;
    if (!btn.hasAttribute('aria-expanded')) btn.setAttribute('aria-expanded','true');
    btn.setAttribute('type','button');
  });

  container.addEventListener('click', e => {
    const btn = e.target.closest('.info-block__toggle');
    if (!btn) return;
    const block = btn.closest('.info-block');
    const body = block?.querySelector('.info-block__body');
    if (!body) return;

    const isCollapsed = block.classList.toggle('is-collapsed');
    btn.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
    btn.textContent = isCollapsed ? '+' : '−';

    // Щоб анімація max-height знала фінальну висоту при розгортанні
    if (!isCollapsed) {
      // Тимчасово виставити max-height на фактичну
      body.style.maxHeight = body.scrollHeight + 'px';
      // Після завершення анімації прибрати інлайн, щоб авто-підлаштовувалось при зміні контенту
      body.addEventListener('transitionend', function tidy(ev){
        if (ev.propertyName === 'max-height' && !block.classList.contains('is-collapsed')) {
          body.style.removeProperty('max-height');
          body.removeEventListener('transitionend', tidy);
        }
      });
    } else {
      // При згортанні явно ставимо попередню висоту (якщо авто) перед обнуленням для плавності
      if (!body.style.maxHeight) {
        body.style.maxHeight = body.scrollHeight + 'px';
        // форс reflow
        void body.offsetHeight;
      }
      // Потім плавно до 0
      requestAnimationFrame(()=> body.style.maxHeight = '0px');
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initInfoBlocks);
} else {
  initInfoBlocks();
}

console.info('[info-blocks] initialized');
