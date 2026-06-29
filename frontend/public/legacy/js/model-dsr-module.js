/**
 * Model DSR Module - UI and Logic
 * Handles Model Library, Creation, Preview, and Import.
 */

const MODEL_DSR_API_BASE = '/api/model-dsrs';

// Initialize when the DOM is loaded or when the view is triggered
document.addEventListener('DOMContentLoaded', () => {
  // Override the existing Model DSR view container in login.html
  const container = document.getElementById('view-model-dsr');
  if (container) {
    // Add event listener to the sidebar nav button to render the library when clicked
    const navBtn = document.getElementById('nav-model-dsr');
    if (navBtn) {
      navBtn.addEventListener('click', () => {
        initModelDsrModule(container);
      });
    }
  }
});

function initModelDsrModule(container) {
  // Check role: Only ADMIN or STATE_ADMIN can access
  const user = window.currentUser || JSON.parse(localStorage.getItem('dsr_user') || '{}');
  if (user.role !== 'ADMIN' && user.role !== 'STATE_ADMIN') {
    container.innerHTML = `
      <div class="card" style="margin-top:20px; padding:40px; text-align:center;">
        <i data-lucide="lock" style="width:48px;height:48px;color:#ef4444;margin-bottom:16px;"></i>
        <h2>Access Restricted</h2>
        <p>The Model DSR module is restricted to Administrators only.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }
  
  // Render Model Library by default
  renderModelLibrary(container);
}

// ==========================================
// RENDER: MODEL LIBRARY
// ==========================================
async function renderModelLibrary(container) {
  container.innerHTML = `
    <div class="header-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px;">
      <div>
        <div class="page-title">Model DSR Library</div>
        <div class="page-sub">Manage reusable DSR templates, chapters, and sections.</div>
      </div>
      <div style="display:flex; gap:10px;">
        <button class="btn btn-outline btn-sm" onclick="renderModelLibrary(document.getElementById('view-model-dsr'))">
          <i data-lucide="refresh-cw"></i> Refresh
        </button>
        <button class="btn btn-primary btn-sm" onclick="renderCreateModel(document.getElementById('view-model-dsr'))">
          <i data-lucide="plus"></i> Create Model
        </button>
      </div>
    </div>
    
    <div class="card" style="margin-top: 20px;">
      <div class="card-hd" style="display:flex; justify-content:space-between; align-items:center;">
        <div class="card-title">Saved Models</div>
        <input type="text" id="model-search" placeholder="Search models..." style="padding: 6px 12px; border-radius: 4px; border: 1px solid #ccc;" oninput="filterModels()">
      </div>
      <div class="card-bd" style="padding: 0;">
        <table class="data-table" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background:#f8fafc; border-bottom:2px solid #e2e8f0; text-align:left;">
              <th style="padding:12px 16px;">Model ID / Name</th>
              <th style="padding:12px 16px;">District / Mineral</th>
              <th style="padding:12px 16px;">Version</th>
              <th style="padding:12px 16px;">Status</th>
              <th style="padding:12px 16px;">Date</th>
              <th style="padding:12px 16px; text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody id="model-library-body">
            <tr><td colspan="6" style="text-align:center; padding:20px;">Loading models...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
  if (window.lucide) lucide.createIcons();

  try {
    const models = await apiFetch(MODEL_DSR_API_BASE);
    window.allModelDsrs = models;
    displayModelsList(models);
  } catch (err) {
    document.getElementById('model-library-body').innerHTML = `<tr><td colspan="6" style="color:red; text-align:center; padding:20px;">Error loading models: ${err.message}</td></tr>`;
  }
}

function displayModelsList(models) {
  const tbody = document.getElementById('model-library-body');
  if (!tbody) return;
  
  if (models.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">No models found in the library.</td></tr>';
    return;
  }

  tbody.innerHTML = models.map(m => `
    <tr style="border-bottom:1px solid #e2e8f0;">
      <td style="padding:12px 16px;">
        <div style="font-weight:600; color:#17324D;">${m.title}</div>
        <div style="font-size:12px; color:#64748b;">${m.modelId || 'N/A'}</div>
      </td>
      <td style="padding:12px 16px;">
        <div>${m.district || '-'}</div>
        <div style="font-size:12px; color:#64748b;">${m.mineralType || '-'}</div>
      </td>
      <td style="padding:12px 16px;">v${m.version}</td>
      <td style="padding:12px 16px;">
        <span style="padding:4px 8px; border-radius:12px; font-size:11px; font-weight:700; ${
          m.status === 'PUBLISHED' ? 'background:#dcfce7; color:#166534;' : 'background:#f1f5f9; color:#475569;'
        }">${m.status}</span>
      </td>
      <td style="padding:12px 16px; font-size:13px; color:#64748b;">${new Date(m.createdAt).toLocaleDateString()}</td>
      <td style="padding:12px 16px; text-align:right;">
        ${m.status === 'DRAFT' ? `<button class="btn btn-sm" onclick="publishModel('${m.id}')" title="Publish" style="color:#10b981;"><i data-lucide="check-circle" style="width:14px;"></i></button>` : ''}
        <button class="btn btn-sm" onclick="previewModel('${m.id}')" title="Preview"><i data-lucide="eye" style="width:14px;"></i></button>
        <button class="btn btn-sm" onclick="duplicateModel('${m.id}')" title="Duplicate"><i data-lucide="copy" style="width:14px;"></i></button>
        <button class="btn btn-sm" style="color:#ef4444;" onclick="deleteModel('${m.id}')" title="Delete"><i data-lucide="trash-2" style="width:14px;"></i></button>
      </td>
    </tr>
  `).join('');
  if (window.lucide) lucide.createIcons();
}

function filterModels() {
  const query = document.getElementById('model-search').value.toLowerCase();
  if (!window.allModelDsrs) return;
  const filtered = window.allModelDsrs.filter(m => 
    (m.title || '').toLowerCase().includes(query) ||
    (m.modelId || '').toLowerCase().includes(query) ||
    (m.district || '').toLowerCase().includes(query)
  );
  displayModelsList(filtered);
}

// ==========================================
// RENDER: CREATE MODEL
// ==========================================
async function renderCreateModel(container) {
  container.innerHTML = `
    <div class="header-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px;">
      <div>
        <div class="page-title">Create New Model DSR</div>
        <div class="page-sub">Extract a template from an existing completed project.</div>
      </div>
      <button class="btn btn-outline btn-sm" onclick="renderModelLibrary(document.getElementById('view-model-dsr'))">
        <i data-lucide="arrow-left"></i> Back to Library
      </button>
    </div>

    <div class="g2" style="align-items:start;">
      <div class="card">
        <div class="card-hd"><div class="card-title">1. Select Source Project</div></div>
        <div class="card-bd">
          <div class="field">
            <label>Completed DSR Projects</label>
            <select id="create-model-project-select" onchange="fetchProjectSectionsForModel(this.value)">
              <option value="">Loading completed projects...</option>
            </select>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-hd"><div class="card-title">2. Model Metadata</div></div>
        <div class="card-bd">
          <div class="field"><label>Model Title *</label><input type="text" id="cm-title" placeholder="e.g. Master Sand Model - Rupnagar"></div>
          <div class="field"><label>Category</label><input type="text" id="cm-category" placeholder="e.g. Sand, Gravel"></div>
          <div class="field"><label>Description</label><textarea id="cm-desc" rows="3" placeholder="Description of this template..."></textarea></div>
        </div>
      </div>
    </div>
    
    <div id="content-selection-container" style="display:none; margin-top: 24px;">
      <div class="card">
        <div class="card-hd" style="display:flex; justify-content:space-between;">
          <div class="card-title">3. Content Selection</div>
          <div>
            <button class="btn btn-outline btn-sm" onclick="toggleAllSections(true)">Select All</button>
            <button class="btn btn-outline btn-sm" onclick="toggleAllSections(false)">Unselect All</button>
          </div>
        </div>
        <div class="card-bd">
          <div id="cm-sections-list" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px;">
            <!-- Chapters will be rendered here -->
          </div>
        </div>
        <div class="card-ft" style="text-align:right;">
          <button class="btn btn-primary" onclick="saveNewModel()">Save Model DSR</button>
        </div>
      </div>
    </div>
  `;
  if (window.lucide) lucide.createIcons();

  try {
    const projects = await apiFetch('/api/projects?status=COMPLETED');
    const select = document.getElementById('create-model-project-select');
    if (projects.length === 0) {
      select.innerHTML = '<option value="">No completed projects found.</option>';
    } else {
      select.innerHTML = '<option value="">-- Select a project --</option>' + 
        projects.map(p => `<option value="${p.id}">${p.projectName || p.title} (${p.district})</option>`).join('');
    }
  } catch (err) {
    document.getElementById('create-model-project-select').innerHTML = '<option value="">Error loading projects</option>';
  }
}

async function fetchProjectSectionsForModel(projectId) {
  if (!projectId) {
    document.getElementById('content-selection-container').style.display = 'none';
    return;
  }
  
  document.getElementById('content-selection-container').style.display = 'block';
  const listContainer = document.getElementById('cm-sections-list');
  listContainer.innerHTML = '<div style="padding:20px;">Loading project sections...</div>';

  try {
    // In a real scenario, we'd fetch the project's actual state/chapters.
    const project = await apiFetch(`/api/projects/${projectId}`);
    let state = {};
    try { state = JSON.parse(project.projectState || '{}'); } catch(e){}
    
    // Fallback to standard chapters if project state doesn't have them
    const chapters = state.chapters || Array.from({length: 10}).map((_,i) => ({ title: `Chapter ${i+1}`}));
    const annexures = state.modelDsrAnnexures || Array.from({length: 7}).map((_,i) => ({ title: `Annexure ${i+1}`}));
    
    const allSections = [
      {title: "Cover Page"}, {title: "Certificate"}, {title: "Executive Summary"},
      ...chapters,
      ...annexures
    ];
    
    window.currentProjectSections = allSections;

    listContainer.innerHTML = allSections.map((s, i) => `
      <label style="display:flex; align-items:center; gap:10px; padding:12px; border:1px solid #e2e8f0; border-radius:6px; cursor:pointer; background:#f8fafc;">
        <input type="checkbox" class="cm-section-cb" value="${s.title}" checked>
        <span style="font-weight:500;">${s.title}</span>
      </label>
    `).join('');
    
    // Auto-fill district
    document.getElementById('cm-title').value = `Model DSR - ${project.district}`;
    window.currentSourceProject = project;

  } catch (err) {
    listContainer.innerHTML = `<div style="color:red; padding:20px;">Error: ${err.message}</div>`;
  }
}

function toggleAllSections(check) {
  document.querySelectorAll('.cm-section-cb').forEach(cb => cb.checked = check);
}

async function saveNewModel() {
  const title = document.getElementById('cm-title').value.trim();
  if (!title) return alert("Title is required!");
  
  const selectedSections = Array.from(document.querySelectorAll('.cm-section-cb'))
    .filter(cb => cb.checked)
    .map((cb, idx) => ({
      sectionName: cb.value,
      sequence: idx + 1,
      contentType: 'TEXT',
      isIncluded: true
    }));
    
  if (selectedSections.length === 0) return alert("Please select at least one section.");

  const payload = {
    title,
    category: document.getElementById('cm-category').value.trim(),
    description: document.getElementById('cm-desc').value.trim(),
    district: window.currentSourceProject?.district || '',
    mineralType: window.currentSourceProject?.mineral || '',
    sections: selectedSections
  };
  
  try {
    await apiFetch(MODEL_DSR_API_BASE, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    alert("Model DSR created successfully!");
    renderModelLibrary(document.getElementById('view-model-dsr'));
  } catch (err) {
    alert("Error saving model: " + err.message);
  }
}

// ==========================================
// ACTIONS: DUPLICATE, DELETE, PREVIEW
// ==========================================
async function duplicateModel(id) {
  if (!confirm("Are you sure you want to duplicate this Model?")) return;
  try {
    await apiFetch(`${MODEL_DSR_API_BASE}/${id}/duplicate`, { method: 'POST' });
    renderModelLibrary(document.getElementById('view-model-dsr'));
  } catch (err) {
    alert("Duplicate failed: " + err.message);
  }
}

async function publishModel(id) {
  if (!confirm("Are you sure you want to publish this Model? It will become available for all new projects.")) return;
  try {
    await apiFetch(`${MODEL_DSR_API_BASE}/${id}/publish`, { method: 'POST' });
    renderModelLibrary(document.getElementById('view-model-dsr'));
  } catch (err) {
    alert("Publish failed: " + err.message);
  }
}

async function deleteModel(id) {
  if (!confirm("Are you sure you want to permanently delete/archive this Model?")) return;
  try {
    await apiFetch(`${MODEL_DSR_API_BASE}/${id}`, { method: 'DELETE' });
    renderModelLibrary(document.getElementById('view-model-dsr'));
  } catch (err) {
    alert("Delete failed: " + err.message);
  }
}

async function previewModel(id) {
  try {
    const model = await apiFetch(`${MODEL_DSR_API_BASE}/${id}`);
    showModelPreviewModal(model);
  } catch (err) {
    alert("Failed to load preview: " + err.message);
  }
}

function showModelPreviewModal(model) {
  let modal = document.getElementById('model-preview-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'model-preview-modal';
    modal.className = 'modal';
    document.body.appendChild(modal);
  }
  
  const sectionsHtml = (model.sections || []).map(s => `
    <div style="padding: 10px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between;">
      <span style="font-weight: 500;">${s.sectionName}</span>
      <span style="font-size: 11px; padding: 2px 6px; background: #f1f5f9; border-radius: 4px;">${s.contentType}</span>
    </div>
  `).join('');

  modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px;">
      <div class="modal-header">
        <h3 class="modal-title">Model DSR Preview</h3>
        <button class="modal-close" onclick="closeModal('model-preview-modal')">&times;</button>
      </div>
      <div class="modal-body">
        <h4 style="margin-top:0; color:#17324D;">${model.title}</h4>
        <p style="font-size:13px; color:#64748b; margin-bottom: 20px;">
          District: ${model.district || 'N/A'} | Category: ${model.category || 'N/A'}<br>
          ${model.description || ''}
        </p>
        <h5 style="margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">Included Sections</h5>
        <div style="max-height: 400px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 6px;">
          ${sectionsHtml || '<div style="padding: 10px;">No sections found.</div>'}
        </div>
      </div>
      <div class="modal-footer" style="margin-top: 20px; text-align: right;">
        <button class="btn btn-outline" onclick="closeModal('model-preview-modal')">Close</button>
        ${model.status === 'DRAFT' ? `<button class="btn btn-primary" onclick="closeModal('model-preview-modal'); publishModel('${model.id}')">Publish Now</button>` : ''}
      </div>
    </div>
  `;
  
  modal.classList.add('open');
}

// ==========================================
// IMPORT MODEL FLOW (Overrides portal.bundle.js)
// ==========================================

const originalNewProjectModal = window.newProjectModal;
window.newProjectModal = async function() {
  if (typeof hasAdminAccess === 'function' && !hasAdminAccess()) {
    toast('Permission Denied: Only Administrators can create new projects.', 'error');
    return;
  }
  
  // Populate the Model DSR dropdown
  const modelSelect = document.getElementById('proj-model-dsr');
  if (modelSelect) {
    try {
      const models = await apiFetch('/api/model-dsrs');
      const published = models.filter(m => m.status === 'PUBLISHED');
      modelSelect.innerHTML = '<option value="">-- None (Empty Project) --</option>' + 
        published.map(m => \`<option value="\${m.id}">\${m.title} (v\${m.version})</option>\`).join('');
    } catch (err) {
      console.error("Failed to load Model DSRs", err);
    }
  }

  // Call the original function to open the modal
  const el = document.getElementById('modal-project');
  if (typeof hydrateDistrictSelect === 'function') hydrateDistrictSelect('proj-district', false);
  if (el) el.classList.add('open');
};

const originalCreateProject = window.createProject;
window.createProject = async function() {
  const modelId = document.getElementById('proj-model-dsr')?.value;
  
  const title = document.getElementById('proj-title').value || \`District Survey Report - \${document.getElementById('proj-district').value}\`;
  const payload = {
    projectName: title,
    district: document.getElementById('proj-district').value,
    year: document.getElementById('proj-year').value,
    mineral: document.getElementById('proj-mineral').value,
    rivers: document.getElementById('proj-rivers').value || 'Not specified',
    status: 'ACTIVE'
  };

  try {
    // 1. Create the base project
    const createdProject = await apiFetch('/api/projects', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    
    // 2. If a Model DSR was selected, import it immediately
    if (modelId && createdProject.id) {
      await apiFetch(\`/api/model-dsrs/\${modelId}/import\`, {
        method: 'POST',
        body: JSON.stringify({ projectId: createdProject.id })
      });
      toast(\`Model DSR imported into \${createdProject.projectName}\`, 'success');
    } else {
      toast('Project created successfully', 'success');
    }
    
    // Close modal and refresh
    closeModal('modal-project');
    if (typeof fetchProjects === 'function') fetchProjects();
    
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
};
