/* ══════════════════════════════════════
   THEME - Light default, optional dark mode
══════════════════════════════════════ */
const THEME_STORAGE_KEY = 'theme';
const THEME_LIGHT = 'light';
const THEME_DARK = 'dark';
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
  fetchNoticeSettings();
  setInterval(fetchNoticeSettings, NOTICE_REFRESH_INTERVAL_MS);
});
