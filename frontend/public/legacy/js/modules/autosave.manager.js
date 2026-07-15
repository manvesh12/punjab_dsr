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
    
    // Delegate actual saving logic to the centralized service
    if (window.ProjectPersistenceService) {
      await window.ProjectPersistenceService.requestSave();
      this.dirtySections.clear();
    }
  }

  forceSyncSave() {
    if (this.dirtySections.size === 0) return;
    
    // Delegate to centralized service for unload guaranteed delivery
    if (window.ProjectPersistenceService) {
      window.ProjectPersistenceService.forceSyncSave();
    }
  }
}

window.AutoSaveManager = new AutoSaveManager();

