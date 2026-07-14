/**
 * Enterprise Central AutoSave Manager
 * Handles delta tracking, debounce queueing, and section-level updates.
 */

class AutoSaveManager {
  constructor() {
    this.dirtySections = new Set();
    this.saveTimeout = null;
    this.debounceDelay = 2000; // 2 seconds
    this.isSaving = false;
    this.saveQueue = [];
    this.initListeners();
    this.createStatusUI();
  }

  createStatusUI() {
    this.statusEl = document.createElement('div');
    this.statusEl.id = 'enterprise-autosave-status';
    this.statusEl.style.cssText = `
      position: fixed;
      top: 10px;
      right: 50%;
      transform: translateX(50%);
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
      z-index: 9999;
      opacity: 0;
      transition: opacity 0.3s;
      pointer-events: none;
    `;
    if (document.body) {
      document.body.appendChild(this.statusEl);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(this.statusEl);
      });
    }
  }

  updateStatus(status, type = 'info') {
    if (!this.statusEl) return;
    this.statusEl.textContent = status;
    this.statusEl.style.opacity = '1';
    
    if (type === 'error') {
      this.statusEl.style.background = '#e74c3c';
    } else if (type === 'success') {
      this.statusEl.style.background = '#27ae60';
      setTimeout(() => {
        this.statusEl.style.opacity = '0';
      }, 3000);
    } else {
      this.statusEl.style.background = 'rgba(0,0,0,0.8)';
    }
  }

  initListeners() {
    // Listen to all inputs globally
    document.addEventListener('input', (e) => this.handleInput(e));
    document.addEventListener('change', (e) => this.handleInput(e));
    
    // Page Unload (Zero Data Loss)
    window.addEventListener('beforeunload', (e) => {
      this.forceSyncSave();
    });
  }

  getSectionFromElement(el) {
    // Traverse up to find a data-section attribute
    const container = el.closest('[data-section]');
    return container ? container.getAttribute('data-section') : 'general';
  }

  handleInput(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
      const sectionName = this.getSectionFromElement(e.target);
      this.markDirty(sectionName);
    }
  }

  markDirty(sectionName) {
    this.dirtySections.add(sectionName);
    this.updateStatus('Unsaved Changes');
    
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = setTimeout(() => {
      this.flushQueue();
    }, this.debounceDelay);
  }

  async flushQueue() {
    if (this.dirtySections.size === 0) return;
    if (this.isSaving) {
      // Re-queue if currently saving
      setTimeout(() => this.flushQueue(), 1000);
      return;
    }
    
    this.isSaving = true;
    this.updateStatus('Saving...', 'info');
    
    const projectId = window.S && window.S.activeProject ? window.S.activeProject.id : null;
    
    if (!projectId) {
       this.isSaving = false;
       return;
    }

    try {
      // In a real app, we would gather the exact form data for each section here
      // For now, we simulate a draft save of the entire current state
      const stateToSave = window.S ? { ...window.S.activeProject } : {};
      
      const res = await fetch(`/api/projects/${projectId}/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${localStorage.getItem('token')}\`
        },
        body: JSON.stringify(stateToSave)
      });
      
      if (!res.ok) throw new Error('Save failed');
      
      this.dirtySections.clear();
      this.updateStatus('All changes saved', 'success');
      
    } catch (err) {
      console.error("AutoSave Error:", err);
      this.updateStatus('Sync Failed - Retrying...', 'error');
      // Retry logic
      setTimeout(() => this.flushQueue(), 5000);
    } finally {
      this.isSaving = false;
    }
  }

  forceSyncSave() {
    if (this.dirtySections.size === 0) return;
    const projectId = window.S && window.S.activeProject ? window.S.activeProject.id : null;
    if (!projectId) return;

    const stateToSave = window.S ? { ...window.S.activeProject } : {};
    
    // Use navigator.sendBeacon for guaranteed delivery on close
    const url = \`/api/projects/\${projectId}/draft\`;
    const blob = new Blob([JSON.stringify(stateToSave)], {type: 'application/json'});
    navigator.sendBeacon(url, blob);
  }
}

window.AutoSaveManager = new AutoSaveManager();

