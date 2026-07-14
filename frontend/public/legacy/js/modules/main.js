/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   ENTRY POINT / BOOTSTRAP
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const PORTAL_FONT_MIN = 85;
const PORTAL_FONT_MAX = 125;
const PORTAL_FONT_STEP = 5;
let currentFontScale = Number(localStorage.getItem('portalFontScale') || 100);
const PORTAL_I18N = {
  en: {
    languageApplied: 'English language enabled.',
    brandBilingual: 'Government of Punjab - IIT Ropar Research Cell - EMGSM 2020',
    brandTitle: 'District Survey Report Automation Portal',
    brandSubtitle: 'DSR Automation for Sand Mining',
    screenReader: 'Screen Reader',
    skipContent: 'Skip to Content',
    navHome: 'Home',
    navAbout: 'About DSR',
    navProjects: 'Projects',
    navNewProject: '+ New Project',
    navWorkflow: 'Workflow',
    navAudit: 'Audit Logs',
    navDistricts: 'Districts',
    navContact: 'Contact',
    searchPlaceholder: 'Search portal...',
    noticeLabel: 'Notice',
    noticeText: 'DSR submissions for Punjab districts 2025-26 are now open - Deadline: 30 September 2026 - EMGSM 2020 compliance mandatory',
    langEnglish: 'English',
    langHindi: 'Hindi',
    langPunjabi: 'Punjabi'
  },
  hi: {
    languageApplied: 'à¤¹à¤¿à¤‚à¤¦à¥€ à¤­à¤¾à¤·à¤¾ à¤¸à¤•à¥à¤·à¤® à¤¹à¥ˆà¥¤',
    brandBilingual: 'à¤ªà¤‚à¤œà¤¾à¤¬ à¤¸à¤°à¤•à¤¾à¤° - à¤†à¤ˆà¤†à¤ˆà¤Ÿà¥€ à¤°à¥‹à¤ªà¤¡à¤¼ à¤°à¤¿à¤¸à¤°à¥à¤š à¤¸à¥‡à¤² - EMGSM 2020',
    brandTitle: 'à¤œà¤¿à¤²à¤¾ à¤¸à¤°à¥à¤µà¥‡à¤•à¥à¤·à¤£ à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ à¤‘à¤Ÿà¥‹à¤®à¥‡à¤¶à¤¨ à¤ªà¥‹à¤°à¥à¤Ÿà¤²',
    brandSubtitle: 'à¤°à¥‡à¤¤ à¤–à¤¨à¤¨ à¤•à¥‡ à¤²à¤¿à¤ DSR à¤‘à¤Ÿà¥‹à¤®à¥‡à¤¶à¤¨',
    screenReader: 'à¤¸à¥à¤•à¥à¤°à¥€à¤¨ à¤°à¥€à¤¡à¤°',
    skipContent: 'à¤®à¥à¤–à¥à¤¯ à¤¸à¤¾à¤®à¤—à¥à¤°à¥€ à¤ªà¤° à¤œà¤¾à¤à¤‚',
    navHome: 'à¤¹à¥‹à¤®',
    navAbout: 'DSR à¤•à¥‡ à¤¬à¤¾à¤°à¥‡ à¤®à¥‡à¤‚',
    navProjects: 'à¤ªà¤°à¤¿à¤¯à¥‹à¤œà¤¨à¤¾à¤à¤‚',
    navNewProject: '+ à¤¨à¤ˆ à¤ªà¤°à¤¿à¤¯à¥‹à¤œà¤¨à¤¾',
    navWorkflow: 'à¤µà¤°à¥à¤•à¤«à¥à¤²à¥‹',
    navAudit: 'à¤‘à¤¡à¤¿à¤Ÿ à¤²à¥‰à¤—',
    navDistricts: 'à¤œà¤¿à¤²à¥‡',
    navContact: 'à¤¸à¤‚à¤ªà¤°à¥à¤•',
    searchPlaceholder: 'à¤ªà¥‹à¤°à¥à¤Ÿà¤² à¤–à¥‹à¤œà¥‡à¤‚...',
    noticeLabel: 'à¤¸à¥‚à¤šà¤¨à¤¾',
    noticeText: 'à¤ªà¤‚à¤œà¤¾à¤¬ à¤œà¤¿à¤²à¥‹à¤‚ à¤•à¥‡ à¤²à¤¿à¤ DSR à¤œà¤®à¤¾ à¤•à¤°à¤¨à¤¾ 2025-26 à¤•à¥‡ à¤²à¤¿à¤ à¤–à¥à¤²à¤¾ à¤¹à¥ˆ - à¤…à¤‚à¤¤à¤¿à¤® à¤¤à¤¿à¤¥à¤¿: 30 à¤¸à¤¿à¤¤à¤‚à¤¬à¤° 2026 - EMGSM 2020 à¤…à¤¨à¥à¤ªà¤¾à¤²à¤¨ à¤…à¤¨à¤¿à¤µà¤¾à¤°à¥à¤¯',
    langEnglish: 'à¤…à¤‚à¤—à¥à¤°à¥‡à¤œà¥€',
    langHindi: 'à¤¹à¤¿à¤‚à¤¦à¥€',
    langPunjabi: 'à¤ªà¤‚à¤œà¤¾à¤¬à¥€'
  },
  pa: {
    languageApplied: 'à¨ªà©°à¨œà¨¾à¨¬à©€ à¨­à¨¾à¨¸à¨¼à¨¾ à¨šà¨¾à¨²à©‚ à¨¹à©ˆà¥¤',
    brandBilingual: 'à¨ªà©°à¨œà¨¾à¨¬ à¨¸à¨°à¨•à¨¾à¨° - à¨†à¨ˆà¨†à¨ˆà¨Ÿà©€ à¨°à©‹à¨ªà©œ à¨°à¨¿à¨¸à¨°à¨š à¨¸à©ˆà©±à¨² - EMGSM 2020',
    brandTitle: 'à¨œà¨¼à¨¿à¨²à©à¨¹à¨¾ à¨¸à¨°à¨µà©‡à¨–à¨£ à¨°à¨¿à¨ªà©‹à¨°à¨Ÿ à¨†à¨Ÿà©‹à¨®à©‡à¨¸à¨¼à¨¨ à¨ªà©‹à¨°à¨Ÿà¨²',
    brandSubtitle: 'à¨°à©‡à¨¤ à¨–à¨£à¨¨ à¨²à¨ˆ DSR à¨†à¨Ÿà©‹à¨®à©‡à¨¸à¨¼à¨¨',
    screenReader: 'à¨¸à¨•à©à¨°à©€à¨¨ à¨°à©€à¨¡à¨°',
    skipContent: 'à¨®à©à©±à¨– à¨¸à¨®à©±à¨—à¨°à©€ à¨¤à©‡ à¨œà¨¾à¨“',
    navHome: 'à¨¹à©‹à¨®',
    navAbout: 'DSR à¨¬à¨¾à¨°à©‡',
    navProjects: 'à¨ªà©à¨°à©‹à¨œà©ˆà¨•à¨Ÿ',
    navNewProject: '+ à¨¨à¨µà¨¾à¨‚ à¨ªà©à¨°à©‹à¨œà©ˆà¨•à¨Ÿ',
    navWorkflow: 'à¨µà¨°à¨•à¨«à¨²à©‹',
    navAudit: 'à¨†à¨¡à¨¿à¨Ÿ à¨²à¨¾à¨—',
    navDistricts: 'à¨œà¨¼à¨¿à¨²à©à¨¹à©‡',
    navContact: 'à¨¸à©°à¨ªà¨°à¨•',
    searchPlaceholder: 'à¨ªà©‹à¨°à¨Ÿà¨² à¨–à©‹à¨œà©‹...',
    noticeLabel: 'à¨¸à©‚à¨šà¨¨à¨¾',
    noticeText: 'à¨ªà©°à¨œà¨¾à¨¬ à¨¦à©‡ à¨œà¨¼à¨¿à¨²à©à¨¹à¨¿à¨†à¨‚ à¨²à¨ˆ DSR à¨œà¨®à©à¨¹à¨¾à¨‚ 2025-26 à¨²à¨ˆ à¨–à©à©±à¨²à©à¨¹à©‡ à¨¹à¨¨ - à¨†à¨–à¨°à©€ à¨¤à¨¾à¨°à©€à¨–: 30 à¨¸à¨¤à©°à¨¬à¨° 2026 - EMGSM 2020 à¨¦à©€ à¨ªà¨¾à¨²à¨£à¨¾ à¨²à¨¾à¨œà¨¼à¨®à©€',
    langEnglish: 'à¨…à©°à¨—à¨°à©‡à¨œà¨¼à©€',
    langHindi: 'à¨¹à¨¿à©°à¨¦à©€',
    langPunjabi: 'à¨ªà©°à¨œà¨¾à¨¬à©€'
  }
};
let currentPortalLanguage = localStorage.getItem('portalLanguage') || 'en';
function clampPortalFontScale(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 100;
  return Math.min(PORTAL_FONT_MAX, Math.max(PORTAL_FONT_MIN, parsed));
}
function refreshFontControls() {
  document.querySelectorAll('.dash-font-btn').forEach((btn) => {
    const label = (btn.textContent || '').trim();
    const isActive = (label === 'A' && currentFontScale === 100)
      || (label === 'A-' && currentFontScale < 100)
      || (label === 'A+' && currentFontScale > 100);
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });
}
function applyPortalFontScale() {
  currentFontScale = clampPortalFontScale(currentFontScale);
  const scale = currentFontScale / 100;
  document.documentElement.style.fontSize = `${scale * 15}px`;
  document.documentElement.style.setProperty('--portal-font-scale', String(scale));
  if (document.body) {
    document.body.style.zoom = String(scale);
    document.body.classList.toggle('portal-font-custom', currentFontScale !== 100);
  }
  localStorage.setItem('portalFontScale', String(currentFontScale));
  refreshFontControls();
}
window.changeFontSize = function(delta) {
  currentFontScale = delta === 0 ? 100 : currentFontScale + (delta * PORTAL_FONT_STEP);
  applyPortalFontScale();
};
function refreshLanguageControls(lang) {
  const labels = PORTAL_I18N[lang] || PORTAL_I18N.en;
  const buttonText = {
    en: labels.langEnglish,
    hi: labels.langHindi,
    pa: labels.langPunjabi
  };
  document.querySelectorAll('.dash-lang-btn').forEach((btn) => {
    const btnLang = btn.dataset.lang || 'en';
    btn.textContent = buttonText[btnLang] || btnLang.toUpperCase();
    const isActive = btnLang === lang;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });
}
window.applyPortalLanguage = function(lang, showToast = true) {
  const nextLang = PORTAL_I18N[lang] ? lang : 'en';
  const labels = PORTAL_I18N[nextLang];
  currentPortalLanguage = nextLang;
  localStorage.setItem('portalLanguage', nextLang);
  document.documentElement.lang = nextLang === 'pa' ? 'pa-IN' : nextLang === 'hi' ? 'hi-IN' : 'en-IN';
  document.documentElement.dataset.portalLanguage = nextLang;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (key && labels[key]) el.textContent = labels[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    if (key && labels[key]) {
      el.setAttribute('placeholder', labels[key]);
      el.setAttribute('aria-label', labels[key]);
    }
  });

  // Trigger Google Translate
  const combo = document.querySelector('.goog-te-combo');
  if (combo) {
    combo.value = nextLang;
    combo.dispatchEvent(new Event('change'));
  } else {
    // Fallback if widget isn't fully loaded yet
    document.cookie = `googtrans=/en/${nextLang}; path=/; domain=${window.location.hostname}`;
  }

  refreshLanguageControls(nextLang);
  if (showToast && typeof dashPortalToast === 'function') {
    dashPortalToast(labels.languageApplied, 'success');
  }
};
window.addEventListener('DOMContentLoaded',()=>{
  applyPortalFontScale();
  applyPortalLanguage(currentPortalLanguage, false);
  if (typeof repairMainContentStructure === 'function') {
    repairMainContentStructure();
    setTimeout(repairMainContentStructure, 0);
  }
  const workflowView = document.getElementById('view-workflow');
  if (workflowView) {
    workflowView.addEventListener('click', renderWorkflowChecklist, {once:true});
  }
  if (window.initLucide) initLucide();
  document.body.addEventListener('focusout', function(e) {
    if (e.target.tagName === 'TD' && (e.target.contentEditable === 'true' || e.target.hasAttribute('contenteditable'))) {
      const text = e.target.innerText.trim();
      if (text === '') {
        e.target.innerText = 'NA';
        const inputEvent = new Event('input', { bubbles: true });
        e.target.dispatchEvent(inputEvent);
      }
    }
  });
});
function enforceReviewerReadOnly() {
    if (typeof enforceActiveViewHierarchy === 'function') {
        enforceActiveViewHierarchy();
    }
}
window.reviewerNotes = {};
window.reviewerNotesMinimized = true;
function applyReviewerNotesMinimizedState() {
    const box = document.getElementById('reviewer-floating-notes');
    const btn = document.getElementById('reviewer-notes-minimize-btn');
    if (!box) return;
    box.classList.toggle('is-minimized', !!window.reviewerNotesMinimized);
    if (btn) {
        btn.title = window.reviewerNotesMinimized ? 'Expand reviewer notes' : 'Minimize reviewer notes';
        btn.setAttribute('aria-label', btn.title);
        btn.innerHTML = window.reviewerNotesMinimized
            ? '<i data-lucide="maximize-2" style="width:14px; height:14px;"></i>'
            : '<i data-lucide="minus" style="width:14px; height:14px;"></i>';
    }
    
    // Keep the panel anchored below the portal header; the topbar button reopens it.
    if (window.reviewerNotesMinimized) {
        box.style.top = '';
        box.style.left = 'auto';
        box.style.bottom = 'auto';
        box.style.right = '';
        box.onclick = null;
    } else {
        box.onclick = null;
    }
    
    if (window.initLucide) initLucide();
}
function toggleReviewerNotesMinimized() {
    window.reviewerNotesMinimized = !window.reviewerNotesMinimized;
    localStorage.setItem('reviewerNotesMinimized', window.reviewerNotesMinimized ? '1' : '0');
    applyReviewerNotesMinimizedState();
}
window.toggleReviewerNotesMinimized = toggleReviewerNotesMinimized;
function openReviewerNotes() {
    window.reviewerNotesMinimized = false;
    localStorage.setItem('reviewerNotesMinimized', '0');
    const box = document.getElementById('reviewer-floating-notes');
    if (box) box.style.display = 'flex';
    applyReviewerNotesMinimizedState();
}
window.openReviewerNotes = openReviewerNotes;
function loadReviewerNoteForView(viewId, viewTitle) {
    const notesBox = document.getElementById('reviewer-floating-notes');
    if (typeof S === 'undefined' || !hasReviewAccess() || !S.activeProject) {
        if (notesBox) notesBox.style.display = 'none';
        const topbarButton = document.getElementById('reviewer-notes-topbar-btn');
        if (topbarButton) topbarButton.style.display = 'none';
        return;
    }
    if (['dashboard', 'workflow', 'users', 'history'].includes(viewId)) {
        if (notesBox) notesBox.style.display = 'none';
        const topbarButton = document.getElementById('reviewer-notes-topbar-btn');
        if (topbarButton) topbarButton.style.display = 'none';
        return;
    }
    const topbarButton = document.getElementById('reviewer-notes-topbar-btn');
    if (topbarButton) topbarButton.style.display = 'inline-flex';
    if (notesBox) notesBox.style.display = 'flex';
    applyReviewerNotesMinimizedState();
    document.getElementById('reviewer-notes-section-title').textContent = viewTitle || viewId;
    document.getElementById('reviewer-section-note').value = window.reviewerNotes[viewId] || '';
    document.getElementById('reviewer-section-note').dataset.viewId = viewId;
    if (window.lucide) window.lucide.createIcons();
}
function saveReviewerNote() {
    const el = document.getElementById('reviewer-section-note');
    const viewId = el.dataset.viewId;
    if (viewId) {
        window.reviewerNotes[viewId] = el.value;
    }
}
function openReviewModal() {
    let aggregated = '';
    for (let [viewId, note] of Object.entries(window.reviewerNotes)) {
        if (note.trim()) {
            aggregated += `[${viewId.toUpperCase()}]\n${note.trim()}\n\n`;
        }
    }
    document.getElementById('review-aggregated-notes').value = aggregated.trim();
    document.getElementById('modal-review').classList.add('open');
}
async function submitReviewReturn() {
    const comments = document.getElementById('review-aggregated-notes').value.trim();
    if (!comments) { toast('Please enter review comments', 'error'); return; }
    if (!S.activeProject) { toast('No active project', 'error'); return; }
    try {
        await apiSubmitWorkflowAction(S.activeProject.id, 'RETURN', comments);
        toast('Report returned to Data Entry', 'success');
        window.reviewerNotes = {};
        if (S.activeProject) {
            localStorage.removeItem(`reviewerNotes_${S.activeProject.id}`);
        }
        const noteArea = document.getElementById('reviewer-section-note');
        if (noteArea) noteArea.value = '';
        closeModal('modal-review');
        if (typeof renderProjects === 'function') renderProjects();
        showView('dashboard', null);
    } catch (e) {
        toast('Error returning report: ' + e.message, 'error');
    }
}
async function submitReviewApprove() {
    if (!S.activeProject) return;
    try {
        await apiSubmitWorkflowAction(S.activeProject.id, 'APPROVE', 'Section review approved');
        toast('Sections Approved!', 'success');
        if (typeof renderProjects === 'function') renderProjects();
        showView('dashboard', null);
    } catch (e) {
        toast('Error approving report: ' + e.message, 'error');
    }
}
async function checkReviewStatus(projectId) {
    if (S.role !== 'user') return; // Only show alert to data entry
    try {
        const history = await apiFetchReportHistory(projectId);
        if (history && history.length > 0) {
            const latest = history[0];
            if (latest.action === 'RETURN') {
                const banner = document.getElementById('dash-review-banner');
                if (banner) {
                    banner.innerHTML = `
                        <div style="background:var(--amber-lt); border:1px solid var(--amber); border-radius:var(--r-md); padding:16px; display:flex; align-items:start; gap:12px;">
                            <i data-lucide="alert-circle" style="color:var(--amber); width:20px; height:20px; flex-shrink:0; margin-top:2px;"></i>
                            <div>
                                <div style="font-weight:700; color:var(--text); font-size:14px; margin-bottom:4px;">Report Returned for Review</div>
                                <div style="font-size:13px; color:var(--text-mid);">${latest.remarks || 'No comments provided.'}</div>
                            </div>
                        </div>
                    `;
                    banner.style.display = 'block';
                    if (window.initLucide) initLucide();
                }
                const notifDot = document.getElementById('tb-notif-dot');
                if (notifDot) notifDot.style.display = 'block';
                if (latest.remarks) {
                    window.reviewerNotes = {};
                    const sections = latest.remarks.split('[');
                    for (let sec of sections) {
                        if (!sec.trim()) continue;
                        const endIdx = sec.indexOf(']');
                        if (endIdx !== -1) {
                            const key = sec.substring(0, endIdx).toLowerCase().trim();
                            const val = sec.substring(endIdx + 1).trim();
                            if (val) window.reviewerNotes[key] = val;
                        }
                    }
                    if (window.renderReviewerNotes) renderReviewerNotes();
                }
            }
        }
    } catch (e) {
        console.error('Error fetching review status:', e);
    }
}
async function renderHistoryTable() {
    if (!S.activeProject) return;
    const tbody = document.getElementById('history-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading history...</td></tr>';
    try {
        const history = await apiFetchReportHistory(S.activeProject.id);
        if (!history || history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No history available</td></tr>';
            return;
        }
        let html = '';
        history.forEach(log => {
            const dateStr = new Date(log.performedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
            let badgeCls = 'badge-gray';
            if (log.action === 'APPROVE') badgeCls = 'badge-green';
            if (log.action === 'RETURN' || log.action === 'REJECT') badgeCls = 'badge-amber';
            if (log.action === 'SUBMIT') badgeCls = 'badge-blue';
            if (log.action === 'WARNING_IGNORED' || log.action === 'WARNING_IGNORED_SAME_CONTENT') badgeCls = 'badge-red';
            html += `<tr>
                <td>${dateStr}</td>
                <td><span class="badge ${badgeCls}">${log.action}</span></td>
                <td>User ID: ${log.performedBy}</td>
                <td>${log.remarks || '-'}</td>
            </tr>`;
        });
        tbody.innerHTML = html;
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:red;">Failed to load history</td></tr>`;
    }
}
function toggleNotificationDropdown() {
  const dd = document.getElementById('tb-notif-dropdown');
  if (dd) {
    dd.classList.toggle('show');
  }
}
function updateNotificationUI(returnedReports) {
  const dot = document.getElementById('tb-notif-dot');
  const list = document.getElementById('tb-notif-list');
  if (!dot || !list) return;
  if (returnedReports && returnedReports.length > 0) {
    dot.style.display = 'block';
    let html = '';
    returnedReports.forEach(r => {
      html += `<div style="padding: 10px; border-bottom: 1px solid #eee; cursor: pointer;" onclick="openProjectAndWorkflow(${r.projectId})">
        <div style="font-size: 13px; font-weight: 600; color: #b91c1c;">Project Returned</div>
        <div style="font-size: 12px; color: #666; margin-top: 4px;">Project ID: ${r.projectId} needs revision.</div>
      </div>`;
    });
    list.innerHTML = html;
  } else {
    dot.style.display = 'none';
    list.innerHTML = '<div style="padding: 8px; color: #666; font-size: 13px; text-align: center;">No new notifications</div>';
  }
}
function openProjectAndWorkflow(projectId) {
  toggleNotificationDropdown();
  const proj = S.projects.find(p => p.id === projectId);
  if (proj) {
    S.activeProject = proj;
    showView('workflow', null);
  }
}
async function syncNotificationsAndReviewStatus() {
  if (typeof S === 'undefined') return;
  const banner = document.getElementById('dash-review-banner');
  const dot = document.getElementById('tb-notif-dot');
  const list = document.getElementById('tb-notif-list');
  if (banner) {
    banner.style.display = 'none';
    banner.innerHTML = '';
  }
  if (dot) dot.style.display = 'none';
  if (list) list.innerHTML = '<div style="padding: 8px; color: var(--text-soft); font-size: 13px; text-align: center;">Loading notifications...</div>';
  let bannerHtml = '';
  let notifHtml = '';
  let hasUnresolvedReturn = false;
  if (!S.projects) return;
  for (let p of S.projects) {
    try {
      const history = await apiFetchReportHistory(p.id);
      if (history && history.length > 0) {
        const latest = history[0];
        if (latest.action === 'RETURN' || latest.action === 'REJECT') {
          hasUnresolvedReturn = true;
          if (banner) {
            bannerHtml += `
              <div style="background:var(--amber-lt); border:1.5px solid var(--amber); border-radius:var(--r-md); padding:16px; margin-bottom:12px; display:flex; flex-direction:column; gap:10px; box-shadow: 0 4px 12px rgba(245,158,11,0.15);">
                <div style="display:flex; align-items:start; gap:12px;">
                  <i data-lucide="alert-circle" style="color:var(--amber); width:20px; height:20px; flex-shrink:0; margin-top:2px;"></i>
                  <div style="flex:1;">
                    <div style="font-weight:700; color:var(--text); font-size:14px; margin-bottom:2px;">
                      Project "${p.title}" (${p.district}) Returned for Revision
                    </div>
                    <div style="font-size:11px; color:var(--text-faint); margin-bottom:6px;">
                      Returned by Reviewer Â· ${new Date(latest.performedAt).toLocaleString()}
                    </div>
                    <div style="font-size:13px; color:var(--text-mid); background:var(--card); border: 1px solid var(--border-2); padding: 10px; border-radius: 6px; font-style: italic;">
                      ${latest.remarks || 'No comments provided.'}
                    </div>
                  </div>
                </div>
                <!-- Reply Section -->
                <div style="display:flex; flex-direction:column; gap:8px; margin-top:4px; padding-left:32px;">
                  <textarea id="reply-text-${p.id}" placeholder="Type your reply to the reviewer here..." style="width:100%; min-height:60px; padding:10px; border-radius:6px; border:1px solid var(--border-2); background:var(--bg); color:var(--text); font-size:12.5px; resize:vertical; outline:none;" oninput="this.style.borderColor='var(--amber)'" onblur="this.style.borderColor='var(--border-2)'"></textarea>
                  <div style="display:flex; justify-content:flex-end;">
                    <button class="btn btn-navy btn-sm" onclick="submitDeoReply(${p.id})" style="padding: 6px 16px; font-size: 12px; background:var(--primary); font-weight:700; border-radius:6px;">Submit Reply & Remarks</button>
                  </div>
                </div>
              </div>
            `;
          }
          notifHtml += `
            <div style="padding: 10px; border-bottom: 1px solid var(--border); cursor: pointer;" onclick="openProjectAndWorkflow(${p.id})">
              <div style="font-size: 13px; font-weight: 600; color: #ef4444; display:flex; align-items:center; gap:6px;">
                <span style="display:inline-block; width:6px; height:6px; background:#ef4444; border-radius:50%;"></span>
                Project Returned
              </div>
              <div style="font-size: 12px; color: var(--text); font-weight:500; margin-top: 4px;">Project "${p.title}" needs revision.</div>
              <div style="font-size: 11px; color: var(--text-soft); margin-top: 2px; font-style:italic; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">"${latest.remarks || ''}"</div>
            </div>
          `;
        }
      }
    } catch (e) {
      console.error('Error syncing project status:', p.id, e);
    }
  }
  if (hasUnresolvedReturn) {
    if (dot) dot.style.display = 'block';
    if (list && notifHtml) list.innerHTML = notifHtml;
    if (banner && bannerHtml) {
      banner.innerHTML = bannerHtml;
      banner.style.display = 'block';
      banner.style.border = 'none';
      banner.style.background = 'transparent';
      banner.style.padding = '0';
      if (window.initLucide) initLucide();
    }
  } else if (list) {
    const projects = Array.isArray(S.projects) ? S.projects.slice(0, 5) : [];
    if (projects.length) {
      if (dot) dot.style.display = 'block';
      list.innerHTML = projects.map(p => `
        <div style="padding: 10px; border-bottom: 1px solid var(--border); cursor: pointer;" onclick="openProjectAndWorkflow(${p.id})">
          <div style="font-size: 13px; font-weight: 700; color: var(--text); display:flex; align-items:center; gap:6px;">
            <span style="display:inline-block; width:6px; height:6px; background:${Number(p.progress) >= 100 ? 'var(--green)' : 'var(--saffron)'}; border-radius:50%;"></span>
            ${p.title || 'DSR Project'}
          </div>
          <div style="font-size: 12px; color: var(--text-soft); margin-top: 4px;">${p.district || 'Punjab'} Â· ${p.status || 'In Progress'} Â· ${Number(p.progress) || 0}% complete</div>
        </div>
      `).join('');
    } else {
      if (dot) dot.style.display = 'none';
      list.innerHTML = '<div style="padding: 10px; color: var(--text-soft); font-size: 13px; text-align: center;">No projects yet. Notifications will appear after project activity.</div>';
    }
  }
}
async function submitDeoReply(projectId) {
  const textEl = document.getElementById(`reply-text-${projectId}`);
  const remarks = textEl ? textEl.value.trim() : '';
  if (!remarks) { toast('Please enter a reply message', 'error'); return; }
  try {
    await apiFetch(`/reports/${projectId}/workflow`, {
      method: 'POST',
      body: JSON.stringify({ action: 'DEO_REPLY', remarks: remarks })
    });
    toast('Reply submitted successfully!', 'success');
    if (textEl) textEl.value = '';
    await syncNotificationsAndReviewStatus();
    if (typeof renderProjects === 'function') renderProjects();
    if (typeof renderHistoryTable === 'function' && S.activeProject && S.activeProject.id === projectId) {
      renderHistoryTable();
    }
  } catch (e) {
    toast('Failed to send reply: ' + e.message, 'error');
  }
}
document.addEventListener('DOMContentLoaded', () => {
  const transitionLinks = document.querySelectorAll('a[href$=".html"], a.nav-link-item, a.btn-premium-cta');
  transitionLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const targetUrl = this.getAttribute('href');
      if (targetUrl && !targetUrl.startsWith('#') && !targetUrl.startsWith('javascript:')) {
        e.preventDefault();
        if (targetUrl.includes('index.html') || targetUrl === '/' || targetUrl === '') {
          document.body.classList.add('slide-to-right');
        } else {
          document.body.classList.add('slide-to-left');
        }
        setTimeout(() => {
          window.location.href = targetUrl;
        }, 180);
      }
    });
  });
});

;
function calculateProjectProgress(state) {
  let progress = 0;

  // Step 1: Project Setup (always done if project loaded)
  progress += 10;

  // Step 2: Front Matter (15%)
  const fmOk = !!(
    state.uploadedPDFs && 
    state.uploadedPDFs.cover && 
    state.uploadedPDFs.cert && 
    state.uploadedPDFs.toc && 
    (state.uploadedPDFs.pref || (state.frontMatter && state.frontMatter.preface && state.frontMatter.preface.trim().length > 10)) && 
    (state.uploadedPDFs.ack || (state.frontMatter && state.frontMatter.acknowledgement && state.frontMatter.acknowledgement.trim().length > 10))
  );
  if (!fmOk) return progress;
  progress += 15;

  // Step 3: Chapters (20%)
  const uploadedChaptersCount = state.chapters ? state.chapters.filter(ch => ch.fileName || (state.chapterPDFs && state.chapterPDFs[ch.id])).length : 0;
  const chaptersOk = state.chapters && state.chapters.length >= 2 && uploadedChaptersCount >= state.chapters.length;
  if (!chaptersOk) {
    return progress + Math.min(20, uploadedChaptersCount * 10);
  }
  progress += 20;

  // Step 4: Plates (15%)
  const uploadedPlatesCount = state.plates ? state.plates.filter(p => p.fileName).length : 0;
  const platesOk = state.plates && state.plates.length > 0 && uploadedPlatesCount >= state.plates.length;
  if (!platesOk) {
    return progress + Math.min(15, Math.floor((uploadedPlatesCount / (state.plates ? state.plates.length : 2)) * 15));
  }
  progress += 15;

  // Step 5: Annexures (20%)
  let annexureCount = 0;
  if (state.uploadedPDFs) {
    if (state.uploadedPDFs.anx1) annexureCount++;
    if (state.uploadedPDFs.anx2) annexureCount++;
    if (state.uploadedPDFs.anx3) annexureCount++;
    if (state.uploadedPDFs.anx4) annexureCount++;
    if (state.uploadedPDFs.anx5) annexureCount++;
    if (state.uploadedPDFs.anx6) annexureCount++;
    if (state.uploadedPDFs.anx7) annexureCount++;
  }
  const annexuresOk = state.annexuresOpened || (annexureCount === 7);
  if (!annexuresOk) {
    return progress + Math.round(annexureCount * (20 / 7));
  }
  progress += 20;

  // Step 6: Tables (10%)
  const hasTableData = (state.annexureB && state.annexureB.length > 0) || 
                       (state.annexureC && state.annexureC.length > 0) || 
                       (state.annexureD && state.annexureD.length > 0) || 
                       (state.annexureE && state.annexureE.length > 0) ||
                       (state.annexureG && state.annexureG.length > 0) ||
                       (state.annexureH && state.annexureH.length > 0) ||
                       (state.annexureI && state.annexureI.length > 0) ||
                       (state.annexureJ && state.annexureJ.length > 0) ||
                       (state.auctionData && state.auctionData.length > 0);
  const tablesOk = state.tablesOpened || hasTableData;
  if (!tablesOk) return progress;
  progress += 10;

  // Step 7: PDF (10%)
  const hasPdf = !!(state.finalPdfName || state.finalPdfGeneratedAt);
  if (!hasPdf) return progress;
  progress += 10;

  return Math.min(100, Math.floor(progress));
}

function updateLiveProgressUI(progress) {
  let bar = document.getElementById('global-live-progress');
  if (pctEl) {
    pctEl.textContent = typeof S !== 'undefined' && S.activeProject ? 'Project Progress: ' + progress + '%' : '';
  }
}

document.addEventListener('focusin', (e) => {
  const select = e.target;
  if (select && select.tagName === 'SELECT' && select.closest('table')) {
    const view = select.closest('.view');
    if (!view) return;
    const viewId = view.id.replace('view-', '');
    const isAnnexure = /^(anx[1-7]|annexure-[b-k])$/i.test(viewId);
    if (!isAnnexure) return;

    const isAdmin = !!(
      window.S && (
        S.role === 'admin' || 
        (S.user && (
          S.user.role === 'admin' || 
          String(S.user.email || '').toLowerCase().includes('admin')
        ))
      )
    );

    if (!isAdmin) return;

    select.dataset.prevValue = select.value;

    let hasCustomOption = false;
    for (let i = 0; i < select.options.length; i++) {
      if (select.options[i].value === '__custom__' || select.options[i].text === 'Enter custom value') {
        hasCustomOption = true;
        break;
      }
    }

    if (!hasCustomOption) {
      const opt = document.createElement('option');
      opt.value = '__custom__';
      opt.text = 'Enter custom value';
      select.appendChild(opt);
    }
  }
});

document.addEventListener('change', (e) => {
  const select = e.target;
  if (select && select.tagName === 'SELECT' && select.closest('table')) {
    const view = select.closest('.view');
    if (!view) return;
    const viewId = view.id.replace('view-', '');
    const isAnnexure = /^(anx[1-7]|annexure-[b-k])$/i.test(viewId);
    if (!isAnnexure) return;

    if (select.value === '__custom__') {
      if (typeof window.showCustomPromptModal === 'function') {
        window.showCustomPromptModal('Enter custom value', '', (customVal) => {
          if (customVal && customVal.trim() !== '') {
            const trimmed = customVal.trim();
            let opt = Array.from(select.options).find(o => o.text === trimmed || o.value === trimmed);
            if (!opt) {
              opt = document.createElement('option');
              opt.value = trimmed;
              opt.text = trimmed;
              const customOpt = Array.from(select.options).find(o => o.value === '__custom__');
              if (customOpt) {
                select.insertBefore(opt, customOpt);
              } else {
                select.appendChild(opt);
              }
            }
            select.value = trimmed;
            select.dataset.prevValue = trimmed;

            select.dispatchEvent(new Event('input', { bubbles: true }));
            select.dispatchEvent(new Event('change', { bubbles: true }));
            
            if (window.refreshCurrentLivePreview) {
              window.refreshCurrentLivePreview(120);
            }
          } else {
            select.value = select.dataset.prevValue || '';
          }
        }, "Confirm");
      } else {
        const customVal = prompt('Enter custom value:');
        if (customVal && customVal.trim() !== '') {
          const trimmed = customVal.trim();
          let opt = Array.from(select.options).find(o => o.text === trimmed || o.value === trimmed);
          if (!opt) {
            opt = document.createElement('option');
            opt.value = trimmed;
            opt.text = trimmed;
            const customOpt = Array.from(select.options).find(o => o.value === '__custom__');
            if (customOpt) {
              select.insertBefore(opt, customOpt);
            } else {
              select.appendChild(opt);
            }
          }
          select.value = trimmed;
          select.dataset.prevValue = trimmed;

          select.dispatchEvent(new Event('input', { bubbles: true }));
          select.dispatchEvent(new Event('change', { bubbles: true }));
          
          if (window.refreshCurrentLivePreview) {
            window.refreshCurrentLivePreview(120);
          }
        } else {
          select.value = select.dataset.prevValue || '';
        }
      }
    } else {
      select.dataset.prevValue = select.value;
    }
  }
});

function restoreSession() {
  const token = localStorage.getItem('dsr_token');
  const userJson = localStorage.getItem('dsr_user');
  if (token && userJson) {
    try {
      S.user = JSON.parse(userJson);
      S.role = localStorage.getItem('dsr_role') || S.user.role || 'user';
      S.backendRole = S.user.backendRole || 'ROLE_OFFICER';
      S.permissions = S.user.permissions || [];
      S.scope = S.user.scope || {};
      S.accessLabel = S.user.accessLabel || '';
      showAppScreen();
    } catch(e) {
      console.error('Failed to restore session', e);
      localStorage.removeItem('dsr_token');
      localStorage.removeItem('dsr_user');
      localStorage.removeItem('dsr_role');
    }
  }
}
window.addEventListener('DOMContentLoaded', restoreSession);


/* â”€â”€â”€ Dashboard Latest Updates (dynamic from publicAnnouncements) â”€â”€â”€ */
function renderDashboardLatestUpdates(jsonString) {
  var list = document.getElementById('dash-latest-updates-list');
  if (!list) return;
  var items = [];
  if (typeof window.normalizeAnnouncements === 'function') {
    items = window.normalizeAnnouncements(jsonString);
  } else {
    try { items = JSON.parse(jsonString); } catch(e) { return; }
  }
  if (!Array.isArray(items) || items.length === 0) return;
  list.innerHTML = items.map(function(it, idx) {
    var title = [it.title || '', it.description || ''].filter(Boolean).join(' - ');
    return '<li class="dash-update-item"><div class="dash-update-dot"></div><div class="dash-update-content"><span class="dash-update-text">' + title + '</span><div class="dash-update-meta"><span>' + (it.date || '') + '</span>' + (idx === 0 ? '<span class="dash-badge-new">NEW</span>' : '') + '</div></div></li>';
  }).join('');
}
window.renderDashboardLatestUpdates = renderDashboardLatestUpdates;

document.addEventListener('DOMContentLoaded', function() {
  var stored = localStorage.getItem('publicAnnouncements');
  if (stored) renderDashboardLatestUpdates(stored);
  fetch('/api/settings/publicAnnouncements')
    .then(function(r) { return r.ok ? r.json() : null; })
    .then(function(data) { if (data && data.value) { localStorage.setItem('publicAnnouncements', data.value); renderDashboardLatestUpdates(data.value); } })
    .catch(function() {});
});


/* â”€â”€â”€ Dashboard Contact & Demo Support (dynamic from portalContactInfo) â”€â”€â”€ */
function renderDashboardContactInfo(jsonString) {
  var _keyMap = [
    { titleId: 'ci-nodal-title',    contentId: 'ci-nodal-content' },
    { titleId: 'ci-email-title',    contentId: 'ci-email-content' },
    { titleId: 'ci-helpline-title', contentId: 'ci-helpline-content' },
    { titleId: 'ci-hours-title',    contentId: 'ci-hours-content' }
  ];
  var items = [];
  try { items = JSON.parse(jsonString); } catch(e) { return; }
  if (!Array.isArray(items)) return;
  items.forEach(function(item, idx) {
    var map = _keyMap[idx];
    if (!map) return;
    var titleEl = document.getElementById(map.titleId);
    var contentEl = document.getElementById(map.contentId);
    if (titleEl && item.title) titleEl.textContent = item.title;
    if (contentEl && item.content) contentEl.textContent = item.content;
  });
}
window.renderDashboardContactInfo = renderDashboardContactInfo;

/* Auto-load contact info on DOMContentLoaded */
document.addEventListener('DOMContentLoaded', function() {
  var stored = localStorage.getItem('portalContactInfo');
  if (stored) renderDashboardContactInfo(stored);
  fetch('/api/settings/contactInfo')
    .then(function(r) { return r.ok ? r.json() : null; })
    .then(function(data) {
      if (data && data.value) {
        localStorage.setItem('portalContactInfo', data.value);
        renderDashboardContactInfo(data.value);
      }
    })
    .catch(function() {});
});
