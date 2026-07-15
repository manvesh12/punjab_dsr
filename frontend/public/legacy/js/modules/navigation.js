/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   NAVIGATION & UTILS
 â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
let viewHistory = [];
let currentViewId = 'dashboard';
let isSidebarPinned = false;
let sidebarTimer;
function setSidebarCollapsed(collapsed) {
  collapsed = Boolean(collapsed);
  clearTimeout(sidebarTimer);
  const sidebar = document.getElementById('sidebar');
  const isMobileShell = window.matchMedia && window.matchMedia('(max-width: 1280px)').matches;
  if (isMobileShell) {
    if (sidebar) sidebar.classList.toggle('mobile-open', !collapsed);
    document.body.classList.toggle('mobile-sidebar-open', !collapsed);
  } else if (sidebar) {
    sidebar.classList.remove('mobile-open');
    document.body.classList.remove('mobile-sidebar-open');
  }
  const isCollapsed = document.body.classList.contains('sidebar-hidden');
  if (isCollapsed !== collapsed) {
    document.body.classList.toggle('sidebar-hidden', collapsed);
  }
  isSidebarPinned = !collapsed;
  const toggleBtn = document.getElementById('tb-sidebar-toggle');
  if (toggleBtn) {
    toggleBtn.setAttribute('aria-expanded', String(!collapsed));
    toggleBtn.setAttribute('aria-label', collapsed ? 'Open navigation menu' : 'Close navigation menu');
    toggleBtn.setAttribute('title', collapsed ? 'Open navigation' : 'Close navigation');
  }
  try {
    localStorage.setItem('dsr_sidebar_collapsed', collapsed ? '1' : '0');
  } catch (_) {}
}
function toggleSidebar(event) {
  if (event && typeof event.preventDefault === 'function') event.preventDefault();
  if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
  const sidebar = document.getElementById('sidebar');
  const isMobileShell = window.matchMedia && window.matchMedia('(max-width: 1280px)').matches;
  const shouldCollapse = isMobileShell
    ? Boolean(sidebar && sidebar.classList.contains('mobile-open'))
    : !document.body.classList.contains('sidebar-hidden');
  setSidebarCollapsed(shouldCollapse);
  return false;
}
function closeMobileSidebar() {
  if (window.matchMedia && window.matchMedia('(max-width: 1280px)').matches) {
    setSidebarCollapsed(true);
  }
}
function expandSidebar() {
  if (isSidebarPinned) return;
  clearTimeout(sidebarTimer);
}
function collapseSidebar() {
  if (isSidebarPinned) return;
  clearTimeout(sidebarTimer);
}
window.addEventListener('resize', () => {
  const sidebar = document.getElementById('sidebar');
  if (window.matchMedia && !window.matchMedia('(max-width: 1280px)').matches) {
    if (sidebar) sidebar.classList.remove('mobile-open');
    document.body.classList.remove('mobile-sidebar-open');
  }
});
document.addEventListener('click', (event) => {
  if (!document.body.classList.contains('mobile-sidebar-open')) return;
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('tb-sidebar-toggle');
  const target = event.target;
  if (sidebar && sidebar.contains(target)) return;
  if (toggleBtn && toggleBtn.contains(target)) return;
  closeMobileSidebar();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && document.body.classList.contains('mobile-sidebar-open')) {
    closeMobileSidebar();
  }
});
const initialHash = window.location.hash ? window.location.hash.slice(1).trim() : null;
const initialView = initialHash && document.getElementById('view-' + initialHash) ? initialHash : currentViewId;
if (history.state === null) {
  currentViewId = initialView;
  history.replaceState({ viewId: currentViewId }, '', '#' + currentViewId);
}
window.addEventListener('popstate', (event) => {
  if (event.state && event.state.viewId) {
    const idx = viewHistory.indexOf(event.state.viewId);
    if (idx !== -1) {
      viewHistory = viewHistory.slice(0, idx);
    }
    showView(event.state.viewId, null, false);
  } else {
    viewHistory = [];
    showView('dashboard', null, false);
  }
});
async function initApp() {
  if (typeof currentDistrictFilter !== 'undefined' && !S.activeProject) currentDistrictFilter = 'ALL';
  try {
    if (typeof refreshProjectsFromBackend === 'function') {
      await refreshProjectsFromBackend(false);
    } else {
      const data = await apiFetch('/projects');
      S.projects = Array.isArray(data) ? data : (Array.isArray(data?.value) ? data.value : []);
      S.projectLoadError = '';
    }
  } catch (err) {
    console.error('Failed to load projects from backend:', err);
    S.projectLoadError = err.message || 'Failed to load projects from backend';
    if (typeof toast === 'function') toast('Projects could not load: ' + S.projectLoadError, 'error');
  }
  try {
    const reports = await apiFetch('/reports');
    if (reports && Array.isArray(reports)) {
      S.projects.forEach(p => {
        const rep = reports.find(r => r.projectId === p.id);
        if (rep) p.reportStatus = rep.status;
      });
      if (typeof syncNotificationsAndReviewStatus === 'function') {
        syncNotificationsAndReviewStatus();
      } else {
        const returned = reports.filter(r => r.status === 'RETURNED' || r.status === 'REJECTED');
        updateNotificationUI(returned);
      }
    }
  } catch (err) {
    console.error('Failed to load reports for notifications', err);
  }
  renderDashboard();
  renderProjects();
  if (typeof updateRolePermissionUI === 'function') updateRolePermissionUI();
  const projectBadge = document.getElementById('badge-projs');
  if (projectBadge) projectBadge.textContent = S.projects.length;
  const pendingSigsBadge = document.getElementById('sb-pending-sigs');
  if (pendingSigsBadge) pendingSigsBadge.textContent = S.signatures.filter(s => !s.signed).length;
}
window.scrollToSection = function (viewId, sectionId, parentBtn) {
  showView(viewId, parentBtn);
  setTimeout(() => {
    const el = document.getElementById(sectionId);
    if (el) {
      const card = el.closest('.card') || el;
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const oldBg = card.style.backgroundColor;
      card.style.transition = 'background-color 0.5s ease';
      card.style.backgroundColor = 'var(--yellow-lt)';
      setTimeout(() => {
        card.style.backgroundColor = oldBg;
      }, 1500);
    }
  }, 150);
};
window.toggleSubMenu = function (id) {
  const el = document.getElementById(id);
  if (!el) return;
  const isVisible = el.style.display === 'block';
  document.querySelectorAll('.flyout-menu').forEach(m => m.style.display = 'none');
  if (!isVisible) {
    el.style.display = 'block';
  }
};
window.toggleMoreAnnexuresInline = function () {
  const el = document.getElementById('inline-more-annexures');
  if (!el) return;
  const isVisible = el.style.display === 'flex';
  el.style.display = isVisible ? 'none' : 'flex';
};
function isAnnexureViewId(id) {
  return /^anx[1-7]$/.test(id) || /^annexure-[b-k]$/.test(id);
}
function isCoreAnnexureViewId(id) {
  return /^anx[1-7]$/.test(id) || id === 'annexure-f' || id === 'annexure-j' || id === 'annexure-k';
}
function isFullWidthAnnexureEntryView(id) {
  return isCoreAnnexureViewId(id) || /^annexure-[b-eghi]$/.test(id);
}
function getAnnexureInstructionText(id) {
  const map = {
    anx1: 'Fill the source tables, upload section Excel files where needed, and use the live preview to check Annexure I before download.',
    anx2: 'Maintain lease, patta land, de-siltation, and M-Sand tables. Totals and generated PDF preview update from the table data.',
    anx3: 'Review cluster and continuation details, keep rows complete, and verify the generated Annexure III in the right preview.',
    anx4: 'Maintain individual lease routes first, then cluster transportation routes. Check the right-side preview before downloading.',
    anx5: 'Maintain Bench Mark and CORS point data. Upload Excel where useful and verify the generated Annexure V preview.',
    anx6: 'Maintain final cluster details and supporting values, then confirm the generated Annexure VI preview before download.',
    anx7: 'Maintain individual route tables first, then cluster route tables. Use the right-side preview to verify Annexure VII.',
    'annexure-f': 'Download Excel templates for each section, fill tables, then upload supporting PDF/image if needed. Verify the generated Annexure F preview.',
    'annexure-j': 'Use the Projected Demand of Gravel Excel template or upload a completed Demand Table. Add rows, columns, or independent tables as needed, then verify the generated PDF preview.',
    'annexure-k': 'Upload supporting PDF/image if required, then maintain Proforma Auctioned Sites and Annexure A tables. Verify the final merged preview.'
  };
  return map[id] || `Upload and manage ${id.replace('annexure-', 'Annexure ').toUpperCase()} entries. Use the right-side preview to check the final output.`;
}
function buildAnnexureInstructions(id) {
  const wrap = document.createElement('div');
  wrap.className = 'annexure-line-instructions';
  wrap.innerHTML = `
    <div class="card annexure-instructions-card">
      <div class="card-hd">
        <div class="card-title">Instructions</div>
      </div>
      <div class="card-bd">
        <p>${getAnnexureInstructionText(id)}</p>
      </div>
    </div>`;
  return wrap;
}
function normalizeAnnexureViewLayout(id) {
  if (!isAnnexureViewId(id)) return;
  const view = document.getElementById('view-' + id);
  if (!view) return;
  const shouldHideInstructions = isFullWidthAnnexureEntryView(id);
  const existingLayout = view.querySelector(':scope > .annexure-unified-layout, :scope > .annexure-line-layout, :scope > .g2');
  if (existingLayout) {
    existingLayout.classList.add('annexure-unified-layout', 'annexure-line-layout');
    const cols = Array.from(existingLayout.children);
    if (cols[0]) cols[0].classList.add('annexure-line-main');
    let instructions = existingLayout.querySelector(':scope > .annexure-line-instructions');
    if (!instructions && cols[1]) {
      cols[1].classList.add('annexure-line-instructions');
      instructions = cols[1];
    }
    if (shouldHideInstructions) {
      existingLayout.querySelectorAll(':scope > .annexure-line-instructions').forEach(panel => panel.remove());
      existingLayout.classList.add('annexure-no-instructions');
      existingLayout.style.gridTemplateColumns = 'minmax(0, 1fr)';
      if (cols[0]) cols[0].style.width = '100%';
    } else if (!instructions) {
      existingLayout.appendChild(buildAnnexureInstructions(id));
    }
    return;
  }
  const header = view.querySelector(':scope > .header-row');
  const layout = document.createElement('div');
  layout.className = 'g2 annexure-unified-layout annexure-line-layout';
  const main = document.createElement('div');
  main.className = 'annexure-line-main';
  Array.from(view.children).forEach(child => {
    if (child === header) return;
    main.appendChild(child);
  });
  layout.appendChild(main);
  if (shouldHideInstructions) {
    layout.classList.add('annexure-no-instructions');
    layout.style.gridTemplateColumns = 'minmax(0, 1fr)';
  } else {
    layout.appendChild(buildAnnexureInstructions(id));
  }
  if (header && header.nextSibling) {
    view.insertBefore(layout, header.nextSibling);
  } else {
    view.appendChild(layout);
  }
}
function refreshCoreAnnexurePreview(id) {
  if (id && id.startsWith('annexure-')) {
    if (window.pdfPreview && window.pdfPreview.currentView === id) {
      if (id === 'annexure-f' || id === 'annexure-j' || id === 'annexure-k') {
        window.pdfPreview.generateAnnexureLivePreview(id, 80);
        return;
      }
      const fn = {
        'annexure-f': window.exportAnnexureFPDF,
        'annexure-j': window.exportAnnexureJPDF,
        'annexure-k': window.exportAnnexureKPDF
      }[id];
      if (typeof fn === 'function') {
        const run = () => fn(null, true);
        if (typeof ensurePortalVendors === 'function') {
          ensurePortalVendors(['jspdf', 'autotable']).then(run).catch(err => {
            console.error('Live preview tools failed:', err);
            if (typeof toast === 'function') toast('Live preview tools could not load.', 'error');
          });
        } else {
          run();
        }
      } else {
        window.pdfPreview.refresh();
      }
    }
    return;
  }
  if (window.pdfPreview && typeof window.pdfPreview.generateAnnexureLivePreview === 'function') {
    window.pdfPreview.generateAnnexureLivePreview(id, 80);
    return;
  }
  const fn = {
    anx1: window.exportAnx1PDF,
    anx2: window.exportAnx2PDF,
    anx3: window.exportAnx3PDF,
    anx4: window.exportAnx4PDF,
    anx5: window.exportAnx5PDF,
    anx6: window.exportAnx6PDF,
    anx7: window.exportAnx7PDF,
    'annexure-f': window.exportAnnexureFPDF,
    'annexure-j': window.exportAnnexureJPDF,
    'annexure-k': window.exportAnnexureKPDF
  }[id];
  if (typeof fn !== 'function') return;
  const run = () => fn(null, true);
  if (typeof ensurePortalVendors === 'function') {
    ensurePortalVendors(['jspdf', 'autotable']).then(run).catch(err => {
      console.error('Live preview tools failed:', err);
      if (typeof toast === 'function') toast('Live preview tools could not load.', 'error');
    });
  } else {
    setTimeout(run, 80);
  }
}
function setScopedText(root, selector, value) {
  const el = root?.querySelector?.(selector);
  if (el) el.textContent = value;
}
function sumTableColumn(table, index) {
  let total = 0;
  table?.querySelectorAll?.('tbody tr').forEach(tr => {
    total += parseFloat(String(tr.cells[index]?.innerText || '').replace(/,/g, '')) || 0;
  });
  return total;
}
function recalcKnownAnnexureTable(table, changedCell = null) {
  if (!table) return;
  const id = table.id || '';
  const changedIndex = changedCell ? Array.from(changedCell.parentElement?.children || []).indexOf(changedCell) : -1;
  const rows = Array.from(table.querySelectorAll('tbody tr'));
  const isChanged = (...indices) => changedIndex < 0 || indices.includes(changedIndex);
  if ((id.startsWith('anx2-leases') || id.startsWith('anx5-mining')) && isChanged(4, id.startsWith('anx2') ? 9 : 10, id.startsWith('anx2') ? 10 : 11)) {
    rows.forEach(tr => {
      const cells = tr.cells;
      const area = parseFloat(cells[4]?.innerText) || 0;
      const bulkDensity = parseFloat(cells[id.startsWith('anx2') ? 9 : 10]?.innerText) || 0;
      const depth = parseFloat(cells[id.startsWith('anx2') ? 10 : 11]?.innerText) || 0;
      const gross = area * 10000 * depth * bulkDensity;
      const net = gross * 0.60;
      const grossCell = cells[id.startsWith('anx2') ? 11 : 12];
      const netCell = cells[id.startsWith('anx2') ? 12 : 13];
      if (grossCell) grossCell.innerText = gross > 0 ? gross.toFixed(2) : '0.00';
      if (netCell) netCell.innerText = net > 0 ? net.toFixed(2) : '0.00';
    });
  }
  if ((id.startsWith('anx2-patta') || id.startsWith('anx5-patta')) && isChanged(3)) {
    rows.forEach(tr => {
      const cells = tr.cells;
      const area = parseFloat(cells[3]?.innerText) || 0;
      const reserve = Math.round(area * 10000 * 3 * 1.52);
      const mineral = Math.round(reserve * 0.60);
      if (cells[9]) cells[9].innerText = reserve;
      if (cells[10]) cells[10].innerText = mineral;
    });
  }
  if ((id.includes('cluster') || table.closest('#view-anx3, #view-anx6')) && table.querySelectorAll('thead th').length === 9 && isChanged(6)) {
    rows.forEach(tr => {
      const excav = parseFloat(String(tr.cells[6]?.innerText || '').replace(/,/g, '')) || 0;
      if (tr.cells[7]) tr.cells[7].innerText = (excav * 0.6).toFixed(2);
    });
  }
  if (id.startsWith('anx2-patta')) {
    setScopedText(table, 'tfoot [id^="patta-sum-area"]', sumTableColumn(table, 3).toFixed(2));
    setScopedText(table, 'tfoot [id^="patta-sum-reserve"]', sumTableColumn(table, 9).toFixed(0));
    setScopedText(table, 'tfoot [id^="patta-sum-mineral"]', sumTableColumn(table, 10).toFixed(2));
  } else if (id.startsWith('anx2-desilt')) {
    setScopedText(table, 'tfoot [id^="desilt-sum-size"]', sumTableColumn(table, 7).toFixed(2));
  } else if (id.startsWith('anx5-mining')) {
    setScopedText(table, 'tfoot [id^="mining-total-area"]', sumTableColumn(table, 4).toFixed(2));
    setScopedText(table, 'tfoot [id^="mining-total-exc"]', sumTableColumn(table, 12).toFixed(2));
    setScopedText(table, 'tfoot [id^="mining-total-exc60"]', sumTableColumn(table, 13).toFixed(2));
  } else if (id.startsWith('anx5-patta')) {
    setScopedText(table, 'tfoot [id^="patta-total-area"]', sumTableColumn(table, 3).toFixed(2));
    setScopedText(table, 'tfoot [id^="patta-total-res"]', sumTableColumn(table, 9).toFixed(0));
    setScopedText(table, 'tfoot [id^="patta-total-min"]', sumTableColumn(table, 10).toFixed(2));
  } else if (id.startsWith('anx5-desilt')) {
    setScopedText(table, 'tfoot [id^="desilt-total-size"]', sumTableColumn(table, 7).toFixed(2));
  }
  const headerCount = table.querySelectorAll('thead th').length;
  const totalRow = table.querySelector('tfoot tr');
  if (totalRow && headerCount === 9 && table.closest('#view-anx3, #view-anx6')) {
    const cells = totalRow.cells;
    if (cells[1]) cells[1].textContent = sumTableColumn(table, 5).toFixed(2);
    if (cells[2]) cells[2].textContent = sumTableColumn(table, 6).toFixed(2);
    if (cells[3]) cells[3].textContent = sumTableColumn(table, 7).toFixed(2);
  } else if (totalRow && headerCount === 10 && table.closest('#view-anx3, #view-anx6')) {
    const cells = totalRow.cells;
    if (cells[1]) cells[1].textContent = sumTableColumn(table, 7).toFixed(2);
    if (cells[2]) cells[2].textContent = sumTableColumn(table, 8).toFixed(2);
  }
}
function recalcKnownAnnexureTablesIn(root) {
  root?.querySelectorAll?.('table').forEach(table => recalcKnownAnnexureTable(table));
}
function normalizeClonedAnnexureRowButtons(root) {
  root?.querySelectorAll?.('tbody button[onclick]').forEach(button => {
    const onclick = button.getAttribute('onclick') || '';
    if (/delCluster|delCont|deleteClusterRowAnx6|deleteContiguousRowAnx6/.test(onclick)) {
      button.setAttribute('onclick', "delRow(this); setTimeout(() => recalcKnownAnnexureTable(this.closest('table')), 20)");
    }
  });
}
function addGenericAnnexureRow(table, viewId) {
  const tbody = table ? table.querySelector('tbody') : null;
  if (!tbody) return;
  const templateRow = tbody.rows[tbody.rows.length - 1];
  const columnCount = table.querySelectorAll('thead th').length || templateRow?.cells.length || 1;
  const tr = document.createElement('tr');
  for (let i = 0; i < columnCount; i++) {
    const sourceCell = templateRow ? templateRow.cells[i] : null;
    const td = document.createElement('td');
    if (sourceCell && sourceCell.querySelector('button')) {
      td.innerHTML = sourceCell.innerHTML;
    } else if (sourceCell && sourceCell.querySelector('select')) {
      td.innerHTML = sourceCell.innerHTML;
      td.querySelectorAll('select').forEach(select => { select.selectedIndex = 0; });
    } else {
      td.contentEditable = 'true';
      td.textContent = i === 0 && /s[lr]\.?\s*no\.?|serial/i.test(table.querySelectorAll('thead th')[0]?.innerText || '') ? String(tbody.rows.length + 1) : 'NA';
    }
    tr.appendChild(td);
  }
  tbody.appendChild(tr);
  normalizeClonedAnnexureRowButtons(tr);
  if (window.initLucide) window.initLucide();
  recalcKnownAnnexureTable(table);
  if (window.debouncedSaveState) window.debouncedSaveState();
  refreshCoreAnnexurePreview(viewId);
}
function addGenericAnnexureColumn(table, viewId) {
  if (!table) return;
  const headerRow = table.querySelector('thead tr');
  const actionHeader = headerRow ? Array.from(headerRow.children).find(th => th.classList.contains('no-print') || /action/i.test(th.innerText || '')) : null;
  const th = document.createElement('th');
  th.contentEditable = 'true';
  th.textContent = 'New Column';
  th.style.minWidth = '120px';
  if (headerRow) headerRow.insertBefore(th, actionHeader || null);
  table.querySelectorAll('tbody tr').forEach(row => {
    const actionCell = Array.from(row.children).find(td => td.querySelector('button') || td.classList.contains('no-print'));
    const td = document.createElement('td');
    td.contentEditable = 'true';
    td.textContent = 'NA';
    row.insertBefore(td, actionCell || null);
  });
  table.querySelectorAll('tfoot tr').forEach(row => {
    const actionCell = Array.from(row.children).find(td => td.querySelector('button') || td.classList.contains('no-print'));
    const td = document.createElement('td');
    td.contentEditable = 'true';
    td.textContent = 'NA';
    row.insertBefore(td, actionCell || null);
  });
  recalcKnownAnnexureTable(table);
  if (typeof makeAllSectionTitlesEditable === 'function') makeAllSectionTitlesEditable(viewId);
  if (typeof enforceActiveViewHierarchy === 'function') enforceActiveViewHierarchy(true);
  if (window.debouncedSaveState) window.debouncedSaveState();
  refreshCoreAnnexurePreview(viewId);
}
function getViewIdForAnnexureElement(el) {
  const view = el?.closest?.('.view[id^="view-"]');
  return view ? view.id.replace(/^view-/, '') : currentViewId;
}
function scheduleCoreAnnexureRefreshFromElement(el, delay = 100) {
  const id = getViewIdForAnnexureElement(el);
  if (!isCoreAnnexureViewId(id)) return;
  clearTimeout(window.__coreAnnexureRefreshTimer);
  window.__coreAnnexureRefreshTimer = setTimeout(() => refreshCoreAnnexurePreview(id), delay);
}
function addGenericAnnexureRowFromButton(btn) {
  const table = btn?.closest?.('.annexure-f-table-block, .annexure-k-table-block, .table-block-card, .anx-section, .card')?.querySelector('table');
  addGenericAnnexureRow(table, getViewIdForAnnexureElement(btn));
}
function addGenericTableBlockFromSelector(selector) {
  const block = document.querySelector(selector);
  const btn = block?.querySelector?.('button[onclick*="addGenericTableBlock"]');
  if (btn) addGenericTableBlock(btn);
}
function annexureTableSelectorForPrefix(viewId, baseId) {
  const safeViewId = String(viewId || '').replace(/"/g, '\\"');
  const safeBaseId = String(baseId || '').replace(/"/g, '\\"');
  return `#view-${safeViewId} table[id^="${safeBaseId}"]`;
}
function annexureTablesByPrefix(viewId, baseId) {
  return Array.from(document.querySelectorAll(annexureTableSelectorForPrefix(viewId, baseId)));
}
let annexureCloneSequence = 0;
function uniqueAnnexureCloneId(baseId, suffix) {
  const cleanBase = String(baseId || 'annexure-table').replace(/-clone-\d+(?:-\d+)+$/, '');
  let id;
  do {
    annexureCloneSequence += 1;
    id = `${cleanBase}-clone-${Date.now()}-${annexureCloneSequence}-${suffix}`;
  } while (document.getElementById(id));
  return id;
}
function rewriteInlineReferences(root, idMap) {
  [root, ...root.querySelectorAll('*')].forEach(el => {
    ['onclick', 'onchange', 'oninput', 'onblur', 'for', 'aria-controls', 'aria-labelledby', 'aria-describedby', 'href'].forEach(attr => {
      const value = el.getAttribute(attr);
      if (!value) return;
      let rewritten = value;
      idMap.forEach((newId, oldId) => {
        rewritten = rewritten.split(oldId).join(newId);
      });
      el.setAttribute(attr, rewritten);
    });
  });
}
function inlineHandlerReferencesId(handler, id) {
  if (!handler || !id) return false;
  return handler.includes(`'${id}'`) || handler.includes(`"${id}"`) || handler.includes(`#${id}`);
}
function prepareGenericClonedTableBlock(block, sourceTable, newTable, viewId) {
  if (!block || !newTable) return;
  block.querySelectorAll('.anx-table-live-actions').forEach(el => el.remove());
  block.querySelectorAll('[data-live-controls-attached]').forEach(el => delete el.dataset.liveControlsAttached);
  const addButtons = Array.from(block.querySelectorAll('button')).filter(button => {
    const text = (button.innerText || '').trim();
    const onclick = button.getAttribute('onclick') || '';
    if (/add another table/i.test(text) || onclick.includes('addGenericTableBlock')) return false;
    if (/excel|template|download|remove|delete/i.test(text)) return false;
    return /add/i.test(text) || onclick.includes('addRow') || onclick.includes('addClusterRow') || onclick.includes('addCont');
  });
  addButtons.forEach(button => {
    const onclick = button.getAttribute('onclick') || '';
    const usesThisTable = inlineHandlerReferencesId(onclick, newTable?.id);
    const usesSourceTable = inlineHandlerReferencesId(onclick, sourceTable?.id);
    if (!usesThisTable || usesSourceTable) {
      button.setAttribute('onclick', 'window.addGenericAnnexureRowFromButton(this)');
    }
  });
  block.querySelectorAll('[onblur], [oninput], [onchange]').forEach(el => {
    const handler = el.getAttribute('onblur') || el.getAttribute('oninput') || el.getAttribute('onchange') || '';
    if (/clusterData|contData|anx6ClusterData|anx6ContiguousData/.test(handler)) {
      el.removeAttribute('onblur');
      el.removeAttribute('oninput');
      el.removeAttribute('onchange');
    }
  });
  normalizeClonedAnnexureRowButtons(block);
  const title = block.querySelector('.anx-section-title, .editable-title, .annexure-f-block-title, .annexure-k-block-title');
  if (title) {
    const siblings = Array.from(block.parentElement?.children || []).filter(el =>
      el.classList?.contains('anx-section') ||
      el.classList?.contains('annexure-f-table-block') ||
      el.classList?.contains('annexure-k-table-block') ||
      el.classList?.contains('table-block-card')
    );
    const siblingCount = Math.max(1, siblings.indexOf(block) + 1 || siblings.length);
    const baseText = (title.textContent || '').replace(/\s+-?\s*Table\s+\d+:?$/i, '').trim();
    if (baseText) title.textContent = `${baseText} - Table ${siblingCount}:`;
    if (title.hasAttribute('data-key')) title.setAttribute('data-key', `${title.getAttribute('data-key')}-${Date.now()}`);
  }
  block.querySelectorAll('.rm-sec-a-btn, .rm-sec-btn').forEach(btn => {
    btn.style.display = 'inline-flex';
    btn.setAttribute('onclick', "this.closest('.anx-section, .annexure-f-table-block, .annexure-k-table-block, .table-block-card')?.remove(); scheduleCoreAnnexureRefreshFromElement(this)");
  });
  newTable.querySelectorAll('tbody tr').forEach(tr => {
    Array.from(tr.cells).forEach(td => {
      if (!td.querySelector('button, select') && !td.hasAttribute('contenteditable')) td.contentEditable = 'true';
    });
  });
  if (window.initLucide) window.initLucide();
  if (typeof addCoreAnnexureTableControls === 'function') addCoreAnnexureTableControls(viewId);
  recalcKnownAnnexureTablesIn(block);
  scheduleCoreAnnexureRefreshFromElement(block, 50);
}
function addGenericTableBlock(btn) {
  const sourceBlock = btn?.closest?.('.anx-section');
  const sourceTable = sourceBlock?.querySelector?.('table');
  const viewId = getViewIdForAnnexureElement(btn);
  if (!sourceBlock || !sourceTable || !isCoreAnnexureViewId(viewId)) return;
  const clone = sourceBlock.cloneNode(true);
  const idMap = new Map();
  const elementsWithIds = [
    ...(clone.id ? [clone] : []),
    ...clone.querySelectorAll('[id]')
  ];
  elementsWithIds.forEach((el, index) => {
    const oldId = el.id;
    const newId = uniqueAnnexureCloneId(oldId, index + 1);
    idMap.set(oldId, newId);
    el.id = newId;
    if (el.name === oldId) el.name = newId;
  });
  if (!idMap.has(sourceTable.id)) {
    const clonedTable = clone.querySelector('table');
    if (clonedTable) {
      const newId = uniqueAnnexureCloneId(sourceTable.id, 1);
      idMap.set(sourceTable.id, newId);
      clonedTable.id = newId;
      clonedTable.name = newId;
    }
  }
  rewriteInlineReferences(clone, idMap);
  sourceBlock.insertAdjacentElement('afterend', clone);
  prepareGenericClonedTableBlock(clone, sourceTable, clone.querySelector('table'), viewId);
  if (typeof makeAllSectionTitlesEditable === 'function') {
    makeAllSectionTitlesEditable(viewId);
  }
  if (window.debouncedSaveState) window.debouncedSaveState();
}
window.addGenericTableBlock = addGenericTableBlock;
window.addGenericAnnexureRowFromButton = addGenericAnnexureRowFromButton;
window.addGenericTableBlockFromSelector = addGenericTableBlockFromSelector;
window.addSectionABlockAnx1 = function() {
  const wrapper = document.getElementById('section-a-wrapper-anx1');
  const blocks = wrapper ? wrapper.querySelectorAll('.section-a-block-anx1') : [];
  const block = blocks[blocks.length - 1];
  const btn = block?.querySelector?.('button[onclick*="addGenericTableBlock"]');
  if (btn) addGenericTableBlock(btn);
};
window.annexureTablesByPrefix = annexureTablesByPrefix;
function ensureGenericTableCloneButtons(view) {
  if (view?.id === 'view-annexure-j') {
    view.querySelectorAll('button[onclick*="addGenericTableBlock"]').forEach(button => button.remove());
    return;
  }
  view?.querySelectorAll?.('.anx-section').forEach(section => {
    if (!section.querySelector('table') || section.querySelector('button[onclick*="addGenericTableBlock"]')) return;
    const footer = section.querySelector('.section-footer');
    if (!footer) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-xs btn-outline';
    button.style.cssText = 'display:inline-flex;align-items:center;gap:6px;margin-left:auto;';
    button.setAttribute('onclick', 'window.addGenericTableBlock(this)');
    button.innerHTML = `
      <i data-lucide="copy" style="width:12px;height:12px;"></i>
      <span>Add Another Table</span>`;
    footer.appendChild(button);
  });
}
function addCoreAnnexureTableControls(id) {
  if (!isCoreAnnexureViewId(id)) return;
  const view = document.getElementById('view-' + id);
  if (!view) return;
  ensureGenericTableCloneButtons(view);
  if (view.dataset.coreAnnexurePreviewEvents !== 'true') {
    view.dataset.coreAnnexurePreviewEvents = 'true';
    view.addEventListener('input', event => {
      const table = event.target.closest('table');
      if (table) {
        recalcKnownAnnexureTable(table, event.target.closest('td, th'));
        scheduleCoreAnnexureRefreshFromElement(event.target, 180);
      }
    });
    view.addEventListener('change', event => {
      const table = event.target.closest('table');
      if (table) {
        recalcKnownAnnexureTable(table, event.target.closest('td, th'));
        scheduleCoreAnnexureRefreshFromElement(event.target, 120);
      }
    });
    view.addEventListener('click', event => {
      if (event.target.closest('button') && event.target.closest('table, .section-footer, .anx-table-live-actions')) {
        setTimeout(() => recalcKnownAnnexureTablesIn(view), 20);
        scheduleCoreAnnexureRefreshFromElement(event.target, 180);
      }
    });
    view.addEventListener('blur', event => {
      const table = event.target.closest('table');
      if (table) {
        recalcKnownAnnexureTable(table, event.target.closest('td, th'));
        scheduleCoreAnnexureRefreshFromElement(event.target, 120);
      }
    }, true);
  }
  view.querySelectorAll('table').forEach(table => {
    if (table.dataset.liveControlsAttached === 'true') return;
    table.dataset.liveControlsAttached = 'true';
    const wrap = table.closest('.tbl-wrap') || table.parentElement;
    if (!wrap || wrap.nextElementSibling?.classList.contains('anx-table-live-actions')) return;
    const actions = document.createElement('div');
    actions.className = 'anx-table-live-actions';
    actions.innerHTML = `
      <button type="button" class="btn btn-xs btn-outline anx-live-add-row">
        <i data-lucide="plus" style="width:12px;height:12px;"></i>
        <span>Add Row</span>
      </button>
      <button type="button" class="btn btn-xs btn-outline anx-live-add-column">
        <i data-lucide="columns-3" style="width:12px;height:12px;"></i>
        <span>Add Column</span>
      </button>`;
    wrap.insertAdjacentElement('afterend', actions);
    actions.querySelector('.anx-live-add-row')?.addEventListener('click', () => {
      addGenericAnnexureRow(table, id);
    });
    actions.querySelector('.anx-live-add-column')?.addEventListener('click', () => addGenericAnnexureColumn(table, id));
  });
  if (window.initLucide) window.initLucide();
}
function repairMainContentStructure() {
  const workspace = document.querySelector('.app-workspace');
  const mainContent = document.querySelector('.main-content');
  const pageBody = mainContent ? mainContent.querySelector('.page-body') : null;
  if (!workspace || !mainContent || !pageBody) return;
  workspace.querySelectorAll(':scope > .view, :scope > div[id^="view-"]').forEach(view => {
    pageBody.appendChild(view);
  });
  workspace.scrollLeft = 0;
  mainContent.scrollLeft = 0;
}
function showView(id, btn, push = true) {
  if (typeof S !== 'undefined' && S.activeProject) {
    let changed = false;
    if (id === 'graphs') {
      if (!S.graphsOpened) {
        S.graphsOpened = true;
        changed = true;
      }
    } else if (['anx1', 'anx2', 'anx3', 'anx4', 'anx5', 'anx6', 'anx7'].includes(id)) {
      if (!S.annexuresOpened) {
        S.annexuresOpened = true;
        changed = true;
      }
    } else if (['annexure-b', 'annexure-c', 'annexure-d', 'annexure-e', 'annexure-f', 'annexure-g', 'annexure-h', 'annexure-i', 'annexure-j', 'annexure-k', 'demand-table', 'auction-table', 'summary-table', 'benchmark-table'].includes(id)) {
      if (!S.tablesOpened) {
        S.tablesOpened = true;
        changed = true;
      }
    }
    if (changed) {
      persistProjectState();
    }
  }
  if (id === 'history') {
    id = 'dashboard';
    btn = null;
    push = false;
    if (window.location.hash === '#history') {
      history.replaceState({ viewId: 'dashboard' }, '', '#dashboard');
    }
  }
  repairMainContentStructure();
  if (window.matchMedia && window.matchMedia('(max-width: 1280px)').matches) {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('mobile-open');
    document.body.classList.remove('mobile-sidebar-open');
    document.body.classList.add('sidebar-hidden');
  }
  if (typeof hasModuleAccess === 'function' && typeof S !== 'undefined' && S.user && !hasModuleAccess(id)) {
    if (typeof showUnauthorizedAccessError === 'function') showUnauthorizedAccessError();
    else if (typeof toast === 'function') toast('You are not authorized to access this section.', 'error');
    else alert('You are not authorized to access this section.');
    if (window.location.hash !== '#' + currentViewId) {
      history.replaceState({ viewId: currentViewId }, '', '#' + currentViewId);
    }
    return;
  }
  if (typeof ensurePortalAssetsForView === 'function' && !ensurePortalAssetsForView(id, () => showView(id, btn, push))) {
    return;
  }
  if (id !== 'dashboard') {
    setSidebarCollapsed(true);
  }
  document.querySelectorAll('.flyout-menu').forEach(m => m.style.display = 'none');
  if (push && currentViewId && currentViewId !== id) {
    viewHistory.push(currentViewId);
    history.pushState({ viewId: id }, '', '#' + id);
  }
  currentViewId = id;
  if (id === 'dashboard') {
    document.body.classList.add('view-dashboard-active');
  } else {
    document.body.classList.remove('view-dashboard-active');
  }
  document.body.classList.toggle('view-projects-active', id === 'projects');
  const backBtn = document.getElementById('tb-back-btn');
  if (backBtn) {
    backBtn.style.display = viewHistory.length > 0 ? 'flex' : 'none';
  }
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.sb-item').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tb-sub-nav-btn').forEach(b => b.classList.remove('active'));
  const el = document.getElementById('view-' + id);
  if (el) {
    el.classList.add('active');
    if (id === 'replenishment' && window.replenishmentApp) {
      window.replenishmentApp.init(window.S?.activeProject?.id || 'demo_proj');
    }
    setTimeout(() => {
      const mainContent = document.querySelector('.main-content');
      if (id === 'dashboard') {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        if (mainContent) {
          mainContent.scrollTop = 0;
          mainContent.scrollLeft = 0;
        }
        setTimeout(() => {
          if (window.dashboardMap) {
            window.dashboardMap.invalidateSize();
            if (window.dashboardMapBounds) {
              window.dashboardMap.fitBounds(window.dashboardMapBounds);
            }
          }
          window.dispatchEvent(new Event('resize'));
        }, 100);
      } else {
        const workspace = document.querySelector('.app-workspace');
        if (workspace) {
          workspace.scrollTop = 0;
          workspace.scrollLeft = 0;
        }
        if (mainContent) {
          mainContent.scrollTop = 0;
          mainContent.scrollLeft = 0;
        }
      }
      document.documentElement.scrollLeft = 0;
      document.body.scrollLeft = 0;
    }, 50);
  }
  if (id.startsWith('annexure-')) {
    const inlineMenu = document.getElementById('inline-more-annexures');
    if (inlineMenu) inlineMenu.style.display = 'flex';
  }
  if (btn) {
    btn.classList.add('active');
  } else {
    const targetBtn = Array.from(document.querySelectorAll('.sb-item')).find(b => {
      const onclickAttr = b.getAttribute('onclick');
      return onclickAttr && onclickAttr.includes(`'${id}'`);
    });
    if (targetBtn) targetBtn.classList.add('active');
  }
  const topbarBtn = Array.from(document.querySelectorAll('.tb-sub-nav-btn')).find(b => {
    const onclickAttr = b.getAttribute('onclick') || '';
    if (id === 'dashboard') return onclickAttr.includes("'dashboard'");
    if (id === 'projects') return onclickAttr.includes("'projects'");
    if (id === 'workflow') return onclickAttr.includes("'workflow'");
    if (id === 'settings') return onclickAttr.includes("'settings'");
    if (id === 'audit-logs') return onclickAttr.includes("'audit-logs'");
    return false;
  });
  if (topbarBtn) topbarBtn.classList.add('active');
  const titles = {
    'dashboard': 'Dashboard', 'projects': 'My DSR Projects', 'workflow': 'Report Workflow',
    'front-matter': 'Front Matter', 'chapters': 'Chapters (10)', 'plates': 'Plate Section',
    'graphs': 'Cross Section Graph Generator', 'anx1': 'Annexure I - Sand Sources',
    'anx2': 'Annexure II - Mining Leases', 'anx3': 'Annexure III - Cluster Details',
    'anx4': 'Annexure IV - Transportation Routes', 'anx5': 'Annexure V - Bench Mark & CORS',
    'anx6': 'Annexure VI - Final Cluster Details', 'anx7': 'Annexure VII - Transportation Routes',
    'annexure-b': 'Annexure B', 'annexure-c': 'Annexure C', 'annexure-d': 'Annexure D',
    'annexure-e': 'Annexure E', 'annexure-f': 'Annexure F', 'annexure-g': 'Annexure G',
    'annexure-h': 'Annexure H', 'annexure-i': 'Annexure I', 'annexure-j': 'Annexure J',
    'annexure-k': 'Annexure K', 'demand-table': 'Projected Demand Table',
    'auction-table': 'Auctioned Sites', 'summary-table': 'Source Summary Table', 'benchmark-table': 'Bench Mark & CORS',
    'esign': 'E-Signature Panel', 'generate': 'Generate Final PDF', 'users': 'User Management', 'settings': 'Settings',
    'audit-logs': 'System Audit Logs'
  };
  const titleEl = document.getElementById('topbar-title');
  if (titleEl) titleEl.textContent = titles[id] || id;
  if (id === 'esign') renderSignatures();
  if (id === 'generate') renderFinalChecklist();
  if (id === 'chapters') renderChapters();
  if (id === 'plates') renderPlates();
  if (id === 'graphs') renderGraphs();
  if (id === 'demand-table') initDemandTable();
  if (id === 'summary-table') initSummaryTable();
  if (id === 'auction-table') initAuctionTable();
  if (id === 'workflow') {
    updateWorkflowDistrictUI();
    if (typeof renderWorkflowProjectLiveCard === 'function') renderWorkflowProjectLiveCard();
  }
  if (id === 'projects' && typeof refreshProjectsFromBackend === 'function') {
    refreshProjectsFromBackend(true).catch(err => console.error('Project refresh failed', err));
  }
  if (id === 'users' && typeof renderUsers === 'function') renderUsers();
  if (id === 'settings') {
    if (typeof window.loadGeneralSettings === 'function') window.loadGeneralSettings();
    if (typeof renderUsers === 'function') renderUsers();
  }
  if (id === 'audit-logs' && typeof window.loadAuditLogs === 'function') {
    window.loadAuditLogs();
  }
  if (id === 'benchmark-table' && typeof mountBenchmarkPanel === 'function') mountBenchmarkPanel('benchmark-table-content');
  if (id === 'anx1' && typeof renderPdfUploadUIAnx1 === 'function') renderPdfUploadUIAnx1();
  if (id === 'anx2' && typeof renderPdfUploadUIAnx2 === 'function') renderPdfUploadUIAnx2();
  if (id === 'anx3' && typeof renderPdfUploadUI === 'function') {
    renderPdfUploadUI();
    if (typeof renderCluster === 'function') renderCluster();
    if (typeof renderCont === 'function') renderCont();
  }
  if (id === 'anx4' && typeof renderPdfUploadUIAnx4 === 'function') {
    renderPdfUploadUIAnx4();
    if (typeof initRoutesTable === 'function') initRoutesTable();
    if (typeof initClustersTable === 'function') initClustersTable();
  }
  if (id === 'anx5' && typeof renderPdfUploadUIAnx5 === 'function') renderPdfUploadUIAnx5();
  if (id === 'anx6' && typeof renderPdfUploadUIAnx6 === 'function') renderPdfUploadUIAnx6();
  if (id === 'anx7' && typeof renderPdfUploadUIAnx7 === 'function') renderPdfUploadUIAnx7();
  if (id === 'annexure-b' && typeof renderAnnexureB === 'function') renderAnnexureB();
  if (id === 'annexure-c' && typeof renderAnnexureC === 'function') renderAnnexureC();
  if (id === 'annexure-d' && typeof renderAnnexureD === 'function') renderAnnexureD();
  if (id === 'annexure-e' && typeof renderAnnexureE === 'function') renderAnnexureE();
  if (id === 'annexure-f' && typeof renderAnnexureF === 'function') renderAnnexureF();
  if (id === 'annexure-g' && typeof renderAnnexureG === 'function') renderAnnexureG();
  if (id === 'annexure-h' && typeof renderAnnexureH === 'function') renderAnnexureH();
  if (id === 'annexure-i' && typeof renderAnnexureI === 'function') renderAnnexureI();
  if (id === 'annexure-j' && typeof renderAnnexureJ === 'function') renderAnnexureJ();
  if (id === 'annexure-k' && typeof renderAnnexureK === 'function') renderAnnexureK();
  if (id === 'history' && typeof renderHistoryTable === 'function') renderHistoryTable();
  if (id === 'dashboard') {
    if (typeof syncNotificationsAndReviewStatus === 'function') {
      syncNotificationsAndReviewStatus();
    } else if (S.activeProject && typeof checkReviewStatus === 'function') {
      checkReviewStatus(S.activeProject.id);
    }
  }
  if (S.activeProject && typeof updateActiveProjectCardUI === 'function') updateActiveProjectCardUI();
  normalizeAnnexureViewLayout(id);
  addCoreAnnexureTableControls(id);
  if (typeof makeAllSectionTitlesEditable === 'function') {
    makeAllSectionTitlesEditable(id);
  }
  const previewSections = ['front-matter', 'chapters', 'plates', 'anx1', 'anx2', 'anx3', 'anx4', 'anx5', 'anx6', 'anx7', 'annexure-b', 'annexure-c', 'annexure-d', 'annexure-e', 'annexure-f', 'annexure-g', 'annexure-h', 'annexure-i', 'annexure-j', 'annexure-k'];
  if (window.portalPreviewTimer) {
    clearTimeout(window.portalPreviewTimer);
    window.portalPreviewTimer = null;
  }
  if (previewSections.includes(id)) {
    const openPreview = () => {
      if (currentViewId === id && window.pdfPreview) window.pdfPreview.show(id);
    };
    if (typeof runWhenIdle === 'function') {
      window.portalPreviewTimer = runWhenIdle(openPreview, 900);
    } else {
      window.portalPreviewTimer = setTimeout(openPreview, 250);
    }
  } else {
    if (window.pdfPreview) window.pdfPreview.hide();
  }
  if (id === 'dashboard' || id === 'projects') {
    renderDistrictLegends();
  } else if (typeof runWhenIdle === 'function') {
    runWhenIdle(() => renderDistrictLegends(), 900);
  }
  initLucide(el || document);
  if (typeof enforceReviewerReadOnly === 'function') {
    requestAnimationFrame(() => enforceReviewerReadOnly());
  }
  if (typeof loadReviewerNoteForView === 'function') {
    loadReviewerNoteForView(id, titles[id] || id);
  }
    // Force re-translation of newly loaded view DOM elements if language is not English
    if (typeof currentPortalLanguage !== 'undefined' && currentPortalLanguage !== 'en') {
      setTimeout(() => {
        const combo = document.querySelector('.goog-te-combo');
        if (combo) {
          combo.value = currentPortalLanguage;
          combo.dispatchEvent(new Event('change'));
        }
      }, 400);
    }
}
function goBackView() {
  if (viewHistory.length > 0) {
    history.back();
  }
}
let lucideRenderQueued = false;
function initLucide(root) {
  if (!window.lucide || lucideRenderQueued) return;
  lucideRenderQueued = true;
  requestAnimationFrame(() => {
    lucideRenderQueued = false;
    if (!window.lucide) return;
    try {
      if (root && root.querySelector) {
        window.lucide.createIcons({ nodes: root.querySelectorAll('i[data-lucide]') });
        return;
      }
      const scopedNodes = document.querySelectorAll([
        '.view.active i[data-lucide]',
        '.topbar i[data-lucide]',
        '.sidebar i[data-lucide]',
        '.modal.open i[data-lucide]',
        '#screen-auth.active i[data-lucide]',
        '.toast i[data-lucide]'
      ].join(','));
      window.lucide.createIcons({ nodes: scopedNodes });
    } catch (err) {
      window.lucide.createIcons();
    }
  });
}
window.addEventListener('load', () => {
  if (window.initLucide) window.initLucide();
});
function updateSidebarToggleVisibility() {
  const toggleBtn = document.getElementById('tb-sidebar-toggle');
  if (!toggleBtn) return;
  const collapsed = document.body.classList.contains('sidebar-hidden');
  toggleBtn.style.display = 'inline-flex';
  toggleBtn.setAttribute('aria-expanded', String(!collapsed));
  toggleBtn.setAttribute('aria-label', collapsed ? 'Open navigation menu' : 'Close navigation menu');
  toggleBtn.setAttribute('title', collapsed ? 'Open navigation' : 'Close navigation');
}
function clearActiveProject() {
  sessionStorage.removeItem('dsr_active_project_id');
  if (typeof S !== 'undefined') {
    S.activeProject = null;
    ['report-nav', 'annexure-nav', 'replenishment-nav', 'tables-nav', 'finalize-nav'].forEach(n => {
      const el = document.getElementById(n);
      if (el) el.style.display = 'none';
    });
    if (typeof updateActiveDistrictUI === 'function') updateActiveDistrictUI('Punjab');
    if (typeof updateActiveProjectCardUI === 'function') updateActiveProjectCardUI();
    if (typeof filterDashboardByDistrict === 'function') filterDashboardByDistrict('ALL');
    setSidebarCollapsed(true);
    updateSidebarToggleVisibility();
    S.annexureB = [];
    S.annexureC = [];
    S.annexureD = [];
    S.annexureE = [];
    S.annexureG = [];
    S.annexureH = [];
    S.annexureI = [];
    S.annexureJ = [];
  }
}
/* Theme logic lives in js/theme.js (loaded in <head> for instant light default) */
let confirmCallback = null;
function customConfirm(msg, cb) {
  document.getElementById('confirm-msg').textContent = msg;
  confirmCallback = cb;
  document.getElementById('modal-confirm').classList.add('open');
}
function doConfirm() {
  closeModal('modal-confirm');
  if (confirmCallback) confirmCallback();
}
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
  });
  if (typeof updateDarkModeIcon === 'function') updateDarkModeIcon();
});
let toastTimer;
function toast(msg, type = 'info') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg; el.className = `toast toast-${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 4200);
}
function fmtN(v, dec = 2) {
  const n = Number(v);
  if (isNaN(n)) return '0';
  return n.toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
/* â”€â”€ District Management System â”€â”€ */
const DISTRICT_COLORS = {
  'Amritsar': {
    light: { bg: 'rgba(37, 99, 235, 0.15)', border: '#2563eb', text: '#1d4ed8', glow: 'rgba(37, 99, 235, 0.25)' },
    dark: { bg: 'rgba(37, 99, 235, 0.25)', border: '#3b82f6', text: '#f8fafc', glow: 'rgba(59, 130, 246, 0.4)' }
  },
  'Barnala': {
    light: { bg: 'rgba(22, 163, 74, 0.15)', border: '#16a34a', text: '#15803d', glow: 'rgba(22, 163, 74, 0.25)' },
    dark: { bg: 'rgba(22, 163, 74, 0.25)', border: '#4ade80', text: '#f8fafc', glow: 'rgba(74, 222, 128, 0.4)' }
  },
  'Bathinda': {
    light: { bg: 'rgba(220, 38, 38, 0.15)', border: '#dc2626', text: '#991b1b', glow: 'rgba(220, 38, 38, 0.25)' },
    dark: { bg: 'rgba(220, 38, 38, 0.25)', border: '#f87171', text: '#f8fafc', glow: 'rgba(248, 113, 113, 0.4)' }
  },
  'Faridkot': {
    light: { bg: 'rgba(147, 51, 234, 0.15)', border: '#9333ea', text: '#6b21a8', glow: 'rgba(147, 51, 234, 0.25)' },
    dark: { bg: 'rgba(168, 85, 247, 0.25)', border: '#c084fc', text: '#faf5ff', glow: 'rgba(192, 132, 252, 0.4)' }
  },
  'Fatehgarh Sahib': {
    light: { bg: 'rgba(217, 119, 6, 0.15)', border: '#d97706', text: '#92400e', glow: 'rgba(217, 119, 6, 0.25)' },
    dark: { bg: 'rgba(217, 119, 6, 0.25)', border: '#fbbf24', text: '#fffbeb', glow: 'rgba(251, 191, 36, 0.4)' }
  },
  'Fazilka': {
    light: { bg: 'rgba(8, 145, 178, 0.15)', border: '#0891b2', text: '#155e75', glow: 'rgba(8, 145, 178, 0.25)' },
    dark: { bg: 'rgba(8, 145, 178, 0.25)', border: '#22d3ee', text: '#ecfeff', glow: 'rgba(34, 211, 238, 0.4)' }
  },
  'Ferozepur': {
    light: { bg: 'rgba(190, 18, 60, 0.15)', border: '#be123c', text: '#9f1239', glow: 'rgba(190, 18, 60, 0.25)' },
    dark: { bg: 'rgba(190, 18, 60, 0.25)', border: '#fb7185', text: '#fff1f2', glow: 'rgba(251, 113, 133, 0.4)' }
  },
  'Gurdaspur': {
    light: { bg: 'rgba(79, 70, 229, 0.15)', border: '#4f46e5', text: '#3730a3', glow: 'rgba(79, 70, 229, 0.25)' },
    dark: { bg: 'rgba(99, 102, 241, 0.25)', border: '#818cf8', text: '#e0e7ff', glow: 'rgba(129, 140, 248, 0.4)' }
  },
  'Hoshiarpur': {
    light: { bg: 'rgba(21, 128, 61, 0.15)', border: '#15803d', text: '#166534', glow: 'rgba(21, 128, 61, 0.25)' },
    dark: { bg: 'rgba(34, 197, 94, 0.25)', border: '#4ade80', text: '#f0fdf4', glow: 'rgba(74, 222, 128, 0.4)' }
  },
  'Jalandhar': {
    light: { bg: 'rgba(234, 88, 12, 0.15)', border: '#ea580c', text: '#9a3412', glow: 'rgba(234, 88, 12, 0.25)' },
    dark: { bg: 'rgba(249, 115, 22, 0.25)', border: '#fb923c', text: '#fff7ed', glow: 'rgba(251, 146, 60, 0.4)' }
  },
  'Kapurthala': {
    light: { bg: 'rgba(15, 118, 110, 0.15)', border: '#0f766e', text: '#115e59', glow: 'rgba(15, 118, 110, 0.25)' },
    dark: { bg: 'rgba(20, 184, 166, 0.25)', border: '#2dd4bf', text: '#f0fdfa', glow: 'rgba(45, 212, 191, 0.4)' }
  },
  'Ludhiana': {
    light: { bg: 'rgba(124, 58, 237, 0.15)', border: '#7c3aed', text: '#5b21b6', glow: 'rgba(124, 58, 237, 0.25)' },
    dark: { bg: 'rgba(139, 92, 246, 0.25)', border: '#a78bfa', text: '#f5f3ff', glow: 'rgba(167, 139, 250, 0.4)' }
  },
  'Malerkotla': {
    light: { bg: 'rgba(180, 83, 9, 0.15)', border: '#b45309', text: '#78350f', glow: 'rgba(180, 83, 9, 0.25)' },
    dark: { bg: 'rgba(180, 83, 9, 0.25)', border: '#fb923c', text: '#fff7ed', glow: 'rgba(251, 146, 60, 0.4)' }
  },
  'Mansa': {
    light: { bg: 'rgba(3, 105, 161, 0.15)', border: '#0369a1', text: '#075985', glow: 'rgba(3, 105, 161, 0.25)' },
    dark: { bg: 'rgba(14, 165, 233, 0.25)', border: '#38bdf8', text: '#f0f9ff', glow: 'rgba(56, 189, 248, 0.4)' }
  },
  'Moga': {
    light: { bg: 'rgba(101, 163, 13, 0.15)', border: '#65a30d', text: '#4f7e0b', glow: 'rgba(101, 163, 13, 0.25)' },
    dark: { bg: 'rgba(132, 204, 22, 0.25)', border: '#a3e635', text: '#f7fee7', glow: 'rgba(163, 230, 53, 0.4)' }
  },
  'Pathankot': {
    light: { bg: 'rgba(192, 38, 211, 0.15)', border: '#c026d3', text: '#86198f', glow: 'rgba(192, 38, 211, 0.25)' },
    dark: { bg: 'rgba(217, 70, 239, 0.25)', border: '#f472b6', text: '#fdf2f8', glow: 'rgba(244, 114, 182, 0.4)' }
  },
  'Patiala': {
    light: { bg: 'rgba(71, 85, 105, 0.15)', border: '#475569', text: '#334155', glow: 'rgba(71, 85, 105, 0.25)' },
    dark: { bg: 'rgba(100, 116, 139, 0.25)', border: '#94a3b8', text: '#f8fafc', glow: 'rgba(148, 163, 184, 0.4)' }
  },
  'Rupnagar': {
    light: { bg: 'rgba(2, 132, 199, 0.15)', border: '#0284c7', text: '#0369a1', glow: 'rgba(2, 132, 199, 0.25)' },
    dark: { bg: 'rgba(14, 165, 233, 0.25)', border: '#38bdf8', text: '#f0f9ff', glow: 'rgba(56, 189, 248, 0.4)' }
  },
  'Sahibzada Ajit Singh Nagar': {
    light: { bg: 'rgba(202, 138, 4, 0.15)', border: '#ca8a04', text: '#854d0e', glow: 'rgba(202, 138, 4, 0.25)' },
    dark: { bg: 'rgba(234, 179, 8, 0.25)', border: '#fde047', text: '#fef9c3', glow: 'rgba(253, 224, 71, 0.4)' }
  },
  'SAS Nagar': {
    light: { bg: 'rgba(202, 138, 4, 0.15)', border: '#ca8a04', text: '#854d0e', glow: 'rgba(202, 138, 4, 0.25)' },
    dark: { bg: 'rgba(234, 179, 8, 0.25)', border: '#fde047', text: '#fef9c3', glow: 'rgba(253, 224, 71, 0.4)' }
  },
  'Sangrur': {
    light: { bg: 'rgba(225, 29, 72, 0.15)', border: '#e11d48', text: '#9f1239', glow: 'rgba(225, 29, 72, 0.25)' },
    dark: { bg: 'rgba(244, 63, 94, 0.25)', border: '#fda4af', text: '#fff1f2', glow: 'rgba(253, 164, 175, 0.4)' }
  },
  'Shaheed Bhagat Singh Nagar': {
    light: { bg: 'rgba(5, 150, 105, 0.15)', border: '#059669', text: '#065f46', glow: 'rgba(5, 150, 105, 0.25)' },
    dark: { bg: 'rgba(16, 185, 129, 0.25)', border: '#6ee7b7', text: '#ecfdf5', glow: 'rgba(110, 231, 183, 0.4)' }
  },
  'SBS Nagar': {
    light: { bg: 'rgba(5, 150, 105, 0.15)', border: '#059669', text: '#065f46', glow: 'rgba(5, 150, 105, 0.25)' },
    dark: { bg: 'rgba(16, 185, 129, 0.25)', border: '#6ee7b7', text: '#ecfdf5', glow: 'rgba(110, 231, 183, 0.4)' }
  },
  'Sri Muktsar Sahib': {
    light: { bg: 'rgba(29, 78, 216, 0.15)', border: '#1d4ed8', text: '#1e40af', glow: 'rgba(29, 78, 216, 0.25)' },
    dark: { bg: 'rgba(37, 99, 235, 0.25)', border: '#60a5fa', text: '#eff6ff', glow: 'rgba(96, 165, 250, 0.4)' }
  },
  'Tarn Taran': {
    light: { bg: 'rgba(162, 28, 175, 0.15)', border: '#a21caf', text: '#701a75', glow: 'rgba(162, 28, 175, 0.25)' },
    dark: { bg: 'rgba(192, 38, 211, 0.25)', border: '#e879f9', text: '#fdf4ff', glow: 'rgba(232, 121, 249, 0.4)' }
  }
};
function getDistrictStyle(name, forceDark = false) {
  const cleanName = (name || '').trim();
  const isDark = forceDark || document.documentElement.classList.contains('dark');
  const fallbackPalette = [
    ['#2563eb', '#1d4ed8', '#dbeafe'], ['#059669', '#047857', '#d1fae5'],
    ['#d97706', '#b45309', '#fef3c7'], ['#dc2626', '#b91c1c', '#fee2e2'],
    ['#7c3aed', '#6d28d9', '#ede9fe'], ['#0891b2', '#0e7490', '#cffafe'],
    ['#be123c', '#9f1239', '#ffe4e6'], ['#4f46e5', '#4338ca', '#e0e7ff']
  ];
  const districts = Array.isArray(window.PUNJAB_DISTRICTS) ? window.PUNJAB_DISTRICTS : [];
  const idx = Math.max(0, districts.indexOf(cleanName));
  const [border, text, bgHex] = fallbackPalette[idx % fallbackPalette.length];
  const dist = DISTRICT_COLORS[cleanName] || {
    light: { bg: bgHex, border, text, glow: `${border}33` },
    dark: { bg: `${border}40`, border, text: '#f8fafc', glow: `${border}66` }
  };
  const themeStyle = isDark ? dist.dark : dist.light;
  const topbarBg = (isDark || forceDark) ? themeStyle.bg : 'rgba(255, 255, 255, 0.95)';
  const topbarColor = themeStyle.text;
  const topbarBorder = themeStyle.border;
  const topbarGlow = themeStyle.glow;
  return {
    bg: themeStyle.bg,
    color: themeStyle.text,
    border: themeStyle.border,
    glow: themeStyle.glow,
    topbarBg,
    topbarColor,
    topbarBorder,
    topbarGlow
  };
}
function paintDistrictThemeOnElement(el, districtName) {
  if (!el || !districtName) return;
  const style = getDistrictStyle(districtName);
  el.style.setProperty('--district-border', style.border);
  el.style.setProperty('--district-accent', style.color);
  el.style.setProperty('--district-bg', style.bg);
  el.style.setProperty('--district-glow', style.glow);
  el.dataset.district = districtName;
}
function applyDistrictBadgeStyles(el, districtName) {
  if (!el || !districtName) return;
  const style = getDistrictStyle(districtName);
  el.classList.add('district-badge');
  el.dataset.district = districtName;
  el.style.background = style.bg;
  el.style.color = style.color;
  el.style.border = `2px solid ${style.border}`;
  el.style.boxShadow = `0 1px 3px ${style.glow}`;
}
function getDistrictBadgeHTML(districtName) {
  const safe = (districtName || '').replace(/"/g, '&quot;');
  return `<span class="badge district-badge" data-district="${safe}">${districtName}</span>`;
}
function refreshDistrictBadgesInDOM() {
  document.querySelectorAll('.district-badge[data-district]').forEach((el) => {
    applyDistrictBadgeStyles(el, el.dataset.district);
  });
}
function ensureActiveProjectCardHost(containerEl) {
  if (!containerEl) return null;
  let host = containerEl.querySelector(':scope > .active-dsr-project-card-host');
  if (!host) {
    host = document.createElement('div');
    host.className = 'active-dsr-project-card-host';
    containerEl.insertBefore(host, containerEl.firstChild);
  }
  return host;
}
function ensureDistrictManagementHost(containerEl) {
  if (!containerEl) return null;
  let panel = containerEl.querySelector(':scope > #district-management-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'district-management-panel';
    containerEl.appendChild(panel);
  }
  return panel;
}
function ensureActiveProjectCardStructure(hostEl) {
  if (!hostEl) return null;
  let card = hostEl.querySelector('.active-dsr-project-card');
  if (!card) {
    hostEl.innerHTML = `
      <div class="active-dsr-project-card card" hidden>
        <div class="active-dsr-project-card__body">
          <div class="active-dsr-project-card__label">Currently Editing DSR Project</div>
          <div class="active-dsr-project-card__title"></div>
        </div>
        <span class="active-dsr-project-card__badge district-badge"></span>
      </div>`;
    card = hostEl.querySelector('.active-dsr-project-card');
  }
  return card;
}
function paintActiveProjectCard(card, project) {
  if (!card || !project) return;
  const dist = project.district;
  const titleEl = card.querySelector('.active-dsr-project-card__title');
  const badgeEl = card.querySelector('.active-dsr-project-card__badge');
  if (titleEl) titleEl.textContent = project.title;
  if (badgeEl) badgeEl.textContent = `${dist} DISTRICT`;
  paintDistrictThemeOnElement(card, dist);
  if (badgeEl) applyDistrictBadgeStyles(badgeEl, dist);
}
function updateActiveProjectCardUI() {
  const containers = [
    document.getElementById('workflow-active-district-header'),
    document.getElementById('dash-right-sidebar')
  ];
  containers.forEach((container) => {
    if (!container) return;
    const host = container.id === 'workflow-active-district-header'
      ? container
      : ensureActiveProjectCardHost(container);
    if (!S.activeProject) {
      if (container.id === 'workflow-active-district-header') {
        container.style.display = 'none';
        container.innerHTML = '';
      } else {
        const card = host.querySelector('.active-dsr-project-card');
        if (card) card.hidden = true;
      }
      return;
    }
    if (container.id === 'workflow-active-district-header') {
      container.style.display = 'block';
    }
    const card = ensureActiveProjectCardStructure(host);
    if (!card) return;
    card.hidden = false;
    paintActiveProjectCard(card, S.activeProject);
  });
}
/** Re-apply district + project themed UI after light/dark toggle (no page reload). */
function refreshThemeDependentUI() {
  if (typeof S === 'undefined' || !S) return;
  const dist = S.activeProject ? S.activeProject.district : 'Punjab';
  updateActiveDistrictUI(dist);
  updateActiveProjectCardUI();
  renderDistrictLegends();
  refreshDistrictBadgesInDOM();
  if (typeof renderDashboard === 'function') renderDashboard();
  if (typeof renderProjects === 'function') renderProjects();
  if (window.initLucide) initLucide();
  /* Charts are heavy - defer so district/project cards repaint first */
  if (typeof renderGraphs === 'function') {
    requestAnimationFrame(() => renderGraphs());
  }
}
function updateActiveDistrictUI(districtName) {
  const badgeEl = document.getElementById('tb-district-badge');
  if (!badgeEl) return;
  if (districtName && districtName !== 'Punjab' && districtName !== 'ALL') {
    const style = getDistrictStyle(districtName);
    badgeEl.textContent = districtName;
    badgeEl.style.backgroundColor = style.topbarBg;
    badgeEl.style.color = style.topbarColor;
    badgeEl.style.borderColor = style.topbarBorder;
    badgeEl.style.borderWidth = '2.5px';
    badgeEl.style.borderStyle = 'solid';
    badgeEl.style.borderRadius = '99px';
    badgeEl.style.padding = '6px 14px';
    badgeEl.style.fontSize = '12.5px';
    badgeEl.style.boxShadow = `0 4px 12px ${style.topbarGlow}, 0 0 0 1.5px ${style.topbarBorder}`;
    badgeEl.style.transform = 'translateY(-1px)';
    badgeEl.style.fontWeight = '700';
    badgeEl.style.textTransform = 'uppercase';
    badgeEl.style.letterSpacing = '0.04em';
    badgeEl.style.transition = 'all 0.3s ease';
    badgeEl.style.display = 'inline-flex';
    badgeEl.style.alignItems = 'center';
    badgeEl.onmouseover = () => {
      badgeEl.style.transform = 'translateY(-2px)';
      badgeEl.style.boxShadow = `0 6px 16px ${style.topbarGlow}, 0 0 0 2px ${style.topbarBorder}`;
    };
    badgeEl.onmouseout = () => {
      badgeEl.style.transform = 'translateY(-1px)';
      badgeEl.style.boxShadow = `0 4px 12px ${style.topbarGlow}, 0 0 0 1.5px ${style.topbarBorder}`;
    };
    const dashIndicator = document.getElementById('dash-active-district-badge');
    if (dashIndicator) {
      dashIndicator.id = 'dash-active-district-badge';
      dashIndicator.className = 'badge district-badge';
      dashIndicator.textContent = districtName;
      dashIndicator.style.fontWeight = '800';
      dashIndicator.style.transform = 'translateY(-1px)';
      applyDistrictBadgeStyles(dashIndicator, districtName);
    }
  } else {
    badgeEl.textContent = 'Punjab';
    badgeEl.style.backgroundColor = '';
    badgeEl.style.color = '';
    badgeEl.style.borderColor = '';
    badgeEl.style.borderWidth = '';
    badgeEl.style.borderStyle = '';
    badgeEl.style.borderRadius = '';
    badgeEl.style.padding = '';
    badgeEl.style.fontSize = '';
    badgeEl.style.boxShadow = '';
    badgeEl.style.transform = '';
    badgeEl.style.fontWeight = '';
    badgeEl.style.textTransform = '';
    badgeEl.style.letterSpacing = '';
    badgeEl.style.transition = '';
    badgeEl.style.display = '';
    badgeEl.style.alignItems = '';
    badgeEl.onmouseover = null;
    badgeEl.onmouseout = null;
    const dashIndicator = document.getElementById('dash-active-district-badge');
    if (dashIndicator) {
      dashIndicator.outerHTML = `<span id="dash-active-district-badge" class="badge" style="background:var(--off); color:var(--text-soft);">None</span>`;
    }
  }
}
function updateWorkflowDistrictUI() {
  updateActiveProjectCardUI();
  const reviewerActions = document.getElementById('reviewer-actions');
  if (reviewerActions) {
    reviewerActions.style.display = (hasReviewAccess() && S.activeProject) ? 'flex' : 'none';
  }
  const reviewerNotesButton = document.getElementById('reviewer-notes-topbar-btn');
  if (reviewerNotesButton) {
    reviewerNotesButton.style.display = (hasReviewAccess() && S.activeProject) ? 'inline-flex' : 'none';
  }
}
function renderDistrictLegends() {
  const dashEl = document.getElementById('dash-right-sidebar');
  const districts = Array.isArray(window.PUNJAB_DISTRICTS) && window.PUNJAB_DISTRICTS.length
    ? window.PUNJAB_DISTRICTS
    : ['Amritsar', 'Barnala', 'Bathinda', 'Faridkot', 'Fatehgarh Sahib', 'Fazilka', 'Ferozepur', 'Gurdaspur', 'Hoshiarpur', 'Jalandhar', 'Kapurthala', 'Ludhiana', 'Malerkotla', 'Mansa', 'Moga', 'Pathankot', 'Patiala', 'Rupnagar', 'Sahibzada Ajit Singh Nagar', 'Sangrur', 'Shaheed Bhagat Singh Nagar', 'Sri Muktsar Sahib', 'Tarn Taran'];
  const renderDetailedCard = (containerEl) => {
    if (!containerEl) return;
    const getAbbrev = (name) => {
      if (name === 'ALL') return 'ALL';
      if (name === 'Jalandhar') return 'JAL';
      if (name === 'Ludhiana') return 'LUD';
      if (name === 'Mansa') return 'MAN';
      if (name === 'Hoshiarpur') return 'HOS';
      if (name === 'Pathankot') return 'PAT';
      if (name === 'Rupnagar') return 'RUP';
      if (name === 'Tarn Taran') return 'TAR';
      return name.substring(0, 3).toUpperCase();
    };
    let listHtml = '';
    const isAllSelected = currentDistrictFilter === 'ALL';
    listHtml += `
      <div class="whats-new-item ${isAllSelected ? 'active-filter' : ''}" onclick="filterDashboardByDistrict('ALL')">
        <div class="whats-new-badge" style="background:#C49A58; color:var(--p-accent);">ALL</div>
        <div class="whats-new-name">All Districts (Punjab) Â· 23</div>
        <div class="whats-new-arrow"><i data-lucide="chevron-right" style="width:16px; height:16px;"></i></div>
      </div>
    `;
    districts.forEach(d => {
      const isActiveFilter = currentDistrictFilter === d;
      const isActiveProj = S.activeProject && S.activeProject.district === d;
      const isSelected = isActiveFilter || isActiveProj;
      const abbrev = getAbbrev(d);
      const badgeBg = isActiveProj ? '#ffffff' : '#C49A58';
      const badgeColor = 'var(--p-accent)';
      const editingIndicator = isActiveProj ? ' <span style="font-size:9px; font-weight:800; text-transform:uppercase; background:rgba(255,255,255,0.2); border:1px solid rgba(255,255,255,0.4); padding:1px 5px; border-radius:3px; margin-left:6px; color:#fff;">Editing</span>' : '';
      listHtml += `
        <div class="whats-new-item ${isSelected ? 'active-filter' : ''}" onclick="filterDashboardByDistrict('${d}')">
          <div class="whats-new-badge" style="background:${badgeBg}; color:${badgeColor};">${abbrev}</div>
          <div class="whats-new-name">${d} District${editingIndicator}</div>
          <div class="whats-new-arrow"><i data-lucide="chevron-right" style="width:16px; height:16px;"></i></div>
        </div>
      `;
    });
    const activeCount = Array.isArray(S.projects) ? S.projects.length : 0;
    const avgProgress = activeCount
      ? Math.round(S.projects.reduce((sum, p) => sum + (Number(p.progress) || 0), 0) / activeCount)
      : 0;
    containerEl.innerHTML = `
      <div class="whats-new-sidebar">
        <div class="whats-new-title">
          <i data-lucide="map" style="width:18px; height:18px; color: var(--p-accent-gold);"></i>
          <span>District Management</span>
        </div>
        <p class="whats-new-desc">
          Punjab map and live district workflow status. Select any district to filter context-specific surveys.
        </p>
        <div style="border:1px solid var(--border); border-radius:8px; overflow:hidden; background:var(--off); margin-bottom:12px;">
          <div style="height:130px; background:url('assets/punjab-reference-map.png') center / contain no-repeat var(--card);"></div>
          <div style="padding:10px 12px; display:flex; flex-direction:column; gap:8px;">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; font-size:12px; font-weight:800; color:var(--text);">
              <span>Live Punjab DSR Progress</span>
              <span>${avgProgress}%</span>
            </div>
            <div class="progress-bar"><div class="progress-fill" style="width:${avgProgress}%; background:linear-gradient(90deg,var(--teal),var(--saffron));"></div></div>
            <div style="font-size:11px; color:var(--text-soft);">${activeCount} active project(s) across ${districts.length} districts</div>
          </div>
        </div>
        <div style="display: flex; flex-direction: column;">
          ${listHtml}
        </div>
      </div>
    `;
  };
  renderDetailedCard(ensureDistrictManagementHost(dashEl));
  if (typeof updateActiveProjectCardUI === 'function') updateActiveProjectCardUI();
  initLucide();
}
/* â”€â”€ River Color Identity System â”€â”€ */
const RIVER_COLORS = {
  'Sutlej': {
    light: { bg: 'rgba(16, 185, 129, 0.15)', border: '#10B981', text: '#065f46', glow: 'rgba(16, 185, 129, 0.25)' },
    dark: { bg: 'rgba(16, 185, 129, 0.25)', border: '#34d399', text: '#ecfdf5', glow: 'rgba(52, 211, 153, 0.4)' }
  },
  'Beas': {
    light: { bg: 'rgba(6, 182, 212, 0.15)', border: '#06B6D4', text: '#155e75', glow: 'rgba(6, 182, 212, 0.25)' },
    dark: { bg: 'rgba(6, 182, 212, 0.25)', border: '#22d3ee', text: '#ecfeff', glow: 'rgba(34, 211, 238, 0.4)' }
  },
  'Ghaggar': {
    light: { bg: 'rgba(15, 118, 110, 0.15)', border: '#0F766E', text: '#115e59', glow: 'rgba(15, 118, 110, 0.25)' },
    dark: { bg: 'rgba(15, 118, 110, 0.25)', border: '#2dd4bf', text: '#f0fdfa', glow: 'rgba(45, 212, 191, 0.4)' }
  },
  'Ravi': {
    light: { bg: 'rgba(249, 115, 22, 0.15)', border: '#F97316', text: '#9a3412', glow: 'rgba(249, 115, 22, 0.25)' },
    dark: { bg: 'rgba(249, 115, 22, 0.25)', border: '#fb923c', text: '#fff7ed', glow: 'rgba(251, 146, 60, 0.4)' }
  },
  'Yamuna': {
    light: { bg: 'rgba(37, 99, 235, 0.15)', border: '#2563EB', text: '#1e40af', glow: 'rgba(37, 99, 235, 0.25)' },
    dark: { bg: 'rgba(37, 99, 235, 0.25)', border: '#60a5fa', text: '#eff6ff', glow: 'rgba(96, 165, 250, 0.4)' }
  },
  'Chenab': {
    light: { bg: 'rgba(124, 58, 237, 0.15)', border: '#7C3AED', text: '#5b21b6', glow: 'rgba(124, 58, 237, 0.25)' },
    dark: { bg: 'rgba(124, 58, 237, 0.25)', border: '#a78bfa', text: '#faf5ff', glow: 'rgba(167, 139, 250, 0.4)' }
  },
  'Jhelum': {
    light: { bg: 'rgba(71, 85, 105, 0.15)', border: '#475569', text: '#334155', glow: 'rgba(71, 85, 105, 0.25)' },
    dark: { bg: 'rgba(71, 85, 105, 0.25)', border: '#94a3b8', text: '#cbd5e1', glow: 'rgba(148, 163, 184, 0.4)' }
  }
};
function getRiverStyle(name) {
  const cleanName = (name || '').trim();
  const isDark = document.documentElement.classList.contains('dark');
  const style = RIVER_COLORS[cleanName] || {
    light: { bg: 'rgba(71, 85, 105, 0.15)', border: '#64748b', text: '#334155', glow: 'rgba(71, 85, 105, 0.25)' },
    dark: { bg: 'rgba(71, 85, 105, 0.25)', border: '#94a3b8', text: '#cbd5e1', glow: 'rgba(148, 163, 184, 0.4)' }
  };
  const themeStyle = isDark ? style.dark : style.light;
  return {
    bg: themeStyle.bg,
    color: themeStyle.text,
    border: themeStyle.border,
    glow: themeStyle.glow
  };
}
function getRiverBadgeHTML(riverName) {
  const style = getRiverStyle(riverName);
  return `<span class="badge river-badge" style="background:${style.bg}; color:${style.color}; border: 1.5px solid ${style.border}; box-shadow: 0 1px 2px ${style.glow}; font-weight:700; transition: all 0.2s ease; cursor: pointer; display: inline-flex; align-items: center;" onmouseover="this.style.boxShadow='0 0 6px ${style.border}', this.style.transform='scale(1.03)'" onmouseout="this.style.boxShadow='0 1px 2px ${style.glow}', this.style.transform='scale(1)'">${riverName}</span>`;
}
document.addEventListener('click', (event) => {
  const item = event.target.closest('#sidebar .sb-item');
  if (!item) return;
  const onclickAttr = item.getAttribute('onclick') || '';
  const match = onclickAttr.match(/showView\('([^']+)'/);
  if (!match || typeof showView !== 'function') return;
  if (!['front-matter', 'chapters', 'plates', 'graphs'].includes(match[1])) return;
  event.preventDefault();
  event.stopPropagation();
  showView(match[1], item);
}, true);
function openDistrictMap(btn) {
  if (typeof clearActiveProject === 'function') clearActiveProject();
  if (typeof showView === 'function') showView('dashboard', btn || null);
  setTimeout(() => {
    document.getElementById('dash-district-map-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 90);
}
window.openDistrictMap = openDistrictMap;
function openAboutDsr(btn) {
  if (typeof clearActiveProject === 'function') clearActiveProject();
  if (typeof showView === 'function') showView('dashboard', btn || null);
  setTimeout(() => {
    document.getElementById('dash-about-dsr-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 90);
}
window.openAboutDsr = openAboutDsr;
function renderRiverTags(riversString) {
  if (!riversString || riversString === 'Not specified') return `<span class="badge" style="background:var(--off); color:var(--text-soft); border: 1px solid var(--border);">No River</span>`;
  const rivers = riversString.split(',').map(r => r.trim()).filter(r => r !== '');
  return rivers.map(r => getRiverBadgeHTML(r)).join(' ');
}

;
