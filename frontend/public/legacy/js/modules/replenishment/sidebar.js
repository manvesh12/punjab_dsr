(function() {
class Sidebar {
  constructor() {
    this.container = document.getElementById("repl-sidebar-container");
    this.navItems = [
      { id: 'overview', title: 'Overview', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>', status: '100%', color: '#22c55e' },
      { id: 'imported', title: 'Auto Imported', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>', status: 'Synced', color: '#3b82f6' },
      { id: 'general', title: 'General Details', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>', badge: '2 Pending' },
      { id: 'river', title: 'River Details', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>' },
      { id: 'gis', title: 'GIS', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>', status: '1 file' },
      { id: 'drone', title: 'Drone', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>', badge: 'Missing' },
      { id: 'reserve', title: 'Reserve', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>' },
      { id: 'hydro', title: 'Hydrology', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>' },
      { id: 'geo', title: 'Geology', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>' },
      { id: 'images', title: 'Images', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>', status: '0 files' },
      { id: 'files', title: 'Files', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>', badge: '4' },
      { id: 'ai', title: 'AI Assistant', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>', color: '#C49A58' },
      { divider: true },
      { id: 'comments', title: 'Comments', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>' },
      { id: 'validation', title: 'Validation', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>', color: '#ca8a04', badge: '3' },
      { id: 'progress', title: 'Progress', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>' },
      { id: 'submission', title: 'Submission', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>' },
    ];
  }

  init(module) {
    this.module = module;
    if (!this.container) return;
    this.render();
  }

  render() {
    let html = '';
    
    this.navItems.forEach(item => {
      if (item.divider) {
        html += '<div style="margin:12px 8px; border-bottom:1px solid #f3f4f6;"></div>';
        return;
      }
      
      const isActive = item.id === 'general';
      const bgColor = isActive ? '#17324D' : 'transparent';
      const textColor = isActive ? '#ffffff' : '#4b5563';
      const hoverBg = isActive ? '#17324D' : '#f3f4f6';
      const iconColor = isActive ? '#C49A58' : (item.color || '#9ca3af');
      const transform = isActive ? 'scale(1.02)' : 'none';
      const shadow = isActive ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none';
      
      let badgeHtml = '';
      if (item.badge) {
        const bBg = isActive ? '#C49A58' : '#fee2e2';
        const bCol = isActive ? '#17324D' : '#dc2626';
        badgeHtml = `<span style="padding:2px 8px; font-size:10px; font-weight:700; border-radius:10px; background:${bBg}; color:${bCol};">${item.badge}</span>`;
      } else if (item.status) {
        const sCol = isActive ? '#d1d5db' : '#9ca3af';
        badgeHtml = `<span style="font-size:12px; color:${sCol};">${item.status}</span>`;
      }
      
      html += `
        <div class="repl-sb-item" style="display:flex; align-items:center; justify-content:space-between; padding:8px 12px; cursor:pointer; border-radius:8px; font-size:14px; transition:all 0.2s; margin:4px; background:${bgColor}; color:${textColor}; transform:${transform}; box-shadow:${shadow};" onmouseover="this.style.background='${hoverBg}'" onmouseout="this.style.background='${bgColor}'">
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="color:${iconColor}; display:flex; align-items:center; justify-content:center;">
              <div style="width:16px; height:16px;">${item.icon}</div>
            </span>
            <span style="font-weight:500;">${item.title}</span>
          </div>
          ${badgeHtml}
        </div>
      `;
    });
    
    this.container.innerHTML = html;
  }
}

window.replenishmentSidebar = new Sidebar();
})();
