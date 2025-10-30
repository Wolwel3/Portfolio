/**
 * projectsRender.js
 * -------------------------------------------------------------
 * Рендер гріда проектів у DOM з масиву PROJECTS. Відокремлює подання (HTML)
 * від джерела даних (projectsData.js).
 *
 * ФУНКЦІЇ:
 *  - projectCardHTML(p) → шаблон картки.
 *  - renderProjects(list?) → замінює вміст .projects__grid.
 *  - filterAndRenderProjects(filter) → фільтрує й оновлює.
 *
 * UX НЮАНСИ:
 *  - Знімає клас placeholder-cards.
 *  - Обрізає списки tech/tags до обмеженої кількості для компактності.
 */
import { PROJECTS, findProjects } from './projectsData.js';
import { getLang } from './core/i18n.js';
import { assetUrl } from './assetUrl.js';

function projectCardHTML(p){
  const techList = p.tech.slice(0,6).map(t=>`<li>${t}</li>`).join('');
  const tags = p.tags?.length ? `<ul class="project-card__tags">${p.tags.slice(0,4).map(t=>`<li>${t}</li>`).join('')}</ul>` : '';
  const links = p.links ? Object.entries(p.links).filter(([,v])=>!!v).map(([k,v])=>`<a href="${v}" target="_blank" rel="noopener" class="project-link project-link--${k}">${k}</a>`).join('') : '';
  const titleHTML = p.links?.live ? `<a class="project-card__title-link" href="${p.links.live}" target="_blank" rel="noopener" title="Відкрити live">${p.title}</a>` : p.title;
  const imgSrc = p.thumb ? assetUrl(p.thumb) : null;
  const lang = getLang();
  let short = '';
  if (typeof p.short === 'string') short = p.short;
  else if (p.short && (p.short[lang] || p.short.uk || p.short.en)) short = p.short[lang] || p.short.uk || p.short.en || '';
  return `<div class="project-card" data-project="${p.id}" data-status="${p.status||''}">
    <div class="project-card__thumb">${imgSrc?`<img src="${imgSrc}" alt="${p.title}" loading="lazy">`:'<div class="thumb-ph" aria-hidden="true"></div>'}</div>
    <div class="project-card__body">
      <h3 class="project-card__title">${titleHTML}</h3>
      <p class="project-card__desc">${short||''}</p>
      <ul class="project-card__tech mono">${techList}</ul>
      ${tags}
      <div class="project-card__meta mono small"><span>${p.role}</span> • <span>${p.year}</span></div>
      ${links?`<div class="project-card__links">${links}</div>`:''}
    </div>
  </div>`;
}

export function renderProjects(list=PROJECTS){
  const grid = document.querySelector('.projects__grid');
  if(!grid) return;
  grid.classList.remove('placeholder-cards');
  grid.innerHTML = list.map(projectCardHTML).join('');
  addProjectImageFallbacks();
}

export function filterAndRenderProjects(filter){
  const list = findProjects(filter);
  renderProjects(list);
}

// Auto-render on module load
renderProjects();

// Expose for debugging
window.__PROJECTS = PROJECTS;
window.renderProjects = renderProjects;
window.filterAndRenderProjects = filterAndRenderProjects;

// --- Image fallback handling -----------------------------------------
function addProjectImageFallbacks(){
  const imgs = document.querySelectorAll('.project-card__thumb img');
  imgs.forEach(img => {
    if(img.dataset.fallbackBound) return; // avoid duplicate listeners
    img.dataset.fallbackBound = '1';
    img.addEventListener('error', () => {
      // Build inline SVG placeholder with project title
      const title = (img.alt || 'Project').replace(/</g,'&lt;').replace(/&/g,'&amp;').slice(0,40);
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360' viewBox='0 0 640 360'>`+
        `<defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop stop-color='%2310b981' offset='0'/><stop stop-color='%2384cc16' offset='1'/></linearGradient></defs>`+
        `<rect fill='%2322262e' width='640' height='360'/>`+
        `<rect fill='url(%23g)' opacity='0.22' width='640' height='360'/>`+
        `<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239aa6b4' font-family='Inter,Arial,sans-serif' font-size='32' font-weight='600'>${title}</text>`+
      `</svg>`;
      const dataUri = 'data:image/svg+xml,' + encodeURIComponent(svg);
      img.src = dataUri;
      img.classList.add('is-fallback');
    }, { once: true });
  });
}
