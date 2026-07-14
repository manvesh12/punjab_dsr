(function() {
// Model DSR Report Module
// Handles the UI, compilation, and custom PDF generation for Model DSR reports.

function injectDraggableStyles() {
  if (document.getElementById('draggable-styles')) return;
  const style = document.createElement('style');
  style.id = 'draggable-styles';
  style.innerHTML = `
    .draggable-section-item {
      background: #ffffff !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 8px !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02) !important;
      margin-bottom: 10px !important;
      padding: 10px 14px !important;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }
    .draggable-section-item:hover {
      border-color: #cbd5e1 !important;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03) !important;
    }
    .draggable-section-item.dragging {
      opacity: 0.3 !important;
      background: #f8fafc !important;
      border: 1.5px dashed #cbd5e1 !important;
      box-shadow: none !important;
    }
    .draggable-section-item.drag-over {
      border: 1.5px dashed #3b82f6 !important;
      background: #eff6ff !important;
    }
    .drag-handle {
      cursor: grab !important;
      color: #94a3b8 !important;
      display: flex !important;
      align-items: center !important;
      padding: 6px 4px !important;
      border-radius: 4px !important;
      background: #f1f5f9 !important;
      transition: all 0.15s ease !important;
    }
    .drag-handle:hover {
      background: #cbd5e1 !important;
      color: #1e293b !important;
    }
    .drag-handle:active {
      cursor: grabbing !important;
    }
  `;
  document.head.appendChild(style);
}

async function initModelDsrView() {
  injectDraggableStyles();
  const container = document.getElementById('view-model-dsr');
  if (!container) return;
  
  const selectContainer = document.getElementById('model-dsr-project-select-container');
  const contentContainer = document.getElementById('model-dsr-content-container');
  const editorContainer = document.getElementById('model-dsr-editor-container');
  
  if (selectContainer) selectContainer.style.display = 'none';
  if (contentContainer) contentContainer.style.display = 'none';
  if (!editorContainer) return;
  
  const replenishmentEditor = document.getElementById('repl-editor-container');
  if (replenishmentEditor) replenishmentEditor.innerHTML = '';

  editorContainer.style.display = 'block';

  if (!S.activeProject || !S.activeProject.id) {
    editorContainer.innerHTML = `
      <div class="card" style="margin-top:20px; padding:40px; text-align:center; max-width:600px; margin:20px auto;">
        <i data-lucide="info" style="width:48px;height:48px;color:#3b82f6;display:block;margin:0 auto 16px;"></i>
        <h2 style="color:#17324d;">No Active Project</h2>
        <p style="color:#64748b; margin-top:8px;">Please select a DSR project from the projects list first to manage its Model DSR reports.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }
  
  editorContainer.innerHTML = `
    <div style="max-width: 800px; margin: 40px auto; padding: 0 20px; text-align: center;">
      <div style="border: 4px solid #f1f5f9; border-top: 4px solid #f59e0b; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 20px auto;"></div>
      <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size:14px; color:#64748b; font-weight:700; margin-top:12px;">Loading saved reports from server...</p>
    </div>
  `;
  
  await refreshLocalReportsFromServer();
  
  // Show the main option cards
  window.showModelDsrOptions(editorContainer);
}

// Hook into existing navigation system
const originalShowViewModelDsrHook = window.showView;
window.showView = function(viewId, caller) {
  if (originalShowViewModelDsrHook) originalShowViewModelDsrHook(viewId, caller);
  if (viewId === 'model-dsr') {
    initModelDsrView();
  }
};

if (window.location.hash === '#model-dsr' || window.currentViewId === 'model-dsr') {
  setTimeout(() => initModelDsrView(), 100);
}

// Sync sidebar visibility
const annexureNav = document.getElementById('annexure-nav');
const replenishmentNav = document.getElementById('replenishment-nav');
if (annexureNav instanceof Node && replenishmentNav instanceof HTMLElement) {
  replenishmentNav.style.display = annexureNav.style.display;
  new MutationObserver(() => {
    replenishmentNav.style.display = annexureNav.style.display;
  }).observe(annexureNav, { attributes: true, attributeFilter: ['style'] });
}

const MODEL_DSR_SECTION_TITLES = {
  anx1: 'Annexure I - Sources',
  anx2: 'Annexure II - Leases',
  anx3: 'Annexure III - Clusters',
  anx4: 'Annexure IV - Transport',
  anx5: 'Annexure V - Bench Mark & CORS',
  anx6: 'Annexure VI - Final Cluster Details',
  anx7: 'Annexure VII - Transportation Routes',
  'annexure-b': 'Annexure B',
  'annexure-c': 'Annexure C',
  'annexure-d': 'Annexure D',
  'annexure-e': 'Annexure E',
  'annexure-f': 'Annexure F',
  'annexure-g': 'Annexure G',
  'annexure-h': 'Annexure H',
  'annexure-i': 'Annexure I',
  'annexure-j': 'Annexure J',
  'annexure-k': 'Annexure K'
};

function getModelDsrSectionTitle(viewId) {
  const fallback = MODEL_DSR_SECTION_TITLES[viewId] || String(viewId || '').toUpperCase();
  return typeof getEditableAnnexureTitle === 'function'
    ? getEditableAnnexureTitle(viewId, fallback)
    : fallback;
}

let localReportsCache = [];

function getReportsStorageKey() {
  return S.activeProject && S.activeProject.id ? `model_dsr_reports_${S.activeProject.id}` : '';
}

function normalizeBackendReport(study) {
  const state = study && study.reportState && typeof study.reportState === 'object' ? study.reportState : {};
  return {
    id: study.id,
    name: study.title,
    createdAt: study.createdAt,
    sections: Array.isArray(state.sections) ? state.sections : [],
    frontMatterPdfs: state.frontMatterPdfs || {},
    customPdfs: state.customPdfs || {},
    customSections: Array.isArray(state.customSections) ? state.customSections : [],
    sectionOrder: Array.isArray(state.sectionOrder) ? state.sectionOrder : []
  };
}

function cacheReports(reports) {
  localReportsCache = Array.isArray(reports) ? reports : [];
  window.modelDsrReports = localReportsCache;
  const key = getReportsStorageKey();
  if (key) {
    try {
      localStorage.setItem(key, JSON.stringify(localReportsCache));
    } catch (err) {
      console.warn("Failed to cache Model DSR reports locally:", err);
    }
  }
  return localReportsCache;
}

function loadLocalReports() {
  if (!S.activeProject) return [];
  if (localReportsCache.length) return localReportsCache;
  const key = getReportsStorageKey();
  if (!key) return [];
  try {
    return cacheReports(JSON.parse(localStorage.getItem(key) || '[]'));
  } catch (err) {
    console.warn("Failed to load local Model DSR cache:", err);
    return cacheReports([]);
  }
}

async function refreshLocalReportsFromServer() {
  const fallbackReports = loadLocalReports();
  if (!S.activeProject || !S.activeProject.id) return fallbackReports;
  try {
    const studies = await apiFetch(`/projects/${S.activeProject.id}/replenishment`);
    const reports = (studies || [])
      .filter(study => study.reportState?.type === 'model_dsr')
      .map(normalizeBackendReport);
    return cacheReports(reports);
  } catch (err) {
    console.error("Failed to load reports from database:", err);
    return fallbackReports;
  }
}

function upsertLocalReport(report) {
  const reports = loadLocalReports();
  const index = reports.findIndex(r => r.id === report.id);
  if (index >= 0) {
    reports[index] = report;
  } else {
    reports.unshift(report);
  }
  cacheReports(reports);
  return report;
}

function saveLocalReports(reports) {
  cacheReports(reports);
  localReportsCache.forEach(report => {
    saveReportToServer(report);
  });
}

// Helper: save report to server database
async function saveReportToServer(report) {
  if (!report || !report.id) return;
  try {
    const payload = {
      title: report.name,
      status: 'DRAFT',
      reportState: {
        type: 'model_dsr',
        sections: report.sections || [],
        frontMatterPdfs: report.frontMatterPdfs || {},
        customPdfs: report.customPdfs || {},
        customSections: report.customSections || [],
        sectionOrder: report.sectionOrder || []
      }
    };
    await apiFetch(`/replenishment/${report.id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error("Failed to save report to server:", err);
    toast("Failed to auto-save change to server: " + err.message, "error");
  }
}

// Expose functions to window
window.mdsrSaveReportToServer = saveReportToServer;
window.showModelDsrOptions = showModelDsrOptions;
window.mdsrShowCreateReportForm = showCreateReportForm;
window.mdsrShowExistingReportsList = showExistingReportsList;
window.mdsrSubmitCustomReportName = submitCustomReportName;
window.mdsrOpenCustomReport = openCustomReport;
window.mdsrRenameCustomReport = renameCustomReport;
window.mdsrDeleteCustomReport = deleteCustomReport;
window.mdsrDownloadCustomReportPDFDirect = downloadCustomReportPDFDirect;
window.mdsrOnParentCheckboxChange = onParentCheckboxChange;
window.mdsrOnSubCheckboxChange = onSubCheckboxChange;
window.mdsrUpdateCustomReportPreview = updateCustomReportPreview;
window.mdsrDownloadCustomReportPDF = downloadCustomReportPDF;
window.mdsrInitDragAndDrop = initDragAndDrop;
window.mdsrSaveNewSectionOrder = saveNewSectionOrder;
window.mdsrResetSectionOrder = resetSectionOrder;
window.mdsrAddCustomSection = addCustomSection;
window.mdsrHandleCustomSectionPdfUpload = handleCustomSectionPdfUpload;
window.mdsrRemoveCustomSectionPdf = removeCustomSectionPdf;
window.mdsrDeleteCustomSection = deleteCustomSection;
window.mdsrCloseCustomPdfModal = closeCustomPdfModal;
window.mdsrConfirmAddCustomSection = confirmAddCustomSection;
window.mdsrHandleFrontMatterPdfUpload = handleFrontMatterPdfUpload;
window.mdsrRemoveFrontMatterPdfUpload = removeFrontMatterPdfUpload;

function showModelDsrOptions(container) {
  container.innerHTML = `
    <div style="max-width: 800px; margin: 40px auto; padding: 0 20px;">
      <div style="text-align: center; margin-bottom: 40px;">
        <h2 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 24px; font-weight: 800; color: #1e293b; margin: 0 0 10px 0;">Model DSR</h2>
        <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; color: #64748b; margin: 0;">Create and compile Model DSR reports by selecting specific DSR sections.</p>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
        <!-- Card 1: Create New Report -->
        <div class="card" onclick="window.mdsrShowCreateReportForm()" style="padding: 32px; text-align: center; cursor: pointer; border: 1.5px solid #e2e8f0; border-radius: 12px; transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s; background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); display: flex; flex-direction: column; align-items: center;">
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: #eff6ff; border-radius: 12px; margin-bottom: 20px;">
            <i data-lucide="file-plus" style="width: 28px; height: 28px; color: #2563eb;"></i>
          </div>
          <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 18px; font-weight: 700; color: #1e293b; margin: 0 0 8px 0;">Create New Report</h3>
          <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: #64748b; margin: 0; line-height: 1.5;">Define a report name, choose custom sections, and generate a printable PDF.</p>
        </div>
        
        <!-- Card 2: Open Existing Report -->
        <div class="card" onclick="window.mdsrShowExistingReportsList()" style="padding: 32px; text-align: center; cursor: pointer; border: 1.5px solid #e2e8f0; border-radius: 12px; transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s; background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); display: flex; flex-direction: column; align-items: center;">
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: #f0fdf4; border-radius: 12px; margin-bottom: 20px;">
            <i data-lucide="folder-open" style="width: 28px; height: 28px; color: #16a34a;"></i>
          </div>
          <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 18px; font-weight: 700; color: #1e293b; margin: 0 0 8px 0;">Open Existing Report</h3>
          <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: #64748b; margin: 0; line-height: 1.5;">Open, edit, rename, delete or download previously compiled reports.</p>
        </div>
      </div>
    </div>
  `;
  if (window.lucide) lucide.createIcons();
}

function showCreateReportForm() {
  const editorContainer = document.getElementById('model-dsr-editor-container');
  if (!editorContainer) return;
  
  editorContainer.innerHTML = `
    <div class="card" style="margin-top: 40px; padding: 32px; max-width: 540px; margin: 40px auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05);">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: #eff6ff; border-radius: 12px; margin-bottom: 16px;">
          <i data-lucide="file-plus" style="width: 28px; height: 28px; color: #2563eb;"></i>
        </div>
        <h2 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 20px; font-weight: 800; color: #1e293b; margin: 0 0 8px 0;">New Model DSR Report</h2>
        <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: #64748b; margin: 0; line-height: 1.5;">Enter a name for your custom report to start selecting DSR sections and compiling the PDF.</p>
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div class="field" style="display: flex; flex-direction: column; gap: 6px; text-align: left;">
          <label for="new-report-name-input" style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Report Title</label>
          <input type="text" id="new-report-name-input" placeholder="e.g. Model DSR Report 2026" style="padding: 10px 14px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; transition: border-color 0.2s;" onkeydown="if(event.key==='Enter') window.mdsrSubmitCustomReportName()">
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-outline" onclick="window.showModelDsrOptions(document.getElementById('model-dsr-editor-container'))" style="flex:1; height: 42px; border-radius: 8px; cursor: pointer;">Back</button>
          <button class="btn btn-primary" onclick="window.mdsrSubmitCustomReportName()" style="flex:2; display: flex; align-items: center; justify-content: center; height: 42px; gap: 8px; font-weight: 700; font-size: 14px; border-radius: 8px; border: none; cursor: pointer;">
            <span>Create Report</span>
            <i data-lucide="arrow-right" style="width: 16px; height: 16px;"></i>
          </button>
        </div>
      </div>
    </div>
  `;
  if (window.lucide) lucide.createIcons();
  
  setTimeout(() => {
    const input = document.getElementById('new-report-name-input');
    if (input) input.focus();
  }, 100);
}

async function submitCustomReportName() {
  const input = document.getElementById('new-report-name-input');
  if (!input) return;
  const reportName = input.value.trim();
  if (!reportName) {
    toast("Please enter a report name", "error");
    return;
  }
  
  try {
    const res = await apiFetch(`/projects/${S.activeProject.id}/replenishment`, {
      method: 'POST',
      body: JSON.stringify({
        title: reportName,
        reportState: {
          type: 'model_dsr',
          sections: [],
          frontMatterPdfs: {},
          customPdfs: {},
          customSections: [],
          sectionOrder: []
        }
      })
    });
    
    const newReport = {
      id: res.id,
      name: res.title,
      createdAt: res.createdAt,
      sections: [],
      frontMatterPdfs: {},
      customPdfs: {},
      customSections: [],
      sectionOrder: []
    };
    
    window.activeReport = upsertLocalReport(newReport);
    const editorContainer = document.getElementById('model-dsr-editor-container');
    if (editorContainer) {
      renderCustomReportGenerator(editorContainer, newReport);
    }
  } catch (err) {
    toast("Failed to create report: " + err.message, "error");
  }
}

async function showExistingReportsList() {
  const editorContainer = document.getElementById('model-dsr-editor-container');
  if (!editorContainer) return;
  
  editorContainer.innerHTML = `<div style="padding:40px; text-align:center; font-weight:700; color:#1e293b;">Loading saved reports...</div>`;
  const reports = await refreshLocalReportsFromServer();
  
  let rowsHtml = '';
  if (reports.length === 0) {
    rowsHtml = `
      <tr>
        <td colspan="4" style="text-align:center; padding: 30px; color: #64748b;">No saved reports found. Click 'Back' and create a new report.</td>
      </tr>
    `;
  } else {
    reports.forEach(r => {
      const dateStr = new Date(r.createdAt).toLocaleDateString();
      const count = r.sections ? r.sections.length : 0;
      
      rowsHtml += `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px; font-weight: 600; color: #1e293b;">${r.name}</td>
          <td style="padding: 12px; color: #475569;">${dateStr}</td>
          <td style="padding: 12px; color: #64748b;">
            <span style="font-size:11px; background:#f1f5f9; color:#475569; padding:2px 8px; border-radius:10px; font-weight:600;">${count} sections</span>
          </td>
          <td style="padding: 12px; display:flex; gap:8px; align-items:center;">
            <button class="btn btn-sm btn-primary" onclick="window.mdsrOpenCustomReport('${r.id}')" style="padding: 4px 8px; font-size: 11.5px; height: auto; cursor: pointer;">Open</button>
            <button class="btn btn-sm btn-outline" onclick="window.mdsrRenameCustomReport('${r.id}')" style="padding: 4px 8px; font-size: 11.5px; height: auto; cursor: pointer;">Rename</button>
            <button class="btn btn-sm btn-saffron" onclick="window.mdsrDownloadCustomReportPDFDirect('${r.id}')" style="padding: 4px 8px; font-size: 11.5px; height: auto; cursor: pointer;">Download PDF</button>
            <button class="btn btn-sm btn-outline text-danger" onclick="window.mdsrDeleteCustomReport('${r.id}')" style="padding: 4px 8px; font-size: 11.5px; height: auto; border-color:#f87171 !important; color:#ef4444 !important; cursor: pointer;">Delete</button>
          </td>
        </tr>
      `;
    });
  }
  
  editorContainer.innerHTML = `
    <div class="card" style="margin-top: 20px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <div>
          <h2 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 18px; font-weight: 800; color: #1e293b; margin:0 0 4px 0;">Saved Model DSR Reports</h2>
          <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; color: #64748b; margin:0;">Saved reports for DSR project: ${S.activeProject.projectName || S.activeProject.district}</p>
        </div>
        <button class="btn btn-outline" onclick="window.showModelDsrOptions(document.getElementById('model-dsr-editor-container'))" style="cursor: pointer;">Back</button>
      </div>
      
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; text-align:left; font-size:13px;">
          <thead>
            <tr style="border-bottom: 2px solid #cbd5e1; background:#f8fafc; font-weight:700; color:#334155;">
              <th style="padding:10px 12px;">Report Name</th>
              <th style="padding:10px 12px;">Date Created</th>
              <th style="padding:10px 12px;">Coverage</th>
              <th style="padding:10px 12px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function openCustomReport(reportId) {
  try {
    const s = await apiFetch(`/replenishment/${reportId}`);
    const report = upsertLocalReport(normalizeBackendReport(s));
    window.activeReport = report;
    const editorContainer = document.getElementById('model-dsr-editor-container');
    if (editorContainer) {
      renderCustomReportGenerator(editorContainer, report);
    }
  } catch (err) {
    toast("Failed to open report: " + err.message, "error");
  }
}

async function renameCustomReport(reportId) {
  try {
    const s = await apiFetch(`/replenishment/${reportId}`);
    showCustomPromptModal("Rename Report", s.title, async (newName) => {
      try {
        await apiFetch(`/replenishment/${reportId}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: newName
          })
        });
        toast("Report renamed successfully!", "success");
        showExistingReportsList();
      } catch (e) {
        toast("Rename failed: " + e.message, "error");
      }
    }, "Rename");
  } catch (err) {
    toast("Failed to load report: " + err.message, "error");
  }
}

function deleteCustomReport(reportId) {
  showCustomConfirmModal({
    title: "Delete report?",
    message: "This saved Model DSR report will be removed from the list.",
    confirmText: "Delete",
    tone: "danger",
    onConfirm: async () => {
      try {
        await apiFetch(`/replenishment/${reportId}`, {
          method: 'DELETE'
        });
        toast("Report deleted successfully!", "success");
        showExistingReportsList();
      } catch (err) {
        toast("Failed to delete report: " + err.message, "error");
      }
    }
  });
}

async function downloadCustomReportPDFDirect(reportId) {
  try {
    const s = await apiFetch(`/replenishment/${reportId}`);
    const report = upsertLocalReport(normalizeBackendReport(s));
    restoreReportFrontMatterPdfs(report);
    
    const checkedIds = report.sections || [];
    if (checkedIds.length === 0) {
      toast("No sections selected in this report to download.", "error");
      return;
    }
    
    generateModelDsrPDF(report.name, checkedIds, reportId);
  } catch (err) {
    toast("Failed to download PDF: " + err.message, "error");
  }
}

function getCurrentSelectedReportSectionIds() {
  const scope = document.getElementById('draggable-sections-list') || document;
  const checkboxes = scope.querySelectorAll('input[id^="chk-"]:checked');
  return Array.from(new Set(Array.from(checkboxes).map(c => c.value).filter(Boolean)));
}

async function saveReportSelection(reportId) {
  if (window.activeReport && window.activeReport.id === reportId) {
    window.activeReport.sections = getCurrentSelectedReportSectionIds();
    await saveReportToServer(window.activeReport);
  }
}

function initDragAndDrop(reportId, reportName) {
  const container = document.getElementById('draggable-sections-list');
  if (!container) return;
  
  const scrollContainer = document.getElementById('model-dsr-checklist-scroll-container');
  let dragEl = null;
  let autoScrollInterval = null;
  
  function startAutoScroll(direction) {
    if (autoScrollInterval) return;
    autoScrollInterval = setInterval(() => {
      if (scrollContainer) {
        scrollContainer.scrollTop += direction * 7;
      }
    }, 15);
  }
  
  function stopAutoScroll() {
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      autoScrollInterval = null;
    }
  }
  
  const items = container.querySelectorAll('.draggable-section-item');
  items.forEach(item => {
    const handle = item.querySelector('.drag-handle');
    if (handle) {
      handle.addEventListener('mousedown', () => {
        item.setAttribute('draggable', 'true');
      });
      handle.addEventListener('mouseup', () => {
        item.removeAttribute('draggable');
      });
    }
    
    item.addEventListener('dragstart', (e) => {
      dragEl = item;
      setTimeout(() => {
        item.classList.add('dragging');
      }, 0);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', item.getAttribute('data-section-id'));
    });
    
    item.addEventListener('dragend', () => {
      dragEl = null;
      stopAutoScroll();
      items.forEach(it => {
        it.classList.remove('dragging');
        it.classList.remove('drag-over');
      });
      item.removeAttribute('draggable');
      
      // Save new order
      saveNewSectionOrder(reportId, reportName);
    });
    
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      if (scrollContainer) {
        const rect = scrollContainer.getBoundingClientRect();
        const y = e.clientY;
        const threshold = 50;
        if (y - rect.top < threshold) {
          startAutoScroll(-1);
        } else if (rect.bottom - y < threshold) {
          startAutoScroll(1);
        } else {
          stopAutoScroll();
        }
      }
      
      if (item === dragEl) return;
      
      const bounding = item.getBoundingClientRect();
      const offset = e.clientY - bounding.top;
      if (offset > bounding.height / 2) {
        item.after(dragEl);
      } else {
        item.before(dragEl);
      }
    });
    
    item.addEventListener('dragenter', (e) => {
      e.preventDefault();
      if (item !== dragEl) {
        item.classList.add('drag-over');
      }
    });
    
    item.addEventListener('dragleave', () => {
      item.classList.remove('drag-over');
    });
  });
  
  if (scrollContainer) {
    scrollContainer.addEventListener('dragover', (e) => {
      const rect = scrollContainer.getBoundingClientRect();
      const y = e.clientY;
      const threshold = 50;
      if (y - rect.top < threshold) {
        startAutoScroll(-1);
      } else if (rect.bottom - y < threshold) {
        startAutoScroll(1);
      } else {
        stopAutoScroll();
      }
    });
    scrollContainer.addEventListener('dragleave', () => {
      stopAutoScroll();
    });
  }
}

function saveNewSectionOrder(reportId, reportName) {
  const container = document.getElementById('draggable-sections-list');
  if (!container) return;
  
  const items = container.querySelectorAll('.draggable-section-item');
  const sectionOrder = Array.from(items).map(item => item.getAttribute('data-section-id'));
  
  const reports = loadLocalReports();
  const report = reports.find(r => r.id === reportId);
  if (report) {
    report.sectionOrder = sectionOrder;
    saveLocalReports(reports);
  }
  
  // Save checkbox selections and update live preview
  saveReportSelection(reportId);
  window.mdsrUpdateCustomReportPreview(reportName, reportId);
}

async function resetSectionOrder(reportId, reportName) {
  showCustomConfirmModal({
    title: "Reset section order?",
    message: "Your selected sections will remain selected, but the order will return to the default DSR sequence.",
    confirmText: "Reset Order",
    tone: "warning",
    onConfirm: async () => {
      if (window.activeReport && window.activeReport.id === reportId) {
        const defaultOrder = [
          'front-matter',
          'chapters',
          'plates',
          'anx1', 'anx2', 'anx3', 'anx4', 'anx5', 'anx6', 'anx7',
          'annexure-b', 'annexure-c', 'annexure-d', 'annexure-e', 'annexure-f', 'annexure-g', 'annexure-h', 'annexure-i', 'annexure-j', 'annexure-k'
        ];
        window.activeReport.sectionOrder = defaultOrder;
        await saveReportToServer(window.activeReport);

        const editorContainer = document.getElementById('model-dsr-editor-container');
        if (editorContainer) {
          renderCustomReportGenerator(editorContainer, window.activeReport);
        }
        toast("Section order reset to default successfully!", "success");
      }
    }
  });
}

function addCustomSection(reportId, reportName) {
  const confirmBtn = document.getElementById('custom-pdf-modal-confirm-btn');
  const input = document.getElementById('custom-pdf-title-input');
  if (input) {
    input.value = '';
  }
  if (confirmBtn) {
    const escapedReportName = reportName.replace(/'/g, "\\'");
    confirmBtn.setAttribute('onclick', `window.mdsrConfirmAddCustomSection('${reportId}', '${escapedReportName}')`);
  }
  
  if (typeof window.openModal === 'function') {
    window.openModal('modal-custom-pdf');
  }
  
  setTimeout(() => {
    if (input) input.focus();
  }, 100);
}

function closeCustomPdfModal() {
  if (typeof window.closeModal === 'function') {
    window.closeModal('modal-custom-pdf');
  }
}

async function confirmAddCustomSection(reportId, reportName) {
  const input = document.getElementById('custom-pdf-title-input');
  if (!input) return;
  const name = input.value.trim();
  if (!name) {
    toast("Please enter a section title", "error");
    return;
  }
  
  closeCustomPdfModal();
  
  if (window.activeReport && window.activeReport.id === reportId) {
    if (!window.activeReport.customSections) window.activeReport.customSections = [];
    const newSecId = 'custom-pdf-' + Date.now();
    const newSec = { id: newSecId, name: name, type: 'Custom PDF', isCustom: true };
    
    window.activeReport.customSections.push(newSec);
    if (!window.activeReport.sectionOrder) window.activeReport.sectionOrder = [];
    window.activeReport.sectionOrder.push(newSecId);
    
    await saveReportToServer(window.activeReport);
    
    const editorContainer = document.getElementById('model-dsr-editor-container');
    if (editorContainer) {
      renderCustomReportGenerator(editorContainer, window.activeReport);
    }
    toast("Custom PDF section added successfully!", "success");
  }
}

function frontMatterUploadKey(sectionId) {
  return {
    'fm-cover': 'cover',
    'fm-toc': 'toc',
    'fm-pref': 'pref',
    'fm-ack': 'ack',
    'fm-cert': 'cert'
  }[sectionId] || sectionId;
}

function restoreReportFrontMatterPdfs(report) {
  if (!report || !report.frontMatterPdfs) return;
  if (!S.uploadedPDFs) S.uploadedPDFs = {};
  Object.keys(report.frontMatterPdfs).forEach(key => {
    if (Array.isArray(report.frontMatterPdfs[key]) && report.frontMatterPdfs[key].length) {
      S.uploadedPDFs[key] = report.frontMatterPdfs[key];
    }
  });
}

function handleFrontMatterPdfUpload(input, reportId, sectionId, reportName) {
  const file = input.files[0];
  if (!file) return;
  if (file.type !== 'application/pdf') {
    toast("Please upload a PDF file", "error");
    input.value = '';
    return;
  }

  const uploadKey = frontMatterUploadKey(sectionId);
  toast("Processing front matter PDF... Please wait", "info");

  const savePages = (pages) => {
    if (!S.uploadedPDFs) S.uploadedPDFs = {};
    S.uploadedPDFs[uploadKey] = pages;

    const reports = loadLocalReports();
    const report = reports.find(r => r.id === reportId);
    if (report) {
      if (!report.frontMatterPdfs) report.frontMatterPdfs = {};
      report.frontMatterPdfs[uploadKey] = pages;
      saveLocalReports(reports);

      const editorContainer = document.getElementById('model-dsr-editor-container');
      if (editorContainer) renderCustomReportGenerator(editorContainer, report);
    }

    if (window.debouncedSaveState) window.debouncedSaveState();
    toast("Front matter PDF uploaded successfully!", "success");
  };

  if (typeof renderPdfToImages === 'function') {
    renderPdfToImages(file, (err, imgs) => {
      input.value = '';
      if (err) {
        console.error(err);
        toast("Failed to process PDF pages", "error");
        return;
      }
      savePages(imgs);
    });
  } else {
    const url = URL.createObjectURL(file);
    input.value = '';
    savePages([url]);
  }
}

function removeFrontMatterPdfUpload(reportId, sectionId, reportName) {
  showCustomConfirmModal({
    title: "Remove front matter PDF?",
    message: "The uploaded PDF for this front matter part will be removed from this Model DSR report.",
    confirmText: "Remove",
    tone: "danger",
    onConfirm: () => {
      const uploadKey = frontMatterUploadKey(sectionId);
      const reports = loadLocalReports();
      const report = reports.find(r => r.id === reportId);
      if (report) {
        if (report.frontMatterPdfs) {
          delete report.frontMatterPdfs[uploadKey];
        }
        if (S.uploadedPDFs) {
          delete S.uploadedPDFs[uploadKey];
        }
        saveLocalReports(reports);

        const editorContainer = document.getElementById('model-dsr-editor-container');
        if (editorContainer) renderCustomReportGenerator(editorContainer, report);
        toast("Front matter PDF removed successfully!", "success");
      }
    }
  });
}

function handleCustomSectionPdfUpload(input, reportId, sectionId, reportName) {
  const file = input.files[0];
  if (!file) return;
  if (file.type !== 'application/pdf') {
    toast("Please upload a PDF file", "error");
    return;
  }
  
  toast("Processing PDF... Please wait", "info");
  
  if (typeof renderPdfToImages === 'function') {
    renderPdfToImages(file, (err, imgs) => {
      if (err) {
        console.error(err);
        toast("Failed to process PDF pages", "error");
        return;
      }
      
      if (!S.uploadedPDFs) S.uploadedPDFs = {};
      S.uploadedPDFs[sectionId] = imgs;
      
      if (window.debouncedSaveState) window.debouncedSaveState();
      
      const reports = loadLocalReports();
      const report = reports.find(r => r.id === reportId);
      if (report) {
        if (!report.customPdfs) report.customPdfs = {};
        report.customPdfs[sectionId] = imgs;
        saveLocalReports(reports);
        
        const editorContainer = document.getElementById('model-dsr-editor-container');
        if (editorContainer) {
          renderCustomReportGenerator(editorContainer, report);
        }
      }
      toast("PDF uploaded and processed successfully!", "success");
    });
  } else {
    const url = URL.createObjectURL(file);
    if (!S.uploadedPDFs) S.uploadedPDFs = {};
    S.uploadedPDFs[sectionId] = [url];
    
    const reports = loadLocalReports();
    const report = reports.find(r => r.id === reportId);
    if (report) {
      if (!report.customPdfs) report.customPdfs = {};
      report.customPdfs[sectionId] = [url];
      saveLocalReports(reports);
      
      const editorContainer = document.getElementById('model-dsr-editor-container');
      if (editorContainer) {
        renderCustomReportGenerator(editorContainer, report);
      }
    }
    toast("PDF uploaded successfully", "success");
  }
}

function removeCustomSectionPdf(reportId, sectionId, reportName) {
  showCustomConfirmModal({
    title: "Remove uploaded PDF?",
    message: "The PDF attached to this custom section will be removed.",
    confirmText: "Remove",
    tone: "danger",
    onConfirm: async () => {
      if (window.activeReport && window.activeReport.id === reportId) {
        if (window.activeReport.customPdfs) {
          delete window.activeReport.customPdfs[sectionId];
        }
        if (S.uploadedPDFs) {
          delete S.uploadedPDFs[sectionId];
        }
        await saveReportToServer(window.activeReport);

        const editorContainer = document.getElementById('model-dsr-editor-container');
        if (editorContainer) {
          renderCustomReportGenerator(editorContainer, window.activeReport);
        }
        toast("PDF removed successfully!", "success");
      }
    }
  });
}

function deleteCustomSection(reportId, sectionId, reportName) {
  showCustomConfirmModal({
    title: "Delete custom section?",
    message: "This custom PDF section and its uploaded file will be deleted from the report.",
    confirmText: "Delete",
    tone: "danger",
    onConfirm: async () => {
      if (window.activeReport && window.activeReport.id === reportId) {
        if (window.activeReport.customSections) {
          window.activeReport.customSections = window.activeReport.customSections.filter(cs => cs.id !== sectionId);
        }
        if (window.activeReport.sectionOrder) {
          window.activeReport.sectionOrder = window.activeReport.sectionOrder.filter(id => id !== sectionId);
        }
        if (window.activeReport.customPdfs) {
          delete window.activeReport.customPdfs[sectionId];
        }
        if (S.uploadedPDFs) {
          delete S.uploadedPDFs[sectionId];
        }
        await saveReportToServer(window.activeReport);

        const editorContainer = document.getElementById('model-dsr-editor-container');
        if (editorContainer) {
          renderCustomReportGenerator(editorContainer, window.activeReport);
        }
        toast("Custom section deleted successfully!", "success");
      }
    }
  });
}

function hydrateCheckboxStates(checkedIds) {
  if (!checkedIds) return;
  
  checkedIds.forEach(id => {
    const chk = document.getElementById(`chk-${id}`);
    if (chk) chk.checked = true;
  });
  
  ['front-matter', 'chapters', 'plates'].forEach(parentId => {
    const parentChk = document.getElementById(`chk-${parentId}`);
    if (!parentChk) return;
    
    const children = Array.from(document.querySelectorAll(`input[data-parent="${parentId}"]`));
    const checkedChildren = children.filter(c => c.checked);
    
    if (checkedChildren.length === children.length && children.length > 0) {
      parentChk.checked = true;
      parentChk.indeterminate = false;
    } else if (checkedChildren.length === 0) {
      parentChk.checked = false;
      parentChk.indeterminate = false;
    } else {
      parentChk.checked = false;
      parentChk.indeterminate = true;
    }
  });
}

function onParentCheckboxChange(parentId, reportName, reportId) {
  const parentChk = document.getElementById(`chk-${parentId}`);
  if (!parentChk) return;
  const isChecked = parentChk.checked;
  
  const children = document.querySelectorAll(`input[data-parent="${parentId}"]`);
  children.forEach(child => {
    child.checked = isChecked;
  });
  
  saveReportSelection(reportId);
  window.mdsrUpdateCustomReportPreview(reportName, reportId);
}

function onSubCheckboxChange(parentId, reportName, reportId) {
  const parentChk = document.getElementById(`chk-${parentId}`);
  if (!parentChk) return;
  
  const children = Array.from(document.querySelectorAll(`input[data-parent="${parentId}"]`));
  const checkedChildren = children.filter(c => c.checked);
  
  if (checkedChildren.length === children.length) {
    parentChk.checked = true;
    parentChk.indeterminate = false;
  } else if (checkedChildren.length === 0) {
    parentChk.checked = false;
    parentChk.indeterminate = false;
  } else {
    parentChk.checked = false;
    parentChk.indeterminate = true;
  }
  
  saveReportSelection(reportId);
  window.mdsrUpdateCustomReportPreview(reportName, reportId);
}

function renderCustomReportGenerator(container, report) {
  const reportName = report.name;
  const sections = [
    { 
      id: 'front-matter', 
      name: 'Front Matter', 
      type: 'DSR', 
      hasSubsections: true,
      subsections: [
        { id: 'fm-cover', name: 'Cover Page', uploadKey: 'cover' },
        { id: 'fm-toc', name: 'Content Page', uploadKey: 'toc' },
        { id: 'fm-pref', name: 'Preface', uploadKey: 'pref' },
        { id: 'fm-ack', name: 'Acknowledgement', uploadKey: 'ack' },
        { id: 'fm-cert', name: 'Certificate of Compliance', uploadKey: 'cert' }
      ]
    },
    { 
      id: 'chapters', 
      name: 'Chapters Outline', 
      type: 'DSR', 
      hasSubsections: true,
      subsections: (S.chapters || []).map(ch => ({ id: `chapter-${ch.id}`, name: ch.name }))
    },
    { 
      id: 'plates', 
      name: 'Plate Section', 
      type: 'DSR', 
      hasSubsections: true,
      subsections: (S.plates || []).map(pl => ({ id: `plate-${pl.id}`, name: pl.name }))
    },
    { id: 'anx1', name: 'Annexure I - Sources', type: 'Annexure' },
    { id: 'anx2', name: 'Annexure II - Leases', type: 'Annexure' },
    { id: 'anx3', name: 'Annexure III - Clusters', type: 'Annexure' },
    { id: 'anx4', name: 'Annexure IV - Transport', type: 'Annexure' },
    { id: 'anx5', name: 'Annexure V - Bench Mark & CORS', type: 'Annexure' },
    { id: 'anx6', name: 'Annexure VI - Final Cluster Details', type: 'Annexure' },
    { id: 'anx7', name: 'Annexure VII - Transportation Routes', type: 'Annexure' },
    { id: 'annexure-b', name: 'Annexure B', type: 'More Annexures' },
    { id: 'annexure-c', name: 'Annexure C', type: 'More Annexures' },
    { id: 'annexure-d', name: 'Annexure D', type: 'More Annexures' },
    { id: 'annexure-e', name: 'Annexure E', type: 'More Annexures' },
    { id: 'annexure-f', name: 'Annexure F', type: 'More Annexures' },
    { id: 'annexure-g', name: 'Annexure G', type: 'More Annexures' },
    { id: 'annexure-h', name: 'Annexure H', type: 'More Annexures' },
    { id: 'annexure-i', name: 'Annexure I', type: 'More Annexures' },
    { id: 'annexure-j', name: 'Annexure J', type: 'More Annexures' },
    { id: 'annexure-k', name: 'Annexure K', type: 'More Annexures' }
  ];

  // Restore custom PDF pages into S.uploadedPDFs
  restoreReportFrontMatterPdfs(report);

  if (report.customPdfs) {
    if (!S.uploadedPDFs) S.uploadedPDFs = {};
    Object.keys(report.customPdfs).forEach(secId => {
      S.uploadedPDFs[secId] = report.customPdfs[secId];
    });
  }

  // Load and append custom PDF sections
  if (report.customSections && Array.isArray(report.customSections)) {
    report.customSections.forEach(cs => {
      sections.push({
        id: cs.id,
        name: cs.name,
        type: cs.type || 'Custom PDF',
        isCustom: true
      });
    });
  }

  // Ensure report has a valid and complete sectionOrder
  const allSectionIds = sections.map(s => s.id);
  if (!report.sectionOrder || !Array.isArray(report.sectionOrder)) {
    report.sectionOrder = allSectionIds;
    const reports = loadLocalReports();
    const existing = reports.find(r => r.id === report.id);
    if (existing) {
      existing.sectionOrder = report.sectionOrder;
      saveLocalReports(reports);
    }
  } else {
    // Append any missing section IDs to sectionOrder (in case new sections are added in code later)
    const missingIds = allSectionIds.filter(id => !report.sectionOrder.includes(id));
    if (missingIds.length > 0) {
      report.sectionOrder = [...report.sectionOrder, ...missingIds];
      const reports = loadLocalReports();
      const existing = reports.find(r => r.id === report.id);
      if (existing) {
        existing.sectionOrder = report.sectionOrder;
        saveLocalReports(reports);
      }
    }
  }

  // Sort sections based on report.sectionOrder
  sections.sort((a, b) => {
    const idxA = report.sectionOrder.indexOf(a.id);
    const idxB = report.sectionOrder.indexOf(b.id);
    return idxA - idxB;
  });

  let checklistHtml = '';
  sections.forEach(s => {
    const escapedReportName = reportName.replace(/'/g, "\\'");
    if (s.isCustom) {
      const pages = S.uploadedPDFs && S.uploadedPDFs[s.id];
      const hasPages = pages && pages.length > 0;
      
      checklistHtml += `
        <div class="draggable-section-item" data-section-id="${s.id}" style="margin-bottom:12px; padding:12px; background:#f8fafc; border-radius:6px; border:1px solid #e2e8f0; position:relative; transition: all 0.2s ease;">
          <div style="display:flex; align-items:center; justify-content:space-between; width:100%; margin-bottom:8px;">
            <div style="display:flex; align-items:center; gap:10px; flex:1;">
              <span class="drag-handle" style="cursor: grab; color: #94a3b8; display: flex; align-items: center; padding: 4px 2px;">
                <i data-lucide="grip-vertical" style="width: 14px; height: 14px;"></i>
              </span>
              <input type="checkbox" id="chk-${s.id}" value="${s.id}" onchange="window.mdsrUpdateCustomReportPreview('${escapedReportName}', '${report.id}')" style="width:16px; height:16px; cursor:pointer;">
              <label for="chk-${s.id}" style="font-size:13px; font-weight:700; cursor:pointer; color:#1e293b; display:flex; align-items:center; gap:6px; margin:0; width:100%;">
                <span style="font-size:9px; padding:2px 6px; background:#fef3c7; border-radius:10px; text-transform:uppercase; color:#d97706; font-weight:700;">${s.type}</span>
                <span>${s.name}</span>
              </label>
            </div>
            <div>
              <button onclick="window.mdsrDeleteCustomSection('${report.id}', '${s.id}', '${escapedReportName}')" title="Delete custom section" style="background:none; border:none; color:#ef4444; cursor:pointer; padding:4px; display:inline-flex; align-items:center; justify-content:center;">
                <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
              </button>
            </div>
          </div>
          
          <!-- PDF Upload Area -->
          <div style="padding-left:36px; margin-top:8px;">
            ${hasPages ? `
              <div style="display:flex; align-items:center; justify-content:space-between; background:#fff; padding:6px 10px; border-radius:6px; border:1px solid #e2e8f0; font-size:12px;">
                <div style="display:flex; align-items:center; gap:6px; color:#1e293b; font-weight:600;">
                  <i data-lucide="file-text" style="width:14px; height:14px; color:#2563eb;"></i>
                  <span>PDF Uploaded (${pages.length} pages)</span>
                </div>
                <button onclick="window.mdsrRemoveCustomSectionPdf('${report.id}', '${s.id}', '${escapedReportName}')" style="background:none; border:none; color:#dc2626; cursor:pointer; font-size:11px; padding:2px 6px; border-radius:4px; font-weight:600; display:inline-block;">Remove</button>
              </div>
            ` : `
              <div style="border: 1px dashed #cbd5e1; border-radius:6px; background:#fff; padding:8px; text-align:center; font-size:12px; color:#64748b; cursor:pointer; position:relative;" onclick="document.getElementById('file-upload-${s.id}').click()">
                <span style="display:flex; align-items:center; justify-content:center; gap:6px;">
                  <i data-lucide="upload-cloud" style="width:14px; height:14px; color:#64748b;"></i>
                  <span>Upload PDF document</span>
                </span>
                <input type="file" id="file-upload-${s.id}" accept="application/pdf" style="display:none;" onchange="window.mdsrHandleCustomSectionPdfUpload(this, '${report.id}', '${s.id}', '${escapedReportName}')">
              </div>
            `}
          </div>
        </div>
      `;
    } else if (s.hasSubsections) {
      let subHtml = '';
      s.subsections.forEach(sub => {
        const uploadKey = sub.uploadKey || frontMatterUploadKey(sub.id);
        const uploadedPages = s.id === 'front-matter'
          ? ((report.frontMatterPdfs && report.frontMatterPdfs[uploadKey]) || (S.uploadedPDFs && S.uploadedPDFs[uploadKey]))
          : null;
        const hasUploadedPages = Array.isArray(uploadedPages) && uploadedPages.length > 0;
        const uploadControlHtml = s.id === 'front-matter' ? `
          <div style="display:flex; align-items:center; gap:6px; margin-left:auto;">
            ${hasUploadedPages ? `
              <span title="Uploaded PDF pages" style="font-size:10px; color:#2563eb; background:#eff6ff; border:1px solid #bfdbfe; border-radius:999px; padding:2px 7px; font-weight:700; white-space:nowrap;">
                PDF ${uploadedPages.length}p
              </span>
              <button type="button" title="Remove PDF" onclick="event.stopPropagation(); window.mdsrRemoveFrontMatterPdfUpload('${report.id}', '${sub.id}', '${escapedReportName}')" style="border:none; background:#fee2e2; color:#b91c1c; border-radius:4px; padding:3px 6px; font-size:10px; font-weight:700; cursor:pointer;">Remove</button>
            ` : `
              <button type="button" title="Upload PDF" onclick="event.stopPropagation(); document.getElementById('fm-upload-${sub.id}').click()" style="border:1px solid #bfdbfe; background:#eff6ff; color:#1d4ed8; border-radius:4px; padding:3px 7px; font-size:10px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:4px;">
                <i data-lucide="upload" style="width:11px; height:11px;"></i> Upload PDF
              </button>
            `}
            <input type="file" id="fm-upload-${sub.id}" accept="application/pdf" style="display:none;" onchange="window.mdsrHandleFrontMatterPdfUpload(this, '${report.id}', '${sub.id}', '${escapedReportName}')">
          </div>
        ` : '';
        subHtml += `
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px; min-height:24px;">
            <input type="checkbox" id="chk-${sub.id}" value="${sub.id}" data-parent="${s.id}" onchange="window.mdsrOnSubCheckboxChange('${s.id}', '${escapedReportName}', '${report.id}')" style="width:14px; height:14px; cursor:pointer; flex:0 0 auto;">
            <label for="chk-${sub.id}" style="font-size:12px; cursor:pointer; color:#475569; margin:0; flex:1; min-width:0;">
              ${sub.name}
            </label>
            ${uploadControlHtml}
          </div>
        `;
      });

      checklistHtml += `
        <div class="draggable-section-item" data-section-id="${s.id}" style="margin-bottom:12px; padding:8px 12px; background:#f8fafc; border-radius:6px; border:1px solid #e2e8f0; position:relative; transition: all 0.2s ease;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span class="drag-handle" style="cursor: grab; color: #94a3b8; display: flex; align-items: center; padding: 4px 2px;">
              <i data-lucide="grip-vertical" style="width: 14px; height: 14px;"></i>
            </span>
            <input type="checkbox" id="chk-${s.id}" value="${s.id}" onchange="window.mdsrOnParentCheckboxChange('${s.id}', '${escapedReportName}', '${report.id}')" style="width:16px; height:16px; cursor:pointer;">
            <label for="chk-${s.id}" style="font-size:13px; font-weight:700; cursor:pointer; color:#1e293b; display:flex; align-items:center; gap:6px; margin:0; width:100%;">
              <span style="font-size:9px; padding:2px 6px; background:#cbd5e1; border-radius:10px; text-transform:uppercase; color:#475569; font-weight:700;">${s.type}</span>
              <span>${s.name}</span>
            </label>
          </div>
          <div id="sub-container-${s.id}" style="padding-left:18px; margin-top:8px; display:flex; flex-direction:column; gap:4px; border-left: 2px dashed #cbd5e1; margin-left: 35px;">
            ${subHtml}
          </div>
        </div>
      `;
    } else {
      checklistHtml += `
        <div class="draggable-section-item" data-section-id="${s.id}" style="display:flex; align-items:center; gap:10px; margin-bottom:12px; padding:8px 12px; background:#f8fafc; border-radius:6px; border:1px solid #e2e8f0; position:relative; transition: all 0.2s ease;">
          <span class="drag-handle" style="cursor: grab; color: #94a3b8; display: flex; align-items: center; padding: 4px 2px;">
            <i data-lucide="grip-vertical" style="width: 14px; height: 14px;"></i>
          </span>
          <input type="checkbox" id="chk-${s.id}" value="${s.id}" onchange="window.mdsrUpdateCustomReportPreview('${escapedReportName}', '${report.id}')" style="width:16px; height:16px; cursor:pointer;">
          <label for="chk-${s.id}" style="font-size:13px; font-weight:700; cursor:pointer; color:#1e293b; display:flex; align-items:center; gap:6px; margin:0; width:100%;">
            <span style="font-size:9px; padding:2px 6px; background:#e2e8f0; border-radius:10px; text-transform:uppercase; color:#475569; font-weight:700;">${s.type}</span>
            <span>${s.name}</span>
          </label>
        </div>
      `;
    }
  });

  const escapedReportName = reportName.replace(/'/g, "\\'");
  container.innerHTML = `
    <div class="card" style="height: calc(100vh - 120px); display: flex; flex-direction: column; margin-top: 15px;">
      <div class="card-hd" style="padding: 16px 20px;">
        <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
          <div>
            <div class="card-title" id="custom-report-title-display" style="font-size:16px; font-weight:800; color:#0f172a;">${reportName}</div>
            <div class="card-sub" style="font-size:12px; color:#64748b;">Select DSR sections & annexures to compile into a Model DSR report</div>
          </div>
          <div style="display:flex; gap:10px;">
            <button class="btn btn-outline" onclick="window.mdsrShowExistingReportsList()" style="cursor: pointer;">Back</button>
            <button class="btn btn-primary" onclick="window.mdsrDownloadCustomReportPDF('${escapedReportName}', '${report.id}')" style="cursor: pointer;">Download PDF</button>
          </div>
        </div>
      </div>
      <div class="card-bd" style="flex:1; display:grid; grid-template-columns: 1fr 1.2fr; gap:20px; overflow:hidden; padding:20px;">
        <!-- LEFT COLUMN: Checklist -->
        <div id="model-dsr-checklist-scroll-container" style="overflow-y:auto; padding-right:10px; border-right:1px solid #e2e8f0; max-height:100%;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; flex-wrap:wrap; gap:8px;">
            <h3 style="margin:0; color:#0f172a; font-size:14px; font-weight:700;">Select Sections:</h3>
            <div style="display:flex; align-items:center; gap:8px;">
              <button onclick="window.mdsrResetSectionOrder('${report.id}', '${escapedReportName}')" class="btn btn-outline" style="padding: 4px 8px; font-size: 11px; height: auto; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; cursor: pointer; color: #475569; border-color: #cbd5e1; background: #ffffff;">
                <i data-lucide="rotate-ccw" style="width:11px; height:11px;"></i> Reset Order
              </button>
              <button onclick="window.mdsrAddCustomSection('${report.id}', '${escapedReportName}')" class="btn btn-outline" style="padding: 4px 8px; font-size: 11px; height: auto; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; cursor: pointer; color: #2563eb; border-color: #bfdbfe; background: #eff6ff;">
                <i data-lucide="file-plus" style="width:11px; height:11px;"></i> Add Custom PDF
              </button>
              <span style="font-size:11px; color:#64748b; background:#f1f5f9; padding:2px 8px; border-radius:4px; display:inline-flex; align-items:center; gap:4px;">
                <i data-lucide="grip-vertical" style="width:12px; height:12px;"></i> Drag to reorder
              </span>
            </div>
          </div>
          <div id="draggable-sections-list">
            ${checklistHtml}
          </div>
        </div>
        
        <!-- RIGHT COLUMN: Preview -->
        <div style="display:flex; flex-direction:column; overflow:hidden; height:100%; background:#f1f5f9; border-radius:8px; border:1px solid #cbd5e1; position:relative;">
          <div style="padding:10px 15px; background:#e2e8f0; border-bottom:1px solid #cbd5e1; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:700; font-size:12px; color:#334155;">Model DSR Preview</span>
            <span id="preview-sections-count" style="font-size:11px; background:#64748b; color:#fff; padding:2px 8px; border-radius:10px;">0 selected</span>
          </div>
          <div style="flex:1; padding:0; background:#fff; overflow:hidden;">
            <iframe id="custom-report-preview-iframe" style="width:100%; height:100%; border:none; background:#fff; display:block;" srcdoc="&lt;html&gt;&lt;body style='font-family:sans-serif; color:#64748b; padding:40px; text-align:center;'&gt;&lt;p&gt;No sections selected yet. Please select sections on the left to see the live preview.&lt;/p&gt;&lt;/body&gt;&lt;/html&gt;"></iframe>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Hydrate checkbox states
  hydrateCheckboxStates(report.sections);
  
  // Render live preview on load
  updateCustomReportPreview(reportName, report.id);

  if (window.lucide) {
    window.lucide.createIcons();
  }

  initDragAndDrop(report.id, reportName);
}

// Debouncer for rendering preview to fix lagging/freezing
let previewTimeout = null;
let previewRenderToken = 0;

function buildReplenishmentPreviewSrcdoc(reportName, pageImages) {
  const pagesHtml = pageImages.map((src, index) => `
    <figure class="repl-preview-page">
      <img src="${src}" alt="Page ${index + 1}">
    </figure>
  `).join('');

  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { box-sizing: border-box; }
          html, body { margin: 0; min-height: 100%; }
          body {
            background: #e2e8f0;
            color: #0f172a;
            font-family: Arial, Helvetica, sans-serif;
            padding: 18px;
          }
          .repl-preview-title {
            max-width: 820px;
            margin: 0 auto 12px;
            color: #334155;
            font-size: 12px;
            font-weight: 700;
          }
          .repl-preview-page {
            width: min(100%, 820px);
            margin: 0 auto 18px;
            background: #ffffff;
            border: 1px solid #cbd5e1;
            box-shadow: 0 10px 24px rgba(15, 23, 42, 0.16);
          }
          .repl-preview-page img {
            display: block;
            width: 100%;
            height: auto;
          }
          @media (max-width: 700px) {
            body { padding: 10px; }
            .repl-preview-page { margin-bottom: 12px; }
          }
        </style>
      </head>
      <body>
        <div class="repl-preview-title">${escapeHtml(reportName)} - ${pageImages.length} page${pageImages.length === 1 ? '' : 's'}</div>
        ${pagesHtml}
      </body>
    </html>`;
}

async function renderReplenishmentPdfBlobToImages(blob) {
  if (!blob) return [];
  if (typeof ensurePortalVendors === 'function') {
    await ensurePortalVendors(['pdfjs']);
  }
  if (!window.pdfjsLib) {
    throw new Error('PDF.js is not available for live preview rendering.');
  }
  if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/build/pdf.worker.min.js';
  }

  const data = new Uint8Array(await blob.arrayBuffer());
  const pdf = await window.pdfjsLib.getDocument({ data }).promise;
  const pages = [];
  for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
    const page = await pdf.getPage(pageNo);
    const viewport = page.getViewport({ scale: 1.45 });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: ctx, viewport }).promise;
    pages.push(canvas.toDataURL('image/jpeg', 0.9));
  }
  return pages;
}

function updateCustomReportPreview(reportName, reportId) {
  if (previewTimeout) {
    clearTimeout(previewTimeout);
  }
  previewTimeout = setTimeout(() => {
    realUpdateCustomReportPreview(reportName, reportId);
  }, 200);
}

async function realUpdateCustomReportPreview(reportName, reportId) {
  const renderToken = ++previewRenderToken;
  const checkedIds = getCurrentSelectedReportSectionIds();
  
  const indeterminateParents = Array.from(document.querySelectorAll('input[id^="chk-"]')).filter(c => c.indeterminate).map(c => c.value);
  const allActiveIds = [...checkedIds, ...indeterminateParents];
  
  const countEl = document.getElementById('preview-sections-count');
  if (countEl) {
    const parentOrStandaloneSelected = Array.from(document.querySelectorAll('input[id^="chk-"]:not([data-parent])')).filter(c => c.checked || c.indeterminate);
    countEl.textContent = `${parentOrStandaloneSelected.length} sections selected`;
  }
  
  const iframe = document.getElementById('custom-report-preview-iframe');
  if (!iframe) return;
  
  if (allActiveIds.length === 0) {
    iframe.removeAttribute('src');
    if (window.activeReplenishmentPdfBlobUrl) {
      try { URL.revokeObjectURL(window.activeReplenishmentPdfBlobUrl); } catch (_) {}
      window.activeReplenishmentPdfBlobUrl = null;
    }
    iframe.srcdoc = `<html><body style='font-family:sans-serif; color:#64748b; padding:40px; text-align:center;'><p>No sections selected yet. Please select sections on the left to see the live preview.</p></body></html>`;
    return;
  }
  
  if (reportId) {
    saveReportSelection(reportId);
  }
  
  // Show standard loader overlay inside preview container
  const previewDiv = iframe.parentNode;
  let loader = document.getElementById('repl-preview-loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'repl-preview-loader';
    loader.style.cssText = `
      position: absolute;
      top: 40px;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.85);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10;
      font-family: sans-serif;
      font-size: 13px;
      color: #1e293b;
      gap: 12px;
    `;
    loader.innerHTML = `
      <div style="width: 24px; height: 24px; border: 3px solid #cbd5e1; border-top-color: #2563eb; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <span style="font-weight:600;">Generating preview...</span>
      <style>
        @keyframes spin { to { transform: rotate(360deg); } }
      </style>
    `;
    previewDiv.appendChild(loader);
  } else {
    loader.style.display = 'flex';
  }
  
  try {
    const blob = await generateModelDsrPdfBlob(reportName, checkedIds, reportId);
    if (blob) {
      if (renderToken !== previewRenderToken) return;
      if (window.activeReplenishmentPdfBlobUrl) {
        try { URL.revokeObjectURL(window.activeReplenishmentPdfBlobUrl); } catch (_) {}
      }
      const newIframe = iframe.cloneNode(true);
      newIframe.removeAttribute('src');
      window.activeReplenishmentPdfBlobUrl = null;
      const pageImages = await renderReplenishmentPdfBlobToImages(blob);
      if (renderToken !== previewRenderToken) return;
      newIframe.srcdoc = buildReplenishmentPreviewSrcdoc(reportName, pageImages);
      iframe.parentNode.replaceChild(newIframe, iframe);
    }
  } catch (err) {
    console.error('Failed to render live report preview:', err);
  } finally {
    if (loader) loader.style.display = 'none';
  }
}

function cloneSourceWithValues(source) {
  const clone = source.cloneNode(true);
  
  const srcInputs = source.querySelectorAll('input, textarea, select');
  const cloneInputs = clone.querySelectorAll('input, textarea, select');
  
  for (let i = 0; i < srcInputs.length; i++) {
    const srcEl = srcInputs[i];
    const cloneEl = cloneInputs[i];
    if (!cloneEl) continue;
    
    if (srcEl.tagName === 'TEXTAREA') {
      cloneEl.textContent = srcEl.value;
    } else if (srcEl.tagName === 'SELECT') {
      Array.from(cloneEl.options).forEach(opt => {
        if (opt.value === srcEl.value) {
          opt.setAttribute('selected', 'selected');
        } else {
          opt.removeAttribute('selected');
        }
      });
    } else if (srcEl.tagName === 'INPUT') {
      cloneEl.setAttribute('value', srcEl.value);
      if (srcEl.type === 'checkbox' || srcEl.type === 'radio') {
        if (srcEl.checked) cloneEl.setAttribute('checked', 'checked');
        else cloneEl.removeAttribute('checked');
      }
    }
  }
  return clone;
}

const LIVE_PREVIEW_ANNEXURE_IDS = ['annexure-f', 'annexure-j', 'annexure-k'];

function isLivePreviewAnnexureId(id) {
  return LIVE_PREVIEW_ANNEXURE_IDS.includes(id);
}

function getLivePreviewAnnexureSectionHtml(viewId) {
  if (!isLivePreviewAnnexureId(viewId)) return '';
  if (!window.pdfPreview || typeof window.pdfPreview.buildAnnexureHtmlDocument !== 'function') return '';

  const letter = viewId.replace('annexure-', '').toUpperCase();
  const renderFn = window[`renderAnnexure${letter}`];
  if (typeof renderFn === 'function') renderFn();

  const html = window.pdfPreview.buildAnnexureHtmlDocument(viewId);
  if (!html) return '';

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const sheet = doc.querySelector('.sheet') || doc.body;
  const bodyHtml = sheet ? sheet.innerHTML.trim() : '';
  if (!bodyHtml) return '';

  return `
    <div class="section-block annexure-live-preview-section" data-annexure-id="${escapeHtml(viewId)}">
      ${bodyHtml}
    </div>
  `;
}

function compileSelectedSectionsHtml(reportName, checkedIds, allActiveIds, reportId) {
  if (reportId) {
    const reports = loadLocalReports();
    const report = reports.find(r => r.id === reportId);
    restoreReportFrontMatterPdfs(report);
  }

  const district = (window.S && S.frontMatter && S.frontMatter.district) || 'Jalandhar';
  const year = (window.S && S.frontMatter && S.frontMatter.year) || '2025-26';
  const title = document.getElementById('fm-title')?.value || (S.frontMatter && S.frontMatter.title) || 'District Survey Report for Sand Mining';
  const state = document.getElementById('fm-state')?.value || (S.frontMatter && S.frontMatter.state) || 'Punjab';
  const version = document.getElementById('fm-version')?.value || (S.frontMatter && S.frontMatter.version) || 'Final Draft';
  const preparedBy = document.getElementById('fm-prepared-by')?.value || (S.frontMatter && S.frontMatter.preparedBy) || 'Sub-Divisional Committee, Jalandhar District';
  const assistedBy = document.getElementById('fm-assisted-by')?.value || (S.frontMatter && S.frontMatter.assistedBy) || 'IIT Ropar';
  const preface = document.getElementById('fm-preface')?.value || (S.frontMatter && S.frontMatter.preface) || '';
  const ack = document.getElementById('fm-acknowledgement')?.value || (S.frontMatter && S.frontMatter.acknowledgement) || '';

  // Order checked sections according to saved sectionOrder (or default if not present)
  let sectionOrder = [
    'front-matter',
    'chapters',
    'plates',
    'anx1', 'anx2', 'anx3', 'anx4', 'anx5', 'anx6', 'anx7',
    'annexure-b', 'annexure-c', 'annexure-d', 'annexure-e', 'annexure-f', 'annexure-g', 'annexure-h', 'annexure-i', 'annexure-j', 'annexure-k'
  ];

  if (reportId) {
    const reports = loadLocalReports();
    const report = reports.find(r => r.id === reportId);
    if (report && report.sectionOrder && Array.isArray(report.sectionOrder)) {
      sectionOrder = report.sectionOrder;
    }
  }

  const orderedIds = [];
  
  sectionOrder.forEach(secId => {
    if (secId === 'front-matter') {
      const fmSubsections = ['fm-cover', 'fm-toc', 'fm-pref', 'fm-ack', 'fm-cert'];
      const activeFmSubs = fmSubsections.filter(id => checkedIds.includes(id));
      if (activeFmSubs.length > 0) {
        orderedIds.push({ id: 'front-matter', subIds: activeFmSubs });
      }
    } else if (secId === 'chapters') {
      const checkedChapters = (S.chapters || []).filter(ch => checkedIds.includes(`chapter-${ch.id}`));
      if (checkedChapters.length > 0) {
        orderedIds.push({ id: 'chapters', subIds: checkedChapters.map(ch => `chapter-${ch.id}`) });
      }
    } else if (secId === 'plates') {
      const checkedPlates = (S.plates || []).filter(pl => checkedIds.includes(`plate-${pl.id}`));
      if (checkedPlates.length > 0) {
        orderedIds.push({ id: 'plates', subIds: checkedPlates.map(pl => `plate-${pl.id}`) });
      }
    
    } else {
      if (checkedIds.includes(secId)) {
        orderedIds.push({ id: secId });
      }
    }
  });

  let combinedContent = '';

  orderedIds.forEach(item => {
    let sectionHtml = '';
    
    if (item.id === 'front-matter') {
      item.subIds.forEach(subId => {
        let subHtml = '';
        if (subId === 'fm-cover') {
          const uploaded = S.uploadedPDFs && S.uploadedPDFs['cover'];
          if (uploaded && uploaded.length) {
            subHtml = `<div class="cover-page" style="page-break-after:always; text-align:center;">
              ${uploaded.map(src => `<img src="${src}" style="max-width:100%; height:auto; display:block; margin:0 auto 10px;">`).join('')}
            </div>`;
          } else {
            subHtml = `
              <div class="cover-page" style="text-align:center; padding: 60px 0; border: 3px double #17324d; margin-bottom: 40px; page-break-after:always; background: #fff; min-height: 800px; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <h3 style="font-size:14px; text-transform:uppercase; letter-spacing:2px; color:#64748b; margin-top:20px;">Government of Punjab</h3>
                  <h1 style="font-size:26px; margin: 30px 0 10px 0; color:#17324d; font-family:'Outfit', sans-serif;">${title}</h1>
                  <h2 style="font-size:18px; color:#475569; margin: 0 0 40px 0;">District: ${district} | State: ${state}</h2>
                </div>
                <div style="margin: 40px 0; font-size:14px; color:#475569;">
                  <p><strong>Year:</strong> ${year}</p>
                  <p><strong>Version:</strong> ${version}</p>
                  <p><strong>Prepared in compliance with EMGSM 2020 Guidelines</strong></p>
                </div>
                <div style="margin-bottom:20px; font-size:13px; line-height:1.6; text-align:left; background:#f8fafc; padding:20px; border-radius:8px; border:1px solid #e2e8f0; max-width: 480px; margin-left: auto; margin-right: auto;">
                  <p style="margin:0 0 4px 0;"><strong>Prepared By:</strong> ${preparedBy}</p>
                  <p style="margin:0;"><strong>Assisted By:</strong> ${assistedBy}</p>
                </div>
              </div>
            `;
          }
        } 
        else if (subId === 'fm-pref') {
          const uploaded = S.uploadedPDFs && S.uploadedPDFs['pref'];
          if (uploaded && uploaded.length) {
            subHtml = `<div style="page-break-after:always;">
              <h2 class="section-title">Preface</h2>
              ${uploaded.map(src => `<img src="${src}" style="max-width:100%; height:auto; display:block; margin:0 auto 10px;">`).join('')}
            </div>`;
          } else {
            subHtml = `
              <div style="margin-bottom: 40px; page-break-after:always;">
                <h2 class="section-title">Preface</h2>
                <p style="font-size:13.5px; line-height:1.7; white-space:pre-wrap; color:#334155;">${preface || 'No preface text available.'}</p>
              </div>
            `;
          }
        } 
        else if (subId === 'fm-ack') {
          const uploaded = S.uploadedPDFs && S.uploadedPDFs['ack'];
          if (uploaded && uploaded.length) {
            subHtml = `<div style="page-break-after:always;">
              <h2 class="section-title">Acknowledgement</h2>
              ${uploaded.map(src => `<img src="${src}" style="max-width:100%; height:auto; display:block; margin:0 auto 10px;">`).join('')}
            </div>`;
          } else {
            subHtml = `
              <div style="margin-bottom: 40px; page-break-after:always;">
                <h2 class="section-title">Acknowledgement</h2>
                <p style="font-size:13.5px; line-height:1.7; white-space:pre-wrap; color:#334155;">${ack || 'No acknowledgement text available.'}</p>
              </div>
            `;
          }
        } 
        else if (subId === 'fm-cert') {
          const uploaded = S.uploadedPDFs && S.uploadedPDFs['cert'];
          if (uploaded && uploaded.length) {
            subHtml = `<div style="page-break-after:always;">
              <h2 class="section-title">Certificate of Compliance</h2>
              ${uploaded.map(src => `<img src="${src}" style="max-width:100%; height:auto; display:block; margin:0 auto 10px;">`).join('')}
            </div>`;
          } else {
            subHtml = `
              <div style="margin-bottom: 40px; page-break-after:always;">
                <h2 class="section-title">Certificate of Compliance</h2>
                <div style="border: 2px solid #17324d; padding: 30px; border-radius: 8px; background: #fafafa; margin-top: 20px;">
                  <h3 style="text-align: center; margin-top: 0; text-transform: uppercase; color: #17324d;">Certificate</h3>
                  <p style="font-size: 14px; line-height: 1.8; color: #334155; margin-bottom: 30px;">
                    This is to certify that the District Survey Report for Sand Mining for <strong>District ${district}</strong>, State of <strong>${state}</strong> for the year <strong>${year}</strong> has been compiled in strict accordance with the Sustainable Sand Mining Management Guidelines 2016 and the Enforcement & Monitoring Guidelines for Sand Mining (EMGSM) 2020.
                  </p>
                  <p style="font-size: 14px; line-height: 1.8; color: #334155; margin-bottom: 40px;">
                    All geomorphological assessments, mineral reserve calculations, replenishment studies, and environmental safeguards have been verified by the Sub-Divisional Committee.
                  </p>
                  <div style="display: flex; justify-content: space-between; margin-top: 60px; font-size: 13px;">
                    <div>
                      <p style="margin: 0; font-weight: bold;">Sub-Divisional Magistrate</p>
                      <p style="margin: 0; color: #64748b;">Committee Chairman</p>
                    </div>
                    <div style="text-align: right;">
                      <p style="margin: 0; font-weight: bold;">Mining Officer</p>
                      <p style="margin: 0; color: #64748b;">Committee Member Secretary</p>
                    </div>
                  </div>
                </div>
              </div>
            `;
          }
        } 
        else if (subId === 'fm-toc') {
          const uploaded = S.uploadedPDFs && S.uploadedPDFs['toc'];
          if (uploaded && uploaded.length) {
            subHtml = `<div style="page-break-after:always;">
              <h2 class="section-title">Table of Contents</h2>
              ${uploaded.map(src => `<img src="${src}" style="max-width:100%; height:auto; display:block; margin:0 auto 10px;">`).join('')}
            </div>`;
          }
        } 
        else if (subId === 'fm-lot') {
          subHtml = `
            <div style="margin-bottom: 40px; page-break-after:always;">
              <h2 class="section-title">List of Tables</h2>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 20px;">
                <thead>
                  <tr style="border-bottom: 2px solid #17324d; background: #f8fafc;">
                    <th style="padding: 10px; text-align: left;">Table No.</th>
                    <th style="padding: 10px; text-align: left;">Table Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px;">Table 1.1</td><td style="padding: 8px 10px;">Temperature, Humidity & Climate Trends</td></tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px;">Table 2.1</td><td style="padding: 8px 10px;">Geological Succession of Jalandhar District</td></tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px;">Table 3.1</td><td style="padding: 8px 10px;">Active Mining Leases & Production Capacity</td></tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px;">Table 4.1</td><td style="padding: 8px 10px;">Cross Section Elevation & Distance Readings</td></tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px;">Table 5.1</td><td style="padding: 8px 10px;">Replenishment Assessment Data & Safe Yield</td></tr>
                </tbody>
              </table>
            </div>
          `;
        } 
        else if (subId === 'fm-lof') {
          subHtml = `
            <div style="margin-bottom: 40px; page-break-after:always;">
              <h2 class="section-title">List of Figures</h2>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 20px;">
                <thead>
                  <tr style="border-bottom: 2px solid #17324d; background: #f8fafc;">
                    <th style="padding: 10px; text-align: left;">Figure No.</th>
                    <th style="padding: 10px; text-align: left;">Figure/Map Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px;">Figure 1.1</td><td style="padding: 8px 10px;">Location Map of District ${district}</td></tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px;">Figure 2.1</td><td style="padding: 8px 10px;">Drainage & River System Map</td></tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px;">Figure 3.1</td><td style="padding: 8px 10px;">Geological and Soil Classification Map</td></tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px;">Figure 4.1</td><td style="padding: 8px 10px;">DGPS Survey & Cluster Boundary Map</td></tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px;">Figure 5.1</td><td style="padding: 8px 10px;">Cross-Section Elevation Graphs (Pre & Post-Monsoon)</td></tr>
                </tbody>
              </table>
            </div>
          `;
        } 
        else if (subId === 'fm-abbr') {
          subHtml = `
            <div style="margin-bottom: 40px; page-break-after:always;">
              <h2 class="section-title">Abbreviations</h2>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 20px;">
                <thead>
                  <tr style="border-bottom: 2px solid #17324d; background: #f8fafc;">
                    <th style="padding: 10px; text-align: left; width: 25%;">Abbreviation</th>
                    <th style="padding: 10px; text-align: left;">Full Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px; font-weight:bold;">DSR</td><td style="padding: 8px 10px;">District Survey Report</td></tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px; font-weight:bold;">EMGSM</td><td style="padding: 8px 10px;">Enforcement and Monitoring Guidelines for Sand Mining</td></tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px; font-weight:bold;">CORS</td><td style="padding: 8px 10px;">Continuously Operating Reference Stations</td></tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px; font-weight:bold;">DGPS</td><td style="padding: 8px 10px;">Differential Global Positioning System</td></tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px; font-weight:bold;">MoEFCC</td><td style="padding: 8px 10px;">Ministry of Environment, Forest and Climate Change</td></tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px; font-weight:bold;">SEIAA</td><td style="padding: 8px 10px;">State Level Environment Impact Assessment Authority</td></tr>
                </tbody>
              </table>
            </div>
          `;
        }
        
        if (subHtml && subHtml.trim()) {
          combinedContent += `<div class="section-block">${subHtml}</div>`;
        }
      });
    }
    else if (item.id === 'chapters') {
      const activeChapters = (S.chapters || []).filter(ch => item.subIds.includes(`chapter-${ch.id}`));
      activeChapters.forEach((ch, idx) => {
        const chapterNo = S.chapters.indexOf(ch) + 1;
        const uploaded = S.chapterPDFs && S.chapterPDFs[ch.id];
        let chContentHtml = '';
        if (uploaded && uploaded.length) {
          chContentHtml = `
            <div style="display:flex; flex-direction:column; gap:10px; margin-top:12px;">
              ${uploaded.map(src => `<img src="${src}" style="max-width:100%; height:auto; border:1px solid #cbd5e1; border-radius:4px; display:block; margin:0 auto;">`).join('')}
            </div>
          `;
        }
        
        sectionHtml += `
          <div class="section-block">
            <h2 class="section-title">Chapter ${chapterNo}: ${ch.name}</h2>
            <p style="font-size:13.5px; line-height:1.6; color:#334155; white-space:pre-wrap; margin-bottom:12px;">${ch.summary || ''}</p>
            ${chContentHtml}
          </div>
        `;
      });
      combinedContent += sectionHtml;
    }
    else if (item.id === 'plates') {
      const activePlates = (S.plates || []).filter(pl => item.subIds.includes(`plate-${pl.id}`));
      activePlates.forEach((pl, idx) => {
        const plateIndex = S.plates.indexOf(pl) + 1;
        const uploaded = pl.pages;
        let plateContentHtml = '';
        if (uploaded && uploaded.length) {
          plateContentHtml = `
            <div style="display:flex; flex-direction:column; gap:10px; margin-top:12px;">
              ${uploaded.map(src => `<img src="${src}" style="max-width:100%; height:auto; border:1px solid #cbd5e1; border-radius:4px; display:block; margin:0 auto;">`).join('')}
            </div>
          `;
        }
        
        sectionHtml += `
          <div class="section-block">
            <h2 class="section-title">Plate P${plateIndex}: ${pl.name}</h2>
            <p style="font-size:13.5px; line-height:1.6; color:#334155; white-space:pre-wrap; margin-bottom:12px;">${pl.summary || ''}</p>
            ${plateContentHtml}
          </div>
        `;
      });
      combinedContent += sectionHtml;
    }
    else if (item.id.startsWith('custom-pdf-')) {
      const reports = loadLocalReports();
      const report = reports.find(r => r.id === reportId);
      const customSec = report && report.customSections && report.customSections.find(cs => cs.id === item.id);
      const titleText = customSec ? customSec.name : 'Custom PDF Section';
      
      const pages = S.uploadedPDFs && S.uploadedPDFs[item.id];
      let pagesHtml = '';
      if (pages && pages.length > 0) {
        pagesHtml = pages.map(src => `<img src="${src}" style="max-width:100%; height:auto; border:1px solid #cbd5e1; border-radius:4px; display:block; margin:0 auto 10px;">`).join('');
      } else {
        pagesHtml = `<p class="empty" style="color:#64748b; font-style:italic;">No PDF document uploaded for this section yet.</p>`;
      }
      
      sectionHtml = `
        <div class="section-block" data-custom-section-id="${item.id}">
          <h2 class="section-title">${escapeHtml(titleText)}</h2>
          ${pagesHtml}
        </div>
      `;
      combinedContent += sectionHtml;
    }
    else {
      if (isLivePreviewAnnexureId(item.id)) {
        const livePreviewHtml = getLivePreviewAnnexureSectionHtml(item.id);
        if (livePreviewHtml) {
          combinedContent += livePreviewHtml;
          return;
        }
      }

      const source = document.getElementById(`view-${item.id}`);
      if (source) {
        const cleanedClone = cloneSourceWithValues(source);
        const clone = window.pdfPreview.cleanupAnnexurePreviewClone(cleanedClone, item.id);
        
        let attachmentHtml = '';
        if (typeof renderAnnexureAttachmentPreview === 'function') {
          attachmentHtml = renderAnnexureAttachmentPreview(item.id);
        }
        
        const infoEl = clone.querySelector(`#${item.id}-attachment-info`);
        if (infoEl) {
          infoEl.innerHTML = attachmentHtml || '';
        }
        
        clone.querySelectorAll('.upload-zone, button, input[type="file"], select, label:has(input[type="file"]), .modal').forEach(el => el.remove());
        
        let bodyHtml = clone.innerHTML.trim() || '<p class="empty">No annexure data entered yet.</p>';
        if (attachmentHtml && (!infoEl || !bodyHtml.includes(attachmentHtml))) {
          bodyHtml += attachmentHtml;
        }
        
        const title = getModelDsrSectionTitle(item.id);
        
        sectionHtml = `
          <div class="section-block">
            <h2 class="section-title">${title}</h2>
            ${bodyHtml}
          </div>
        `;
      } else {
        sectionHtml = `
          <div class="section-block">
            <h2 class="section-title">${item.id.toUpperCase()}</h2>
            <p class="empty">Section view element not found. Please load the section page in the portal once to initialize it.</p>
          </div>
        `;
      }
      combinedContent += sectionHtml;
    }
  });

  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          *{box-sizing:border-box}
          body{margin:0;background:#ffffff;color:#111827;font-family:Arial,Helvetica,sans-serif;padding:30px;}
          .sheet{width:100%;margin:0 auto;}
          .doc-head{border-bottom:2px solid #17324d;padding-bottom:14px;margin-bottom:25px;text-align:center;}
          .doc-head h1{margin:0 0 8px;color:#17324d;font-size:22px;line-height:1.2;}
          .doc-head p{margin:0;color:#526172;font-size:12px;}
          h1,h2,h3,h4{color:#17324d;line-height:1.25;}
          h1{font-size:24px;margin:0 0 14px;} 
          h2{font-size:18px;margin:20px 0 10px;} 
          h3{font-size:15px;margin:16px 0 8px;}
          p,.muted,label{color:#526172;font-size:13px;line-height:1.55;}
          .section-block {
            margin-bottom: 40px;
            page-break-after: always;
          }
          .section-block:last-child {
            page-break-after: avoid;
          }
          .section-title {
            color: #17324d;
            border-bottom: 2px solid #17324d;
            padding-bottom: 8px;
            margin-bottom: 20px;
            font-size: 18px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          table{width:100%;border-collapse:collapse;margin:10px 0 18px;font-size:11px;table-layout:auto;}
          th,td{border:1px solid #111827;padding:6px 7px;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;}
          th{background:#f3f4f6;font-weight:700;text-align:left;}
          .field-value{display:inline-block;min-width:80px;padding:4px 6px;border-bottom:1px solid #cbd5e1;color:#111827;}
          .editable-title{font-weight:600;}
          .empty{padding:24px;border:1px dashed #cbd5e1;border-radius:8px;text-align:center;}
          img{max-width:100%;height:auto;display:block;margin:0 auto 10px;}
          .annexure-uploaded-pages-simple { display: flex; flex-direction: column; gap: 20px; margin-top: 20px; }
          .annexure-uploaded-pages-simple img { max-width: 100%; height: auto; display: block; margin: 0 auto; }
          .annexure-live-preview-section .doc-head {
            border-bottom: 2px solid #17324d;
            padding-bottom: 14px;
            margin-bottom: 20px;
            text-align: center;
          }
          .annexure-live-preview-section .doc-head h1 {
            margin: 0 0 8px;
            color: #17324d;
            font-size: 24px;
            line-height: 1.2;
          }
          .annexure-live-preview-section .doc-head p {
            margin: 0;
            color: #526172;
            font-size: 13px;
          }
          .annexure-live-preview-section .card,
          .annexure-live-preview-section .card-bd,
          .annexure-live-preview-section .annexure-line-main {
            border: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 0 18px !important;
          }
          .annexure-live-preview-section .g2,
          .annexure-live-preview-section .grid,
          .annexure-live-preview-section .annexure-line-layout {
            display: block !important;
          }
          
          /* Flatten form elements for flat text printing */
          input, textarea, select {
            border: none !important;
            background: transparent !important;
            color: #111827 !important;
            padding: 0 !important;
            width: 100% !important;
            resize: none !important;
            font-size: inherit !important;
            font-family: inherit !important;
            box-shadow: none !important;
            outline: none !important;
          }
          
          /* Hide non-printable widgets */
          .btn, button, .upload-zone, .card-hd, .modal, .file-item, .alert-box, .hint, .sb-ico, [style*="display:none"], [style*="display: none"] {
            display: none !important;
          }
        </style>
      </head>
      <body>
        <main class="sheet">
          <header class="doc-head">
            <h1>${escapeHtml(reportName)}</h1>
            <p>Model DSR Compiled Report - District Survey Report - ${escapeHtml(district)} | ${escapeHtml(year)}</p>
          </header>
          ${combinedContent}
        </main>
      </body>
    </html>`;
}

function downloadCustomReportPDF(reportName, reportId) {
  const reports = loadLocalReports();
  const report = reports.find(r => r.id === reportId);
  if (reportId) {
    saveReportSelection(reportId);
  }
  const currentCheckedIds = getCurrentSelectedReportSectionIds();
  const checkedIds = currentCheckedIds.length ? currentCheckedIds : (report ? (report.sections || []) : []);
  
  if (checkedIds.length === 0) {
    checkedIds.push(...currentCheckedIds);
  }
  
  generateModelDsrPDF(reportName, checkedIds, reportId);
}

function showPdfProgressToast(message) {
  let loader = document.getElementById('pdf-loader-overlay');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'pdf-loader-overlay';
    loader.style.position = 'fixed';
    loader.style.left = '0';
    loader.style.top = '0';
    loader.style.width = '100%';
    loader.style.height = '100%';
    loader.style.backgroundColor = 'rgba(15, 23, 42, 0.75)';
    loader.style.backdropFilter = 'blur(5px)';
    loader.style.zIndex = '999999';
    loader.style.display = 'flex';
    loader.style.flexDirection = 'column';
    loader.style.justifyContent = 'center';
    loader.style.alignItems = 'center';
    loader.style.color = '#ffffff';
    loader.style.fontFamily = 'system-ui, sans-serif';
    
    loader.innerHTML = `
      <div style="background: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15); text-align: center; color: #1e293b; max-width: 320px; width: 90%;">
        <div style="border: 4px solid #f1f5f9; border-top: 4px solid #f59e0b; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 15px auto;"></div>
        <div id="pdf-loader-status" style="font-weight: 700; font-size: 15px; margin-bottom: 5px; color: #1e293b;">Compiling Report</div>
        <div id="pdf-loader-sub" style="font-size: 12px; color: #64748b;">Please wait while we assemble your document...</div>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    document.body.appendChild(loader);
  }
  
  const statusEl = loader.querySelector('#pdf-loader-status');
  if (statusEl) statusEl.textContent = message;
}

function hidePdfProgressToast() {
  const loader = document.getElementById('pdf-loader-overlay');
  if (loader) {
    loader.remove();
  }
}

async function generateModelDsrPdfBlob(reportName, checkedIds, reportId, reportObj = null) {
  let report = reportObj;
  if (!report && reportId) {
    const reports = loadLocalReports();
    report = reports.find(r => r.id === reportId);
  }
  if (report) {
    restoreReportFrontMatterPdfs(report);
  }

  const localRenderTextPageCanvas = (title, bodyText, subtitle) => {
    const canvas = document.createElement('canvas');
    const scale = 3;
    const W_canvas = 620 * scale;
    const H_canvas = 880 * scale;
    canvas.width = W_canvas;
    canvas.height = H_canvas;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W_canvas, H_canvas);
    ctx.fillStyle = '#0a2540';
    ctx.textAlign = 'center';
    ctx.font = 'bold ' + (22 * scale) + 'px Georgia, serif';
    ctx.fillText(title, W_canvas / 2, 120 * scale);
    const isRedundant = subtitle && (
      title.toLowerCase().includes(subtitle.toLowerCase()) || 
      subtitle.toLowerCase().includes(title.toLowerCase()) ||
      title.toLowerCase().replace(/[^a-z0-9]/g, '') === subtitle.toLowerCase().replace(/[^a-z0-9]/g, '')
    );
    if (subtitle && !isRedundant) {
      ctx.font = (12 * scale) + 'px Georgia, serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(subtitle, W_canvas / 2, 150 * scale);
    }
    ctx.textAlign = 'left';
    ctx.fillStyle = '#334155';
    ctx.font = (14 * scale) + 'px Georgia, serif';
    const margin = 56 * scale;
    const maxWidth = W_canvas - margin * 2;
    const words = (bodyText || '').split(/\s+/);
    const lines = [];
    let line = '';
    words.forEach(word => {
      const test = line ? (line + ' ' + word) : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    let y = 200 * scale;
    const lineHeight = 22 * scale;
    lines.forEach(l => {
      if (y > H_canvas - 80 * scale) return;
      ctx.fillText(l, margin, y);
      y += lineHeight;
    });
    return canvas.toDataURL('image/jpeg', 0.95);
  };

  const hasAnnexureContent = (viewId) => {
    if (['annexure-f', 'annexure-j', 'annexure-k'].includes(viewId)) {
      if (window.pdfPreview && typeof pdfPreview.prepareAnnexureLivePreviewSource === 'function') {
        pdfPreview.prepareAnnexureLivePreviewSource(viewId);
      }
      if (viewId === 'annexure-j' && typeof getAnnexureJDemandTables === 'function' && getAnnexureJDemandTables().length) {
        return true;
      }
    }
    const hasUpload = Array.isArray(S.uploadedPDFs?.[viewId]) && S.uploadedPDFs[viewId].length > 0;
    if (simpleAnnexurePreviewIds.includes(viewId)) {
      return true;
    }
    
    let hasLetterUpload = false;
    if (viewId.startsWith('annexure-')) {
      const letter = viewId.replace('annexure-', '').toUpperCase();
      const stateKey = 'annexure' + letter;
      const entries = S[stateKey];
      if (Array.isArray(entries)) {
        hasLetterUpload = entries.length > 0;
      }
    }

    const hasDomTable = !!document.querySelector("table[id*=\"" + viewId + "\"], table[id*=\"" + viewId.replace('annexure-', 'anx') + "\"]");
    const iframe = getPreviewIframe(viewId);
    const hasIframe = !!(iframe && (iframe.getAttribute('src') || iframe.srcdoc));
    return hasUpload || hasLetterUpload || hasDomTable || hasIframe;
  };

  if (!checkedIds || checkedIds.length === 0) {
    return null;
  }
  
  const allActiveIds = [...checkedIds];
  const hasFm = checkedIds.some(id => id.startsWith('fm-'));
  if (hasFm && !allActiveIds.includes('front-matter')) allActiveIds.push('front-matter');
  const hasChapter = checkedIds.some(id => id.startsWith('chapter-'));
  if (hasChapter && !allActiveIds.includes('chapters')) allActiveIds.push('chapters');
  const hasPlate = checkedIds.some(id => id.startsWith('plate-'));
  if (hasPlate && !allActiveIds.includes('plates')) allActiveIds.push('plates');

  // 1. Ensure jspdf and html2canvas are available
  if (typeof jspdf === 'undefined' || typeof html2canvas === 'undefined') {
    try {
      await ensurePortalVendors(['html2pdf', 'pdfjs']);
    } catch (err) {
      console.error('Failed to load PDF library vendors:', err);
      return null;
    }
  }

  // 2. Setup jsPDF configuration matching the final PDF exactly
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const H = 297;
  const pad = 12;
  const tableWidth = W - (pad * 2);
  const pageFrameMargin = 5;
  const imagePageMargin = 4;
  const navy = [11, 29, 58];
  const blue = [26, 51, 102];
  const saffron = [196, 154, 88];
  const muted = [86, 96, 112];

  const titlePages = [];
  const borderPages = [];
  const uploadedPages = [];
  let borderActive = false;

  const originalAddPage = doc.addPage.bind(doc);
  doc.addPage = function(...args) {
    originalAddPage(...args);
    const pNum = doc.getCurrentPageInfo().pageNumber;
    if (borderActive) {
      borderPages.push(pNum);
    }
  };

  let isFirstPage = true;

  const safe = (value, fallback = '-') => String(value ?? fallback).trim() || fallback;
  const hasText = (value) => String(value ?? '').trim().length > 0;
  const localFmtN = (v, dec = 2) => typeof fmtN === 'function' ? fmtN(v, dec) : Number(v).toFixed(dec);

  const addTitlePage = (titleText, subtitleText = '') => {
    if (isFirstPage) {
      isFirstPage = false;
    } else {
      doc.addPage();
    }
    const pNum = doc.getCurrentPageInfo().pageNumber;
    titlePages.push(pNum);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.text(titleText, W / 2, H / 2 - 10, { align: 'center', maxWidth: W - 40 });
    const isRedundant = subtitleText && (
      titleText.toLowerCase().includes(subtitleText.toLowerCase()) || 
      subtitleText.toLowerCase().includes(titleText.toLowerCase()) ||
      titleText.toLowerCase().replace(/[^a-z0-9]/g, '') === subtitleText.toLowerCase().replace(/[^a-z0-9]/g, '')
    );
    if (subtitleText && !isRedundant) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(subtitleText, W / 2, H / 2 + 5, { align: 'center', maxWidth: W - 40 });
    }
  };

  const writeParagraph = (text, y, options = {}) => {
    if (!hasText(text)) return y;
    doc.setFont('helvetica', options.bold ? 'bold' : 'normal');
    doc.setFontSize(options.size || 10);
    doc.setTextColor(...(options.color || [0, 0, 0]));
    const lines = doc.splitTextToSize(String(text), options.width || W - (pad * 2));
    doc.text(lines, options.x || pad, y);
    return y + (lines.length * (options.lineHeight || 5.5)) + (options.after || 6);
  };

  const getImageFormat = (src) => /^data:image\/jpe?g/i.test(String(src || '')) ? 'JPEG' : 'PNG';

  const drawFittedImagePage = (src) => {
    const format = getImageFormat(src);
    const props = doc.getImageProperties(src);
    
    const topMargin = 7;
    const leftMargin = 7;
    const bottomMargin = 20; // leaves space at the bottom (ends at y=277)
    
    const maxW = W - (leftMargin * 2);
    const maxH = H - topMargin - bottomMargin;
    
    const ratio = Math.min(maxW / props.width, maxH / props.height);
    const drawW = props.width * ratio;
    const drawH = props.height * ratio;
    const x = (W - drawW) / 2;
    const y = topMargin + (maxH - drawH) / 2;
    
    doc.addImage(src, format, x, y, drawW, drawH, undefined, 'FAST');
  };

  const addImagePage = (src, title) => {
    if (!src) return;
    if (isFirstPage) {
      isFirstPage = false;
    } else {
      doc.addPage();
    }
    const pNum = doc.getCurrentPageInfo().pageNumber;
    uploadedPages.push(pNum);
    try {
      drawFittedImagePage(src);
    } catch (err) {
      try {
        doc.addImage(src, 'JPEG', 7, 7, W - 14, H - 27, undefined, 'FAST');
      } catch (innerErr) {
        console.warn('Could not embed uploaded page:', innerErr);
      }
    }
  };

  const addPreviewImagePage = (src, title) => {
    if (!src) return;
    if (isFirstPage) {
      isFirstPage = false;
    } else {
      doc.addPage();
    }
    const pNum = doc.getCurrentPageInfo().pageNumber;
    uploadedPages.push(pNum);
    try {
      drawFittedImagePage(src);
    } catch (err) {
      try {
        doc.addImage(src, 'JPEG', 7, 7, W - 14, H - 27, undefined, 'FAST');
      } catch (innerErr) {
        console.warn('Could not embed live preview page:', innerErr);
      }
    }
  };

  const addUploadedPages = (pages, title) => {
    if (!Array.isArray(pages) || !pages.length) return false;
    pages.forEach((page, index) => addImagePage(page, `${title} - Page ${index + 1}`));
    return true;
  };

  const simpleAnnexurePreviewIds = ['annexure-b', 'annexure-c', 'annexure-d', 'annexure-e', 'annexure-g', 'annexure-h', 'annexure-i'];
  
  const ensureSimpleAnnexurePreviewState = (viewId) => {
    const letter = viewId.replace('annexure-', '').toUpperCase();
    const stateKey = `annexure${letter}`;
    if (!Array.isArray(S[stateKey])) S[stateKey] = [];
    if (!S[stateKey].length) {
      S[stateKey].push({
        id: Date.now(),
        name: `Annexure ${letter} - Entry 1`,
        summary: `Upload your Annexure ${letter} PDF or image here.`,
        fileName: null,
        fileSize: null,
        pages: null
      });
    }
    const renderName = `renderAnnexure${letter}`;
    if (typeof window[renderName] === 'function') window[renderName]();
    return S[stateKey];
  };

  const addSimpleAnnexurePreviewPages = (title, viewId) => {
    const letter = viewId.replace('annexure-', '').toUpperCase();
    const fnName = `getAnnexure${letter}Pages`;
    if (!window.pdfPreview || typeof pdfPreview[fnName] !== 'function') return false;
    ensureSimpleAnnexurePreviewState(viewId);
    let pages = pdfPreview[fnName]();
    if (!pages.length && typeof pdfPreview.renderTextPageCanvas === 'function') {
      pages = [{
        src: pdfPreview.renderTextPageCanvas(`Annexure ${letter} - Entry 1`, `Upload your Annexure ${letter} PDF or image here.`, `Annexure ${letter}`),
        label: `${title} - Page 1`,
        generated: true
      }];
    }
    if (!pages.length) return false;
    pages.forEach((p, idx) => addPreviewImagePage(p.src, `${title} - Page ${idx + 1}`));
    return true;
  };

  const fallbackTables = {
    anx1: [
      { title: 'a) Rivers:', selector: 'table[id^="anx1-rivers"]', all: true },
      { title: 'b) De-Siltation Location (Lakes/Ponds/Dams etc.):', selector: 'table[id^="anx1-desilt"]', all: true },
      { title: 'c) Patta lands/Khatedari land:', selector: 'table[id^="anx1-patta"]', all: true },
      { title: 'd) M-Sand Plants:', selector: 'table[id^="anx1-msand"]', all: true }
    ],
    anx2: [
      { title: 'Annexure II(a) - Mining Leases', selector: 'table[id^="anx2-leases"]', all: true },
      { title: 'Annexure II(b) - Patta Lands', selector: 'table[id^="anx2-patta"]', all: true },
      { title: 'Annexure II(c) - De-siltation', selector: 'table[id^="anx2-desilt"]', all: true },
      { title: 'Annexure II(d) - M-Sand Plants', selector: 'table[id^="anx2-msand"]', all: true }
    ],
    anx3: [
      { title: 'Annexure III(a) - Clusters', selector: 'table[id^="anx3-clusters"]', all: true },
      { title: 'Annexure III(b) - Contiguous Clusters', selector: 'table[id^="anx3-contiguous"]', all: true }
    ],
    anx4: [
      { title: 'Annexure IV(a) - Lease Routes', selector: 'table[id^="anx4-routes"]', all: true },
      { title: 'Annexure IV(b) - Cluster Routes', selector: 'table[id^="anx4-cluster-routes"]', all: true }
    ],
    anx5: [
      { title: 'Annexure V - Bench Mark & CORS', selector: 'table[id^="anx5-benchmarks"]', all: true },
      { title: 'Annexure V - Mining Leases', selector: 'table[id^="anx5-mining"]', all: true },
      { title: 'Annexure V - Patta Lands', selector: 'table[id^="anx5-patta"]', all: true },
      { title: 'Annexure V - De-siltation', selector: 'table[id^="anx5-desilt"]', all: true },
      { title: 'Annexure V - M-Sand Plants', selector: 'table[id^="anx5-msand"]', all: true }
    ],
    anx6: [
      { title: 'Annexure VI - Final Cluster Details', selector: 'table[id^="anx6-final-clusters"]', all: true },
      { title: 'Annexure VI - Contiguous Cluster Details', selector: 'table[id^="anx6-contiguous-clusters"]', all: true }
    ],
    anx7: [
      { title: 'Annexure VII - Individual Routes', selector: 'table[id^="anx7-routes"]', all: true },
      { title: 'Annexure VII - Cluster Routes', selector: 'table[id^="anx7-cluster-routes"]', all: true },
      { title: 'Annexure VII - Transportation Routes', selector: 'table[id^="anx7-patta-final"]', all: true }
    ],
    'annexure-b': [
      { title: 'Annexure B - Mining Leases', selector: 'table[id^="annexure-b-leases"]', all: true }
    ],
    'annexure-c': [
      { title: 'Annexure C - Cluster details', selector: 'table[id^="annexure-c-details"]', all: true }
    ],
    'annexure-d': [
      { title: 'Annexure D - Details', selector: 'table[id^="annexure-d-details"]', all: true }
    ],
    'annexure-e': [
      { title: 'Annexure E - Details', selector: 'table[id^="annexure-e-details"]', all: true }
    ],
    'annexure-f': [
      { title: 'Annexure F - Sand Ghats', selector: 'table[id^="annexure-f-sand"]', all: true },
      { title: 'Annexure F - Bench Marks', selector: 'table[id^="annexure-f-benchmark"]', all: true },
      { title: 'Annexure F - CORS Stations', selector: 'table[id^="annexure-f-cors"]', all: true }
    ],
    'annexure-g': [
      { title: 'Annexure G - Details', selector: 'table[id^="annexure-g-details"]', all: true }
    ],
    'annexure-h': [
      { title: 'Annexure H - Details', selector: 'table[id^="annexure-h-details"]', all: true }
    ],
    'annexure-i': [
      { title: 'Annexure I - Details', selector: 'table[id^="annexure-i-details"]', all: true }
    ],
    'annexure-j': [
      { title: 'Annexure J - Details', selector: 'table[id^="annexure-j-details"]', all: true }
    ],
    'annexure-k': [
      { title: 'Annexure K - Proforma Auctioned Sites', selector: 'table[id^="annexure-k-proforma"]', all: true },
      { title: 'Annexure K - Annexure A', selector: 'table[id^="annexure-k-annexure-a"]', all: true }
    ]
  };

  const renderAnnexureTables = (viewId, title) => {
    const configs = fallbackTables[viewId];
    if (!configs) return false;
    
    let addedAny = false;
    let startY = 25;
    
    configs.forEach((cfg) => {
      const tables = cfg.all ? Array.from(document.querySelectorAll(cfg.selector)) : [document.querySelector(cfg.selector)].filter(Boolean);
      tables.forEach((table) => {
        const clone = table.cloneNode(true);
        
        clone.querySelectorAll('select').forEach(select => {
          const val = select.value || '';
          const textNode = document.createTextNode(val || 'NA');
          select.parentNode.replaceChild(textNode, select);
        });
        
        clone.querySelectorAll('input, textarea').forEach(input => {
          const val = input.value || '';
          const textNode = document.createTextNode(val || 'NA');
          input.parentNode.replaceChild(textNode, input);
        });

        const headers = Array.from(clone.querySelectorAll('thead tr th, thead tr td, tbody tr th, tbody tr td'));
        let actionColIndexes = [];
        
        clone.querySelectorAll('tr').forEach(row => {
          const cells = Array.from(row.children);
          cells.forEach((cell, idx) => {
            const txt = (cell.textContent || '').trim().toLowerCase();
            if (txt === 'action' || txt === 'actions' || cell.classList.contains('actions') || cell.classList.contains('action')) {
              if (!actionColIndexes.includes(idx)) {
                actionColIndexes.push(idx);
              }
            }
          });
        });

        actionColIndexes.sort((a, b) => b - a);

        clone.querySelectorAll('tr').forEach(row => {
          const cells = Array.from(row.children);
          actionColIndexes.forEach(idx => {
            if (cells[idx]) cells[idx].remove();
          });
        });

        clone.querySelectorAll('td, th').forEach(cell => {
          cell.querySelectorAll('button, a, .btn, .actions, .edit-btn, .delete-btn, i, svg').forEach(el => el.remove());
          const txt = (cell.textContent || '').trim();
          if (!txt) {
            cell.textContent = 'NA';
          }
        });

        if (!addedAny) {
          doc.addPage();
          startY = 25;
          addedAny = true;
        } else {
          if (startY > 250) {
            doc.addPage();
            startY = 25;
          }
        }

        startY = writeParagraph(cfg.title, startY, { bold: true, size: 11, color: [0, 0, 0], after: 4 });

        const firstRow = clone.querySelector('tr');
        const colCount = firstRow ? firstRow.children.length : 0;
        const isWide = colCount > 8;
        const fontSize = isWide ? 5.8 : 7.5;
        const cellPadding = isWide ? 1.2 : 2;

        doc.autoTable({
          html: clone,
          startY: startY,
          margin: { left: pad, right: pad },
          tableWidth,
          theme: 'grid',
          styles: { fontSize: fontSize, cellPadding: cellPadding, lineColor: [0, 0, 0], lineWidth: 0.2, textColor: [0, 0, 0], overflow: 'linebreak' },
          headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', lineColor: [0, 0, 0], lineWidth: 0.2 },
          alternateRowStyles: { fillColor: [255, 255, 255] }
        });

        startY = doc.lastAutoTable.finalY + 10;
      });
    });

    return addedAny;
  };

  const getPreviewIframe = (viewId) => {
    if (window.getAnnexurePreviewIframe) return window.getAnnexurePreviewIframe(viewId);
    const ids = window.pdfPreview?.IFRAME_IDS || {};
    return document.getElementById(ids[viewId] || 'pdf-preview-iframe');
  };

  const htmlPreviewToPdfBlob = async (iframe, filename, elementToRender) => {
    await ensurePortalVendors(['html2pdf']);
    const body = iframe?.contentDocument?.body;
    const target = elementToRender || body;
    if (!target) return null;
    const opt = {
      margin: 0,
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: target.scrollWidth || document.body.scrollWidth },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', 'h4'] }
    };
    return withTimeout(
      html2pdf().set(opt).from(target).toPdf().get('pdf').then(pdf => pdf.output('blob')),
      9000,
      filename
    );
  };

  const waitForPreviewBlob = async (viewId) => {
    const iframe = getPreviewIframe(viewId);
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const src = iframe?.getAttribute('src') || '';
      if (src && src !== 'about:blank') {
        if (src.startsWith('blob:') || src.startsWith('http')) return withTimeout(fetch(src).then(res => res.blob()), 6000, `${viewId} preview fetch`);
        if (src.startsWith('data:application/pdf')) return dataUrlToBlob(src);
      }
      if (iframe?.srcdoc && iframe.contentDocument?.body) {
        return htmlPreviewToPdfBlob(iframe, `${viewId}.pdf`);
      }
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    return null;
  };

  const dataUrlToBlob = async (dataUrl) => {
    const res = await fetch(dataUrl);
    return res.blob();
  };

  const addLivePreviewHtmlPages = async (title, viewId) => {
    if (!window.pdfPreview || typeof pdfPreview.buildAnnexureHtmlDocument !== 'function') return false;
    let html = pdfPreview.buildAnnexureHtmlDocument(viewId);
    if (!html) return false;
    const iframe = document.createElement('iframe');
    const previewWidth = 1040; // Force standard high-res width
    html = html.replace('</style>', `
          body{width:${previewWidth}px!important;max-width:${previewWidth}px!important;}
          .sheet{width:${previewWidth}px!important;max-width:${previewWidth}px!important;box-shadow:none!important;margin:0!important;}
        </style>`);
    iframe.style.position = 'fixed';
    iframe.style.left = '-10000px';
    iframe.style.top = '0';
    iframe.style.width = `${previewWidth}px`;
    iframe.style.height = '1200px';
    iframe.style.border = '0';
    iframe.style.pointerEvents = 'none';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);
    try {
      await ensurePortalVendors(['html2pdf', 'pdfjs']);
      iframe.srcdoc = html;
      await withTimeout(new Promise(resolve => {
        iframe.onload = () => resolve();
        setTimeout(resolve, 250);
      }), 3000, `${viewId} HTML preview render`);
      const body = iframe.contentDocument?.body;
      if (body) {
        body.style.width = `${previewWidth}px`;
        body.style.maxWidth = `${previewWidth}px`;
        body.style.overflow = 'visible';
        iframe.style.height = (body.scrollHeight + 100) + 'px';
      }
      const elementToRender = body?.querySelector('.sheet') || body;
      if (!elementToRender) return false;
      
      const blob = await htmlPreviewToPdfBlob(iframe, `${viewId}.pdf`, elementToRender);
      if (!blob) return false;
      const pages = await pdfBlobToImages(blob);
      if (!pages.length) return false;
      pages.forEach((page, index) => addPreviewImagePage(page, `${title} - Page ${index + 1}`));
      return true;
    } catch (err) {
      console.warn(`Could not merge ${viewId} from HTML live preview:`, err);
      return false;
    } finally {
      iframe.remove();
    }
  };

  const addAnnexureExportBlobPages = async (title, viewId) => {
    try {
      await ensurePortalVendors(['jspdf', 'autotable', 'pdfjs']);
      let blob = null;
      if (viewId === 'annexure-f' && typeof exportAnnexureFPDF === 'function') {
        blob = await exportAnnexureFPDF(null, false, true);
      } else if (viewId === 'annexure-j' && typeof exportAnnexureJPDF === 'function') {
        blob = await exportAnnexureJPDF(null, false, null, true);
      } else if (viewId === 'annexure-k' && typeof exportAnnexureKPDF === 'function') {
        blob = await exportAnnexureKPDF(null, false, true);
      }
      if (!blob) return false;
      const pages = await pdfBlobToImages(blob);
      if (!pages.length) return false;
      pages.forEach((page, index) => addPreviewImagePage(page, `${title} - Page ${index + 1}`));
      return true;
    } catch (err) {
      console.warn(`Could not merge ${viewId} from generated annexure PDF:`, err);
      return false;
    }
  };

  const addAnnexureFromPreview = async (title, viewId) => {
    const uploaded = S.uploadedPDFs?.[viewId];
    if (Array.isArray(uploaded) && uploaded.length > 0) {
      uploaded.forEach((page, index) => addImagePage(page, `${title} - Page ${index + 1}`));
      return true;
    }

    if (['annexure-f', 'annexure-j', 'annexure-k'].includes(viewId)) {
      const addedGeneratedPdf = await addAnnexureExportBlobPages(title, viewId);
      if (addedGeneratedPdf) return true;
      const addedLivePreview = await addLivePreviewHtmlPages(title, viewId);
      if (addedLivePreview) return true;
    }

    if (simpleAnnexurePreviewIds.includes(viewId)) {
      return addSimpleAnnexurePreviewPages(title, viewId);
    }
    
    if (viewId.startsWith('annexure-')) {
      const letter = viewId.replace('annexure-', '').toUpperCase();
      const simpleLetters = ['B', 'C', 'D', 'E', 'G', 'H', 'I'];
      if (simpleLetters.includes(letter)) {
        const stateKey = 'annexure' + letter;
        const entries = S[stateKey] || [];
        let addedAny = false;
        entries.forEach(entry => {
          if (Array.isArray(entry.pages) && entry.pages.length > 0) {
            entry.pages.forEach((page, idx) => {
              addImagePage(page, `${title} - Page ${idx + 1}`);
              addedAny = true;
            });
          }
        });
        if (!addedAny) {
          const placeholderSrc = localRenderTextPageCanvas(`Annexure ${letter} - Entry 1`, `Upload your Annexure ${letter} PDF or image here.`, `Annexure ${letter}`);
          addImagePage(placeholderSrc, `${title} - Page 1`);
          addedAny = true;
        }
        if (addedAny) return true;
      }
    }

    let hasTables = false;
    const renderedTables = renderAnnexureTables(viewId, title);
    if (renderedTables) hasTables = true;
    
    let hasAttachments = false;
    const prevBorderActive = borderActive;
    if (viewId === 'annexure-f') {
      const fAttachment = typeof getAnnexureFAttachment === 'function' ? getAnnexureFAttachment() : null;
      if (fAttachment && fAttachment.pages && fAttachment.pages.length) {
        borderActive = false;
        fAttachment.pages.forEach((page, index) => addImagePage(page, `${title} - Supporting - Page ${index + 1}`));
        borderActive = prevBorderActive;
        hasAttachments = true;
      }
    } else if (viewId === 'annexure-j') {
      const jAttachments = typeof getAnnexureJAttachments === 'function' ? getAnnexureJAttachments() : [];
      let anyJ = false;
      jAttachments.forEach(att => {
        if (att.pages && att.pages.length) {
          anyJ = true;
        }
      });
      if (anyJ) {
        borderActive = false;
        jAttachments.forEach(att => {
          if (att.pages && att.pages.length) {
            att.pages.forEach((page, index) => addImagePage(page, `${title} - Supporting - Page ${index + 1}`));
          }
        });
        borderActive = prevBorderActive;
        hasAttachments = true;
      }
    } else if (viewId === 'annexure-k') {
      const kAttachment = typeof getAnnexureKAttachment === 'function' ? getAnnexureKAttachment() : null;
      if (kAttachment && kAttachment.pages && kAttachment.pages.length) {
        borderActive = false;
        kAttachment.pages.forEach((page, index) => addImagePage(page, `${title} - Supporting - Page ${index + 1}`));
        borderActive = prevBorderActive;
        hasAttachments = true;
      }
    }

    if (!hasTables && !hasAttachments) {
      const letter = viewId.replace('annexure-', '').toUpperCase();
      const stateKey = 'annexure' + letter;
      const entries = S[stateKey] || [];
      let addedAny = false;
      entries.forEach(entry => {
        if (Array.isArray(entry.pages) && entry.pages.length > 0) {
          entry.pages.forEach((page, idx) => {
            addPreviewImagePage(page, `${title} - Page ${idx + 1}`);
            addedAny = true;
          });
        }
      });
      if (!addedAny) {
        const placeholderSrc = localRenderTextPageCanvas(title, 'No uploaded PDF or table data is available for this selected section yet.', 'Selected Model DSR Section');
        addPreviewImagePage(placeholderSrc, `${title} - Page 1`);
        addedAny = true;
      }
      if (addedAny) return true;
    }

    return renderedTables || hasAttachments;
  };

  const pdfBlobToImages = async (blob) => {
    await ensurePortalVendors(['pdfjs']);
    const arrayBuffer = await blob.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages = [];
    for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
      const page = await pdf.getPage(pageNo);
      const viewport = page.getViewport({ scale: 1.7 });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport }).promise;
      pages.push(canvas.toDataURL('image/jpeg', 0.92));
    }
    return pages;
  };

  const withTimeout = (promise, ms, label) => Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), ms))
  ]);

  const district = (window.S && S.frontMatter && S.frontMatter.district) || (window.S && S.activeProject && S.activeProject.district) || 'Jalandhar';
  const state = (window.S && S.frontMatter && S.frontMatter.state) || 'Punjab';
  const year = (window.S && S.frontMatter && S.frontMatter.year) || (window.S && S.activeProject && S.activeProject.year) || '2025-26';
  const version = (window.S && S.frontMatter && S.frontMatter.version) || 'Final Approved Draft';

  // 3. Sort selected checkbox IDs according to sectionOrder
  let sectionOrder = [
    'front-matter',
    'chapters',
    'plates',
    'anx1', 'anx2', 'anx3', 'anx4', 'anx5', 'anx6', 'anx7',
    'annexure-b', 'annexure-c', 'annexure-d', 'annexure-e', 'annexure-f', 'annexure-g', 'annexure-h', 'annexure-i', 'annexure-j', 'annexure-k'
  ];

  if (!report && reportId) {
    const reports = loadLocalReports();
    report = reports.find(r => r.id === reportId);
  }
  if (report && report.sectionOrder && Array.isArray(report.sectionOrder)) {
    sectionOrder = report.sectionOrder;
  }

  const orderedItems = [];
  sectionOrder.forEach(secId => {
    if (secId === 'front-matter') {
      const fmSubsections = ['fm-cover', 'fm-toc', 'fm-pref', 'fm-ack', 'fm-cert'];
      const activeFmSubs = fmSubsections.filter(id => checkedIds.includes(id));
      if (activeFmSubs.length > 0) {
        orderedItems.push({ id: 'front-matter', subIds: activeFmSubs });
      }
    } else if (secId === 'chapters') {
      const checkedChapters = (S.chapters || []).filter(ch => checkedIds.includes(`chapter-${ch.id}`));
      if (checkedChapters.length > 0) {
        orderedItems.push({ id: 'chapters', subIds: checkedChapters.map(ch => `chapter-${ch.id}`) });
      }
    } else if (secId === 'plates') {
      const checkedPlates = (S.plates || []).filter(pl => checkedIds.includes(`plate-${pl.id}`));
      if (checkedPlates.length > 0) {
        orderedItems.push({ id: 'plates', subIds: checkedPlates.map(pl => `plate-${pl.id}`) });
      }
    } else if (secId.startsWith('custom-pdf-')) {
      if (checkedIds.includes(secId)) {
        orderedItems.push({ id: secId });
      }
    } else {
      if (checkedIds.includes(secId)) {
        orderedItems.push({ id: secId });
      }
    }
  });

  // 4. Render loop
  try {
    for (let index = 0; index < orderedItems.length; index++) {
      const item = orderedItems[index];
      
      if (item.id === 'front-matter') {
        for (const subId of item.subIds) {
          if (subId === 'fm-cover') {
            const coverPages = window.pdfPreview ? window.pdfPreview.getFrontMatterPages().filter(p => /^cover/i.test(p.label)) : [];
            if (coverPages.length > 0) {
              coverPages.forEach(p => addImagePage(p.src, 'Cover Page'));
            } else if (window.pdfPreview && typeof window.pdfPreview.renderCoverPageCanvas === 'function') {
              addImagePage(window.pdfPreview.renderCoverPageCanvas(), 'Cover Page');
            } else {
              if (isFirstPage) {
                isFirstPage = false;
              } else {
                doc.addPage();
              }
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(24);
              doc.setTextColor(0, 0, 0);
              doc.text('DISTRICT SURVEY REPORT', W / 2, 70, { align: 'center' });
              doc.text(`FOR SAND MINING IN ${district.toUpperCase()} DISTRICT`, W / 2, 84, { align: 'center', maxWidth: W - 30 });
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(12);
              doc.text(`Government of Punjab\nDepartment of Mining and Geology`, W / 2, H / 2 - 10, { align: 'center' });
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(11);
              doc.text(`Year: ${year}`, W / 2, H - 50, { align: 'center' });
              doc.text(`Version: ${version}`, W / 2, H - 42, { align: 'center' });
            }
          } else if (subId === 'fm-toc') {
            const tocPages = window.pdfPreview ? window.pdfPreview.getFrontMatterPages().filter(p => /^content/i.test(p.label)) : [];
            if (tocPages.length > 0) {
              tocPages.forEach(p => addImagePage(p.src, 'Table of Contents'));
            } else {
              addPreviewImagePage(
                localRenderTextPageCanvas('Content Page', 'No uploaded content page is available for this selected front-matter section yet.', 'Front Matter'),
                'Content Page'
              );
            }
          } else if (subId === 'fm-pref') {
            const prefPages = window.pdfPreview ? window.pdfPreview.getFrontMatterPages().filter(p => /^preface/i.test(p.label)) : [];
            if (prefPages.length > 0) {
              prefPages.forEach(p => addImagePage(p.src, 'Preface'));
            } else {
              addPreviewImagePage(
                localRenderTextPageCanvas('Preface', 'No preface text or uploaded preface PDF is available for this selected front-matter section yet.', 'Front Matter'),
                'Preface'
              );
            }
          } else if (subId === 'fm-ack') {
            const ackPages = window.pdfPreview ? window.pdfPreview.getFrontMatterPages().filter(p => /^acknowledgement/i.test(p.label)) : [];
            if (ackPages.length > 0) {
              ackPages.forEach(p => addImagePage(p.src, 'Acknowledgement'));
            } else {
              addPreviewImagePage(
                localRenderTextPageCanvas('Acknowledgement', 'No acknowledgement text is available for this selected front-matter section yet.', 'Front Matter'),
                'Acknowledgement'
              );
            }
          } else if (subId === 'fm-cert') {
            const certPages = window.pdfPreview ? window.pdfPreview.getFrontMatterPages().filter(p => /^certificate of compliance/i.test(p.label)) : [];
            if (certPages.length > 0) {
              certPages.forEach(p => addImagePage(p.src, 'Certificate of Compliance'));
            } else {
              addPreviewImagePage(
                localRenderTextPageCanvas('Certificate of Compliance', 'No certificate page is available for this selected front-matter section yet.', 'Front Matter'),
                'Certificate of Compliance'
              );
            }
          }
        }
      } 
      else if (item.id === 'chapters') {
        for (const subId of item.subIds) {
          const chIdx = (S.chapters || []).findIndex(c => `chapter-${c.id}` === subId);
          const chNum = chIdx !== -1 ? chIdx + 1 : 1;
          const ch = (S.chapters || [])[chNum - 1] || {};
          const chapterTitle = safe(ch.name, `Chapter ${chNum}`);
          const chPages = (S.chapterPDFs && S.chapterPDFs[ch.id]) || ch.pages || [];
          addTitlePage(chapterTitle);
          if (chPages.length > 0) {
            chPages.forEach(p => addImagePage(p, chapterTitle));
          } else {
            const fallback = localRenderTextPageCanvas(
              chapterTitle,
              ch.summary || 'No uploaded chapter PDF is available for this selected chapter yet.',
              `Chapter ${chNum}`
            );
            addPreviewImagePage(fallback, chapterTitle);
          }
        }
      } 
      else if (item.id === 'plates') {
        for (const subId of item.subIds) {
          const plIdx = (S.plates || []).findIndex(p => `plate-${p.id}` === subId);
          const plateNo = plIdx !== -1 ? plIdx + 1 : 1;
          const pl = (S.plates || [])[plateNo - 1] || {};
          const plateTitle = safe(pl.name, `Plate ${plateNo}`);
          const platePages = pl.pages || [];
          addTitlePage(plateTitle);
          if (platePages.length > 0) {
            platePages.forEach(p => addImagePage(p, plateTitle));
          } else {
            const fallback = localRenderTextPageCanvas(
              plateTitle,
              pl.summary || 'No uploaded plate PDF or image is available for this selected plate yet.',
              `Plate ${plateNo}`
            );
            addPreviewImagePage(fallback, plateTitle);
          }
        }
      } 
      else if (item.id.startsWith('custom-pdf-')) {
        const reports = loadLocalReports();
        const report = reports.find(r => r.id === reportId);
        const customSec = report && report.customSections && report.customSections.find(cs => cs.id === item.id);
        const titleText = customSec ? customSec.name : 'Custom PDF Section';
        const customPages = (S.uploadedPDFs && S.uploadedPDFs[item.id]) || (report && report.customPdfs && report.customPdfs[item.id]);
        addTitlePage(titleText);
        if (customPages && customPages.length > 0) {
          customPages.forEach((page, idx) => addImagePage(page, `${titleText} - Page ${idx + 1}`));
        } else {
          const fallback = localRenderTextPageCanvas(
            titleText,
            'No uploaded PDF is available for this selected custom section yet.',
            'Custom PDF Section'
          );
          addPreviewImagePage(fallback, titleText);
        }
      } 
      else {
        // Standard Annexures
        const editableTitle = getModelDsrSectionTitle(item.id);
        const isAllowed = ['anx1', 'anx2', 'anx3', 'anx4', 'anx5', 'anx6', 'anx7', 'annexure-f', 'annexure-j', 'annexure-k'].includes(item.id);

        borderActive = isAllowed;
        addTitlePage(editableTitle);
        await addAnnexureFromPreview(editableTitle, item.id);
        borderActive = false;
      }
      
      // Yield to main thread to keep UI smooth
      await new Promise(resolve => setTimeout(resolve, 15));
    }
    
    // 5. Draw footers and borders (exactly like final DSR PDF format)
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      if (p === 1 && checkedIds.includes('fm-cover')) continue; // Skip cover page if it is page 1
      
      const isTitlePage = titlePages.includes(p);
      
      if (borderPages.includes(p)) {
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);
        doc.rect(pageFrameMargin, pageFrameMargin, W - (pageFrameMargin * 2), H - pageFrameMargin - 18, 'S');
      }
      
      if (!isTitlePage) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(0, 0, 0);
        const districtNameUpper = String(district).toUpperCase();
        const footerLeft = `PREPARED BY: SUB-DIVISIONAL COMMITTEE OF ${districtNameUpper} DISTRICT`;
        const footerLeft2 = `ASSISTED BY: RSP GREEN DEVELOPMENT AND LABORATORIES PVT. LTD`;
        doc.text(footerLeft, W / 2, 286, { align: 'center' });
        doc.text(footerLeft2, W / 2, 290, { align: 'center' });
        doc.text(`Page ${p}`, W - 8, 288, { align: 'right' });
      }
    }
    
    return doc.output('blob');
  } catch (err) {
    console.error('Unified report generation crashed:', err);
    return null;
  }
}

async function generateModelDsrPDF(reportName, checkedIds, reportId) {
  if (!checkedIds || checkedIds.length === 0) {
    toast("No sections selected to download.", "error");
    return;
  }
  
  showPdfProgressToast('Generating Model DSR PDF report...');
  
  try {
    const blob = await generateModelDsrPdfBlob(reportName, checkedIds, reportId);
    hidePdfProgressToast();
    
    if (blob) {
      const filename = `${reportName.replace(/\s+/g, '_')}_Model_DSR_Report.pdf`;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast('Model DSR PDF downloaded successfully!', 'success');
    } else {
      toast('PDF compilation failed.', 'error');
    }
  } catch (err) {
    console.error('Download PDF error:', err);
    hidePdfProgressToast();
    toast('PDF compilation failed.', 'error');
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showCustomConfirmModal({
  title = "Are you sure?",
  message = "",
  confirmText = "OK",
  cancelText = "Cancel",
  tone = "warning",
  onConfirm = null
} = {}) {
  const existing = document.getElementById('custom-confirm-modal-overlay');
  if (existing) existing.remove();

  const palette = tone === "danger"
    ? {
        accent: "#dc2626",
        accentDark: "#b91c1c",
        accentSoft: "#fee2e2",
        accentText: "#991b1b",
        ring: "rgba(220, 38, 38, 0.18)",
        icon: "!"
      }
    : {
        accent: "#b7791f",
        accentDark: "#92400e",
        accentSoft: "#fef3c7",
        accentText: "#92400e",
        ring: "rgba(183, 121, 31, 0.18)",
        icon: "?"
      };

  const overlay = document.createElement('div');
  overlay.id = 'custom-confirm-modal-overlay';
  overlay.style.position = 'fixed';
  overlay.style.left = '0';
  overlay.style.top = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(15, 23, 42, 0.40)';
  overlay.style.backdropFilter = 'blur(5px)';
  overlay.style.zIndex = '1000000';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'flex-start';
  overlay.style.padding = 'clamp(130px, 18vh, 220px) 18px 32px';
  overlay.style.boxSizing = 'border-box';

  overlay.innerHTML = `
    <div role="dialog" aria-modal="true" aria-labelledby="custom-confirm-title" aria-describedby="custom-confirm-message" style="background: #ffffff; color: #0f172a; width: min(440px, 100%); border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 24px 70px rgba(15, 23, 42, 0.24); overflow: hidden; animation: confirmModalIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);">
      <div style="display: flex; gap: 14px; padding: 22px 22px 18px 22px;">
        <div aria-hidden="true" style="width: 40px; height: 40px; flex: 0 0 40px; border-radius: 999px; background: ${palette.accentSoft}; color: ${palette.accentText}; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 19px; box-shadow: 0 0 0 6px ${palette.ring};">${palette.icon}</div>
        <div style="min-width: 0;">
          <h3 id="custom-confirm-title" style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; margin: 0 0 7px 0; color: #0f172a; font-size: 18px; line-height: 1.25; font-weight: 800; letter-spacing: 0;">${escapeHtml(title)}</h3>
          <p id="custom-confirm-message" style="margin: 0; color: #475569; font-size: 14px; line-height: 1.55;">${escapeHtml(message)}</p>
        </div>
      </div>
      <div style="display: flex; justify-content: flex-end; gap: 10px; padding: 14px 22px 20px 22px; background: #f8fafc; border-top: 1px solid #eef2f7;">
        <button type="button" id="custom-confirm-cancel" style="min-width: 92px; padding: 10px 16px; border-radius: 10px; border: 1px solid #cbd5e1; background: #ffffff; color: #334155; font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);">${escapeHtml(cancelText)}</button>
        <button type="button" id="custom-confirm-ok" style="min-width: 108px; padding: 10px 17px; border-radius: 10px; border: 1px solid ${palette.accentDark}; background: ${palette.accent}; color: #ffffff; font-size: 14px; font-weight: 800; cursor: pointer; box-shadow: 0 10px 22px ${palette.ring};">${escapeHtml(confirmText)}</button>
      </div>
    </div>
    <style>
      @keyframes confirmModalIn {
        from { transform: translateY(-14px) scale(0.98); opacity: 0; }
        to { transform: translateY(0) scale(1); opacity: 1; }
      }
    </style>
  `;

  const close = () => {
    document.removeEventListener('keydown', handleKeyDown);
    overlay.remove();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') close();
  };

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close();
  });

  const cancelBtn = overlay.querySelector('#custom-confirm-cancel');
  const okBtn = overlay.querySelector('#custom-confirm-ok');

  if (cancelBtn) cancelBtn.addEventListener('click', close);
  if (okBtn) {
    okBtn.addEventListener('click', () => {
      close();
      if (typeof onConfirm === 'function') onConfirm();
    });
  }

  document.body.appendChild(overlay);
  document.addEventListener('keydown', handleKeyDown);
  if (cancelBtn) cancelBtn.focus();
}

function showCustomPromptModal(title, defaultValue, onConfirm, buttonText = "Confirm") {
  const existing = document.getElementById('custom-prompt-modal-overlay');
  if (existing) existing.remove();
  
  const overlay = document.createElement('div');
  overlay.id = 'custom-prompt-modal-overlay';
  overlay.style.position = 'fixed';
  overlay.style.left = '0';
  overlay.style.top = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(15, 23, 42, 0.45)';
  overlay.style.backdropFilter = 'blur(4px)';
  overlay.style.zIndex = '999999';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center'; // Vertically centered
  overlay.style.paddingBottom = '100px'; // Shunted up slightly for visual balance (upside)
  
  overlay.innerHTML = `
    <div style="background: #ffffff; padding: 24px; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); text-align: left; color: #1e293b; max-width: 420px; width: 90%; animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1); border: 1px solid #e2e8f0;">
      <h3 style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; font-weight: 700; font-size: 16px; margin: 0 0 8px 0; color: #0f172a;">${title}</h3>
      <input type="text" id="custom-prompt-input" value="${defaultValue.replace(/"/g, '&quot;')}" style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; margin-bottom: 16px; outline: none; transition: border-color 0.2s; color: #0f172a; background: #fff;" />
      <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <button id="custom-prompt-cancel" style="padding: 8px 16px; font-size: 13px; cursor: pointer; border-radius: 8px; border: 1px solid #cbd5e1; background: #fff; color: #475569; font-weight:600;">Cancel</button>
        <button id="custom-prompt-confirm" style="padding: 8px 16px; font-size: 13px; cursor: pointer; border-radius: 8px; border: none; background: #8c4f00; color: #fff; font-weight:600;">${buttonText}</button>
      </div>
    </div>
    <style>
      @keyframes slideUp {
        from { transform: translateY(40px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    </style>
  `;
  
  document.body.appendChild(overlay);
  
  const input = overlay.querySelector('#custom-prompt-input');
  if (input) {
    input.focus();
    input.select();
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = input.value.trim();
        if (val) {
          overlay.remove();
          onConfirm(val);
        }
      } else if (e.key === 'Escape') {
        overlay.remove();
      }
    });
    
    input.addEventListener('focus', () => {
      input.style.borderColor = '#8c4f00';
    });
    input.addEventListener('blur', () => {
      input.style.borderColor = '#cbd5e1';
    });
  }
  
  const cancelBtn = overlay.querySelector('#custom-prompt-cancel');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      overlay.remove();
    });
  }
  
  const confirmBtn = overlay.querySelector('#custom-prompt-confirm');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      const val = input.value.trim();
      if (val) {
        overlay.remove();
        onConfirm(val);
      }
    });
  }
}

window.showCustomConfirmModal = showCustomConfirmModal;
window.showCustomPromptModal = showCustomPromptModal;

  window.mdsrGenerateModelDsrPdfBlob = generateModelDsrPdfBlob;
})();
