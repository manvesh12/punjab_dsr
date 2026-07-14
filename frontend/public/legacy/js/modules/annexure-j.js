/* ANNEXURE J - PROJECTED DEMAND OF GRAVEL */
const ANNEXURE_J_HEADERS = ['Sr. No.', 'District Name', '2022-23', '2023-24', '2024-25', '2025-26', '2026-27', '2027-28'];
const ANNEXURE_J_TEMPLATE_ROWS = [
  'Amritsar', 'Barnala', 'Bathinda', 'Faridkot', 'Fatehgarh Sahib', 'Fazilka', 'Ferozepur', 'Gurdaspur',
  'Hoshiarpur', 'Jalandhar', 'Kapurthala', 'Ludhiana', 'Malerkotla', 'Mansa', 'Moga', 'Pathankot', 'Patiala',
  'Rupnagar', 'Sahibzada Ajit Singh Nagar', 'Sangrur', 'Shaheed Bhagat Singh Nagar', 'Sri Muktsar Sahib', 'Tarn Taran'
].map((district, index) => [String(index + 1), district, '0', '0', '0', '0', '0', '0']).concat([['TOTAL', 'NA', '0', '0', '0', '0', '0', '0']]);

function getAnnexureJDemandTables() {
  if (!Array.isArray(S.annexureJDemandTables) || !S.annexureJDemandTables.length) {
    S.annexureJDemandTables = [{ id: 'annexure-j-demand', headers: ANNEXURE_J_HEADERS.slice(), rows: ANNEXURE_J_TEMPLATE_ROWS.map(row => row.slice()) }];
  }
  return S.annexureJDemandTables;
}
function annexureJValue(value) {
  const text = String(value === undefined || value === null ? '' : value).trim();
  return text === '' ? 'NA' : text;
}
function escapeAnnexureJHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function annexureJTableDomId(table, index) {
  return table.id || `annexure-j-demand${index ? `-clone-${index + 1}` : ''}`;
}
function syncAnnexureJDemandTables() {
  const container = document.getElementById('annexure-j-demand-container');
  if (!container) return;
  const tables = Array.from(container.querySelectorAll('table.annexure-j-demand-table'));
  if (!tables.length) return;
  S.annexureJDemandTables = tables.map((table, index) => ({
    id: table.id || `annexure-j-demand${index ? `-clone-${index + 1}` : ''}`,
    headers: Array.from(table.querySelectorAll('thead th')).map(th => annexureJValue(th.innerText)),
    rows: Array.from(table.querySelectorAll('tbody tr')).map(tr => Array.from(tr.cells).map(td => annexureJValue(td.innerText)))
  }));
}
function notifyAnnexureJUpdate(delay = 80) {
  syncAnnexureJDemandTables();
  if (window.debouncedSaveState) window.debouncedSaveState();
  if (typeof refreshCoreAnnexurePreview === 'function') refreshCoreAnnexurePreview('annexure-j');
  else if (window.pdfPreview?.currentView === 'annexure-j') setTimeout(() => refreshAnnexureJLivePreview(), delay);
}
function refreshAnnexureJLivePreview() {
  const requestId = (window.annexureJPreviewRequest || 0) + 1;
  window.annexureJPreviewRequest = requestId;
  const render = () => exportAnnexureJPDF(null, true, requestId).catch(error => {
    console.error('Annexure J live preview failed:', error);
    if (typeof toast === 'function') toast('Live preview could not be generated. Please try again.', 'error');
  });
  if (typeof ensurePortalVendors === 'function') ensurePortalVendors(['jspdf', 'autotable']).then(render).catch(render);
  else render();
}
function renderAnnexureJDemandTables() {
  const container = document.getElementById('annexure-j-demand-container');
  if (!container) return;
  const tables = getAnnexureJDemandTables();
  container.innerHTML = tables.map((table, index) => {
    const tableId = annexureJTableDomId(table, index);
    const headers = (table.headers?.length ? table.headers : ANNEXURE_J_HEADERS).map(header => `<th contenteditable="true">${escapeAnnexureJHtml(annexureJValue(header))}</th>`).join('');
    const rows = (table.rows?.length ? table.rows : [['1', 'NA', 'NA', 'NA', 'NA', 'NA', 'NA', 'NA']]).map(row => {
      const cells = Array.from({ length: table.headers?.length || ANNEXURE_J_HEADERS.length }, (_, cellIndex) => `<td contenteditable="true">${escapeAnnexureJHtml(annexureJValue(row[cellIndex]))}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
    return `
      <div class="annexure-j-table-block" data-table-index="${index}" style="${index ? 'margin-top:18px; padding-top:18px; border-top:1px dashed var(--border);' : ''}">
        ${index ? `<div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:10px; flex-wrap:wrap;">
          <div class="annexure-j-block-title" style="font-size:12px; font-weight:700; color:var(--text-mid);">Table ${index + 1}</div>
          <button type="button" class="btn btn-xs btn-danger annexure-j-delete-table" onclick="deleteAnnexureJTableBlock(this)" style="display:inline-flex; align-items:center; gap:6px;"><i data-lucide="trash-2" style="width:12px; height:12px;"></i><span>Delete Table</span></button>
        </div>` : ''}
        <div class="tbl-wrap">
          <table class="anx-tbl annexure-j-demand-table" id="${escapeAnnexureJHtml(tableId)}" style="min-width:960px"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>
        </div>
        <div class="section-footer" style="margin-top:12px; display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          <label class="btn btn-excel-upload btn-xs" style="cursor:pointer; display:inline-flex; align-items:center; gap:6px; margin-bottom:0;"><i data-lucide="upload" style="width:12px; height:12px;"></i><span>Upload Excel</span><input type="file" accept=".xlsx,.xls,.csv" hidden onchange="handleAnnexureJExcelUpload(event)"></label>
        </div>
      </div>`;
  }).join('');
  if (typeof addCoreAnnexureTableControls === 'function') addCoreAnnexureTableControls('annexure-j');
  if (typeof applyMoreAnnexureAccess === 'function') applyMoreAnnexureAccess(document.getElementById('view-annexure-j'));
  if (typeof makeAllSectionTitlesEditable === 'function') {
    makeAllSectionTitlesEditable('annexure-j');
  }
  if (window.initLucide) window.initLucide();
}
function renderAnnexureJ() {
  renderAnnexureJDemandTables();
  renderAttachmentUploadUIAnnexureJ();
}
function addAnnexureJTableBlock() {
  syncAnnexureJDemandTables();
  const tables = getAnnexureJDemandTables();
  tables.push({
    id: `annexure-j-demand-clone-${Date.now()}`,
    headers: ANNEXURE_J_HEADERS.slice(),
    rows: ANNEXURE_J_TEMPLATE_ROWS.map(row => row.slice())
  });
  renderAnnexureJDemandTables();
  notifyAnnexureJUpdate();
}
function deleteAnnexureJTableBlock(button) {
  const block = button?.closest('.annexure-j-table-block');
  const index = Number(block?.dataset.tableIndex);
  if (!block || !Number.isInteger(index) || index <= 0) return;
  syncAnnexureJDemandTables();
  S.annexureJDemandTables.splice(index, 1);
  renderAnnexureJDemandTables();
  notifyAnnexureJUpdate();
  if (typeof toast === 'function') toast('Table deleted.', 'success');
}
function handleAnnexureJExcelUpload(event) {
  const file = event.target.files?.[0];
  const table = event.target.closest('.annexure-j-table-block')?.querySelector('table');
  if (!file || !table) return;
  const reader = new FileReader();
  reader.onload = evt => {
    try {
      const workbook = XLSX.read(new Uint8Array(evt.target.result), { type: 'array' });
      const sheetName = workbook.SheetNames.find(name => String(name).trim().toLowerCase() === 'demand table') || workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      const validRows = rows.filter(row => row.some(cell => String(cell ?? '').trim() !== ''));
      const headerIndex = validRows.findIndex(row => row.some(cell => /district\s*name/i.test(String(cell ?? ''))));
      const dataRows = validRows.slice(headerIndex >= 0 ? headerIndex + 1 : 0);
      if (!dataRows.length) throw new Error('No data rows found.');
      const headers = Array.from(table.querySelectorAll('thead th'));
      const tbody = table.querySelector('tbody');
      tbody.innerHTML = dataRows.map((row, rowIndex) => `<tr>${headers.map((_, columnIndex) => {
        const fallback = columnIndex === 0 ? String(rowIndex + 1) : 'NA';
        return `<td contenteditable="true">${escapeAnnexureJHtml(annexureJValue(row[columnIndex] ?? fallback))}</td>`;
      }).join('')}</tr>`).join('');
      notifyAnnexureJUpdate();
      if (typeof toast === 'function') toast(`Loaded ${dataRows.length} row(s) from ${sheetName}.`, 'success');
    } catch (error) {
      console.error(error);
      if (typeof toast === 'function') toast('Error parsing file. Please upload a valid Excel or CSV file.', 'error');
    }
    event.target.value = '';
  };
  reader.readAsArrayBuffer(file);
}
function downloadAnnexureJTemplate() {
  if (!window.XLSX) {
    if (typeof ensurePortalVendor === 'function') ensurePortalVendor('xlsx').then(downloadAnnexureJTemplate);
    return;
  }
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([ANNEXURE_J_HEADERS, ...ANNEXURE_J_TEMPLATE_ROWS]);
  worksheet['!cols'] = [{ wch: 10 }, { wch: 32 }, ...Array(6).fill({ wch: 13 })];
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Demand Table');
  XLSX.writeFile(workbook, 'Projected_Demand_Gravel_Template.xlsx');
}
function getAnnexureJAttachments() {
  return (Array.isArray(S.annexureJ) ? S.annexureJ : []).filter(item => Array.isArray(item?.pages) && item.pages.length);
}
function renderAttachmentUploadUIAnnexureJ() {
  const el = document.getElementById('annexure-j-attachment-info');
  if (!el) return;
  const attachments = getAnnexureJAttachments();
  el.innerHTML = attachments.length ? attachments.map(item => `<div class="file-item" style="background:var(--off); border:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; gap:10px; padding:8px 12px; border-radius:var(--r-sm); margin-top:6px;"><div><strong style="font-size:12px;">${escapeAnnexureJHtml(item.fileName || item.name || 'Supporting file')}</strong><div style="font-size:10px; color:var(--text-faint);">${escapeAnnexureJHtml(item.fileSize || '')} Â· ${item.pages.length} page(s)</div></div><button type="button" class="btn btn-xs btn-danger" onclick="deleteAttachmentAnnexureJ(${Number(item.id)})">Remove</button></div>`).join('') : '<div style="font-size:12px; color:var(--text-faint);">No supporting PDF or image uploaded.</div>';
}
function handleAttachmentUploadAnnexureJ(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const entry = { id: Date.now(), name: file.name, fileName: file.name, fileSize: `${(file.size / 1024).toFixed(1)} KB`, pages: [] };
  const complete = () => {
    if (!Array.isArray(S.annexureJ)) S.annexureJ = [];
    S.annexureJ.push(entry);
    renderAttachmentUploadUIAnnexureJ();
    notifyAnnexureJUpdate();
    if (typeof toast === 'function') toast('Supporting file added to Annexure J.', 'success');
    event.target.value = '';
  };
  if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
    if (typeof renderPdfToImages !== 'function') { if (typeof toast === 'function') toast('PDF renderer is not available.', 'error'); return; }
    renderPdfToImages(file, (error, pages) => {
      if (error || !pages?.length) { console.error(error); if (typeof toast === 'function') toast('PDF render failed. Please try another file.', 'error'); return; }
      entry.pages = pages;
      complete();
    });
    return;
  }
  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = evt => { entry.pages = [evt.target.result]; complete(); };
    reader.readAsDataURL(file);
    return;
  }
  if (typeof toast === 'function') toast('Unsupported file format. Please upload a PDF or image.', 'error');
  event.target.value = '';
}
function deleteAttachmentAnnexureJ(id) {
  S.annexureJ = (S.annexureJ || []).filter(item => Number(item.id) !== Number(id));
  renderAttachmentUploadUIAnnexureJ();
  notifyAnnexureJUpdate();
}
function extractAnnexureJTable(table) {
  const headers = Array.from(table?.querySelectorAll('thead th') || []).map(th => annexureJValue(th.innerText));
  const rows = Array.from(table?.querySelectorAll('tbody tr') || []).map(tr => Array.from(tr.cells).map(td => annexureJValue(td.innerText)));
  const visibleColumns = headers.map((header, index) => index).filter(index => headers[index] && (headers[index] !== 'NA' || rows.some(row => row[index] && row[index] !== 'NA')));
  return { headers: visibleColumns.map(index => headers[index]), rows: rows.map(row => visibleColumns.map(index => row[index] || 'NA')) };
}
function loadAnnexureJImage(src) {
  return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = src; });
}
async function appendAnnexureJAttachmentPages(doc) {
  for (const attachment of getAnnexureJAttachments()) {
    for (const src of attachment.pages) {
      const image = await loadAnnexureJImage(src);
      doc.addPage('a4', 'p');
      const width = doc.internal.pageSize.getWidth(); const height = doc.internal.pageSize.getHeight(); const margin = 24;
      const ratio = Math.min((width - margin * 2) / image.width, (height - margin * 2) / image.height);
      const drawWidth = image.width * ratio; const drawHeight = image.height * ratio;
      doc.addImage(src, String(src).startsWith('data:image/png') ? 'PNG' : 'JPEG', (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
    }
  }
}
async function exportAnnexureJPDF(btn, isLivePreview = false, previewRequestId = null, returnBlob = false) {
  if (typeof btn === 'boolean') { isLivePreview = btn; btn = null; }
  if (isLivePreview && !returnBlob) {
    if (window.pdfPreview && window.pdfPreview.currentView === 'annexure-j') {
      window.pdfPreview.generateAnnexureLivePreview('annexure-j', 0);
      return;
    }
  }
  const requestId = isLivePreview ? (previewRequestId || ((window.annexureJPreviewRequest || 0) + 1)) : null;
  if (isLivePreview && previewRequestId === null) window.annexureJPreviewRequest = requestId;
  if (!window.jspdf?.jsPDF || !window.jspdf.jsPDF.API.autoTable) await ensurePortalVendors(['jspdf', 'autotable']);
  if (!document.querySelector('#annexure-j-demand-container table.annexure-j-demand-table')) renderAnnexureJDemandTables();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'pt', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth(); const pageHeight = doc.internal.pageSize.getHeight();
  const district = (S.activeProject && S.activeProject.district) || 'Jalandhar'; const state = (S.activeProject && S.activeProject.state) || 'Punjab';
  const border = { x: 18, y: 10, w: pageWidth - 36, h: pageHeight - 20 };
  const tableLeft = 36; const tableWidth = pageWidth - tableLeft * 2; const headerLeft = tableLeft + 4; const footerY = pageHeight - 38; const contentTop = 72; let startY = contentTop;
  const drawFrame = data => {
    if (!returnBlob) {
      doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.6); doc.rect(border.x, border.y, border.w, border.h);
      doc.setFont('times', 'italic'); doc.setFontSize(10); doc.setTextColor(0, 0, 0); doc.text('District Survey Report', headerLeft, 27); doc.text(`${district} District`, headerLeft, 39); doc.text(state, headerLeft, 51);
      doc.setLineWidth(0.4); doc.line(headerLeft, 62, pageWidth - 22, 62); doc.setFont('times', 'normal'); doc.setFontSize(8);
      const footerText1 = `PREPARED BY: SUB-DIVISIONAL COMMITTEE OF ${district.toUpperCase()} DISTRICT`;
      const footerText2 = `ASSISTED BY: RSP GREEN DEVELOPMENT AND LABORATORIES PVT. LTD`;
      doc.text(footerText1, pageWidth / 2, footerY - 2, { align: 'center' });
      doc.text(footerText2, pageWidth / 2, footerY + 10, { align: 'center' });
      doc.setFontSize(10); doc.text(String(490 + data.pageNumber), pageWidth - 18, pageHeight - 12, { align: 'right' });
    }
  };
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('Supporting PDF / Image Upload:', tableLeft, startY);
  startY += 14;
  const jAttachmentPages = getAnnexureJAttachments().flatMap(attachment => attachment.pages || []);
  startY = await drawAnnexureInlineAttachmentPages(doc, jAttachmentPages, startY, {
    left: tableLeft,
    right: tableLeft,
    top: contentTop,
    bottom: 46,
    maxWidth: tableWidth,
    maxHeight: 390,
    onNewPage: () => {
      doc.addPage();
      drawFrame({ pageNumber: doc.getCurrentPageInfo().pageNumber });
      return contentTop;
    }
  });
  const tables = Array.from(document.querySelectorAll('#annexure-j-demand-container table.annexure-j-demand-table'));
  tables.forEach((table, index) => {
    const titleHeight = 14;
    if (startY + titleHeight + 46 > pageHeight - 40) { doc.addPage(); drawFrame({ pageNumber: doc.getCurrentPageInfo().pageNumber }); startY = contentTop; }
    doc.setFont('times', 'bold'); doc.setFontSize(11); doc.setTextColor(0, 0, 0); doc.text(index ? `Projected Demand of Gravel - Table ${index + 1}` : 'Projected Demand of Gravel:', tableLeft, startY);
    startY += titleHeight;
    const data = extractAnnexureJTable(table);
    doc.autoTable({ startY, head: [data.headers], body: data.rows, theme: 'grid', styles: { font: 'times', fontSize: 8.5, textColor: 0, lineColor: 0, lineWidth: 0.4, cellPadding: 2.5, valign: 'middle', halign: 'left', overflow: 'linebreak', minCellHeight: 0 }, headStyles: { fillColor: false, fontStyle: 'bold', halign: 'center', valign: 'middle', textColor: 0, lineColor: 0, lineWidth: 0.4, cellPadding: 2.5 }, margin: { top: startY, bottom: 40, left: tableLeft, right: tableLeft }, tableWidth, didDrawPage: drawFrame });
    startY = doc.lastAutoTable.finalY + 18;
  });
  if (returnBlob) return doc.output('blob');
  if (isLivePreview) {
    if (requestId !== window.annexureJPreviewRequest) return;
    const blob = doc.output('blob');
    const blobUrl = URL.createObjectURL(blob);
    if (window.pdfPreview && window.pdfPreview.currentView === 'annexure-j') {
      window.pdfPreview.renderPdfBlob(blobUrl);
      return;
    }
    const iframe = window.getAnnexurePreviewIframe ? window.getAnnexurePreviewIframe('annexure-j') : document.getElementById('pdf-iframe-annexure-j-preview');
    if (iframe) {
      iframe.removeAttribute('srcdoc');
      iframe.src = blobUrl;
    }
  } else {
    doc.save('Annexure_J_Projected_Demand_of_Gravel.pdf');
    if (typeof toast === 'function') toast('PDF downloaded successfully!', 'success');
  }
}
document.addEventListener('input', event => { if (event.target.closest('#view-annexure-j table')) { clearTimeout(window.anxJDebounceTimer); window.anxJDebounceTimer = setTimeout(() => notifyAnnexureJUpdate(), 180); } });
document.addEventListener('blur', event => { const cell = event.target.closest('#view-annexure-j td, #view-annexure-j th'); if (cell && !String(cell.innerText || '').trim()) { cell.innerText = 'NA'; notifyAnnexureJUpdate(); } }, true);
document.addEventListener('click', event => { if (event.target.closest('#view-annexure-j .anx-live-add-row, #view-annexure-j .anx-live-add-column')) setTimeout(() => notifyAnnexureJUpdate(), 0); });
window.renderAnnexureJ = renderAnnexureJ;
window.addAnnexureJTableBlock = addAnnexureJTableBlock;
window.deleteAnnexureJTableBlock = deleteAnnexureJTableBlock;
window.handleAnnexureJExcelUpload = handleAnnexureJExcelUpload;
window.downloadAnnexureJTemplate = downloadAnnexureJTemplate;
window.handleAttachmentUploadAnnexureJ = handleAttachmentUploadAnnexureJ;
window.deleteAttachmentAnnexureJ = deleteAttachmentAnnexureJ;
window.exportAnnexureJPDF = exportAnnexureJPDF;
window.refreshAnnexureJLivePreview = refreshAnnexureJLivePreview;

;
