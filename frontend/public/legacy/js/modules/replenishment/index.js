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
    this.initialized = true;
  }

  async loadProject(projectId) {
    try {
      if (this.titleEl) this.titleEl.textContent = "Loading...";
      // We assume window.api or generic fetch exists for the API client
      const res = await window.api.get(`/projects/${projectId}/replenishment`);
      if (res && res.data && res.data.length > 0) {
        window.S.activeReplenishment = res.data[0];
      } else {
        const createRes = await window.api.post(`/projects/${projectId}/replenishment`, {});
        window.S.activeReplenishment = createRes.data;
      }
      if (this.titleEl) this.titleEl.textContent = window.S.activeReplenishment.title || `Project ${projectId}`;
    } catch (err) {
      console.error("Failed to load replenishment project", err);
      if (this.titleEl) this.titleEl.textContent = "Error Loading Project";
    }
  }

  async handleAutoFetch() {
    try {
      if (this.autoSaveEl) this.autoSaveEl.innerHTML = `<span class="text-blue-500">Syncing Final DSR...</span>`;
      const id = window.S.activeReplenishment.id;
      const res = await window.api.post(`/replenishment/${id}/fetch-final-dsr`, {});
      window.S.activeReplenishment = res.data;
      if (window.replenishmentWorkspace) window.replenishmentWorkspace.render();
      if (window.replenishmentPreview) window.replenishmentPreview.render();
      if (this.autoSaveEl) this.autoSaveEl.innerHTML = `<span class="text-green-500">Sync Complete</span>`;
    } catch (err) {
      console.error("Auto Fetch failed", err);
      if (this.autoSaveEl) this.autoSaveEl.innerHTML = `<span class="text-red-500">Sync Failed</span>`;
    }
  }

  async handleSubmit() {
    try {
      const id = window.S.activeReplenishment.id;
      await window.api.post(`/replenishment/${id}/workflow`, { action: "PENDING_SDO_REVIEW" });
      alert("Report submitted successfully for review!");
    } catch (err) {
      alert("Failed to submit: " + (err.response?.data?.message || err.message));
    }
  }

  setupAutoSave() {
    const container = document.getElementById("repl-accordion-container");
    if (container) {
      container.addEventListener("input", (e) => {
        if (e.target.dataset.field) {
           this.triggerAutoSave();
        }
      });
    }
  }

  triggerAutoSave() {
    if (this.autoSaveEl) this.autoSaveEl.innerHTML = `<span class="text-yellow-500">Saving...</span>`;
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(async () => {
      try {
        const id = window.S.activeReplenishment.id;
        // Basic sync of input values to state before saving
        const area = document.querySelector('[data-field="replenishedArea"]')?.value;
        const mt = document.querySelector('[data-field="estimatedReplenishment"]')?.value;
        if (!window.S.activeReplenishment.reportState) window.S.activeReplenishment.reportState = {};
        window.S.activeReplenishment.reportState.replenishedArea = area;
        window.S.activeReplenishment.reportState.estimatedReplenishment = mt;
        
        await window.api.put(`/replenishment/${id}/state`, { reportState: window.S.activeReplenishment.reportState });
        if (this.autoSaveEl) this.autoSaveEl.innerHTML = `<svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span>All changes saved</span>`;
      } catch (err) {
        if (this.autoSaveEl) this.autoSaveEl.innerHTML = `<span class="text-red-500">Save Failed (Offline)</span>`;
      }
    }, 1500); // Debounce
  }
}

window.replenishmentV2Module = new ReplenishmentModule();

// Hook into showView directly from here if possible, or we will add it to navigation.js
const originalShowViewReplV2 = window.showView;
if (originalShowViewReplV2) {
  window.showView = function(viewId, caller, push) {
    originalShowViewReplV2(viewId, caller, push);
    if (viewId === 'replenishment') {
      const projectId = window.S?.activeProject?.id;
      if (projectId) {
        window.replenishmentV2Module.init(projectId);
      }
    }
  };
}

})();
