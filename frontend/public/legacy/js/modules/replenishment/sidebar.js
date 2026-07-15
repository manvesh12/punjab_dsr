(function() {
class Sidebar {
  constructor() {
    this.container = document.getElementById("repl-sidebar-container");
    
    // Icon SVG definitions to keep things clean
    const iDoc = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>';
    const iLoc = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>';
    const iSurv = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>';
    const iRiver = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>';
    const iHydro = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>';
    const iGeo = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>';
    const iRes = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>';
    const iImg = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
    const iMap = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>';

    this.navItems = [
      { id: 'general', title: 'General Info', icon: iDoc },
      { id: 'location', title: 'Location Details', icon: iLoc },
      { id: 'survey', title: 'Survey Details', icon: iSurv },
      { id: 'river', title: 'River Info', icon: iRiver },
      { id: 'hydro', title: 'Hydrology', icon: iHydro },
      { id: 'geo', title: 'Geology', icon: iGeo },
      { id: 'reserve', title: 'Reserve Est.', icon: iRes, badge: 'Required', color: '#C49A58' },
      { id: 'obs', title: 'Field Obs', icon: iDoc },
      { id: 'images', title: 'Images', icon: iImg },
      { id: 'maps', title: 'Maps & GIS', icon: iMap },
      { id: 'docs', title: 'Documents', icon: iDoc },
      { id: 'annex', title: 'Annexures', icon: iDoc },
      { id: 'recom', title: 'Recommendations', icon: iDoc }
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
      // Hardcode 'general' as active for visual purpose, later we can bind to scroll position
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
        <div class="repl-sb-item" onclick="document.getElementById('acc-${item.id}')?.scrollIntoView({behavior:'smooth'})" style="display:flex; align-items:center; justify-content:space-between; padding:8px 12px; cursor:pointer; border-radius:8px; font-size:14px; transition:all 0.2s; margin:4px; background:${bgColor}; color:${textColor}; transform:${transform}; box-shadow:${shadow};" onmouseover="this.style.background='${hoverBg}'; this.style.color='#ffffff';" onmouseout="this.style.background='${bgColor}'; this.style.color='${textColor}';">
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
