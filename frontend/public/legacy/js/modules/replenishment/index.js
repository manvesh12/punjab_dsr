(function() {
class ReplenishmentModule {
  constructor() {
    this.initialized = false;
    this.saveTimeout = null;
  }

  async init(projectId) {
    if (this.initialized) return;
    
    // UI Elements
    this.titleEl = document.getElementById("repl-project-title");
    this.autoSaveEl = document.getElementById("repl-autosave-status");
    this.fetchBtn = document.getElementById("repl-auto-fetch-btn");
    
    // Bind Events
    this.fetchBtn?.addEventListener("click", () => this.handleAutoFetch());
    document.getElementById("repl-submit-btn")?.addEventListener("click", () => this.handleSubmit());
    document.getElementById("repl-download-btn")?.addEventListener("click", () => window.print());

    // Fetch initial state
    await this.loadProject(projectId);
    
    // Initialize sub-modules
    if (window.replenishmentSidebar) window.replenishmentSidebar.init(this);
    if (window.replenishmentWorkspace) window.replenishmentWorkspace.init(this);
    if (window.replenishmentPreview) window.replenishmentPreview.init(this);
    
    this.setupAutoSave();
    
    // Initial validation check
    this.validate();

    this.initialized = true;
  }

  async loadProject(projectId) {
    try {
      if (this.titleEl) this.titleEl.textContent = "Loading...";
      const res = await apiFetch(`/projects/${projectId}/replenishment`);
      if (res && res.length > 0) {
        window.S.activeReplenishment = res[0];
      } else {
        const createRes = await apiFetch(`/projects/${projectId}/replenishment`, { method: 'POST', body: JSON.stringify({}) });
        window.S.activeReplenishment = createRes;
      }
      if (this.titleEl) this.titleEl.textContent = window.S.activeReplenishment.title || `Project ${projectId}`;
    } catch (err) {
      console.error("Failed to load replenishment project", err);
      if (this.titleEl) this.titleEl.textContent = "Error Loading Project";
    }
  }

  async handleAutoFetch() {
    try {
      if (this.autoSaveEl) this.autoSaveEl.innerHTML = `<span style="color:#3b82f6;">Syncing Final DSR...</span>`;
      const id = window.S.activeReplenishment.id;
      const res = await apiFetch(`/replenishment/${id}/fetch-final-dsr`, { method: 'POST', body: JSON.stringify({}) });
      window.S.activeReplenishment = res;
      if (window.replenishmentWorkspace) window.replenishmentWorkspace.render();
      if (window.replenishmentPreview) window.replenishmentPreview.render();
      if (this.autoSaveEl) this.autoSaveEl.innerHTML = `<span style="color:#16a34a;">Sync Complete</span>`;
    } catch (err) {
      console.error("Auto Fetch failed", err);
      if (this.autoSaveEl) this.autoSaveEl.innerHTML = `<span style="color:#ef4444;">Sync Failed</span>`;
    }
  }

  async handleSubmit() {
    try {
      const id = window.S.activeReplenishment.id;
      await apiFetch(`/replenishment/${id}/workflow`, { method: 'POST', body: JSON.stringify({ action: "PENDING_SDO_REVIEW" }) });
      alert("Report submitted successfully for review!");
    } catch (err) {
      alert("Failed to submit: " + (err.message || "Error"));
    }
  }

  setupAutoSave() {
    const container = document.getElementById("repl-accordion-container");
    if (container) {
      // Listen to all inputs inside the workspace
      container.addEventListener("input", (e) => {
        if (e.target.dataset.field) {
           // Live preview update
           if (window.replenishmentPreview) window.replenishmentPreview.render();
           // Trigger auto-save to backend
           this.triggerAutoSave();
           this.validate();
        }
      });
    }
  }

  validate() {
    // Simple validation feedback on toolbar
    const valBtn = document.getElementById('repl-validation-text');
    if (valBtn) {
      const pctEl = document.getElementById('repl-completion-percent');
      if (pctEl && pctEl.textContent === '100%') {
        valBtn.textContent = 'All Valid';
        valBtn.parentElement.className = 'repl-btn repl-btn-ghost';
      } else {
        valBtn.textContent = 'Validation Pending';
        valBtn.parentElement.className = 'repl-btn repl-btn-warning';
      }
    }
  }

  triggerAutoSave() {
    if (this.autoSaveEl) this.autoSaveEl.innerHTML = `<span style="color:#eab308;">Saving...</span>`;
    clearTimeout(this.saveTimeout);
    
    // Save to local state immediately
    if (!window.S.activeReplenishment.reportState) window.S.activeReplenishment.reportState = {};
    const state = window.S.activeReplenishment.reportState;
    
    // Collect all fields
    document.querySelectorAll('[data-field]').forEach(el => {
      state[el.dataset.field] = el.value;
    });

    // Debounce API call
    this.saveTimeout = setTimeout(async () => {
      try {
        const id = window.S.activeReplenishment.id;
        await apiFetch(`/replenishment/${id}/state`, { method: 'PUT', body: JSON.stringify({ reportState: state }) });
        if (this.autoSaveEl) this.autoSaveEl.innerHTML = `<svg style="width:16px;height:16px;color:#16a34a;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span style="color:#16a34a;">All changes saved</span>`;
      } catch (err) {
        if (this.autoSaveEl) this.autoSaveEl.innerHTML = `<span style="color:#ef4444;">Save Failed (Offline)</span>`;
      }
    }, 1500);
  }
}

window.replenishmentV2Module = new ReplenishmentModule();

const originalShowViewReplV2 = window.showView;
if (originalShowViewReplV2) {
  window.showView = function(viewId, caller, push) {
    originalShowViewReplV2(viewId, caller, push);
    if (viewId === 'replenishment') {
      const projectId = window.S?.activeProject?.id || 'demo';
      window.replenishmentV2Module.init(projectId);
    }
  };
}

})();
