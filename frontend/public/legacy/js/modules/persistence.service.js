/**
 * Enterprise Project Persistence Service (V2)
 * Single Source of Truth for Data Persistence, Hydration, and Verification
 */
class ProjectPersistenceService {
  constructor() {
    this.registry = new Map();
    this.saveQueue = [];
    this.isSaving = false;
    this.retryTimeout = null;
    this.offlineQueue = false;
  }

  /**
   * Register a module's state exporter
   * @param {string} moduleKey - Unique key for the module (e.g. 'frontMatter')
   * @param {Function} exporter - Function that returns the module's state
   */
  register(moduleKey, exporter) {
    if (typeof exporter !== 'function') {
      console.error(`[Persistence] Exporter for ${moduleKey} must be a function`);
      return;
    }
    this.registry.set(moduleKey, exporter);
  }

  /**
   * Register legacy keys that modules write directly to window.S
   */
  registerLegacyDefaults() {
    const legacyKeys = [
      'frontMatter', 'chapters', 'plates', 'graphs', 'graphCharts', 
      'signatures', 'demandDistricts', 'summarySources', 'auctionData', 
      'uploadedPDFs', 'graphsOpened', 'annexuresOpened', 'tablesOpened', 
      'frontMatterFiles', 'chapterPDFs', 'annexureB', 'annexureC', 
      'annexureD', 'annexureE', 'annexureG', 'annexureH', 'annexureI', 
      'annexureJ', 'annexureJDemandTables', 'phaseMetadata', 'phaseChangeLog'
    ];
    
    legacyKeys.forEach(key => {
      if (!this.registry.has(key)) {
        this.register(key, () => window.S ? window.S[key] : undefined);
      }
    });
  }

  /**
   * Build a complete, comprehensive state snapshot
   */
  buildSnapshot() {
    if (!window.S || !window.S.activeProject) return {};
    
    const snapshot = { ...window.S.activeProject };
    
    // Dynamically pull from all registered modules
    for (const [key, exporter] of this.registry.entries()) {
      const state = exporter();
      if (state !== undefined) {
        snapshot[key] = state;
      }
    }
    return snapshot;
  }

  /**
   * Calculate project completion progress based on snapshot data
   */
  calculateProgress(snapshot) {
    if (typeof calculateProjectProgress === 'function') {
      return calculateProjectProgress(snapshot);
    }
    return snapshot.progress || 0;
  }

  /**
   * Request a save (can be queued if already saving)
   */
  async requestSave(immediate = false) {
    if (!window.S || !window.S.activeProject || !window.S.activeProject.id) return;
    
    if (this.isSaving && !immediate) {
      if (this.saveQueue.length === 0) this.saveQueue.push(Date.now());
      window.AutoSaveManager?.updateStatus('Queued...', 'info');
      return;
    }
    
    if (this.retryTimeout) clearTimeout(this.retryTimeout);
    
    await this.executeSave();
  }

  /**
   * The core save execution loop
   */
  async executeSave() {
    const projectId = window.S.activeProject.id;
    this.isSaving = true;
    window.AutoSaveManager?.updateStatus('Saving...', 'info');
    
    try {
      const snapshot = this.buildSnapshot();
      const progress = this.calculateProgress(snapshot);
      
      // Update local active project with new progress
      window.S.activeProject.progress = progress;
      if (typeof updateLiveProgressUI === 'function') updateLiveProgressUI(progress);
      
      const payload = {
        state: JSON.stringify(snapshot),
        progress: progress
      };
      
      if (!navigator.onLine) {
        throw new Error('Offline');
      }

      // Use the global apiFetch to ensure correct API_BASE_URL and auth headers are applied
      const responseData = await apiFetch(`/projects/${projectId}/state`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      
      // Verification: Ensure backend acknowledged success
      if (!responseData.success) {
        throw new Error(responseData.error || 'Backend rejected save');
      }

      // Success
      window.AutoSaveManager?.updateStatus('All Changes Saved', 'success');
      this.offlineQueue = false;
      
    } catch (err) {
      console.error("[Persistence] Save Failed:", err);
      this.offlineQueue = true;
      window.AutoSaveManager?.updateStatus(err.message === 'Offline' ? 'Offline - Queued' : 'Sync Failed - Retrying...', 'error');
      
      // Retry in 5 seconds
      this.retryTimeout = setTimeout(() => {
        this.executeSave();
      }, 5000);
      
    } finally {
      this.isSaving = false;
      
      // Process queue if another save was requested while we were saving
      if (this.saveQueue.length > 0) {
        this.saveQueue.shift();
        setTimeout(() => this.executeSave(), 1000);
      }
    }
  }

  /**
   * Guaranteed delivery on unload using sendBeacon
   */
  forceSyncSave() {
    if (!window.S || !window.S.activeProject || !window.S.activeProject.id) return;
    
    const projectId = window.S.activeProject.id;
    const snapshot = this.buildSnapshot();
    const progress = this.calculateProgress(snapshot);
    
    const payload = {
      state: JSON.stringify(snapshot),
      progress: progress
    };
    
    const baseUrl = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : '/api';
    const url = `${baseUrl}/projects/${projectId}/state`;
    const blob = new Blob([JSON.stringify(payload)], {type: 'application/json'});
    navigator.sendBeacon(url, blob);
  }

  /**
   * Hydrate project state during openProject
   */
  hydrateState(stateSnapshot) {
    if (!stateSnapshot || typeof stateSnapshot !== 'object') return;
    
    // Hydrate all registered keys back onto window.S
    for (const key of this.registry.keys()) {
      if (stateSnapshot[key] !== undefined) {
        window.S[key] = stateSnapshot[key];
      }
    }
    
    // Also merge standard top-level project metadata
    window.S.activeProject = { ...window.S.activeProject, ...stateSnapshot };
  }
}

window.ProjectPersistenceService = new ProjectPersistenceService();
window.ProjectPersistenceService.registerLegacyDefaults();
