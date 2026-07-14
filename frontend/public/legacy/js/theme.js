/* ══════════════════════════════════════
   THEME - Light default, optional dark mode
══════════════════════════════════════ */
const THEME_STORAGE_KEY = 'theme';
const COLOR_THEME_STORAGE_KEY = 'dsr_color_theme';
const THEME_LIGHT = 'light';
const THEME_DARK = 'dark';
const COLOR_THEMES = {
  punjab: { label: 'Punjab Navy', primary: '#17324D', navy: '#17324D', saffron: '#C49A58', bg: '#F7F4EE', card: '#FFFDF8', text: '#17221E', border: 'rgba(23, 50, 77, 0.15)' },
  indigo: { label: 'Indigo', primary: '#4338CA', navy: '#312E81', saffron: '#F59E0B', bg: '#F7F7FF', card: '#FFFFFF', text: '#1F1B4D', border: 'rgba(67, 56, 202, 0.16)' },
  teal: { label: 'Teal', primary: '#0F766E', navy: '#134E4A', saffron: '#D97706', bg: '#F2FBF9', card: '#FFFFFF', text: '#123B38', border: 'rgba(15, 118, 110, 0.16)' },
  forest: { label: 'Forest', primary: '#3F6212', navy: '#365314', saffron: '#B7791F', bg: '#F7F9F1', card: '#FFFFFF', text: '#26351D', border: 'rgba(63, 98, 18, 0.17)' }
};

function getColorThemePreference() {
  try {
    const saved = localStorage.getItem(COLOR_THEME_STORAGE_KEY);
    return COLOR_THEMES[saved] ? saved : 'punjab';
  } catch {
    return 'punjab';
  }
}
function applyColorTheme(name, saveToStorage = true) {
  const selected = COLOR_THEMES[name] ? name : 'punjab';
  const palette = COLOR_THEMES[selected];
  const root = document.documentElement;
  root.setAttribute('data-color-theme', selected);
  Object.entries(palette).forEach(([key, value]) => {
    if (key !== 'label') root.style.setProperty(`--${key}`, value, 'important');
  });
  if (saveToStorage) {
    try { localStorage.setItem(COLOR_THEME_STORAGE_KEY, selected); } catch { /* storage unavailable */ }
  }
  document.querySelectorAll('[data-color-theme-option]').forEach((option) => {
    const active = option.getAttribute('data-color-theme-option') === selected;
    option.classList.toggle('active', active);
    option.setAttribute('aria-pressed', String(active));
  });
  if (typeof refreshThemeDependentUI === 'function') refreshThemeDependentUI();
}
function injectColorThemeControls() {
  if (document.getElementById('dsr-color-theme-style')) return;
  const style = document.createElement('style');
  style.id = 'dsr-color-theme-style';
  style.textContent = `.theme-palette-trigger{width:34px;height:34px;border:1px solid var(--border);border-radius:9px;background:var(--card);color:var(--primary);display:inline-grid;place-items:center;cursor:pointer}.theme-palette-menu{position:fixed;z-index:1000000;width:220px;padding:10px;border:1px solid var(--border);border-radius:13px;background:var(--card);box-shadow:0 16px 42px rgba(15,23,42,.22)}.theme-palette-title{display:block;font-size:11px;font-weight:800;color:var(--text-soft,#64748b);text-transform:uppercase;letter-spacing:.08em;padding:3px 4px 8px}.theme-palette-option{width:100%;display:flex;align-items:center;gap:9px;border:0;border-radius:8px;padding:8px;background:transparent;color:var(--text);font:600 13px/1.2 inherit;text-align:left;cursor:pointer}.theme-palette-option:hover,.theme-palette-option.active{background:color-mix(in srgb,var(--primary) 11%,transparent)}.theme-palette-swatch{width:19px;height:19px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px var(--border);flex:none}`;
  document.head.appendChild(style);
  const menu = document.createElement('div');
  menu.id = 'dsr-color-theme-menu';
  menu.className = 'theme-palette-menu';
  menu.hidden = true;
  menu.innerHTML = `<span class="theme-palette-title">Color theme</span>${Object.entries(COLOR_THEMES).map(([key, palette]) => `<button type="button" class="theme-palette-option" data-color-theme-option="${key}" aria-pressed="false"><span class="theme-palette-swatch" style="background:${palette.primary}"></span>${palette.label}</button>`).join('')}`;
  document.body.appendChild(menu);
  menu.addEventListener('click', (event) => {
    const option = event.target.closest('[data-color-theme-option]');
    if (!option) return;
    applyColorTheme(option.getAttribute('data-color-theme-option'));
    menu.hidden = true;
  });
  document.querySelectorAll('[data-theme-toggle]').forEach((toggle) => {
    if (toggle.parentElement?.querySelector('.theme-palette-trigger')) return;
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'theme-palette-trigger';
    trigger.title = 'Choose color theme';
    trigger.setAttribute('aria-label', 'Choose color theme');
    trigger.innerHTML = '<i data-lucide="palette"></i>';
    trigger.addEventListener('click', () => {
      const rect = trigger.getBoundingClientRect();
      menu.style.top = `${rect.bottom + 8}px`;
      menu.style.left = `${Math.max(8, rect.right - 220)}px`;
      menu.hidden = !menu.hidden;
    });
    toggle.insertAdjacentElement('afterend', trigger);
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.theme-palette-menu, .theme-palette-trigger')) menu.hidden = true;
  });
  if (window.lucide) window.lucide.createIcons();
}
function getThemePreference() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === THEME_DARK ? THEME_DARK : THEME_LIGHT;
  } catch {
    return THEME_LIGHT;
  }
}
function applyTheme(theme, saveToStorage = true) {
  const isDark = theme === THEME_DARK;
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.setAttribute('data-theme', isDark ? THEME_DARK : THEME_LIGHT);
  if (saveToStorage) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, isDark ? THEME_DARK : THEME_LIGHT);
    } catch {
      /* storage unavailable */
    }
  }
  return isDark;
}
function initThemeFromStorage() {
  applyColorTheme(getColorThemePreference(), true);
  return applyTheme(getThemePreference(), true);
}
function toggleDarkMode() {
  const isDark = !document.documentElement.classList.contains('dark');
  applyTheme(isDark ? THEME_DARK : THEME_LIGHT);
  updateDarkModeIcon();
  if (typeof refreshThemeDependentUI === 'function') {
    refreshThemeDependentUI();
  }
}
function updateDarkModeIcon() {
  const isDark = document.documentElement.classList.contains('dark');
  const iconName = isDark ? 'sun' : 'moon';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  document.querySelectorAll('[data-theme-toggle] i, #dark-mode-toggle i, #auth-theme-toggle i, #authority-theme-toggle i, .theme-switch i, .tb-theme-toggle i').forEach((icon) => {
    icon.setAttribute('data-lucide', iconName);
  });
  document.querySelectorAll('[data-theme-toggle], #dark-mode-toggle, #auth-theme-toggle, #authority-theme-toggle, .tb-theme-toggle').forEach((btn) => {
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
  });
  if (window.lucide) window.lucide.createIcons();
}
const NOTICE_REFRESH_INTERVAL_MS = 60000;
const NOTICE_EMPTY_TEXT = 'No announcements available.';

function parseNoticeDate(value) {
  if (!value) return null;
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;
  const match = String(value).trim().match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/);
  if (!match) return null;
  const month = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].indexOf(match[2].slice(0, 3).toLowerCase());
  if (month < 0) return null;
  return new Date(Number(match[3]), month, Number(match[1]));
}

function getNoticeResource(item) {
  return item && (item.attachmentUrl || item.attachment || item.pdfUrl || item.documentUrl || item.fileUrl || item.externalLink || item.internalLink || item.link || item.url || '');
}

function isNoticeActive(item, now = new Date()) {
  if (!item) return false;
  const status = String(item.status || item.state || '').toLowerCase();
  if (item.active === false || item.enabled === false || item.disabled === true || status === 'disabled' || status === 'inactive' || status === 'expired') return false;
  const expires = parseNoticeDate(item.expiresAt || item.expiryDate || item.expireDate || item.validUntil || item.endDate);
  if (expires && expires.getTime() < now.setHours(0, 0, 0, 0)) return false;
  return Boolean(item.title || item.description || item.text || item.message);
}

function normalizeAnnouncements(value) {
  let items = [];
  try {
    items = Array.isArray(value) ? value : JSON.parse(value || '[]');
  } catch {
    items = [];
  }
  return items
    .filter((item) => isNoticeActive(item))
    .map((item, index) => {
      const dateValue = item.publishedAt || item.publishedDate || item.date || item.createdAt || '';
      const parsedDate = parseNoticeDate(dateValue);
      return {
        raw: item,
        index,
        date: dateValue,
        dateTime: parsedDate ? parsedDate.getTime() : 0,
        title: item.title || item.heading || 'Announcement',
        description: item.description || item.text || item.message || '',
        category: item.category || item.type || 'Information',
        priority: item.priority || item.priorityLabel || '',
        resource: getNoticeResource(item)
      };
    })
    .sort((a, b) => (b.dateTime - a.dateTime) || (a.index - b.index));
}

function createNoticeNode(notice, compact = false) {
  const resource = notice.resource;
  const node = document.createElement(resource ? 'a' : 'span');
  node.className = compact ? 'dash-notice-item' : 'public-notice-link';
  if (resource) {
    node.href = resource;
    if (/^https?:\/\//i.test(resource) || /\.(pdf|docx?|xlsx?|pptx?)(\?|#|$)/i.test(resource)) {
      node.target = '_blank';
      node.rel = 'noopener noreferrer';
    }
  }

  const title = document.createElement('strong');
  title.textContent = notice.title;
  node.appendChild(title);

  if (notice.description) {
    const description = document.createElement('span');
    description.textContent = compact ? ` - ${notice.description}` : notice.description;
    node.appendChild(description);
  }

  if (notice.date) {
    const date = document.createElement('span');
    date.className = 'notice-date';
    date.textContent = notice.date;
    node.appendChild(date);
  }

  if (notice.priority) {
    const priority = document.createElement('span');
    priority.className = 'notice-priority';
    priority.textContent = notice.priority;
    node.appendChild(priority);
  }

  if (resource) {
    const icon = document.createElement('span');
    icon.className = 'notice-attachment';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = 'attachment';
    node.appendChild(icon);
  }
  return node;
}

function renderNoticeBar(value, failed = false) {
  const notices = failed ? [] : normalizeAnnouncements(value);
  const text = notices.length
    ? notices.map((notice) => [notice.title, notice.description, notice.date, notice.priority].filter(Boolean).join(' - ')).join('    |    ')
    : NOTICE_EMPTY_TEXT;

  document.querySelectorAll('[data-notice-marquee], .dash-notice-marquee-text').forEach((marquee) => {
    marquee.innerHTML = '';
    marquee.classList.toggle('notice-empty', !notices.length);
    if (!notices.length) {
      const span = document.createElement('span');
      span.setAttribute('data-i18n', 'noticeText');
      span.textContent = text;
      marquee.appendChild(span);
      return;
    }
    const track = document.createElement('div');
    track.className = 'notice-marquee-track';
    for (let repeat = 0; repeat < 2; repeat += 1) {
      notices.forEach((notice) => track.appendChild(createNoticeNode(notice, true)));
    }
    marquee.appendChild(track);
  });

  document.querySelectorAll('[data-i18n="noticeText"]').forEach((el) => {
    if (!el.closest('[data-notice-marquee], .dash-notice-marquee-text')) el.innerText = text;
  });
}

async function fetchNoticeSettings() {
  try {
    const res = await fetch('/api/settings/publicAnnouncements', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch announcements');
    const data = await res.json();
    if (data && data.value) {
      localStorage.setItem('publicAnnouncements', data.value);
      updatePublicAnnouncementsUI(data.value);
      return;
    }
    renderNoticeBar([], true);
  } catch (e) {
    console.error('Error fetching notice settings:', e);
    const cached = localStorage.getItem('publicAnnouncements');
    if (cached) updatePublicAnnouncementsUI(cached);
    else renderNoticeBar([], true);
  }
}

function updateNoticeUI(text) {
  renderNoticeBar([{ title: text, category: 'Information', active: true }]);
}

function updatePublicAnnouncementsUI(value) {
  renderNoticeBar(value);
  if (typeof window.renderPublicAnnouncements === 'function') window.renderPublicAnnouncements(value);
  if (typeof window.renderDashboardLatestUpdates === 'function') window.renderDashboardLatestUpdates(value);
}

window.normalizeAnnouncements = normalizeAnnouncements;
window.renderNoticeBar = renderNoticeBar;
window.updatePublicAnnouncementsUI = updatePublicAnnouncementsUI;

/* Apply before first paint when loaded from <head> */
initThemeFromStorage();
document.addEventListener('DOMContentLoaded', () => {
  initThemeFromStorage();
  updateDarkModeIcon();
  injectColorThemeControls();
  fetchNoticeSettings();
  setInterval(fetchNoticeSettings, NOTICE_REFRESH_INTERVAL_MS);
});
