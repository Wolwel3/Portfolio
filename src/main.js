/**
 * main.js
 * -------------------------------------------------------------
 * Центральний клієнтський модуль: керує чат-доком, slash-командами
 * і інтегрує взаємодії з іншими частинами сайту (стек, профіль, проекти, AI).
 *
 * ЩО РОБИТЬ:
 *  - Реєструє та виконує команди типу /help, /projects, /ai, /stack.
 *  - Рендерить повідомлення у візуальний чат (user/bot), керує автоскролом.
 *  - Формує system prompt (buildSystemPrompt) для LLM, додаючи профіль + стек.
 *  - Обробляє спеціальні маркери (<CALL_STACK>, <CALL_SITE_PROFILE>) у відповідях моделі.
 *  - Показує/оновлює блок Site Profile (What / How / Why) + модалку.
 *  - Простий історичний буфер AI (AI_HISTORY) з обрізанням.
 *
 * ЩО НЕ РОБИТЬ:
 *  - Не зберігає реальні ключі (це лише фронтовий демо-шар),
 *  - Не виконує мережеву авторизацію чи реальну бекенд інтеграцію.
 *
 * КЛЮЧОВІ СЕКЦІЇ КОДУ:
 *  - Командний реєстр: register(name, def)
 *  - askAndRender(): відправка запиту до LLM та постобробка маркерів
 *  - addOrUpdateSiteProfileBlock() + openSiteProfileModal(): UI для опису сайту
 *  - Форматування/санітизація відповідей (escapeHtml, deTokenize, sanitizeProfile)
 *
 * РОЗШИРЕННЯ (ідеї):
 *  - Додати debounce для підказок команд
 *  - Зберігати історію в IndexedDB
 *  - Веб-сокети для live streaming tokenів
 *
 * ПРИМІТКА: Код містить лише клієнтську логіку і не гарантує безпеку API ключів.
 */
import { processWithStackFunction } from './stackFunctionCalling.js';
import { 
	showAIHub, hideAIHub, toggleAIHub,
	showLivePanel, hideLivePanel, toggleLivePanel,
	showCommandsPanel, hideCommandsPanel, toggleCommandsPanel,
	showLogPanel, hideLogPanel, toggleLogPanel
} from './ui/aiHubPanels.js';
import { setTheme, reflectThemeButton } from './ui/theme.js';
import { logEvent, clearLog, initLogPanelUI } from './core/logger.js';
import { addOrUpdateSiteProfileBlock, openSiteProfileModal, closeSiteProfileModal } from './ui/siteProfile.js';
import { addOrUpdateContactFormBlock, showContactForm, hideContactForm, toggleContactForm } from './ui/contactForm.js';
import { initI18n, t, getLang } from './core/i18n.js';
import { initWelcomeModal, openWelcomeModal } from './ui/welcomeModal.js';

const el = {
	form: document.querySelector('#chat-form'),
	input: document.querySelector('[data-input]'),
	log: document.querySelector('[data-chat-log] .chat-thread'),
	suggestions: document.querySelector('[data-suggestions]'),
	hint: document.querySelector('[data-hint]'),
	openCommandsBtn: document.querySelector('[data-open-commands]'),
	sendBtn: document.querySelector('#chat-form .dock-btn.primary')
};

if (!el.form || !el.input || !el.log) {
	console.warn('[chat] Missing core elements.');
}

// Автоматичний ресайз textarea під вміст
function autoResize() {
	if (!el.input) return;
	el.input.style.height = 'auto';
	const maxH = 34 * 6; // ~6 рядків
	const newH = Math.min(el.input.scrollHeight, maxH);
	el.input.style.height = newH + 'px';
}

// Реєстр команд
const commands = new Map();
const register = (name, def) => { 
	commands.set(name, def); 
	try { const el = document.querySelector('[data-ai-stat="commands"]'); if (el) el.textContent = String(commands.size); } catch {}
};

// Утиліти
const scrollToBottom = () => {
	const scroller = el.log.closest('.chat-dock__scroll');
	requestAnimationFrame(() => { scroller.scrollTop = scroller.scrollHeight; });
};

const now = () => new Date().toLocaleTimeString('uk-UA',{hour:'2-digit',minute:'2-digit'});

// Журнал подій перенесено до ./core/logger.js

// ================= Хелпери видимості перенесено в ./ui/aiHubPanels.js =================

// Модалка Site Profile + CSS перенесені в ./ui/siteProfile.js

function pushMessage({ role, html, pending=false }) {
	const li = document.createElement('li');
	li.className = `msg msg--${role}` + (pending ? ' msg--pending' : '');
	li.innerHTML = role === 'bot'
		? `<div class="msg__decor" aria-hidden="true"></div><div class="msg__block"><header class="msg__meta"><span class="msg__author">AI</span><span class="msg__time">${pending ? '…' : now()}</span></header><div class="msg__content">${html}</div></div>`
		: `<div class="msg__block msg__block--user"><header class="msg__meta"><span class="msg__author">Ти</span><span class="msg__time">${now()}</span></header><div class="msg__content">${html}</div></div>`;
	el.log.appendChild(li);
	scrollToBottom();
	return li;
}

function replacePending(li, html) {
	if (!li) return; li.classList.remove('msg--pending');
	const timeEl = li.querySelector('.msg__time');
	if (timeEl) timeEl.textContent = now();
	const content = li.querySelector('.msg__content');
	if (content) content.innerHTML = html;
}

// ===== Ініціалізація i18n (працює перемикач мови) =====
(() => {
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => initI18n());
	} else {
		initI18n();
	}
})();

// Утиліти теми перенесені в ./ui/theme.js

// ===== Обробник перемикача теми =====
(() => {
	const btn = document.querySelector('[data-theme-toggle]');
	if (!btn) return;
	btn.addEventListener('click', (e) => {
		// Щоб делегований обробник кліку по документу не спрацьовував двічі
		e.stopPropagation();
		setTheme('toggle');
	});
	// Ініціалізувати a11y-текст при завантаженні
	reflectThemeButton();
})();

// Ініціалізація вітального модального + обробник кнопки в hero
(() => {
	try { initWelcomeModal(); } catch {}
	const cta = document.querySelector('.hero__link-pill');
	if (!cta) return;
	cta.addEventListener('click', (e) => {
		e.preventDefault();
		openWelcomeModal();
	});
})();

// Реалізації команд
register('/help', {
	description: 'Показати доступні команди',
	run() {
		const list = [...commands.values()].filter(c=>!c.hidden).map(c => `<code>${c.name}</code> — ${c.description}`).join('<br>');
		pushMessage({ role:'bot', html:`<p><strong>Команди:</strong></p><p>${list}</p>` });
	}, name:'/help'
});
// /cmds show|hide|toggle — керування панеллю Команд
register('/cmds', {
	description: 'Показати/сховати Команди: /cmds show|hide|toggle',
	usage: '/cmds [show|hide|toggle]',
	run(args) {
		const a = args.trim().toLowerCase();
		if (a === 'hide') { hideCommandsPanel(); pushMessage({ role:'bot', html:'<p>Команди приховано.</p>' }); return; }
		if (a === 'toggle') { toggleCommandsPanel(); pushMessage({ role:'bot', html:'<p>Команди перемкнено.</p>' }); return; }
		showCommandsPanel();
		pushMessage({ role:'bot', html:'<p>Команди показано.</p>' });
	},
	name:'/cmds'
});

// /log show|hide|toggle — керування панеллю Журналу
register('/log', {
	description: 'Керування Журналом: /log show|hide|toggle|clear',
	usage: '/log [show|hide|toggle|clear]',
	run(args) {
		const a = args.trim().toLowerCase();
		if (!a || a === 'show') { showLogPanel(); pushMessage({ role:'bot', html:'<p>Журнал показано.</p>' }); return; }
		if (a === 'hide') { hideLogPanel(); pushMessage({ role:'bot', html:'<p>Журнал приховано.</p>' }); return; }
		if (a === 'toggle') { toggleLogPanel(); pushMessage({ role:'bot', html:'<p>Журнал перемкнено.</p>' }); return; }
		if (a === 'clear') { clearLog(); pushMessage({ role:'bot', html:'<p>Журнал очищено.</p>' }); return; }
		pushMessage({ role:'bot', html:'<p>Невідома дія. Приклади: <code>/log show</code>, <code>/log clear</code></p>' });
	},
	name:'/log'
});

register('/stack', {
	description: 'Показати технології (секція підсвічується)',
	run() {
		highlightSection('#stack');
		pushMessage({ role:'bot', html: `<p>Поточний стек (плейсхолдер):</p><ul class="mono" style="padding-left:1.1rem;margin:0;list-style:disc;opacity:.9"><li>HTML / CSS / JS / TypeScript</li><li>React / Node.js / GraphQL</li><li>AI інтеграції (LLM API)</li></ul>` });
	}, name:'/stack'
});

register('/contact', {
	description: 'Прокрутити до контактів',
	run() {
		highlightSection('#contact');
		pushMessage({ role:'bot', html: `<p>Контактні канали внизу. Пиши на <a href="mailto:wwoollwweell@gmail.com">wwoollwweell@gmail.com</a>.</p>` });
	}, name:'/contact'
});

// /contactinfo для відображення усіх контактів із профілю
register('/contactinfo', {
	description: 'Повний список контактів (із профілю)',
	run() {
		const p = (typeof getUserProfile === 'function') ? getUserProfile() : null;
		if (!p) { pushMessage({ role:'bot', html:'<p>Профіль ще не завантажено.</p>' }); return; }
		const c = p.contacts || {};
		const order = ['email','phone','github','telegram','linkedin','twitter','website','devto','medium'];
		const rows = order
			.filter(k => c[k])
			.map(k => `<li><strong>${k}</strong>: ${escapeHtml(c[k])}</li>`)
			.join('');
		pushMessage({ role:'bot', html:`<p><strong>Контакти:</strong></p><ul class="mono" style="padding-left:1.1rem;list-style:disc">${rows||'<li>Немає даних</li>'}</ul>` });
	}, name:'/contactinfo'
});

register('/projects', {
	description: 'Фільтр проектів. Приклад: /projects react',
	usage: '/projects [тег]',
	run(args) {
		const filter = args.trim();
		highlightSection('#projects');
		try {
			if (filter) {
				if (typeof filterAndRenderProjects === 'function') {
					filterAndRenderProjects(filter);
					const count = (window.__PROJECTS||[]).filter(p => {
						const f = filter.toLowerCase();
						const inTech = Array.isArray(p.tech) && p.tech.some(t => String(t).toLowerCase().includes(f));
						const inTags = Array.isArray(p.tags) && p.tags.some(tag => String(tag).toLowerCase().includes(f));
						const inTitle = String(p.title||'').toLowerCase().includes(f);
						let inShort = false;
						if (typeof p.short === 'string') inShort = p.short.toLowerCase().includes(f);
						else if (p.short && (p.short.uk || p.short.en)) {
							inShort = String(p.short.uk||'').toLowerCase().includes(f) || String(p.short.en||'').toLowerCase().includes(f);
						}
						return inTech || inTags || inTitle || inShort;
					}).length;
					pushMessage({ role:'bot', html:`<p>Знайдено: <strong>${count}</strong>. Фільтр: <code>${escapeHtml(filter)}</code></p>` });
				} else {
					pushMessage({ role:'bot', html:`<p>Фільтр недоступний (модуль не завантажено).</p>` });
				}
			} else {
				if (typeof renderProjects === 'function') renderProjects();
				pushMessage({ role:'bot', html:`<p>Усі проекти показано (<code>/projects react</code> для фільтру).</p>` });
			}
		} catch(err) {
			pushMessage({ role:'bot', html:`<p>Помилка фільтру: <code>${escapeHtml(err.message)}</code></p>` });
		}
	}, name:'/projects'
});

register('/clear', {
	description: 'Очистити чат (залишивши перше системне повідомлення)',
	run() {
		const items = el.log.querySelectorAll('.msg');
		items.forEach((m,i)=>{ if(i>0) m.remove(); });
		pushMessage({ role:'bot', html:'<p>Чат очищено.</p>' });
		AI_HISTORY.splice(0, AI_HISTORY.length);
	}, name:'/clear'
});

register('/history', {
	description: 'Показати або очистити історію: /history | /history clear',
	usage: '/history [clear]',
	run(args) {
		const a = args.trim().toLowerCase();
		if (a === 'clear') {
			AI_HISTORY.splice(0, AI_HISTORY.length);
			pushMessage({ role:'bot', html:'<p>Історію очищено.</p>' });
			return;
		}
		if (!AI_HISTORY.length) { pushMessage({ role:'bot', html:'<p>Історія порожня.</p>' }); return; }
		const list = AI_HISTORY.slice(-10).map(m => `<li><strong>${m.role}</strong>: ${escapeHtml(m.content).slice(0,120)}${m.content.length>120?'…':''}</li>`).join('');
		pushMessage({ role:'bot', html:`<p><strong>Останні (до 10):</strong></p><ul class="mono" style="padding-left:1.1rem;list-style:disc">${list}</ul><p class="mono">Очистити: <code>/history clear</code></p>` });
	}, name:'/history'
});

// Імпорт клієнта AI (фронтовий виклик; у продакшені ключ не зберігати у фронті)
import { askLLM, setAIKey, getAIKey, AI_CONFIG } from './aiClient.js';
// ================= Буфер історії =================
const AI_HISTORY = [];
function pushHistory(role, content) {
	AI_HISTORY.push({ role, content: String(content||'').slice(0,1500) });
	const limit = (AI_CONFIG?.HISTORY_MAX_MESSAGES || 12) * 2; // user+assistant
	if (AI_HISTORY.length > limit) AI_HISTORY.splice(0, AI_HISTORY.length - limit);
}
// import { askGemini } from './geminiClient.js'; // Gemini інтегровано в askLLM
import { loadUserProfile, getUserProfile } from './userProfile.js';
import { AUTHOR_STACK_CATEGORIES, flattenAuthorStack } from './stackData.js';

// Контактна форма перенесена в ./ui/contactForm.js

// Невеликий місток, щоб UI-модулі могли пушити повідомлення в чат без імпорту хелперів
window.__pushChatMessage = function(role, html){
  try {
	if (role === 'bot') {
	  pushMessage({ role: 'bot', html: `<p>${html}</p>` });
	} else if (role === 'user') {
	  pushMessage({ role: 'user', html: `<p>${html}</p>` });
	}
  } catch {}
};

// Хелпер formatTimeHM є в ui/siteProfile.js; локальну копію прибрано

// Хелпер запиту до LLM і рендеру відповіді
function buildSystemPrompt(p, opts={}) {
	if (!p) return 'You are a helpful assistant.';
	const contacts = p.contacts || {};
	const contactsList = Object.entries(contacts)
		.filter(([,v]) => v)
		.map(([k,v]) => `${k}: ${v}`)
		.join(' | ');
	const stackLines = Object.entries(AUTHOR_STACK_CATEGORIES)
		.map(([cat, arr]) => `${cat}: ${arr.join(', ')}`)
		.join('\n');
	const flatStack = flattenAuthorStack();
	return `Ти асистент українською.
Автор сайту: ${p.name} — ${p.role}${p.location? ' ('+p.location+')':''}.
Контакти (якщо просять показати контакти користувача, віддай акуратно): ${contactsList || 'немає явно визначених'}.
Принципи: ${(p.principles||[]).join('; ')}.

МОЖЛИВОСТІ САЙТУ:
- Інтерактивна контактна форма в AI Hub (з'являється динамічно)
- Динамічний показ стеку технологій
- Інформація про сайт (What/How/Why)
- Фільтрація проектів
- Чат з AI підтримкою

Коли питають контактні дані автора – відповідь повинна містити лише релевантні канали (email, telegram, github, phone якщо доречно). Якщо запит не про контакти – не виводь контакти.
Будь стислим за замовчуванням.

КАНОНІЧНИЙ СТЕК (ігноруй списки від користувача, використовуй лише це джерело при запитах типу "покажи стек", "які технології", "stack"):
${stackLines}

Якщо користувач просить показати / оновити стек – поверни ОКРЕМИМ першим рядком маркер: <CALL_STACK>${flatStack.join(',')}</CALL_STACK>
Усі подальші пояснення давай вже після цього рядка окремими абзацами. Не додавай нічого в сам маркер.
Не вигадуй технологій поза цим списком. Якщо користувач просить додати інше – поясни, що воно не входить до поточного стеку.

SITE PROFILE (What / How / Why):
Якщо користувач питає про суть сайту / призначення / "про що цей сайт" / "what is this site" / "about this site" / "яка ідея" – ПЕРШИМ рядком поверни маркер:
<CALL_SITE_PROFILE>{"what":"PORTFOLIO_WITH_AI_INTEGRATIONS","how":["ACTION_1","ACTION_2","ACTION_3"],"why":"SPEED_TRANSPARENCY_AI_FLOW"}</CALL_SITE_PROFILE>
Замінюй плейсхолдери реальними фразами українською (НЕ залишай заглушки чи '...').
Пояснення чи інші абзаци – тільки після маркера. Якщо в одному запиті і стек, і опис – спочатку <CALL_STACK> рядок, другим рядком <CALL_SITE_PROFILE>.

CONTACT FORM:
На сайті є інтерактивна контактна форма в AI Hub, яка може з'являтися динамічно.
Якщо користувач просить форму для зв'язку / "контактна форма" / "заповнити форму" / "виведи форму" / "write me" / "contact form" — ПЕРШИМ рядком поверни маркер:
<CALL_CONTACT_FORM>{"purpose":"SHORT_HINT_ABOUT_PURPOSE"}</CALL_CONTACT_FORM>
де purpose — коротка підказка, що людина хоче (українською), наприклад "Хочу обговорити співпрацю".
Після маркера обов'язково напиши що форма відкрита і готова до заповнення, наприклад: "Контактну форму відкрито у блоці AI Hub вгорі. Заповни поля і натисни 'Надіслати'."

	Точковий контроль тільки форми (не всього AI Hub):
	<CALL_CONTACT_FORM_PANEL>{"action":"show|hide|toggle"}</CALL_CONTACT_FORM_PANEL>
	Використовуй коли потрібно просто показати/сховати саме блок форми, не торкаючись інших панелей.
    
	UI КОНТРОЛЬ (видимість AI Hub і Живого Виводу):
	Якщо користувач просить показати/сховати/перемкнути AI Hub — поверни ПЕРШИМ рядком один із маркерів:
	<CALL_AIHUB>{"action":"show"}</CALL_AIHUB>
	<CALL_AIHUB>{"action":"hide"}</CALL_AIHUB>
	<CALL_AIHUB>{"action":"toggle"}</CALL_AIHUB>
	Аналогічно для панелі "Живий Вивід":
	<CALL_LIVE>{"action":"show"}</CALL_LIVE>
	<CALL_LIVE>{"action":"hide"}</CALL_LIVE>
	<CALL_LIVE>{"action":"toggle"}</CALL_LIVE>
	Після такого маркера дай коротке підтвердження, що дію виконано.

	КОНТРОЛЬ ІНШИХ ПАНЕЛЕЙ (Команди / Журнал / Стек):
	Якщо потрібно керувати конкретною панеллю, поверни ПЕРШИМ рядком уніфікований маркер:
	<CALL_PANEL>{"panel":"commands","action":"show|hide|toggle"}</CALL_PANEL>
	<CALL_PANEL>{"panel":"log","action":"show|hide|toggle"}</CALL_PANEL>
	<CALL_PANEL>{"panel":"stack","action":"show|hide|toggle"}</CALL_PANEL>
	Після такого маркера додай коротке підтвердження.

	КЕРУВАННЯ ТЕМОЮ (світла/темна):
	Якщо користувач просить перемкнути або встановити тему — поверни ПЕРШИМ рядком маркер:
	<CALL_THEME>{"mode":"light|dark|toggle"}</CALL_THEME>
	Після маркера додай коротке підтвердження (наприклад: "Тему перемкнуто").
`;
}

// ============ Local fallback generator (if model failed to return marker) ============
function generateLocalSiteProfile(p){
	if(!p) return null;
	const lang = (typeof getLang==='function' ? getLang() : 'uk');
	const isUk = lang !== 'en';
	const principles = Array.isArray(p.principles)? p.principles : [];
	const actions = principles.map(pr => {
		const base = pr.split(/→|->|-/)[0].trim();
		if (isUk) {
			if (/чист/i.test(base)) return 'Тримати інтерфейс чистим';
			if (/AI як/i.test(pr)) return 'Використовувати AI як інструмент';
			if (/Ітератив|вимір/i.test(pr)) return 'Працювати ітеративно та вимірювати зміни';
			return base.replace(/\.$/,'');
		} else {
			if (/clean/i.test(base)) return 'Keep the interface clean';
			if (/AI/i.test(pr)) return 'Use AI as a tool';
			if (/iterat|measure/i.test(pr)) return 'Iterate and measure changes';
			return base.replace(/\.$/,'');
		}
	}).filter((v,i,a)=>v && a.indexOf(v)===i).slice(0,6);
	if (isUk) {
		return {
			what: 'Портфоліо розробника з інтегрованими AI-підходами у робочі процеси',
			how: actions.length? actions : ['Тримати інтерфейс чистим','Використовувати AI як інструмент','Працювати ітеративно та вимірювати зміни'],
			why: 'Для швидшої доставки рішень, прозорості підходів та прикладного використання AI'
		};
	}
	return {
		what: 'Developer portfolio with integrated AI approaches in workflows',
		how: actions.length? actions : ['Keep the interface clean','Use AI as a tool','Iterate and measure changes'],
		why: 'To deliver faster, stay transparent, and apply AI pragmatically'
	};
}

function askAndRender(prompt, { long=false } = {}) {
		// bump sessions counter before making the request
		try {
			const el = document.querySelector('[data-ai-stat="sessions"]');
			if (el) { const v = parseInt(el.textContent || '0', 10) || 0; el.textContent = String(v+1); }
		} catch {}
	const pending = pushMessage({ role: 'bot', html: '<p>Запит до моделі…</p>', pending: true });
	const p = (typeof getUserProfile === 'function') ? getUserProfile() : null;
	const system = buildSystemPrompt(p, { long });
	const maxTokens = long ? (window.AI_MAX_TOKENS_LONG ||  AI_CONFIG?.MAX_TOKENS_LONG || 1400) : (AI_CONFIG?.MAX_TOKENS_DEFAULT || 400);
	pushHistory('user', prompt);
    const t0 = Date.now();
	logEvent('info','AI: запит', { long, maxTokens });
	return askLLM(prompt, { system, maxTokens, history: AI_HISTORY })
		.then(answer => {
			const took = Date.now()-t0;
			// --- Хелпери санітизації (локально в межах ask для чистоти глобалу) ---
			function deTokenize(str){
				if(!str || typeof str !== 'string') return str;
				// Skip if contains lowercase already (likely human readable)
				if(/[a-zа-яёіїєґ]/.test(str)) return str;
				// Replace underscores with spaces
				let s = str.replace(/_/g,' ').toLowerCase();
				// Keep known acronyms uppercase
				const acronyms = new Set(['AI','UI','UX','API','HTTP','CSS','HTML','ШІ']);
				s = s.split(/\s+/).map(w=>{
					const up = w.toUpperCase();
					if(acronyms.has(up)) return up;
					return w.charAt(0).toUpperCase()+w.slice(1);
				}).join(' ');
				// Minor tweaks
				s = s.replace(/З Ai/gi,'з AI');
				// Convert to sentence-style for Ukrainian: lowercase short prepositions/spojki except first
				const small = ['і','та','й','з','у','в','на','до','таким','як'];
				s = s.split(/\s+/).map((w,i)=>{
					if(i===0) return w; // keep first capitalized
					if(small.includes(w.toLowerCase())) return w.toLowerCase();
					return w;
				}).join(' ');
				return s;
			}
			function sanitizeProfile(obj){
				if(!obj) return obj;
				if(obj.what) obj.what = deTokenize(obj.what);
				if(obj.why) obj.why = deTokenize(obj.why);
				if(Array.isArray(obj.how)) obj.how = obj.how.map(deTokenize);
				return obj;
			}
			function ensureProfileLocale(obj){
				if(!obj) return obj;
				try {
					const lang = (typeof getLang === 'function') ? getLang() : 'uk';
					const fallback = generateLocalSiteProfile(p);
					if (!fallback) return obj;
					const hasCyr = (text) => /[\u0400-\u04FF]/.test(text || '');
					const hasLat = (text) => /[A-Za-z]/.test(text || '');
					const mapHow = (validator) => {
						if (!Array.isArray(obj.how)) return Array.isArray(fallback.how) ? [...fallback.how] : obj.how;
						const safeFallback = Array.isArray(fallback.how) ? fallback.how : [];
						return obj.how.map((item, idx) => validator(item) ? item : (safeFallback[idx] || safeFallback[0] || item));
					};
					if (lang === 'uk') {
						if (obj.what && !hasCyr(obj.what) && fallback.what) obj.what = fallback.what;
						if (obj.why && !hasCyr(obj.why) && fallback.why) obj.why = fallback.why;
						obj.how = mapHow(hasCyr);
					} else {
						if (obj.what && !hasLat(obj.what) && fallback.what) obj.what = fallback.what;
						if (obj.why && !hasLat(obj.why) && fallback.why) obj.why = fallback.why;
						obj.how = mapHow(hasLat);
					}
				} catch(err) {
					console.warn('[siteProfile] locale adjust fail', err);
				}
				return obj;
			}
			
			// ========== СИСТЕМА ОБРОБКИ МАРКЕРІВ AI ==========
			// Process all markers and track what was found for smart fallback messaging
			let cleaned = answer;
			let markerMatch = null;
			let siteProfileFound = false;
			let contactFormFound = false;
			let uiActionLog = [];
			
			// Виявлення маркера CALL_STACK (спрощено: прибираємо маркер, UI-оновлення не потрібне)
			markerMatch = answer.match(/<CALL_STACK>(.+?)<\/CALL_STACK>/);
			if (markerMatch) {
				cleaned = cleaned.replace(markerMatch[0],'').trim();
				// no-op
			}
			const siteProfileMatch = cleaned.match(/<CALL_SITE_PROFILE>([\s\S]+?)<\/CALL_SITE_PROFILE>/);
			if (siteProfileMatch) {
				let jsonRaw = siteProfileMatch[1].trim();
				let parsed = null;
				try { parsed = JSON.parse(jsonRaw); } catch(e) { console.warn('[siteProfile] JSON parse fail', e, jsonRaw); }
				if (parsed && parsed.what && parsed.why) {
					parsed = ensureProfileLocale(sanitizeProfile(parsed));
					addOrUpdateSiteProfileBlock(parsed);
					openSiteProfileModal(parsed);
					siteProfileFound = true;
					uiActionLog.push('site-profile');
				}
				cleaned = cleaned.replace(siteProfileMatch[0],'').trim();
			}

			// Виявлення маркера CALL_CONTACT_FORM
			const contactMatch = cleaned.match(/<CALL_CONTACT_FORM>([\s\S]+?)<\/CALL_CONTACT_FORM>/);
			if (contactMatch) {
				let raw = contactMatch[1].trim();
				let payload = null;
				try { payload = JSON.parse(raw); } catch(e) { console.warn('[contactForm] JSON parse fail', e, raw); }
				addOrUpdateContactFormBlock({ purpose: payload?.purpose });
				contactFormFound = true;
				uiActionLog.push('contact-form');
				cleaned = cleaned.replace(contactMatch[0],'').trim();
			}

			// Виявлення керування лише панеллю контактної форми
			const contactPanelMatch = cleaned.match(/<CALL_CONTACT_FORM_PANEL>([\s\S]+?)<\/CALL_CONTACT_FORM_PANEL>/);
			if (contactPanelMatch) {
				try {
					const cmd = JSON.parse(contactPanelMatch[1].trim());
					const a = (cmd.action||'toggle').toLowerCase();
					if (a === 'show') showContactForm();
					else if (a === 'hide') hideContactForm();
					else toggleContactForm();
					uiActionLog.push('contactForm:'+a);
				} catch(e) { console.warn('[ui] contact form panel JSON parse fail', e, contactPanelMatch[1]); }
				cleaned = cleaned.replace(contactPanelMatch[0], '').trim();
			}

			// Маркери керування видимістю UI
			const aiHubMatch = cleaned.match(/<CALL_AIHUB>([\s\S]+?)<\/CALL_AIHUB>/);
			if (aiHubMatch) {
				try {
					const cmd = JSON.parse(aiHubMatch[1].trim());
					if (cmd.action === 'show') showAIHub();
					else if (cmd.action === 'hide') hideAIHub();
					else toggleAIHub();
					uiActionLog.push('aihub:' + cmd.action);
					uiActionLog.push('aihub:'+cmd.action);
				} catch(e) { console.warn('[ui] aihub JSON parse fail', e, aiHubMatch[1]); }
				cleaned = cleaned.replace(aiHubMatch[0], '').trim();
			}
			const liveMatch = cleaned.match(/<CALL_LIVE>([\s\S]+?)<\/CALL_LIVE>/);
			if (liveMatch) {
				try {
					const cmd = JSON.parse(liveMatch[1].trim());
					if (cmd.action === 'show') showLivePanel();
					else if (cmd.action === 'hide') hideLivePanel();
					else toggleLivePanel();
					uiActionLog.push('live:' + cmd.action);
					uiActionLog.push('live:'+cmd.action);
				} catch(e) { console.warn('[ui] live JSON parse fail', e, liveMatch[1]); }
				cleaned = cleaned.replace(liveMatch[0], '').trim();
			}

			// Узагальнений маркер керування панеллю: <CALL_PANEL>{"panel":"live|commands|log|stack","action":"show|hide|toggle"}</CALL_PANEL>
			const panelMatch = cleaned.match(/<CALL_PANEL>([\s\S]+?)<\/CALL_PANEL>/);
			if (panelMatch) {
				try {
					const cmd = JSON.parse(panelMatch[1].trim());
					const a = (cmd.action||'toggle').toLowerCase();
					const p = (cmd.panel||'').toLowerCase();
					const doAction = (showFn, hideFn, toggleFn) => {
						if (a === 'show') showFn(); else if (a === 'hide') hideFn(); else toggleFn();
					};
					if (p === 'live') doAction(showLivePanel, hideLivePanel, toggleLivePanel);
					else if (p === 'commands' || p === 'cmds') doAction(showCommandsPanel, hideCommandsPanel, toggleCommandsPanel);
					else if (p === 'log' || p === 'logs') doAction(showLogPanel, hideLogPanel, toggleLogPanel);
					else if (p === 'stack') {
						const el = document.querySelector('#ai-hub [data-stack-panel]');
						if (el) {
							if (a === 'show') el.style.display = '';
							else if (a === 'hide') el.style.display = 'none';
							else el.style.display = (el.style.display === 'none') ? '' : 'none';
						}
					}
					uiActionLog.push('panel:'+p+':'+a);
					uiActionLog.push('panel:'+cmd.panel+':'+a);
				} catch(e) { console.warn('[ui] panel JSON parse fail', e, panelMatch[1]); }
				cleaned = cleaned.replace(panelMatch[0], '').trim();
			}

			// Маркер керування темою: <CALL_THEME>{"mode":"light|dark|toggle"}</CALL_THEME>
			const themeMatch = cleaned.match(/<CALL_THEME>([\s\S]+?)<\/CALL_THEME>/);
			if (themeMatch) {
				try {
					const cmd = JSON.parse(themeMatch[1].trim());
					const mode = (cmd.mode||'toggle').toLowerCase();
					setTheme(mode);
					uiActionLog.push('theme:'+mode);
				} catch(e) { console.warn('[ui] theme JSON parse fail', e, themeMatch[1]); }
				cleaned = cleaned.replace(themeMatch[0], '').trim();
			}
			// Fallback: визначення наміру, якщо маркер відсутній
			if (!siteProfileFound) {
				const intent = /про що цей сайт|what is this site|about this site|яка ідея|site profile|призначення сайту/i.test(prompt);
				if (intent) {
					const fallback = generateLocalSiteProfile(p);
					if (fallback) {
						addOrUpdateSiteProfileBlock(sanitizeProfile(fallback));
						openSiteProfileModal(sanitizeProfile(fallback));
						siteProfileFound = true;
							uiActionLog.push('fallback:site-profile');
					}
				}
			}

			// Fallback для запиту контактної форми, якщо маркер відсутній
			if (!contactFormFound) {
				const wantForm = /форма|контактна форма|заповнити форму|виведи форму|form to fill|contact form|написати тобі|зв'язатися/i.test(prompt);
				if (wantForm) {
					addOrUpdateContactFormBlock({ purpose: '' });
					contactFormFound = true;
						uiActionLog.push('fallback:contact-form');
				}
			}

			// Розумний fallback для порожніх відповідей після обробки маркерів
			if (!cleaned.trim()) {
				if (contactFormFound) {
					cleaned = (typeof t==='function' ? t('form_opened') : 'Form opened.');
				} else if (siteProfileFound) {
					cleaned = (typeof t==='function' ? t('sp_opened_msg') : 'Site info opened in a modal.');
				} else if (markerMatch) {
					cleaned = (typeof t==='function' ? t('msg_action_done') : 'Done.');
				} else {
					cleaned = (typeof t==='function' ? t('msg_action_done') : 'Done.');
				}
			}
			
			// TODO: Тут можна додавати нові маркери за шаблоном:
			// 1) Регекс для маркера: /<CALL_NEW_FEATURE>(.*?)<\/CALL_NEW_FEATURE>/
			// 2) Обробити payload і викликати потрібну UI-функцію
			// 3) Встановити відповідний прапорець xxxFound
			// 4) Додати fallback-повідомлення вище
			// 5) Додати інструкцію в buildSystemPrompt()
			// Приклади: CALL_PROJECT_FILTER, CALL_THEME_TOGGLE, CALL_EXPORT_DATA тощо.

			// Форматування: подвійні переноси → абзаци, один перенос → <br>
			let htmlBody;
			if (cleaned) {
				const safe = escapeHtml(cleaned).trim();
				const parts = safe.split(/\n{2,}/).map(p=>p.replace(/\n/g,'<br>'));
				htmlBody = parts.map(p=>`<p>${p}</p>`).join('');
			} else {
				// Fallback should never reach here now, but keep for safety
				htmlBody = `<p><em>${escapeHtml(t('msg_action_done')||'Виконано.')}</em></p>`;
			}
			
			replacePending(pending, htmlBody);
			pushHistory('assistant', answer);
			// Single lightweight summary log entry
			logEvent('info','AI: відповідь', { tookMs: took, actions: uiActionLog.join(',') });
			return answer;
		})
		.catch(err => {
			replacePending(pending, `<p>${escapeHtml(t('err_error')||'Помилка')}: <code>${escapeHtml(err.message)}</code></p><p class="mono">${escapeHtml(t('err_set_key_hint')||'Встанови ключ командою /setkey <ключ>. Довгі відповіді: /ai-long')}</p>`);
            logEvent('error','LLM: помилка', { error: err?.message });
			throw err;
		});
}

register('/theme', {
	description: 'Керує темою: /theme [light|dark|toggle]',
	usage: '/theme [light|dark|toggle] (за замовчуванням toggle)',
	run(args) { 
		const mode = (args||'').trim().toLowerCase() || 'toggle';
		const applied = setTheme(mode);
		if (applied === 'light') {
			pushMessage({ role:'bot', html:`<p>☀️ <strong>${escapeHtml(t('theme_light')||'Світла тема')}</strong> ${escapeHtml(t('theme_activated')||'активована')}. ${escapeHtml(t('theme_saved')||'Збережено в браузері.')}</p>` });
		} else {
			pushMessage({ role:'bot', html:`<p>🌙 <strong>${escapeHtml(t('theme_dark')||'Темна тема')}</strong> ${escapeHtml(t('theme_activated')||'активована')}. ${escapeHtml(t('theme_saved')||'Збережено в браузері.')}</p>` });
		}
	},
	name:'/theme'
});

register('/ai-long', {
	description: 'Запит із довшою відповіддю (більше токенів)',
	usage: '/ai-long [prompt]',
  run(args) {
    const q = args.trim();
		if (!q) { pushMessage({ role:'bot', html:`<p>${escapeHtml(t('ex_ai_long')||'Приклад: /ai-long детальний конспект про WebSockets')}</p>`}); return; }
    askAndRender(q, { long:true });
  },
  name:'/ai-long'
});

// Quick command to show contact form explicitly
register('/form', {
	description: 'Керування контактною формою: /form [show|hide|toggle]',
	usage: '/form [show|hide|toggle]',
	run(args) {
		const a = (args||'').trim().toLowerCase();
		// ensure block exists
		addOrUpdateContactFormBlock({ purpose: '' });
		if (a === 'hide') { hideContactForm(); pushMessage({ role:'bot', html:`<p>${escapeHtml(t('form_hidden')||'Форму приховано.')}</p>` }); return; }
		if (a === 'toggle') { toggleContactForm(); pushMessage({ role:'bot', html:`<p>${escapeHtml(t('form_toggled')||'Форму перемкнено.')}</p>` }); return; }
		showContactForm();
		highlightSection('#ai-hub');
		pushMessage({ role:'bot', html:`<p>${escapeHtml(t('form_opened')||'Форму відкрито у блоці AI Hub.')}</p>` });
	},
	name:'/form'
});

// Система підказок
function updateSuggestions(fragment='') {
	const list = [...commands.keys()].filter(k => k.startsWith('/') && k.includes(fragment)).slice(0,6);
	el.suggestions.querySelectorAll('li').forEach(li=>li.remove());
	list.forEach(cmd => {
		const def = commands.get(cmd);
		const li = document.createElement('li');
		li.innerHTML = `<button type="button" data-command="${cmd}">${cmd}</button>`;
		li.title = def.description;
		el.suggestions.appendChild(li);
	});
	el.input.setAttribute('aria-expanded', list.length ? 'true':'false');
}

// Хелпер підсвічування секції
let highlightTimer;
function highlightSection(sel) {
	const target = document.querySelector(sel);
	if (!target) return;
	target.classList.add('pulse-highlight');
	clearTimeout(highlightTimer);
	highlightTimer = setTimeout(()=> target.classList.remove('pulse-highlight'), 1600);
	target.scrollIntoView({behavior:'smooth', block:'start'});
}

// Обробка відправлення форми
el.form?.addEventListener('submit', e => {
	e.preventDefault();
	const raw = el.input.value.trim();
	if (!raw) return;
	pushMessage({ role:'user', html: `<p>${escapeHtml(raw)}</p>` });
	logEvent('info','User input', { type: raw.startsWith('/') ? 'command' : 'chat', text: raw });
	const field = el.input.closest('.dock-field');
	if (field) field.classList.add('is-busy');
	if (el.sendBtn) { el.sendBtn.classList.add('is-loading'); el.sendBtn.disabled = true; }
	const status = document.querySelector('[data-send-status]');
	if (status) status.textContent = t('sending') || 'Відправка…';
	const finish = () => {
		if (field) field.classList.remove('is-busy');
		if (el.sendBtn) { el.sendBtn.classList.remove('is-loading'); el.sendBtn.disabled = true; }
		if (status) status.textContent = t('ready') || 'Готово.';
	};
	if (raw.startsWith('/')) {
		try { runCommand(raw); } finally { finish(); }
	} else {
		try { processWithStackFunction(raw); } catch(err){ console.warn('[stackFunctionCalling] error', err); logEvent('warn','stackFunctionCalling: помилка', { error: err?.message }); }
		askAndRender(raw).catch(()=>{}).finally(finish);
	}
	el.input.value='';
	autoResize();
	updateSuggestions('');
});

function runCommand(raw) {
	const [name, ...rest] = raw.split(' ');
	const def = commands.get(name);
	if (!def) {
		pushMessage({ role:'bot', html:`<p>${escapeHtml(t('unknown_command')||'Невідома команда')}: <code>${escapeHtml(name)}</code>. ${escapeHtml(t('try_help')||'Спробуй /help')}</p>` });
		logEvent('warn','Невідома команда', { name });
		return;
	}
	try {
		logEvent('debug','Запуск команди', { name, args: rest.join(' ') });
		def.run?.(rest.join(' '));
	} catch(err) {
		console.error(err);
	pushMessage({ role:'bot', html:`<p>${escapeHtml(t('cmd_error')||'Помилка виконання команди.')}</p>` });
		logEvent('error','Команда: помилка виконання', { name, error: err?.message });
	}
}

// Взаємодія з інпутом
function updateSendButtonState(){
	if (!el.input || !el.sendBtn) return;
	el.sendBtn.disabled = !el.input.value.trim().length;
}

el.input?.addEventListener('input', () => {
	autoResize();
	const v = el.input.value.trim();
	if (v.startsWith('/')) { updateSuggestions(v.slice(1)); } else { updateSuggestions(''); }
	updateSendButtonState();
});

// Extra resilience: also react on keyup/change/focus to avoid edge cases
el.input?.addEventListener('keyup', updateSendButtonState);
el.input?.addEventListener('change', updateSendButtonState);
el.input?.addEventListener('focus', updateSendButtonState);

el.openCommandsBtn?.addEventListener('click', () => {
	el.input.focus();
	if (!el.input.value.startsWith('/')) {
		el.input.value = '/' + el.input.value;
		el.input.dispatchEvent(new Event('input'));
	}
});

// Клік по підказці
el.suggestions?.addEventListener('click', e => {
	const btn = e.target.closest('button[data-command]');
	if (!btn) return;
	el.input.value = btn.getAttribute('data-command');
	el.input.focus();
	updateSuggestions(el.input.value.slice(1));
});

// Клавіатурна навігація по підказках
el.input?.addEventListener('keydown', e => {
	if (e.key === 'Enter' && !e.shiftKey) {
		e.preventDefault();
		el.form.requestSubmit();
	}
	if (e.key === 'Escape') { updateSuggestions(''); }
});

// Утиліта екранування HTML
function escapeHtml(str) {
	return str.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]||c));
}

// Завантаження профілю (не блокує інше)
loadUserProfile().then(p => {
	if (p) console.info('[profile] loaded', p.name);
});

// Команда /profile
register('/profile', {
	description: 'Показати короткий профіль користувача',
	run() {
		const p = getUserProfile();
		if (!p) { pushMessage({ role:'bot', html:`<p>${escapeHtml(t('profile_not_loaded')||'Профіль ще не завантажено.')}</p>` }); return; }
		const skills = Object.entries(p.skills || {})
			.map(([k,v]) => `<li><strong>${k}</strong>: ${(v||[]).slice(0,4).join(', ')}${(v||[]).length>4?'…':''}</li>`)
			.join('');
		pushMessage({ role:'bot', html:`<p><strong>${escapeHtml(p.name)}</strong> — ${escapeHtml(p.role)}${p.location? ' • '+escapeHtml(p.location):''}</p><p>${escapeHtml(p.tagline||'')}</p><ul class="mono" style="padding-left:1.1rem;list-style:disc">${skills}</ul>` });
	}, name:'/profile'
});

// Команда /setkey
register('/setkey', {
	description: 'Задати або показати API ключ (/setkey <ключ>). Зберігається в localStorage.',
	usage: '/setkey sk-... | /setkey',
	run(args) {
		const k = args.trim();
		if (!k) {
			const current = getAIKey();
			pushMessage({ role:'bot', html:`<p>Поточний ключ: ${current ? '<code>'+escapeHtml(current.slice(0,8))+'…</code>' : '<em>не встановлено</em>'}</p>`});
			return;
		}
		const ok = setAIKey(k);
		if (ok) {
			pushMessage({ role:'bot', html:`<p>Ключ встановлено (початок: <code>${escapeHtml(k.slice(0,8))}…</code>). Тепер можна запускати <code>/ai</code>.</p>` });
		} else {
			pushMessage({ role:'bot', html:'<p>Невірний ключ.</p>' });
		}
	},
	name:'/setkey'
});

// При завантаженні: підтягнути ключ з localStorage, якщо є.
(function initAIKey(){
  try {
    const saved = localStorage.getItem('AI_KEY');
    if (saved && !window.__AI_KEY) { window.__AI_KEY = saved; console.info('[ai] Loaded key from localStorage (prefix:', saved.slice(0,5)+')'); }
  } catch {}
})();

// При завантаженні: відобразити кількість команд у статистиці AI Hub
(function reflectCommandsStat(){
	try {
		const elCount = document.querySelector('[data-ai-stat="commands"]');
		if (elCount) elCount.textContent = String(commands.size);
	} catch {}
})();

// При завантаженні: застосувати тему з localStorage, якщо задана
(function initTheme(){
  try {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
      console.info('[theme] Light theme loaded from localStorage');
    }
		// reflect initial state in the header button
		reflectThemeButton();
  } catch {}
})();

// Делегований fallback: якщо раннє привʼязування зірвалось — забезпечити роботу перемикача теми
document.addEventListener('click', (e) => {
	const btn = e.target.closest?.('[data-theme-toggle]');
	if (!btn) return;
	try { setTheme('toggle'); } catch {}
});

// Початковий стан
updateSuggestions('');
autoResize();
if (el.sendBtn && el.input) { el.sendBtn.disabled = !el.input.value.trim().length; }

// Невелика інʼєкція стилю для підсвічування + підказок (якщо ще немає)
const style = document.createElement('style');
style.textContent = `
	.pulse-highlight { position: relative; }
	.pulse-highlight:after { content:""; position: absolute; inset:0; border-radius: 24px; pointer-events:none; animation:pulseSec 1.6s ease-out; background: radial-gradient(circle at 50% 50%,rgba(var(--accent-rgb)/0.35),transparent 70%); }
	@keyframes pulseSec { from { opacity:.85; transform:scale(.95);} to { opacity:0; transform:scale(1.2);} }
	.dock-hints button, [data-suggestions] button { cursor: pointer; }
	[data-suggestions] { max-height: 140px; overflow-y: auto; }
	[data-suggestions]::-webkit-scrollbar { width: 8px; }
	[data-suggestions]::-webkit-scrollbar-thumb { background: linear-gradient(180deg,#303642,#29303b); border-radius: 20px; }
`;
document.head.appendChild(style);

console.info('[chat] Command system initialized with', commands.size, 'commands');

// ========== Плавне згортання/розгортання чату в доку ==========
(function initChatDockAnimation(){
	const details = document.querySelector('.chat-dock__unit');
	if(!details) return;
	const panel = details.querySelector('.chat-dock__panel');
	const summary = details.querySelector('summary');
	if(!panel || !summary) return;

	// Remove native instant height jump: we will animate manually.
	summary.addEventListener('click', e => {
		// Let default toggle happen AFTER we measure.
		// We prevent default and manually toggle to gain control.
		e.preventDefault();
		const isOpen = details.hasAttribute('open');
		if(isOpen){
			collapse();
		}else{
			expand();
		}
	});

	function expand(){
		// Set initial height 0 -> scrollHeight
		details.setAttribute('open','');
		panel.classList.add('is-expanding');
		panel.style.height = '0px';
		requestAnimationFrame(()=> {
			const target = panel.scrollHeight;
			panel.style.height = target + 'px';
			// trigger opacity/transform transition
			panel.classList.add('is-animating');
		});
		panel.addEventListener('transitionend', onExpandEnd, { once:true });
		summary.setAttribute('aria-expanded','true');
	}
	function onExpandEnd(){
		panel.classList.remove('is-expanding','is-animating');
		panel.style.height = '';
	}

	function collapse(){
		const start = panel.scrollHeight;
		panel.style.height = start + 'px';
		panel.classList.add('is-collapsing');
		requestAnimationFrame(()=> {
			panel.style.height = '0px';
			panel.classList.add('is-animating');
		});
		panel.addEventListener('transitionend', onCollapseEnd, { once:true });
		summary.setAttribute('aria-expanded','false');
	}
	function onCollapseEnd(){
		panel.classList.remove('is-collapsing','is-animating');
		panel.style.height = '';
		// Remove open so native semantics collapse
		details.removeAttribute('open');
	}
})();

// Ініціалізувати UI Журналу наприкінці, коли DOM готовий
initLogPanelUI();
