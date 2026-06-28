// Replenishment Study Module
// Handles the UI, compilation, and custom PDF generation for Replenishment Studies

function initReplenishmentView() {
  const container = document.getElementById('view-replenishment');
  if (!container) return;
  
  const selectContainer = document.getElementById('repl-project-select-container');
  const contentContainer = document.getElementById('repl-content-container');
  const editorContainer = document.getElementById('repl-editor-container');
  
  if (selectContainer) selectContainer.style.display = 'none';
  if (contentContainer) contentContainer.style.display = 'none';
  if (!editorContainer) return;
  
  editorContainer.style.display = 'block';

  if (!S.activeProject || !S.activeProject.id) {
    editorContainer.innerHTML = `
      <div class="card" style="margin-top:20px; padding:40px; text-align:center; max-width:600px; margin:20px auto;">
        <i data-lucide="info" style="width:48px;height:48px;color:#3b82f6;display:block;margin:0 auto 16px;"></i>
        <h2 style="color:#17324d;">No Active Project</h2>
        <p style="color:#64748b; margin-top:8px;">Please select a DSR project from the projects list first to manage its Replenishment Reports.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }
  
  // Show the main option cards
  window.showReplenishmentOptions(editorContainer);
}

// Hook into existing navigation system
const originalShowViewReplenishmentHook = window.showView;
window.showView = function(viewId, caller) {
  if (originalShowViewReplenishmentHook) originalShowViewReplenishmentHook(viewId, caller);
  if (viewId === 'replenishment') {
    initReplenishmentView();
  }
};

if (window.location.hash === '#replenishment' || window.currentViewId === 'replenishment') {
  setTimeout(() => initReplenishmentView(), 100);
}

// Sync sidebar visibility
const annexureNav = document.getElementById('annexure-nav');
const replenishmentNav = document.getElementById('replenishment-nav');
if (annexureNav && replenishmentNav) {
  replenishmentNav.style.display = annexureNav.style.display;
  new MutationObserver(() => {
    replenishmentNav.style.display = annexureNav.style.display;
  }).observe(annexureNav, { attributes: true, attributeFilter: ['style'] });
}

// Helper: load reports from localStorage
function loadLocalReports() {
  if (!S.activeProject) return [];
  const key = `repl_reports_${S.activeProject.id}`;
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch (e) {
    return [];
  }
}

// Helper: save reports to localStorage
function saveLocalReports(reports) {
  if (!S.activeProject) return;
  const key = `repl_reports_${S.activeProject.id}`;
  localStorage.setItem(key, JSON.stringify(reports));
}

// Expose functions to window
window.showReplenishmentOptions = showReplenishmentOptions;
window.showCreateReportForm = showCreateReportForm;
window.showExistingReportsList = showExistingReportsList;
window.submitCustomReportName = submitCustomReportName;
window.openCustomReport = openCustomReport;
window.renameCustomReport = renameCustomReport;
window.deleteCustomReport = deleteCustomReport;
window.downloadCustomReportPDFDirect = downloadCustomReportPDFDirect;
window.onParentCheckboxChange = onParentCheckboxChange;
window.onSubCheckboxChange = onSubCheckboxChange;
window.updateCustomReportPreview = updateCustomReportPreview;
window.downloadCustomReportPDF = downloadCustomReportPDF;

function showReplenishmentOptions(container) {
  container.innerHTML = `
    <div style="max-width: 800px; margin: 40px auto; padding: 0 20px;">
      <div style="text-align: center; margin-bottom: 40px;">
        <h2 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 24px; font-weight: 800; color: #1e293b; margin: 0 0 10px 0;">Replenishment Studies</h2>
        <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; color: #64748b; margin: 0;">Create and compile custom reports for replenishment studies by selecting specific DSR sections.</p>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
        <!-- Card 1: Create New Report -->
        <div class="card" onclick="window.showCreateReportForm()" style="padding: 32px; text-align: center; cursor: pointer; border: 1.5px solid #e2e8f0; border-radius: 12px; transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s; background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); display: flex; flex-direction: column; align-items: center;">
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: #eff6ff; border-radius: 12px; margin-bottom: 20px;">
            <i data-lucide="file-plus" style="width: 28px; height: 28px; color: #2563eb;"></i>
          </div>
          <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 18px; font-weight: 700; color: #1e293b; margin: 0 0 8px 0;">Create New Report</h3>
          <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: #64748b; margin: 0; line-height: 1.5;">Define a report name, choose custom sections, and generate a printable PDF.</p>
        </div>
        
        <!-- Card 2: Open Existing Report -->
        <div class="card" onclick="window.showExistingReportsList()" style="padding: 32px; text-align: center; cursor: pointer; border: 1.5px solid #e2e8f0; border-radius: 12px; transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s; background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); display: flex; flex-direction: column; align-items: center;">
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
  const editorContainer = document.getElementById('repl-editor-container');
  if (!editorContainer) return;
  
  editorContainer.innerHTML = `
    <div class="card" style="margin-top: 40px; padding: 32px; max-width: 540px; margin: 40px auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05);">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: #eff6ff; border-radius: 12px; margin-bottom: 16px;">
          <i data-lucide="file-plus" style="width: 28px; height: 28px; color: #2563eb;"></i>
        </div>
        <h2 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 20px; font-weight: 800; color: #1e293b; margin: 0 0 8px 0;">New Replenishment Report</h2>
        <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: #64748b; margin: 0; line-height: 1.5;">Enter a name for your custom report to start selecting DSR sections and compiling the PDF.</p>
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div class="field" style="display: flex; flex-direction: column; gap: 6px; text-align: left;">
          <label for="new-report-name-input" style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Report Title</label>
          <input type="text" id="new-report-name-input" placeholder="e.g. Monsoon Replenishment Report 2026" style="padding: 10px 14px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; transition: border-color 0.2s;" onkeydown="if(event.key==='Enter') window.submitCustomReportName()">
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-outline" onclick="window.showReplenishmentOptions(document.getElementById('repl-editor-container'))" style="flex:1; height: 42px; border-radius: 8px; cursor: pointer;">Back</button>
          <button class="btn btn-primary" onclick="window.submitCustomReportName()" style="flex:2; display: flex; align-items: center; justify-content: center; height: 42px; gap: 8px; font-weight: 700; font-size: 14px; border-radius: 8px; border: none; cursor: pointer;">
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

function submitCustomReportName() {
  const input = document.getElementById('new-report-name-input');
  if (!input) return;
  const reportName = input.value.trim();
  if (!reportName) {
    toast("Please enter a report name", "error");
    return;
  }
  
  const reports = loadLocalReports();
  const newReport = {
    id: 'rep_' + Date.now(),
    name: reportName,
    createdAt: new Date().toISOString(),
    sections: []
  };
  reports.unshift(newReport);
  saveLocalReports(reports);
  
  const editorContainer = document.getElementById('repl-editor-container');
  if (editorContainer) {
    renderCustomReportGenerator(editorContainer, newReport);
  }
}

function showExistingReportsList() {
  const editorContainer = document.getElementById('repl-editor-container');
  if (!editorContainer) return;
  
  const reports = loadLocalReports();
  
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
            <button class="btn btn-sm btn-primary" onclick="window.openCustomReport('${r.id}')" style="padding: 4px 8px; font-size: 11.5px; height: auto; cursor: pointer;">Open</button>
            <button class="btn btn-sm btn-outline" onclick="window.renameCustomReport('${r.id}')" style="padding: 4px 8px; font-size: 11.5px; height: auto; cursor: pointer;">Rename</button>
            <button class="btn btn-sm btn-saffron" onclick="window.downloadCustomReportPDFDirect('${r.id}')" style="padding: 4px 8px; font-size: 11.5px; height: auto; cursor: pointer;">Download PDF</button>
            <button class="btn btn-sm btn-outline text-danger" onclick="window.deleteCustomReport('${r.id}')" style="padding: 4px 8px; font-size: 11.5px; height: auto; border-color:#f87171 !important; color:#ef4444 !important; cursor: pointer;">Delete</button>
          </td>
        </tr>
      `;
    });
  }
  
  editorContainer.innerHTML = `
    <div class="card" style="margin-top: 20px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <div>
          <h2 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 18px; font-weight: 800; color: #1e293b; margin:0 0 4px 0;">Saved Replenishment Reports</h2>
          <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; color: #64748b; margin:0;">Saved reports for DSR project: ${S.activeProject.projectName || S.activeProject.district}</p>
        </div>
        <button class="btn btn-outline" onclick="window.showReplenishmentOptions(document.getElementById('repl-editor-container'))" style="cursor: pointer;">Back</button>
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

function openCustomReport(reportId) {
  const reports = loadLocalReports();
  const report = reports.find(r => r.id === reportId);
  if (!report) return;
  
  const editorContainer = document.getElementById('repl-editor-container');
  if (editorContainer) {
    renderCustomReportGenerator(editorContainer, report);
  }
}

function renameCustomReport(reportId) {
  const reports = loadLocalReports();
  const report = reports.find(r => r.id === reportId);
  if (!report) return;
  
  const newName = prompt("Enter new name for the report:", report.name);
  if (!newName || newName.trim() === '') return;
  
  report.name = newName.trim();
  saveLocalReports(reports);
  toast("Report renamed successfully!", "success");
  showExistingReportsList();
}

function deleteCustomReport(reportId) {
  if (!confirm("Are you sure you want to delete this report?")) return;
  
  let reports = loadLocalReports();
  reports = reports.filter(r => r.id !== reportId);
  saveLocalReports(reports);
  toast("Report deleted successfully!", "success");
  showExistingReportsList();
}

function downloadCustomReportPDFDirect(reportId) {
  const reports = loadLocalReports();
  const report = reports.find(r => r.id === reportId);
  if (!report) return;
  
  const checkedIds = report.sections || [];
  if (checkedIds.length === 0) {
    toast("No sections selected in this report to download.", "error");
    return;
  }
  
  generateReplenishmentPDF(report.name, checkedIds);
}

function saveReportSelection(reportId) {
  const reports = loadLocalReports();
  const report = reports.find(r => r.id === reportId);
  if (!report) return;
  
  const checkboxes = document.querySelectorAll('input[id^="chk-"]:checked, input[id^="chk-"][data-parent]:checked');
  report.sections = Array.from(checkboxes).map(c => c.value);
  
  saveLocalReports(reports);
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
  window.updateCustomReportPreview(reportName, reportId);
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
  window.updateCustomReportPreview(reportName, reportId);
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
        { id: 'fm-cover', name: 'Cover Page' },
        { id: 'fm-toc', name: 'Content Page' },
        { id: 'fm-pref', name: 'Preface' },
        { id: 'fm-ack', name: 'Acknowledgement' },
        { id: 'fm-cert', name: 'Certificate of Compliance' }
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
    { id: 'graphs', name: 'Cross Section Graphs (Distance/Elevation table)', type: 'DSR' },
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

  let checklistHtml = '';
  sections.forEach(s => {
    const escapedReportName = reportName.replace(/'/g, "\\'");
    if (s.hasSubsections) {
      let subHtml = '';
      s.subsections.forEach(sub => {
        subHtml += `
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <input type="checkbox" id="chk-${sub.id}" value="${sub.id}" data-parent="${s.id}" onchange="window.onSubCheckboxChange('${s.id}', '${escapedReportName}', '${report.id}')" style="width:14px; height:14px; cursor:pointer;">
            <label for="chk-${sub.id}" style="font-size:12px; cursor:pointer; color:#475569; margin:0;">
              ${sub.name}
            </label>
          </div>
        `;
      });

      checklistHtml += `
        <div style="margin-bottom:12px; padding:8px; background:#f8fafc; border-radius:6px; border:1px solid #e2e8f0;">
          <div style="display:flex; align-items:center; gap:10px;">
            <input type="checkbox" id="chk-${s.id}" value="${s.id}" onchange="window.onParentCheckboxChange('${s.id}', '${escapedReportName}', '${report.id}')" style="width:16px; height:16px; cursor:pointer;">
            <label for="chk-${s.id}" style="font-size:13px; font-weight:700; cursor:pointer; color:#1e293b; display:flex; align-items:center; gap:6px; margin:0; width:100%;">
              <span style="font-size:9px; padding:2px 6px; background:#cbd5e1; border-radius:10px; text-transform:uppercase; color:#475569; font-weight:700;">${s.type}</span>
              <span>${s.name}</span>
            </label>
          </div>
          <div id="sub-container-${s.id}" style="padding-left:26px; margin-top:8px; display:flex; flex-direction:column; gap:4px; border-left: 2px dashed #cbd5e1; margin-left: 7px;">
            ${subHtml}
          </div>
        </div>
      `;
    } else {
      checklistHtml += `
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px; padding:8px; background:#f8fafc; border-radius:6px; border:1px solid #e2e8f0;">
          <input type="checkbox" id="chk-${s.id}" value="${s.id}" onchange="window.updateCustomReportPreview('${escapedReportName}', '${report.id}')" style="width:16px; height:16px; cursor:pointer;">
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
            <div class="card-sub" style="font-size:12px; color:#64748b;">Select DSR sections & annexures to compile into a Replenishment Studies report</div>
          </div>
          <div style="display:flex; gap:10px;">
            <button class="btn btn-outline" onclick="window.showExistingReportsList()" style="cursor: pointer;">Back</button>
            <button class="btn btn-primary" onclick="window.downloadCustomReportPDF('${escapedReportName}', '${report.id}')" style="cursor: pointer;">Download PDF</button>
          </div>
        </div>
      </div>
      <div class="card-bd" style="flex:1; display:grid; grid-template-columns: 1fr 1.2fr; gap:20px; overflow:hidden; padding:20px;">
        <!-- LEFT COLUMN: Checklist -->
        <div style="overflow-y:auto; padding-right:10px; border-right:1px solid #e2e8f0; max-height:100%;">
          <h3 style="margin-top:0; color:#0f172a; margin-bottom:15px; font-size:14px; font-weight:700;">Select Sections:</h3>
          ${checklistHtml}
        </div>
        
        <!-- RIGHT COLUMN: Preview -->
        <div style="display:flex; flex-direction:column; overflow:hidden; height:100%; background:#f1f5f9; border-radius:8px; border:1px solid #cbd5e1; position:relative;">
          <div style="padding:10px 15px; background:#e2e8f0; border-bottom:1px solid #cbd5e1; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:700; font-size:12px; color:#334155;">Replenishment Studies Preview</span>
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
}

// Debouncer for rendering preview to fix lagging/freezing
let previewTimeout = null;
function updateCustomReportPreview(reportName, reportId) {
  if (previewTimeout) {
    clearTimeout(previewTimeout);
  }
  previewTimeout = setTimeout(() => {
    realUpdateCustomReportPreview(reportName, reportId);
  }, 200);
}

function realUpdateCustomReportPreview(reportName, reportId) {
  const checkboxes = document.querySelectorAll('input[id^="chk-"]:checked');
  const checkedIds = Array.from(checkboxes).map(c => c.value);
  
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
    iframe.srcdoc = `<html><body style='font-family:sans-serif; color:#64748b; padding:40px; text-align:center;'><p>No sections selected yet. Please select sections on the left to see the live preview.</p></body></html>`;
    return;
  }
  
  if (reportId) {
    saveReportSelection(reportId);
  }
  
  const selectedHtml = compileSelectedSectionsHtml(reportName, checkedIds, allActiveIds);
  iframe.srcdoc = selectedHtml;
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

function compileSelectedSectionsHtml(reportName, checkedIds, allActiveIds) {
  const district = (window.S && S.frontMatter && S.frontMatter.district) || 'Jalandhar';
  const year = (window.S && S.frontMatter && S.frontMatter.year) || '2025-26';
  const title = document.getElementById('fm-title')?.value || (S.frontMatter && S.frontMatter.title) || 'District Survey Report for Sand Mining';
  const state = document.getElementById('fm-state')?.value || (S.frontMatter && S.frontMatter.state) || 'Punjab';
  const version = document.getElementById('fm-version')?.value || (S.frontMatter && S.frontMatter.version) || 'Final Draft';
  const preparedBy = document.getElementById('fm-prepared-by')?.value || (S.frontMatter && S.frontMatter.preparedBy) || 'Sub-Divisional Committee, Jalandhar District';
  const assistedBy = document.getElementById('fm-assisted-by')?.value || (S.frontMatter && S.frontMatter.assistedBy) || 'IIT Ropar';
  const preface = document.getElementById('fm-preface')?.value || (S.frontMatter && S.frontMatter.preface) || '';
  const ack = document.getElementById('fm-acknowledgement')?.value || (S.frontMatter && S.frontMatter.acknowledgement) || '';

  // Order checked sections according to sidebar structure
  const orderedIds = [];
  
  // 1. Front Matter subsections
  const fmSubsections = ['fm-cover', 'fm-toc', 'fm-pref', 'fm-ack', 'fm-cert'];
  const activeFmSubs = fmSubsections.filter(id => checkedIds.includes(id));
  if (activeFmSubs.length > 0) {
    orderedIds.push({ id: 'front-matter', subIds: activeFmSubs });
  }
  
  // 2. Chapters
  const checkedChapters = (S.chapters || []).filter(ch => checkedIds.includes(`chapter-${ch.id}`));
  if (checkedChapters.length > 0) {
    orderedIds.push({ id: 'chapters', subIds: checkedChapters.map(ch => `chapter-${ch.id}`) });
  }
  
  // 3. Plates
  const checkedPlates = (S.plates || []).filter(pl => checkedIds.includes(`plate-${pl.id}`));
  if (checkedPlates.length > 0) {
    orderedIds.push({ id: 'plates', subIds: checkedPlates.map(pl => `plate-${pl.id}`) });
  }
  
  // 4. Graphs
  if (checkedIds.includes('graphs')) {
    orderedIds.push({ id: 'graphs' });
  }
  
  // 5. Annexures
  const annexureIds = ['anx1', 'anx2', 'anx3', 'anx4', 'anx5', 'anx6', 'anx7', 'annexure-b', 'annexure-c', 'annexure-d', 'annexure-e', 'annexure-f', 'annexure-g', 'annexure-h', 'annexure-i', 'annexure-j', 'annexure-k'];
  annexureIds.forEach(anxId => {
    if (checkedIds.includes(anxId)) {
      orderedIds.push({ id: anxId });
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
          subHtml = `
            <div style="margin-bottom: 40px; page-break-after:always;">
              <h2 class="section-title">Acknowledgement</h2>
              <p style="font-size:13.5px; line-height:1.7; white-space:pre-wrap; color:#334155;">${ack || 'No acknowledgement text available.'}</p>
            </div>
          `;
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
          } else {
            subHtml = `
              <div style="margin-bottom: 40px; page-break-after:always;">
                <h2 class="section-title">Table of Contents</h2>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 20px;">
                  <thead>
                    <tr style="border-bottom: 2px solid #17324d; background: #f8fafc;">
                      <th style="padding: 10px; text-align: left;">S.No.</th>
                      <th style="padding: 10px; text-align: left;">Section Description</th>
                      <th style="padding: 10px; text-align: right;">Page Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px;">1</td><td style="padding: 8px 10px; font-weight: bold;">Front Matter</td><td style="padding: 8px 10px; text-align: right;">i-v</td></tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px;">2</td><td style="padding: 8px 10px; font-weight: bold;">Report Chapters Outline</td><td style="padding: 8px 10px; text-align: right;">1-45</td></tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px;">3</td><td style="padding: 8px 10px; font-weight: bold;">Plate Section</td><td style="padding: 8px 10px; text-align: right;">46-55</td></tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px;">4</td><td style="padding: 8px 10px; font-weight: bold;">Cross Section Elevation Graphs</td><td style="padding: 8px 10px; text-align: right;">56-62</td></tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px;">5</td><td style="padding: 8px 10px; font-weight: bold;">Annexures (I to VII & B to K)</td><td style="padding: 8px 10px; text-align: right;">63-120</td></tr>
                  </tbody>
                </table>
              </div>
            `;
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
        
        combinedContent += subHtml;
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
    else if (item.id === 'graphs') {
      const graphsRows = (S.graphs || []).map(g => `
        <tr>
          <td><strong>${g.name}</strong></td>
          <td>${g.dist}</td>
          <td>${g.post}</td>
          <td>${g.red}</td>
          <td>${g.thal}</td>
          <td>${g.area}</td>
          <td>${g.bulk}</td>
        </tr>
      `).join('');
      
      sectionHtml = `
        <div class="section-block">
          <h2 class="section-title">Cross Section Elevation Data</h2>
          <table>
            <thead>
              <tr>
                <th>Section Name</th>
                <th>Distance (m)</th>
                <th>Elevation (Post-Monsoon)</th>
                <th>Reduced Level</th>
                <th>Thalweg Level</th>
                <th>Cross Section Area</th>
                <th>Bulk Density</th>
              </tr>
            </thead>
            <tbody>
              ${graphsRows || '<tr><td colspan="7" style="text-align:center;">No elevation graph data available.</td></tr>'}
            </tbody>
          </table>
        </div>
      `;
      combinedContent += sectionHtml;
    }
    else {
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
        
        const title = window.pdfPreview.SECTION_TITLES[item.id] || item.id.toUpperCase();
        
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
            <p>Replenishment Studies Compiled Report - District Survey Report - ${escapeHtml(district)} | ${escapeHtml(year)}</p>
          </header>
          ${combinedContent}
        </main>
      </body>
    </html>`;
}

function downloadCustomReportPDF(reportName, reportId) {
  const reports = loadLocalReports();
  const report = reports.find(r => r.id === reportId);
  const checkedIds = report ? (report.sections || []) : [];
  
  if (checkedIds.length === 0) {
    const checkboxes = document.querySelectorAll('input[id^="chk-"]:checked');
    checkedIds.push(...Array.from(checkboxes).map(c => c.value));
  }
  
  generateReplenishmentPDF(reportName, checkedIds);
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

async function generateReplenishmentPDF(reportName, checkedIds) {
  if (!checkedIds || checkedIds.length === 0) {
    toast("No sections selected to download.", "error");
    return;
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
    showPdfProgressToast('Loading PDF compiler tools...');
    try {
      await ensurePortalVendors(['html2pdf', 'pdfjs']);
      hidePdfProgressToast();
    } catch (err) {
      hidePdfProgressToast();
      toast('Failed to load PDF library vendors.', 'error');
      return;
    }
  }

  showPdfProgressToast('Assembling selected sections...');
  
  // 2. Compile full HTML string
  const fullHtml = compileSelectedSectionsHtml(reportName, checkedIds, allActiveIds);
  
  // 3. Parse and split HTML into page items (HTML blocks or Images)
  const itemsToRender = [];
  const parser = new DOMParser();
  const docObj = parser.parseFromString(fullHtml, 'text/html');
  const sectionBlocks = docObj.querySelectorAll('.section-block');
  
  if (sectionBlocks.length === 0) {
    itemsToRender.push({ type: 'html', html: fullHtml });
  } else {
    sectionBlocks.forEach(block => {
      const titleEl = block.querySelector('.section-title');
      const titleText = titleEl ? titleEl.textContent : 'Section';
      if (titleEl) titleEl.remove();
      
      let currentHtmlGroup = [];
      
      function flushHtmlGroup() {
        if (currentHtmlGroup.length > 0) {
          const htmlBlock = `
            <div class="sheet">
              <div class="section-block">
                <h2 class="section-title">${titleText}</h2>
                ${currentHtmlGroup.join('\n')}
              </div>
            </div>
          `;
          itemsToRender.push({ type: 'html', html: htmlBlock });
          currentHtmlGroup = [];
        }
      }
      
      Array.from(block.childNodes).forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName === 'IMG') {
            flushHtmlGroup();
            itemsToRender.push({ type: 'image', src: node.getAttribute('src') });
          } else if (node.classList.contains('annexure-uploaded-pages-simple') || (node.style.display === 'flex' && node.innerHTML.includes('<img'))) {
            flushHtmlGroup();
            const imgs = node.querySelectorAll('img');
            imgs.forEach(img => {
              itemsToRender.push({ type: 'image', src: img.getAttribute('src') });
            });
          } else {
            currentHtmlGroup.push(node.outerHTML);
          }
        } else if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent.trim();
          if (text) {
            currentHtmlGroup.push(`<p>${text}</p>`);
          }
        }
      });
      
      flushHtmlGroup();
    });
  }
  
  if (itemsToRender.length === 0) {
    toast("No printable content found.", "error");
    return;
  }
  
  // 4. Initialize jsPDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pdfWidth = 210;
  const pdfHeight = 297;
  
  // Create off-screen rendering element
  const renderDiv = document.createElement('div');
  renderDiv.style.position = 'fixed';
  renderDiv.style.left = '-9999px';
  renderDiv.style.top = '0';
  renderDiv.style.width = '794px'; // 210mm A4 width at 96 DPI
  renderDiv.style.minHeight = '1122px'; // 297mm A4 height at 96 DPI
  renderDiv.style.backgroundColor = '#ffffff';
  renderDiv.style.padding = '45px 50px';
  renderDiv.style.boxSizing = 'border-box';
  renderDiv.style.zIndex = '-99999';
  document.body.appendChild(renderDiv);
  
  const styles = `
    <style>
      * { box-sizing: border-box; }
      body { font-family: Arial, Helvetica, sans-serif; color: #111827; background: #ffffff; padding: 0; margin: 0; }
      .sheet { width: 100%; }
      .section-title {
        color: #17324d;
        border-bottom: 2px solid #17324d;
        padding-bottom: 8px;
        margin-bottom: 20px;
        font-size: 18px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      table { width: 100%; border-collapse: collapse; margin: 10px 0 18px; font-size: 11px; }
      th, td { border: 1px solid #111827; padding: 6px 7px; vertical-align: top; word-break: break-word; }
      th { background: #f3f4f6; font-weight: 700; text-align: left; }
      p { font-size: 13px; line-height: 1.55; color: #374151; margin-top: 0; margin-bottom: 12px; }
      .cover-page {
        text-align: center;
        padding: 40px 0;
        border: 3px double #17324d;
        background: #fff;
        min-height: 1000px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        box-sizing: border-box;
      }
      .field-value { display: inline-block; min-width: 80px; padding: 4px 6px; border-bottom: 1px solid #cbd5e1; }
      input, textarea, select { border: none !important; background: transparent !important; color: #111827 !important; padding: 0 !important; font-size: 13px !important; }
      .btn, button, .upload-zone, .card-hd, .modal, .file-item, .alert-box, .hint { display: none !important; }
    </style>
  `;

  // 5. Render loop
  try {
    for (let i = 0; i < itemsToRender.length; i++) {
      const item = itemsToRender[i];
      
      if (i > 0) {
        doc.addPage();
      }
      
      showPdfProgressToast(`Generating page ${i + 1} of ${itemsToRender.length}...`);
      
      if (item.type === 'image') {
        try {
          doc.addImage(item.src, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        } catch (e) {
          try {
            doc.addImage(item.src, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
          } catch (err) {
            console.error(`Error adding image to PDF at page ${i + 1}:`, err);
            doc.setFontSize(14);
            doc.text(`[Page ${i + 1}: Image could not be loaded]`, pdfWidth / 2, pdfHeight / 2, { align: 'center' });
          }
        }
      } else {
        renderDiv.innerHTML = styles + item.html;
        
        try {
          const canvas = await html2canvas(renderDiv, {
            scale: 2, // High resolution scale
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          });
          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        } catch (err) {
          console.error(`Error rendering HTML to canvas at page ${i + 1}:`, err);
          doc.setFontSize(14);
          doc.text(`[Page ${i + 1}: Render error]`, pdfWidth / 2, pdfHeight / 2, { align: 'center' });
        }
      }
      
      // Yield to main thread to keep UI smooth and prevent lagging/loafing
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    
    const filename = `${reportName.replace(/\s+/g, '_')}_Replenishment_Report.pdf`;
    doc.save(filename);
    hidePdfProgressToast();
    toast('Replenishment Report PDF downloaded successfully!', 'success');
  } catch (err) {
    console.error('Unified report generation crashed:', err);
    hidePdfProgressToast();
    toast('PDF compilation failed.', 'error');
  } finally {
    if (document.body.contains(renderDiv)) {
      document.body.removeChild(renderDiv);
    }
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
