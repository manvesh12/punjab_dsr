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
async function fetchNoticeSettings() {
  try {
    const res = await fetch('/api/settings/noticeText');
    if (res.ok) {
      const data = await res.json();
      if (data && data.value) {
        updateNoticeUI(data.value);
      }
    }
  } catch (e) {
    console.error('Error fetching notice settings:', e);
  }
}

function updateNoticeUI(text) {
  document.querySelectorAll('.dash-notice-marquee-text span, [data-i18n="noticeText"]').forEach(el => {
    el.innerText = text;
  });
}

/* Apply before first paint when loaded from <head> */
initThemeFromStorage();
document.addEventListener('DOMContentLoaded', () => {
  initThemeFromStorage();
  updateDarkModeIcon();
  fetchNoticeSettings();
});
