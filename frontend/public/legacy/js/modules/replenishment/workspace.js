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

    const iconDoc = '<svg style="width:20px; height:20px; flex-shrink:0; color:#2563eb;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>';
    const iconUpload = '<svg style="width:20px; height:20px; flex-shrink:0; color:#9333ea;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>';
    const iconTable = '<svg style="width:20px; height:20px; flex-shrink:0; color:#ca8a04;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>';

    let html = '';

    // 1. General Information
    html += this.buildCard('acc-general', 'General Information', iconDoc, `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        ${this.buildInput('Project Name', 'project_name', inherited.project_name || state.project_name || '')}
        ${this.buildInput('District', 'district', inherited.district || state.district || '')}
        ${this.buildInput('Tehsil', 'tehsil', state.tehsil || '')}
        ${this.buildInput('Village', 'village', state.village || '')}
        ${this.buildInput('Date of Survey', 'survey_date', state.survey_date || '', 'date')}
      </div>
    `, false, '', true);

    // 2. Location Details
    html += this.buildCard('acc-location', 'Location Details', iconDoc, `
      <div style="display:flex; flex-direction:column; gap:16px;">
        ${this.buildInput('Khasra Numbers', 'khasra_numbers', state.khasra_numbers || '')}
        ${this.buildTextarea('Coordinates (Lat/Long)', 'coordinates', state.coordinates || '', 4, 'Enter corner coordinates...')}
      </div>
    `);

    // 3. River Information
    html += this.buildCard('acc-river', 'River Information', iconDoc, `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        ${this.buildInput('River Name', 'river_name', inherited.rivers || state.river_name || '')}
        ${this.buildInput('Catchment Area (Sq. Km)', 'catchment_area', state.catchment_area || '', 'number')}
        ${this.buildInput('Stream Order', 'stream_order', state.stream_order || '')}
      </div>
    `);

    // 4. Hydrology & Geology
    html += this.buildCard('acc-hydro', 'Hydrology & Geology', iconDoc, `
      <div style="display:flex; flex-direction:column; gap:16px;">
        ${this.buildTextarea('Hydrological Characteristics (Rainfall, Flow Rate)', 'hydrology', state.hydrology || '', 3)}
        ${this.buildTextarea('Geological Characteristics (Rock Type, Bed Load)', 'geology', state.geology || '', 3)}
      </div>
    `);

    // 5. Reserve Estimation
    html += this.buildCard('acc-reserve', 'Reserve Estimation', iconTable, `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          ${this.buildInput('Replenished Area (Hectares)', 'replenishedArea', state.replenishedArea || '', 'number')}
          ${this.buildInput('Replenishment Depth (Meters)', 'replenishedDepth', state.replenishedDepth || '', 'number')}
          ${this.buildInput('Specific Gravity (Tons/m³)', 'specificGravity', state.specificGravity || '2.0', 'number')}
          ${this.buildInput('Total Estimated Replenishment (MT)', 'estimatedReplenishment', state.estimatedReplenishment || '', 'number', true)}
        </div>
        <div style="background:#eff6ff; border:1px solid #dbeafe; border-radius:8px; padding:12px; font-size:12px; color:#1e40af;">
          <strong>Calculation Rule:</strong> Area (Ha) × 10,000 × Depth (m) × Specific Gravity = Replenishment (MT)
        </div>
      </div>
    `);

    // 6. Field Observations & Recommendations
    html += this.buildCard('acc-obs', 'Observations & Recommendations', iconDoc, `
      <div style="display:flex; flex-direction:column; gap:16px;">
        ${this.buildTextarea('Field Observations', 'field_observations', state.field_observations || '', 5)}
        ${this.buildTextarea('Recommendations & Safeguards', 'recommendations', state.recommendations || '', 5)}
      </div>
    `);

    // 7. File Uploads (Images, Maps, Annexures)
    html += this.buildCard('acc-files', 'Attachments & Evidence', iconUpload, `
      <div style="display:flex; flex-direction:column; gap:24px;">
        ${this.buildUpload('Site Photographs', 'Upload .jpg, .png', 'images')}
        ${this.buildUpload('Drone / DEM Maps', 'Upload .pdf, .tif, .geojson', 'maps')}
        ${this.buildUpload('Annexure Documents', 'Upload .pdf, .docx', 'annexures')}
      </div>
    `);

    this.container.innerHTML = html;
    this.bindCalculations();
  }

  buildInput(label, field, value, type = 'text', readonly = false) {
    return `
      <div>
        <label style="font-size:12px; color:#6b7280; font-weight:600; margin-bottom:4px; display:block;">${label}</label>
        <input type="${type}" data-field="${field}" id="${field}" value="${value}" ${readonly ? 'readonly' : ''} style="width:100%; padding:10px 16px; border:1px solid #d1d5db; background:${readonly ? '#e5e7eb' : '#f9fafb'}; color:#111827; border-radius:4px; font-size:14px; box-sizing:border-box;">
      </div>
    `;
  }

  buildTextarea(label, field, value, rows = 4, placeholder = '') {
    return `
      <div>
        <label style="font-size:12px; color:#6b7280; font-weight:600; margin-bottom:4px; display:block;">${label}</label>
        <textarea data-field="${field}" id="${field}" rows="${rows}" placeholder="${placeholder}" style="width:100%; padding:10px 16px; border:1px solid #d1d5db; background:#f9fafb; color:#111827; border-radius:4px; font-size:14px; box-sizing:border-box; resize:vertical;">${value}</textarea>
      </div>
    `;
  }

  buildUpload(title, subtitle, type) {
    return `
      <div>
        <label style="font-size:12px; color:#374151; font-weight:700; margin-bottom:8px; display:block;">${title}</label>
        <div style="border:2px dashed #d1d5db; background:#f9fafb; border-radius:8px; padding:24px; text-align:center; cursor:pointer; position:relative; overflow:hidden; transition:all 0.2s;" onmouseover="this.style.borderColor='#9333ea'; this.style.background='#faf5ff';" onmouseout="this.style.borderColor='#d1d5db'; this.style.background='#f9fafb';">
          <svg style="margin:0 auto; height:32px; width:32px; color:#9ca3af;" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <div style="margin-top:12px;">
            <span style="font-size:14px; font-weight:500; color:#7e22ce;">Browse Files</span>
            <p style="font-size:12px; color:#6b7280; margin-top:4px;">${subtitle}</p>
          </div>
          <input type="file" multiple data-upload="${type}" style="position:absolute; inset:0; width:100%; height:100%; opacity:0; cursor:pointer;">
        </div>
      </div>
    `;
  }

  buildCard(id, title, icon, content, locked = false, customStyle = '', defaultOpen = false) {
    return `
      <div id="${id}" class="repl-card" style="background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; margin-bottom:20px; transition:all 0.3s; ${customStyle}">
        <div style="padding:16px 20px; border-bottom:1px solid #f3f4f6; display:flex; align-items:center; justify-content:space-between; cursor:pointer; background:#ffffff;" onclick="const contentEl = this.nextElementSibling; const chev = this.querySelector('.chevron'); if (contentEl.style.display === 'none') { contentEl.style.display = 'block'; chev.style.transform = 'rotate(180deg)'; } else { contentEl.style.display = 'none'; chev.style.transform = 'rotate(0deg)'; }">
          <h3 style="font-size:15px; font-weight:700; color:#17324D; display:flex; align-items:center; gap:12px; margin:0;">
            ${icon} ${title}
          </h3>
          ${locked 
            ? '<svg style="width:16px; height:16px; color:#9ca3af; flex-shrink:0;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>' 
            : `<svg class="chevron" style="width:20px; height:20px; color:#9ca3af; flex-shrink:0; transition:transform 0.3s; transform:${defaultOpen ? 'rotate(180deg)' : 'rotate(0deg)'};" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>`}
        </div>
        <div style="padding:24px; ${locked ? 'opacity:0.9; background:#f9fafb;' : ''} display:${defaultOpen ? 'block' : 'none'};">
          ${content}
        </div>
      </div>
    `;
  }

  bindCalculations() {
    const area = document.getElementById('replenishedArea');
    const depth = document.getElementById('replenishedDepth');
    const sg = document.getElementById('specificGravity');
    const total = document.getElementById('estimatedReplenishment');

    const calc = () => {
      if (area && depth && sg && total) {
        const a = parseFloat(area.value) || 0;
        const d = parseFloat(depth.value) || 0;
        const s = parseFloat(sg.value) || 2.0;
        if (a > 0 && d > 0) {
          total.value = (a * 10000 * d * s).toFixed(2);
          // Trigger event to bubble up for autosave/preview
          total.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          total.value = '';
        }
      }
    };

    if(area) area.addEventListener('input', calc);
    if(depth) depth.addEventListener('input', calc);
    if(sg) sg.addEventListener('input', calc);
  }
}

window.replenishmentWorkspace = new Workspace();
})();
