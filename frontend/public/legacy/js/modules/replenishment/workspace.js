(function() {
class Workspace {
  init(module) {
    this.module = module;
    this.container = document.getElementById("repl-accordion-container");
    this.render();
  }

  render() {
    if (!this.container) return;
    const state = window.S?.activeReplenishment?.reportState || {};
    const inherited = state.inherited || {};

    const html = `
      ${this.buildCard("Auto Imported Information", '<svg style="width:20px; height:20px; flex-shrink:0; color:#16a34a;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>', `
        <div style="display:flex; flex-direction:column; gap:16px;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; border-bottom:1px solid #f3f4f6; padding-bottom:12px;">
             <div style="display:flex; align-items:center; gap:12px;">
                <span style="background:#dcfce7; color:#15803d; font-size:12px; font-weight:700; padding:4px 8px; border-radius:4px; border:1px solid #bbf7d0;">SOURCE: FINAL DSR</span>
                <span style="font-size:12px; color:#6b7280;">Last Synced: 2 mins ago</span>
             </div>
             <div style="display:flex; gap:8px;">
                <button style="font-size:12px; color:#2563eb; font-weight:500; cursor:pointer; background:none; border:none;">Compare</button>
                <button style="font-size:12px; color:#6b7280; font-weight:500; cursor:pointer; background:none; border:none;">Refresh</button>
             </div>
          </div>
          <div>
            <label style="display:block; font-size:10px; font-weight:700; color:#9ca3af; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:4px;">Project Name</label>
            <div style="padding:12px 16px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:4px; font-size:14px; color:#4b5563; display:flex; justify-content:space-between; align-items:center;">
              <span>${inherited.project_name || "N/A"}</span>
              <svg style="width:16px; height:16px; color:#d1d5db;" fill="currentColor" viewBox="0 0 20 20"><path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"></path></svg>
            </div>
          </div>
          <div style="display:flex; gap:16px;">
            <div style="flex:1;">
              <label style="display:block; font-size:10px; font-weight:700; color:#9ca3af; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:4px;">District</label>
              <div style="padding:12px 16px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:4px; font-size:14px; color:#4b5563; display:flex; justify-content:space-between; align-items:center;">
                <span>${inherited.district || "N/A"}</span>
                <svg style="width:16px; height:16px; color:#d1d5db;" fill="currentColor" viewBox="0 0 20 20"><path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"></path></svg>
              </div>
            </div>
            <div style="flex:1;">
              <label style="display:block; font-size:10px; font-weight:700; color:#9ca3af; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:4px;">River</label>
              <div style="padding:12px 16px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:4px; font-size:14px; color:#4b5563; display:flex; justify-content:space-between; align-items:center;">
                <span>${inherited.rivers || "N/A"}</span>
                <svg style="width:16px; height:16px; color:#d1d5db;" fill="currentColor" viewBox="0 0 20 20"><path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"></path></svg>
              </div>
            </div>
          </div>
        </div>
      `, true, 'border-color:#bbf7d0; box-shadow:0 1px 2px rgba(0,0,0,0.05);')}
      
      ${this.buildCard("Officer Input", '<svg style="width:20px; height:20px; flex-shrink:0; color:#2563eb;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>', `
        <div style="display:flex; flex-direction:column; gap:24px;">
          <div style="position:relative;">
            <label style="font-size:12px; color:#6b7280; font-weight:600; margin-bottom:4px; display:block;">Total Replenished Area (Hectares)</label>
            <input type="number" id="repl-area" data-field="replenishedArea" style="width:100%; padding:10px 16px; border:1px solid #d1d5db; background:#f9fafb; color:#111827; border-radius:4px; font-size:14px;" value="${state.replenishedArea || ''}">
          </div>
          <div style="position:relative;">
            <label style="font-size:12px; color:#6b7280; font-weight:600; margin-bottom:4px; display:block;">Estimated Replenishment (MT)</label>
            <input type="number" id="repl-est" data-field="estimatedReplenishment" style="width:100%; padding:10px 16px; border:1px solid #d1d5db; background:#f9fafb; color:#111827; border-radius:4px; font-size:14px;" value="${state.estimatedReplenishment || ''}">
          </div>
          <div style="background:#eff6ff; border:1px solid #dbeafe; border-radius:8px; padding:16px;">
             <div style="display:flex; align-items:flex-start; gap:12px;">
                <svg style="width:20px; height:20px; color:#3b82f6;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <div style="font-size:14px; color:#1e40af; line-height:1.4;">
                   <strong>Live Validation Active:</strong> Inputs are automatically converted to standard units and mapped to the A4 document layout.
                </div>
             </div>
          </div>
        </div>
      `, false, 'border-color:#bfdbfe; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);', true)}

      ${this.buildCard("Upload Section", '<svg style="width:20px; height:20px; flex-shrink:0; color:#9333ea;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>', `
        <div style="display:flex; flex-direction:column; gap:16px;">
          <div style="border:2px dashed #e9d5ff; background:#faf5ff; border-radius:12px; padding:32px; text-align:center; cursor:pointer; position:relative; overflow:hidden;">
            <svg style="margin:0 auto; height:48px; width:48px; color:#c084fc;" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <div style="margin-top:16px; display:flex; flex-direction:column; align-items:center;">
              <span style="font-size:14px; font-weight:500; color:#7e22ce; background:#ffffff; padding:6px 16px; border-radius:999px; box-shadow:0 1px 2px rgba(0,0,0,0.05); border:1px solid #f3e8ff;">Browse Files or Drag & Drop</span>
              <p style="font-size:11px; color:#6b7280; margin-top:12px; max-width:250px;">Supports PDF, Word, Excel, Images, DEM, Drone imagery, ZIP, GeoJSON, KML, SHP</p>
            </div>
            <input type="file" style="position:absolute; inset:0; width:100%; height:100%; opacity:0; cursor:pointer;">
          </div>
          <div style="background:#f9fafb; padding:12px; border-radius:8px; border:1px solid #e5e7eb;">
             <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; color:#6b7280; margin-bottom:8px;">
                <span>Upload History</span>
                <span style="color:#2563eb; cursor:pointer;">View All</span>
             </div>
             <div style="display:flex; align-items:center; justify-content:center; padding:16px 0; font-size:14px; color:#9ca3af; border-top:1px dashed #d1d5db;">
                No recent uploads in this section.
             </div>
          </div>
        </div>
      `, false, 'border-color:#e9d5ff;')}

      ${this.buildCard("AI Generated Section", '<svg style="width:20px; height:20px; flex-shrink:0; color:#ca8a04;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>', `
        <div style="display:flex; flex-direction:column; gap:16px;">
          <div style="background:linear-gradient(to right, #17324D, #2a4a6b); border-radius:8px; padding:20px; color:#ffffff; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1); position:relative; overflow:hidden;">
             <h4 style="font-weight:700; font-size:18px; margin:0 0 8px 0; position:relative; z-index:10; display:flex; align-items:center; gap:8px;">
                <svg style="width:20px; height:20px; color:#C49A58;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                AI Assistant
             </h4>
             <p style="font-size:14px; color:#dbeafe; margin:0 0 20px 0; position:relative; z-index:10;">Generate technical methodology, hydrology, geology, and reserve analysis based on your uploaded data.</p>
             <div style="display:flex; flex-wrap:wrap; gap:8px; position:relative; z-index:10;">
               <button style="display:flex; align-items:center; gap:6px; padding:6px 12px; border-radius:4px; font-size:14px; font-weight:700; color:#17324D; background:#C49A58; border:none; cursor:pointer;">
                 <svg style="width:16px; height:16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                 Generate Draft
               </button>
               <button style="display:flex; align-items:center; gap:6px; padding:6px 12px; border-radius:4px; font-size:14px; font-weight:500; color:#ffffff; background:rgba(255,255,255,0.2); border:1px solid rgba(255,255,255,0.2); cursor:pointer;">
                 Improve
               </button>
               <button style="display:flex; align-items:center; gap:6px; padding:6px 12px; border-radius:4px; font-size:14px; font-weight:500; color:#ffffff; background:rgba(255,255,255,0.2); border:1px solid rgba(255,255,255,0.2); cursor:pointer;">
                 Translate
               </button>
             </div>
          </div>
        </div>
      `, false, 'border-color:#fef08a;')}
      
      ${this.buildCard("Validation & Missing Data", '<svg style="width:20px; height:20px; flex-shrink:0; color:#ef4444;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>', `
        <div style="display:flex; flex-direction:column; gap:12px;">
          <div style="display:flex; align-items:flex-start; gap:12px; padding:12px; background:#fef2f2; border-radius:4px; border:1px solid #fee2e2;">
             <svg style="width:16px; height:16px; color:#ef4444; margin-top:2px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
             <div>
                <div style="font-size:14px; font-weight:500; color:#991b1b;">Missing Drone Imagery</div>
                <div style="font-size:12px; color:#dc2626; margin-top:4px;">Section 4 requires drone orthomosaic upload before submission.</div>
                <button style="margin-top:8px; font-size:12px; background:#fee2e2; color:#b91c1c; padding:4px 8px; border-radius:4px; font-weight:500; border:none; cursor:pointer;">Fix Now</button>
             </div>
          </div>
          <div style="display:flex; align-items:flex-start; gap:12px; padding:12px; background:#fefce8; border-radius:4px; border:1px solid #fef08a;">
             <svg style="width:16px; height:16px; color:#eab308; margin-top:2px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01"></path></svg>
             <div>
                <div style="font-size:14px; font-weight:500; color:#854d0e;">Coordinate Mismatch Warning</div>
                <div style="font-size:12px; color:#a16207; margin-top:4px;">The provided coordinates do not align perfectly with the Final DSR boundaries.</div>
             </div>
          </div>
        </div>
      `, false, 'border-color:#fecaca;')}
    `;

    this.container.innerHTML = html;
  }

  buildCard(title, icon, content, locked = false, customStyle = '', defaultOpen = false) {
    const id = 'acc-' + Math.random().toString(36).substr(2, 9);
    
    return `
      <div class="repl-card" style="background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; margin-bottom:20px; transition:all 0.3s; ${customStyle}">
        <div style="padding:16px 20px; border-bottom:1px solid #f3f4f6; display:flex; align-items:center; justify-content:space-between; cursor:pointer; background:#ffffff;" onclick="const contentEl = document.getElementById('${id}'); const chev = this.querySelector('.chevron'); if (contentEl.style.display === 'none') { contentEl.style.display = 'block'; chev.style.transform = 'rotate(180deg)'; } else { contentEl.style.display = 'none'; chev.style.transform = 'rotate(0deg)'; }">
          <h3 style="font-size:15px; font-weight:700; color:#17324D; display:flex; align-items:center; gap:12px; margin:0;">
            ${icon} ${title}
          </h3>
          ${locked 
            ? '<svg style="width:16px; height:16px; color:#9ca3af; flex-shrink:0;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>' 
            : `<svg class="chevron" style="width:20px; height:20px; color:#9ca3af; flex-shrink:0; transition:transform 0.3s; transform:${defaultOpen ? 'rotate(180deg)' : 'rotate(0deg)'};" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>`}
        </div>
        <div id="${id}" style="padding:24px; ${locked ? 'opacity:0.9; background:#f9fafb;' : ''} display:${defaultOpen ? 'block' : 'none'};">
          ${content}
        </div>
      </div>
    `;
  }
}

window.replenishmentWorkspace = new Workspace();
})();
