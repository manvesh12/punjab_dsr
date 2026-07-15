const fs = require('fs');
const path = require('path');

const SRC_DIR = __dirname;
const DIST_FILE = path.join(SRC_DIR, 'login.html');
const JS_BUNDLE_FILE = 'js/portal.bundle.js';

// Ordered JavaScript files to inject at the end of body
// Editable source modules. `portal.bundle.js` remains the generated runtime file
// loaded by the portal, preserving the existing browser contract.
const JS_FILES = [
  'api.js', 'state.js', 'persistence.service.js', 'autosave.manager.js', 'phase.js', 'hierarchy.js', 'performance.js',
  'navigation.js', 'auth.js', 'projects.js', 'frontmatter.js', 'chapters.js',
  'plates.js', 'graphs.js', 'users.js', 'tables.js', 'anx1.js', 'anx2.js',
  'anx3.js', 'anx4.js', 'anx5.js', 'anx6.js', 'anx7.js', 'more-annexures.js',
  'annexure-b.js', 'annexure-c.js', 'annexure-d.js', 'annexure-e.js',
  'annexure-f.js', 'annexure-g.js', 'annexure-h.js', 'annexure-i.js',
  'annexure-j.js', 'annexure-k.js', 'signatures.js', 'pdf-preview.js',
  'audit-logs.js', 'model-dsr.js', 
  'replenishment/sidebar.js', 'replenishment/workspace.js', 'replenishment/preview.js', 'replenishment/index.js',
  'main.js'
].map(file => `js/modules/${file}`);

const ASSET_VERSION = 'portal-chapter-render-fix-20260714-v6';
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
    buildJsBundle();

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
    html += `\n<script defer src="js/model-dsr-module.js?v=12"></script>`;
    html += `\n<script defer src="js/replenishment-module.js?v=24"></script>`;
    html += `\n<script defer src="js/map-bootstrap.js?v=${ASSET_VERSION}"></script>`;
    html += `\n<link rel="stylesheet" href="css/map.css?v=${ASSET_VERSION}">`;
    // Map bootstrap and its visual rules are maintained as standalone assets.
    html += '\n</body>\n</html>';

    // Inject PWA configuration (manifest and service worker registration)
    if (!html.includes('manifest.json')) {
      html = html.replace(
        '</head>',
        `  <link rel="manifest" href="manifest.json">\n  <meta name="theme-color" content="#1e293b">\n  <link rel="apple-touch-icon" href="assets/dsr-logo.png">\n</head>`
      );
    }
    if (!html.includes('navigator.serviceWorker.register')) {
      html = html.replace(
        '</body>',
        `  <!-- PWA Service Worker Registration -->
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
          })
          .catch(err => {
            console.log('ServiceWorker registration failed: ', err);
          });
      });
    }
  </script>\n</body>`
      );
    }

    // Write built file (App / Login portal)
    fs.writeFileSync(DIST_FILE, html, 'utf8');
    console.log(`Successfully compiled DSR Portal into ${DIST_FILE}`);

    // Copy home.html to index.html and home.html (Landing page)
    let homeHtml = applyAssetVersion(fs.readFileSync(path.join(SRC_DIR, 'templates', 'home.html'), 'utf8'));
    if (!homeHtml.includes('manifest.json')) {
      homeHtml = homeHtml.replace(
        '</head>',
        `  <link rel="manifest" href="manifest.json">\n  <meta name="theme-color" content="#1e293b">\n  <link rel="apple-touch-icon" href="assets/dsr-logo.png">\n</head>`
      );
    }
    if (!homeHtml.includes('navigator.serviceWorker.register')) {
      homeHtml = homeHtml.replace(
        '</body>',
        `  <!-- PWA Service Worker Registration -->
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
          })
          .catch(err => {
            console.log('ServiceWorker registration failed: ', err);
          });
      });
    }
  </script>\n</body>`
      );
    }
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
