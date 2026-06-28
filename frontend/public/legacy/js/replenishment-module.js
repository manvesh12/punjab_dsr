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
    
    apiFetch('/api/projects')
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
    const studies = await apiFetch(`/api/projects/${S.activeProject.id}/replenishment`);
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
    const res = await apiFetch(`/api/projects/${S.activeProject.id}/replenishment`, {
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
      currentReplenishmentStudies = await apiFetch(`/api/projects/${S.activeProject.id}/replenishment`);
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
    
    await apiFetch(`/api/replenishment/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    
    toast("Replenishment Study Saved Successfully!", "success");
    
    // Refresh list in background
    const studies = await apiFetch(`/api/projects/${S.activeProject.id}/replenishment`);
    currentReplenishmentStudies = studies;
  } catch (err) {
    toast("Save failed: " + err.message, "error");
  }
}

async function deleteReplenishmentStudy(id) {
  if (!confirm("Are you sure you want to delete this Replenishment Study?")) return;
  try {
    await apiFetch(`/api/replenishment/${id}`, { method: 'DELETE' });
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
