(function() {
// Replenishment Study Module
// Handles the UI, compilation, and PDF generation for Replenishment reports.

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
      <div style="max-width:980px;margin:32px auto;padding:0 20px;">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:18px;">
          <button type="button" onclick="window.showView && window.showView('projects')" style="text-align:left;border:1px solid #dbe4ee;border-radius:14px;background:#fff;padding:24px;cursor:pointer;box-shadow:0 4px 14px rgba(15,23,42,.06);">
            <div style="font-size:12px;font-weight:800;color:#f59e0b;text-transform:uppercase;letter-spacing:.08em;">Step 1</div>
            <h2 style="margin:8px 0;color:#17324d;font-size:19px;">Select a DSR Project</h2>
            <p style="color:#64748b;margin:0;line-height:1.5;">Your previously filled Replenishment Report is stored under its project. Select that project to load its upload cards.</p>
          </button>
          <div style="border:1px solid #dbe4ee;border-radius:14px;background:#fff;padding:24px;box-shadow:0 4px 14px rgba(15,23,42,.06);">
            <div style="font-size:12px;font-weight:800;color:#16a34a;text-transform:uppercase;letter-spacing:.08em;">Step 2</div>
            <h2 style="margin:8px 0;color:#17324d;font-size:19px;">Upload Cards & Preview</h2>
            <p style="color:#64748b;margin:0;line-height:1.5;">Once selected, the report's existing Imported, Uploaded and Pending cards open here with the right-side preview.</p>
          </div>
        </div>
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
  
  const reports = await refreshLocalReportsFromServer();

  // Existing work should open straight into the upload-card workspace rather
  // than leaving the user at an intermediate, apparently empty choice screen.
  if (reports.length) {
    window.activeReport = reports[0];
    renderCustomReportGenerator(editorContainer, reports[0]);
    return;
  }

  window.showReplenishmentOptions(editorContainer);
}

// Navigation invokes this directly after the Replenishment view is made visible.
// Keeping the renderer on window avoids an empty workspace if another module owns showView.
window.initReplenishmentView = initReplenishmentView;

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

// A Final DSR supplies stable district context, but never replaces current
// survey-period evidence required for a replenishment study.
const REPLENISHMENT_DSR_COPY_MATRIX = [
  { target: 'Cover page - district, mineral and report identity', source: 'Cover page / project metadata', mode: 'AUTO-FILL', note: 'Copy identifiers only; report year, block and applicant must be confirmed.' },
  { target: 'Introduction and statutory background', source: 'Preface and Chapter 1 - Introduction', mode: 'DIRECT COPY', note: 'Reuse only the common legal and district background; add the current study purpose.' },
  { target: 'Physiography, climate and drainage', source: 'Chapters 4 and 5 - General Profile / Physiography', mode: 'DIRECT COPY', note: 'Reuse district-level narrative, maps and stable tables.' },
  { target: 'Regional geology, mineral description and hydrogeology', source: 'Chapter 6 - Geology and Mineral Wealth', mode: 'DIRECT COPY', note: 'Reuse stable district context; site observations remain editable.' },
  { target: 'Deposition of minerals on river bed', source: 'Chapter 3 - Process of Deposition of Sediments', mode: 'DIRECT COPY', note: 'Reuse the common sedimentation narrative.' },
  { target: 'Flora and fauna', source: 'Chapter 4 - General Profile, section Flora & Fauna', mode: 'DIRECT COPY', note: 'Reuse baseline text; attach fresh site evidence if conditions have changed.' },
  { target: 'Reserve / baseline replenishment context', source: 'Chapter 7 - Estimation of Deposits and Replenishment Studies', mode: 'REFERENCE / SELECT', note: 'Reuse applicable baseline tables only after selecting the same block and survey period.' },
  { target: 'EMGSM and mining safeguards', source: 'Chapter 1 / Annexure A - EMGSM 2020', mode: 'DIRECT COPY', note: 'Reuse the guideline text; current compliance evidence is uploaded separately.' },
  { target: 'Pre- and post-monsoon survey, drone/DGPS and GCP data', source: 'Not a stable DSR section', mode: 'UPLOAD REQUIRED', note: 'Must be the current study-period field data.' },
  { target: 'Data processing outputs - orthomosaic, DEM/DSM/DTM and point cloud', source: 'Not a stable DSR section', mode: 'UPLOAD REQUIRED', note: 'Upload original processing outputs for this survey.' },
  { target: 'Grid RL, cross-sections, volume and replenishment calculations', source: 'Not a stable DSR section', mode: 'UPLOAD REQUIRED', note: 'Upload the current pre/post tables and calculation workbook.' },
  { target: 'Conclusion and annexures', source: 'DSR conclusion / annexures', mode: 'NEW / UPLOAD', note: 'Write a study-specific conclusion and attach current approvals, certificates and photographs.' }
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

const REPLENISHMENT_INTRO_SUBSECTIONS = [
  'Introduction', 'Physiography', 'Drainage', 'Climate', 'Regional Geology', 'Local Geology',
  'Description of Mineral', 'Physical & Chemical Characteristics', 'Origin of Mineralisation',
  'Deposition of Minerals', 'Flora & Fauna', 'Hydrogeology', 'Reserve Calculation',
  'Production Programme', 'Replenishment Study', 'Enforcement & Monitoring Guidelines',
  'Methodology', 'Drone Survey', 'Data Processing', 'Cross Sections', 'Grid Calculations', 'Conclusion'
];

const REPLENISHMENT_EXCEL_MODULES = [
  ['project-details', 'Project Details', ['Project Name', 'District', 'State', 'Village', 'Block', 'River', 'Mineral', 'Applicant', 'Lease Area']],
  ['gps-coordinates', 'GPS Coordinates', ['Point ID', 'Latitude', 'Longitude', 'RL', 'Remarks']],
  ['regional-stratigraphic-sequence', 'Regional Stratigraphic Sequence', ['Age', 'Formation', 'Lithology', 'Thickness', 'Remarks']],
  ['infrastructure', 'Infrastructure', ['Item', 'Distance', 'Condition', 'Remarks']],
  ['drainage-basin', 'Drainage Basin', ['River', 'Basin', 'Catchment Area', 'Drainage Pattern', 'Remarks']],
  ['geological-reserve', 'Geological Reserve', ['Block', 'Area', 'Average Depth', 'Bulk Density', 'Reserve']],
  ['unfc-reserve', 'UNFC Reserve', ['UNFC Code', 'Measured', 'Indicated', 'Inferred', 'Total']],
  ['production-programme', 'Production Programme', ['Year', 'Proposed Production', 'Working Days', 'Daily Production', 'Remarks']],
  ['drone-details', 'Drone Details', ['Drone Model', 'UIN', 'Pilot', 'Flight Date', 'Altitude']],
  ['instrument-details', 'Instrument Details', ['Instrument', 'Make', 'Model', 'Serial Number', 'Calibration Date']],
  ['gcp-details', 'GCP Details', ['GCP ID', 'Latitude', 'Longitude', 'RL', 'Observation']],
  ['dgps-details', 'DGPS Details', ['Station', 'Latitude', 'Longitude', 'RL', 'Instrument']],
  ['rl-grid-tables', 'RL Grid Tables', ['Grid ID', 'Grid Area (sqm)', 'Pre Monsoon RL (m)', 'Post Monsoon RL (m)', 'Elevation Difference (m)', 'Deposited Volume (cum)']],
  ['cross-sections', 'Cross Sections', ['Section ID', 'Chainage', 'Pre RL', 'Post RL', 'Difference']],
  ['volume-calculation', 'Volume Calculation', ['Section/Grid', 'Area', 'Depth', 'Volume', 'Remarks']],
  ['replenishment-calculation', 'Replenishment Calculation', ['Reach', 'Mineable Reserve (MT)', 'Replenished Volume (cum)', 'Bulk Density (MT/cum)', 'Replenished Quantity (MT)', 'Replenishment (%)']],
  ['rainfall-data', 'Rainfall Data', ['Month', 'Rainfall (mm)', 'Normal Rainfall', 'Deviation', 'Source']],
  ['sediment-sample', 'Sediment Sample', ['Sample ID', 'Location', 'Sand %', 'Silt %', 'Clay %']],
  ['photo-register', 'Photo Register', ['Photo No', 'Description', 'Location', 'Date', 'Remarks']],
  ['compliance-checklist', 'Compliance Checklist', ['Condition', 'Compliance Status', 'Evidence', 'Remarks']],
  ['annexure-index', 'Annexure Index', ['Annexure No', 'Title', 'Description', 'Page Ref']]
];

const REPLENISHMENT_COVER_ASSETS = [
  ['governmentLogo', 'Government Logo'],
  ['companyLogo', 'Company Logo'],
  ['projectPhoto', 'Project Photograph'],
  ['minePhoto', 'Mine Photograph'],
  ['satelliteImage', 'Satellite Image'],
  ['riverImage', 'River Image']
];

const REPLENISHMENT_REPORT_META_FIELDS = [
  ['reportYear', 'Report Year', 'e.g. 2026'],
  ['projectName', 'Project / Mining Block', 'Project or mining block name'],
  ['mineral', 'Mineral', 'Sand (Minor Mineral)'],
  ['district', 'District', 'District'],
  ['state', 'State', 'State'],
  ['village', 'Village', 'Village'],
  ['block', 'Block', 'Mining block'],
  ['river', 'River', 'River name'],
  ['applicant', 'Applicant', 'Applicant / lease holder'],
  ['applicantAddress', 'Applicant Address', 'Registered address'],
  ['consultant', 'Consultant', 'Consultant / laboratory'],
  ['leaseArea', 'Lease Area (ha)', 'Lease area'],
  ['miningArea', 'Mineable Area (ha)', 'Mineable area'],
  ['khasraNumbers', 'Khasra Numbers', 'Khasra / survey numbers'],
  ['studyPeriod', 'Study Period', 'Pre and post monsoon period'],
  ['preSurveyDate', 'Pre-monsoon Survey Date', 'YYYY-MM-DD'],
  ['postSurveyDate', 'Post-monsoon Survey Date', 'YYYY-MM-DD'],
  ['loiNumber', 'LOI / Auction Letter No.', 'Letter number and date'],
  ['ecNumber', 'Environmental Clearance No.', 'EC number and date'],
  ['miningPlanApproval', 'Mining Plan Approval', 'Approval number and date'],
  ['consultantAccreditation', 'NABET Accreditation', 'Certificate number and validity'],
  ['targetProduction', 'Approved Annual Production (MT)', 'Approved quantity'],
  ['mineableReserve', 'Mineable Reserve (MT)', 'As per approved plan / EC'],
  ['gridSize', 'Survey Grid Size (m)', '25 x 25'],
  ['coordinateSystem', 'Coordinate System / Datum', 'WGS 84 / UTM zone'],
  ['bulkDensity', 'Bulk Density (MT/cum)', '1.80']
];

const REPLENISHMENT_SECTION_ALIASES = {
  'Introduction': ['1. INTRODUCTION', 'INTRODUCTION'],
  'Physiography': ['PHYSIOGRAPHY', 'PHYSIOGRAPHIC'],
  'Drainage': ['DRAINAGE SYSTEM', 'DRAINAGE PATTERN'],
  'Climate': ['CLIMATE'],
  'Regional Geology': ['REGIONAL GEOLOGY'],
  'Local Geology': ['LOCAL GEOLOGY'],
  'Description of Mineral': ['DESCRIPTION OF MINERAL', 'MINERAL DESCRIPTION'],
  'Physical & Chemical Characteristics': ['PHYSICAL & CHEMICAL CHARACTERISTICS', 'PHYSICAL AND CHEMICAL CHARACTERISTICS'],
  'Origin of Mineralisation': ['ORIGIN OF MINERALISATION', 'ORIGIN OF MINERALIZATION'],
  'Deposition of Minerals': ['DEPOSITION OF MINERALS ON RIVERBED', 'DEPOSITION OF MINERALS'],
  'Flora & Fauna': ['FLORA AND FAUNA', 'FLORA & FAUNA'],
  'Hydrogeology': ['HYDROGEOLOGY'],
  'Reserve Calculation': ['METHOD OF ESTIMATION OF RESERVE', 'RESERVE CALCULATION'],
  'Production Programme': ['PRODUCTION PROGRAMME', 'PRODUCTION PROGRAM'],
  'Replenishment Study': ['REPLENISHMENT STUDY OF MINED AREA', 'REPLENISHMENT STUDY'],
  'Enforcement & Monitoring Guidelines': ['ENFORCEMENT & MONITORING GUIDELINES', 'ENFORCEMENT AND MONITORING GUIDELINES'],
  'Methodology': ['METHODOLOGY FOR REPLENISHMENT STUDY', 'METHODOLOGY'],
  'Drone Survey': ['DRONE/UAV METHOD', 'DRONE SURVEY'],
  'Data Processing': ['DATA PROCESSING'],
  'Cross Sections': ['CROSS-SECTIONAL PROFILE', 'CROSS SECTION'],
  'Grid Calculations': ['CALCULATION OF GRID WISE AREA', 'GRID WISE AREA'],
  'Conclusion': ['CONCLUSION']
};

function defaultEnterpriseBuilder() {
  return {
    templateVersion: 'official-replenishment-2024',
    reportMeta: {
      reportYear: '', projectName: '', mineral: 'Sand (Minor Mineral)', district: '', state: 'Punjab',
      village: '', block: '', river: '', applicant: '', applicantAddress: '', consultant: '',
      leaseArea: '', miningArea: '', khasraNumbers: '', studyPeriod: '', preSurveyDate: '', postSurveyDate: '',
      loiNumber: '', ecNumber: '', miningPlanApproval: '', consultantAccreditation: '', targetProduction: '',
      mineableReserve: '', gridSize: '25 x 25', coordinateSystem: 'WGS 84', bulkDensity: '1.80'
    },
    autoFill: { source: '', updatedAt: '', fields: [] },
    manualOverrides: [],
    coverAssets: {},
    certificates: [],
    introSubsections: REPLENISHMENT_INTRO_SUBSECTIONS.map((title, index) => ({
      id: `intro-${index + 1}`,
      title,
      enabled: true,
      text: '',
      files: []
    })),
    excelModules: Object.fromEntries(REPLENISHMENT_EXCEL_MODULES.map(([id, title, columns]) => [id, { id, title, columns, rows: [], files: [] }])),
    annexures: [],
    order: ['cover', 'certificates', 'index', ...REPLENISHMENT_INTRO_SUBSECTIONS.map((_, index) => `intro-${index + 1}`), ...REPLENISHMENT_EXCEL_MODULES.map(([id]) => `table-${id}`), 'annexures']
  };
}

function ensureEnterpriseBuilder(report) {
  if (!report.enterpriseBuilder || typeof report.enterpriseBuilder !== 'object') {
    report.enterpriseBuilder = defaultEnterpriseBuilder();
  }
  const defaults = defaultEnterpriseBuilder();
  report.enterpriseBuilder.coverAssets = report.enterpriseBuilder.coverAssets || {};
  report.enterpriseBuilder.templateVersion = report.enterpriseBuilder.templateVersion || defaults.templateVersion;
  report.enterpriseBuilder.reportMeta = { ...defaults.reportMeta, ...(report.enterpriseBuilder.reportMeta || {}) };
  report.enterpriseBuilder.autoFill = report.enterpriseBuilder.autoFill || defaults.autoFill;
  report.enterpriseBuilder.manualOverrides = Array.isArray(report.enterpriseBuilder.manualOverrides) ? report.enterpriseBuilder.manualOverrides : [];
  report.enterpriseBuilder.certificates = Array.isArray(report.enterpriseBuilder.certificates) ? report.enterpriseBuilder.certificates : [];
  report.enterpriseBuilder.annexures = Array.isArray(report.enterpriseBuilder.annexures) ? report.enterpriseBuilder.annexures : [];
  report.enterpriseBuilder.introSubsections = Array.isArray(report.enterpriseBuilder.introSubsections) && report.enterpriseBuilder.introSubsections.length
    ? report.enterpriseBuilder.introSubsections
    : defaults.introSubsections;
  report.enterpriseBuilder.excelModules = report.enterpriseBuilder.excelModules || defaults.excelModules;
  Object.entries(defaults.excelModules).forEach(([id, module]) => {
    if (!report.enterpriseBuilder.excelModules[id]) report.enterpriseBuilder.excelModules[id] = module;
  });
  report.enterpriseBuilder.order = Array.isArray(report.enterpriseBuilder.order) && report.enterpriseBuilder.order.length
    ? report.enterpriseBuilder.order
    : defaults.order;
  return report.enterpriseBuilder;
}

function replenishmentFirstValue(...values) {
  for (const value of values) {
    if (Array.isArray(value) && value.length) return value.join(', ');
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return '';
}

function getInheritedReplenishmentText(report) {
  return (report?.inheritanceScan?.sourceDocuments || [])
    .map(document => document.extractedText || '')
    .filter(Boolean)
    .join('\n\n');
}

function extractInheritedReplenishmentSection(sourceText, aliases) {
  if (!sourceText || !aliases?.length) return '';
  const upper = sourceText.toUpperCase();
  let start = -1;
  aliases.some(alias => {
    start = upper.indexOf(String(alias).toUpperCase());
    return start >= 0;
  });
  if (start < 0) return '';
  const remaining = sourceText.slice(start);
  const heading = /\n\s*(?:\d+(?:\.\d+)?\s*[.)-]?\s*)?[A-Z][A-Z &/()\-]{5,}\s*:?\s*\n/g;
  heading.lastIndex = Math.min(80, remaining.length);
  const next = heading.exec(remaining);
  return remaining.slice(0, next && next.index > 120 ? next.index : 6500).replace(/\s+\n/g, '\n').trim();
}

function applyFinalDsrAutomation(report, sourceProject = null) {
  if (!report) return report;
  const builder = ensureEnterpriseBuilder(report);
  const state = report.inheritedSourceSnapshot || parseProjectState(sourceProject) || {};
  const front = state.frontMatter || {};
  const project = sourceProject || report.finalDsrSource || {};
  const meta = builder.reportMeta;
  const candidates = {
    reportYear: replenishmentFirstValue(project.year, front.year, new Date().getFullYear()),
    projectName: replenishmentFirstValue(project.projectName, project.title, front.title, report.name),
    mineral: replenishmentFirstValue(project.mineral, state.mineral, front.mineral, 'Sand (Minor Mineral)'),
    district: replenishmentFirstValue(project.district, front.district),
    state: replenishmentFirstValue(project.state, front.state, 'Punjab'),
    village: replenishmentFirstValue(project.village, state.village, front.village),
    block: replenishmentFirstValue(project.block, state.block, state.miningBlock, front.block),
    river: replenishmentFirstValue(project.river, project.rivers, state.river, state.rivers, front.riverName, front.river),
    applicant: replenishmentFirstValue(project.applicant, state.applicant, state.applicantName, front.applicant),
    applicantAddress: replenishmentFirstValue(project.applicantAddress, state.applicantAddress, front.applicantAddress),
    consultant: replenishmentFirstValue(state.consultant, front.assistedBy, front.preparedBy),
    leaseArea: replenishmentFirstValue(project.leaseArea, state.leaseArea, state.area, front.leaseArea),
    miningArea: replenishmentFirstValue(project.miningArea, state.miningArea, state.mineableArea),
    khasraNumbers: replenishmentFirstValue(project.khasraNumbers, state.khasraNumbers, state.khasraNos),
    studyPeriod: replenishmentFirstValue(state.studyPeriod, state.surveyPeriod),
    bulkDensity: replenishmentFirstValue(state.bulkDensity, '1.80')
  };
  const filled = [];
  Object.entries(candidates).forEach(([key, value]) => {
    if (!builder.manualOverrides.includes(key) && !meta[key] && value) {
      meta[key] = value;
      filled.push(key);
    }
  });

  const chapterText = (state.chapters || []).map(chapter => `${chapter.name || ''}\n${chapter.summary || ''}`).join('\n\n');
  const scannedText = getInheritedReplenishmentText(report);
  builder.introSubsections.forEach(section => {
    if (builder.manualOverrides.includes(section.id) || section.text || section.files?.length) return;
    const extracted = extractInheritedReplenishmentSection(scannedText, REPLENISHMENT_SECTION_ALIASES[section.title]);
    if (extracted) {
      section.text = extracted;
      filled.push(section.id);
      return;
    }
    const words = section.title.toLowerCase().split(/\s+|&/).filter(word => word.length > 4);
    const matchingChapter = (state.chapters || []).find(chapter => words.some(word => `${chapter.name || ''} ${chapter.summary || ''}`.toLowerCase().includes(word)));
    if (matchingChapter?.summary) {
      section.text = matchingChapter.summary;
      filled.push(section.id);
    }
  });
  if (!builder.introSubsections[0].text && chapterText) builder.introSubsections[0].text = chapterText.slice(0, 4500);

  const projectModule = builder.excelModules['project-details'];
  if (projectModule && !projectModule.rows.length) {
    projectModule.rows = [{
      'Project Name': meta.projectName, District: meta.district, State: meta.state, Village: meta.village,
      Block: meta.block, River: meta.river, Mineral: meta.mineral, Applicant: meta.applicant, 'Lease Area': meta.leaseArea
    }];
  }
  builder.autoFill = {
    source: report.finalDsrSource?.title || project.title || project.projectName || 'Final DSR',
    updatedAt: new Date().toISOString(),
    fields: Array.from(new Set([...(builder.autoFill?.fields || []), ...filled]))
  };
  return report;
}

function hasEnterpriseBuilderContent(report) {
  if (!report) return false;
  const builder = ensureEnterpriseBuilder(report);
  return Object.values(builder.coverAssets || {}).some(Boolean)
    || builder.certificates.length > 0
    || builder.introSubsections.some(item => item.text || item.files?.length)
    || Object.values(builder.excelModules).some(item => item.rows?.length || item.files?.length)
    || builder.annexures.length > 0;
}

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
    generatedPdf: state.generatedPdf || null,
    enterpriseBuilder: state.enterpriseBuilder || null
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
        generatedPdf: report.generatedPdf || null,
        enterpriseBuilder: report.enterpriseBuilder || null
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
window.replSaveReportToServer = saveReportToServer;
window.showReplenishmentOptions = showReplenishmentOptions;
window.showCreateReportForm = showCreateReportForm;
window.showExistingReportsList = showExistingReportsList;
window.submitCustomReportName = submitCustomReportName;
window.openCustomReport = openCustomReport;
window.renameCustomReport = renameCustomReport;
window.deleteCustomReport = deleteCustomReport;
window.downloadCustomReportPDFDirect = downloadCustomReportPDFDirect;
window.downloadCustomReportWordDirect = downloadCustomReportWordDirect;
window.downloadCustomReportFilesDirect = downloadCustomReportFilesDirect;
window.onParentCheckboxChange = onParentCheckboxChange;
window.onSubCheckboxChange = onSubCheckboxChange;
window.updateCustomReportPreview = updateCustomReportPreview;
window.downloadCustomReportPDF = downloadCustomReportPDF;
window.downloadCustomReportWord = downloadCustomReportWord;
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
window.previewFinalDsrDocument = previewFinalDsrDocument;
window.refreshFinalDsrAutoScan = refreshFinalDsrAutoScan;
window.handleReplBuilderAssetUpload = handleReplBuilderAssetUpload;
window.updateReplReportMeta = updateReplReportMeta;
window.addReplCertificate = addReplCertificate;
window.updateReplCertificate = updateReplCertificate;
window.uploadReplCertificateFile = uploadReplCertificateFile;
window.deleteReplBuilderItem = deleteReplBuilderItem;
window.updateReplIntro = updateReplIntro;
window.uploadReplIntroFile = uploadReplIntroFile;
window.downloadReplExcelTemplate = downloadReplExcelTemplate;
window.uploadReplExcelModule = uploadReplExcelModule;
window.addReplTableRow = addReplTableRow;
window.updateReplTableCell = updateReplTableCell;
window.deleteReplTableRow = deleteReplTableRow;
window.addReplAnnexure = addReplAnnexure;
window.updateReplAnnexure = updateReplAnnexure;
window.uploadReplAnnexureFile = uploadReplAnnexureFile;

function showReplenishmentOptions(container) {
  container.innerHTML = `
    <div style="max-width: 980px; margin: 32px auto; padding: 0 20px;">
      <div style="text-align: center; margin-bottom: 40px;">
        <h2 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 24px; font-weight: 800; color: #1e293b; margin: 0 0 10px 0;">Government Replenishment Report Builder</h2>
        <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; color: #64748b; margin: 0;">Use the official upload-driven report builder with Final DSR auto-scan, live preview, and merged PDF or Word downloads.</p>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
        <div class="card" onclick="window.showCreateReportForm()" style="padding: 32px; text-align: center; cursor: pointer; border: 1.5px solid #e2e8f0; border-radius: 12px; transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s; background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); display: flex; flex-direction: column; align-items: center;">
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: #eff6ff; border-radius: 12px; margin-bottom: 20px;">
            <i data-lucide="file-plus" style="width: 28px; height: 28px; color: #2563eb;"></i>
          </div>
          <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 18px; font-weight: 700; color: #1e293b; margin: 0 0 8px 0;">Create Official Report</h3>
          <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: #64748b; margin: 0; line-height: 1.5;">Start the latest Government Replenishment Report workflow with auto-copy and live builder modules.</p>
        </div>
        
        <div class="card" onclick="window.showExistingReportsList()" style="padding: 32px; text-align: center; cursor: pointer; border: 1.5px solid #e2e8f0; border-radius: 12px; transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s; background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); display: flex; flex-direction: column; align-items: center;">
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: #f0fdf4; border-radius: 12px; margin-bottom: 20px;">
            <i data-lucide="folder-open" style="width: 28px; height: 28px; color: #16a34a;"></i>
          </div>
          <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 18px; font-weight: 700; color: #1e293b; margin: 0 0 8px 0;">Open Saved Reports</h3>
          <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: #64748b; margin: 0; line-height: 1.5;">Open historical and current reports in the latest live builder viewer.</p>
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

let replenishmentCreateInProgress = false;

async function replenishmentApiFetch(endpoint, options = {}, timeoutMs = 25000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await apiFetch(endpoint, { ...options, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildReplenishmentSearchText(project, state) {
  const parts = [];
  let textLength = 0;
  const ignoredKey = /(?:pdf|image|dataurl|base64|blob|binary|renderedpages|chapterpdfs|uploadedpdfs)/i;
  const append = (value) => {
    if (textLength > 120000) return;
    const text = String(value || '').trim();
    if (!text || /^data:/i.test(text)) return;
    const clipped = text.slice(0, 6000);
    parts.push(clipped);
    textLength += clipped.length + 1;
  };
  const visit = (value, key = '', depth = 0) => {
    if (depth > 5 || ignoredKey.test(key) || textLength > 120000 || value == null) return;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      append(value);
      return;
    }
    if (Array.isArray(value)) {
      value.slice(0, 60).forEach(item => visit(item, key, depth + 1));
      return;
    }
    if (typeof value === 'object') {
      Object.entries(value).slice(0, 100).forEach(([childKey, childValue]) => {
        append(childKey.replace(/([A-Z])/g, ' $1'));
        visit(childValue, childKey, depth + 1);
      });
    }
  };
  visit({
    project: {
      title: project?.title,
      projectName: project?.projectName,
      district: project?.district,
      state: project?.state,
      year: project?.year,
      mineral: project?.mineral,
      rivers: project?.rivers,
      village: project?.village,
      block: project?.block
    },
    state
  });
  return parts.join(' ').toLowerCase();
}

function getReplenishmentStateSnapshot(state) {
  return {
    frontMatter: state?.frontMatter || {},
    chapters: (state?.chapters || []).map(chapter => ({ id: chapter.id, name: chapter.name, summary: chapter.summary })),
    plates: (state?.plates || []).map(plate => ({ id: plate.id, name: plate.name })),
    mineral: state?.mineral,
    village: state?.village,
    river: state?.river,
    rivers: state?.rivers,
    miningBlock: state?.miningBlock,
    leaseArea: state?.leaseArea,
    miningArea: state?.miningArea,
    khasraNumbers: state?.khasraNumbers,
    consultant: state?.consultant,
    applicant: state?.applicant,
    applicantName: state?.applicantName,
    applicantAddress: state?.applicantAddress,
    studyPeriod: state?.studyPeriod,
    surveyPeriod: state?.surveyPeriod,
    bulkDensity: state?.bulkDensity
  };
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
    const projects = await replenishmentApiFetch('/projects', {}, 15000);
    const list = Array.isArray(projects) ? projects : [];
    const approved = list.filter(isApprovedFinalDsrProject);
    if (approved.length) return approved;
    return S.activeProject ? [S.activeProject] : [];
  } catch (err) {
    console.warn('Failed to load Final DSR projects:', err);
    return S.activeProject ? [S.activeProject] : [];
  }
}

function hasFinalDsrData(project, state, label, searchText = '') {
  const key = label.toLowerCase();
  const frontMatter = state.frontMatter || {};
  const textBlob = searchText || buildReplenishmentSearchText(project, state);
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

function getValueAtPath(source, path) {
  return String(path || '').split('.').filter(Boolean).reduce((value, key) => value == null ? undefined : value[key], source);
}

function buildFinalDsrUploadInventory(project, sourceState = null) {
  const state = sourceState || parseProjectState(project);
  const documents = [];
  const add = (id, title, kind, path, meta = {}) => {
    const value = getValueAtPath(state, path);
    const pages = Array.isArray(value) ? value.filter(Boolean) : [];
    const hasValue = pages.length || (value && typeof value === 'object') || String(value || '').trim();
    if (!hasValue) return;
    documents.push({ id, title, kind, path, pageCount: pages.length, ...meta });
  };

  Object.keys(state.uploadedPDFs || {}).forEach(key => add(`upload-${key}`, getReplenishmentSectionTitle(key), 'Uploaded PDF', `uploadedPDFs.${key}`));
  (state.chapters || []).forEach((chapter, index) => {
    const title = chapter.name || `Chapter ${index + 1}`;
    if (String(chapter.summary || '').trim()) documents.push({ id: `chapter-text-${chapter.id || index}`, title, kind: 'Chapter data', path: `chapters.${index}`, textPath: `chapters.${index}.summary`, pageCount: 0 });
    add(`chapter-pdf-${chapter.id || index}`, title, 'Chapter PDF', `chapterPDFs.${chapter.id}`);
  });
  (state.plates || []).forEach((plate, index) => {
    const title = plate.name || `Plate ${index + 1}`;
    if (Array.isArray(plate.pages) && plate.pages.length) documents.push({ id: `plate-${plate.id || index}`, title, kind: 'Map / Plate', path: `plates.${index}.pages`, pageCount: plate.pages.length });
  });
  Object.entries(state.frontMatterFiles || {}).forEach(([key]) => add(`front-${key}`, `Front Matter - ${key}`, 'Front matter', `frontMatterFiles.${key}`));
  (project.files || []).forEach((file, index) => {
    const identifier = file.annexureId || file.id;
    if (!identifier) return;
    documents.push({
      id: `stored-file-${identifier}`,
      title: file.fileName || `Final DSR file ${index + 1}`,
      kind: file.contentType || 'Stored upload',
      path: '',
      pageCount: 0,
      fileUrl: `/api/files/download/${encodeURIComponent(identifier)}?inline=true`,
      downloadUrl: `/api/files/download/${encodeURIComponent(identifier)}`
    });
  });
  if (project.id && (project.finalPdfName || project.pdfData?.final)) {
    documents.unshift({
      id: 'generated-final-dsr',
      title: project.finalPdfName || 'Generated Final DSR',
      kind: 'Generated Final DSR PDF',
      path: '',
      pageCount: 0,
      fileUrl: `/api/download-pdf?projectId=${encodeURIComponent(project.id)}&annexureId=final&inline=true`,
      downloadUrl: `/api/download-pdf?projectId=${encodeURIComponent(project.id)}&annexureId=final`
    });
  }

  return documents;
}

function scanFinalDsrForReplenishment(project, sourceState = null) {
  const state = sourceState || parseProjectState(project);
  const searchText = buildReplenishmentSearchText(project, state);
  const inherited = [];
  const missing = [];
  REPLENISHMENT_INHERITANCE_FIELDS.forEach(field => {
    (hasFinalDsrData(project, state, field, searchText) ? inherited : missing).push(field);
  });

  const missingRequirementIds = REPLENISHMENT_MISSING_REQUIREMENTS
    .filter(group => group.items.some(item => missing.includes(item) || !hasFinalDsrData(project, state, item, searchText)))
    .map(group => group.id);

  const sourceDocuments = buildFinalDsrUploadInventory(project, state);
  return {
    scannedAt: new Date().toISOString(),
    inherited,
    missing,
    missingRequirementIds,
    totalFields: REPLENISHMENT_INHERITANCE_FIELDS.length,
    inheritedCount: inherited.length,
    missingCount: missing.length,
    sourceDocuments,
    sourceDocumentCount: sourceDocuments.length,
    sourcePageCount: sourceDocuments.reduce((sum, item) => sum + Number(item.pageCount || 0), 0)
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
          <button id="create-replenishment-report-btn" class="btn btn-primary" onclick="window.submitCustomReportName()" style="flex:2; display: flex; align-items: center; justify-content: center; height: 42px; gap: 8px; font-weight: 700; font-size: 14px; border-radius: 8px; border: none; cursor: pointer;">
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
  if (replenishmentCreateInProgress) return;
  const input = document.getElementById('new-report-name-input');
  if (!input) return;
  const reportName = input.value.trim();
  if (!reportName) {
    toast("Please enter a report name", "error");
    return;
  }

  const createButton = document.getElementById('create-replenishment-report-btn');
  replenishmentCreateInProgress = true;
  if (createButton) {
    createButton.disabled = true;
    createButton.style.cursor = 'wait';
    createButton.innerHTML = '<span>Creating report...</span>';
  }
  try {
    const sourceSelect = document.getElementById('final-dsr-source-select');
    const sourceId = sourceSelect ? sourceSelect.value : '';
    let sourceProject = S.activeProject;
    if (sourceId && String(sourceId) !== String(S.activeProject.id)) {
      try {
        sourceProject = await replenishmentApiFetch(`/projects/${sourceId}`, {}, 20000);
      } catch (err) {
        toast("Unable to load selected Final DSR. Using active project data.", "warning");
      }
    }
    const sourceState = parseProjectState(sourceProject);
    const inheritanceScan = scanFinalDsrForReplenishment(sourceProject, sourceState);
    const finalDsrSource = sourceProject ? {
      id: sourceProject.id,
      title: sourceProject.title || sourceProject.projectName || 'Final DSR',
      district: sourceProject.district || '',
      year: sourceProject.year || '',
      status: sourceProject.status || ''
    } : null;
    const initialEnterpriseReport = {
      name: reportName,
      finalDsrSource,
      inheritedSourceSnapshot: getReplenishmentStateSnapshot(sourceState),
      enterpriseBuilder: defaultEnterpriseBuilder()
    };
    applyFinalDsrAutomation(initialEnterpriseReport, sourceProject);

    const res = await replenishmentApiFetch(`/projects/${S.activeProject.id}/replenishment`, {
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
          manualEntries: {},
          enterpriseBuilder: initialEnterpriseReport.enterpriseBuilder
        }
      })
    });
    
    const newReport = {
      id: res.id,
      projectId: S.activeProject.id,
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
      manualEntries: {},
      inheritedSourceSnapshot: getReplenishmentStateSnapshot(sourceState),
      enterpriseBuilder: initialEnterpriseReport.enterpriseBuilder
    };
    
    window.activeReport = upsertLocalReport(newReport);
    const editorContainer = document.getElementById('repl-editor-container');
    if (editorContainer) {
      renderCustomReportGenerator(editorContainer, newReport);
    }
  } catch (err) {
    toast("Failed to create report: " + err.message, "error");
  } finally {
    replenishmentCreateInProgress = false;
    if (createButton) {
      createButton.disabled = false;
      createButton.style.cursor = 'pointer';
      createButton.innerHTML = '<span>Scan DSR &amp; Create Report</span><i data-lucide="arrow-right" style="width: 16px; height: 16px;"></i>';
      if (window.lucide) window.lucide.createIcons();
    }
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
            <button class="btn btn-sm btn-saffron repl-download-files-btn" data-report-id="${r.id}" onclick="window.downloadCustomReportFilesDirect('${r.id}', this)" style="padding: 4px 8px; font-size: 11.5px; height: auto; cursor: pointer;">Download PDF + Word</button>
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
          <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; color: #64748b; margin:0;">All saved reports open in the latest Government Report Builder.</p>
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
  const editorContainer = document.getElementById('repl-editor-container');
  if (editorContainer) {
    editorContainer.innerHTML = `<div style="padding:40px; text-align:center; font-weight:700; color:#1e293b;">Opening replenishment report...</div>`;
  }
  try {
    const s = await replenishmentApiFetch(`/replenishment/${reportId}`, {}, 25000);
    const report = upsertLocalReport(normalizeBackendReport(s));
    window.activeReport = report;
    if (editorContainer) {
      renderCustomReportGenerator(editorContainer, report);
    }
  } catch (err) {
    toast("Failed to open report: " + err.message, "error");
    if (editorContainer) showExistingReportsList();
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
    
    const hasUploadedContent = Object.keys(report.replenishmentUploads || {}).length || Object.keys(report.manualEntries || {}).length;
    const checkedIds = report.sections?.length ? report.sections : (report.inheritanceScan?.sourceDocumentCount ? ['__final-dsr-auto-scan'] : (hasEnterpriseBuilderContent(report) ? ['__replenishment-builder'] : (hasUploadedContent ? ['__replenishment-uploaded-content'] : [])));
    if (checkedIds.length === 0) {
      toast("No sections selected in this report to download.", "error");
      return;
    }
    
    await generateReplenishmentPDF(report.name, checkedIds, reportId, { triggerButton });
  } catch (err) {
    toast("Failed to download PDF: " + err.message, "error");
  }
}

async function downloadCustomReportWordDirect(reportId, triggerButton = null) {
  try {
    const saved = await apiFetch(`/replenishment/${reportId}`);
    const report = upsertLocalReport(normalizeBackendReport(saved));
    restoreReportFrontMatterPdfs(report);
    await downloadCustomReportWord(report.name, report.id, triggerButton);
  } catch (error) {
    toast("Failed to download Word file: " + error.message, "error");
  }
}

async function downloadCustomReportFilesDirect(reportId, triggerButton = null) {
  try {
    const saved = await apiFetch(`/replenishment/${reportId}`);
    const report = upsertLocalReport(normalizeBackendReport(saved));
    restoreReportFrontMatterPdfs(report);
    const checkedIds = getEffectiveReplenishmentSectionIds(report);
    if (!checkedIds.length) {
      toast('No sections selected in this report to download.', 'error');
      return;
    }

    if (triggerButton) {
      triggerButton.disabled = true;
      triggerButton.dataset.originalText = triggerButton.dataset.originalText || triggerButton.textContent || 'Download PDF + Word';
      triggerButton.textContent = 'Preparing files...';
    }

    const pdfDownloaded = await generateReplenishmentPDF(report.name, checkedIds, report.id, {
      skipButtonState: true
    });
    if (!pdfDownloaded) return;
    await downloadCustomReportWord(report.name, report.id, null);
  } catch (error) {
    console.error('Replenishment report download failed:', error);
    toast(`Failed to download report files: ${error.message}`, 'error');
  } finally {
    if (triggerButton) {
      triggerButton.disabled = false;
      triggerButton.textContent = triggerButton.dataset.originalText || 'Download PDF + Word';
    }
  }
}

function getCurrentSelectedReportSectionIds() {
  const scope = document.getElementById('draggable-sections-list') || document;
  const checkboxes = scope.querySelectorAll('input[id^="chk-"]:checked');
  return Array.from(new Set(Array.from(checkboxes).map(c => c.value).filter(Boolean)));
}

function getEffectiveReplenishmentSectionIds(report) {
  const selected = getCurrentSelectedReportSectionIds();
  if (selected.length) return selected;
  if (Array.isArray(report?.sections) && report.sections.length) return [...report.sections];
  if (report?.inheritanceScan?.sourceDocumentCount) return ['__final-dsr-auto-scan'];
  if (hasEnterpriseBuilderContent(report)) return ['__replenishment-builder'];
  if (Object.keys(report?.replenishmentUploads || {}).length || Object.keys(report?.manualEntries || {}).length) {
    return ['__replenishment-uploaded-content'];
  }
  // The selection panel is intentionally not part of the streamlined builder.
  // Keep preview/export available even when a new report only has its title/metadata.
  return ['__replenishment-report'];
}

async function saveReportSelection(reportId) {
  if (!document.getElementById('draggable-sections-list')) return;
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

async function extractReplenishmentPdfText(file) {
  if (!file || file.type !== 'application/pdf') return '';
  try {
    if (typeof ensurePortalVendors === 'function') await ensurePortalVendors(['pdfjs']);
    if (!window.pdfjsLib) return '';
    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await window.pdfjsLib.getDocument({ data }).promise;
    const text = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => item.str || '').join(' ').replace(/\s+/g, ' ').trim();
      if (pageText) text.push(pageText);
    }
    return text.join('\n\n');
  } catch (error) {
    console.warn('Replenishment PDF text extraction failed:', error);
    return '';
  }
}

async function extractReplenishmentDocxHtml(file) {
  if (!file || !/\.docx$/i.test(file.name || '')) return '';
  try {
    if (!window.mammoth) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/mammoth@1.7.2/mammoth.browser.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Word preview library could not be loaded.'));
        document.head.appendChild(script);
      });
    }
    const result = await window.mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
    const doc = new DOMParser().parseFromString(result.value || '', 'text/html');
    doc.querySelectorAll('script,iframe,object,embed').forEach(element => element.remove());
    doc.querySelectorAll('*').forEach(element => Array.from(element.attributes).forEach(attribute => {
      if (/^on/i.test(attribute.name)) element.removeAttribute(attribute.name);
    }));
    return doc.body.innerHTML;
  } catch (error) {
    console.warn('Replenishment Word extraction failed:', error);
    return '';
  }
}

async function buildReplenishmentScannedUpload(file) {
  const isPdf = file.type === 'application/pdf';
  const isImage = /^image\//i.test(file.type || '');
  const dataUrl = isImage ? await replReadFileAsDataUrl(file) : '';
  const pages = isPdf ? await replRenderPdfPages(file) : [];
  const extractedText = isPdf ? await extractReplenishmentPdfText(file) : '';
  const extractedHtml = await extractReplenishmentDocxHtml(file);
  const scanned = {
    dataUrl,
    extractedText,
    extractedHtml,
    scanStatus: isPdf
      ? (extractedText ? `Text extracted from ${pages.length || 1} PDF page(s)` : `Scanned ${pages.length || 1} PDF page(s) for merged output`)
      : (isImage ? 'Image ready for merged output' : 'File attached for merged output')
  };
  Object.defineProperty(scanned, 'pages', { value: pages, writable: true, configurable: true, enumerable: false });
  return scanned;
}

async function hydrateReplenishmentUploadContent(report) {
  if (!report?.replenishmentUploads) return report;
  const records = Object.values(report.replenishmentUploads).flatMap(files => Array.isArray(files) ? files : []);
  for (const record of records) {
    if (record.pages?.length || record.dataUrl || !record.url) continue;
    try {
      const response = await fetch(resolveReplenishmentFileUrl(record.url), { credentials: 'same-origin' });
      if (!response.ok) continue;
      const blob = await response.blob();
      const file = new File([blob], record.name || record.fileName || 'replenishment-upload', { type: record.type || blob.type });
      const scanned = await buildReplenishmentScannedUpload(file);
      Object.assign(record, scanned);
      Object.defineProperty(record, 'pages', { value: scanned.pages || [], writable: true, configurable: true, enumerable: false });
    } catch (error) {
      console.warn('Could not hydrate a saved Replenishment upload:', error);
    }
  }
  return report;
}

function buildReplenishmentUploadedContent(report) {
  const uploads = Object.entries(report?.replenishmentUploads || {})
    .flatMap(([requirementId, files]) => (Array.isArray(files) ? files : []).map((file, index) => ({
      requirementId,
      file,
      index,
      sequence: Number(file.sequence || Date.parse(file.uploadedAt || '') || 0)
    })))
    .sort((a, b) => a.sequence - b.sequence || a.index - b.index);

  const manualEntries = Object.entries(report?.manualEntries || {}).filter(([, value]) => String(value || '').trim());
  if (!uploads.length && !manualEntries.length) return '';

  const uploadHtml = uploads.map(({ requirementId, file }, index) => {
    const title = getReplenishmentRequirementById(requirementId)?.title || getReplenishmentSectionTitle(requirementId) || requirementId;
    const content = renderReplUploadedFileContent(file, 'Uploaded study document');
    const extracted = file.extractedText
      ? `<details style="margin-top:10px"><summary style="cursor:pointer;font-size:11px;color:#475569">Extracted text</summary><p style="white-space:pre-wrap;font-size:11px;line-height:1.55;color:#334155">${escapeHtml(file.extractedText)}</p></details>`
      : '';
    return `<section class="section-block"><h2 class="section-title">${index + 1}. ${escapeHtml(title)}</h2><p style="font-size:11px;color:#64748b">${escapeHtml(file.name || 'Uploaded document')}${file.scanStatus ? ` - ${escapeHtml(file.scanStatus)}` : ''}</p>${content}${extracted}</section>`;
  }).join('');
  const manualHtml = manualEntries.map(([requirementId, value], index) => `<section class="section-block"><h2 class="section-title">Manual Entry ${index + 1}: ${escapeHtml(getReplenishmentRequirementById(requirementId)?.title || getReplenishmentSectionTitle(requirementId) || requirementId)}</h2><p style="white-space:pre-wrap;font-size:13px;line-height:1.65;color:#334155">${escapeHtml(value)}</p></section>`).join('');
  return `${uploadHtml}${manualHtml}`;
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
    toast("Scanning file and uploading it to the report...", "info");
    const scannedFile = await buildReplenishmentScannedUpload(file);
    const uploaded = await uploadReplenishmentFileToServer(file, reportId, requirementId);
    if (!report.replenishmentUploads) report.replenishmentUploads = {};
    const existing = Array.isArray(report.replenishmentUploads[requirementId]) ? report.replenishmentUploads[requirementId] : [];
    const record = {
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
        downloadUrl: uploaded.downloadUrl,
        sequence: Date.now(),
        dataUrl: /^image\//i.test(uploaded.contentType || file.type || '') ? resolveReplenishmentFileUrl(uploaded.url) : '',
        extractedText: scannedFile.extractedText,
        extractedHtml: scannedFile.extractedHtml,
        scanStatus: scannedFile.scanStatus
      };
    Object.defineProperty(record, 'pages', { value: scannedFile.pages || [], writable: true, configurable: true, enumerable: false });
    report.replenishmentUploads[requirementId] = [...existing, record];
    input.value = '';

    const cached = reports.find(r => r.id === report.id);
    if (cached) cached.replenishmentUploads = report.replenishmentUploads;
    window.activeReport = report;
    saveLocalReports(reports.length ? reports : [report]);

    const editorContainer = document.getElementById('repl-editor-container');
    if (editorContainer) renderCustomReportGenerator(editorContainer, report);
    updateCustomReportPreview(report.name || 'Replenishment Report', report.id);
    toast("File scanned, uploaded, and added to the live report.", "success");
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
  updateCustomReportPreview(report.name || 'Replenishment Report', report.id);
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

async function hydrateFinalDsrSource(report, force = false) {
  if (!report?.finalDsrSource?.id) return null;
  if (!force && report.inheritedSourceSnapshot) {
    await hydrateFinalDsrScannedPages(report.inheritanceScan);
    applyFinalDsrAutomation(report);
    return report.inheritedSourceSnapshot;
  }
  const project = await apiFetch(`/projects/${report.finalDsrSource.id}`);
  report.inheritedSourceSnapshot = parseProjectState(project);
  report.inheritanceScan = scanFinalDsrForReplenishment(project);
  await hydrateFinalDsrScannedPages(report.inheritanceScan);
  applyFinalDsrAutomation(report, project);
  return report.inheritedSourceSnapshot;
}

async function hydrateFinalDsrScannedPages(scan) {
  const documents = Array.isArray(scan?.sourceDocuments) ? scan.sourceDocuments : [];
  for (const document of documents) {
    if (!document.fileUrl || document.renderedPages?.length) continue;
    try {
      const response = await fetch(resolveReplenishmentFileUrl(document.fileUrl), { credentials: 'same-origin' });
      if (!response.ok) continue;
      const blob = await response.blob();
      if (blob.type !== 'application/pdf') continue;
      const file = new File([blob], document.title || 'final-dsr.pdf', { type: 'application/pdf' });
      if (document.id !== 'generated-final-dsr') {
        const pages = await replRenderPdfPages(file);
        Object.defineProperty(document, 'renderedPages', { value: pages, writable: true, configurable: true, enumerable: false });
      }
      Object.defineProperty(document, 'extractedText', { value: await extractReplenishmentPdfText(file), writable: true, configurable: true, enumerable: false });
    } catch (error) {
      console.warn('Could not scan Final DSR source PDF:', error);
    }
  }
  return scan;
}

async function refreshFinalDsrAutoScan(reportId) {
  const report = (window.activeReport && window.activeReport.id === reportId) ? window.activeReport : loadLocalReports().find(r => r.id === reportId);
  if (!report) return;
  try {
    await hydrateFinalDsrSource(report, true);
    applyFinalDsrAutomation(report);
    upsertLocalReport(report);
    await saveReportToServer(report);
    renderCustomReportGenerator(document.getElementById('repl-editor-container'), report);
    toast(`Final DSR scan complete: ${report.inheritanceScan?.sourceDocumentCount || 0} uploaded documents found.`, 'success');
  } catch (error) {
    toast(`Final DSR scan failed: ${error.message}`, 'error');
  }
}

async function previewFinalDsrDocument(reportId, documentId) {
  const report = (window.activeReport && window.activeReport.id === reportId) ? window.activeReport : loadLocalReports().find(r => r.id === reportId);
  const descriptor = report?.inheritanceScan?.sourceDocuments?.find(item => item.id === documentId);
  if (!report || !descriptor) return;
  try {
    if (descriptor.fileUrl) {
      window.open(resolveReplenishmentFileUrl(descriptor.fileUrl), '_blank', 'noopener,noreferrer');
      return;
    }
    const state = await hydrateFinalDsrSource(report);
    const value = getValueAtPath(state, descriptor.path);
    const textValue = descriptor.textPath ? getValueAtPath(state, descriptor.textPath) : (typeof value === 'string' && !/^data:/i.test(value) ? value : '');
    const pages = Array.isArray(value) ? value : [];
    const pageHtml = pages.map((src, index) => `<figure style="margin:0 0 16px"><img src="${src}" alt="${escapeHtml(descriptor.title)} page ${index + 1}" style="max-width:100%;display:block;margin:auto"><figcaption style="font:12px Arial;color:#64748b;text-align:center">Page ${index + 1}</figcaption></figure>`).join('');
    const overlay = document.createElement('div');
    overlay.id = 'repl-source-preview-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.72);z-index:100000;display:flex;align-items:center;justify-content:center;padding:24px';
    overlay.innerHTML = `<div style="width:min(1000px,96vw);height:92vh;background:#fff;border-radius:12px;display:flex;flex-direction:column;overflow:hidden"><header style="padding:12px 16px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center"><div><strong>${escapeHtml(descriptor.title)}</strong><div style="font-size:11px;color:#64748b">${escapeHtml(descriptor.kind)} · Final DSR</div></div><button type="button" style="border:0;background:#f1f5f9;border-radius:6px;padding:7px 12px;cursor:pointer" onclick="this.closest('#repl-source-preview-overlay').remove()">Close</button></header><main style="flex:1;overflow:auto;padding:20px;background:#f8fafc">${pageHtml || `<article style="background:#fff;padding:24px;white-space:pre-wrap;font:14px/1.65 Arial;color:#334155">${escapeHtml(textValue || JSON.stringify(value, null, 2))}</article>`}</main></div>`;
    overlay.addEventListener('click', event => { if (event.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  } catch (error) {
    toast(`Preview failed: ${error.message}`, 'error');
  }
}

function renderFinalDsrUploadInventory(report) {
  const scan = report.inheritanceScan || {};
  const documents = Array.isArray(scan.sourceDocuments) ? scan.sourceDocuments : [];
  return `<section style="border:1px solid #dbe3ee;border-radius:12px;background:#fff;padding:14px;box-shadow:0 4px 14px rgba(15,23,42,.06)">
    <div style="display:flex;justify-content:space-between;gap:12px;align-items:center"><div><strong style="font-size:13px;color:#1e3a8a">Final DSR Auto-scanned Uploads</strong><div style="font-size:11px;color:#475569;margin-top:3px">${documents.length} documents · ${scan.sourcePageCount || 0} uploaded pages. These are included in live preview and PDF.</div></div><button type="button" onclick="window.refreshFinalDsrAutoScan('${report.id}')" style="border:1px solid #93c5fd;background:#fff;color:#1d4ed8;border-radius:6px;padding:6px 9px;font-size:11px;font-weight:800;cursor:pointer">Scan Again</button></div>
    <div style="display:flex;gap:7px;overflow-x:auto;margin-top:9px;padding-bottom:2px">${documents.length ? documents.map(item => `<button type="button" onclick="window.previewFinalDsrDocument('${report.id}','${item.id}')" style="white-space:nowrap;border:1px solid #bfdbfe;background:#fff;color:#1e40af;border-radius:999px;padding:5px 9px;font-size:10.5px;cursor:pointer">Preview ${escapeHtml(item.title)}${item.pageCount ? ` (${item.pageCount}p)` : ''}</button>`).join('') : '<span style="font-size:11px;color:#64748b">No uploaded Final DSR documents detected. You can add replacement data below.</span>'}</div>
  </section>`;
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
  const scanInputId = `${inputId}-scan`;

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
          <button type="button" onclick="document.getElementById('${scanInputId}').click()" style="border:1px solid #bfdbfe; background:#fff; color:#1d4ed8; border-radius:6px; padding:5px 8px; font-size:11px; font-weight:800; cursor:pointer;">Scan</button>
          <input type="file" id="${inputId}" accept="${item.accepted}" style="display:none;" onchange="window.handleReplenishmentRequirementUpload(this, '${report.id}', '${key}')">
          <input type="file" id="${scanInputId}" accept="image/*" capture="environment" style="display:none;" onchange="window.handleReplenishmentRequirementUpload(this, '${report.id}', '${key}')">
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
          <button type="button" onclick="document.getElementById('${scanInputId}').click()" style="border:1px solid #bfdbfe; background:#fff; color:#1d4ed8; border-radius:6px; padding:5px 8px; font-size:11px; font-weight:800; cursor:pointer;">Scan</button>
          <button type="button" onclick="window.deleteReplenishmentRequirementUpload('${report.id}', '${actionKey}')" style="border:1px solid #fecaca; background:#fff; color:#b91c1c; border-radius:6px; padding:5px 8px; font-size:11px; font-weight:800; cursor:pointer;">Delete</button>
          <input type="file" id="${inputId}" accept="${item.accepted}" style="display:none;" onchange="window.handleReplenishmentRequirementUpload(this, '${report.id}', '${key}')">
          <input type="file" id="${scanInputId}" accept="image/*" capture="environment" style="display:none;" onchange="window.handleReplenishmentRequirementUpload(this, '${report.id}', '${key}')">
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
        <button type="button" onclick="document.getElementById('${scanInputId}').click()" style="border:1px solid #fdba74; background:#fff; color:#c2410c; border-radius:6px; padding:5px 8px; font-size:11px; font-weight:800; cursor:pointer;">Scan</button>
        <input type="file" id="${inputId}" accept="${item.accepted}" style="display:none;" onchange="window.handleReplenishmentRequirementUpload(this, '${report.id}', '${key}')">
        <input type="file" id="${scanInputId}" accept="image/*" capture="environment" style="display:none;" onchange="window.handleReplenishmentRequirementUpload(this, '${report.id}', '${key}')">
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

function replReadFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

function replRenderPdfPages(file) {
  return new Promise((resolve) => {
    if (!file || file.type !== 'application/pdf' || typeof renderPdfToImages !== 'function') {
      resolve([]);
      return;
    }
    renderPdfToImages(file, (error, pages) => resolve(error || !Array.isArray(pages) ? [] : pages));
  });
}

async function replBuildUploadedFile(file, reportId = '', requirementId = 'builder-upload') {
  let stored = null;
  if (reportId) {
    try {
      stored = await uploadReplenishmentFileToServer(file, reportId, requirementId);
    } catch (error) {
      console.warn('Could not persist builder upload; keeping a local report copy:', error);
    }
  }
  const record = {
    name: file.name,
    type: file.type,
    url: stored?.url || stored?.file?.url || '',
    downloadUrl: stored?.downloadUrl || stored?.file?.downloadUrl || '',
    dataUrl: stored ? (file.type.startsWith('image/') ? resolveReplenishmentFileUrl(stored.url || stored.file?.url || '') : '') : await replReadFileAsDataUrl(file),
    extractedText: await extractReplenishmentPdfText(file),
    extractedHtml: await extractReplenishmentDocxHtml(file),
    scanStatus: file.type === 'application/pdf' ? 'Scanned for merged output' : 'Ready for merged output',
    sequence: Date.now()
  };
  const pages = await replRenderPdfPages(file);
  Object.defineProperty(record, 'pages', { value: pages, writable: true, configurable: true, enumerable: false });
  return record;
}

async function hydrateEnterprisePdfPages(report) {
  if (!report || !hasEnterpriseBuilderContent(report)) return report;
  const builder = ensureEnterpriseBuilder(report);
  const records = [
    ...Object.values(builder.coverAssets || {}),
    ...builder.certificates.flatMap(item => item.files || []),
    ...builder.introSubsections.flatMap(item => item.files || []),
    ...builder.annexures.flatMap(item => item.files || [])
  ].filter(file => file?.type === 'application/pdf' && (file.dataUrl || file.url) && !file.pages?.length);
  if (!records.length) return report;
  for (const record of records) {
    try {
      const blob = await fetch(resolveReplenishmentFileUrl(record.url || record.dataUrl), { credentials: 'same-origin' }).then(response => {
        if (!response.ok) throw new Error(`Upload fetch failed (${response.status})`);
        return response.blob();
      });
      const file = new File([blob], record.name || 'document.pdf', { type: 'application/pdf' });
      const pages = await replRenderPdfPages(file);
      Object.defineProperty(record, 'pages', { value: pages, writable: true, configurable: true, enumerable: false });
    } catch (error) {
      console.warn('Could not prepare saved Replenishment PDF pages:', error);
    }
  }
  upsertLocalReport(report);
  await saveReportToServer(report);
  return report;
}

function renderReplUploadedFileContent(file, fallbackLabel = 'Uploaded document') {
  if (Array.isArray(file?.pages) && file.pages.length) {
    return file.pages.map((page, index) => `<figure style="margin:0 0 12px;page-break-inside:avoid"><img src="${page}" style="max-width:100%;max-height:880px;object-fit:contain;display:block;margin:0 auto"><figcaption style="font-size:10px;color:#64748b;text-align:center">${escapeHtml(file.name || fallbackLabel)} - Page ${index + 1}</figcaption></figure>`).join('');
  }
  if ((file?.dataUrl || file?.url) && file.type?.startsWith('image/')) {
    return `<figure style="margin:8px auto;page-break-inside:avoid"><img src="${resolveReplenishmentFileUrl(file.dataUrl || file.url)}" style="max-width:100%;max-height:880px;object-fit:contain;display:block;margin:0 auto"><figcaption style="font-size:10px;color:#64748b;text-align:center">${escapeHtml(file.name || fallbackLabel)}</figcaption></figure>`;
  }
  if (file?.extractedHtml) {
    return `<article style="font-size:13px;line-height:1.6;color:#334155">${file.extractedHtml}</article>`;
  }
  if (file?.extractedText) {
    return `<p style="white-space:pre-wrap;font-size:12px;line-height:1.6;color:#334155">${escapeHtml(file.extractedText)}</p>`;
  }
  return `<p style="font-size:12px;color:#334155">${escapeHtml(fallbackLabel)}: ${escapeHtml(file?.name || 'Document')}</p>`;
}

function replEscapeAttr(value) {
  return String(value || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function saveEnterpriseBuilder(reportId, render = false) {
  const report = (window.activeReport && window.activeReport.id === reportId) ? window.activeReport : loadLocalReports().find(r => r.id === reportId);
  if (!report) return;
  ensureEnterpriseBuilder(report);
  upsertLocalReport(report);
  await saveReportToServer(report);
  if (render) {
    const editorContainer = document.getElementById('repl-editor-container');
    if (editorContainer) renderCustomReportGenerator(editorContainer, report);
  } else {
    updateCustomReportPreview(report.name || 'Replenishment Report', report.id);
  }
}

async function updateReplReportMeta(reportId, field, value) {
  const report = (window.activeReport && window.activeReport.id === reportId) ? window.activeReport : loadLocalReports().find(r => r.id === reportId);
  if (!report) return;
  const builder = ensureEnterpriseBuilder(report);
  builder.reportMeta[field] = String(value || '').trim();
  if (field === 'bulkDensity' || field === 'mineableReserve' || field === 'river' || field === 'block') {
    calculateReplModuleRows(builder, 'rl-grid-tables');
  }
  builder.autoFill.fields = (builder.autoFill.fields || []).filter(item => item !== field);
  if (!builder.manualOverrides.includes(field)) builder.manualOverrides.push(field);
  await saveEnterpriseBuilder(reportId);
}

async function handleReplBuilderAssetUpload(input, reportId, key) {
  const file = input.files && input.files[0];
  if (!file) return;
  const report = (window.activeReport && window.activeReport.id === reportId) ? window.activeReport : loadLocalReports().find(r => r.id === reportId);
  if (!report) return;
  const builder = ensureEnterpriseBuilder(report);
  builder.coverAssets[key] = await replBuildUploadedFile(file, reportId, `cover-${key}`);
  await saveEnterpriseBuilder(reportId, true);
}

async function addReplCertificate(reportId) {
  const report = (window.activeReport && window.activeReport.id === reportId) ? window.activeReport : loadLocalReports().find(r => r.id === reportId);
  if (!report) return;
  ensureEnterpriseBuilder(report).certificates.push({ id: `cert-${Date.now()}`, title: 'Environmental Clearance', number: '', issuedBy: '', issueDate: '', expiryDate: '', remarks: '', files: [] });
  await saveEnterpriseBuilder(reportId, true);
}

async function updateReplCertificate(reportId, certId, field, value) {
  const report = (window.activeReport && window.activeReport.id === reportId) ? window.activeReport : loadLocalReports().find(r => r.id === reportId);
  const cert = report && ensureEnterpriseBuilder(report).certificates.find(item => item.id === certId);
  if (!cert) return;
  cert[field] = value;
  await saveEnterpriseBuilder(reportId);
}

async function uploadReplCertificateFile(input, reportId, certId) {
  const file = input.files && input.files[0];
  const report = (window.activeReport && window.activeReport.id === reportId) ? window.activeReport : loadLocalReports().find(r => r.id === reportId);
  const cert = report && ensureEnterpriseBuilder(report).certificates.find(item => item.id === certId);
  if (!file || !cert) return;
  cert.files = [await replBuildUploadedFile(file, reportId, `certificate-${certId}`)];
  await saveEnterpriseBuilder(reportId, true);
}

async function deleteReplBuilderItem(reportId, collection, itemId) {
  const report = (window.activeReport && window.activeReport.id === reportId) ? window.activeReport : loadLocalReports().find(r => r.id === reportId);
  if (!report) return;
  const builder = ensureEnterpriseBuilder(report);
  if (collection === 'certificates') builder.certificates = builder.certificates.filter(item => item.id !== itemId);
  if (collection === 'annexures') builder.annexures = builder.annexures.filter(item => item.id !== itemId);
  await saveEnterpriseBuilder(reportId, true);
}

async function updateReplIntro(reportId, sectionId, field, value) {
  const report = (window.activeReport && window.activeReport.id === reportId) ? window.activeReport : loadLocalReports().find(r => r.id === reportId);
  const section = report && ensureEnterpriseBuilder(report).introSubsections.find(item => item.id === sectionId);
  if (!section) return;
  section[field] = field === 'enabled' ? Boolean(value) : value;
  if (field === 'text') {
    const builder = ensureEnterpriseBuilder(report);
    builder.autoFill.fields = (builder.autoFill.fields || []).filter(item => item !== sectionId);
    if (!builder.manualOverrides.includes(sectionId)) builder.manualOverrides.push(sectionId);
  }
  await saveEnterpriseBuilder(reportId);
}

async function uploadReplIntroFile(input, reportId, sectionId) {
  const file = input.files && input.files[0];
  const report = (window.activeReport && window.activeReport.id === reportId) ? window.activeReport : loadLocalReports().find(r => r.id === reportId);
  const section = report && ensureEnterpriseBuilder(report).introSubsections.find(item => item.id === sectionId);
  if (!file || !section) return;
  section.files = [await replBuildUploadedFile(file, reportId, `intro-${sectionId}`)];
  await saveEnterpriseBuilder(reportId, true);
}

function downloadReplExcelTemplate(moduleId) {
  const module = REPLENISHMENT_EXCEL_MODULES.find(([id]) => id === moduleId);
  if (!module) return;
  const csv = `${module[2].join(',')}\n`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `${moduleId}-template.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function replNumber(value) {
  const number = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(number) ? number : 0;
}

function calculateReplModuleRows(builder, moduleId) {
  const module = builder.excelModules[moduleId];
  if (!module) return;
  if (moduleId === 'rl-grid-tables') {
    module.rows.forEach(row => {
      const pre = replNumber(row['Pre Monsoon RL (m)']);
      const post = replNumber(row['Post Monsoon RL (m)']);
      const area = replNumber(row['Grid Area (sqm)']);
      const difference = Math.max(0, post - pre);
      row['Elevation Difference (m)'] = difference ? difference.toFixed(3) : '';
      row['Deposited Volume (cum)'] = difference && area ? (difference * area).toFixed(3) : '';
    });
    const totalVolume = module.rows.reduce((sum, row) => sum + replNumber(row['Deposited Volume (cum)']), 0);
    const calculation = builder.excelModules['replenishment-calculation'];
    if (calculation && totalVolume > 0) {
      const density = replNumber(builder.reportMeta.bulkDensity) || 1.8;
      const reserve = replNumber(builder.reportMeta.mineableReserve);
      const row = calculation.rows[0] || {};
      row['Reach'] = row['Reach'] || builder.reportMeta.river || builder.reportMeta.block || 'Lease Area';
      row['Mineable Reserve (MT)'] = reserve || '';
      row['Replenished Volume (cum)'] = totalVolume.toFixed(3);
      row['Bulk Density (MT/cum)'] = density.toFixed(2);
      row['Replenished Quantity (MT)'] = (totalVolume * density).toFixed(3);
      row['Replenishment (%)'] = reserve ? ((totalVolume * density / reserve) * 100).toFixed(2) : '';
      calculation.rows = [row];
    }
  }
}

async function addReplTableRow(reportId, moduleId) {
  const report = (window.activeReport && window.activeReport.id === reportId) ? window.activeReport : loadLocalReports().find(r => r.id === reportId);
  if (!report) return;
  const builder = ensureEnterpriseBuilder(report);
  const module = builder.excelModules[moduleId];
  if (!module) return;
  module.rows.push(Object.fromEntries(module.columns.map(column => [column, ''])));
  await saveEnterpriseBuilder(reportId, true);
}

async function updateReplTableCell(reportId, moduleId, rowIndex, column, value) {
  const report = (window.activeReport && window.activeReport.id === reportId) ? window.activeReport : loadLocalReports().find(r => r.id === reportId);
  if (!report) return;
  const builder = ensureEnterpriseBuilder(report);
  const module = builder.excelModules[moduleId];
  if (!module || !module.rows[rowIndex]) return;
  module.rows[rowIndex][column] = value;
  calculateReplModuleRows(builder, moduleId);
  await saveEnterpriseBuilder(reportId, moduleId === 'rl-grid-tables');
}

async function deleteReplTableRow(reportId, moduleId, rowIndex) {
  const report = (window.activeReport && window.activeReport.id === reportId) ? window.activeReport : loadLocalReports().find(r => r.id === reportId);
  if (!report) return;
  const builder = ensureEnterpriseBuilder(report);
  const module = builder.excelModules[moduleId];
  if (!module) return;
  module.rows.splice(rowIndex, 1);
  calculateReplModuleRows(builder, moduleId);
  await saveEnterpriseBuilder(reportId, true);
}

async function uploadReplExcelModule(input, reportId, moduleId) {
  const file = input.files && input.files[0];
  const report = (window.activeReport && window.activeReport.id === reportId) ? window.activeReport : loadLocalReports().find(r => r.id === reportId);
  const module = report && ensureEnterpriseBuilder(report).excelModules[moduleId];
  if (!file || !module) return;
  module.files = [{ name: file.name, type: file.type, dataUrl: await replReadFileAsDataUrl(file) }];
  module.rows = [];
  try {
    if (typeof ensurePortalVendors === 'function') await ensurePortalVendors(['xlsx']);
    if (window.XLSX && /\.(xlsx|xls|csv)$/i.test(file.name)) {
      const bytes = await file.arrayBuffer();
      const workbook = window.XLSX.read(bytes, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      module.rows = window.XLSX.utils.sheet_to_json(sheet, { defval: '' });
      calculateReplModuleRows(ensureEnterpriseBuilder(report), moduleId);
    }
  } catch (error) {
    console.warn('Could not parse uploaded Excel file for preview:', error);
  }
  await saveEnterpriseBuilder(reportId, true);
}

async function addReplAnnexure(reportId) {
  const report = (window.activeReport && window.activeReport.id === reportId) ? window.activeReport : loadLocalReports().find(r => r.id === reportId);
  if (!report) return;
  ensureEnterpriseBuilder(report).annexures.push({ id: `annx-${Date.now()}`, title: 'New Annexure', description: '', files: [] });
  await saveEnterpriseBuilder(reportId, true);
}

async function updateReplAnnexure(reportId, annexureId, field, value) {
  const report = (window.activeReport && window.activeReport.id === reportId) ? window.activeReport : loadLocalReports().find(r => r.id === reportId);
  const annexure = report && ensureEnterpriseBuilder(report).annexures.find(item => item.id === annexureId);
  if (!annexure) return;
  annexure[field] = value;
  await saveEnterpriseBuilder(reportId);
}

async function uploadReplAnnexureFile(input, reportId, annexureId) {
  const file = input.files && input.files[0];
  const report = (window.activeReport && window.activeReport.id === reportId) ? window.activeReport : loadLocalReports().find(r => r.id === reportId);
  const annexure = report && ensureEnterpriseBuilder(report).annexures.find(item => item.id === annexureId);
  if (!file || !annexure) return;
  annexure.files = [await replBuildUploadedFile(file, reportId, `annexure-${annexureId}`)];
  await saveEnterpriseBuilder(reportId, true);
}

function renderEnterpriseBuilderPanel(report) {
  const builder = ensureEnterpriseBuilder(report);
  const rid = replEscapeAttr(report.id);
  const assetDone = Object.values(builder.coverAssets).filter(Boolean).length;
  const introDone = builder.introSubsections.filter(item => item.enabled && (item.text || item.files?.length)).length;
  const tableDone = Object.values(builder.excelModules).filter(module => module.files?.length || module.rows?.length).length;
  const metaHtml = REPLENISHMENT_REPORT_META_FIELDS.map(([key, label, placeholder]) => {
    const inherited = (builder.autoFill?.fields || []).includes(key);
    return `<label class="repl-builder-meta"><span>${label}${inherited ? '<em>DSR</em>' : ''}</span><input value="${replEscapeAttr(builder.reportMeta[key])}" placeholder="${replEscapeAttr(placeholder)}" onchange="window.updateReplReportMeta('${rid}','${key}',this.value)"></label>`;
  }).join('');
  const assetHtml = REPLENISHMENT_COVER_ASSETS.map(([key, label]) => {
    const asset = builder.coverAssets[key];
    return `<div class="repl-builder-tile"><div><strong>${label}</strong><span>${asset ? replEscapeAttr(asset.name) : 'Optional upload / camera scan'}</span></div><button type="button" onclick="document.getElementById('repl-asset-${key}').click()">Upload</button><button type="button" onclick="document.getElementById('repl-asset-scan-${key}').click()">Scan</button><input id="repl-asset-${key}" type="file" accept="image/*,application/pdf" style="display:none" onchange="window.handleReplBuilderAssetUpload(this, '${rid}', '${key}')"><input id="repl-asset-scan-${key}" type="file" accept="image/*" capture="environment" style="display:none" onchange="window.handleReplBuilderAssetUpload(this, '${rid}', '${key}')"></div>`;
  }).join('');
  const certHtml = builder.certificates.map(cert => `<div class="repl-builder-row"><input value="${replEscapeAttr(cert.title)}" onchange="window.updateReplCertificate('${rid}','${cert.id}','title',this.value)" placeholder="Certificate Title"><input value="${replEscapeAttr(cert.number)}" onchange="window.updateReplCertificate('${rid}','${cert.id}','number',this.value)" placeholder="Certificate No."><input value="${replEscapeAttr(cert.issuedBy)}" onchange="window.updateReplCertificate('${rid}','${cert.id}','issuedBy',this.value)" placeholder="Issued By"><input type="date" value="${replEscapeAttr(cert.issueDate)}" onchange="window.updateReplCertificate('${rid}','${cert.id}','issueDate',this.value)"><button type="button" onclick="document.getElementById('repl-cert-${cert.id}').click()">${cert.files?.length ? 'Replace' : 'Upload'}</button><button type="button" onclick="document.getElementById('repl-cert-scan-${cert.id}').click()">Scan</button><button type="button" onclick="window.deleteReplBuilderItem('${rid}','certificates','${cert.id}')">Delete</button><input id="repl-cert-${cert.id}" type="file" accept="application/pdf,image/*" style="display:none" onchange="window.uploadReplCertificateFile(this, '${rid}', '${cert.id}')"><input id="repl-cert-scan-${cert.id}" type="file" accept="image/*" capture="environment" style="display:none" onchange="window.uploadReplCertificateFile(this, '${rid}', '${cert.id}')"></div>`).join('');
  const introHtml = builder.introSubsections.map(section => `<details class="repl-builder-detail"><summary><label><input type="checkbox" ${section.enabled ? 'checked' : ''} onchange="window.updateReplIntro('${rid}','${section.id}','enabled',this.checked)"> ${section.title}</label><span>${section.files?.length ? 'Uploaded' : (section.text ? ((builder.autoFill?.fields || []).includes(section.id) ? 'DSR Auto-filled' : 'Text') : 'Pending')}</span></summary><textarea onchange="window.updateReplIntro('${rid}','${section.id}','text',this.value)" placeholder="Write content for ${replEscapeAttr(section.title)}">${replEscapeAttr(section.text)}</textarea><div class="repl-builder-actions"><button type="button" onclick="document.getElementById('repl-intro-${section.id}').click()">${section.files?.length ? 'Replace File' : 'Upload File'}</button><button type="button" onclick="document.getElementById('repl-intro-scan-${section.id}').click()">Scan Page</button></div><input id="repl-intro-${section.id}" type="file" accept=".pdf,.doc,.docx,image/*" style="display:none" onchange="window.uploadReplIntroFile(this, '${rid}', '${section.id}')"><input id="repl-intro-scan-${section.id}" type="file" accept="image/*" capture="environment" style="display:none" onchange="window.uploadReplIntroFile(this, '${rid}', '${section.id}')"></details>`).join('');
  const excelHtml = Object.values(builder.excelModules).map(module => {
    const header = module.columns.map(column => `<th>${escapeHtml(column)}</th>`).join('');
    const rows = (module.rows || []).map((row, rowIndex) => `<tr>${module.columns.map(column => `<td><input value="${replEscapeAttr(row[column])}" ${/Difference|Deposited Volume|Replenished Quantity|Replenishment \(%\)/.test(column) ? 'readonly' : ''} onchange="window.updateReplTableCell('${rid}','${module.id}',${rowIndex},'${replEscapeAttr(column)}',this.value)"></td>`).join('')}<td><button type="button" class="repl-row-delete" onclick="window.deleteReplTableRow('${rid}','${module.id}',${rowIndex})">Delete</button></td></tr>`).join('');
    return `<details class="repl-table-editor"><summary><strong>${module.title}</strong><span>${module.rows?.length || 0} rows${module.files?.length ? ` - ${replEscapeAttr(module.files[0].name)}` : ''}</span></summary><div class="repl-table-toolbar"><button type="button" onclick="window.addReplTableRow('${rid}','${module.id}')">+ Add row</button><button type="button" onclick="window.downloadReplExcelTemplate('${module.id}')">Download template</button><button type="button" onclick="document.getElementById('repl-table-${module.id}').click()">${module.files?.length ? 'Replace Excel' : 'Import Excel / CSV'}</button><input id="repl-table-${module.id}" type="file" accept=".xlsx,.xls,.csv" style="display:none" onchange="window.uploadReplExcelModule(this, '${rid}', '${module.id}')"></div><div class="repl-table-scroll"><table><thead><tr>${header}<th>Action</th></tr></thead><tbody>${rows || `<tr><td colspan="${module.columns.length + 1}" class="repl-empty-row">Add rows here or import the official template.</td></tr>`}</tbody></table></div></details>`;
  }).join('');
  const annexureHtml = builder.annexures.map(item => `<div class="repl-builder-row"><input value="${replEscapeAttr(item.title)}" onchange="window.updateReplAnnexure('${rid}','${item.id}','title',this.value)" placeholder="Annexure Title"><input value="${replEscapeAttr(item.description)}" onchange="window.updateReplAnnexure('${rid}','${item.id}','description',this.value)" placeholder="Description"><button type="button" onclick="document.getElementById('repl-annex-${item.id}').click()">${item.files?.length ? 'Replace' : 'Upload'}</button><button type="button" onclick="document.getElementById('repl-annex-scan-${item.id}').click()">Scan</button><button type="button" onclick="window.deleteReplBuilderItem('${rid}','annexures','${item.id}')">Delete</button><input id="repl-annex-${item.id}" type="file" accept=".pdf,.doc,.docx,.xlsx,.xls,.csv,image/*" style="display:none" onchange="window.uploadReplAnnexureFile(this, '${rid}', '${item.id}')"><input id="repl-annex-scan-${item.id}" type="file" accept="image/*" capture="environment" style="display:none" onchange="window.uploadReplAnnexureFile(this, '${rid}', '${item.id}')"></div>`).join('');
  const copyMatrixHtml = REPLENISHMENT_DSR_COPY_MATRIX.map(item => {
    const isUpload = item.mode === 'UPLOAD REQUIRED' || item.mode === 'NEW / UPLOAD';
    return `<div class="repl-copy-row"><div><strong>${escapeHtml(item.target)}</strong><span>${escapeHtml(item.source)}</span></div><b class="${isUpload ? 'repl-copy-upload' : 'repl-copy-ready'}">${escapeHtml(item.mode)}</b><p>${escapeHtml(item.note)}</p></div>`;
  }).join('');
  return `
    <style>
      .repl-builder-band{border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;background:#f8fafc;padding:14px 20px}
      .repl-builder-tabs{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:10px;max-height:520px;overflow:auto}
      .repl-builder-module{background:#fff;border:1px solid #cbd5e1;border-radius:10px;overflow:hidden}
      .repl-builder-module>summary{list-style:none;cursor:pointer;padding:12px;display:flex;align-items:center;justify-content:space-between;gap:10px;color:#0f172a;font-size:13px;font-weight:900}
      .repl-builder-module>summary::-webkit-details-marker{display:none}
      .repl-builder-module>summary:before{content:'›';color:#64748b;font-size:20px;line-height:1;transition:transform .15s ease}
      .repl-builder-module[open]>summary:before{transform:rotate(90deg)}
      .repl-builder-module>summary span{margin-left:auto;font-size:10.5px;color:#1d4ed8;background:#eff6ff;border:1px solid #bfdbfe;border-radius:999px;padding:3px 8px;white-space:nowrap}
      .repl-builder-module-body{border-top:1px solid #e2e8f0;background:#f8fafc;padding:10px;max-height:330px;overflow:auto}
      .repl-builder-tile,.repl-builder-row{display:grid;grid-template-columns:1fr auto auto;gap:8px;align-items:center;border:1px solid #e5e7eb;border-radius:6px;padding:8px;margin-bottom:7px;background:#fff}
      .repl-builder-row{grid-template-columns:repeat(auto-fit,minmax(120px,1fr));}
      .repl-builder-tile span{display:block;font-size:11px;color:#64748b;margin-top:2px}
      .repl-builder-module button{border:1px solid #bfdbfe;background:#eff6ff;color:#1d4ed8;border-radius:5px;padding:5px 8px;font-size:11px;font-weight:800;cursor:pointer}
      .repl-builder-row input,.repl-builder-detail textarea{border:1px solid #cbd5e1;border-radius:5px;padding:7px;font-size:12px;width:100%;box-sizing:border-box}
      .repl-builder-meta-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      .repl-builder-meta{display:flex;flex-direction:column;gap:4px;font-size:11px;font-weight:800;color:#334155}
      .repl-builder-meta span{display:flex;align-items:center;gap:5px}.repl-builder-meta em{font-style:normal;font-size:9px;color:#047857;background:#ecfdf5;border-radius:999px;padding:2px 5px}
      .repl-builder-meta input{border:1px solid #cbd5e1;border-radius:5px;padding:7px;font-size:12px;width:100%;box-sizing:border-box}
      .repl-builder-actions{display:flex;gap:6px;margin-top:7px}
      .repl-builder-detail{border:1px solid #e5e7eb;border-radius:6px;padding:8px;margin-bottom:7px;background:#fff}
      .repl-builder-detail summary{font-size:12px;font-weight:800;color:#1e293b;cursor:pointer;display:flex;justify-content:space-between;gap:10px}
      .repl-builder-detail textarea{margin-top:8px;min-height:70px;resize:vertical}
      .repl-table-editor{border:1px solid #cbd5e1;border-radius:8px;background:#fff;margin-bottom:8px;overflow:hidden}.repl-table-editor>summary{cursor:pointer;padding:10px 12px;display:flex;justify-content:space-between;gap:8px;color:#1e293b;font-size:12px}.repl-table-editor>summary span{color:#64748b;font-weight:600}.repl-table-toolbar{display:flex;gap:7px;padding:8px;background:#f8fafc;border-top:1px solid #e2e8f0}.repl-table-scroll{overflow:auto;max-height:300px}.repl-table-scroll table{border-collapse:collapse;min-width:100%;font-size:11px}.repl-table-scroll th{position:sticky;top:0;background:#17324d;color:#fff;text-align:left;padding:7px;white-space:nowrap;z-index:1}.repl-table-scroll td{border:1px solid #e2e8f0;padding:4px;background:#fff}.repl-table-scroll td input{min-width:125px;width:100%;border:1px solid #dbe3ed;border-radius:4px;padding:5px;box-sizing:border-box;font-size:11px}.repl-table-scroll td input[readonly]{background:#ecfdf5;color:#166534;font-weight:800}.repl-table-scroll .repl-row-delete{background:#fff1f2;color:#be123c;border-color:#fecdd3}.repl-empty-row{text-align:center!important;color:#64748b;padding:18px!important}
      .repl-status-strip{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}
      .repl-status-strip span{font-size:11px;border-radius:999px;padding:3px 8px;background:#ecfdf5;color:#047857;font-weight:800}
      .repl-copy-guide{margin-bottom:12px;border:1px solid #bfdbfe;border-radius:10px;background:#f8fbff;overflow:hidden}.repl-copy-guide summary{cursor:pointer;padding:11px 12px;color:#1e3a5f;font-size:12px;font-weight:900;list-style:none;display:flex;justify-content:space-between;gap:10px}.repl-copy-guide summary::-webkit-details-marker{display:none}.repl-copy-guide summary span{color:#475569;font-size:11px;font-weight:600}.repl-copy-rows{border-top:1px solid #dbeafe;background:#fff}.repl-copy-row{display:grid;grid-template-columns:minmax(170px,1fr) auto;gap:5px 12px;padding:9px 12px;border-bottom:1px solid #eff6ff}.repl-copy-row:last-child{border-bottom:0}.repl-copy-row strong,.repl-copy-row span{display:block}.repl-copy-row strong{font-size:11.5px;color:#1e293b}.repl-copy-row span,.repl-copy-row p{font-size:10.5px;color:#64748b;margin:2px 0 0;line-height:1.4}.repl-copy-row p{grid-column:1/-1}.repl-copy-row b{align-self:start;border-radius:999px;padding:3px 7px;font-size:9px;white-space:nowrap}.repl-copy-ready{background:#dcfce7;color:#166534}.repl-copy-upload{background:#fef3c7;color:#92400e}
    </style>
    <div class="repl-builder-band">
      <details class="repl-copy-guide" open><summary>Final DSR copy plan <span>Green: reusable · Amber: current evidence required</span></summary><div class="repl-copy-rows">${copyMatrixHtml}</div></details>
      <div class="repl-status-strip"><span>Cover Assets ${assetDone}/${REPLENISHMENT_COVER_ASSETS.length}</span><span>Certificates ${builder.certificates.length}</span><span>Intro ${introDone}/${builder.introSubsections.length}</span><span>Tables ${tableDone}/${Object.keys(builder.excelModules).length}</span><span>Annexures ${builder.annexures.length}</span></div>
      <div class="repl-builder-tabs">
        <details class="repl-builder-module" open><summary>Official Report Details <span>${builder.autoFill?.fields?.length || 0} DSR Auto-filled</span></summary><div class="repl-builder-module-body"><div class="repl-builder-meta-grid">${metaHtml}</div></div></details>
        <details class="repl-builder-module"><summary>Cover Page Assets <span>${assetDone}/${REPLENISHMENT_COVER_ASSETS.length} Added</span></summary><div class="repl-builder-module-body">${assetHtml}</div></details>
        <details class="repl-builder-module"><summary>Certificates <span>${builder.certificates.length} Added</span></summary><div class="repl-builder-module-body"><button type="button" onclick="window.addReplCertificate('${rid}')" style="margin-bottom:8px">Add Certificate</button>${certHtml || '<p style="font-size:12px;color:#64748b;">No certificates added yet.</p>'}</div></details>
        <details class="repl-builder-module"><summary>Introduction Subsections <span>${introDone}/${builder.introSubsections.length} Ready</span></summary><div class="repl-builder-module-body">${introHtml}</div></details>
        <details class="repl-builder-module"><summary>Excel Template Modules <span>${tableDone}/${Object.keys(builder.excelModules).length} Uploaded</span></summary><div class="repl-builder-module-body">${excelHtml}</div></details>
        <details class="repl-builder-module"><summary>Annexure Manager <span>${builder.annexures.length} Added</span></summary><div class="repl-builder-module-body"><button type="button" onclick="window.addReplAnnexure('${rid}')" style="margin-bottom:8px">Add Annexure</button>${annexureHtml || '<p style="font-size:12px;color:#64748b;">No annexures added yet.</p>'}</div></details>
      </div>
    </div>
  `;
}

// Retained only for historic data compatibility; it is no longer rendered.
function renderLegacyCustomReportGenerator(container, report) {
  ensureEnterpriseBuilder(report);
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
  container.innerHTML = `
    <div class="card" style="min-height:calc(100vh - 120px); display:flex; flex-direction:column; margin-top:15px;">
      <div class="card-hd" style="padding: 16px 20px;">
        <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
          <div>
            <div class="card-title" id="custom-report-title-display" style="font-size:16px; font-weight:800; color:#0f172a;">${reportName}</div>
            <div class="card-sub" style="font-size:12px; color:#64748b;">Official Replenishment Report Builder with auto-scan, live preview, and merged PDF / Word output</div>
          </div>
          <div style="display:flex; gap:10px;">
            <button class="btn btn-outline" onclick="window.showExistingReportsList()" style="cursor: pointer;">Back</button>
            <button class="btn btn-primary repl-download-files-btn" data-report-id="${report.id}" onclick="window.downloadCustomReportFilesDirect('${report.id}', this)" style="cursor: pointer;">Download PDF + Word</button>
          </div>
        </div>
      </div>
      <div class="card-bd" style="flex:1;display:grid;grid-template-columns:minmax(0,1fr) minmax(460px,1.05fr);gap:18px;padding:18px;background:#f8fafc;align-items:start;">
        <!-- LEFT COLUMN: report inputs in clean cards -->
        <div style="display:flex;flex-direction:column;gap:14px;min-width:0;">
          <div style="background:#fff;border:1px solid #dbe3ee;border-radius:12px;overflow:hidden;box-shadow:0 4px 14px rgba(15,23,42,.06)">
            ${renderEnterpriseBuilderPanel(report)}
          </div>
          ${renderFinalDsrUploadInventory(report)}
          ${renderInheritancePanel(report)}
        </div>

        <!-- RIGHT COLUMN: Preview -->
        <div style="display:flex;flex-direction:column;overflow:hidden;height:calc(100vh - 225px);min-height:560px;background:#f1f5f9;border-radius:12px;border:1px solid #cbd5e1;position:sticky;top:12px;box-shadow:0 4px 14px rgba(15,23,42,.08);">
          <div style="padding:10px 15px; background:#e2e8f0; border-bottom:1px solid #cbd5e1; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:700; font-size:12px; color:#334155;">Replenishment Report Preview</span>
            <span id="preview-sections-count" style="font-size:11px; background:#64748b; color:#fff; padding:2px 8px; border-radius:10px;">Live</span>
          </div>
          <div style="flex:1; padding:0; background:#fff; overflow:hidden;">
            <iframe id="custom-report-preview-iframe" style="width:100%; height:100%; border:none; background:#fff; display:block;" srcdoc="&lt;html&gt;&lt;body style='font-family:sans-serif; color:#64748b; padding:40px; text-align:center;'&gt;&lt;p&gt;Preparing live preview...&lt;/p&gt;&lt;/body&gt;&lt;/html&gt;"></iframe>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Render live preview on load
  updateCustomReportPreview(reportName, report.id);

  if (window.lucide) {
    window.lucide.createIcons();
  }

}

// New replenishment screen: DSR context is copied transparently and only current
// study evidence is requested from the user.
function renderCustomReportGenerator(container, report) {
  const builder = ensureEnterpriseBuilder(report);
  const escapedName = replEscapeAttr(report.name || 'Replenishment Report');
  const source = report.finalDsrSource?.title || 'No Final DSR linked';
  const inheritedCount = report.inheritanceScan?.inheritedCount || 0;
  const missingCount = report.inheritanceScan?.missingCount || 0;
  const completedMeta = REPLENISHMENT_REPORT_META_FIELDS.filter(([key]) => String(builder.reportMeta[key] || '').trim()).length;
  const completedTables = Object.values(builder.excelModules).filter(module => module.rows?.length || module.files?.length).length;
  const completedEvidence = builder.certificates.length + builder.annexures.length + Object.keys(builder.coverAssets || {}).length;
  const totalUnits = REPLENISHMENT_REPORT_META_FIELDS.length + Object.keys(builder.excelModules).length + 3;
  const completedUnits = completedMeta + completedTables + Math.min(3, completedEvidence);
  const completion = Math.min(100, Math.round((completedUnits / Math.max(1, totalUnits)) * 100));
  container.innerHTML = `
    <style>
      .repl-studio{min-height:calc(100vh - 112px);margin-top:12px;background:#f3f6fa;border:1px solid #dbe4ef;border-radius:18px;overflow:visible;color:#172033}
      .repl-studio-head{position:relative;overflow:hidden;padding:22px 24px;background:linear-gradient(125deg,#102f4c 0%,#173f63 62%,#21567d 100%);color:#fff;border-radius:18px 18px 0 0}
      .repl-studio-head:after{content:'';position:absolute;width:310px;height:310px;border-radius:50%;right:-105px;top:-190px;background:rgba(255,255,255,.08)}
      .repl-head-row{position:relative;z-index:1;display:flex;justify-content:space-between;align-items:center;gap:18px;flex-wrap:wrap}.repl-eyebrow{font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#9cc7e8;margin-bottom:6px}.repl-title{font-size:22px;font-weight:850;line-height:1.2}.repl-subtitle{font-size:12px;color:#c8d9e8;margin-top:6px}.repl-head-actions{display:flex;gap:8px;flex-wrap:wrap}.repl-head-actions button{min-height:38px;border-radius:9px;padding:0 13px;font-size:12px;font-weight:800;cursor:pointer}.repl-head-actions .repl-light-btn{border:1px solid rgba(255,255,255,.24);background:rgba(255,255,255,.1);color:#fff}.repl-head-actions .repl-gold-btn{border:1px solid #d9ad64;background:#c99a4e;color:#112b43;box-shadow:0 8px 20px rgba(0,0,0,.2)}
      .repl-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;padding:14px 18px;background:#e9eff6;border-bottom:1px solid #d8e1ec}.repl-stat{background:#fff;border:1px solid #dce5ef;border-radius:12px;padding:12px 14px;display:flex;align-items:center;gap:10px;min-width:0;box-shadow:0 2px 8px rgba(15,35,55,.04)}.repl-stat-icon{width:34px;height:34px;border-radius:9px;display:grid;place-items:center;background:#edf5fc;color:#18527e;flex:0 0 auto}.repl-stat-icon svg{width:17px;height:17px}.repl-stat b{display:block;font-size:17px;line-height:1;color:#183650}.repl-stat span{display:block;font-size:10px;color:#718096;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.repl-progress{height:5px;border-radius:99px;background:#e3eaf1;margin-top:7px;overflow:hidden}.repl-progress i{display:block;height:100%;background:linear-gradient(90deg,#1b6b98,#37a878);border-radius:99px}
      .repl-source-strip{margin:14px 18px 0;padding:11px 13px;background:#f0f8ff;border:1px solid #c9e2f6;border-radius:11px;display:flex;align-items:center;gap:9px;flex-wrap:wrap;font-size:11px;color:#264b68}.repl-source-strip svg{width:16px;height:16px;color:#2674a9}.repl-pill{border-radius:999px;padding:4px 8px;font-size:10px;font-weight:850}.repl-pill-good{background:#dcfce7;color:#166534}.repl-pill-warn{background:#fff0cc;color:#8a5510}
      .repl-studio-grid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(390px,.8fr);gap:16px;padding:16px 18px 20px;align-items:start}.repl-card-stack{min-width:0;display:flex;flex-direction:column;gap:14px}.repl-ui-card{background:#fff;border:1px solid #dce4ed;border-radius:14px;overflow:hidden;box-shadow:0 5px 18px rgba(22,44,65,.055)}.repl-ui-card-label{padding:12px 15px;border-bottom:1px solid #e8edf3;display:flex;align-items:center;justify-content:space-between;gap:12px;background:#fbfcfe}.repl-ui-card-label strong{font-size:12px;color:#1c3851}.repl-ui-card-label span{font-size:10px;color:#718096}.repl-card-dot{width:7px;height:7px;border-radius:50%;display:inline-block;background:#2a86b9;margin-right:7px}
      .repl-preview-shell{height:calc(100vh - 188px);min-height:610px;position:sticky;top:10px;display:flex;flex-direction:column;overflow:hidden;background:#d9e1e9;border:1px solid #c7d1dc;border-radius:14px;box-shadow:0 10px 28px rgba(20,42,61,.12)}.repl-preview-toolbar{padding:10px 12px;background:#fff;border-bottom:1px solid #d9e1e9;display:flex;align-items:center;justify-content:space-between;gap:10px}.repl-preview-name{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:850;color:#1c3851}.repl-live-dot{width:7px;height:7px;border-radius:50%;background:#22a06b;box-shadow:0 0 0 4px #dcfce7}.repl-preview-tools{display:flex;align-items:center;gap:6px}.repl-preview-tools button{width:30px;height:30px;display:grid;place-items:center;border:1px solid #dbe3eb;background:#f8fafc;color:#456175;border-radius:7px;cursor:pointer}.repl-preview-tools svg{width:14px;height:14px}.repl-preview-frame-wrap{flex:1;padding:12px;background:linear-gradient(145deg,#e5ebf0,#d2dbe4);overflow:hidden}.repl-preview-frame-wrap iframe{width:100%;height:100%;border:0;background:#fff;border-radius:5px;display:block;box-shadow:0 3px 14px rgba(24,43,59,.16)}
      @media(max-width:1180px){.repl-studio-grid{grid-template-columns:minmax(0,1fr) 390px}.repl-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:900px){.repl-studio-grid{grid-template-columns:1fr}.repl-preview-shell{position:relative;top:0;height:720px;min-height:520px}.repl-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:560px){.repl-studio{border-radius:0;margin:0 -12px}.repl-studio-head{border-radius:0;padding:18px 15px}.repl-title{font-size:18px}.repl-stats{grid-template-columns:1fr 1fr;padding:10px}.repl-stat{padding:10px}.repl-source-strip{margin:10px}.repl-studio-grid{padding:10px}.repl-preview-shell{height:600px}}
    </style>
    <div class="repl-studio">
      <header class="repl-studio-head">
        <div class="repl-head-row">
          <div><div class="repl-eyebrow">Replenishment Study Workspace</div><div id="custom-report-title-display" class="repl-title">${escapedName}</div><div class="repl-subtitle">Field data, survey calculations, evidence and final report - in one workspace</div></div>
          <div class="repl-head-actions"><button class="repl-light-btn" onclick="window.showExistingReportsList()">Back to reports</button><button class="repl-light-btn" onclick="window.updateCustomReportPreview(document.getElementById('custom-report-title-display').textContent, '${report.id}')">Refresh preview</button><button class="repl-gold-btn repl-download-files-btn" data-report-id="${report.id}" onclick="window.downloadCustomReportFilesDirect('${report.id}', this)">Generate final report</button></div>
        </div>
      </header>
      <section class="repl-stats">
        <div class="repl-stat"><div class="repl-stat-icon"><i data-lucide="circle-check-big"></i></div><div style="min-width:0;flex:1"><b>${completion}%</b><span>Overall completion</span><div class="repl-progress"><i style="width:${completion}%"></i></div></div></div>
        <div class="repl-stat"><div class="repl-stat-icon"><i data-lucide="clipboard-list"></i></div><div><b>${completedMeta}/${REPLENISHMENT_REPORT_META_FIELDS.length}</b><span>Report details completed</span></div></div>
        <div class="repl-stat"><div class="repl-stat-icon"><i data-lucide="table-2"></i></div><div><b>${completedTables}/${Object.keys(builder.excelModules).length}</b><span>Survey tables ready</span></div></div>
        <div class="repl-stat"><div class="repl-stat-icon"><i data-lucide="paperclip"></i></div><div><b>${completedEvidence}</b><span>Evidence items attached</span></div></div>
      </section>
      <div class="repl-source-strip"><i data-lucide="database-zap"></i><strong>Linked Final DSR:</strong><span>${replEscapeAttr(source)}</span><span class="repl-pill repl-pill-good">${inheritedCount} reusable</span><span class="repl-pill repl-pill-warn">${missingCount} need input</span></div>
      <main class="repl-studio-grid">
        <div class="repl-card-stack">
          <section class="repl-ui-card repl-upload-card-workspace"><div class="repl-ui-card-label"><strong><i class="repl-card-dot"></i>Replenishment data upload cards</strong><span>Imported / Uploaded / Pending</span></div>${renderInheritancePanel(report)}</section>
          <section class="repl-ui-card"><div class="repl-ui-card-label"><strong><i class="repl-card-dot"></i>Final DSR source files</strong><span>Auto-scanned documents</span></div>${renderFinalDsrUploadInventory(report)}</section>
        </div>
        <aside class="repl-preview-shell">
          <div class="repl-preview-toolbar"><div class="repl-preview-name"><i class="repl-live-dot"></i>Live A4 report preview <span id="preview-sections-count" class="repl-pill repl-pill-good">Live</span></div><div class="repl-preview-tools"><button title="Refresh preview" onclick="window.updateCustomReportPreview(document.getElementById('custom-report-title-display').textContent, '${report.id}')"><i data-lucide="refresh-cw"></i></button><button title="Generate final report" onclick="window.downloadCustomReportFilesDirect('${report.id}', this)"><i data-lucide="download"></i></button></div></div>
          <div class="repl-preview-frame-wrap"><iframe id="custom-report-preview-iframe" title="Replenishment report preview" srcdoc="&lt;html&gt;&lt;body style='font-family:Arial,sans-serif;color:#64748b;padding:40px;text-align:center;background:#f8fafc'&gt;Preparing live preview...&lt;/body&gt;&lt;/html&gt;"></iframe></div>
        </aside>
      </main>
    </div>`;
  updateCustomReportPreview(report.name || 'Replenishment Report', report.id);
  if (window.lucide) window.lucide.createIcons();
}

// Debouncer for rendering preview to fix lagging/freezing
let previewTimeout = null;
let previewRenderToken = 0;
const replenishmentPdfBlobCache = new Map();

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
  const previewReport = loadLocalReports().find(r => r.id === reportId);
  let checkedIds = getEffectiveReplenishmentSectionIds(previewReport);
  
  const indeterminateParents = Array.from(document.querySelectorAll('input[id^="chk-"]')).filter(c => c.indeterminate).map(c => c.value);
  const allActiveIds = [...checkedIds, ...indeterminateParents];
  
  const countEl = document.getElementById('preview-sections-count');
  if (countEl) {
    countEl.textContent = 'Live';
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
    if (report?.finalDsrSource?.id) await hydrateFinalDsrSource(report);
    await hydrateReplenishmentUploadContent(report);
    await hydrateEnterprisePdfPages(report);
    const blob = await generateReplenishmentPdfBlob(reportName, checkedIds, reportId, report);
    if (blob) {
      if (renderToken !== previewRenderToken) return;
      replenishmentPdfBlobCache.set(reportId, {
        blob,
        signature: getReplenishmentReportSignature(report, checkedIds)
      });
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

function buildOfficialReplenishmentReportHtml(report, reportName, fallbackYear) {
  const builder = ensureEnterpriseBuilder(report);
  const meta = builder.reportMeta || {};
  const safe = key => escapeHtml(meta[key] || '');
  const logos = ['companyLogo', 'governmentLogo'].map(key => builder.coverAssets?.[key]).filter(Boolean);
  const coverPhoto = builder.coverAssets?.projectPhoto || builder.coverAssets?.minePhoto || builder.coverAssets?.riverImage;
  const intro = builder.introSubsections.filter(section => section.enabled && (section.text || section.files?.length));
  const tables = Object.values(builder.excelModules).filter(module => module.files?.length || module.rows?.length);
  const toc = [...intro.map(section => section.title), ...tables.map(module => module.title), ...builder.annexures.map(item => item.title || 'Annexure')];
  let html = `<section class="official-cover section-block"><div class="official-cover-title">REPLENISHMENT STUDY REPORT</div><div class="official-cover-year">(YEAR ${safe('reportYear') || escapeHtml(fallbackYear)}) FOR</div><div class="official-cover-project">${safe('projectName') || escapeHtml(reportName)}</div>${coverPhoto ? `<div class="official-cover-photo">${renderReplUploadedFileContent(coverPhoto, 'Project photograph')}</div>` : ''}<div class="official-cover-location">${safe('mineral') || 'Sand (Minor Mineral)'} is located in District - ${safe('district')}<br>${safe('village') ? `Village ${safe('village')}, ` : ''}${safe('block') ? `${safe('block')} Block, ` : ''}${safe('river') ? `River ${safe('river')}` : ''}</div><div class="official-cover-applicant"><strong>APPLICANT</strong><br><span>${safe('applicant') || 'To be provided'}</span><br>${safe('applicantAddress')}</div><div class="official-cover-consultant"><strong>CONSULTANT</strong><br>${safe('consultant') || 'To be provided'}</div>${logos.length ? `<div class="official-cover-logos">${logos.map(asset => `<div>${renderReplUploadedFileContent(asset, 'Logo')}</div>`).join('')}</div>` : ''}</section>`;
  (builder.certificates || []).forEach((cert, index) => {
    html += `<section class="official-page section-block"><h2>${index + 1}. ${escapeHtml(cert.title || 'Certificate')}</h2><table><tr><th>Certificate No.</th><td>${escapeHtml(cert.number || '-')}</td><th>Issued By</th><td>${escapeHtml(cert.issuedBy || '-')}</td></tr><tr><th>Issue Date</th><td>${escapeHtml(cert.issueDate || '-')}</td><th>Remarks</th><td>${escapeHtml(cert.remarks || '-')}</td></tr></table>${(cert.files || []).map(file => renderReplUploadedFileContent(file, 'Certificate document')).join('')}</section>`;
  });
  html += `<section class="official-index section-block"><h2>INDEX</h2><table><thead><tr><th style="width:72px">Sr. No.</th><th>Particulars</th><th style="width:90px">Page No.</th></tr></thead><tbody>${toc.map((item, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(item)}</td><td>Auto</td></tr>`).join('')}</tbody></table></section>`;
  intro.forEach((section, index) => {
    html += `<section class="official-page section-block"><h2>${index + 1}.0 ${escapeHtml(section.title).toUpperCase()}</h2>${section.text ? `<p class="official-narrative">${escapeHtml(section.text)}</p>` : ''}${(section.files || []).map(file => renderReplUploadedFileContent(file, section.title)).join('')}</section>`;
  });
  tables.forEach(module => {
    const rows = Array.isArray(module.rows) ? module.rows : [];
    html += `<section class="official-page section-block"><h2>${escapeHtml(module.title).toUpperCase()}</h2>${rows.length ? `<table class="official-data-table"><thead><tr>${module.columns.map(col => `<th>${escapeHtml(col)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${module.columns.map(col => `<td>${escapeHtml(row[col] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody></table>` : `<p>Uploaded table file: ${escapeHtml(module.files?.[0]?.name || 'Template data')}</p>`}</section>`;
  });
  builder.annexures.forEach((annexure, index) => {
    html += `<section class="official-page section-block"><h2>ANNEXURE ${index + 1}: ${escapeHtml(annexure.title || 'UNTITLED ANNEXURE').toUpperCase()}</h2><p>${escapeHtml(annexure.description || '')}</p>${(annexure.files || []).map(file => renderReplUploadedFileContent(file, 'Annexure document')).join('')}</section>`;
  });
  (report.inheritanceScan?.sourceDocuments || []).filter(item => item.id !== 'generated-final-dsr' && Array.isArray(item.renderedPages) && item.renderedPages.length).forEach(item => {
    html += `<section class="official-page section-block"><h2>${escapeHtml(item.title).toUpperCase()}</h2><div class="official-source-note">Auto-copied from Final DSR</div>${item.renderedPages.map(page => `<img src="${page}" alt="${escapeHtml(item.title)}">`).join('')}</section>`;
  });
  return html;
}

function compileSelectedSectionsHtml(reportName, checkedIds, allActiveIds, reportId) {
  let activeEnterpriseReport = null;
  if (reportId) {
    const reports = loadLocalReports();
    const report = (window.activeReport && window.activeReport.id === reportId)
      ? window.activeReport
      : reports.find(r => r.id === reportId);
    activeEnterpriseReport = report || null;
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
  const useOfficialTemplate = Boolean(activeEnterpriseReport);
  if (useOfficialTemplate) combinedContent += buildOfficialReplenishmentReportHtml(activeEnterpriseReport, reportName, year);

  if (!useOfficialTemplate && activeEnterpriseReport?.inheritedSourceSnapshot && activeEnterpriseReport?.inheritanceScan?.sourceDocuments?.length) {
    const sourceState = activeEnterpriseReport.inheritedSourceSnapshot;
    const sourceParts = activeEnterpriseReport.inheritanceScan.sourceDocuments.map(item => {
      const value = getValueAtPath(sourceState, item.path);
      const pages = Array.isArray(item.renderedPages) && item.renderedPages.length ? item.renderedPages : (Array.isArray(value) ? value : []);
      const textValue = item.textPath ? getValueAtPath(sourceState, item.textPath) : '';
      const body = pages.length
        ? pages.map(src => `<img src="${src}" style="max-width:100%;height:auto;display:block;margin:0 auto 10px">`).join('')
        : (textValue ? `<p style="white-space:pre-wrap;font-size:13px;line-height:1.65">${escapeHtml(textValue)}</p>` : '');
      const extractedText = item.extractedText ? `<details style="margin-top:10px"><summary style="cursor:pointer;font-size:11px;color:#475569">Extracted text</summary><p style="white-space:pre-wrap;font-size:11px;line-height:1.55;color:#334155">${escapeHtml(item.extractedText)}</p></details>` : '';
      if (body) return `<div class="section-block"><h2 class="section-title">${escapeHtml(item.title)}</h2><div style="font-size:11px;color:#64748b;margin-bottom:10px">Auto-copied from Final DSR · ${escapeHtml(item.kind)}</div>${body}${extractedText}</div>`;
      if (item.fileUrl) return `<div style="border-bottom:1px solid #e2e8f0;padding:8px 0;font-size:12px"><strong>${escapeHtml(item.title)}</strong><br><span style="color:#64748b">Attached Final DSR file · ${escapeHtml(item.kind)}</span></div>`;
      return '';
    }).join('');
    combinedContent += sourceParts;
  }

  if (!useOfficialTemplate && activeEnterpriseReport) {
    const builder = ensureEnterpriseBuilder(activeEnterpriseReport);
    const coverAssets = Object.entries(builder.coverAssets || {}).filter(([, asset]) => asset && asset.dataUrl);
    if (coverAssets.length) {
      combinedContent += `
        <div class="section-block" style="page-break-after:always;">
          <h2 class="section-title">Cover Page Attachments</h2>
          <div style="display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:12px;">
            ${coverAssets.map(([key, asset]) => `<figure style="margin:0; border:1px solid #cbd5e1; padding:8px;">${renderReplUploadedFileContent(asset, REPLENISHMENT_COVER_ASSETS.find(item => item[0] === key)?.[1] || key)}<figcaption style="font-size:11px; color:#64748b; margin-top:6px;">${REPLENISHMENT_COVER_ASSETS.find(item => item[0] === key)?.[1] || key}</figcaption></figure>`).join('')}
          </div>
        </div>
      `;
    }
    if (builder.certificates?.length) {
      combinedContent += `<div class="section-block"><h2 class="section-title">Certificates</h2>`;
      builder.certificates.forEach((cert, index) => {
        combinedContent += `
          <div style="page-break-after:always; border:1px solid #cbd5e1; padding:18px; margin-bottom:16px;">
            <h3 style="margin-top:0;color:#17324d;">${index + 1}. ${cert.title || 'Certificate'}</h3>
            <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:12px;">
              <tr><td><strong>Certificate No.</strong></td><td>${cert.number || '-'}</td><td><strong>Issued By</strong></td><td>${cert.issuedBy || '-'}</td></tr>
              <tr><td><strong>Issue Date</strong></td><td>${cert.issueDate || '-'}</td><td><strong>Expiry Date</strong></td><td>${cert.expiryDate || '-'}</td></tr>
              <tr><td><strong>Remarks</strong></td><td colspan="3">${cert.remarks || '-'}</td></tr>
            </table>
            ${(cert.files || []).map(file => renderReplUploadedFileContent(file, 'Certificate document')).join('')}
          </div>
        `;
      });
      combinedContent += `</div>`;
    }
    const tocItems = [
      'Cover Page',
      ...(builder.certificates || []).map(cert => cert.title || 'Certificate'),
      ...builder.introSubsections.filter(section => section.enabled && (section.text || section.files?.length)).map(section => section.title),
      ...Object.values(builder.excelModules).filter(module => module.files?.length || module.rows?.length).map(module => module.title),
      ...builder.annexures.map(item => item.title || 'Annexure')
    ];
    combinedContent += `
      <div class="section-block" style="page-break-after:always;">
        <h2 class="section-title">Auto Generated Index</h2>
        <table style="width:100%; border-collapse:collapse; font-size:13px;">
          <tbody>${tocItems.map((item, index) => `<tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px;">${index + 1}</td><td style="padding:8px;">${item}</td><td style="padding:8px;text-align:right;">Auto</td></tr>`).join('')}</tbody>
        </table>
      </div>
    `;
    builder.introSubsections.filter(section => section.enabled && (section.text || section.files?.length)).forEach(section => {
      combinedContent += `
        <div class="section-block">
          <h2 class="section-title">${section.title}</h2>
          ${section.text ? `<p style="font-size:13.5px;line-height:1.7;white-space:pre-wrap;color:#334155;">${section.text}</p>` : ''}
          ${(section.files || []).map(file => renderReplUploadedFileContent(file, 'Introduction document')).join('')}
        </div>
      `;
    });
    Object.values(builder.excelModules).filter(module => module.files?.length || module.rows?.length).forEach(module => {
      const rows = Array.isArray(module.rows) ? module.rows : [];
      combinedContent += `
        <div class="section-block">
          <h2 class="section-title">${module.title}</h2>
          ${rows.length ? `<table style="width:100%;border-collapse:collapse;font-size:11px;"><thead><tr>${module.columns.map(col => `<th style="border:1px solid #cbd5e1;padding:6px;background:#f8fafc;">${col}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${module.columns.map(col => `<td style="border:1px solid #e2e8f0;padding:5px;">${row[col] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody></table>` : `<p style="font-size:12px;color:#334155;">Uploaded table file: ${module.files?.[0]?.name || 'Template data'}</p>`}
        </div>
      `;
    });
    if (builder.annexures?.length) {
      combinedContent += `<div class="section-block"><h2 class="section-title">Annexures</h2>`;
      builder.annexures.forEach((annexure, index) => {
        combinedContent += `
          <div style="page-break-after:always; border:1px solid #cbd5e1; padding:18px; margin-bottom:16px;">
            <h3 style="margin-top:0;color:#17324d;">Annexure ${index + 1}: ${annexure.title || 'Untitled Annexure'}</h3>
            <p style="font-size:13px;color:#334155;">${annexure.description || ''}</p>
            ${(annexure.files || []).map(file => renderReplUploadedFileContent(file, 'Annexure document')).join('')}
          </div>
        `;
      });
      combinedContent += `</div>`;
    }
  }

  if (activeEnterpriseReport) {
    combinedContent += buildReplenishmentUploadedContent(activeEnterpriseReport);
  }

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
          body.official-template{font-family:"Times New Roman",Times,serif;padding:42px 56px;color:#111}
          body.official-template .doc-head{display:none}
          .official-cover{min-height:1180px;text-align:center;display:flex;flex-direction:column;align-items:center;padding:34px 24px 20px}
          .official-cover-title{font-size:24px;font-weight:700;color:#703064;letter-spacing:.2px;margin-top:20px}
          .official-cover-year{font-size:20px;font-weight:700;color:#703064;margin-top:16px}
          .official-cover-project{font-size:18px;font-weight:700;margin-top:12px;text-transform:uppercase}
          .official-cover-photo{width:52%;max-height:280px;overflow:hidden;margin:30px auto 6px}.official-cover-photo img{max-height:270px}
          .official-cover-location{font-size:19px;font-weight:700;line-height:1.3;max-width:760px;margin:auto 0}
          .official-cover-applicant{font-size:17px;font-weight:700;line-height:1.45;margin:40px 0 24px}.official-cover-applicant strong{color:#703064;text-decoration:underline}.official-cover-applicant span{color:#16813c}
          .official-cover-consultant{font-size:13px;line-height:1.4;margin-top:auto}.official-cover-logos{display:flex;justify-content:center;align-items:end;gap:30px;margin-top:12px}.official-cover-logos>div{width:130px}.official-cover-logos img{max-height:80px;object-fit:contain}
          .official-page,.official-index{color:#111}.official-page h2,.official-index h2{color:#111;font:700 15px/1.25 "Times New Roman",Times,serif;margin:0 0 16px;text-transform:uppercase}.official-index h2{text-align:center;text-decoration:underline;font-size:18px}
          .official-narrative{white-space:pre-wrap;text-align:justify;color:#111;font:14px/1.55 "Times New Roman",Times,serif}
          .official-page p{color:#111}.official-page table,.official-index table{font-size:11px}.official-page th,.official-index th{background:#fff;text-align:center}.official-index td:last-child{text-align:center}
          .official-data-table{table-layout:fixed;font-size:9.5px!important}.official-data-table th,.official-data-table td{padding:4px 5px}
          .official-source-note{font-size:10px;text-align:center;color:#555;margin:-8px 0 10px;font-style:italic}
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
      <body class="${useOfficialTemplate ? 'official-template' : ''}">
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
  if (reportId && document.getElementById('draggable-sections-list')) {
    await saveReportSelection(reportId);
  }
  const checkedIds = getEffectiveReplenishmentSectionIds(report);
  
  await generateReplenishmentPDF(reportName, checkedIds, reportId, { triggerButton });
}

async function downloadCustomReportWord(reportName, reportId, triggerButton = null) {
  const reports = loadLocalReports();
  const report = reports.find(r => r.id === reportId) || window.activeReport;
  if (!report) {
    toast('Open or select a saved replenishment report first.', 'error');
    return;
  }

  const checkedIds = getEffectiveReplenishmentSectionIds(report);

  const validationErrors = validateReplenishmentReportForPdf(report, checkedIds);
  if (validationErrors.length) {
    toast(`Cannot generate Word file: ${validationErrors[0]}`, 'error');
    return;
  }

  if (triggerButton) {
    triggerButton.disabled = true;
    triggerButton.dataset.originalText = triggerButton.dataset.originalText || triggerButton.textContent || 'Download Word';
    triggerButton.textContent = 'Preparing Word...';
  }
  showPdfProgressToast('Preparing Word document...');
  try {
    await refreshReplenishmentInheritanceFromSource(report);
    await hydrateFinalDsrSource(report, true);
    await hydrateReplenishmentUploadContent(report);
    await hydrateEnterprisePdfPages(report);
    const html = compileSelectedSectionsHtml(report.name || reportName, checkedIds, checkedIds, report.id);
    const wordHtml = html
      .replace(/<html(\s*)>/i, '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">')
      .replace('<head>', '<head><meta charset="utf-8"><!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>90</w:Zoom></w:WordDocument></xml><![endif]-->');
    const blob = new Blob(['\ufeff', wordHtml], { type: 'application/msword;charset=utf-8' });
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob);
    anchor.download = getSafeReplenishmentWordFileName(report.name || reportName);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(anchor.href), 2500);
    toast('Replenishment Word report downloaded successfully.', 'success');
  } catch (error) {
    console.error('Replenishment Word export failed:', error);
    toast(error.message || 'Word export failed. Please try again.', 'error');
  } finally {
    hidePdfProgressToast();
    if (triggerButton) {
      triggerButton.disabled = false;
      triggerButton.textContent = triggerButton.dataset.originalText || 'Download Word';
    }
  }
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

function getSafeReplenishmentWordFileName(reportName) {
  return getSafeReplenishmentPdfFileName(reportName).replace(/\.pdf$/i, '.doc');
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
    customSections: report?.customSections || [],
    enterpriseBuilder: report?.enterpriseBuilder || null
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
  if ((!checkedIds || !checkedIds.length) && !report?.inheritanceScan?.sourceDocumentCount && !hasEnterpriseBuilderContent(report)) {
    errors.push('Select at least one report section before downloading the PDF.');
  }

  const sectionSet = new Set(checkedIds || []);
  REPLENISHMENT_REPORT_ACCORDION_SECTIONS.forEach(section => {
    if (!section.requirementId || !sectionSet.has(section.id)) return;
    const stats = getReplenishmentSectionStats(report, section);
    if (stats.total > 0 && stats.complete === 0) {
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

  if (report?.enterpriseBuilder) {
    const builder = ensureEnterpriseBuilder(report);
    const requiredMeta = [
      ['reportYear', 'Report Year'], ['projectName', 'Project / Mining Block'], ['district', 'District'],
      ['state', 'State'], ['village', 'Village'], ['block', 'Block'], ['river', 'River'],
      ['applicant', 'Applicant'], ['leaseArea', 'Lease Area'], ['studyPeriod', 'Study Period'],
      ['preSurveyDate', 'Pre-monsoon Survey Date'], ['postSurveyDate', 'Post-monsoon Survey Date'],
      ['ecNumber', 'Environmental Clearance No.'], ['bulkDensity', 'Bulk Density']
    ];
    requiredMeta.forEach(([key, label]) => {
      if (!String(builder.reportMeta[key] || '').trim()) errors.push(`Report Details: ${label} is required.`);
    });
    if (builder.reportMeta.preSurveyDate && builder.reportMeta.postSurveyDate && new Date(builder.reportMeta.postSurveyDate) <= new Date(builder.reportMeta.preSurveyDate)) {
      errors.push('Post-monsoon survey date must be after the pre-monsoon survey date.');
    }
    const gridRows = builder.excelModules?.['rl-grid-tables']?.rows || [];
    if (!gridRows.length) errors.push('RL Grid Tables: enter or import pre/post monsoon grid measurements.');
    if (gridRows.some(row => !replNumber(row['Grid Area (sqm)']) || !replNumber(row['Pre Monsoon RL (m)']) || !replNumber(row['Post Monsoon RL (m)']))) {
      errors.push('RL Grid Tables: every row requires grid area, pre-monsoon RL and post-monsoon RL.');
    }
    const requiredTables = ['gps-coordinates', 'production-programme', 'drone-details', 'instrument-details', 'gcp-details', 'dgps-details', 'rainfall-data', 'photo-register', 'compliance-checklist'];
    requiredTables.forEach(moduleId => {
      const module = builder.excelModules[moduleId];
      if (module && !module.rows?.length && !module.files?.length) errors.push(`${module.title}: enter rows or import the completed template.`);
    });
    if (!builder.certificates.length) errors.push('Certificates: add Environmental Clearance / statutory certificate details.');
    if (!builder.annexures.length) errors.push('Annexures: add current approvals, survey plates, maps and photographs.');
  }

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
  let exportHost = null;

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

    // html2canvas can return a white canvas when asked to capture an element owned by
    // an off-screen iframe. Import the fully rendered report into the main document
    // before conversion so the PDF engine always captures the visible render tree.
    const sourceStyle = iframe.contentDocument?.querySelector('style')?.textContent || '';
    const exportStyle = sourceStyle
      .replace(/body\.official-template/g, '.repl-pdf-export.official-template')
      .replace(/(^|})\s*body\{/g, '$1 .repl-pdf-export{');
    exportHost = document.createElement('div');
    exportHost.className = `repl-pdf-export ${body.classList.contains('official-template') ? 'official-template' : ''}`;
    exportHost.style.cssText = 'position:fixed;left:0;top:0;width:1040px;background:#fff;color:#111827;z-index:999998;pointer-events:none;';
    exportHost.innerHTML = `<style>${exportStyle}</style>${target.outerHTML}`;
    document.body.appendChild(exportHost);
    const exportTarget = exportHost.querySelector('.sheet') || exportHost;
    await Promise.all(Array.from(exportTarget.querySelectorAll('img')).map(image => {
      if (image.complete) return Promise.resolve();
      return new Promise(resolve => { image.onload = image.onerror = resolve; });
    }));

    return await html2pdf()
      .set({
        margin: 0,
        filename: getSafeReplenishmentPdfFileName(reportName),
        image: { type: 'jpeg', quality: 0.9 },
        html2canvas: {
          scale: Math.min(1.35, Math.max(1.15, window.devicePixelRatio || 1.35)),
          useCORS: true,
          logging: false,
          windowWidth: exportTarget.scrollWidth || 1040
        },
        jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', 'h4'] }
      })
      .from(exportTarget)
      .toPdf()
      .get('pdf')
      .then(pdf => {
        const totalPages = pdf.internal.getNumberOfPages();
        for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
          pdf.setPage(pageNumber);
          pdf.setFont('times', 'normal');
          pdf.setFontSize(9);
          pdf.setTextColor(60, 60, 60);
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          pdf.text(String(pageNumber), pageWidth / 2, pageHeight - 7, { align: 'center' });
        }
        return pdf.output('blob');
      });
  } finally {
    exportHost?.remove();
    iframe.remove();
  }
}

async function downloadStoredReplenishmentPdf(report, metadata) {
  const baseUrl = (typeof API_BASE_URL !== 'undefined' && API_BASE_URL) ? API_BASE_URL : '/api';
  const response = await fetch(`${baseUrl}/download-pdf?projectId=${encodeURIComponent(S.activeProject.id)}&annexureId=${encodeURIComponent(metadata.annexureId)}`, {
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

function downloadReplenishmentPdfBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

async function generateReplenishmentPDF(reportName, checkedIds, reportId, options = {}) {
  if (!checkedIds || checkedIds.length === 0) {
    toast("No sections selected to download.", "error");
    return false;
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
    return false;
  }

  reportName = report.name || reportName;
  report.sections = checkedIds;
  await refreshReplenishmentInheritanceFromSource(report);
  await hydrateFinalDsrSource(report, true);
  await hydrateReplenishmentUploadContent(report);
  await hydrateEnterprisePdfPages(report);
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
    return false;
  }

  const signature = getReplenishmentReportSignature(report, checkedIds);

  if (!options.skipButtonState) setReplenishmentDownloadBusy(reportId, true, options.triggerButton);
  showPdfProgressToast('Generating PDF...');
  
  try {
    const cachedPdf = replenishmentPdfBlobCache.get(reportId);
    const blob = cachedPdf && cachedPdf.signature === signature
      ? cachedPdf.blob
      : await generateReplenishmentPdfBlob(reportName, checkedIds, reportId, report);
    if (!blob) throw new Error('PDF generation failed.');
    replenishmentPdfBlobCache.set(reportId, { blob, signature });
    const fileName = getSafeReplenishmentPdfFileName(reportName);
    showPdfProgressToast('Starting PDF download...');
    downloadReplenishmentPdfBlob(blob, fileName);
    toast('Replenishment Report PDF downloaded successfully!', 'success');

    // Save the project copy in the background; local download must finish immediately.
    uploadReplenishmentPdfToStorage(report, blob, fileName, signature).catch(storageError => {
      console.warn('PDF downloaded, but the project copy could not be saved:', storageError);
      toast('PDF downloaded. Project copy could not be saved.', 'info');
    });
    return true;
  } catch (err) {
    console.error('Download PDF error:', err);
    toast(err.message || 'PDF generation failed. Please try again.', 'error');
    return false;
  } finally {
    hidePdfProgressToast();
    if (!options.skipButtonState) setReplenishmentDownloadBusy(reportId, false, options.triggerButton);
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
