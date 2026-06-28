// Replenishment Study Module
// Handles the UI, fetching, and syncing for Replenishment Studies

let currentReplenishmentStudies = [];

function initReplenishmentView() {
  const container = document.getElementById('view-replenishment');
  if (!container) return;
  
  const selectContainer = document.getElementById('repl-project-select-container');
  const contentContainer = document.getElementById('repl-content-container');
  const editorContainer = document.getElementById('repl-editor-container');
  const headerBtn = container.querySelector('.header-row button');
  const subTitle = container.querySelector('.page-sub');
  
  if (editorContainer) editorContainer.style.display = 'none';

  if (!S.activeProject || !S.activeProject.id) {
    if (selectContainer) selectContainer.style.display = 'block';
    if (contentContainer) contentContainer.style.display = 'none';
    if (headerBtn) headerBtn.style.display = 'none';
    if (subTitle) subTitle.textContent = 'Please select a project to manage its Replenishment Studies.';
    
    apiFetch('/projects')
      .then(projects => {
        const sel = document.getElementById('repl-project-selector');
        if (!sel) return;
        if (!projects || projects.length === 0) {
           sel.innerHTML = '<option value="">No projects available</option>';
           return;
        }
        window._replenishmentProjectsCache = projects;
        let html = '<option value="">-- Select Project --</option>';
        projects.forEach(p => {
          html += `<option value="${p.id}">${p.projectName || p.district + ' (' + p.year + ')'}</option>`;
        });
        sel.innerHTML = html;
      })
      .catch(err => {
         const sel = document.getElementById('repl-project-selector');
         if (sel) sel.innerHTML = '<option value="">Failed to load projects</option>';
      });
  } else {
    if (selectContainer) selectContainer.style.display = 'none';
    if (contentContainer) contentContainer.style.display = 'block';
    if (headerBtn) headerBtn.style.display = 'inline-flex';
    if (subTitle) subTitle.textContent = `Manage Replenishment Studies for ${S.activeProject.projectName || S.activeProject.district || 'this project'}. The DSR acts as the single source of truth.`;
    
    fetchReplenishmentStudies();
  }
}

async function fetchReplenishmentStudies() {
  const list = document.getElementById('replenishment-list');
  if (!list || !S.activeProject) return;

  try {
    const studies = await apiFetch(`/projects/${S.activeProject.id}/replenishment`);
    currentReplenishmentStudies = studies;
    
    if (studies.length === 0) {
      list.innerHTML = `<div style="padding:20px; text-align:center; color:var(--text-light);">No Replenishment Studies found for this project.</div>`;
      return;
    }

    let html = `<table class="table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Status</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>`;
      
    studies.forEach(study => {
      html += `
        <tr>
          <td><strong>${study.title}</strong></td>
          <td><span class="badge ${study.status.toLowerCase()}">${study.status}</span></td>
          <td>${new Date(study.createdAt).toLocaleDateString()}</td>
          <td>
            <button class="btn btn-sm btn-outline" onclick="openReplenishmentStudy('${study.id}')">Open Editor</button>
            <button class="btn btn-sm btn-outline text-danger" onclick="deleteReplenishmentStudy('${study.id}')">Delete</button>
          </td>
        </tr>`;
    });
    
    html += `</tbody></table>`;
    list.innerHTML = html;
  } catch (err) {
    list.innerHTML = `<div style="padding:20px; color:red;">Failed to load studies: ${err.message}</div>`;
  }
}

async function createReplenishmentStudy() {
  if (!S.activeProject) return;
  try {
    const title = prompt("Enter Title for Replenishment Study:");
    if (!title) return;
    
    // Automatically hits the backend to extract DSR Base data
    const res = await apiFetch(`/projects/${S.activeProject.id}/replenishment`, {
      method: 'POST',
      body: JSON.stringify({ title })
    });
    
    toast("Replenishment Study created and synchronized with DSR!", "success");
    fetchReplenishmentStudies();
    openReplenishmentStudy(res.id);
  } catch (err) {
    toast("Error creating study: " + err.message, "error");
  }
}

async function openReplenishmentStudy(id) {
  const selectContainer = document.getElementById('repl-project-select-container');
  const contentContainer = document.getElementById('repl-content-container');
  const editorContainer = document.getElementById('repl-editor-container');
  
  if (selectContainer) selectContainer.style.display = 'none';
  if (contentContainer) contentContainer.style.display = 'none';
  if (editorContainer) editorContainer.style.display = 'block';

  // Re-fetch studies if not loaded
  if (currentReplenishmentStudies.length === 0 && S.activeProject) {
      currentReplenishmentStudies = await apiFetch(`/projects/${S.activeProject.id}/replenishment`);
  }

  const study = currentReplenishmentStudies.find(s => s.id === id);
  if (!study) return;

  const dsrData = study.reportState || {};
  const surveyData = study.surveyData || {};

  // Form matching Government structure
  editorContainer.innerHTML = `
    <div class="card">
      <div class="card-hd">
        <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
          <div>
            <div class="card-title">Editor: ${study.title}</div>
            <div class="card-sub">Single Source of Truth Synchronization Active</div>
          </div>
          <div style="display:flex; gap:10px;">
            <button class="btn btn-outline" onclick="initReplenishmentView()">Back</button>
            <button class="btn btn-primary" onclick="saveReplenishmentStudy('${id}')">Save Changes</button>
          </div>
        </div>
      </div>
      <div class="card-bd">
        <div class="layout-grid" style="grid-template-columns: 1fr 1fr; gap: 20px;">
          <!-- LEFT: Synced DSR Data (Read-only reference) -->
          <div class="panel">
            <div class="panel-hd" style="display:flex; justify-content:space-between;">
              <span>Synced DSR Data</span>
              <span class="badge" style="background:#e6f4ea; color:#137333; padding:2px 8px; border-radius:12px; font-size:11px;">In Sync</span>
            </div>
            <div class="panel-bd" style="max-height:600px; overflow-y:auto; background:#f9f9fa;">
              <p class="text-light" style="font-size:12px; margin-bottom:15px;">
                This data is automatically inherited from the parent DSR. To change this, modify the DSR project directly.
              </p>
              <div class="field-row">
                <div class="field"><label>District</label><input disabled value="${dsrData.district || 'Data to be updated after survey.'}"></div>
                <div class="field"><label>Year</label><input disabled value="${dsrData.year || 'Data to be updated after survey.'}"></div>
              </div>
              <div class="field"><label>Rivers</label><input disabled value="${dsrData.rivers || 'Pending Field Verification'}"></div>
              
              <div style="margin-top:20px; font-weight:600; font-size:13px; margin-bottom:4px;">Geomorphology & Drainage</div>
              <textarea disabled style="min-height:80px; width:100%; border:1px solid #ddd; background:#eee; padding:8px; border-radius:4px;">${dsrData.drainage?.description || 'Data to be updated after survey.'}</textarea>
              
              <div style="margin-top:20px; font-weight:600; font-size:13px; margin-bottom:4px;">Rainfall Climate</div>
              <textarea disabled style="min-height:80px; width:100%; border:1px solid #ddd; background:#eee; padding:8px; border-radius:4px;">${dsrData.rainfall?.climateDetails || 'Data to be updated after survey.'}</textarea>
            </div>
          </div>
          
          <!-- RIGHT: New Survey Data Input -->
          <div class="panel">
            <div class="panel-hd">Survey Data (Unique to Replenishment)</div>
            <div class="panel-bd" style="max-height:600px; overflow-y:auto;" id="form-repl-survey">
              <p class="text-light" style="font-size:12px; margin-bottom:15px;">
                Input fresh survey data here. The AI will merge this with the synced DSR data to generate the final Government report.
              </p>
              
              <div class="field">
                <label>DGPS Survey File Link (S3 or URL)</label>
                <input type="text" id="repl-dgps" value="${surveyData.dgpsLink || ''}" placeholder="https://s3...">
              </div>
              
              <div class="field">
                <label>Drone Survey & DEM Highlights</label>
                <textarea id="repl-drone" style="min-height:100px;">${surveyData.droneSurvey || ''}</textarea>
              </div>
              
              <div class="field">
                <label>Current Year Rainfall Updates (mm)</label>
                <input type="number" id="repl-rainfall-update" value="${surveyData.rainfallUpdate || ''}">
              </div>
              
              <div class="field">
                <label>Survey Observations & Remarks</label>
                <textarea id="repl-remarks" style="min-height:100px;">${surveyData.remarks || ''}</textarea>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function saveReplenishmentStudy(id) {
  try {
    const payload = {
      surveyData: {
        dgpsLink: document.getElementById('repl-dgps').value,
        droneSurvey: document.getElementById('repl-drone').value,
        rainfallUpdate: document.getElementById('repl-rainfall-update').value,
        remarks: document.getElementById('repl-remarks').value
      }
    };
    
    await apiFetch(`/replenishment/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    
    toast("Replenishment Study Saved Successfully!", "success");
    
    // Refresh list in background
    const studies = await apiFetch(`/projects/${S.activeProject.id}/replenishment`);
    currentReplenishmentStudies = studies;
  } catch (err) {
    toast("Save failed: " + err.message, "error");
  }
}

async function deleteReplenishmentStudy(id) {
  if (!confirm("Are you sure you want to delete this Replenishment Study?")) return;
  try {
    await apiFetch(`/replenishment/${id}`, { method: 'DELETE' });
    toast("Deleted successfully", "success");
    fetchReplenishmentStudies();
  } catch (err) {
    toast("Delete failed: " + err.message, "error");
  }
}

// Hook into existing navigation system
const originalShowViewReplenishmentHook = window.showView;
window.showView = function(viewId, caller) {
  if (originalShowViewReplenishmentHook) originalShowViewReplenishmentHook(viewId, caller);
  if (viewId === 'replenishment') {
    initReplenishmentView();
  }
};
window.selectReplenishmentProject = function(projectId) {
  if (!projectId) return;
  const proj = (window._replenishmentProjectsCache || []).find(p => p.id === projectId);
  if (proj) {
    S.activeProject = proj;
    // Show the DSR Sections nav in sidebar if it's hidden
    const reportNav = document.getElementById('report-nav');
    if (reportNav) reportNav.style.display = 'block';
    
    // Also show annexure nav
    const annexureNav = document.getElementById('annexure-nav');
    if (annexureNav) annexureNav.style.display = 'block';

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

// Expose functions to window
window.createCustomReplenishmentReport = createCustomReplenishmentReport;
window.updateCustomReportPreview = updateCustomReportPreview;
window.downloadCustomReportPDF = downloadCustomReportPDF;

function createCustomReplenishmentReport() {
  if (!S.activeProject) {
    toast("Please select a project first", "info");
    return;
  }
  const reportName = prompt("Enter Custom Replenishment Report Name:");
  if (!reportName) return;
  
  const selectContainer = document.getElementById('repl-project-select-container');
  const contentContainer = document.getElementById('repl-content-container');
  const editorContainer = document.getElementById('repl-editor-container');
  
  if (selectContainer) selectContainer.style.display = 'none';
  if (contentContainer) contentContainer.style.display = 'none';
  if (editorContainer) {
    editorContainer.style.display = 'block';
    renderCustomReportGenerator(editorContainer, reportName);
  }
}

function renderCustomReportGenerator(container, reportName) {
  const sections = [
    { id: 'front-matter', name: 'Front Matter (Title, Preface, Acknowledgement)', type: 'DSR' },
    { id: 'chapters', name: 'Chapters Outline (Summary of 10 chapters)', type: 'DSR' },
    { id: 'plates', name: 'Plate Section (List of report plates)', type: 'DSR' },
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
    checklistHtml += `
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px; padding:6px; background:#f8fafc; border-radius:6px; border:1px solid #e2e8f0;">
        <input type="checkbox" id="chk-${s.id}" value="${s.id}" onchange="window.updateCustomReportPreview('${escapedReportName}')" style="width:16px; height:16px; cursor:pointer;">
        <label for="chk-${s.id}" style="font-size:13px; font-weight:600; cursor:pointer; color:#1e293b; display:flex; align-items:center; gap:6px; margin:0; width:100%;">
          <span style="font-size:9px; padding:2px 6px; background:#e2e8f0; border-radius:10px; text-transform:uppercase; color:#475569; font-weight:700; white-space:nowrap;">${s.type}</span>
          <span>${s.name}</span>
        </label>
      </div>
    `;
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
            <button class="btn btn-outline" onclick="initReplenishmentView()">Back</button>
            <button class="btn btn-primary" onclick="window.downloadCustomReportPDF('${escapedReportName}')">📥 Download PDF</button>
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
}

function updateCustomReportPreview(reportName) {
  const checkboxes = document.querySelectorAll('input[id^="chk-"]:checked');
  const countEl = document.getElementById('preview-sections-count');
  if (countEl) countEl.textContent = `${checkboxes.length} selected`;
  
  const iframe = document.getElementById('custom-report-preview-iframe');
  if (!iframe) return;
  
  if (checkboxes.length === 0) {
    iframe.srcdoc = `<html><body style='font-family:sans-serif; color:#64748b; padding:40px; text-align:center;'><p>No sections selected yet. Please select sections on the left to see the live preview.</p></body></html>`;
    return;
  }
  
  const selectedHtml = compileSelectedSectionsHtml(reportName, Array.from(checkboxes).map(c => c.value));
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

function compileSelectedSectionsHtml(reportName, sectionIds) {
  const district = (window.S && S.frontMatter && S.frontMatter.district) || 'Jalandhar';
  const year = (window.S && S.frontMatter && S.frontMatter.year) || '2025-26';
  
  let combinedContent = '';
  
  sectionIds.forEach(id => {
    let sectionHtml = '';
    
    if (id === 'front-matter') {
      const title = document.getElementById('fm-title')?.value || 'District Survey Report for Sand Mining';
      const state = document.getElementById('fm-state')?.value || 'Punjab';
      const version = document.getElementById('fm-version')?.value || 'Final Draft';
      const preparedBy = document.getElementById('fm-prepared-by')?.value || 'Sub-Divisional Committee';
      const assistedBy = document.getElementById('fm-assisted-by')?.value || 'IIT Ropar';
      const preface = document.getElementById('fm-preface')?.value || '';
      const ack = document.getElementById('fm-acknowledgement')?.value || '';
      
      sectionHtml = `
        <div class="section-block">
          <div class="cover-page" style="text-align:center; padding: 40px 0; border-bottom: 2px solid #17324d; margin-bottom: 40px; page-break-after:always;">
            <h1 style="font-size:28px; margin-bottom:10px;">${title}</h1>
            <h2 style="font-size:20px; color:#475569; margin-bottom:40px;">District: ${district} | State: ${state}</h2>
            <div style="margin: 40px 0; font-size:14px; color:#64748b;">
              <p><strong>Year:</strong> ${year}</p>
              <p><strong>Version:</strong> ${version}</p>
            </div>
            <div style="margin-top:60px; font-size:13px; line-height:1.6; text-align:left; background:#f8fafc; padding:20px; border-radius:8px; border:1px solid #e2e8f0;">
              <p><strong>Prepared By:</strong> ${preparedBy}</p>
              <p><strong>Assisted By:</strong> ${assistedBy}</p>
            </div>
          </div>
          
          <div style="margin-bottom: 40px; page-break-after:always;">
            <h2 class="section-title">Preface</h2>
            <p style="font-size:14px; line-height:1.6; white-space:pre-wrap;">${preface || 'No preface text available.'}</p>
          </div>
          
          <div style="margin-bottom: 40px;">
            <h2 class="section-title">Acknowledgement</h2>
            <p style="font-size:14px; line-height:1.6; white-space:pre-wrap;">${ack || 'No acknowledgement text available.'}</p>
          </div>
        </div>
      `;
    } 
    else if (id === 'chapters') {
      const chaptersListHtml = (S.chapters || []).map(ch => `
        <div style="margin-bottom:20px; padding:15px; border:1px solid #e2e8f0; border-radius:8px; background:#f8fafc;">
          <h4 style="margin:0 0 6px; font-size:13.5px; color:#1e293b; font-weight:700;">${ch.name}</h4>
          <p style="margin:0; font-size:12px; color:#475569; line-height:1.5;">${ch.summary || 'Summary not defined.'}</p>
        </div>
      `).join('');
      
      sectionHtml = `
        <div class="section-block">
          <h2 class="section-title">Report Chapters Outline</h2>
          <p style="font-size:12.5px; color:#64748b; margin-bottom:15px;">headings and summaries as per EMGSM 2020 guidelines</p>
          ${chaptersListHtml}
        </div>
      `;
    } 
    else if (id === 'plates') {
      const platesListHtml = (S.plates || []).map(pl => `
        <div style="margin-bottom:15px; padding:12px; border:1px solid #e2e8f0; border-radius:6px; background:#f8fafc;">
          <h4 style="margin:0 0 4px; font-size:13px; color:#1e293b;">${pl.name}</h4>
          <p style="margin:0; font-size:11.5px; color:#475569;">${pl.summary || 'Summary not defined.'}</p>
        </div>
      `).join('');
      
      sectionHtml = `
        <div class="section-block">
          <h2 class="section-title">Report Plates Section</h2>
          ${platesListHtml}
        </div>
      `;
    } 
    else if (id === 'graphs') {
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
    } 
    else {
      const source = document.getElementById(`view-${id}`);
      if (source) {
        const cleanedClone = cloneSourceWithValues(source);
        const clone = window.pdfPreview.cleanupAnnexurePreviewClone(cleanedClone, id);
        
        clone.querySelectorAll('.upload-zone, button, input[type="file"], select, label:has(input[type="file"]), .modal').forEach(el => el.remove());
        
        const bodyHtml = clone.innerHTML.trim() || '<p class="empty">No annexure data entered yet.</p>';
        const title = window.pdfPreview.SECTION_TITLES[id] || id.toUpperCase();
        
        sectionHtml = `
          <div class="section-block">
            <h2 class="section-title">${title}</h2>
            ${bodyHtml}
          </div>
        `;
      } else {
        sectionHtml = `
          <div class="section-block">
            <h2 class="section-title">${id.toUpperCase()}</h2>
            <p class="empty">Section view element not found. Please load the section page in the portal once to initialize it.</p>
          </div>
        `;
      }
    }
    
    combinedContent += sectionHtml;
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
          img{max-width:100%;height:auto;}
          
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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function downloadCustomReportPDF(reportName) {
  const iframe = document.getElementById('custom-report-preview-iframe');
  if (!iframe) return;
  const doc = iframe.contentWindow || iframe.contentDocument;
  const content = doc.document || doc;
  const element = content.body;
  
  if (typeof html2pdf === 'undefined') {
    toast('Preparing PDF compilation tools...', 'info');
    if (typeof ensurePortalVendors === 'function') {
      ensurePortalVendors(['html2pdf', 'pdfjs']).then(() => {
        downloadCustomReportPDF(reportName);
      }).catch(() => {
        toast('PDF tools could not be loaded. Please refresh and try again.', 'error');
      });
    }
    return;
  }
  
  const opt = {
    margin: 10,
    filename: `${reportName.replace(/\s+/g, '_')}_Replenishment_Report.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  
  toast('Generating replenishment report PDF...', 'info');
  html2pdf().set(opt).from(element).save().then(() => {
    toast('Replenishment Report PDF downloaded successfully!', 'success');
  }).catch(err => {
    console.error(err);
    toast('PDF generation failed.', 'error');
  });
}
