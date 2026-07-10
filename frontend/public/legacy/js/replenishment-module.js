(function() {
// Replenishment Study Module
// Handles the UI, compilation, and custom PDF generation for Replenishment Studies

function injectDraggableStyles() {
  if (document.getElementById('draggable-styles')) return;
  const style = document.createElement('style');
  style.id = 'draggable-styles';
  style.innerHTML = `
    .draggable-section-item {
      background: #ffffff !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 8px !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02) !important;
      margin-bottom: 10px !important;
      padding: 10px 14px !important;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }
    .draggable-section-item:hover {
      border-color: #cbd5e1 !important;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03) !important;
    }
    .draggable-section-item.dragging {
      opacity: 0.3 !important;
      background: #f8fafc !important;
      border: 1.5px dashed #cbd5e1 !important;
      box-shadow: none !important;
    }
    .draggable-section-item.drag-over {
      border: 1.5px dashed #3b82f6 !important;
      background: #eff6ff !important;
    }
    .drag-handle {
      cursor: grab !important;
      color: #94a3b8 !important;
      display: flex !important;
      align-items: center !important;
      padding: 6px 4px !important;
      border-radius: 4px !important;
      background: #f1f5f9 !important;
      transition: all 0.15s ease !important;
    }
    .drag-handle:hover {
      background: #cbd5e1 !important;
      color: #1e293b !important;
    }
    .drag-handle:active {
      cursor: grabbing !important;
    }
  `;
  document.head.appendChild(style);
}

async function initReplenishmentView() {
  injectDraggableStyles();
  const container = document.getElementById('view-replenishment');
  if (!container) return;
  
  const selectContainer = document.getElementById('repl-project-select-container');
  const contentContainer = document.getElementById('repl-content-container');
  const editorContainer = document.getElementById('repl-editor-container');
  
  if (selectContainer) selectContainer.style.display = 'none';
  if (contentContainer) contentContainer.style.display = 'none';
  if (!editorContainer) return;
  
  const modelDsrEditor = document.getElementById('model-dsr-editor-container');
  if (modelDsrEditor) modelDsrEditor.innerHTML = '';

  editorContainer.style.display = 'block';

  if (!S.activeProject || !S.activeProject.id) {
    editorContainer.innerHTML = `
      <div class="card" style="margin-top:20px; padding:40px; text-align:center; max-width:600px; margin:20px auto;">
        <i data-lucide="info" style="width:48px;height:48px;color:#3b82f6;display:block;margin:0 auto 16px;"></i>
        <h2 style="color:#17324d;">No Active Project</h2>
        <p style="color:#64748b; margin-top:8px;">Please select a DSR project from the projects list first to manage its Replenishment Reports.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }
  
  editorContainer.innerHTML = `
    <div style="max-width: 800px; margin: 40px auto; padding: 0 20px; text-align: center;">
      <div style="border: 4px solid #f1f5f9; border-top: 4px solid #f59e0b; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 20px auto;"></div>
      <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size:14px; color:#64748b; font-weight:700; margin-top:12px;">Loading saved reports from server...</p>
    </div>
  `;
  
  await refreshLocalReportsFromServer();
  
  // Show the main option cards
  window.showReplenishmentOptions(editorContainer);
}

// Hook into existing navigation system
const originalShowViewReplenishmentHook = window.showView;
window.showView = function(viewId, caller) {
  if (originalShowViewReplenishmentHook) originalShowViewReplenishmentHook(viewId, caller);
  if (viewId === 'replenishment') {
    initReplenishmentView();
  }
};

if (window.location.hash === '#replenishment' || window.currentViewId === 'replenishment') {
  setTimeout(() => initReplenishmentView(), 100);
}

// Sync sidebar visibility
const annexureNav = document.getElementById('annexure-nav');
const replenishmentNav = document.getElementById('replenishment-nav');
if (annexureNav instanceof Node && replenishmentNav instanceof HTMLElement) {
  replenishmentNav.style.display = annexureNav.style.display;
  new MutationObserver(() => {
    replenishmentNav.style.display = annexureNav.style.display;
  }).observe(annexureNav, { attributes: true, attributeFilter: ['style'] });
}

const REPLENISHMENT_SECTION_TITLES = {
  anx1: 'Annexure I - Sources',
  anx2: 'Annexure II - Leases',
  anx3: 'Annexure III - Clusters',
  anx4: 'Annexure IV - Transport',
  anx5: 'Annexure V - Bench Mark & CORS',
  anx6: 'Annexure VI - Final Cluster Details',
  anx7: 'Annexure VII - Transportation Routes',
  'annexure-b': 'Annexure B',
  'annexure-c': 'Annexure C',
  'annexure-d': 'Annexure D',
  'annexure-e': 'Annexure E',
  'annexure-f': 'Annexure F',
  'annexure-g': 'Annexure G',
  'annexure-h': 'Annexure H',
  'annexure-i': 'Annexure I',
  'annexure-j': 'Annexure J',
  'annexure-k': 'Annexure K'
};

const REPLENISHMENT_INHERITANCE_FIELDS = [
  'Cover Page', 'Project Details', 'Applicant Details', 'Lease Details', 'Mining Block Details',
  'District', 'State', 'River Name', 'Village', 'Tehsil', 'Khasra Numbers', 'Lease Area',
  'Mining Area', 'Boundary Coordinates', 'GPS Coordinate Tables', 'Infrastructure Details',
  'Accessibility', 'Location Map', 'Google Earth Map', 'Toposheet', 'Physiography', 'Climate',
  'Drainage Pattern', 'River Basin', 'River Characteristics', 'Catchment Details',
  'Regional Geology', 'Local Geology', 'Stratigraphy', 'Lithology', 'Geomorphology',
  'Geological Description', 'Hydrogeology', 'Aquifer Details', 'Groundwater Details',
  'Mineral Description', 'Physical Properties', 'Chemical Properties', 'River Behaviour',
  'Sediment Transport Description', 'Flora', 'Fauna', 'Biodiversity', 'Mining Method',
  'Mining Depth', 'Bench Formation', 'Machinery Details', 'Transportation Details',
  'Safety Measures', 'Statutory Guidelines', 'EMGSM Guidelines', 'Mine Layout',
  'Geological Map', 'Drainage Map', 'Lease Boundary Map'
];

const REPLENISHMENT_MISSING_REQUIREMENTS = [
  {
    id: 'reserve-calculation',
    title: 'Reserve Calculation',
    formats: 'XLSX, CSV, PDF',
    items: ['Geological Reserve', 'Blocked Reserve', 'Mineable Reserve', 'Production Programme']
  },
  {
    id: 'mined-area-study',
    title: 'Replenishment Study of Mined Area',
    formats: 'PDF, XLSX, CSV',
    items: ['Pre Monsoon Survey', 'Post Monsoon Survey', 'Replenishment Calculation', 'Sediment Quantity', 'Volume Analysis', 'Comparison Report']
  },
  {
    id: 'methodology-study',
    title: 'Methodology for Replenishment Study',
    formats: 'PDF, XLSX, CSV, SHP, KML, JPG, PNG',
    items: ['Drone Survey Report', 'DGPS Report', 'Flight Planning', 'Ground Control Points', 'Aero Triangulation', 'Ortho Generation']
  },
  {
    id: 'data-processing',
    title: 'Data Processing',
    formats: 'TIFF, GeoTIFF, JPG, PNG, LAS, LAZ, PDF',
    items: ['Orthomosaic', 'DEM', 'DSM', 'DTM', 'Point Cloud', 'Processing Report']
  },
  {
    id: 'grid-calculation',
    title: 'Calculation of Grid-wise Area, Elevation & Quantity of Sand',
    formats: 'XLSX, CSV, PDF, DWG',
    items: ['Grid Measurement Table', 'Elevation Table', 'RL Comparison Table', 'Cross Section Excel', 'Cross Section Drawings', 'Quantity Calculation', 'Volume Calculation']
  },
  {
    id: 'annexures',
    title: 'Annexures',
    formats: 'PDF, XLSX, CSV, JPG, JPEG, PNG, TIFF, KML, SHP, DWG',
    items: ['Environmental Clearance', 'Mining Plan', 'DGPS Report', 'Drone Survey Report', 'Water Quality Report', 'Air Quality Report', 'Soil Analysis Report', 'Noise Monitoring Report', 'Site Photographs', 'Drone Photographs', 'Survey Photographs', 'Orthomosaic Maps', 'DEM Maps', 'Contour Maps', 'Remote Pilot Certificate', 'Drone Registration Certificate', 'Previous Replenishment Report', 'Any Supporting Government Documents']
  }
];

const REPLENISHMENT_REPORT_ACCORDION_SECTIONS = [
  { id: 'cover-page', title: 'Cover Page', items: ['Cover Page', 'Project Details', 'District', 'State'] },
  { id: 'certificates', title: 'Certificates', items: ['Statutory Guidelines', 'EMGSM Guidelines'] },
  { id: 'index', title: 'Index', items: [] },
  { id: 'introduction', title: 'Introduction', items: ['Project Details', 'Applicant Details', 'Lease Details', 'Mining Block Details', 'District', 'State', 'River Name', 'Village', 'Tehsil', 'Khasra Numbers', 'Lease Area', 'Mining Area', 'Boundary Coordinates', 'GPS Coordinate Tables', 'Infrastructure Details', 'Accessibility', 'Location Map', 'Google Earth Map', 'Toposheet'] },
  { id: 'deposition-minerals', title: 'Deposition of Minerals on River Bed', items: ['River Behaviour', 'Sediment Transport Description', 'River Basin', 'River Characteristics', 'Catchment Details', 'Drainage Pattern'] },
  { id: 'flora-fauna', title: 'Flora & Fauna', items: ['Flora', 'Fauna', 'Biodiversity'] },
  { id: 'hydrogeology', title: 'Hydrogeology', items: ['Hydrogeology', 'Aquifer Details', 'Groundwater Details'] },
  { id: 'reserve-calculation', title: 'Reserve Calculation', requirementId: 'reserve-calculation' },
  { id: 'mined-area-study', title: 'Replenishment Study of Mined Area', requirementId: 'mined-area-study' },
  { id: 'emgsm', title: 'Enforcement & Monitoring Guidelines', items: ['EMGSM Guidelines', 'Safety Measures', 'Statutory Guidelines'] },
  { id: 'methodology-study', title: 'Methodology for Replenishment Study', requirementId: 'methodology-study' },
  { id: 'data-processing', title: 'Data Processing', requirementId: 'data-processing' },
  { id: 'grid-calculation', title: 'Calculation of Grid-wise Area, Elevation & Quantity of Sand', requirementId: 'grid-calculation' },
  { id: 'conclusion', title: 'Conclusion', items: ['Mineral Description', 'Physical Properties', 'Chemical Properties', 'Mining Method', 'Mining Depth', 'Bench Formation', 'Machinery Details', 'Transportation Details'] },
  { id: 'annexures', title: 'Annexures', requirementId: 'annexures', items: ['Mine Layout', 'Geological Map', 'Drainage Map', 'Lease Boundary Map'] }
];

function getReplenishmentSectionTitle(viewId) {
  const fallback = REPLENISHMENT_SECTION_TITLES[viewId] || String(viewId || '').toUpperCase();
  return typeof getEditableAnnexureTitle === 'function'
    ? getEditableAnnexureTitle(viewId, fallback)
    : fallback;
}

let localReportsCache = [];

function getReportsStorageKey() {
  return S.activeProject && S.activeProject.id ? `repl_reports_${S.activeProject.id}` : '';
}

function normalizeBackendReport(study) {
  const state = study && study.reportState && typeof study.reportState === 'object' ? study.reportState : {};
  return {
    id: study.id,
    projectId: study.projectId,
    name: study.title,
    createdAt: study.createdAt,
    sections: Array.isArray(state.sections) ? state.sections : [],
    frontMatterPdfs: state.frontMatterPdfs || {},
    customPdfs: state.customPdfs || {},
    customSections: Array.isArray(state.customSections) ? state.customSections : [],
    sectionOrder: Array.isArray(state.sectionOrder) ? state.sectionOrder : [],
    finalDsrSource: state.finalDsrSource || null,
    inheritanceScan: state.inheritanceScan || null,
    replenishmentUploads: state.replenishmentUploads || {},
    manualEntries: state.manualEntries || {},
    generatedPdf: state.generatedPdf || null
  };
}

function cacheReports(reports) {
  localReportsCache = Array.isArray(reports) ? reports : [];
  window.replenishmentReports = localReportsCache;
  const key = getReportsStorageKey();
  if (key) {
    try {
      localStorage.setItem(key, JSON.stringify(localReportsCache));
    } catch (err) {
      console.warn("Failed to cache replenishment reports locally:", err);
    }
  }
  return localReportsCache;
}

function loadLocalReports() {
  if (!S.activeProject) return [];
  if (localReportsCache.length) return localReportsCache;
  const key = getReportsStorageKey();
  if (!key) return [];
  try {
    return cacheReports(JSON.parse(localStorage.getItem(key) || '[]'));
  } catch (err) {
    console.warn("Failed to load local replenishment cache:", err);
    return cacheReports([]);
  }
}

async function refreshLocalReportsFromServer() {
  const fallbackReports = loadLocalReports();
  if (!S.activeProject || !S.activeProject.id) return fallbackReports;
  try {
    const studies = await apiFetch(`/projects/${S.activeProject.id}/replenishment`);
    const reports = (studies || [])
      .filter(study => !study.reportState?.type || study.reportState?.type === 'replenishment')
      .map(normalizeBackendReport);
    return cacheReports(reports);
  } catch (err) {
    console.error("Failed to load reports from database:", err);
    return fallbackReports;
  }
}

function upsertLocalReport(report) {
  const reports = loadLocalReports();
  const index = reports.findIndex(r => r.id === report.id);
  if (index >= 0) {
    reports[index] = report;
  } else {
    reports.unshift(report);
  }
  cacheReports(reports);
  return report;
}

function saveLocalReports(reports) {
  cacheReports(reports);
  localReportsCache.forEach(report => {
    saveReportToServer(report);
  });
}

// Helper: save report to server database
async function saveReportToServer(report) {
  if (!report || !report.id) return;
  try {
    const payload = {
      projectId: report.projectId || (S.activeProject ? S.activeProject.id : null),
      title: report.name,
      status: 'DRAFT',
      reportState: {
        type: 'replenishment',
        sections: report.sections || [],
        frontMatterPdfs: report.frontMatterPdfs || {},
        customPdfs: report.customPdfs || {},
        customSections: report.customSections || [],
        sectionOrder: report.sectionOrder || [],
        finalDsrSource: report.finalDsrSource || null,
        inheritanceScan: report.inheritanceScan || null,
        replenishmentUploads: report.replenishmentUploads || {},
        manualEntries: report.manualEntries || {},
        generatedPdf: report.generatedPdf || null
      }
    };
    await apiFetch(`/replenishment/${report.id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error("Failed to save report to server:", err);
    toast("Failed to auto-save change to server: " + err.message, "error");
  }
}

// Expose functions to window
window.showReplenishmentOptions = showReplenishmentOptions;
window.showCreateReportForm = showCreateReportForm;
window.showExistingReportsList = showExistingReportsList;
window.submitCustomReportName = submitCustomReportName;
window.openCustomReport = openCustomReport;
window.renameCustomReport = renameCustomReport;
window.deleteCustomReport = deleteCustomReport;
window.downloadCustomReportPDFDirect = downloadCustomReportPDFDirect;
window.onParentCheckboxChange = onParentCheckboxChange;
window.onSubCheckboxChange = onSubCheckboxChange;
window.updateCustomReportPreview = updateCustomReportPreview;
window.downloadCustomReportPDF = downloadCustomReportPDF;
window.initDragAndDrop = initDragAndDrop;
window.saveNewSectionOrder = saveNewSectionOrder;
window.resetSectionOrder = resetSectionOrder;
window.addCustomSection = addCustomSection;
window.handleCustomSectionPdfUpload = handleCustomSectionPdfUpload;
window.removeCustomSectionPdf = removeCustomSectionPdf;
window.deleteCustomSection = deleteCustomSection;
window.closeCustomPdfModal = closeCustomPdfModal;
window.confirmAddCustomSection = confirmAddCustomSection;
window.handleFrontMatterPdfUpload = handleFrontMatterPdfUpload;
window.removeFrontMatterPdfUpload = removeFrontMatterPdfUpload;
window.handleReplenishmentRequirementUpload = handleReplenishmentRequirementUpload;
window.updateReplenishmentManualEntry = updateReplenishmentManualEntry;
window.toggleReplenishmentInheritanceSection = toggleReplenishmentInheritanceSection;
window.previewReplenishmentSourceItem = previewReplenishmentSourceItem;
window.previewReplenishmentUploadedItem = previewReplenishmentUploadedItem;
window.deleteReplenishmentRequirementUpload = deleteReplenishmentRequirementUpload;
window.downloadReplenishmentUploadedItem = downloadReplenishmentUploadedItem;

function showReplenishmentOptions(container) {
  container.innerHTML = `
    <div style="max-width: 800px; margin: 40px auto; padding: 0 20px;">
      <div style="text-align: center; margin-bottom: 40px;">
        <h2 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 24px; font-weight: 800; color: #1e293b; margin: 0 0 10px 0;">Replenishment Studies</h2>
        <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; color: #64748b; margin: 0;">Create and compile custom reports for replenishment studies by selecting specific DSR sections.</p>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
        <!-- Card 1: Create New Report -->
        <div class="card" onclick="window.showCreateReportForm()" style="padding: 32px; text-align: center; cursor: pointer; border: 1.5px solid #e2e8f0; border-radius: 12px; transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s; background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); display: flex; flex-direction: column; align-items: center;">
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: #eff6ff; border-radius: 12px; margin-bottom: 20px;">
            <i data-lucide="file-plus" style="width: 28px; height: 28px; color: #2563eb;"></i>
          </div>
          <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 18px; font-weight: 700; color: #1e293b; margin: 0 0 8px 0;">Create New Report</h3>
          <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: #64748b; margin: 0; line-height: 1.5;">Define a report name, choose custom sections, and generate a printable PDF.</p>
        </div>
        
        <!-- Card 2: Open Existing Report -->
        <div class="card" onclick="window.showExistingReportsList()" style="padding: 32px; text-align: center; cursor: pointer; border: 1.5px solid #e2e8f0; border-radius: 12px; transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s; background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); display: flex; flex-direction: column; align-items: center;">
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: #f0fdf4; border-radius: 12px; margin-bottom: 20px;">
            <i data-lucide="folder-open" style="width: 28px; height: 28px; color: #16a34a;"></i>
          </div>
          <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 18px; font-weight: 700; color: #1e293b; margin: 0 0 8px 0;">Open Existing Report</h3>
          <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: #64748b; margin: 0; line-height: 1.5;">Open, edit, rename, delete or download previously compiled reports.</p>
        </div>
      </div>
    </div>
  `;
  if (window.lucide) lucide.createIcons();
}

function parseProjectState(project) {
  if (!project || !project.projectState) return {};
  if (typeof project.projectState === 'object') return project.projectState;
  try {
    return JSON.parse(project.projectState);
  } catch (_) {
    return {};
  }
}

function getProjectDisplayLabel(project) {
  if (!project) return 'Selected Final DSR';
  const title = project.title || project.projectName || `District Survey Report - ${project.district || 'Punjab'}`;
  return `${title} (${project.year || '2025-26'})`;
}

function isApprovedFinalDsrProject(project) {
  const status = String(project?.status || '').toLowerCase();
  return status.includes('approved') || status.includes('completed') || Number(project?.progress || 0) >= 100 || !!project?.finalPdfName;
}

async function loadApprovedFinalDsrProjects() {
  try {
    const projects = await apiFetch('/projects');
    const list = Array.isArray(projects) ? projects : [];
    const approved = list.filter(isApprovedFinalDsrProject);
    if (approved.length) return approved;
    return S.activeProject ? [S.activeProject] : [];
  } catch (err) {
    console.warn('Failed to load Final DSR projects:', err);
    return S.activeProject ? [S.activeProject] : [];
  }
}

function hasFinalDsrData(project, state, label) {
  const key = label.toLowerCase();
  const frontMatter = state.frontMatter || {};
  const textBlob = JSON.stringify({ project, state }).toLowerCase();
  const directChecks = {
    'cover page': () => !!(frontMatter.title || project.title || project.projectName),
    'project details': () => !!(project.title || project.projectName || project.district),
    'district': () => !!(frontMatter.district || project.district),
    'state': () => !!(frontMatter.state || project.state),
    'river name': () => !!(project.rivers || frontMatter.river || frontMatter.riverName),
    'physiography': () => (state.chapters || []).some(ch => String(ch.name || '').toLowerCase().includes('physiography')),
    'hydrogeology': () => textBlob.includes('hydrogeolog'),
    'flora': () => textBlob.includes('flora'),
    'fauna': () => textBlob.includes('fauna'),
    'geomorphology': () => textBlob.includes('geomorpholog'),
    'drainage map': () => (state.plates || []).some(pl => String(pl.name || '').toLowerCase().includes('drainage')),
    'geological map': () => (state.plates || []).some(pl => String(pl.name || '').toLowerCase().includes('geolog')),
    'lease boundary map': () => textBlob.includes('lease boundary')
  };
  if (directChecks[key]) return directChecks[key]();
  return textBlob.includes(key) || textBlob.includes(key.replace(/\s+/g, ''));
}

function scanFinalDsrForReplenishment(project) {
  const state = parseProjectState(project);
  const inherited = [];
  const missing = [];
  REPLENISHMENT_INHERITANCE_FIELDS.forEach(field => {
    (hasFinalDsrData(project, state, field) ? inherited : missing).push(field);
  });

  const missingRequirementIds = REPLENISHMENT_MISSING_REQUIREMENTS
    .filter(group => group.items.some(item => missing.includes(item) || !hasFinalDsrData(project, state, item)))
    .map(group => group.id);

  return {
    scannedAt: new Date().toISOString(),
    inherited,
    missing,
    missingRequirementIds,
    totalFields: REPLENISHMENT_INHERITANCE_FIELDS.length,
    inheritedCount: inherited.length,
    missingCount: missing.length
  };
}

async function showCreateReportForm() {
  const editorContainer = document.getElementById('repl-editor-container');
  if (!editorContainer) return;

  editorContainer.innerHTML = `<div style="padding:40px; text-align:center; font-weight:700; color:#1e293b;">Loading Approved Final DSR list...</div>`;
  const finalDsrProjects = await loadApprovedFinalDsrProjects();
  const optionsHtml = finalDsrProjects.map(project => `
    <option value="${escapeHtml(project.id)}">${escapeHtml(getProjectDisplayLabel(project))}${isApprovedFinalDsrProject(project) ? '' : ' - draft fallback'}</option>
  `).join('');
  
  editorContainer.innerHTML = `
    <div class="card" style="margin-top: 40px; padding: 32px; max-width: 680px; margin: 40px auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05);">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: #eff6ff; border-radius: 12px; margin-bottom: 16px;">
          <i data-lucide="file-plus" style="width: 28px; height: 28px; color: #2563eb;"></i>
        </div>
        <h2 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 20px; font-weight: 800; color: #1e293b; margin: 0 0 8px 0;">New Replenishment Report</h2>
        <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: #64748b; margin: 0; line-height: 1.5;">Select an Approved Final DSR. Common information will be inherited automatically; only missing replenishment-specific data will ask for upload or manual entry.</p>
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div class="field" style="display: flex; flex-direction: column; gap: 6px; text-align: left;">
          <label for="final-dsr-source-select" style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Approved Final DSR</label>
          <select id="final-dsr-source-select" style="padding: 10px 14px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background:#fff;">
            ${optionsHtml || '<option value="">No Final DSR available</option>'}
          </select>
        </div>
        <div class="field" style="display: flex; flex-direction: column; gap: 6px; text-align: left;">
          <label for="new-report-name-input" style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Report Title</label>
          <input type="text" id="new-report-name-input" placeholder="e.g. Monsoon Replenishment Report 2026" style="padding: 10px 14px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; transition: border-color 0.2s;" onkeydown="if(event.key==='Enter') window.submitCustomReportName()">
        </div>
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px 14px; color:#475569; font-size:12px; line-height:1.55;">
          The existing Government Replenishment Report sequence, drag/drop order, section selection, and saved-report opening format remain unchanged.
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-outline" onclick="window.showReplenishmentOptions(document.getElementById('repl-editor-container'))" style="flex:1; height: 42px; border-radius: 8px; cursor: pointer;">Back</button>
          <button class="btn btn-primary" onclick="window.submitCustomReportName()" style="flex:2; display: flex; align-items: center; justify-content: center; height: 42px; gap: 8px; font-weight: 700; font-size: 14px; border-radius: 8px; border: none; cursor: pointer;">
            <span>Scan DSR & Create Report</span>
            <i data-lucide="arrow-right" style="width: 16px; height: 16px;"></i>
          </button>
        </div>
      </div>
    </div>
  `;
  if (window.lucide) lucide.createIcons();
  
  setTimeout(() => {
    const input = document.getElementById('new-report-name-input');
    if (input) input.focus();
  }, 100);
}

async function submitCustomReportName() {
  const input = document.getElementById('new-report-name-input');
  if (!input) return;
  const reportName = input.value.trim();
  if (!reportName) {
    toast("Please enter a report name", "error");
    return;
  }

  const sourceSelect = document.getElementById('final-dsr-source-select');
  const sourceId = sourceSelect ? sourceSelect.value : '';
  let sourceProject = S.activeProject;
  if (sourceId) {
    try {
      sourceProject = await apiFetch(`/projects/${sourceId}`);
    } catch (err) {
      toast("Unable to load selected Final DSR. Using active project data.", "warning");
    }
  }
  const inheritanceScan = scanFinalDsrForReplenishment(sourceProject);
  const finalDsrSource = sourceProject ? {
    id: sourceProject.id,
    title: sourceProject.title || sourceProject.projectName || 'Final DSR',
    district: sourceProject.district || '',
    year: sourceProject.year || '',
    status: sourceProject.status || ''
  } : null;
  
  try {
    const res = await apiFetch(`/projects/${S.activeProject.id}/replenishment`, {
      method: 'POST',
      body: JSON.stringify({
        title: reportName,
        reportState: {
          type: 'replenishment',
          sections: [],
          frontMatterPdfs: {},
          customPdfs: {},
          customSections: [],
          sectionOrder: [],
          finalDsrSource,
          inheritanceScan,
          replenishmentUploads: {},
          manualEntries: {}
        }
      })
    });
    
    const newReport = {
      id: res.id,
      name: res.title,
      createdAt: res.createdAt,
      sections: [],
      frontMatterPdfs: {},
      customPdfs: {},
      customSections: [],
      sectionOrder: [],
      finalDsrSource,
      inheritanceScan,
      replenishmentUploads: {},
      manualEntries: {}
    };
    
    window.activeReport = upsertLocalReport(newReport);
    const editorContainer = document.getElementById('repl-editor-container');
    if (editorContainer) {
      renderCustomReportGenerator(editorContainer, newReport);
    }
  } catch (err) {
    toast("Failed to create report: " + err.message, "error");
  }
}

async function showExistingReportsList() {
  const editorContainer = document.getElementById('repl-editor-container');
  if (!editorContainer) return;
  
  editorContainer.innerHTML = `<div style="padding:40px; text-align:center; font-weight:700; color:#1e293b;">Loading saved reports...</div>`;
  const reports = await refreshLocalReportsFromServer();
  
  let rowsHtml = '';
  if (reports.length === 0) {
    rowsHtml = `
      <tr>
        <td colspan="4" style="text-align:center; padding: 30px; color: #64748b;">No saved reports found. Click 'Back' and create a new report.</td>
      </tr>
    `;
  } else {
    reports.forEach(r => {
      const dateStr = new Date(r.createdAt).toLocaleDateString();
      const count = r.sections ? r.sections.length : 0;
      
      rowsHtml += `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px; font-weight: 600; color: #1e293b;">${r.name}</td>
          <td style="padding: 12px; color: #475569;">${dateStr}</td>
          <td style="padding: 12px; color: #64748b;">
            <span style="font-size:11px; background:#f1f5f9; color:#475569; padding:2px 8px; border-radius:10px; font-weight:600;">${count} sections</span>
          </td>
          <td style="padding: 12px; display:flex; gap:8px; align-items:center;">
            <button class="btn btn-sm btn-primary" onclick="window.openCustomReport('${r.id}')" style="padding: 4px 8px; font-size: 11.5px; height: auto; cursor: pointer;">Open</button>
            <button class="btn btn-sm btn-outline" onclick="window.renameCustomReport('${r.id}')" style="padding: 4px 8px; font-size: 11.5px; height: auto; cursor: pointer;">Rename</button>
            <button class="btn btn-sm btn-saffron repl-download-pdf-btn" data-report-id="${r.id}" onclick="window.downloadCustomReportPDFDirect('${r.id}', this)" style="padding: 4px 8px; font-size: 11.5px; height: auto; cursor: pointer;">Download PDF</button>
            <button class="btn btn-sm btn-outline text-danger" onclick="window.deleteCustomReport('${r.id}')" style="padding: 4px 8px; font-size: 11.5px; height: auto; border-color:#f87171 !important; color:#ef4444 !important; cursor: pointer;">Delete</button>
          </td>
        </tr>
      `;
    });
  }
  
  editorContainer.innerHTML = `
    <div class="card" style="margin-top: 20px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <div>
          <h2 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 18px; font-weight: 800; color: #1e293b; margin:0 0 4px 0;">Saved Replenishment Reports</h2>
          <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; color: #64748b; margin:0;">Saved reports for DSR project: ${S.activeProject.projectName || S.activeProject.district}</p>
        </div>
        <button class="btn btn-outline" onclick="window.showReplenishmentOptions(document.getElementById('repl-editor-container'))" style="cursor: pointer;">Back</button>
      </div>
      
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; text-align:left; font-size:13px;">
          <thead>
            <tr style="border-bottom: 2px solid #cbd5e1; background:#f8fafc; font-weight:700; color:#334155;">
              <th style="padding:10px 12px;">Report Name</th>
              <th style="padding:10px 12px;">Date Created</th>
              <th style="padding:10px 12px;">Coverage</th>
              <th style="padding:10px 12px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function openCustomReport(reportId) {
  try {
    const s = await apiFetch(`/replenishment/${reportId}`);
    const report = upsertLocalReport(normalizeBackendReport(s));
    window.activeReport = report;
    const editorContainer = document.getElementById('repl-editor-container');
    if (editorContainer) {
      renderCustomReportGenerator(editorContainer, report);
    }
  } catch (err) {
    toast("Failed to open report: " + err.message, "error");
  }
}

async function renameCustomReport(reportId) {
  try {
    const s = await apiFetch(`/replenishment/${reportId}`);
    showCustomPromptModal("Rename Report", s.title, async (newName) => {
      try {
        await apiFetch(`/replenishment/${reportId}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: newName
          })
        });
        toast("Report renamed successfully!", "success");
        showExistingReportsList();
      } catch (e) {
        toast("Rename failed: " + e.message, "error");
      }
    }, "Rename");
  } catch (err) {
    toast("Failed to load report: " + err.message, "error");
  }
}

function deleteCustomReport(reportId) {
  showCustomConfirmModal({
    title: "Delete report?",
    message: "This saved replenishment report will be removed from the list.",
    confirmText: "Delete",
    tone: "danger",
    onConfirm: async () => {
      try {
        await apiFetch(`/replenishment/${reportId}`, {
          method: 'DELETE'
        });
        toast("Report deleted successfully!", "success");
        showExistingReportsList();
      } catch (err) {
        toast("Failed to delete report: " + err.message, "error");
      }
    }
  });
}

async function downloadCustomReportPDFDirect(reportId, triggerButton = null) {
  try {
    const s = await apiFetch(`/replenishment/${reportId}`);
    const report = upsertLocalReport(normalizeBackendReport(s));
    restoreReportFrontMatterPdfs(report);
    
    const checkedIds = report.sections || [];
    if (checkedIds.length === 0) {
      toast("No sections selected in this report to download.", "error");
      return;
    }
    
    await generateReplenishmentPDF(report.name, checkedIds, reportId, { triggerButton });
  } catch (err) {
    toast("Failed to download PDF: " + err.message, "error");
  }
}

function getCurrentSelectedReportSectionIds() {
  const scope = document.getElementById('draggable-sections-list') || document;
  const checkboxes = scope.querySelectorAll('input[id^="chk-"]:checked');
  return Array.from(new Set(Array.from(checkboxes).map(c => c.value).filter(Boolean)));
}

async function saveReportSelection(reportId) {
  if (window.activeReport && window.activeReport.id === reportId) {
    window.activeReport.sections = getCurrentSelectedReportSectionIds();
    await saveReportToServer(window.activeReport);
  }
}

function initDragAndDrop(reportId, reportName) {
  const container = document.getElementById('draggable-sections-list');
  if (!container) return;
  
  const scrollContainer = document.getElementById('repl-checklist-scroll-container');
  let dragEl = null;
  let autoScrollInterval = null;
  
  function startAutoScroll(direction) {
    if (autoScrollInterval) return;
    autoScrollInterval = setInterval(() => {
      if (scrollContainer) {
        scrollContainer.scrollTop += direction * 7;
      }
    }, 15);
  }
  
  function stopAutoScroll() {
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      autoScrollInterval = null;
    }
  }
  
  const items = container.querySelectorAll('.draggable-section-item');
  items.forEach(item => {
    const handle = item.querySelector('.drag-handle');
    if (handle) {
      handle.addEventListener('mousedown', () => {
        item.setAttribute('draggable', 'true');
      });
      handle.addEventListener('mouseup', () => {
        item.removeAttribute('draggable');
      });
    }
    
    item.addEventListener('dragstart', (e) => {
      dragEl = item;
      setTimeout(() => {
        item.classList.add('dragging');
      }, 0);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', item.getAttribute('data-section-id'));
    });
    
    item.addEventListener('dragend', () => {
      dragEl = null;
      stopAutoScroll();
      items.forEach(it => {
        it.classList.remove('dragging');
        it.classList.remove('drag-over');
      });
      item.removeAttribute('draggable');
      
      // Save new order
      saveNewSectionOrder(reportId, reportName);
    });
    
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      if (scrollContainer) {
        const rect = scrollContainer.getBoundingClientRect();
        const y = e.clientY;
        const threshold = 50;
        if (y - rect.top < threshold) {
          startAutoScroll(-1);
        } else if (rect.bottom - y < threshold) {
          startAutoScroll(1);
        } else {
          stopAutoScroll();
        }
      }
      
      if (item === dragEl) return;
      
      const bounding = item.getBoundingClientRect();
      const offset = e.clientY - bounding.top;
      if (offset > bounding.height / 2) {
        item.after(dragEl);
      } else {
        item.before(dragEl);
      }
    });
    
    item.addEventListener('dragenter', (e) => {
      e.preventDefault();
      if (item !== dragEl) {
        item.classList.add('drag-over');
      }
    });
    
    item.addEventListener('dragleave', () => {
      item.classList.remove('drag-over');
    });
  });
  
  if (scrollContainer) {
    scrollContainer.addEventListener('dragover', (e) => {
      const rect = scrollContainer.getBoundingClientRect();
      const y = e.clientY;
      const threshold = 50;
      if (y - rect.top < threshold) {
        startAutoScroll(-1);
      } else if (rect.bottom - y < threshold) {
        startAutoScroll(1);
      } else {
        stopAutoScroll();
      }
    });
    scrollContainer.addEventListener('dragleave', () => {
      stopAutoScroll();
    });
  }
}

function saveNewSectionOrder(reportId, reportName) {
  const container = document.getElementById('draggable-sections-list');
  if (!container) return;
  
  const items = container.querySelectorAll('.draggable-section-item');
  const sectionOrder = Array.from(items).map(item => item.getAttribute('data-section-id'));
  
  const reports = loadLocalReports();
  const report = reports.find(r => r.id === reportId);
  if (report) {
    report.sectionOrder = sectionOrder;
    saveLocalReports(reports);
  }
  
  // Save checkbox selections and update live preview
  saveReportSelection(reportId);
  window.updateCustomReportPreview(reportName, reportId);
}

async function resetSectionOrder(reportId, reportName) {
  showCustomConfirmModal({
    title: "Reset section order?",
    message: "Your selected sections will remain selected, but the order will return to the default DSR sequence.",
    confirmText: "Reset Order",
    tone: "warning",
    onConfirm: async () => {
      if (window.activeReport && window.activeReport.id === reportId) {
        const defaultOrder = [
          'front-matter',
          'chapters',
          'plates',
          'anx1', 'anx2', 'anx3', 'anx4', 'anx5', 'anx6', 'anx7',
          'annexure-b', 'annexure-c', 'annexure-d', 'annexure-e', 'annexure-f', 'annexure-g', 'annexure-h', 'annexure-i', 'annexure-j', 'annexure-k'
        ];
        window.activeReport.sectionOrder = defaultOrder;
        await saveReportToServer(window.activeReport);

        const editorContainer = document.getElementById('repl-editor-container');
        if (editorContainer) {
          renderCustomReportGenerator(editorContainer, window.activeReport);
        }
        toast("Section order reset to default successfully!", "success");
      }
    }
  });
}

function addCustomSection(reportId, reportName) {
  const confirmBtn = document.getElementById('custom-pdf-modal-confirm-btn');
  const input = document.getElementById('custom-pdf-title-input');
  if (input) {
    input.value = '';
  }
  if (confirmBtn) {
    const escapedReportName = reportName.replace(/'/g, "\\'");
    confirmBtn.setAttribute('onclick', `window.confirmAddCustomSection('${reportId}', '${escapedReportName}')`);
  }
  
  if (typeof window.openModal === 'function') {
    window.openModal('modal-custom-pdf');
  }
  
  setTimeout(() => {
    if (input) input.focus();
  }, 100);
}

function closeCustomPdfModal() {
  if (typeof window.closeModal === 'function') {
    window.closeModal('modal-custom-pdf');
  }
}

async function confirmAddCustomSection(reportId, reportName) {
  const input = document.getElementById('custom-pdf-title-input');
  if (!input) return;
  const name = input.value.trim();
  if (!name) {
    toast("Please enter a section title", "error");
    return;
  }
  
  closeCustomPdfModal();
  
  if (window.activeReport && window.activeReport.id === reportId) {
    if (!window.activeReport.customSections) window.activeReport.customSections = [];
    const newSecId = 'custom-pdf-' + Date.now();
    const newSec = { id: newSecId, name: name, type: 'Custom PDF', isCustom: true };
    
    window.activeReport.customSections.push(newSec);
    if (!window.activeReport.sectionOrder) window.activeReport.sectionOrder = [];
    window.activeReport.sectionOrder.push(newSecId);
    
    await saveReportToServer(window.activeReport);
    
    const editorContainer = document.getElementById('repl-editor-container');
    if (editorContainer) {
      renderCustomReportGenerator(editorContainer, window.activeReport);
    }
    toast("Custom PDF section added successfully!", "success");
  }
}

function frontMatterUploadKey(sectionId) {
  return {
    'fm-cover': 'cover',
    'fm-toc': 'toc',
    'fm-pref': 'pref',
    'fm-ack': 'ack',
    'fm-cert': 'cert'
  }[sectionId] || sectionId;
}

function restoreReportFrontMatterPdfs(report) {
  if (!report || !report.frontMatterPdfs) return;
  if (!S.uploadedPDFs) S.uploadedPDFs = {};
  Object.keys(report.frontMatterPdfs).forEach(key => {
    if (Array.isArray(report.frontMatterPdfs[key]) && report.frontMatterPdfs[key].length) {
      S.uploadedPDFs[key] = report.frontMatterPdfs[key];
    }
  });
}

function handleFrontMatterPdfUpload(input, reportId, sectionId, reportName) {
  const file = input.files[0];
  if (!file) return;
  if (file.type !== 'application/pdf') {
    toast("Please upload a PDF file", "error");
    input.value = '';
    return;
  }

  const uploadKey = frontMatterUploadKey(sectionId);
  toast("Processing front matter PDF... Please wait", "info");

  const savePages = (pages) => {
    if (!S.uploadedPDFs) S.uploadedPDFs = {};
    S.uploadedPDFs[uploadKey] = pages;

    const reports = loadLocalReports();
    const report = reports.find(r => r.id === reportId);
    if (report) {
      if (!report.frontMatterPdfs) report.frontMatterPdfs = {};
      report.frontMatterPdfs[uploadKey] = pages;
      saveLocalReports(reports);

      const editorContainer = document.getElementById('repl-editor-container');
      if (editorContainer) renderCustomReportGenerator(editorContainer, report);
    }

    if (window.debouncedSaveState) window.debouncedSaveState();
    toast("Front matter PDF uploaded successfully!", "success");
  };

  if (typeof renderPdfToImages === 'function') {
    renderPdfToImages(file, (err, imgs) => {
      input.value = '';
      if (err) {
        console.error(err);
        toast("Failed to process PDF pages", "error");
        return;
      }
      savePages(imgs);
    });
  } else {
    const url = URL.createObjectURL(file);
    input.value = '';
    savePages([url]);
  }
}

function removeFrontMatterPdfUpload(reportId, sectionId, reportName) {
  showCustomConfirmModal({
    title: "Remove front matter PDF?",
    message: "The uploaded PDF for this front matter part will be removed from this replenishment report.",
    confirmText: "Remove",
    tone: "danger",
    onConfirm: () => {
      const uploadKey = frontMatterUploadKey(sectionId);
      const reports = loadLocalReports();
      const report = reports.find(r => r.id === reportId);
      if (report) {
        if (report.frontMatterPdfs) {
          delete report.frontMatterPdfs[uploadKey];
        }
        if (S.uploadedPDFs) {
          delete S.uploadedPDFs[uploadKey];
        }
        saveLocalReports(reports);

        const editorContainer = document.getElementById('repl-editor-container');
        if (editorContainer) renderCustomReportGenerator(editorContainer, report);
        toast("Front matter PDF removed successfully!", "success");
      }
    }
  });
}

function getCurrentOfficerName() {
  return (S.currentUser && (S.currentUser.fullName || S.currentUser.email || S.currentUser.username)) || 'Officer';
}

async function uploadReplenishmentFileToServer(file, reportId, requirementId) {
  const params = new URLSearchParams({
    name: file.name,
    module: 'replenishment',
    requirementId,
    uploadedBy: getCurrentOfficerName()
  });
  if (S.activeProject && S.activeProject.id) params.set('projectId', S.activeProject.id);
  const token = localStorage.getItem('dsr_token');
  const headers = {
    'Content-Type': file.type || 'application/octet-stream',
    'X-File-Name': file.name,
    'X-Uploaded-By': getCurrentOfficerName()
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const baseUrl = (typeof API_BASE_URL !== 'undefined' && API_BASE_URL)
    ? API_BASE_URL
    : (window.location && window.location.protocol === 'file:' ? 'http://localhost:8080/api' : `${window.location.origin}/api`);
  const response = await fetch(`${baseUrl}/files/upload?${params.toString()}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers,
    body: file
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.error || data.message || `Upload failed (${response.status})`);
  }
  return data;
}

function resolveReplenishmentFileUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || /^blob:/i.test(url) || /^data:/i.test(url)) return url;
  if (!window.location || window.location.protocol !== 'file:') return url;
  const apiBase = (typeof API_BASE_URL !== 'undefined' && API_BASE_URL) ? API_BASE_URL : 'http://localhost:8080/api';
  const originBase = apiBase.replace(/\/api\/?$/i, '');
  if (url.startsWith('/api/')) return `${apiBase}${url.slice(4)}`;
  if (url.startsWith('/uploads/')) return `${originBase}${url}`;
  return `${originBase}/${url.replace(/^\/+/, '')}`;
}

async function handleReplenishmentRequirementUpload(input, reportId, requirementId) {
  const file = input.files && input.files[0];
  if (!file) return;
  const maxBytes = 200 * 1024 * 1024;
  if (file.size > maxBytes) {
    toast("File exceeds the 200 MB upload limit.", "error");
    input.value = '';
    return;
  }
  const reports = loadLocalReports();
  const report = reports.find(r => r.id === reportId) || window.activeReport;
  if (!report) return;

  try {
    toast("Uploading file to server...", "info");
    const uploaded = await uploadReplenishmentFileToServer(file, reportId, requirementId);
    if (!report.replenishmentUploads) report.replenishmentUploads = {};
    const existing = Array.isArray(report.replenishmentUploads[requirementId]) ? report.replenishmentUploads[requirementId] : [];
    report.replenishmentUploads[requirementId] = [
      ...existing,
      {
        id: uploaded.id,
        name: uploaded.originalName || uploaded.fileName || file.name,
        savedName: uploaded.savedName || uploaded.fileName,
        fileName: uploaded.fileName,
        size: uploaded.sizeBytes || file.size,
        type: uploaded.contentType || file.type || 'application/octet-stream',
        uploadedBy: uploaded.uploadedBy || getCurrentOfficerName(),
        uploadedAt: uploaded.uploadedAt || new Date().toISOString(),
        version: uploaded.version || existing.length + 1,
        url: uploaded.url,
        downloadUrl: uploaded.downloadUrl
      }
    ];
    input.value = '';

    const cached = reports.find(r => r.id === report.id);
    if (cached) cached.replenishmentUploads = report.replenishmentUploads;
    window.activeReport = report;
    saveLocalReports(reports.length ? reports : [report]);

    const editorContainer = document.getElementById('repl-editor-container');
    if (editorContainer) renderCustomReportGenerator(editorContainer, report);
    toast("File uploaded and saved successfully.", "success");
  } catch (err) {
    input.value = '';
    toast("Upload failed: " + err.message, "error");
  }
}

function updateReplenishmentManualEntry(textarea, reportId, requirementId) {
  const reports = loadLocalReports();
  const report = reports.find(r => r.id === reportId) || window.activeReport;
  if (!report) return;
  if (!report.manualEntries) report.manualEntries = {};
  report.manualEntries[requirementId] = textarea.value;

  const cached = reports.find(r => r.id === report.id);
  if (cached) cached.manualEntries = report.manualEntries;
  window.activeReport = report;
  saveLocalReports(reports.length ? reports : [report]);
}

function deleteReplenishmentRequirementUpload(reportId, requirementId) {
  showCustomConfirmModal({
    title: "Delete uploaded file?",
    message: "This officer-uploaded replacement will be removed. If the item was imported from Final DSR, the inherited source will remain available.",
    confirmText: "Delete",
    tone: "danger",
    onConfirm: async () => {
      const reports = loadLocalReports();
      const report = reports.find(r => r.id === reportId) || window.activeReport;
      if (!report) return;
      const files = report.replenishmentUploads && Array.isArray(report.replenishmentUploads[requirementId])
        ? report.replenishmentUploads[requirementId]
        : [];
      const latestFile = files[files.length - 1];
      if (latestFile && latestFile.savedName) {
        try {
          await apiFetch(`/files/${encodeURIComponent(latestFile.savedName)}`, { method: 'DELETE' });
        } catch (err) {
          toast("Server file delete failed: " + err.message, "error");
          return;
        }
      }
      if (report.replenishmentUploads) {
        delete report.replenishmentUploads[requirementId];
      }
      const cached = reports.find(r => r.id === report.id);
      if (cached) cached.replenishmentUploads = report.replenishmentUploads || {};
      window.activeReport = report;
      saveLocalReports(reports.length ? reports : [report]);
      const editorContainer = document.getElementById('repl-editor-container');
      if (editorContainer) renderCustomReportGenerator(editorContainer, report);
      toast("Uploaded file removed.", "success");
    }
  });
}

function handleCustomSectionPdfUpload(input, reportId, sectionId, reportName) {
  const file = input.files[0];
  if (!file) return;
  if (file.type !== 'application/pdf') {
    toast("Please upload a PDF file", "error");
    return;
  }
  
  toast("Processing PDF... Please wait", "info");
  
  if (typeof renderPdfToImages === 'function') {
    renderPdfToImages(file, (err, imgs) => {
      if (err) {
        console.error(err);
        toast("Failed to process PDF pages", "error");
        return;
      }
      
      if (!S.uploadedPDFs) S.uploadedPDFs = {};
      S.uploadedPDFs[sectionId] = imgs;
      
      if (window.debouncedSaveState) window.debouncedSaveState();
      
      const reports = loadLocalReports();
      const report = reports.find(r => r.id === reportId);
      if (report) {
        if (!report.customPdfs) report.customPdfs = {};
        report.customPdfs[sectionId] = imgs;
        saveLocalReports(reports);
        
        const editorContainer = document.getElementById('repl-editor-container');
        if (editorContainer) {
          renderCustomReportGenerator(editorContainer, report);
        }
      }
      toast("PDF uploaded and processed successfully!", "success");
    });
  } else {
    const url = URL.createObjectURL(file);
    if (!S.uploadedPDFs) S.uploadedPDFs = {};
    S.uploadedPDFs[sectionId] = [url];
    
    const reports = loadLocalReports();
    const report = reports.find(r => r.id === reportId);
    if (report) {
      if (!report.customPdfs) report.customPdfs = {};
      report.customPdfs[sectionId] = [url];
      saveLocalReports(reports);
      
      const editorContainer = document.getElementById('repl-editor-container');
      if (editorContainer) {
        renderCustomReportGenerator(editorContainer, report);
      }
    }
    toast("PDF uploaded successfully", "success");
  }
}

function removeCustomSectionPdf(reportId, sectionId, reportName) {
  showCustomConfirmModal({
    title: "Remove uploaded PDF?",
    message: "The PDF attached to this custom section will be removed.",
    confirmText: "Remove",
    tone: "danger",
    onConfirm: async () => {
      if (window.activeReport && window.activeReport.id === reportId) {
        if (window.activeReport.customPdfs) {
          delete window.activeReport.customPdfs[sectionId];
        }
        if (S.uploadedPDFs) {
          delete S.uploadedPDFs[sectionId];
        }
        await saveReportToServer(window.activeReport);

        const editorContainer = document.getElementById('repl-editor-container');
        if (editorContainer) {
          renderCustomReportGenerator(editorContainer, window.activeReport);
        }
        toast("PDF removed successfully!", "success");
      }
    }
  });
}

function deleteCustomSection(reportId, sectionId, reportName) {
  showCustomConfirmModal({
    title: "Delete custom section?",
    message: "This custom PDF section and its uploaded file will be deleted from the report.",
    confirmText: "Delete",
    tone: "danger",
    onConfirm: async () => {
      if (window.activeReport && window.activeReport.id === reportId) {
        if (window.activeReport.customSections) {
          window.activeReport.customSections = window.activeReport.customSections.filter(cs => cs.id !== sectionId);
        }
        if (window.activeReport.sectionOrder) {
          window.activeReport.sectionOrder = window.activeReport.sectionOrder.filter(id => id !== sectionId);
        }
        if (window.activeReport.customPdfs) {
          delete window.activeReport.customPdfs[sectionId];
        }
        if (S.uploadedPDFs) {
          delete S.uploadedPDFs[sectionId];
        }
        await saveReportToServer(window.activeReport);

        const editorContainer = document.getElementById('repl-editor-container');
        if (editorContainer) {
          renderCustomReportGenerator(editorContainer, window.activeReport);
        }
        toast("Custom section deleted successfully!", "success");
      }
    }
  });
}

function hydrateCheckboxStates(checkedIds) {
  if (!checkedIds) return;
  
  checkedIds.forEach(id => {
    const chk = document.getElementById(`chk-${id}`);
    if (chk) chk.checked = true;
  });
  
  ['front-matter', 'chapters', 'plates'].forEach(parentId => {
    const parentChk = document.getElementById(`chk-${parentId}`);
    if (!parentChk) return;
    
    const children = Array.from(document.querySelectorAll(`input[data-parent="${parentId}"]`));
    const checkedChildren = children.filter(c => c.checked);
    
    if (checkedChildren.length === children.length && children.length > 0) {
      parentChk.checked = true;
      parentChk.indeterminate = false;
    } else if (checkedChildren.length === 0) {
      parentChk.checked = false;
      parentChk.indeterminate = false;
    } else {
      parentChk.checked = false;
      parentChk.indeterminate = true;
    }
  });
}

function onParentCheckboxChange(parentId, reportName, reportId) {
  const parentChk = document.getElementById(`chk-${parentId}`);
  if (!parentChk) return;
  const isChecked = parentChk.checked;
  
  const children = document.querySelectorAll(`input[data-parent="${parentId}"]`);
  children.forEach(child => {
    child.checked = isChecked;
  });
  
  saveReportSelection(reportId);
  window.updateCustomReportPreview(reportName, reportId);
}

function onSubCheckboxChange(parentId, reportName, reportId) {
  const parentChk = document.getElementById(`chk-${parentId}`);
  if (!parentChk) return;
  
  const children = Array.from(document.querySelectorAll(`input[data-parent="${parentId}"]`));
  const checkedChildren = children.filter(c => c.checked);
  
  if (checkedChildren.length === children.length) {
    parentChk.checked = true;
    parentChk.indeterminate = false;
  } else if (checkedChildren.length === 0) {
    parentChk.checked = false;
    parentChk.indeterminate = false;
  } else {
    parentChk.checked = false;
    parentChk.indeterminate = true;
  }
  
  saveReportSelection(reportId);
  window.updateCustomReportPreview(reportName, reportId);
}

function getReplenishmentUploadKey(requirementId, itemName) {
  return itemName ? `${requirementId}::${itemName}` : requirementId;
}

function getReplenishmentRequirementById(requirementId) {
  return REPLENISHMENT_MISSING_REQUIREMENTS.find(group => group.id === requirementId);
}

function getReplenishmentAcceptedFormats(requirement) {
  if (!requirement || !requirement.formats) return '';
  return requirement.formats
    .split(',')
    .map(ext => ext.trim().toLowerCase())
    .filter(Boolean)
    .flatMap(ext => ext === 'geotiff' ? ['.tif', '.tiff'] : [`.${ext}`])
    .join(',');
}

function isReplenishmentItemImported(scan, itemName) {
  return Array.isArray(scan?.inherited) && scan.inherited.includes(itemName);
}

function getReplenishmentUploadedFiles(report, key) {
  const uploads = report.replenishmentUploads || {};
  const direct = Array.isArray(uploads[key]) ? uploads[key] : [];
  return direct;
}

function getReplenishmentSectionItems(section) {
  const requirement = section.requirementId ? getReplenishmentRequirementById(section.requirementId) : null;
  const requirementItems = requirement ? requirement.items.map(item => ({
    name: item,
    requirementId: requirement.id,
    formats: requirement.formats,
    accepted: getReplenishmentAcceptedFormats(requirement)
  })) : [];
  const inheritedItems = (section.items || []).map(item => ({
    name: item,
    requirementId: section.requirementId || section.id,
    formats: requirement?.formats || 'PDF',
    accepted: getReplenishmentAcceptedFormats(requirement) || '.pdf'
  }));
  return [...inheritedItems, ...requirementItems];
}

function getReplenishmentSectionStats(report, section) {
  const scan = report.inheritanceScan || {};
  const items = getReplenishmentSectionItems(section);
  let imported = 0;
  let uploaded = 0;
  let pending = 0;

  items.forEach(item => {
    const key = getReplenishmentUploadKey(item.requirementId, item.name);
    const groupFiles = getReplenishmentUploadedFiles(report, item.requirementId);
    if (isReplenishmentItemImported(scan, item.name)) imported += 1;
    else if (getReplenishmentUploadedFiles(report, key).length || groupFiles.length) uploaded += 1;
    else pending += 1;
  });

  if (!items.length) imported = 1;
  const total = Math.max(items.length || 1, 1);
  const complete = Math.min(imported + uploaded, total);
  const percent = Math.round((complete / total) * 100);
  return { total, imported, uploaded, pending, complete, percent };
}

function getReplenishmentSectionStatus(stats) {
  if (stats.percent >= 100) return { label: '100% Complete', color: '#047857', bg: '#ecfdf5', border: '#bbf7d0', icon: 'check-circle' };
  if (stats.percent > 0) return { label: `${stats.percent}% Complete`, color: '#b45309', bg: '#fffbeb', border: '#fde68a', icon: 'alert-triangle' };
  return { label: 'Incomplete', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', icon: 'x-circle' };
}

function toggleReplenishmentInheritanceSection(reportId, sectionId) {
  window.replenishmentOpenInheritanceSection = window.replenishmentOpenInheritanceSection === sectionId ? '' : sectionId;
  const report = (window.activeReport && window.activeReport.id === reportId)
    ? window.activeReport
    : loadLocalReports().find(r => r.id === reportId);
  const editorContainer = document.getElementById('repl-editor-container');
  if (report && editorContainer) renderCustomReportGenerator(editorContainer, report);
}

function previewReplenishmentSourceItem(itemName) {
  showCustomConfirmModal({
    title: itemName,
    message: "This item is currently inherited from the selected Final DSR. Use Change to replace it with a new officer-uploaded file.",
    confirmText: "Close",
    tone: "info"
  });
}

function previewReplenishmentUploadedItem(reportId, uploadKey, itemName) {
  const report = (window.activeReport && window.activeReport.id === reportId)
    ? window.activeReport
    : loadLocalReports().find(r => r.id === reportId);
  const files = report ? getReplenishmentUploadedFiles(report, uploadKey) : [];
  const file = files[files.length - 1];
  if (!file) {
    toast("No uploaded file available for preview.", "info");
    return;
  }
  if (file.url) {
    window.open(resolveReplenishmentFileUrl(file.url), '_blank', 'noopener,noreferrer');
    return;
  }
  const uploadedDate = file.uploadedAt ? new Date(file.uploadedAt).toLocaleString() : 'Not available';
  showCustomConfirmModal({
    title: `Preview - ${itemName}`,
    message: `File: ${file.name}\nType: ${file.type || 'Unknown'}\nUploaded By: ${file.uploadedBy || 'Officer'}\nUploaded On: ${uploadedDate}\n\nPreview metadata is available here. File content preview will open when persistent storage is connected.`,
    confirmText: "Close",
    tone: "info"
  });
}

function downloadReplenishmentUploadedItem(reportId, uploadKey) {
  const report = (window.activeReport && window.activeReport.id === reportId)
    ? window.activeReport
    : loadLocalReports().find(r => r.id === reportId);
  const files = report ? getReplenishmentUploadedFiles(report, uploadKey) : [];
  const file = files[files.length - 1];
  if (!file) {
    toast("No uploaded file available for download.", "info");
    return;
  }
  const downloadUrl = resolveReplenishmentFileUrl(file.downloadUrl || file.url);
  if (!downloadUrl) {
    toast("Download URL is not available for this file.", "error");
    return;
  }
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = file.name || 'replenishment-upload';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function renderReplenishmentItemRow(report, section, item) {
  const scan = report.inheritanceScan || {};
  const key = getReplenishmentUploadKey(item.requirementId, item.name);
  const groupFiles = getReplenishmentUploadedFiles(report, item.requirementId);
  const itemFiles = getReplenishmentUploadedFiles(report, key);
  const files = itemFiles.length ? itemFiles : groupFiles;
  const actionKey = itemFiles.length ? key : item.requirementId;
  const latestFile = files[files.length - 1];
  const imported = isReplenishmentItemImported(scan, item.name) && !files.length;
  const escapedItem = escapeHtml(item.name);
  const inputId = `repl-req-upload-${section.id}-${String(item.name).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  if (imported) {
    return `
      <div style="border:1px solid #bbf7d0; background:#f0fdf4; border-radius:8px; padding:10px; display:grid; grid-template-columns:1fr auto; gap:10px; align-items:center;">
        <div>
          <div style="font-size:12px; font-weight:800; color:#14532d; display:flex; align-items:center; gap:6px;">
            <i data-lucide="check-circle" style="width:14px; height:14px;"></i>${escapedItem}
          </div>
          <div style="font-size:11px; color:#047857; margin-top:3px;">Imported from Final DSR</div>
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap; justify-content:flex-end;">
          <button type="button" onclick="window.previewReplenishmentSourceItem('${escapeHtml(item.name).replace(/&#39;/g, "\\'")}')" style="border:1px solid #bbf7d0; background:#fff; color:#047857; border-radius:6px; padding:5px 8px; font-size:11px; font-weight:800; cursor:pointer;">Preview</button>
          <button type="button" onclick="document.getElementById('${inputId}').click()" style="border:1px solid #bfdbfe; background:#eff6ff; color:#1d4ed8; border-radius:6px; padding:5px 8px; font-size:11px; font-weight:800; cursor:pointer;">Change</button>
          <input type="file" id="${inputId}" accept="${item.accepted}" style="display:none;" onchange="window.handleReplenishmentRequirementUpload(this, '${report.id}', '${key}')">
        </div>
      </div>
    `;
  }

  if (latestFile) {
    const uploadedDate = latestFile.uploadedAt ? new Date(latestFile.uploadedAt).toLocaleString() : 'Not available';
    return `
      <div style="border:1px solid #bfdbfe; background:#eff6ff; border-radius:8px; padding:10px; display:grid; grid-template-columns:1fr auto; gap:10px; align-items:center;">
        <div>
          <div style="font-size:12px; font-weight:800; color:#1d4ed8; display:flex; align-items:center; gap:6px;">
            <i data-lucide="check-circle" style="width:14px; height:14px;"></i>${escapedItem}
          </div>
          <div style="font-size:11px; color:#1e40af; margin-top:3px;">Uploaded Successfully - ${escapeHtml(latestFile.name)}${latestFile.version ? ` (v${escapeHtml(latestFile.version)})` : ''}</div>
          <div style="font-size:10.5px; color:#475569; margin-top:2px;">Uploaded by ${escapeHtml(latestFile.uploadedBy || 'Officer')} on ${escapeHtml(uploadedDate)}</div>
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap; justify-content:flex-end;">
          <button type="button" onclick="window.previewReplenishmentUploadedItem('${report.id}', '${actionKey}', '${escapeHtml(item.name).replace(/&#39;/g, "\\'")}')" style="border:1px solid #bfdbfe; background:#fff; color:#1d4ed8; border-radius:6px; padding:5px 8px; font-size:11px; font-weight:800; cursor:pointer;">Preview</button>
          <button type="button" onclick="window.downloadReplenishmentUploadedItem('${report.id}', '${actionKey}')" style="border:1px solid #bfdbfe; background:#fff; color:#1d4ed8; border-radius:6px; padding:5px 8px; font-size:11px; font-weight:800; cursor:pointer;">Download</button>
          <button type="button" onclick="document.getElementById('${inputId}').click()" style="border:1px solid #bfdbfe; background:#fff; color:#1d4ed8; border-radius:6px; padding:5px 8px; font-size:11px; font-weight:800; cursor:pointer;">Replace</button>
          <button type="button" onclick="window.deleteReplenishmentRequirementUpload('${report.id}', '${actionKey}')" style="border:1px solid #fecaca; background:#fff; color:#b91c1c; border-radius:6px; padding:5px 8px; font-size:11px; font-weight:800; cursor:pointer;">Delete</button>
          <input type="file" id="${inputId}" accept="${item.accepted}" style="display:none;" onchange="window.handleReplenishmentRequirementUpload(this, '${report.id}', '${key}')">
        </div>
      </div>
    `;
  }

  return `
    <div style="border:1px solid #fde68a; background:#fffbeb; border-radius:8px; padding:10px; display:grid; grid-template-columns:1fr auto; gap:10px; align-items:center;">
      <div>
        <div style="font-size:12px; font-weight:800; color:#92400e;">${escapedItem}</div>
        <div style="font-size:11px; color:#b45309; margin-top:3px;">Upload Required</div>
        <div style="font-size:10.5px; color:#64748b; margin-top:2px;">Supported formats: ${escapeHtml(item.formats || 'PDF')}</div>
      </div>
      <div style="display:flex; gap:6px; justify-content:flex-end;">
        <button type="button" onclick="document.getElementById('${inputId}').click()" style="border:1px solid #fdba74; background:#fff7ed; color:#c2410c; border-radius:6px; padding:5px 8px; font-size:11px; font-weight:800; cursor:pointer;">Upload</button>
        <input type="file" id="${inputId}" accept="${item.accepted}" style="display:none;" onchange="window.handleReplenishmentRequirementUpload(this, '${report.id}', '${key}')">
      </div>
    </div>
  `;
}

function renderInheritancePanel(report) {
  const scan = report.inheritanceScan;
  if (!scan || !report.finalDsrSource) return '';
  const sectionStats = REPLENISHMENT_REPORT_ACCORDION_SECTIONS.map(section => ({
    section,
    stats: getReplenishmentSectionStats(report, section)
  }));
  const completedSections = sectionStats.filter(entry => entry.stats.percent >= 100).length;
  const overallProgress = Math.round(sectionStats.reduce((sum, entry) => sum + entry.stats.percent, 0) / sectionStats.length);
  const openSectionId = window.replenishmentOpenInheritanceSection || '';

  const sectionCardsHtml = sectionStats.map(({ section, stats }) => {
    const status = getReplenishmentSectionStatus(stats);
    const isOpen = openSectionId === section.id;
    const items = getReplenishmentSectionItems(section);
    const detailsHtml = isOpen ? `
      <div style="border-top:1px solid #e2e8f0; padding:12px; background:#ffffff;">
        ${items.length ? `
          <div style="display:flex; flex-direction:column; gap:8px;">
            ${items.map(item => renderReplenishmentItemRow(report, section, item)).join('')}
          </div>
        ` : `
          <div style="border:1px solid #bbf7d0; background:#f0fdf4; color:#047857; border-radius:8px; padding:10px; font-size:12px; font-weight:800;">
            <i data-lucide="check-circle" style="width:14px; height:14px; vertical-align:-2px;"></i> Section structure inherited from Final DSR.
          </div>
        `}
      </div>
    ` : '';

    return `
      <div style="border:1px solid ${status.border}; border-radius:10px; background:#fff; overflow:hidden;">
        <button type="button" onclick="window.toggleReplenishmentInheritanceSection('${report.id}', '${section.id}')" style="width:100%; border:none; background:${isOpen ? '#f8fafc' : '#ffffff'}; padding:12px; cursor:pointer; text-align:left; display:grid; grid-template-columns:auto 1fr auto; gap:10px; align-items:center;">
          <span style="color:#64748b; display:flex; align-items:center;">
            <i data-lucide="${isOpen ? 'chevron-down' : 'chevron-right'}" style="width:16px; height:16px;"></i>
          </span>
          <span>
            <span style="display:flex; align-items:center; gap:7px; color:#0f172a; font-size:13px; font-weight:900;">
              <i data-lucide="${status.icon}" style="width:15px; height:15px; color:${status.color};"></i>${escapeHtml(section.title)}
            </span>
            <span style="display:flex; gap:8px; flex-wrap:wrap; margin-top:6px;">
              <span style="font-size:10.5px; color:#047857; font-weight:800;">Imported ${stats.imported}</span>
              <span style="font-size:10.5px; color:#1d4ed8; font-weight:800;">Uploaded ${stats.uploaded}</span>
              <span style="font-size:10.5px; color:#b45309; font-weight:800;">Pending ${stats.pending}</span>
            </span>
          </span>
          <span style="font-size:11px; font-weight:900; color:${status.color}; background:${status.bg}; border:1px solid ${status.border}; border-radius:999px; padding:4px 9px; white-space:nowrap;">${status.label}</span>
        </button>
        ${detailsHtml}
      </div>
    `;
  }).join('');

  return `
    <div id="repl-inheritance-scroll-panel" style="border-bottom:1px solid #e2e8f0; background:#f8fafc; padding:14px 20px; max-height:min(56vh, 560px); overflow-y:auto; overflow-x:hidden; scrollbar-gutter:stable; scrollbar-width:thin; scrollbar-color:#94a3b8 #e2e8f0;">
      <style>
        #repl-inheritance-scroll-panel::-webkit-scrollbar { width: 10px; }
        #repl-inheritance-scroll-panel::-webkit-scrollbar-track { background: #e2e8f0; border-radius: 999px; }
        #repl-inheritance-scroll-panel::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 999px; border: 2px solid #e2e8f0; }
        #repl-inheritance-scroll-panel::-webkit-scrollbar-thumb:hover { background: #64748b; }
      </style>
      <div style="display:flex; justify-content:space-between; gap:16px; align-items:flex-start; flex-wrap:wrap; margin-bottom:12px;">
        <div style="min-width:260px; flex:1;">
          <div style="font-size:11px; color:#64748b; font-weight:900; text-transform:uppercase; letter-spacing:.4px;">Replenishment Report - Final DSR Inheritance</div>
          <div style="font-size:14px; font-weight:900; color:#0f172a; margin-top:2px;">${escapeHtml(getProjectDisplayLabel(report.finalDsrSource))}</div>
          <div style="font-size:11px; color:#475569; margin-top:4px;">Open a section to view imported data, pending uploads, preview options, and replacement controls.</div>
        </div>
        <div style="display:grid; grid-template-columns:repeat(2, minmax(120px, auto)); gap:8px;">
          <div style="border:1px solid #bfdbfe; background:#eff6ff; border-radius:10px; padding:8px 10px;">
            <div style="font-size:10px; color:#1d4ed8; font-weight:900; text-transform:uppercase;">Overall Progress</div>
            <div style="font-size:20px; color:#1e3a8a; font-weight:900;">${overallProgress}%</div>
          </div>
          <div style="border:1px solid #bbf7d0; background:#ecfdf5; border-radius:10px; padding:8px 10px;">
            <div style="font-size:10px; color:#047857; font-weight:900; text-transform:uppercase;">Completed Sections</div>
            <div style="font-size:20px; color:#065f46; font-weight:900;">${completedSections}/${sectionStats.length}</div>
          </div>
        </div>
      </div>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(310px, 1fr)); gap:10px;">
        ${sectionCardsHtml}
      </div>
    </div>
  `;
}

function renderCustomReportGenerator(container, report) {
  const reportName = report.name;
  const sections = [
    { 
      id: 'front-matter', 
      name: 'Front Matter', 
      type: 'DSR', 
      hasSubsections: true,
      subsections: [
        { id: 'fm-cover', name: 'Cover Page', uploadKey: 'cover' },
        { id: 'fm-toc', name: 'Content Page', uploadKey: 'toc' },
        { id: 'fm-pref', name: 'Preface', uploadKey: 'pref' },
        { id: 'fm-ack', name: 'Acknowledgement', uploadKey: 'ack' },
        { id: 'fm-cert', name: 'Certificate of Compliance', uploadKey: 'cert' }
      ]
    },
    { 
      id: 'chapters', 
      name: 'Chapters Outline', 
      type: 'DSR', 
      hasSubsections: true,
      subsections: (S.chapters || []).map(ch => ({ id: `chapter-${ch.id}`, name: ch.name }))
    },
    { 
      id: 'plates', 
      name: 'Plate Section', 
      type: 'DSR', 
      hasSubsections: true,
      subsections: (S.plates || []).map(pl => ({ id: `plate-${pl.id}`, name: pl.name }))
    },
    { id: 'anx1', name: 'Annexure I - Sources', type: 'Annexure' },
    { id: 'anx2', name: 'Annexure II - Leases', type: 'Annexure' },
    { id: 'anx3', name: 'Annexure III - Clusters', type: 'Annexure' },
    { id: 'anx4', name: 'Annexure IV - Transport', type: 'Annexure' },
    { id: 'anx5', name: 'Annexure V - Bench Mark & CORS', type: 'Annexure' },
    { id: 'anx6', name: 'Annexure VI - Final Cluster Details', type: 'Annexure' },
    { id: 'anx7', name: 'Annexure VII - Transportation Routes', type: 'Annexure' },
    { id: 'annexure-b', name: 'Annexure B', type: 'More Annexures' },
    { id: 'annexure-c', name: 'Annexure C', type: 'More Annexures' },
    { id: 'annexure-d', name: 'Annexure D', type: 'More Annexures' },
    { id: 'annexure-e', name: 'Annexure E', type: 'More Annexures' },
    { id: 'annexure-f', name: 'Annexure F', type: 'More Annexures' },
    { id: 'annexure-g', name: 'Annexure G', type: 'More Annexures' },
    { id: 'annexure-h', name: 'Annexure H', type: 'More Annexures' },
    { id: 'annexure-i', name: 'Annexure I', type: 'More Annexures' },
    { id: 'annexure-j', name: 'Annexure J', type: 'More Annexures' },
    { id: 'annexure-k', name: 'Annexure K', type: 'More Annexures' }
  ];

  // Restore custom PDF pages into S.uploadedPDFs
  restoreReportFrontMatterPdfs(report);

  if (report.customPdfs) {
    if (!S.uploadedPDFs) S.uploadedPDFs = {};
    Object.keys(report.customPdfs).forEach(secId => {
      S.uploadedPDFs[secId] = report.customPdfs[secId];
    });
  }

  // Load and append custom PDF sections
  if (report.customSections && Array.isArray(report.customSections)) {
    report.customSections.forEach(cs => {
      sections.push({
        id: cs.id,
        name: cs.name,
        type: cs.type || 'Custom PDF',
        isCustom: true
      });
    });
  }

  // Ensure report has a valid and complete sectionOrder
  const allSectionIds = sections.map(s => s.id);
  if (!report.sectionOrder || !Array.isArray(report.sectionOrder)) {
    report.sectionOrder = allSectionIds;
    const reports = loadLocalReports();
    const existing = reports.find(r => r.id === report.id);
    if (existing) {
      existing.sectionOrder = report.sectionOrder;
      saveLocalReports(reports);
    }
  } else {
    // Append any missing section IDs to sectionOrder (in case new sections are added in code later)
    const missingIds = allSectionIds.filter(id => !report.sectionOrder.includes(id));
    if (missingIds.length > 0) {
      report.sectionOrder = [...report.sectionOrder, ...missingIds];
      const reports = loadLocalReports();
      const existing = reports.find(r => r.id === report.id);
      if (existing) {
        existing.sectionOrder = report.sectionOrder;
        saveLocalReports(reports);
      }
    }
  }

  // Sort sections based on report.sectionOrder
  sections.sort((a, b) => {
    const idxA = report.sectionOrder.indexOf(a.id);
    const idxB = report.sectionOrder.indexOf(b.id);
    return idxA - idxB;
  });

  let checklistHtml = '';
  sections.forEach(s => {
    const escapedReportName = reportName.replace(/'/g, "\\'");
    if (s.isCustom) {
      const pages = S.uploadedPDFs && S.uploadedPDFs[s.id];
      const hasPages = pages && pages.length > 0;
      
      checklistHtml += `
        <div class="draggable-section-item" data-section-id="${s.id}" style="margin-bottom:12px; padding:12px; background:#f8fafc; border-radius:6px; border:1px solid #e2e8f0; position:relative; transition: all 0.2s ease;">
          <div style="display:flex; align-items:center; justify-content:space-between; width:100%; margin-bottom:8px;">
            <div style="display:flex; align-items:center; gap:10px; flex:1;">
              <span class="drag-handle" style="cursor: grab; color: #94a3b8; display: flex; align-items: center; padding: 4px 2px;">
                <i data-lucide="grip-vertical" style="width: 14px; height: 14px;"></i>
              </span>
              <input type="checkbox" id="chk-${s.id}" value="${s.id}" onchange="window.updateCustomReportPreview('${escapedReportName}', '${report.id}')" style="width:16px; height:16px; cursor:pointer;">
              <label for="chk-${s.id}" style="font-size:13px; font-weight:700; cursor:pointer; color:#1e293b; display:flex; align-items:center; gap:6px; margin:0; width:100%;">
                <span style="font-size:9px; padding:2px 6px; background:#fef3c7; border-radius:10px; text-transform:uppercase; color:#d97706; font-weight:700;">${s.type}</span>
                <span>${s.name}</span>
              </label>
            </div>
            <div>
              <button onclick="window.deleteCustomSection('${report.id}', '${s.id}', '${escapedReportName}')" title="Delete custom section" style="background:none; border:none; color:#ef4444; cursor:pointer; padding:4px; display:inline-flex; align-items:center; justify-content:center;">
                <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
              </button>
            </div>
          </div>
          
          <!-- PDF Upload Area -->
          <div style="padding-left:36px; margin-top:8px;">
            ${hasPages ? `
              <div style="display:flex; align-items:center; justify-content:space-between; background:#fff; padding:6px 10px; border-radius:6px; border:1px solid #e2e8f0; font-size:12px;">
                <div style="display:flex; align-items:center; gap:6px; color:#1e293b; font-weight:600;">
                  <i data-lucide="file-text" style="width:14px; height:14px; color:#2563eb;"></i>
                  <span>PDF Uploaded (${pages.length} pages)</span>
                </div>
                <button onclick="window.removeCustomSectionPdf('${report.id}', '${s.id}', '${escapedReportName}')" style="background:none; border:none; color:#dc2626; cursor:pointer; font-size:11px; padding:2px 6px; border-radius:4px; font-weight:600; display:inline-block;">Remove</button>
              </div>
            ` : `
              <div style="border: 1px dashed #cbd5e1; border-radius:6px; background:#fff; padding:8px; text-align:center; font-size:12px; color:#64748b; cursor:pointer; position:relative;" onclick="document.getElementById('file-upload-${s.id}').click()">
                <span style="display:flex; align-items:center; justify-content:center; gap:6px;">
                  <i data-lucide="upload-cloud" style="width:14px; height:14px; color:#64748b;"></i>
                  <span>Upload PDF document</span>
                </span>
                <input type="file" id="file-upload-${s.id}" accept="application/pdf" style="display:none;" onchange="window.handleCustomSectionPdfUpload(this, '${report.id}', '${s.id}', '${escapedReportName}')">
              </div>
            `}
          </div>
        </div>
      `;
    } else if (s.hasSubsections) {
      let subHtml = '';
      s.subsections.forEach(sub => {
        const uploadKey = sub.uploadKey || frontMatterUploadKey(sub.id);
        const uploadedPages = s.id === 'front-matter'
          ? ((report.frontMatterPdfs && report.frontMatterPdfs[uploadKey]) || (S.uploadedPDFs && S.uploadedPDFs[uploadKey]))
          : null;
        const hasUploadedPages = Array.isArray(uploadedPages) && uploadedPages.length > 0;
        const uploadControlHtml = s.id === 'front-matter' ? `
          <div style="display:flex; align-items:center; gap:6px; margin-left:auto;">
            ${hasUploadedPages ? `
              <span title="Uploaded PDF pages" style="font-size:10px; color:#2563eb; background:#eff6ff; border:1px solid #bfdbfe; border-radius:999px; padding:2px 7px; font-weight:700; white-space:nowrap;">
                PDF ${uploadedPages.length}p
              </span>
              <button type="button" title="Remove PDF" onclick="event.stopPropagation(); window.removeFrontMatterPdfUpload('${report.id}', '${sub.id}', '${escapedReportName}')" style="border:none; background:#fee2e2; color:#b91c1c; border-radius:4px; padding:3px 6px; font-size:10px; font-weight:700; cursor:pointer;">Remove</button>
            ` : `
              <button type="button" title="Upload PDF" onclick="event.stopPropagation(); document.getElementById('fm-upload-${sub.id}').click()" style="border:1px solid #bfdbfe; background:#eff6ff; color:#1d4ed8; border-radius:4px; padding:3px 7px; font-size:10px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:4px;">
                <i data-lucide="upload" style="width:11px; height:11px;"></i> Upload PDF
              </button>
            `}
            <input type="file" id="fm-upload-${sub.id}" accept="application/pdf" style="display:none;" onchange="window.handleFrontMatterPdfUpload(this, '${report.id}', '${sub.id}', '${escapedReportName}')">
          </div>
        ` : '';
        subHtml += `
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px; min-height:24px;">
            <input type="checkbox" id="chk-${sub.id}" value="${sub.id}" data-parent="${s.id}" onchange="window.onSubCheckboxChange('${s.id}', '${escapedReportName}', '${report.id}')" style="width:14px; height:14px; cursor:pointer; flex:0 0 auto;">
            <label for="chk-${sub.id}" style="font-size:12px; cursor:pointer; color:#475569; margin:0; flex:1; min-width:0;">
              ${sub.name}
            </label>
            ${uploadControlHtml}
          </div>
        `;
      });

      checklistHtml += `
        <div class="draggable-section-item" data-section-id="${s.id}" style="margin-bottom:12px; padding:8px 12px; background:#f8fafc; border-radius:6px; border:1px solid #e2e8f0; position:relative; transition: all 0.2s ease;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span class="drag-handle" style="cursor: grab; color: #94a3b8; display: flex; align-items: center; padding: 4px 2px;">
              <i data-lucide="grip-vertical" style="width: 14px; height: 14px;"></i>
            </span>
            <input type="checkbox" id="chk-${s.id}" value="${s.id}" onchange="window.onParentCheckboxChange('${s.id}', '${escapedReportName}', '${report.id}')" style="width:16px; height:16px; cursor:pointer;">
            <label for="chk-${s.id}" style="font-size:13px; font-weight:700; cursor:pointer; color:#1e293b; display:flex; align-items:center; gap:6px; margin:0; width:100%;">
              <span style="font-size:9px; padding:2px 6px; background:#cbd5e1; border-radius:10px; text-transform:uppercase; color:#475569; font-weight:700;">${s.type}</span>
              <span>${s.name}</span>
            </label>
          </div>
          <div id="sub-container-${s.id}" style="padding-left:18px; margin-top:8px; display:flex; flex-direction:column; gap:4px; border-left: 2px dashed #cbd5e1; margin-left: 35px;">
            ${subHtml}
          </div>
        </div>
      `;
    } else {
      checklistHtml += `
        <div class="draggable-section-item" data-section-id="${s.id}" style="display:flex; align-items:center; gap:10px; margin-bottom:12px; padding:8px 12px; background:#f8fafc; border-radius:6px; border:1px solid #e2e8f0; position:relative; transition: all 0.2s ease;">
          <span class="drag-handle" style="cursor: grab; color: #94a3b8; display: flex; align-items: center; padding: 4px 2px;">
            <i data-lucide="grip-vertical" style="width: 14px; height: 14px;"></i>
          </span>
          <input type="checkbox" id="chk-${s.id}" value="${s.id}" onchange="window.updateCustomReportPreview('${escapedReportName}', '${report.id}')" style="width:16px; height:16px; cursor:pointer;">
          <label for="chk-${s.id}" style="font-size:13px; font-weight:700; cursor:pointer; color:#1e293b; display:flex; align-items:center; gap:6px; margin:0; width:100%;">
            <span style="font-size:9px; padding:2px 6px; background:#e2e8f0; border-radius:10px; text-transform:uppercase; color:#475569; font-weight:700;">${s.type}</span>
            <span>${s.name}</span>
          </label>
        </div>
      `;
    }
  });

  const escapedReportName = reportName.replace(/'/g, "\\'");
  const inheritancePanelHtml = renderInheritancePanel(report);
  container.innerHTML = `
    <div class="card" style="height: calc(100vh - 120px); display: flex; flex-direction: column; margin-top: 15px;">
      <div class="card-hd" style="padding: 16px 20px;">
        <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
          <div>
            <div class="card-title" id="custom-report-title-display" style="font-size:16px; font-weight:800; color:#0f172a;">${reportName}</div>
            <div class="card-sub" style="font-size:12px; color:#64748b;">Select DSR sections & annexures to compile into a Replenishment Studies report</div>
          </div>
          <div style="display:flex; gap:10px;">
            <button class="btn btn-outline" onclick="window.showExistingReportsList()" style="cursor: pointer;">Back</button>
            <button class="btn btn-primary repl-download-pdf-btn" data-report-id="${report.id}" onclick="window.downloadCustomReportPDF('${escapedReportName}', '${report.id}', this)" style="cursor: pointer;">Download PDF</button>
          </div>
        </div>
      </div>
      ${inheritancePanelHtml}
      <div class="card-bd" style="flex:1; display:grid; grid-template-columns: 1fr 1.2fr; gap:20px; overflow:hidden; padding:20px;">
        <!-- LEFT COLUMN: Checklist -->
        <div id="repl-checklist-scroll-container" style="overflow-y:auto; padding-right:10px; border-right:1px solid #e2e8f0; max-height:100%;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; flex-wrap:wrap; gap:8px;">
            <h3 style="margin:0; color:#0f172a; font-size:14px; font-weight:700;">Select Sections:</h3>
            <div style="display:flex; align-items:center; gap:8px;">
              <button onclick="window.resetSectionOrder('${report.id}', '${escapedReportName}')" class="btn btn-outline" style="padding: 4px 8px; font-size: 11px; height: auto; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; cursor: pointer; color: #475569; border-color: #cbd5e1; background: #ffffff;">
                <i data-lucide="rotate-ccw" style="width:11px; height:11px;"></i> Reset Order
              </button>
              <button onclick="window.addCustomSection('${report.id}', '${escapedReportName}')" class="btn btn-outline" style="padding: 4px 8px; font-size: 11px; height: auto; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; cursor: pointer; color: #2563eb; border-color: #bfdbfe; background: #eff6ff;">
                <i data-lucide="file-plus" style="width:11px; height:11px;"></i> Add Custom PDF
              </button>
              <span style="font-size:11px; color:#64748b; background:#f1f5f9; padding:2px 8px; border-radius:4px; display:inline-flex; align-items:center; gap:4px;">
                <i data-lucide="grip-vertical" style="width:12px; height:12px;"></i> Drag to reorder
              </span>
            </div>
          </div>
          <div id="draggable-sections-list">
            ${checklistHtml}
          </div>
        </div>
        
        <!-- RIGHT COLUMN: Preview -->
        <div style="display:flex; flex-direction:column; overflow:hidden; height:100%; background:#f1f5f9; border-radius:8px; border:1px solid #cbd5e1; position:relative;">
          <div style="padding:10px 15px; background:#e2e8f0; border-bottom:1px solid #cbd5e1; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:700; font-size:12px; color:#334155;">Replenishment Studies Preview</span>
            <span id="preview-sections-count" style="font-size:11px; background:#64748b; color:#fff; padding:2px 8px; border-radius:10px;">0 selected</span>
          </div>
          <div style="flex:1; padding:0; background:#fff; overflow:hidden;">
            <iframe id="custom-report-preview-iframe" style="width:100%; height:100%; border:none; background:#fff; display:block;" srcdoc="&lt;html&gt;&lt;body style='font-family:sans-serif; color:#64748b; padding:40px; text-align:center;'&gt;&lt;p&gt;No sections selected yet. Please select sections on the left to see the live preview.&lt;/p&gt;&lt;/body&gt;&lt;/html&gt;"></iframe>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Hydrate checkbox states
  hydrateCheckboxStates(report.sections);
  
  // Render live preview on load
  updateCustomReportPreview(reportName, report.id);

  if (window.lucide) {
    window.lucide.createIcons();
  }

  initDragAndDrop(report.id, reportName);
}

// Debouncer for rendering preview to fix lagging/freezing
let previewTimeout = null;
let previewRenderToken = 0;

function buildReplenishmentPreviewSrcdoc(reportName, pageImages) {
  const pagesHtml = pageImages.map((src, index) => `
    <figure class="repl-preview-page">
      <img src="${src}" alt="Page ${index + 1}">
    </figure>
  `).join('');

  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { box-sizing: border-box; }
          html, body { margin: 0; min-height: 100%; }
          body {
            background: #e2e8f0;
            color: #0f172a;
            font-family: Arial, Helvetica, sans-serif;
            padding: 18px;
          }
          .repl-preview-title {
            max-width: 820px;
            margin: 0 auto 12px;
            color: #334155;
            font-size: 12px;
            font-weight: 700;
          }
          .repl-preview-page {
            width: min(100%, 820px);
            margin: 0 auto 18px;
            background: #ffffff;
            border: 1px solid #cbd5e1;
            box-shadow: 0 10px 24px rgba(15, 23, 42, 0.16);
          }
          .repl-preview-page img {
            display: block;
            width: 100%;
            height: auto;
          }
          @media (max-width: 700px) {
            body { padding: 10px; }
            .repl-preview-page { margin-bottom: 12px; }
          }
        </style>
      </head>
      <body>
        <div class="repl-preview-title">${escapeHtml(reportName)} - ${pageImages.length} page${pageImages.length === 1 ? '' : 's'}</div>
        ${pagesHtml}
      </body>
    </html>`;
}

async function renderReplenishmentPdfBlobToImages(blob) {
  if (!blob) return [];
  if (typeof ensurePortalVendors === 'function') {
    await ensurePortalVendors(['pdfjs']);
  }
  if (!window.pdfjsLib) {
    throw new Error('PDF.js is not available for live preview rendering.');
  }
  if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/build/pdf.worker.min.js';
  }

  const data = new Uint8Array(await blob.arrayBuffer());
  const pdf = await window.pdfjsLib.getDocument({ data }).promise;
  const pages = [];
  for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
    const page = await pdf.getPage(pageNo);
    const viewport = page.getViewport({ scale: 1.45 });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: ctx, viewport }).promise;
    pages.push(canvas.toDataURL('image/jpeg', 0.9));
  }
  return pages;
}

function updateCustomReportPreview(reportName, reportId) {
  if (previewTimeout) {
    clearTimeout(previewTimeout);
  }
  previewTimeout = setTimeout(() => {
    realUpdateCustomReportPreview(reportName, reportId);
  }, 200);
}

async function realUpdateCustomReportPreview(reportName, reportId) {
  const renderToken = ++previewRenderToken;
  const checkedIds = getCurrentSelectedReportSectionIds();
  
  const indeterminateParents = Array.from(document.querySelectorAll('input[id^="chk-"]')).filter(c => c.indeterminate).map(c => c.value);
  const allActiveIds = [...checkedIds, ...indeterminateParents];
  
  const countEl = document.getElementById('preview-sections-count');
  if (countEl) {
    const parentOrStandaloneSelected = Array.from(document.querySelectorAll('input[id^="chk-"]:not([data-parent])')).filter(c => c.checked || c.indeterminate);
    countEl.textContent = `${parentOrStandaloneSelected.length} sections selected`;
  }
  
  const iframe = document.getElementById('custom-report-preview-iframe');
  if (!iframe) return;
  
  if (allActiveIds.length === 0) {
    iframe.removeAttribute('src');
    if (window.activeReplenishmentPdfBlobUrl) {
      try { URL.revokeObjectURL(window.activeReplenishmentPdfBlobUrl); } catch (_) {}
      window.activeReplenishmentPdfBlobUrl = null;
    }
    iframe.srcdoc = `<html><body style='font-family:sans-serif; color:#64748b; padding:40px; text-align:center;'><p>No sections selected yet. Please select sections on the left to see the live preview.</p></body></html>`;
    return;
  }
  
  if (reportId) {
    saveReportSelection(reportId);
  }
  
  // Show standard loader overlay inside preview container
  const previewDiv = iframe.parentNode;
  let loader = document.getElementById('repl-preview-loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'repl-preview-loader';
    loader.style.cssText = `
      position: absolute;
      top: 40px;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.85);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10;
      font-family: sans-serif;
      font-size: 13px;
      color: #1e293b;
      gap: 12px;
    `;
    loader.innerHTML = `
      <div style="width: 24px; height: 24px; border: 3px solid #cbd5e1; border-top-color: #2563eb; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <span style="font-weight:600;">Generating preview...</span>
      <style>
        @keyframes spin { to { transform: rotate(360deg); } }
      </style>
    `;
    previewDiv.appendChild(loader);
  } else {
    loader.style.display = 'flex';
  }
  
  try {
    const reports = loadLocalReports();
    const report = reports.find(r => r.id === reportId);
    const blob = await generateReplenishmentPdfBlob(reportName, checkedIds, reportId, report);
    if (blob) {
      if (renderToken !== previewRenderToken) return;
      if (window.activeReplenishmentPdfBlobUrl) {
        try { URL.revokeObjectURL(window.activeReplenishmentPdfBlobUrl); } catch (_) {}
      }
      const newIframe = iframe.cloneNode(true);
      newIframe.removeAttribute('src');
      window.activeReplenishmentPdfBlobUrl = null;
      const pageImages = await renderReplenishmentPdfBlobToImages(blob);
      if (renderToken !== previewRenderToken) return;
      newIframe.srcdoc = buildReplenishmentPreviewSrcdoc(reportName, pageImages);
      iframe.parentNode.replaceChild(newIframe, iframe);
    }
  } catch (err) {
    console.error('Failed to render live report preview:', err);
  } finally {
    if (loader) loader.style.display = 'none';
  }
}

function cloneSourceWithValues(source) {
  const clone = source.cloneNode(true);
  
  const srcInputs = source.querySelectorAll('input, textarea, select');
  const cloneInputs = clone.querySelectorAll('input, textarea, select');
  
  for (let i = 0; i < srcInputs.length; i++) {
    const srcEl = srcInputs[i];
    const cloneEl = cloneInputs[i];
    if (!cloneEl) continue;
    
    if (srcEl.tagName === 'TEXTAREA') {
      cloneEl.textContent = srcEl.value;
    } else if (srcEl.tagName === 'SELECT') {
      Array.from(cloneEl.options).forEach(opt => {
        if (opt.value === srcEl.value) {
          opt.setAttribute('selected', 'selected');
        } else {
          opt.removeAttribute('selected');
        }
      });
    } else if (srcEl.tagName === 'INPUT') {
      cloneEl.setAttribute('value', srcEl.value);
      if (srcEl.type === 'checkbox' || srcEl.type === 'radio') {
        if (srcEl.checked) cloneEl.setAttribute('checked', 'checked');
        else cloneEl.removeAttribute('checked');
      }
    }
  }
  return clone;
}

const LIVE_PREVIEW_ANNEXURE_IDS = ['annexure-f', 'annexure-j', 'annexure-k'];

function isLivePreviewAnnexureId(id) {
  return LIVE_PREVIEW_ANNEXURE_IDS.includes(id);
}

function getLivePreviewAnnexureSectionHtml(viewId) {
  if (!isLivePreviewAnnexureId(viewId)) return '';
  if (!window.pdfPreview || typeof window.pdfPreview.buildAnnexureHtmlDocument !== 'function') return '';

  const letter = viewId.replace('annexure-', '').toUpperCase();
  const renderFn = window[`renderAnnexure${letter}`];
  if (typeof renderFn === 'function') renderFn();

  const html = window.pdfPreview.buildAnnexureHtmlDocument(viewId);
  if (!html) return '';

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const sheet = doc.querySelector('.sheet') || doc.body;
  const bodyHtml = sheet ? sheet.innerHTML.trim() : '';
  if (!bodyHtml) return '';

  return `
    <div class="section-block annexure-live-preview-section" data-annexure-id="${escapeHtml(viewId)}">
      ${bodyHtml}
    </div>
  `;
}

function compileSelectedSectionsHtml(reportName, checkedIds, allActiveIds, reportId) {
  if (reportId) {
    const reports = loadLocalReports();
    const report = reports.find(r => r.id === reportId);
    restoreReportFrontMatterPdfs(report);
  }

  const district = (window.S && S.frontMatter && S.frontMatter.district) || 'Jalandhar';
  const year = (window.S && S.frontMatter && S.frontMatter.year) || '2025-26';
  const title = document.getElementById('fm-title')?.value || (S.frontMatter && S.frontMatter.title) || 'District Survey Report for Sand Mining';
  const state = document.getElementById('fm-state')?.value || (S.frontMatter && S.frontMatter.state) || 'Punjab';
  const version = document.getElementById('fm-version')?.value || (S.frontMatter && S.frontMatter.version) || 'Final Draft';
  const preparedBy = document.getElementById('fm-prepared-by')?.value || (S.frontMatter && S.frontMatter.preparedBy) || 'Sub-Divisional Committee, Jalandhar District';
  const assistedBy = document.getElementById('fm-assisted-by')?.value || (S.frontMatter && S.frontMatter.assistedBy) || 'IIT Ropar';
  const preface = document.getElementById('fm-preface')?.value || (S.frontMatter && S.frontMatter.preface) || '';
  const ack = document.getElementById('fm-acknowledgement')?.value || (S.frontMatter && S.frontMatter.acknowledgement) || '';

  // Order checked sections according to saved sectionOrder (or default if not present)
  let sectionOrder = [
    'front-matter',
    'chapters',
    'plates',
    'anx1', 'anx2', 'anx3', 'anx4', 'anx5', 'anx6', 'anx7',
    'annexure-b', 'annexure-c', 'annexure-d', 'annexure-e', 'annexure-f', 'annexure-g', 'annexure-h', 'annexure-i', 'annexure-j', 'annexure-k'
  ];

  if (reportId) {
    const reports = loadLocalReports();
    const report = reports.find(r => r.id === reportId);
    if (report && report.sectionOrder && Array.isArray(report.sectionOrder)) {
      sectionOrder = report.sectionOrder;
    }
  }

  const orderedIds = [];
  
  sectionOrder.forEach(secId => {
    if (secId === 'front-matter') {
      const fmSubsections = ['fm-cover', 'fm-toc', 'fm-pref', 'fm-ack', 'fm-cert'];
      const activeFmSubs = fmSubsections.filter(id => checkedIds.includes(id));
      if (activeFmSubs.length > 0) {
        orderedIds.push({ id: 'front-matter', subIds: activeFmSubs });
      }
    } else if (secId === 'chapters') {
      const checkedChapters = (S.chapters || []).filter(ch => checkedIds.includes(`chapter-${ch.id}`));
      if (checkedChapters.length > 0) {
        orderedIds.push({ id: 'chapters', subIds: checkedChapters.map(ch => `chapter-${ch.id}`) });
      }
    } else if (secId === 'plates') {
      const checkedPlates = (S.plates || []).filter(pl => checkedIds.includes(`plate-${pl.id}`));
      if (checkedPlates.length > 0) {
        orderedIds.push({ id: 'plates', subIds: checkedPlates.map(pl => `plate-${pl.id}`) });
      }
    
    } else {
      if (checkedIds.includes(secId)) {
        orderedIds.push({ id: secId });
      }
    }
  });

  let combinedContent = '';

  orderedIds.forEach(item => {
    let sectionHtml = '';
    
    if (item.id === 'front-matter') {
      item.subIds.forEach(subId => {
        let subHtml = '';
        if (subId === 'fm-cover') {
          const uploaded = S.uploadedPDFs && S.uploadedPDFs['cover'];
          if (uploaded && uploaded.length) {
            subHtml = `<div class="cover-page" style="page-break-after:always; text-align:center;">
              ${uploaded.map(src => `<img src="${src}" style="max-width:100%; height:auto; display:block; margin:0 auto 10px;">`).join('')}
            </div>`;
          } else {
            subHtml = `
              <div class="cover-page" style="text-align:center; padding: 60px 0; border: 3px double #17324d; margin-bottom: 40px; page-break-after:always; background: #fff; min-height: 800px; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <h3 style="font-size:14px; text-transform:uppercase; letter-spacing:2px; color:#64748b; margin-top:20px;">Government of Punjab</h3>
                  <h1 style="font-size:26px; margin: 30px 0 10px 0; color:#17324d; font-family:'Outfit', sans-serif;">${title}</h1>
                  <h2 style="font-size:18px; color:#475569; margin: 0 0 40px 0;">District: ${district} | State: ${state}</h2>
                </div>
                <div style="margin: 40px 0; font-size:14px; color:#475569;">
                  <p><strong>Year:</strong> ${year}</p>
                  <p><strong>Version:</strong> ${version}</p>
                  <p><strong>Prepared in compliance with EMGSM 2020 Guidelines</strong></p>
                </div>
                <div style="margin-bottom:20px; font-size:13px; line-height:1.6; text-align:left; background:#f8fafc; padding:20px; border-radius:8px; border:1px solid #e2e8f0; max-width: 480px; margin-left: auto; margin-right: auto;">
                  <p style="margin:0 0 4px 0;"><strong>Prepared By:</strong> ${preparedBy}</p>
                  <p style="margin:0;"><strong>Assisted By:</strong> ${assistedBy}</p>
                </div>
              </div>
            `;
          }
        } 
        else if (subId === 'fm-pref') {
          const uploaded = S.uploadedPDFs && S.uploadedPDFs['pref'];
          if (uploaded && uploaded.length) {
            subHtml = `<div style="page-break-after:always;">
              <h2 class="section-title">Preface</h2>
              ${uploaded.map(src => `<img src="${src}" style="max-width:100%; height:auto; display:block; margin:0 auto 10px;">`).join('')}
            </div>`;
          } else {
            subHtml = `
              <div style="margin-bottom: 40px; page-break-after:always;">
                <h2 class="section-title">Preface</h2>
                <p style="font-size:13.5px; line-height:1.7; white-space:pre-wrap; color:#334155;">${preface || 'No preface text available.'}</p>
              </div>
            `;
          }
        } 
        else if (subId === 'fm-ack') {
          const uploaded = S.uploadedPDFs && S.uploadedPDFs['ack'];
          if (uploaded && uploaded.length) {
            subHtml = `<div style="page-break-after:always;">
              <h2 class="section-title">Acknowledgement</h2>
              ${uploaded.map(src => `<img src="${src}" style="max-width:100%; height:auto; display:block; margin:0 auto 10px;">`).join('')}
            </div>`;
          } else {
            subHtml = `
              <div style="margin-bottom: 40px; page-break-after:always;">
                <h2 class="section-title">Acknowledgement</h2>
                <p style="font-size:13.5px; line-height:1.7; white-space:pre-wrap; color:#334155;">${ack || 'No acknowledgement text available.'}</p>
              </div>
            `;
          }
        } 
        else if (subId === 'fm-cert') {
          const uploaded = S.uploadedPDFs && S.uploadedPDFs['cert'];
          if (uploaded && uploaded.length) {
            subHtml = `<div style="page-break-after:always;">
              <h2 class="section-title">Certificate of Compliance</h2>
              ${uploaded.map(src => `<img src="${src}" style="max-width:100%; height:auto; display:block; margin:0 auto 10px;">`).join('')}
            </div>`;
          } else {
            subHtml = `
              <div style="margin-bottom: 40px; page-break-after:always;">
                <h2 class="section-title">Certificate of Compliance</h2>
                <div style="border: 2px solid #17324d; padding: 30px; border-radius: 8px; background: #fafafa; margin-top: 20px;">
                  <h3 style="text-align: center; margin-top: 0; text-transform: uppercase; color: #17324d;">Certificate</h3>
                  <p style="font-size: 14px; line-height: 1.8; color: #334155; margin-bottom: 30px;">
                    This is to certify that the District Survey Report for Sand Mining for <strong>District ${district}</strong>, State of <strong>${state}</strong> for the year <strong>${year}</strong> has been compiled in strict accordance with the Sustainable Sand Mining Management Guidelines 2016 and the Enforcement & Monitoring Guidelines for Sand Mining (EMGSM) 2020.
                  </p>
                  <p style="font-size: 14px; line-height: 1.8; color: #334155; margin-bottom: 40px;">
                    All geomorphological assessments, mineral reserve calculations, replenishment studies, and environmental safeguards have been verified by the Sub-Divisional Committee.
                  </p>
                  <div style="display: flex; justify-content: space-between; margin-top: 60px; font-size: 13px;">
                    <div>
                      <p style="margin: 0; font-weight: bold;">Sub-Divisional Magistrate</p>
                      <p style="margin: 0; color: #64748b;">Committee Chairman</p>
                    </div>
                    <div style="text-align: right;">
                      <p style="margin: 0; font-weight: bold;">Mining Officer</p>
                      <p style="margin: 0; color: #64748b;">Committee Member Secretary</p>
                    </div>
                  </div>
                </div>
              </div>
            `;
          }
        } 
        else if (subId === 'fm-toc') {
          const uploaded = S.uploadedPDFs && S.uploadedPDFs['toc'];
          if (uploaded && uploaded.length) {
            subHtml = `<div style="page-break-after:always;">
              <h2 class="section-title">Table of Contents</h2>
              ${uploaded.map(src => `<img src="${src}" style="max-width:100%; height:auto; display:block; margin:0 auto 10px;">`).join('')}
            </div>`;
          }
        } 
        else if (subId === 'fm-lot') {
          subHtml = `
            <div style="margin-bottom: 40px; page-break-after:always;">
              <h2 class="section-title">List of Tables</h2>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 20px;">
                <thead>
                  <tr style="border-bottom: 2px solid #17324d; background: #f8fafc;">
                    <th style="padding: 10px; text-align: left;">Table No.</th>
                    <th style="padding: 10px; text-align: left;">Table Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px;">Table 1.1</td><td style="padding: 8px 10px;">Temperature, Humidity & Climate Trends</td></tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px;">Table 2.1</td><td style="padding: 8px 10px;">Geological Succession of Jalandhar District</td></tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px;">Table 3.1</td><td style="padding: 8px 10px;">Active Mining Leases & Production Capacity</td></tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px;">Table 4.1</td><td style="padding: 8px 10px;">Cross Section Elevation & Distance Readings</td></tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px;">Table 5.1</td><td style="padding: 8px 10px;">Replenishment Assessment Data & Safe Yield</td></tr>
                </tbody>
              </table>
            </div>
          `;
        } 
        else if (subId === 'fm-lof') {
          subHtml = `
            <div style="margin-bottom: 40px; page-break-after:always;">
              <h2 class="section-title">List of Figures</h2>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 20px;">
                <thead>
                  <tr style="border-bottom: 2px solid #17324d; background: #f8fafc;">
                    <th style="padding: 10px; text-align: left;">Figure No.</th>
                    <th style="padding: 10px; text-align: left;">Figure/Map Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px;">Figure 1.1</td><td style="padding: 8px 10px;">Location Map of District ${district}</td></tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px;">Figure 2.1</td><td style="padding: 8px 10px;">Drainage & River System Map</td></tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px;">Figure 3.1</td><td style="padding: 8px 10px;">Geological and Soil Classification Map</td></tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px;">Figure 4.1</td><td style="padding: 8px 10px;">DGPS Survey & Cluster Boundary Map</td></tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px;">Figure 5.1</td><td style="padding: 8px 10px;">Cross-Section Elevation Graphs (Pre & Post-Monsoon)</td></tr>
                </tbody>
              </table>
            </div>
          `;
        } 
        else if (subId === 'fm-abbr') {
          subHtml = `
            <div style="margin-bottom: 40px; page-break-after:always;">
              <h2 class="section-title">Abbreviations</h2>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 20px;">
                <thead>
                  <tr style="border-bottom: 2px solid #17324d; background: #f8fafc;">
                    <th style="padding: 10px; text-align: left; width: 25%;">Abbreviation</th>
                    <th style="padding: 10px; text-align: left;">Full Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px; font-weight:bold;">DSR</td><td style="padding: 8px 10px;">District Survey Report</td></tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px; font-weight:bold;">EMGSM</td><td style="padding: 8px 10px;">Enforcement and Monitoring Guidelines for Sand Mining</td></tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px; font-weight:bold;">CORS</td><td style="padding: 8px 10px;">Continuously Operating Reference Stations</td></tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px; font-weight:bold;">DGPS</td><td style="padding: 8px 10px;">Differential Global Positioning System</td></tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px; font-weight:bold;">MoEFCC</td><td style="padding: 8px 10px;">Ministry of Environment, Forest and Climate Change</td></tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 10px; font-weight:bold;">SEIAA</td><td style="padding: 8px 10px;">State Level Environment Impact Assessment Authority</td></tr>
                </tbody>
              </table>
            </div>
          `;
        }
        
        if (subHtml && subHtml.trim()) {
          combinedContent += `<div class="section-block">${subHtml}</div>`;
        }
      });
    }
    else if (item.id === 'chapters') {
      const activeChapters = (S.chapters || []).filter(ch => item.subIds.includes(`chapter-${ch.id}`));
      activeChapters.forEach((ch, idx) => {
        const chapterNo = S.chapters.indexOf(ch) + 1;
        const uploaded = S.chapterPDFs && S.chapterPDFs[ch.id];
        let chContentHtml = '';
        if (uploaded && uploaded.length) {
          chContentHtml = `
            <div style="display:flex; flex-direction:column; gap:10px; margin-top:12px;">
              ${uploaded.map(src => `<img src="${src}" style="max-width:100%; height:auto; border:1px solid #cbd5e1; border-radius:4px; display:block; margin:0 auto;">`).join('')}
            </div>
          `;
        }
        
        sectionHtml += `
          <div class="section-block">
            <h2 class="section-title">Chapter ${chapterNo}: ${ch.name}</h2>
            <p style="font-size:13.5px; line-height:1.6; color:#334155; white-space:pre-wrap; margin-bottom:12px;">${ch.summary || ''}</p>
            ${chContentHtml}
          </div>
        `;
      });
      combinedContent += sectionHtml;
    }
    else if (item.id === 'plates') {
      const activePlates = (S.plates || []).filter(pl => item.subIds.includes(`plate-${pl.id}`));
      activePlates.forEach((pl, idx) => {
        const plateIndex = S.plates.indexOf(pl) + 1;
        const uploaded = pl.pages;
        let plateContentHtml = '';
        if (uploaded && uploaded.length) {
          plateContentHtml = `
            <div style="display:flex; flex-direction:column; gap:10px; margin-top:12px;">
              ${uploaded.map(src => `<img src="${src}" style="max-width:100%; height:auto; border:1px solid #cbd5e1; border-radius:4px; display:block; margin:0 auto;">`).join('')}
            </div>
          `;
        }
        
        sectionHtml += `
          <div class="section-block">
            <h2 class="section-title">Plate P${plateIndex}: ${pl.name}</h2>
            <p style="font-size:13.5px; line-height:1.6; color:#334155; white-space:pre-wrap; margin-bottom:12px;">${pl.summary || ''}</p>
            ${plateContentHtml}
          </div>
        `;
      });
      combinedContent += sectionHtml;
    }
    else if (item.id.startsWith('custom-pdf-')) {
      const reports = loadLocalReports();
      const report = reports.find(r => r.id === reportId);
      const customSec = report && report.customSections && report.customSections.find(cs => cs.id === item.id);
      const titleText = customSec ? customSec.name : 'Custom PDF Section';
      
      const pages = S.uploadedPDFs && S.uploadedPDFs[item.id];
      let pagesHtml = '';
      if (pages && pages.length > 0) {
        pagesHtml = pages.map(src => `<img src="${src}" style="max-width:100%; height:auto; border:1px solid #cbd5e1; border-radius:4px; display:block; margin:0 auto 10px;">`).join('');
      } else {
        pagesHtml = `<p class="empty" style="color:#64748b; font-style:italic;">No PDF document uploaded for this section yet.</p>`;
      }
      
      sectionHtml = `
        <div class="section-block" data-custom-section-id="${item.id}">
          <h2 class="section-title">${escapeHtml(titleText)}</h2>
          ${pagesHtml}
        </div>
      `;
      combinedContent += sectionHtml;
    }
    else {
      if (isLivePreviewAnnexureId(item.id)) {
        const livePreviewHtml = getLivePreviewAnnexureSectionHtml(item.id);
        if (livePreviewHtml) {
          combinedContent += livePreviewHtml;
          return;
        }
      }

      const source = document.getElementById(`view-${item.id}`);
      if (source) {
        const cleanedClone = cloneSourceWithValues(source);
        const clone = window.pdfPreview.cleanupAnnexurePreviewClone(cleanedClone, item.id);
        
        let attachmentHtml = '';
        if (typeof renderAnnexureAttachmentPreview === 'function') {
          attachmentHtml = renderAnnexureAttachmentPreview(item.id);
        }
        
        const infoEl = clone.querySelector(`#${item.id}-attachment-info`);
        if (infoEl) {
          infoEl.innerHTML = attachmentHtml || '';
        }
        
        clone.querySelectorAll('.upload-zone, button, input[type="file"], select, label:has(input[type="file"]), .modal').forEach(el => el.remove());
        
        let bodyHtml = clone.innerHTML.trim() || '<p class="empty">No annexure data entered yet.</p>';
        if (attachmentHtml && (!infoEl || !bodyHtml.includes(attachmentHtml))) {
          bodyHtml += attachmentHtml;
        }
        
        const title = getReplenishmentSectionTitle(item.id);
        
        sectionHtml = `
          <div class="section-block">
            <h2 class="section-title">${title}</h2>
            ${bodyHtml}
          </div>
        `;
      } else {
        sectionHtml = `
          <div class="section-block">
            <h2 class="section-title">${item.id.toUpperCase()}</h2>
            <p class="empty">Section view element not found. Please load the section page in the portal once to initialize it.</p>
          </div>
        `;
      }
      combinedContent += sectionHtml;
    }
  });

  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          *{box-sizing:border-box}
          body{margin:0;background:#ffffff;color:#111827;font-family:Arial,Helvetica,sans-serif;padding:30px;}
          .sheet{width:100%;margin:0 auto;}
          .doc-head{border-bottom:2px solid #17324d;padding-bottom:14px;margin-bottom:25px;text-align:center;}
          .doc-head h1{margin:0 0 8px;color:#17324d;font-size:22px;line-height:1.2;}
          .doc-head p{margin:0;color:#526172;font-size:12px;}
          h1,h2,h3,h4{color:#17324d;line-height:1.25;}
          h1{font-size:24px;margin:0 0 14px;} 
          h2{font-size:18px;margin:20px 0 10px;} 
          h3{font-size:15px;margin:16px 0 8px;}
          p,.muted,label{color:#526172;font-size:13px;line-height:1.55;}
          .section-block {
            margin-bottom: 40px;
            page-break-after: always;
          }
          .section-block:last-child {
            page-break-after: avoid;
          }
          .section-title {
            color: #17324d;
            border-bottom: 2px solid #17324d;
            padding-bottom: 8px;
            margin-bottom: 20px;
            font-size: 18px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          table{width:100%;border-collapse:collapse;margin:10px 0 18px;font-size:11px;table-layout:auto;}
          th,td{border:1px solid #111827;padding:6px 7px;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;}
          th{background:#f3f4f6;font-weight:700;text-align:left;}
          .field-value{display:inline-block;min-width:80px;padding:4px 6px;border-bottom:1px solid #cbd5e1;color:#111827;}
          .editable-title{font-weight:600;}
          .empty{padding:24px;border:1px dashed #cbd5e1;border-radius:8px;text-align:center;}
          img{max-width:100%;height:auto;display:block;margin:0 auto 10px;}
          .annexure-uploaded-pages-simple { display: flex; flex-direction: column; gap: 20px; margin-top: 20px; }
          .annexure-uploaded-pages-simple img { max-width: 100%; height: auto; display: block; margin: 0 auto; }
          .annexure-live-preview-section .doc-head {
            border-bottom: 2px solid #17324d;
            padding-bottom: 14px;
            margin-bottom: 20px;
            text-align: center;
          }
          .annexure-live-preview-section .doc-head h1 {
            margin: 0 0 8px;
            color: #17324d;
            font-size: 24px;
            line-height: 1.2;
          }
          .annexure-live-preview-section .doc-head p {
            margin: 0;
            color: #526172;
            font-size: 13px;
          }
          .annexure-live-preview-section .card,
          .annexure-live-preview-section .card-bd,
          .annexure-live-preview-section .annexure-line-main {
            border: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 0 18px !important;
          }
          .annexure-live-preview-section .g2,
          .annexure-live-preview-section .grid,
          .annexure-live-preview-section .annexure-line-layout {
            display: block !important;
          }
          
          /* Flatten form elements for flat text printing */
          input, textarea, select {
            border: none !important;
            background: transparent !important;
            color: #111827 !important;
            padding: 0 !important;
            width: 100% !important;
            resize: none !important;
            font-size: inherit !important;
            font-family: inherit !important;
            box-shadow: none !important;
            outline: none !important;
          }
          
          /* Hide non-printable widgets */
          .btn, button, .upload-zone, .card-hd, .modal, .file-item, .alert-box, .hint, .sb-ico, [style*="display:none"], [style*="display: none"] {
            display: none !important;
          }
        </style>
      </head>
      <body>
        <main class="sheet">
          <header class="doc-head">
            <h1>${escapeHtml(reportName)}</h1>
            <p>Replenishment Studies Compiled Report - District Survey Report - ${escapeHtml(district)} | ${escapeHtml(year)}</p>
          </header>
          ${combinedContent}
        </main>
      </body>
    </html>`;
}

async function downloadCustomReportPDF(reportName, reportId, triggerButton = null) {
  const reports = loadLocalReports();
  const report = reports.find(r => r.id === reportId);
  if (reportId) {
    await saveReportSelection(reportId);
  }
  const currentCheckedIds = getCurrentSelectedReportSectionIds();
  const checkedIds = currentCheckedIds.length ? currentCheckedIds : (report ? (report.sections || []) : []);
  
  if (checkedIds.length === 0) {
    checkedIds.push(...currentCheckedIds);
  }
  
  await generateReplenishmentPDF(reportName, checkedIds, reportId, { triggerButton });
}

function showPdfProgressToast(message) {
  let loader = document.getElementById('pdf-loader-overlay');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'pdf-loader-overlay';
    loader.style.position = 'fixed';
    loader.style.left = '0';
    loader.style.top = '0';
    loader.style.width = '100%';
    loader.style.height = '100%';
    loader.style.backgroundColor = 'rgba(15, 23, 42, 0.75)';
    loader.style.backdropFilter = 'blur(5px)';
    loader.style.zIndex = '999999';
    loader.style.display = 'flex';
    loader.style.flexDirection = 'column';
    loader.style.justifyContent = 'center';
    loader.style.alignItems = 'center';
    loader.style.color = '#ffffff';
    loader.style.fontFamily = 'system-ui, sans-serif';
    
    loader.innerHTML = `
      <div style="background: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15); text-align: center; color: #1e293b; max-width: 320px; width: 90%;">
        <div style="border: 4px solid #f1f5f9; border-top: 4px solid #f59e0b; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 15px auto;"></div>
        <div id="pdf-loader-status" style="font-weight: 700; font-size: 15px; margin-bottom: 5px; color: #1e293b;">Compiling Report</div>
        <div id="pdf-loader-sub" style="font-size: 12px; color: #64748b;">Please wait while we assemble your document...</div>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    document.body.appendChild(loader);
  }
  
  const statusEl = loader.querySelector('#pdf-loader-status');
  if (statusEl) statusEl.textContent = message;
}

function hidePdfProgressToast() {
  const loader = document.getElementById('pdf-loader-overlay');
  if (loader) {
    loader.remove();
  }
}

function getReplenishmentPdfAnnexureId(reportId) {
  const compactId = String(reportId || '').replace(/[^a-zA-Z0-9_-]/g, '');
  return `repl-${compactId.slice(-26)}`;
}

function getSafeReplenishmentPdfFileName(reportName) {
  const projectName = (S.activeProject && (S.activeProject.projectName || S.activeProject.title)) || 'Project';
  const projectBase = String(projectName)
    .replace(/[^\w\s.-]/g, '')
    .trim()
    .replace(/\s+/g, '_') || 'Project';
  const reportBase = String(reportName || 'Replenishment_Report')
    .replace(/[^\w\s.-]/g, '')
    .trim()
    .replace(/\s+/g, '_') || 'Replenishment_Report';
  const suffix = /_?Replenishment_?Report$/i.test(reportBase) ? '' : '_Replenishment_Report';
  return `${projectBase}_${reportBase}${suffix}.pdf`;
}

function getReplenishmentUploadCount(report) {
  const uploads = report && report.replenishmentUploads ? report.replenishmentUploads : {};
  return Object.values(uploads).reduce((count, files) => count + (Array.isArray(files) ? files.length : 0), 0);
}

function getReplenishmentReportSignature(report, checkedIds) {
  const signaturePayload = {
    projectId: S.activeProject?.id || '',
    projectUpdatedAt: S.activeProject?.updatedAt || S.activeProject?.updated || '',
    reportId: report?.id || '',
    reportName: report?.name || '',
    sections: checkedIds || report?.sections || [],
    sectionOrder: report?.sectionOrder || [],
    finalDsrSource: report?.finalDsrSource || null,
    inheritanceScan: report?.inheritanceScan || null,
    uploads: report?.replenishmentUploads || {},
    manualEntries: report?.manualEntries || {},
    frontMatterPdfs: report?.frontMatterPdfs || {},
    customPdfs: report?.customPdfs || {},
    customSections: report?.customSections || []
  };
  try {
    return JSON.stringify(signaturePayload);
  } catch (_) {
    return `${Date.now()}`;
  }
}

function validateReplenishmentReportForPdf(report, checkedIds) {
  const errors = [];
  if (!S.activeProject || !S.activeProject.id) {
    errors.push('Select an active project before generating the replenishment report.');
  }
  if (!report || !report.id) {
    errors.push('Open or select a saved replenishment report first.');
  }
  if (!checkedIds || !checkedIds.length) {
    errors.push('Select at least one report section before downloading the PDF.');
  }

  const sectionSet = new Set(checkedIds || []);
  REPLENISHMENT_REPORT_ACCORDION_SECTIONS.forEach(section => {
    if (!section.requirementId || !sectionSet.has(section.id)) return;
    const stats = getReplenishmentSectionStats(report, section);
    if (stats.total > 0 && stats.completed === 0) {
      errors.push(`${section.title}: add inherited data, edited content, or at least one valid upload.`);
    }
  });

  const uploads = report?.replenishmentUploads || {};
  Object.entries(uploads).forEach(([key, files]) => {
    if (!Array.isArray(files)) return;
    files.forEach((file, index) => {
      if (!file || (!file.url && !file.downloadUrl)) {
        errors.push(`Uploaded file reference is broken in ${key} (${index + 1}).`);
      }
    });
  });

  return errors;
}

function setReplenishmentDownloadBusy(reportId, busy, triggerButton) {
  const buttons = Array.from(document.querySelectorAll(`.repl-download-pdf-btn[data-report-id="${reportId}"]`));
  if (triggerButton && !buttons.includes(triggerButton)) buttons.push(triggerButton);
  buttons.forEach(btn => {
    if (!btn) return;
    if (busy) {
      btn.dataset.originalText = btn.dataset.originalText || btn.textContent || 'Download PDF';
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      btn.textContent = 'Generating PDF...';
    } else {
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      btn.textContent = btn.dataset.originalText || 'Download PDF';
    }
  });
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
    reader.onerror = () => reject(reader.error || new Error('Could not read generated PDF'));
    reader.readAsDataURL(blob);
  });
}

async function uploadReplenishmentPdfToStorage(report, blob, filename, signature) {
  const base64 = await blobToBase64(blob);
  const annexureId = getReplenishmentPdfAnnexureId(report.id);
  await apiFetch('/upload-pdf', {
    method: 'POST',
    body: JSON.stringify({
      projectId: report.projectId || (S.activeProject ? S.activeProject.id : null),
      annexureId,
      fileName: filename,
      pdf: base64
    })
  });

  const previousMeta = report.generatedPdf || {};
  const now = new Date().toISOString();
  report.generatedPdf = {
    annexureId,
    fileName: filename,
    generatedAt: now,
    generatedBy: (S.user && (S.user.fullName || S.user.username || S.user.email)) || localStorage.getItem('dsr_user') || 'Current User',
    version: Number(previousMeta.version || 0) + 1,
    sizeBytes: blob.size,
    downloadCount: Number(previousMeta.downloadCount || 0),
    lastDownloadDate: previousMeta.lastDownloadDate || null,
    signature,
    uploadCount: getReplenishmentUploadCount(report)
  };
  upsertLocalReport(report);
  await saveReportToServer(report);
  return report.generatedPdf;
}

async function refreshReplenishmentInheritanceFromSource(report) {
  const sourceId = report && report.finalDsrSource && report.finalDsrSource.id;
  if (!sourceId) return report;
  try {
    const sourceProject = await apiFetch(`/projects/${sourceId}`);
    report.finalDsrSource = {
      id: sourceProject.id,
      title: sourceProject.title || sourceProject.projectName || 'Final DSR',
      district: sourceProject.district || '',
      year: sourceProject.year || '',
      status: sourceProject.status || ''
    };
    report.inheritanceScan = scanFinalDsrForReplenishment(sourceProject);
  } catch (err) {
    console.warn('Could not refresh inherited Final DSR data before PDF generation:', err);
  }
  return report;
}

async function generateReplenishmentPdfBlob(reportName, checkedIds, reportId, reportObj = null) {
  const report = reportObj || (reportId ? loadLocalReports().find(r => r.id === reportId) : null);
  if (report) restoreReportFrontMatterPdfs(report);

  const allActiveIds = [...(checkedIds || [])];
  if (allActiveIds.some(id => String(id).startsWith('fm-')) && !allActiveIds.includes('front-matter')) {
    allActiveIds.push('front-matter');
  }
  if (allActiveIds.some(id => String(id).startsWith('chapter-')) && !allActiveIds.includes('chapters')) {
    allActiveIds.push('chapters');
  }
  if (allActiveIds.some(id => String(id).startsWith('plate-')) && !allActiveIds.includes('plates')) {
    allActiveIds.push('plates');
  }

  if (!checkedIds || !checkedIds.length) return null;
  if (typeof ensurePortalVendors === 'function') {
    await ensurePortalVendors(['html2pdf']);
  }
  if (typeof html2pdf === 'undefined') {
    throw new Error('PDF export tools are still loading. Please try again.');
  }

  const html = compileSelectedSectionsHtml(reportName, checkedIds, allActiveIds, reportId);
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '0';
  iframe.style.width = '1040px';
  iframe.style.height = '1400px';
  iframe.style.border = '0';
  iframe.style.pointerEvents = 'none';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  try {
    iframe.srcdoc = html;
    await new Promise(resolve => {
      iframe.onload = () => resolve();
      setTimeout(resolve, 350);
    });
    const body = iframe.contentDocument && iframe.contentDocument.body;
    const target = body && (body.querySelector('.sheet') || body);
    if (!target) throw new Error('Could not assemble Replenishment Report content for PDF generation.');
    iframe.style.height = `${Math.max(1400, body.scrollHeight + 120)}px`;

    return await html2pdf()
      .set({
        margin: 0,
        filename: getSafeReplenishmentPdfFileName(reportName),
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, windowWidth: target.scrollWidth || 1040 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', 'h4'] }
      })
      .from(target)
      .toPdf()
      .get('pdf')
      .then(pdf => pdf.output('blob'));
  } finally {
    iframe.remove();
  }
}

async function downloadStoredReplenishmentPdf(report, metadata) {
  const response = await fetch(`/api/download-pdf?projectId=${encodeURIComponent(S.activeProject.id)}&annexureId=${encodeURIComponent(metadata.annexureId)}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('dsr_token') || ''}` }
  });
  if (!response.ok) throw new Error(await response.text());
  const blob = await response.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = metadata.fileName || getSafeReplenishmentPdfFileName(report.name);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2500);

  report.generatedPdf = {
    ...metadata,
    downloadCount: Number(metadata.downloadCount || 0) + 1,
    lastDownloadDate: new Date().toISOString()
  };
  upsertLocalReport(report);
  await saveReportToServer(report);
}

async function generateReplenishmentPDF(reportName, checkedIds, reportId, options = {}) {
  if (!checkedIds || checkedIds.length === 0) {
    toast("No sections selected to download.", "error");
    return;
  }

  let report = null;
  if (reportId) {
    const fresh = await apiFetch(`/replenishment/${reportId}`);
    report = upsertLocalReport(normalizeBackendReport(fresh));
  }
  if (!report) {
    const reports = loadLocalReports();
    report = reports.find(r => r.id === reportId);
  }
  if (!report) {
    toast('Open or select a saved replenishment report first.', 'error');
    return;
  }

  reportName = report.name || reportName;
  report.sections = checkedIds;
  await refreshReplenishmentInheritanceFromSource(report);
  await saveReportToServer(report);

  const validationErrors = validateReplenishmentReportForPdf(report, checkedIds);
  if (validationErrors.length) {
    toast(`Cannot generate PDF: ${validationErrors[0]}`, 'error');
    showCustomConfirmModal({
      title: 'Replenishment report needs attention',
      message: validationErrors.slice(0, 5).join('\n'),
      confirmText: 'OK',
      tone: 'warning'
    });
    return;
  }

  const signature = getReplenishmentReportSignature(report, checkedIds);

  setReplenishmentDownloadBusy(reportId, true, options.triggerButton);
  showPdfProgressToast('Generating PDF...');
  
  try {
    const blob = await generateReplenishmentPdfBlob(reportName, checkedIds, reportId, report);
    if (!blob) throw new Error('PDF generation failed.');
    showPdfProgressToast('Saving generated PDF to project...');
    const metadata = await uploadReplenishmentPdfToStorage(report, blob, getSafeReplenishmentPdfFileName(reportName), signature);
    toast('PDF Generated Successfully', 'success');

    showPdfProgressToast('Starting PDF download...');
    await downloadStoredReplenishmentPdf(report, metadata);
    toast('Replenishment Report PDF downloaded successfully!', 'success');
  } catch (err) {
    console.error('Download PDF error:', err);
    toast(err.message || 'PDF generation failed. Please try again.', 'error');
  } finally {
    hidePdfProgressToast();
    setReplenishmentDownloadBusy(reportId, false, options.triggerButton);
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showCustomConfirmModal({
  title = "Are you sure?",
  message = "",
  confirmText = "OK",
  cancelText = "Cancel",
  tone = "warning",
  onConfirm = null
} = {}) {
  const existing = document.getElementById('custom-confirm-modal-overlay');
  if (existing) existing.remove();

  const palette = tone === "danger"
    ? {
        accent: "#dc2626",
        accentDark: "#b91c1c",
        accentSoft: "#fee2e2",
        accentText: "#991b1b",
        ring: "rgba(220, 38, 38, 0.18)",
        icon: "!"
      }
    : {
        accent: "#b7791f",
        accentDark: "#92400e",
        accentSoft: "#fef3c7",
        accentText: "#92400e",
        ring: "rgba(183, 121, 31, 0.18)",
        icon: "?"
      };

  const overlay = document.createElement('div');
  overlay.id = 'custom-confirm-modal-overlay';
  overlay.style.position = 'fixed';
  overlay.style.left = '0';
  overlay.style.top = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(15, 23, 42, 0.40)';
  overlay.style.backdropFilter = 'blur(5px)';
  overlay.style.zIndex = '1000000';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'flex-start';
  overlay.style.padding = 'clamp(130px, 18vh, 220px) 18px 32px';
  overlay.style.boxSizing = 'border-box';

  overlay.innerHTML = `
    <div role="dialog" aria-modal="true" aria-labelledby="custom-confirm-title" aria-describedby="custom-confirm-message" style="background: #ffffff; color: #0f172a; width: min(440px, 100%); border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 24px 70px rgba(15, 23, 42, 0.24); overflow: hidden; animation: confirmModalIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);">
      <div style="display: flex; gap: 14px; padding: 22px 22px 18px 22px;">
        <div aria-hidden="true" style="width: 40px; height: 40px; flex: 0 0 40px; border-radius: 999px; background: ${palette.accentSoft}; color: ${palette.accentText}; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 19px; box-shadow: 0 0 0 6px ${palette.ring};">${palette.icon}</div>
        <div style="min-width: 0;">
          <h3 id="custom-confirm-title" style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; margin: 0 0 7px 0; color: #0f172a; font-size: 18px; line-height: 1.25; font-weight: 800; letter-spacing: 0;">${escapeHtml(title)}</h3>
          <p id="custom-confirm-message" style="margin: 0; color: #475569; font-size: 14px; line-height: 1.55;">${escapeHtml(message)}</p>
        </div>
      </div>
      <div style="display: flex; justify-content: flex-end; gap: 10px; padding: 14px 22px 20px 22px; background: #f8fafc; border-top: 1px solid #eef2f7;">
        <button type="button" id="custom-confirm-cancel" style="min-width: 92px; padding: 10px 16px; border-radius: 10px; border: 1px solid #cbd5e1; background: #ffffff; color: #334155; font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);">${escapeHtml(cancelText)}</button>
        <button type="button" id="custom-confirm-ok" style="min-width: 108px; padding: 10px 17px; border-radius: 10px; border: 1px solid ${palette.accentDark}; background: ${palette.accent}; color: #ffffff; font-size: 14px; font-weight: 800; cursor: pointer; box-shadow: 0 10px 22px ${palette.ring};">${escapeHtml(confirmText)}</button>
      </div>
    </div>
    <style>
      @keyframes confirmModalIn {
        from { transform: translateY(-14px) scale(0.98); opacity: 0; }
        to { transform: translateY(0) scale(1); opacity: 1; }
      }
    </style>
  `;

  const close = () => {
    document.removeEventListener('keydown', handleKeyDown);
    overlay.remove();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') close();
  };

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close();
  });

  const cancelBtn = overlay.querySelector('#custom-confirm-cancel');
  const okBtn = overlay.querySelector('#custom-confirm-ok');

  if (cancelBtn) cancelBtn.addEventListener('click', close);
  if (okBtn) {
    okBtn.addEventListener('click', () => {
      close();
      if (typeof onConfirm === 'function') onConfirm();
    });
  }

  document.body.appendChild(overlay);
  document.addEventListener('keydown', handleKeyDown);
  if (cancelBtn) cancelBtn.focus();
}

function showCustomPromptModal(title, defaultValue, onConfirm, buttonText = "Confirm") {
  const existing = document.getElementById('custom-prompt-modal-overlay');
  if (existing) existing.remove();
  
  const overlay = document.createElement('div');
  overlay.id = 'custom-prompt-modal-overlay';
  overlay.style.position = 'fixed';
  overlay.style.left = '0';
  overlay.style.top = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(15, 23, 42, 0.45)';
  overlay.style.backdropFilter = 'blur(4px)';
  overlay.style.zIndex = '999999';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center'; // Vertically centered
  overlay.style.paddingBottom = '100px'; // Shunted up slightly for visual balance (upside)
  
  overlay.innerHTML = `
    <div style="background: #ffffff; padding: 24px; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); text-align: left; color: #1e293b; max-width: 420px; width: 90%; animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1); border: 1px solid #e2e8f0;">
      <h3 style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; font-weight: 700; font-size: 16px; margin: 0 0 8px 0; color: #0f172a;">${title}</h3>
      <input type="text" id="custom-prompt-input" value="${defaultValue.replace(/"/g, '&quot;')}" style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; margin-bottom: 16px; outline: none; transition: border-color 0.2s; color: #0f172a; background: #fff;" />
      <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <button id="custom-prompt-cancel" style="padding: 8px 16px; font-size: 13px; cursor: pointer; border-radius: 8px; border: 1px solid #cbd5e1; background: #fff; color: #475569; font-weight:600;">Cancel</button>
        <button id="custom-prompt-confirm" style="padding: 8px 16px; font-size: 13px; cursor: pointer; border-radius: 8px; border: none; background: #8c4f00; color: #fff; font-weight:600;">${buttonText}</button>
      </div>
    </div>
    <style>
      @keyframes slideUp {
        from { transform: translateY(40px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    </style>
  `;
  
  document.body.appendChild(overlay);
  
  const input = overlay.querySelector('#custom-prompt-input');
  if (input) {
    input.focus();
    input.select();
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = input.value.trim();
        if (val) {
          overlay.remove();
          onConfirm(val);
        }
      } else if (e.key === 'Escape') {
        overlay.remove();
      }
    });
    
    input.addEventListener('focus', () => {
      input.style.borderColor = '#8c4f00';
    });
    input.addEventListener('blur', () => {
      input.style.borderColor = '#cbd5e1';
    });
  }
  
  const cancelBtn = overlay.querySelector('#custom-prompt-cancel');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      overlay.remove();
    });
  }
  
  const confirmBtn = overlay.querySelector('#custom-prompt-confirm');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      const val = input.value.trim();
      if (val) {
        overlay.remove();
        onConfirm(val);
      }
    });
  }
}

window.showCustomConfirmModal = showCustomConfirmModal;
window.showCustomPromptModal = showCustomPromptModal;

})();
