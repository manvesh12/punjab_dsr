// Replenishment Study Module
// Handles the UI, fetching, and syncing for Replenishment Studies

let currentReplenishmentStudies = [];

function initReplenishmentView() {
  const container = document.getElementById('view-replenishment');
  if (!container) return;

  // currentProject is a global variable from portal.bundle.js
  if (!window.currentProject || !window.currentProject.id) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No Project Selected</h3>
        <p>Please select a DSR project to view its Replenishment Studies.</p>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="header-row">
      <div>
        <div class="page-title">Replenishment Studies</div>
        <div class="page-sub">Manage Replenishment Studies for ${window.currentProject.projectName || 'this project'}. 
        The DSR acts as the single source of truth.</div>
      </div>
      <div>
        <button class="btn btn-primary" onclick="createReplenishmentStudy()">+ New Replenishment Study</button>
      </div>
    </div>
    
    <div class="panel" style="margin-top: 20px;">
      <div class="panel-hd">Existing Studies</div>
      <div class="panel-bd" id="replenishment-list">
        <div style="padding:20px; text-align:center; color:var(--text-light);">Loading...</div>
      </div>
    </div>
  `;

  fetchReplenishmentStudies();
}

async function fetchReplenishmentStudies() {
  const list = document.getElementById('replenishment-list');
  if (!list || !window.currentProject) return;

  try {
    const studies = await apiFetch(`/api/projects/${window.currentProject.id}/replenishment`);
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
  if (!window.currentProject) return;
  try {
    const title = prompt("Enter Title for Replenishment Study:");
    if (!title) return;
    
    // Automatically hits the backend to extract DSR Base data
    const res = await apiFetch(`/api/projects/${window.currentProject.id}/replenishment`, {
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
  const container = document.getElementById('view-replenishment');
  // Re-fetch studies if not loaded
  if (currentReplenishmentStudies.length === 0 && window.currentProject) {
      currentReplenishmentStudies = await apiFetch(`/api/projects/${window.currentProject.id}/replenishment`);
  }

  const study = currentReplenishmentStudies.find(s => s.id === id);
  if (!study) return;

  const dsrData = study.reportState || {};
  const surveyData = study.surveyData || {};

  // Form matching Government structure
  container.innerHTML = `
    <div class="header-row">
      <div>
        <div class="page-title">${study.title}</div>
        <div class="page-sub">Editor - Single Source of Truth Synchronization Active</div>
      </div>
      <div>
        <button class="btn btn-outline" onclick="initReplenishmentView()">Back</button>
        <button class="btn btn-primary" onclick="saveReplenishmentStudy('${id}')">Save Changes</button>
      </div>
    </div>
    
    <div class="layout-grid" style="grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
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
    const studies = await apiFetch(`/api/projects/${window.currentProject.id}/replenishment`);
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
