const fs = require('fs');
const path = require('path');

const SRC_DIR = __dirname;
const DIST_FILE = path.join(SRC_DIR, 'login.html');
const JS_BUNDLE_FILE = 'js/portal.bundle.js';

// Ordered JavaScript files to inject at the end of body
const JS_FILES = [
  'js/api.js',
  'js/state.js',
  'js/phase.js',
  'js/hierarchy.js',
  'js/performance.js',
  'js/navigation.js',
  'js/auth.js',
  'js/projects.js',
  'js/frontmatter.js',
  'js/chapters.js',
  'js/plates.js',
  'js/graphs.js',
  'js/users.js',
  'js/tables.js',
  'js/anx1.js',
  'js/anx2.js',
  'js/anx3.js',
  'js/anx4.js',
  'js/anx5.js',
  'js/anx6.js',
  'js/anx7.js',
  'js/more-annexures.js',
  'js/annexure-b.js',
  'js/annexure-c.js',
  'js/annexure-d.js',
  'js/annexure-e.js',
  'js/annexure-f.js',
  'js/annexure-g.js',
  'js/annexure-h.js',
  'js/annexure-i.js',
  'js/annexure-j.js',
  'js/annexure-k.js',
  'js/signatures.js',
  'js/pdf.js',
  'js/pdf-preview.js',
  'js/audit-logs.js',
  'js/sdlc.js',
  'js/model-dsr.js',
  'js/main.js'
];

const ASSET_VERSION = 'site-zoom-20260702-annex-fjk';
const applyAssetVersion = (html) => html.replace(/\{\{ASSET_VERSION\}\}/g, ASSET_VERSION);

function buildJsBundle() {
  const bundle = JS_FILES.map(file => {
    const absPath = path.join(SRC_DIR, file);
    const source = fs.readFileSync(absPath, 'utf8');
    return `\n/* ${file} */\n${source}\n;`;
  }).join('\n');

  const outPath = path.join(SRC_DIR, JS_BUNDLE_FILE);
  fs.writeFileSync(outPath, bundle, 'utf8');
  console.log(`Successfully bundled ${JS_FILES.length} JS files into ${outPath}`);
}

function compile() {
  console.log('Compiling DSR Portal...');
  try {
    // buildJsBundle();

    // 1. Start with head
    let html = applyAssetVersion(fs.readFileSync(path.join(SRC_DIR, 'templates', 'head.html'), 'utf8'));

    // 2. Append auth screen
    html += fs.readFileSync(path.join(SRC_DIR, 'templates', 'auth.html'), 'utf8');

    // 3. Append app shell (which contains placeholders for sidebar, topbar, and views)
    let shell = fs.readFileSync(path.join(SRC_DIR, 'templates', 'app-shell.html'), 'utf8');

    // Recursive helper to resolve placeholders like {{templates/sidebar.html}}
    const placeholderRegex = /\{\{([^}]+)\}\}/g;
    let match;
    while ((match = placeholderRegex.exec(shell)) !== null) {
      const templatePath = path.join(SRC_DIR, match[1]);
      if (fs.existsSync(templatePath)) {
        const content = fs.readFileSync(templatePath, 'utf8');
        shell = shell.replace(match[0], content);
        // Reset regex index to scan from start of newly modified shell string
        placeholderRegex.lastIndex = 0;
      } else {
        console.warn(`Warning: Template placeholder file not found: ${match[1]}`);
        shell = shell.replace(match[0], `<!-- Template ${match[1]} not found -->`);
      }
    }

    html += applyAssetVersion(shell);

    // 4. Append standalone authority dashboard screen
    html += applyAssetVersion(fs.readFileSync(path.join(SRC_DIR, 'templates', 'screen-authority.html'), 'utf8'));

    // 5. Append modals & toast overlay
    html += applyAssetVersion(fs.readFileSync(path.join(SRC_DIR, 'templates', 'modals.html'), 'utf8'));

    // 6. Append bundled and extra JS modules + Leaflet map script + styles
    html += `\n<script defer src="${JS_BUNDLE_FILE}?v=${ASSET_VERSION}-v3"></script>`;
    html += `\n<script defer src="js/model-dsr-module.js?v=2"></script>`;
    html += `\n<script defer src="js/replenishment-module.js?v=5"></script>`;
    
    html += `\n<script>
document.addEventListener("DOMContentLoaded", function() {
    if(document.getElementById('dash-interactive-map')) {
        window.dashboardMap = L.map('dash-interactive-map', {
            zoomControl: true,
            scrollWheelZoom: true
        }).setView([31.1471, 75.3412], 8);
        var map = window.dashboardMap;
        
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri'
        }).addTo(map);

        // Force invalidate size after a short delay (fixes render in hidden/tabbed containers)
        setTimeout(function() { map.invalidateSize(); }, 300);

        fetch('assets/punjab_districts.geojson')
            .then(res => res.json())
            .then(data => {
                var geoLayer = L.geoJSON(data, {
                    style: function(feature) {
                        return {
                            color: '#F2A123',
                            weight: 2.5,
                            fillColor: 'rgba(242, 161, 35, 0.15)',
                            fillOpacity: 0.15
                        };
                    },
                    onEachFeature: function (feature, layer) {
                        if (feature.properties && feature.properties.NAME_2) {
                            layer.bindTooltip(feature.properties.NAME_2, {
                                permanent: true, 
                                direction: "center",
                                className: "map-district-label"
                            });
                        }
                        layer.on('mouseover', function() {
                            this.setStyle({ fillOpacity: 0.35, weight: 3 });
                        });
                        layer.on('mouseout', function() {
                            geoLayer.resetStyle(this);
                        });
                    }
                }).addTo(map);

                // Fit map exactly to Punjab bounds with padding
                var bounds = geoLayer.getBounds();
                window.dashboardMapBounds = bounds;
                map.fitBounds(bounds, { padding: [20, 20] });
                map.setMaxBounds(bounds.pad(0.15));
                map.setMinZoom(map.getZoom() - 1);
            });
    }
});
</script>
<style>
.map-district-label {
    background: transparent;
    border: none;
    box-shadow: none;
    color: #fff;
    font-weight: 700;
    font-size: 11px;
    text-shadow: 1px 1px 2px #000, -1px -1px 2px #000, 1px -1px 2px #000, -1px 1px 2px #000;
}
</style>`;
    html += '\n</body>\n</html>';

    // Write built file (App / Login portal)
    fs.writeFileSync(DIST_FILE, html, 'utf8');
    console.log(`Successfully compiled DSR Portal into ${DIST_FILE}`);

    // Copy home.html to index.html and home.html (Landing page)
    let homeHtml = applyAssetVersion(fs.readFileSync(path.join(SRC_DIR, 'templates', 'home.html'), 'utf8'));
    fs.writeFileSync(path.join(SRC_DIR, 'home.html'), homeHtml, 'utf8');
    fs.writeFileSync(path.join(SRC_DIR, 'index.html'), homeHtml, 'utf8');
    console.log(`Successfully generated home.html and index.html (Landing Page) from templates/home.html`);
    
  } catch (err) {
    console.error('Compilation Error:', err);
  }
}

// Check for --watch flag
if (process.argv.includes('--watch')) {
  compile();
  console.log('Watching templates/, js/ and css/ for changes...');
  
  const watchOptions = { recursive: true };
  
  const watcher = (eventType, filename) => {
    if (filename) {
      // Avoid compiling if the compiled index.html itself is updated
      if (filename === 'index.html') return;
      console.log(`File change detected: ${filename}`);
      compile();
    }
  };

  fs.watch(path.join(SRC_DIR, 'templates'), watchOptions, watcher);
  fs.watch(path.join(SRC_DIR, 'js'), watchOptions, watcher);
  fs.watch(path.join(SRC_DIR, 'css'), watchOptions, watcher);
} else {
  compile();
}
