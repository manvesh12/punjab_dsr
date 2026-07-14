/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PDF PREVIEW PANEL
   Split workspace for Front Matter,
   Chapters, and Plate Section.
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const pdfPreview = {
  scale: 1.0,
  currentView: null,
  panel: null,
  body: null,
  scrollEl: null,
  viewerEl: null,
  titleEl: null,
  zoomLabels: [],
  currentPage: 1,
  totalPages: 0,
  _scrollRaf: null,
  _textRefreshTimer: null,
  _annexureRefreshTimers: {},
  _objectUrls: {},
  _pdfRenderJobs: {},
  fitPdfViewerUrl(src) {
    if (!src || src === 'about:blank' || src.startsWith('blob:') || src.startsWith('data:')) return src || 'about:blank';
    const base = String(src).split('#')[0];
    return `${base}#view=FitH&zoom=page-width`;
  },
  SECTION_TITLES: {
    'front-matter': 'Live Preview',
    'chapters': 'Live Preview',
    'plates': 'Live Preview',
    'anx1': 'Annexure I Preview',
    'anx2': 'Annexure II Preview',
    'anx3': 'Annexure III Preview',
    'anx4': 'Annexure IV Preview',
    'anx5': 'Annexure V Preview',
    'anx6': 'Annexure VI Preview',
    'anx7': 'Annexure VII Preview',
    'annexure-b': 'PDF Preview',
    'annexure-c': 'PDF Preview',
    'annexure-d': 'PDF Preview',
    'annexure-e': 'PDF Preview',
    'annexure-f': 'PDF Preview',
    'annexure-g': 'PDF Preview',
    'annexure-h': 'PDF Preview',
    'annexure-i': 'PDF Preview',
    'annexure-j': 'PDF Preview',
    'annexure-k': 'PDF Preview'
  },
  IFRAME_IDS: {
    'anx1': 'pdf-iframe',
    'anx2': 'pdf-iframe-anx2',
    'anx3': 'pdf-iframe-anx3',
    'anx4': 'pdf-iframe-anx4',
    'anx5': 'pdf-iframe-anx5',
    'anx6': 'pdf-iframe-anx6',
    'anx7': 'pdf-iframe-anx7',
    'annexure-f': 'pdf-iframe-annexure-f-preview',
    'annexure-j': 'pdf-iframe-annexure-j-preview',
    'annexure-k': 'pdf-iframe-annexure-k-preview'
  },
  isAnnexureView(viewId) {
    if (!viewId) return false;
    if (viewId.startsWith('anx') && !viewId.startsWith('annexure-')) return true;
    return viewId === 'annexure-f' || viewId === 'annexure-j' || viewId === 'annexure-k';
  },
  FM_ORDER: ['cover', 'toc', 'pref', 'ack', 'cert'],
  FM_LABELS: {
    cover: 'Cover Page',
    toc: 'Content Page',
    pref: 'Preface',
    ack: 'Acknowledgement',
    cert: 'Certificate of Compliance'
  },
  init() {
    this.panel = document.getElementById('pdf-preview-panel');
    if (!this.panel) return;
    const workspace = document.querySelector('.app-workspace');
    if (workspace && this.panel.parentElement !== workspace) {
      workspace.appendChild(this.panel);
    }
    this.body = this.panel.querySelector('.pdf-preview-body');
    this.scrollEl = document.getElementById('pdf-preview-scroll') || this.body;
    this.viewerEl = document.getElementById('pdf-preview-viewer');
    this.titleEl = document.getElementById('pdf-preview-title');
    this.zoomLabels = [
      document.getElementById('pdf-preview-zoom-lbl'),
      document.getElementById('pdf-preview-float-zoom-lbl')
    ].filter(Boolean);
    this.bindEvents();
    this.bindMobileTabs();
  },
  bindEvents() {
    const el = (id) => document.getElementById(id);
    const zoomIn = () => this.zoomIn();
    const zoomOut = () => this.zoomOut();
    el('pdf-preview-zoom-in')?.addEventListener('click', zoomIn);
    el('pdf-preview-zoom-out')?.addEventListener('click', zoomOut);
    el('pdf-preview-inner-zoom-in')?.addEventListener('click', zoomIn);
    el('pdf-preview-inner-zoom-out')?.addEventListener('click', zoomOut);
    el('pdf-preview-float-zoom-in')?.addEventListener('click', zoomIn);
    el('pdf-preview-float-zoom-out')?.addEventListener('click', zoomOut);
    el('pdf-preview-refresh')?.addEventListener('click', () => this.refresh());
    el('pdf-preview-fullscreen')?.addEventListener('click', () => this.fullScreen());
    el('pdf-preview-inner-fullscreen')?.addEventListener('click', () => this.fullScreen());
    el('pdf-preview-download')?.addEventListener('click', () => this.download());
    if (this.scrollEl) {
      this.scrollEl.addEventListener('scroll', () => {
        if (this._scrollRaf) cancelAnimationFrame(this._scrollRaf);
        this._scrollRaf = requestAnimationFrame(() => this.updateVisiblePage());
      });
    }
  },
  bindMobileTabs() {
    const tabs = document.getElementById('pdf-preview-mobile-tabs');
    if (!tabs) return;
    tabs.querySelectorAll('.pdf-preview-mobile-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        document.body.classList.remove('preview-mobile-tab-editor', 'preview-mobile-tab-preview');
        if (tab === 'preview') document.body.classList.add('preview-mobile-tab-preview');
        else document.body.classList.add('preview-mobile-tab-editor');
        tabs.querySelectorAll('.pdf-preview-mobile-tab').forEach(b => b.classList.toggle('active', b === btn));
      });
    });
  },
  show(viewId) {
    this.currentView = viewId;
    document.body.classList.add('preview-open');
    document.body.classList.add('preview-mobile-tab-editor');
    document.body.classList.remove('preview-mobile-tab-preview');
    document.querySelector('.app-workspace')?.classList.add('preview-open');
    if (this.panel) {
      this.panel.hidden = false;
      this.panel.classList.add('open');
    }
    const mobileTabs = document.getElementById('pdf-preview-mobile-tabs');
    if (mobileTabs) mobileTabs.setAttribute('aria-hidden', 'false');
    if (this.titleEl) {
      this.titleEl.textContent = typeof getEditableAnnexureTitle === 'function'
        ? getEditableAnnexureTitle(viewId, this.SECTION_TITLES[viewId] || 'PDF Preview')
        : (this.SECTION_TITLES[viewId] || 'PDF Preview');
    }
    const isAnnexure = this.isAnnexureView(viewId);
    const scrollContainer = this.scrollEl;
    const iframe = document.getElementById('pdf-preview-iframe') || document.querySelector('.pdf-preview-viewer iframe');
    const innerBar = document.querySelector('.pdf-preview-inner-bar');
    const floatZoom = document.querySelector('.pdf-preview-float-zoom');
    const floatPage = document.getElementById('pdf-preview-float-page');
    const actionToolbarLeft = document.querySelector('.pdf-preview-actions-left');
    if (isAnnexure) {
      if (scrollContainer) scrollContainer.style.display = 'none';
      if (innerBar) innerBar.style.display = 'none';
      if (floatZoom) floatZoom.style.display = 'none';
      if (floatPage) floatPage.style.display = 'none';
      if (actionToolbarLeft) actionToolbarLeft.style.display = 'none';
      if (iframe) {
        iframe.style.display = 'block';
        iframe.id = this.IFRAME_IDS[viewId] || 'pdf-preview-iframe';
        const savedPdf = S.activeProject && S.activeProject.pdfData && S.activeProject.pdfData[viewId];
        const isLiveAnnexure = viewId === 'annexure-f' || viewId === 'annexure-j' || viewId === 'annexure-k';
        if (savedPdf && !isLiveAnnexure) {
          iframe.src = this.fitPdfViewerUrl(savedPdf);
        } else {
          iframe.src = 'about:blank';
          this.generateAnnexureLivePreview(viewId, 700);
        }
      }
    } else {
      if (scrollContainer) scrollContainer.style.display = 'flex';
      if (innerBar) innerBar.style.display = 'flex';
      if (floatZoom) floatZoom.style.display = 'flex';
      if (floatPage) floatPage.style.display = 'block';
      if (actionToolbarLeft) actionToolbarLeft.style.display = 'flex';
      if (iframe) {
        iframe.style.display = 'none';
        iframe.src = 'about:blank';
        iframe.id = 'pdf-preview-iframe';
      }
    }
    this.scale = 1.0;
    this.refresh();
    if (window.initLucide) initLucide();
  },
  hide() {
    this.currentView = null;
    document.body.classList.remove('preview-open', 'preview-mobile-tab-editor', 'preview-mobile-tab-preview');
    document.querySelector('.app-workspace')?.classList.remove('preview-open');
    if (this.panel) {
      this.panel.classList.remove('open');
      this.panel.hidden = true;
      this.panel.style.transform = '';
    }
    const mobileTabs = document.getElementById('pdf-preview-mobile-tabs');
    if (mobileTabs) mobileTabs.setAttribute('aria-hidden', 'true');
    const fsTarget = this.viewerEl || this.panel;
    if (document.fullscreenElement === fsTarget) {
      document.exitFullscreen().catch(() => {});
    }
  },
  notifyUpdate(viewId) {
    if (this.currentView === viewId) {
      if (viewId === 'front-matter') {
        clearTimeout(this._textRefreshTimer);
        this._textRefreshTimer = setTimeout(() => this.refresh(), 180);
      } else {
        this.refresh();
      }
    }
  },
  refresh() {
    if (!this.currentView) return;
    const viewId = this.currentView;
    const isAnnexure = this.isAnnexureView(viewId);
    if (isAnnexure) {
      const uploadedImgs = S.uploadedPDFs && S.uploadedPDFs[viewId];
      const targetIframeId = this.IFRAME_IDS[viewId] || 'pdf-preview-iframe';
      const iframe = document.getElementById(targetIframeId) || document.getElementById('pdf-preview-iframe');
      const scrollContainer = this.scrollEl;
      const innerBar = document.querySelector('.pdf-preview-inner-bar');
      const floatZoom = document.querySelector('.pdf-preview-float-zoom');
      const floatPage = document.getElementById('pdf-preview-float-page');
      const actionToolbarLeft = document.querySelector('.pdf-preview-actions-left');
      if (uploadedImgs && uploadedImgs.length) {
        if (iframe) iframe.style.display = 'none';
        if (scrollContainer) scrollContainer.style.display = 'flex';
        if (innerBar) innerBar.style.display = 'flex';
        if (floatZoom) floatZoom.style.display = 'flex';
        if (floatPage) floatPage.style.display = 'block';
        if (actionToolbarLeft) actionToolbarLeft.style.display = 'flex';
        this.renderPages(uploadedImgs);
      } else {
        if (scrollContainer) scrollContainer.style.display = 'none';
        if (innerBar) innerBar.style.display = 'none';
        if (floatZoom) floatZoom.style.display = 'none';
        if (floatPage) floatPage.style.display = 'none';
        if (actionToolbarLeft) actionToolbarLeft.style.display = 'none';
        if (iframe) {
          iframe.style.display = 'block';
          const savedPdf = S.activeProject && S.activeProject.pdfData && S.activeProject.pdfData[viewId];
          const fittedPdf = this.fitPdfViewerUrl(savedPdf);
          const isLiveAnnexure = viewId === 'annexure-f' || viewId === 'annexure-j' || viewId === 'annexure-k';
          if (savedPdf && !isLiveAnnexure && iframe.src !== fittedPdf) {
            iframe.src = fittedPdf;
          } else if (!savedPdf || isLiveAnnexure) {
            iframe.src = 'about:blank';
            this.generateAnnexureLivePreview(viewId, 300);
          }
        }
      }
    } else {
      if (!this.body) return;
      switch (this.currentView) {
        case 'front-matter': this.renderFrontMatter(); break;
        case 'chapters': this.renderChapters(); break;
        case 'plates': this.renderPlates(); break;
        case 'annexure-b': this.renderAnnexureB(); break;
        case 'annexure-c': this.renderAnnexureC(); break;
        case 'annexure-d': this.renderAnnexureD(); break;
        case 'annexure-e': this.renderAnnexureE(); break;
        case 'annexure-f': this.renderAnnexureF(); break;
        case 'annexure-g': this.renderAnnexureG(); break;
        case 'annexure-h': this.renderAnnexureH(); break;
        case 'annexure-i': this.renderAnnexureI(); break;
        case 'annexure-j': this.renderAnnexureJ(); break;
        case 'annexure-k': this.renderAnnexureK(); break;
      }
    }
    if (window.initLucide) initLucide();
  },
  getAnnexureExportFnName(viewId) {
    if (viewId === 'annexure-f') return 'exportAnnexureFPDF';
    if (viewId === 'annexure-j') return 'exportAnnexureJPDF';
    if (viewId === 'annexure-k') return 'exportAnnexureKPDF';
    return 'export' + viewId.charAt(0).toUpperCase() + viewId.slice(1) + 'PDF';
  },
  annexureNeedsPdfVendors(viewId) {
    return viewId !== 'anx1';
  },
  getAnnexureSourceView(viewId) {
    return document.getElementById(`view-${viewId}`);
  },
  prepareAnnexureLivePreviewSource(viewId) {
    if (viewId === 'annexure-f' && typeof renderAnnexureF === 'function') renderAnnexureF();
    if (viewId === 'annexure-j' && typeof syncAnnexureJDemandTables === 'function') syncAnnexureJDemandTables();
    if (viewId === 'annexure-j' && typeof renderAnnexureJ === 'function') renderAnnexureJ();
    if (viewId === 'annexure-k' && typeof renderAnnexureK === 'function') renderAnnexureK();
  },
  escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },
  async renderPdfUrlToImages(src) {
    if (!src) throw new Error('Missing PDF source.');
    if (typeof pdfjsLib === 'undefined') {
      if (typeof ensurePortalVendor === 'function') {
        await ensurePortalVendor('pdfjs');
      } else {
        throw new Error('PDF.js library is not loaded on this page.');
      }
    }
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
    }
    let response;
    if (String(src).startsWith('blob:') || String(src).startsWith('data:')) {
      response = await fetch(src);
    } else {
      const headers = {};
      const token = localStorage.getItem('dsr_token');
      if (token && /^\/?api\//i.test(String(src).replace(/^https?:\/\/[^/]+/i, '').replace(/^\//, ''))) {
        headers.Authorization = `Bearer ${token}`;
      }
      response = await fetch(src, {
        credentials: 'same-origin',
        headers
      });
    }
    if (!response.ok) throw new Error(`Unable to load uploaded PDF (${response.status}).`);
    const data = new Uint8Array(await response.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const pages = [];
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: context, viewport }).promise;
      pages.push(canvas.toDataURL('image/jpeg', 0.85));
    }
    return pages;
  },
  ensureUploadedPdfRendered(type, src, meta = {}) {
    if (!type || !src || !window.S) return;
    if (!S.uploadedPDFs) S.uploadedPDFs = {};
    if (Array.isArray(S.uploadedPDFs[type]) && S.uploadedPDFs[type].some(item => /^data:image\//i.test(String(item || '')))) return;
    const jobKey = `${type}:${src}`;
    if (this._pdfRenderJobs[jobKey]) return;
    this._pdfRenderJobs[jobKey] = this.renderPdfUrlToImages(src)
      .then(pages => {
        if (!pages || !pages.length) throw new Error('No PDF pages rendered.');
        if (!S.uploadedPDFs) S.uploadedPDFs = {};
        S.uploadedPDFs[type] = pages;
        if (!S.frontMatterFiles) S.frontMatterFiles = {};
        S.frontMatterFiles[type] = {
          ...(S.frontMatterFiles[type] || {}),
          ...meta,
          pages: pages.length
        };
        if (this.currentView === 'front-matter') this.refresh();
      })
      .catch(err => {
        console.warn('Uploaded PDF live preview render failed:', err);
        if (!S.frontMatterFiles) S.frontMatterFiles = {};
        S.frontMatterFiles[type] = {
          ...(S.frontMatterFiles[type] || {}),
          previewError: err.message || 'Unable to render uploaded PDF.'
        };
        if (this.currentView === 'front-matter') this.refresh();
      })
      .finally(() => {
        delete this._pdfRenderJobs[jobKey];
      });
  },
  cleanupAnnexurePreviewClone(clone, viewId) {
    if (viewId) {
      clone.querySelectorAll('div, p, span, figcaption, h2, td, th').forEach(el => {
        if (el.children.length > 0) return;
        const txt = (el.textContent || '').trim();
        if (
          txt.includes('Uploaded PDF pages or images will be appended after the Annexure') ||
          txt.includes('No supporting PDF/image uploaded yet') ||
          txt.includes('Use the supplied Demand Table Excel template or upload a completed workbook') ||
          txt.includes('Example input values from Proforma_Template_One_Example.xlsx') ||
          txt.includes('Example input values from Annexure_A_Template_One_Example.xlsx') ||
          txt.includes('Uploaded PDF / Image Pages') ||
          txt.includes('Annexure K Supporting') ||
          txt.includes('Annexure F Supporting') ||
          txt.includes('Annexure J Supporting')
        ) {
          el.remove();
        }
      });
    }
    clone.querySelectorAll('table').forEach(table => {
      // First, compute the printable cells for each row while the table is fully intact.
      const rows = Array.from(table.querySelectorAll('tr'));
      const printableMap = new Map();
      rows.forEach(row => {
        printableMap.set(row, getPrintableTableCells(row));
      });

      // Now, remove the non-printable cells from the DOM (both thead headers and tbody/tfoot cells).
      rows.forEach(row => {
        const printable = printableMap.get(row);
        if (printable) {
          const printableSet = new Set(printable);
          Array.from(row.children).forEach(cell => {
            if (!printableSet.has(cell)) {
              cell.remove();
            }
          });
        }
      });

      // Align expected columns and remove any trailing empty cells.
      const headerRows = Array.from(table.querySelectorAll('thead tr'));
      const expectedColumns = Math.max(0, ...headerRows.map(row => Array.from(row.children)
        .reduce((total, cell) => total + Number(cell.colSpan || 1), 0)));

      table.querySelectorAll('tbody tr, tfoot tr').forEach(row => {
        let cells = Array.from(row.children);
        while (expectedColumns && cells.length > expectedColumns) {
          const last = cells[cells.length - 1];
          if ((last.textContent || '').trim() || last.querySelector('img,svg,canvas')) break;
          last.remove();
          cells = Array.from(row.children);
        }
        const visibleColumns = cells.reduce((total, cell) => total + Number(cell.colSpan || 1), 0);
        if (expectedColumns && visibleColumns < expectedColumns && cells.length === 1) {
          cells[0].colSpan = expectedColumns;
        }
        Array.from(row.children).forEach(cell => {
          if (!cell.querySelector('img,svg,canvas') && String(cell.textContent || '').trim() === '') {
            cell.textContent = 'NA';
          }
        });
      });
    });

    // Remove all general non-printing elements
    clone.querySelectorAll([
      'script',
      'style',
      'input[type="file"]',
      'button',
      '.btn',
      '.no-print',
      '[data-print="false"]',
      '.actions',
      '.toolbar',
      '.page-actions',
      '.upload-actions',
      '.header-row',
      '.notif',
      '.page-title',
      '.page-sub',
      '.annexure-line-instructions',
      '.annexure-instructions-card',
      'i[data-lucide="pencil-line"]',
      'svg.lucide-pencil-line',
      'svg.lucide',
      '[data-lucide]'
    ].join(',')).forEach(el => el.remove());

    // Convert inputs/selects to static values
    clone.querySelectorAll('input, textarea, select').forEach(el => {
      const value = el.tagName === 'SELECT'
        ? (el.options[el.selectedIndex] ? el.options[el.selectedIndex].text : el.value)
        : el.value;
      const span = document.createElement('span');
      span.className = 'field-value';
      span.textContent = value || 'NA';
      el.replaceWith(span);
    });

    clone.querySelectorAll('td, th').forEach(cell => {
      if (!cell.querySelector('img,svg,canvas') && String(cell.textContent || '').trim() === '') {
        cell.textContent = 'NA';
      }
    });

    clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));

    clone.querySelectorAll('[style]').forEach(el => {
      const keep = [];
      const style = el.getAttribute('style') || '';
      style.split(';').forEach(part => {
        if (/grid-template-columns|min-width|text-align|font-weight/i.test(part)) keep.push(part);
      });
      if (keep.length) el.setAttribute('style', keep.join(';'));
      else el.removeAttribute('style');
    });

    return clone;
  },
  buildAnnexureHtmlDocument(viewId) {
    this.prepareAnnexureLivePreviewSource(viewId);
    const source = this.getAnnexureSourceView(viewId);
    if (!source) return '';
    const clone = this.cleanupAnnexurePreviewClone(source.cloneNode(true), viewId);
    const title = typeof getEditableAnnexureTitle === 'function'
      ? getEditableAnnexureTitle(viewId, this.SECTION_TITLES[viewId] || 'Annexure Preview')
      : (this.SECTION_TITLES[viewId] || 'Annexure Preview');
    const district = (window.S && S.frontMatter && S.frontMatter.district) || 'Jalandhar';
    const year = (window.S && S.frontMatter && S.frontMatter.year) || '2025-26';
    
    let attachmentHtml = '';
    if (typeof renderAnnexureAttachmentPreview === 'function') {
      attachmentHtml = renderAnnexureAttachmentPreview(viewId);
    }
    
    const infoEl = clone.querySelector(`#${viewId}-attachment-info`);
    if (infoEl) {
      infoEl.innerHTML = attachmentHtml || '';
    }
    
    let bodyHtml = clone.innerHTML.trim() || '<p class="empty">No annexure data entered yet.</p>';
    if (attachmentHtml && (!infoEl || !bodyHtml.includes(attachmentHtml))) {
      bodyHtml += attachmentHtml;
    }
    return `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            *{box-sizing:border-box}
            body{margin:0;background:#e9eef5;color:#111827;font-family:Arial,Helvetica,sans-serif;}
            .sheet{width:min(100%,1040px);min-height:100vh;margin:0 auto;padding:30px;background:#fff;box-shadow:0 14px 34px rgba(15,23,42,.14);}
            .doc-head{border-bottom:2px solid #17324d;padding-bottom:14px;margin-bottom:20px;text-align:center;}
            .doc-head h1{margin:0 0 8px;color:#17324d;font-size:24px;line-height:1.2;}
            .doc-head p{margin:0;color:#526172;font-size:13px;}
            h1,h2,h3{color:#17324d;line-height:1.25;}
            h1{font-size:24px;margin:0 0 14px;} h2{font-size:18px;margin:20px 0 10px;} h3{font-size:15px;margin:16px 0 8px;}
            p,.muted,label{color:#526172;font-size:13px;line-height:1.55;}
            .card,.section,.panel,.annexure-line-main{border:0!important;background:transparent!important;box-shadow:none!important;padding:0!important;margin:0 0 18px!important;}
            .g2,.grid,.annexure-line-layout{display:block!important;}
            table{width:100%;border-collapse:collapse;margin:10px 0 18px;font-size:11px;table-layout:auto;}
            th,td{border:1px solid #111827;padding:6px 7px;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;}
            th{background:#f3f4f6;font-weight:700;text-align:left;}
            .field-value{display:inline-block;min-width:80px;padding:4px 6px;border-bottom:1px solid #cbd5e1;color:#111827;}
            .editable-title{font-weight:600;}
            .empty{padding:24px;border:1px dashed #cbd5e1;border-radius:8px;text-align:center;}
            img{max-width:100%;height:auto;}
            .annexure-uploaded-pages { margin-top: 24px; border-top: 2px dashed #cbd5e1; padding-top: 20px; }
            .annexure-uploaded-pages h2 { font-size: 16px; margin: 0 0 16px; color: #17324d; }
            .annexure-uploaded-page { margin: 0 0 20px 0; background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; border-radius: 8px; text-align: center; }
            .annexure-uploaded-page img { max-width: 100%; height: auto; box-shadow: 0 4px 10px rgba(0,0,0,0.08); border-radius: 4px; display: block; margin: 0 auto 10px; }
            .annexure-uploaded-page iframe { width: 100%; height: 500px; border: none; background: #fff; margin-bottom: 10px; }
            .annexure-uploaded-page figcaption { font-size: 11px; color: #64748b; font-weight: 500; }
          </style>
        </head>
        <body>
          <main class="sheet">
            <header class="doc-head">
              <h1>${this.escapeHtml(title)}</h1>
              <p>District Survey Report - ${this.escapeHtml(district)} | ${this.escapeHtml(year)}</p>
            </header>
            ${bodyHtml}
          </main>
        </body>
      </html>`;
  },
  renderAnnexureHtmlPreview(viewId) {
    const iframe = getAnnexurePreviewIframe(viewId);
    const html = this.buildAnnexureHtmlDocument(viewId);
    if (!iframe || !html) return false;
    iframe.style.display = 'block';
    iframe.removeAttribute('src');
    iframe.srcdoc = html;
    return true;
  },
  renderAnnexureFallback(viewId, message) {
    const iframe = getAnnexurePreviewIframe(viewId);
    if (!iframe) return;
    iframe.style.display = 'block';
    iframe.removeAttribute('src');
    const title = typeof getEditableAnnexureTitle === 'function'
      ? getEditableAnnexureTitle(viewId, this.SECTION_TITLES[viewId] || 'Annexure Preview')
      : (this.SECTION_TITLES[viewId] || 'Annexure Preview');
    iframe.srcdoc = `<!doctype html>
      <html><head><meta charset="utf-8">
      <style>
        body{margin:0;font-family:Arial,Helvetica,sans-serif;background:#f8fafc;color:#17324d;}
        .wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px;box-sizing:border-box;}
        .box{max-width:620px;border:1px solid #d7dee8;border-radius:10px;background:#fff;padding:28px;box-shadow:0 12px 30px rgba(23,50,77,.12);}
        h1{font-size:24px;margin:0 0 12px;} p{font-size:14px;line-height:1.55;margin:0;color:#526172;}
      </style></head><body><div class="wrap"><div class="box"><h1>${title}</h1><p>${message || 'Live preview is preparing. Use Refresh if it does not appear automatically.'}</p></div></div></body></html>`;
  },
  generateAnnexureLivePreview(viewId, delay = 0) {
    if (this.renderAnnexureHtmlPreview(viewId)) return;
    const exportFnName = this.getAnnexureExportFnName(viewId);
    if (typeof window[exportFnName] !== 'function') {
      this.renderAnnexureFallback(viewId, 'Live preview function is loading. Please switch back to this annexure or click Refresh once.');
      return;
    }
    clearTimeout(this._annexureRefreshTimers[viewId]);
    this._annexureRefreshTimers[viewId] = setTimeout(() => {
      const runExport = () => {
        if (this.currentView && this.currentView !== viewId) return;
        try {
          window[exportFnName](null, true);
        } catch (err) {
          console.error(`Live preview failed for ${viewId}:`, err);
          this.renderAnnexureFallback(viewId, 'Live preview could not be generated from the current table data. Please check the annexure entries and try Refresh.');
          if (typeof toast === 'function') toast('Live preview could not be generated. Please try refresh.', 'error');
        }
      };
      if (!this.annexureNeedsPdfVendors(viewId)) {
        runExport();
      } else if (typeof ensurePortalVendors === 'function') {
        ensurePortalVendors(['jspdf', 'autotable']).then(runExport).catch(err => {
          console.error(`PDF tools failed for ${viewId}:`, err);
          this.renderAnnexureFallback(viewId, 'PDF preview tools could not load. Please check your connection and try Refresh.');
          if (typeof toast === 'function') toast('PDF preview tools could not load. Please check your connection.', 'error');
        });
      } else {
        runExport();
      }
    }, delay);
  },
  /** Build a simple A4-style page image from title + body text */
  renderTextPageCanvas(title, bodyText, subtitle) {
    const canvas = document.createElement('canvas');
    const scale = 3;
    const W = 620 * scale;
    const H = 880 * scale;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#0a2540';
    ctx.textAlign = 'center';
    ctx.font = `bold ${22 * scale}px Georgia, serif`;
    ctx.fillText(title, W / 2, 120 * scale);
    const isRedundant = subtitle && (
      title.toLowerCase().includes(subtitle.toLowerCase()) || 
      subtitle.toLowerCase().includes(title.toLowerCase()) ||
      title.toLowerCase().replace(/[^a-z0-9]/g, '') === subtitle.toLowerCase().replace(/[^a-z0-9]/g, '')
    );
    if (subtitle && !isRedundant) {
      ctx.font = `${12 * scale}px Georgia, serif`;
      ctx.fillStyle = '#64748b';
      ctx.fillText(subtitle, W / 2, 150 * scale);
    }
    ctx.textAlign = 'left';
    ctx.fillStyle = '#334155';
    ctx.font = `${14 * scale}px Georgia, serif`;
    const margin = 56 * scale;
    const maxWidth = W - margin * 2;
    const words = (bodyText || '').split(/\s+/);
    const lines = [];
    let line = '';
    words.forEach(word => {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    let y = 200 * scale;
    const lineHeight = 22 * scale;
    lines.forEach(l => {
      if (y > H - 80 * scale) return;
      ctx.fillText(l, margin, y);
      y += lineHeight;
    });
    return canvas.toDataURL('image/jpeg', 0.95);
  },
  renderCoverPageCanvas() {
    const fm = S.frontMatter || {};
    const canvas = document.createElement('canvas');
    const scale = 3;
    const W = 620 * scale;
    const H = 880 * scale;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    const navy = '#0a2540';
    const accent = '#e07b00';
    ctx.strokeStyle = navy;
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.arc(W / 2, 100 * scale, 36 * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = navy;
    ctx.textAlign = 'center';
    ctx.font = `${11 * scale}px Georgia, serif`;
    ctx.fillText('GOVERNMENT OF PUNJAB', W / 2, 160 * scale);
    ctx.font = `bold ${20 * scale}px Georgia, serif`;
    const title = (fm.title || 'District Survey Report').toUpperCase();
    this._wrapCenteredText(ctx, title, W / 2, 220 * scale, W - 80 * scale, 26 * scale);
    ctx.font = `${16 * scale}px Georgia, serif`;
    ctx.fillStyle = accent;
    ctx.fillText(`${(fm.district || 'District').toUpperCase()} DISTRICT`, W / 2, 310 * scale);
    ctx.fillStyle = navy;
    ctx.font = `${13 * scale}px Georgia, serif`;
    ctx.fillText(`${fm.state || 'Punjab'} Â· ${fm.year || ''}`, W / 2, 340 * scale);
    ctx.font = `${11 * scale}px Georgia, serif`;
    ctx.fillStyle = '#475569';
    const prep = `Prepared by: ${fm.preparedBy || ''}`;
    this._wrapCenteredText(ctx, prep, W / 2, 420 * scale, W - 80 * scale, 18 * scale);
    const assist = `Assisted by: ${fm.assistedBy || ''}`;
    this._wrapCenteredText(ctx, assist, W / 2, 460 * scale, W - 80 * scale, 18 * scale);
    ctx.font = `${12 * scale}px Georgia, serif`;
    ctx.fillStyle = navy;
    ctx.fillText(fm.version || '', W / 2, H - 60 * scale);
    return canvas.toDataURL('image/jpeg', 0.95);
  },
  _wrapCenteredText(ctx, text, cx, startY, maxWidth, lineHeight) {
    const words = (text || '').split(/\s+/);
    const lines = [];
    let line = '';
    words.forEach(word => {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    let y = startY;
    lines.forEach(l => {
      ctx.fillText(l, cx, y);
      y += lineHeight;
    });
  },
  getFrontMatterPages() {
    const pages = [];
    const pdfs = S.uploadedPDFs || {};
    this.FM_ORDER.forEach(type => {
      const sectionLabel = this.FM_LABELS[type] || type;
      const uploaded = pdfs[type];
      if (uploaded && uploaded.length) {
        uploaded.forEach((img, idx) => {
          pages.push({
            src: img,
            label: uploaded.length > 1 ? `${sectionLabel} - Page ${idx + 1}` : sectionLabel
          });
        });
        return;
      }
      if (type === 'cover') {
        pages.push({ src: this.renderCoverPageCanvas(), label: sectionLabel, generated: true });
      } else if (type === 'pref' && S.frontMatter && S.frontMatter.preface) {
        pages.push({
          src: this.renderTextPageCanvas('PREFACE', S.frontMatter.preface, 'District Survey Report'),
          label: sectionLabel,
          generated: true
        });
      } else if (type === 'ack' && S.frontMatter && S.frontMatter.acknowledgement) {
        pages.push({
          src: this.renderTextPageCanvas('ACKNOWLEDGEMENT', S.frontMatter.acknowledgement, 'District Survey Report'),
          label: sectionLabel,
          generated: true
        });
      }
    });
    return pages;
  },
  getFrontMatterPages() {
    const pages = [];
    const pdfs = S.uploadedPDFs || {};
    const fileMeta = S.frontMatterFiles || {};
    this.FM_ORDER.forEach(type => {
      const sectionLabel = this.FM_LABELS[type] || type;
      const uploaded = pdfs[type];
      const uploadedImages = Array.isArray(uploaded)
        ? uploaded.filter(src => this.isPreviewImageSource(src))
        : [];
      if (uploadedImages.length) {
        uploadedImages.forEach((img, idx) => {
          pages.push({
            src: img,
            label: uploadedImages.length > 1 ? `${sectionLabel} - Page ${idx + 1}` : sectionLabel
          });
        });
        return;
      }
      const storedUrl = fileMeta[type]?.storedUrl || S.activeProject?.pdfData?.[type] || '';
      const staleOrPdfSource = (Array.isArray(uploaded) && uploaded.find(src => this.isPdfPreviewSource(src))) || storedUrl;
      if (staleOrPdfSource && storedUrl) {
        this.ensureUploadedPdfRendered(type, storedUrl, fileMeta[type] || {});
      }
      const generatedPage = this.getGeneratedFrontMatterPage(type, sectionLabel);
      if (generatedPage) pages.push(generatedPage);
    });
    return pages;
  },
  isPreviewImageSource(src) {
    const value = String(src || '');
    return /^data:image\//i.test(value) || /\.(?:png|jpe?g|webp)(?:[?#]|$)/i.test(value);
  },
  isPdfPreviewSource(src) {
    const value = String(src || '');
    return /^data:application\/pdf/i.test(value)
      || /(?:download-pdf|\.pdf)(?:[?#]|$)/i.test(value)
      || /^blob:/i.test(value);
  },
  getGeneratedFrontMatterPage(type, sectionLabel) {
    if (type === 'cover') {
      return { src: this.renderCoverPageCanvas(), label: sectionLabel, generated: true };
    }
    if (type === 'toc') {
      return null;
    }
    if (type === 'pref' && S.frontMatter && S.frontMatter.preface) {
      return {
        src: this.renderTextPageCanvas('PREFACE', S.frontMatter.preface, 'District Survey Report'),
        label: sectionLabel,
        generated: true
      };
    }
    if (type === 'ack' && S.frontMatter && S.frontMatter.acknowledgement) {
      return {
        src: this.renderTextPageCanvas('ACKNOWLEDGEMENT', S.frontMatter.acknowledgement, 'District Survey Report'),
        label: sectionLabel,
        generated: true
      };
    }
    if (type === 'cert') {
      const fm = S.frontMatter || {};
      const district = fm.district || S.activeProject?.district || 'District';
      const state = fm.state || 'Punjab';
      const year = fm.year || S.activeProject?.year || '';
      return {
        src: this.renderTextPageCanvas('CERTIFICATE OF COMPLIANCE', `This District Survey Report has been prepared for ${district} District, ${state}${year ? `, for ${year}` : ''}.\n\nThe report content is maintained in the DSR Automation Portal and can be reviewed section by section before final PDF generation.`, 'District Survey Report'),
        label: sectionLabel,
        generated: true
      };
    }
    return null;
  },
  getChapterPages() {
    // Imported reports contain many original-PDF pages. Rendering every
    // chapter to canvas blocks the workspace; retain a lightweight preview
    // and let the user open the original section from its chapter card.
    if (S.importedSourceDocument && Array.isArray(S.sourceSections) && S.sourceSections.length) {
      return [{
        src: this.renderTextPageCanvas(
          'IMPORTED JALANDHAR DSR',
          `${S.chapters.length} chapters were imported from the source PDF. Use the Open PDF button beside any chapter to view its original pages.`,
          'Fast section preview'
        ),
        label: 'Imported DSR sections',
        generated: true
      }];
    }
    const pages = [];
    S.chapters.forEach((ch, i) => {
      const imgs = S.chapterPDFs && S.chapterPDFs[ch.id];
      if (imgs && imgs.length) {
        imgs.forEach((img, idx) => {
          pages.push({
            src: img,
            label: imgs.length > 1
              ? `Chapter ${i + 1} - Page ${idx + 1}`
              : `Chapter ${i + 1}: ${ch.name}`
          });
        });
      }
    });
    return pages;
  },
  getChapterPages() {
    if (S.importedSourceDocument && Array.isArray(S.sourceSections) && S.sourceSections.length) {
      return [{
        src: this.renderTextPageCanvas(
          'IMPORTED JALANDHAR DSR',
          `${S.chapters.length} chapters were imported from the source PDF. Use the Open PDF button beside any chapter to view its original pages.`,
          'Fast section preview'
        ),
        label: 'Imported DSR sections',
        generated: true
      }];
    }
    const pages = [];
    S.chapters.forEach((ch, i) => {
      const imgs = S.chapterPDFs && S.chapterPDFs[ch.id];
      const uploadedImages = Array.isArray(imgs)
        ? imgs.filter(src => this.isPreviewImageSource(src))
        : [];
      if (uploadedImages.length) {
        uploadedImages.forEach((img, idx) => {
          pages.push({
            src: img,
            label: uploadedImages.length > 1
              ? `Chapter ${i + 1} - Page ${idx + 1}`
              : `Chapter ${i + 1}: ${ch.name}`
          });
        });
        return;
      }
      if (String(ch.name || ch.summary || '').trim()) {
        pages.push({
          src: this.renderTextPageCanvas(ch.name || `CHAPTER ${i + 1}`, ch.summary || 'Upload a chapter PDF to preview the original chapter document here.'),
          label: `Chapter ${i + 1}`,
          generated: true
        });
      }
    });
    return pages;
  },
  getPlatePages() {
    const pages = [];
    S.plates.forEach((p, i) => {
      const sourcePages = Array.isArray(p.pages)
        ? p.pages.filter(src => this.isPreviewImageSource(src))
        : [];
      const title = p.name || `Plate ${i + 1}`;
      const description = p.summary || 'No plate description has been entered.';
      if (sourcePages.length) {
        sourcePages.forEach((src, pageIndex) => {
          pages.push({
            src,
            label: sourcePages.length > 1
              ? `Plate P${i + 1} - Page ${pageIndex + 1}`
              : `Plate P${i + 1}: ${title}`
          });
        });
        return;
      }
      // Match the Chapter preview's generated-page structure exactly.
      pages.push({
        src: this.renderTextPageCanvas(title, description),
        label: `Plate P${i + 1}`,
        generated: true
      });
    });
    return pages;
  },
  renderFrontMatter() {
    this.renderPages(this.getFrontMatterPages());
  },
  renderChapters() {
    this.renderPages(this.getChapterPages());
  },
  renderPlates() {
    this.renderPages(this.getPlatePages());
  },
  getAnnexureBPages() {
    const pages = [];
    (S.annexureB || []).forEach((p, i) => {
      if (p.pages && p.pages.length) {
        p.pages.forEach((img, idx) => {
          pages.push({
            src: img,
            label: p.pages.length > 1
              ? `Annexure B - Page ${idx + 1}`
              : `Annexure B: ${p.name}`
          });
        });
      } else {
        pages.push({
          src: this.renderTextPageCanvas(p.name || 'Annexure B Entry', p.summary || 'Upload your Annexure B PDF or image here.', 'Annexure B'),
          label: `Annexure B: ${p.name}`,
          generated: true
        });
      }
    });
    return pages;
  },
  renderAnnexureB() {
    this.renderPages(this.getAnnexureBPages());
  },
  getAnnexureCPages() {
    const pages = [];
    (S.annexureC || []).forEach((p, i) => {
      if (p.pages && p.pages.length) {
        p.pages.forEach((img, idx) => {
          pages.push({
            src: img,
            label: p.pages.length > 1
              ? `Annexure C - Page ${idx + 1}`
              : `Annexure C: ${p.name}`
          });
        });
      } else {
        pages.push({
          src: this.renderTextPageCanvas(p.name || 'Annexure C Entry', p.summary || 'Upload your Annexure C PDF or image here.', 'Annexure C'),
          label: `Annexure C: ${p.name}`,
          generated: true
        });
      }
    });
    return pages;
  },
  renderAnnexureC() {
    this.renderPages(this.getAnnexureCPages());
  },
  getAnnexureDPages() {
    const pages = [];
    (S.annexureD || []).forEach((p, i) => {
      if (p.pages && p.pages.length) {
        p.pages.forEach((img, idx) => {
          pages.push({
            src: img,
            label: p.pages.length > 1
              ? `Annexure D - Page ${idx + 1}`
              : `Annexure D: ${p.name}`
          });
        });
      } else {
        pages.push({
          src: this.renderTextPageCanvas(p.name || 'Annexure D Entry', p.summary || 'Upload your Annexure D PDF or image here.', 'Annexure D'),
          label: `Annexure D: ${p.name}`,
          generated: true
        });
      }
    });
    return pages;
  },
  renderAnnexureD() {
    this.renderPages(this.getAnnexureDPages());
  },
  getAnnexureEPages() {
    const pages = [];
    (S.annexureE || []).forEach((p, i) => {
      if (p.pages && p.pages.length) {
        p.pages.forEach((img, idx) => {
          pages.push({
            src: img,
            label: p.pages.length > 1
              ? `Annexure E - Page ${idx + 1}`
              : `Annexure E: ${p.name}`
          });
        });
      } else {
        pages.push({
          src: this.renderTextPageCanvas(p.name || 'Annexure E Entry', p.summary || 'Upload your Annexure E PDF or image here.', 'Annexure E'),
          label: `Annexure E: ${p.name}`,
          generated: true
        });
      }
    });
    return pages;
  },
  renderAnnexureE() {
    this.renderPages(this.getAnnexureEPages());
  },
  getAnnexureFPages() {
    const attachment = getAnnexureFAttachment();
    const pages = [];
    if (attachment && attachment.pages && attachment.pages.length) {
      attachment.pages.forEach((img, idx) => {
        pages.push({
          src: img,
          label: attachment.pages.length > 1
            ? `Annexure F Supporting - Page ${idx + 1}`
            : `Annexure F Supporting`
        });
      });
    } else {
      pages.push({
        src: this.renderTextPageCanvas('Annexure F Supporting', 'Upload supporting PDF/image below the tables.', 'Annexure F'),
        label: 'Annexure F Placeholder',
        generated: true
      });
    }
    return pages;
  },
  renderAnnexureF() {
    if (typeof exportAnnexureFPDF === 'function') {
      exportAnnexureFPDF(null, true);
    } else {
      this.renderPages(this.getAnnexureFPages());
    }
  },
  getAnnexureGPages() {
    const pages = [];
    (S.annexureG || []).forEach((p, i) => {
      if (p.pages && p.pages.length) {
        p.pages.forEach((img, idx) => {
          pages.push({
            src: img,
            label: p.pages.length > 1
              ? `Annexure G - Page ${idx + 1}`
              : `Annexure G: ${p.name}`
          });
        });
      } else {
        pages.push({
          src: this.renderTextPageCanvas(p.name || 'Annexure G Entry', p.summary || 'Upload your Annexure G PDF or image here.', 'Annexure G'),
          label: `Annexure G: ${p.name}`,
          generated: true
        });
      }
    });
    return pages;
  },
  renderAnnexureG() {
    this.renderPages(this.getAnnexureGPages());
  },
  getAnnexureHPages() {
    const pages = [];
    (S.annexureH || []).forEach((p, i) => {
      if (p.pages && p.pages.length) {
        p.pages.forEach((img, idx) => {
          pages.push({
            src: img,
            label: p.pages.length > 1
              ? `Annexure H - Page ${idx + 1}`
              : `Annexure H: ${p.name}`
          });
        });
      } else {
        pages.push({
          src: this.renderTextPageCanvas(p.name || 'Annexure H Entry', p.summary || 'Upload your Annexure H PDF or image here.', 'Annexure H'),
          label: `Annexure H: ${p.name}`,
          generated: true
        });
      }
    });
    return pages;
  },
  renderAnnexureH() {
    this.renderPages(this.getAnnexureHPages());
  },
  getAnnexureIPages() {
    const pages = [];
    (S.annexureI || []).forEach((p, i) => {
      if (p.pages && p.pages.length) {
        p.pages.forEach((img, idx) => {
          pages.push({
            src: img,
            label: p.pages.length > 1
              ? `Annexure I - Page ${idx + 1}`
              : `Annexure I: ${p.name}`
          });
        });
      } else {
        pages.push({
          src: this.renderTextPageCanvas(p.name || 'Annexure I Entry', p.summary || 'Upload your Annexure I PDF or image here.', 'Annexure I'),
          label: `Annexure I: ${p.name}`,
          generated: true
        });
      }
    });
    return pages;
  },
  renderAnnexureI() {
    this.renderPages(this.getAnnexureIPages());
  },
  getAnnexureJPages() {
    const pages = [];
    (S.annexureJ || []).forEach((p, i) => {
      if (p.pages && p.pages.length) {
        p.pages.forEach((img, idx) => {
          pages.push({
            src: img,
            label: p.pages.length > 1
              ? `Annexure J - Page ${idx + 1}`
              : `Annexure J: ${p.name}`
          });
        });
      } else {
        pages.push({
          src: this.renderTextPageCanvas(p.name || 'Annexure J Entry', p.summary || 'Upload your Annexure J PDF or image here.', 'Annexure J'),
          label: `Annexure J: ${p.name}`,
          generated: true
        });
      }
    });
    return pages;
  },
  renderAnnexureJ() {
    if (typeof exportAnnexureJPDF === 'function') {
      exportAnnexureJPDF(null, true);
    } else {
      this.renderPages(this.getAnnexureJPages());
    }
  },
  getAnnexureKPages() {
    const attachment = getAnnexureKAttachment();
    const pages = [];
    if (attachment && attachment.pages && attachment.pages.length) {
      attachment.pages.forEach((img, idx) => {
        pages.push({
          src: img,
          label: attachment.pages.length > 1
            ? `Annexure K Supporting - Page ${idx + 1}`
            : `Annexure K Supporting`
        });
      });
    } else {
      pages.push({
        src: this.renderTextPageCanvas('Annexure K Supporting', 'Upload supporting PDF/image below the tables.', 'Annexure K'),
        label: 'Annexure K Placeholder',
        generated: true
      });
    }
    return pages;
  },
  renderAnnexureK() {
    if (typeof exportAnnexureKPDF === 'function') {
      exportAnnexureKPDF(null, true);
    } else {
      this.renderPages(this.getAnnexureKPages());
    }
  },
  async renderPdfBlob(blobUrl) {
    try {
      const pages = await this.renderPdfUrlToImages(blobUrl);
      this.renderPages(pages);
    } catch (err) {
      console.error('Error rendering PDF blob to images:', err);
    }
  },
  renderPages(pages) {
    if (!this.body) return;
    if (!pages || !pages.length) {
      this.body.innerHTML = `
        <div class="pdf-preview-empty">
          <div class="pdf-preview-empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div class="pdf-preview-empty-title">No pages yet</div>
          <div class="pdf-preview-empty-sub">Upload PDFs on the left or fill in front matter fields to see a live combined preview here.</div>
        </div>`;
      this.totalPages = 0;
      this.currentPage = 0;
      this.updatePageIndicators();
      return;
    }
    this.body.innerHTML = pages.map((page, i) => {
      const src = typeof page === 'string' ? page : page.src;
      const label = typeof page === 'string' ? `Page ${i + 1}` : (page.label || `Page ${i + 1}`);
      const safeLabel = String(label).replace(/"/g, '&quot;');
      return `
        <div class="pdf-preview-page-wrap" data-page="${i + 1}">
          <img src="${src}" class="pdf-preview-page" alt="${safeLabel}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'pdf-preview-empty',textContent:'Preview page could not be loaded. Re-upload this PDF once to refresh the saved preview.'}))">
        </div>`;
    }).join('');
    this.totalPages = pages.length;
    this.currentPage = 1;
    this.applyScale();
    this.updatePageIndicators();
    requestAnimationFrame(() => this.updateVisiblePage());
  },
  getChapterHtmlPages() {
    const chapters = Array.isArray(S.chapters) ? S.chapters : [];
    if (!chapters.length) return [];
    return chapters.flatMap((ch, i) => {
      const imgs = S.chapterPDFs && S.chapterPDFs[ch.id];
      const pageCount = imgs && imgs.length ? imgs.length : 0;
      const fileName = ch.fileName ? this.escapeHtml(ch.fileName) : '';
      const fileMeta = fileName
        ? `<div class="html-note"><strong>Uploaded PDF:</strong> ${fileName}${pageCount ? ` (${pageCount} page(s))` : ''}</div>`
        : '<div class="html-note html-note-muted">No chapter PDF uploaded. Showing chapter title and summary as HTML.</div>';
      const name = this.escapeHtml(ch.name || `Chapter ${i + 1}`);
      const summary = this.escapeHtml(ch.summary || 'Chapter summary will appear here.').replace(/\n/g, '<br>');
      const basePage = {
        label: `Chapter ${i + 1}`,
        html: `
          <article class="html-chapter-page">
            <div class="html-kicker">Chapter ${i + 1}</div>
            <h1>${name}</h1>
            <p>${summary}</p>
            ${fileMeta}
          </article>`
      };
      const uploadedPages = this.getUploadedHtmlPages(imgs, `Chapter ${i + 1}: ${ch.name || ''}`, {
        name: ch.fileName,
        sizeLabel: ch.fileSize,
        type: 'application/pdf'
      });
      return [basePage, ...uploadedPages];
    });
  },
  getUploadedHtmlPages(items, label, meta = {}) {
    if (!items || !items.length) return [];
    return items.map((src, idx) => {
      const rawSrc = String(src || '');
      const normalizedSrc = /^blob:/.test(rawSrc) && meta.storedUrl ? meta.storedUrl : rawSrc;
      const title = items.length > 1 ? `${label} - Uploaded Page ${idx + 1}` : `${label} - Uploaded File`;
      const safeTitle = this.escapeHtml(title);
      const safeSrc = this.escapeHtml(normalizedSrc);
      const type = String(meta.type || '').toLowerCase();
      const isImage = /^data:image\//i.test(normalizedSrc) || /^image\//i.test(type);
      const isPdfLike = /^data:application\/pdf/i.test(normalizedSrc)
        || /^blob:/i.test(normalizedSrc)
        || /(?:download-pdf|\.pdf)(?:[?#]|$)/i.test(normalizedSrc)
        || type === 'application/pdf';
      if (isPdfLike && !isImage && meta.typeKey && !meta.previewError) {
        this.ensureUploadedPdfRendered(meta.typeKey, normalizedSrc, meta);
      }
      if (!isImage) return null;
      return {
        label: title,
        direct: true,
        html: `
          <img class="html-uploaded-img html-uploaded-direct-img" src="${safeSrc}" alt="${safeTitle}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'html-note html-note-muted',textContent:'Preview image could not be loaded. Please re-upload the file.'}))">`
      };
    }).filter(Boolean);
  },
  renderHtmlPages(pages, emptySub) {
    if (!this.body) return;
    if (!pages || !pages.length) {
      this.body.innerHTML = `
        <div class="pdf-preview-empty">
          <div class="pdf-preview-empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div class="pdf-preview-empty-title">No HTML preview yet</div>
          <div class="pdf-preview-empty-sub">${this.escapeHtml(emptySub || 'Content will appear here.')}</div>
        </div>`;
      this.totalPages = 0;
      this.currentPage = 0;
      this.updatePageIndicators();
      return;
    }
    this.body.innerHTML = pages.map((page, i) => `
      <div class="pdf-preview-page-wrap pdf-preview-html-wrap" data-page="${i + 1}">
        <div class="pdf-preview-html-page${page.direct ? ' pdf-preview-uploaded-direct-page' : ''}" aria-label="${this.escapeHtml(page.label || `Page ${i + 1}`)}">
          ${page.html || ''}
        </div>
      </div>`).join('');
    this.totalPages = pages.length;
    this.currentPage = 1;
    this.applyScale();
    this.updatePageIndicators();
    requestAnimationFrame(() => this.updateVisiblePage());
  },
  updatePageIndicators() {
    const indicator = document.getElementById('pdf-preview-page-indicator');
    const floatPage = document.getElementById('pdf-preview-float-page');
    const cur = this.totalPages ? this.currentPage : 0;
    const total = this.totalPages;
    if (indicator) indicator.textContent = total ? `${cur} / ${total}` : '0 / 0';
    if (floatPage) floatPage.textContent = total ? `Page ${cur} of ${total}` : 'Page 0 of 0';
  },
  updateVisiblePage() {
    if (!this.scrollEl || !this.totalPages) return;
    const wraps = this.scrollEl.querySelectorAll('.pdf-preview-page-wrap');
    if (!wraps.length) return;
    const scrollMid = this.scrollEl.scrollTop + this.scrollEl.clientHeight / 2;
    let active = 1;
    wraps.forEach((wrap, idx) => {
      const top = wrap.offsetTop;
      const bottom = top + wrap.offsetHeight;
      if (scrollMid >= top && scrollMid < bottom) active = idx + 1;
    });
    if (active !== this.currentPage) {
      this.currentPage = active;
      this.updatePageIndicators();
    }
  },
  zoomIn() {
    this.scale = Math.min(this.scale + 0.25, 3);
    this.applyScale();
  },
  zoomOut() {
    this.scale = Math.max(this.scale - 0.25, 0.25);
    this.applyScale();
  },
  applyScale() {
    if (!this.body) return;
    const pct = `${Math.round(this.scale * 100)}%`;
    this.body.querySelectorAll('.pdf-preview-page').forEach(el => {
      el.style.width = `${this.scale * 100}%`;
      el.style.maxWidth = `${960 * this.scale}px`;
    });
    this.body.querySelectorAll('.pdf-preview-html-page').forEach(el => {
      el.style.transform = `scale(${this.scale})`;
      el.style.transformOrigin = 'top center';
      el.parentElement.style.minHeight = `${el.offsetHeight * this.scale}px`;
    });
    this.zoomLabels.forEach(el => { el.textContent = pct; });
  },
  fullScreen() {
    const target = this.viewerEl || this.panel;
    if (!target) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      target.requestFullscreen().catch(() => {});
    }
  },
  download() {
    if (this.body && this.body.querySelector('.pdf-preview-html-page')) {
      toast('Front Matter and Chapters are direct HTML previews. Use Final PDF generation for PDF download.', 'info');
      return;
    }
    const allPages = this.body ? this.body.querySelectorAll('.pdf-preview-page') : [];
    if (!allPages.length) {
      toast('No pages to download', 'info');
      return;
    }
    try {
      this.generateMergedPDF(allPages);
    } catch (e) {
      toast('Failed to generate merged PDF: ' + e.message, 'error');
    }
  },
  getDownloadFilename() {
    const dist = (S.frontMatter && S.frontMatter.district) || 'District';
    const yr = ((S.frontMatter && S.frontMatter.year) || 'year').replace('/', '-');
    const section = this.currentView === 'front-matter' ? 'front-matter'
      : this.currentView === 'chapters' ? 'chapters'
      : this.currentView === 'plates' ? 'plates'
      : this.currentView === 'annexure-b' ? 'annexure-b'
      : this.currentView === 'annexure-c' ? 'annexure-c'
      : this.currentView === 'annexure-d' ? 'annexure-d'
      : this.currentView === 'annexure-e' ? 'annexure-e'
      : this.currentView === 'annexure-f' ? 'annexure-f'
      : this.currentView === 'annexure-g' ? 'annexure-g'
      : this.currentView === 'annexure-h' ? 'annexure-h'
      : this.currentView === 'annexure-i' ? 'annexure-i'
      : this.currentView === 'annexure-j' ? 'annexure-j'
      : this.currentView === 'annexure-k' ? 'annexure-k' : 'preview';
    return `DSR-${dist}-${yr}-${section}.pdf`;
  },
  generateMergedPDF(images) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210, H = 297;
    images.forEach((img, i) => {
      if (i > 0) doc.addPage();
      const src = img.getAttribute('src');
      if (!src) return;
      try { doc.addImage(src, 'JPEG', 0, 0, W, H); }
      catch (e) { try { doc.addImage(src, 'PNG', 0, 0, W, H); } catch (_) {} }
    });
    const fname = this.getDownloadFilename();
    doc.save(fname);
    toast(`Merged PDF saved: ${fname}`, 'success');
  }
};
function getAnnexurePreviewIframe(viewId) {
  const ids = (window.pdfPreview && window.pdfPreview.IFRAME_IDS) || {};
  const preferredId = ids[viewId];
  let iframe = preferredId ? document.getElementById(preferredId) : null;
  if (!iframe) iframe = document.getElementById('pdf-preview-iframe');
  if (!iframe) iframe = document.querySelector('#pdf-preview-viewer iframe');
  return iframe || null;
}
function setAnnexurePreviewIframeSrc(viewId, src) {
  const iframe = getAnnexurePreviewIframe(viewId);
  if (!iframe) return null;
  iframe.style.display = 'block';
  iframe.removeAttribute('srcdoc');
  iframe.src = src || 'about:blank';
  return iframe;
}
function refreshCurrentLivePreview(delay = 80) {
  if (!window.pdfPreview || !pdfPreview.currentView) return;
  const id = pdfPreview.currentView;
  clearTimeout(window.__globalPreviewRefreshTimer);
  window.__globalPreviewRefreshTimer = setTimeout(() => {
    if (id.startsWith('annexure-')) {
      if (id === 'annexure-f' || id === 'annexure-j' || id === 'annexure-k') {
        pdfPreview.generateAnnexureLivePreview(id, 0);
      } else {
        pdfPreview.refresh();
      }
    } else {
      if (typeof refreshCoreAnnexurePreview === 'function' && isCoreAnnexureViewId(id)) {
        refreshCoreAnnexurePreview(id);
      } else {
        pdfPreview.refresh();
      }
    }
  }, delay);
}

function isEditableAnnexureTitleViewId(viewId) {
  return /^(anx[1-7]|annexure-[b-k])$/i.test(String(viewId || ''));
}
function getStoredEditableTitle(key) {
  if (!key) return '';
  try {
    return (localStorage.getItem('global_title_' + key) || '').trim();
  } catch (err) {
    return '';
  }
}
function getEditableAnnexureTitle(viewId, fallback = '') {
  const safeViewId = String(viewId || '');
  if (!isEditableAnnexureTitleViewId(safeViewId)) {
    return fallback || (window.pdfPreview?.SECTION_TITLES?.[safeViewId]) || 'PDF Preview';
  }
  const saved = getStoredEditableTitle(`${safeViewId}-page-title`);
  if (saved) return saved;
  const domTitle = document.querySelector(`#view-${safeViewId} .page-title .editable-title, #view-${safeViewId} .page-title`);
  const domText = (domTitle?.innerText || domTitle?.textContent || '').trim();
  return domText || fallback || (window.pdfPreview?.SECTION_TITLES?.[safeViewId]) || 'PDF Preview';
}
function syncEditableAnnexureTitleUI(viewId) {
  if (!isEditableAnnexureTitleViewId(viewId)) return;
  const title = getEditableAnnexureTitle(viewId);
  const topbarTitle = document.getElementById('topbar-title');
  if (topbarTitle && typeof currentViewId !== 'undefined' && currentViewId === viewId && title) topbarTitle.textContent = title;
  if (window.pdfPreview?.currentView === viewId && window.pdfPreview.titleEl && title) {
    window.pdfPreview.titleEl.textContent = title;
  }
}

function setupEditableTitleEvents(span, viewId) {
  const key = span.getAttribute('data-key');
  if (!key) return;
  
  span.dataset.listenerAdded = 'true';
  span.__editableTitleListenerAdded = true;
  
  // Restore saved value
  let saved = localStorage.getItem('global_title_' + key);
  if (!saved) {
    if (key.startsWith('anx5-')) {
      saved = localStorage.getItem('anx5_heading_' + key);
    } else if (key.startsWith('anx6-')) {
      saved = localStorage.getItem('anx6_heading_' + key);
    }
  }
  if (saved) {
    span.innerText = saved;
  }
  
  const saveVal = () => {
    if (typeof hasAdminAccess === 'function' && !hasAdminAccess()) return;
    const val = span.innerText.trim();
    localStorage.setItem('global_title_' + key, val);
    if (key.startsWith('anx5-')) {
      localStorage.setItem('anx5_heading_' + key, val);
    } else if (key.startsWith('anx6-')) {
      localStorage.setItem('anx6_heading_' + key, val);
    }
    if (key === `${viewId}-page-title`) {
      syncEditableAnnexureTitleUI(viewId);
    }
  };
  
  span.addEventListener('input', () => {
    saveVal();
    if (window.debouncedSaveState) window.debouncedSaveState();
    refreshCurrentLivePreview(120);
  });
  
  span.addEventListener('blur', () => {
    saveVal();
    if (window.debouncedSaveState) window.debouncedSaveState();
    refreshCurrentLivePreview(50);
  });
  
  span.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      span.blur();
    }
  });
}

function makeAllSectionTitlesEditable(viewId) {
  const view = document.getElementById('view-' + viewId);
  if (!view) return;
  const isAnnexure = isEditableAnnexureTitleViewId(viewId);
  if (!isAnnexure) return;
  
  const isAdmin = typeof hasAdminAccess === 'function'
    ? hasAdminAccess()
    : !!(window.S && (S.role === 'admin' || S.user?.role === 'admin'));

  const ensureEditableHeading = (heading, key, iconSize = '14px', forceKey = false) => {
    if (!heading) return null;
    if (heading.closest('.annexure-line-instructions, .annexure-instructions-card')) return null;
    let span = heading.classList.contains('editable-title') ? heading : heading.querySelector(':scope > .editable-title');
    if (!span && heading.matches('span.card-title[contenteditable], .card-title[contenteditable]')) {
      span = heading;
      span.classList.add('editable-title');
    }
    if (!span) {
      const originalText = heading.innerText.trim();
      heading.innerHTML = '';
      span = document.createElement('span');
      span.className = 'editable-title';
      span.innerText = originalText;
      heading.appendChild(span);
    }
    if (forceKey || !span.getAttribute('data-key')) span.setAttribute('data-key', key);

    const iconHost = span === heading ? heading.parentElement : heading;
    if (iconHost && !iconHost.querySelector(':scope > i[data-lucide="pencil-line"], :scope > svg.lucide-pencil-line')) {
      const icon = document.createElement('i');
      icon.setAttribute('data-lucide', 'pencil-line');
      icon.style.width = iconSize;
      icon.style.height = iconSize;
      icon.style.color = 'var(--primary)';
      icon.style.flexShrink = '0';
      if (iconSize === '11px') icon.style.marginLeft = '4px';
      iconHost.appendChild(icon);
    }
    if (heading !== span && !heading.style.display) {
      heading.style.display = 'flex';
      heading.style.alignItems = 'center';
      heading.style.gap = '6px';
    }
    return span;
  };

  // 0. Process the main page title for Annexures I-VII and B-K
  const pageTitle = view.querySelector(':scope > .header-row .page-title, .header-row .page-title');
  ensureEditableHeading(pageTitle, `${viewId}-page-title`, '16px', true);

  // 1. Process all section titles / card titles
  const headingsSelector = '.anx-section-title, .annexure-f-block-title, .annexure-j-block-title, .annexure-k-block-title, .card-title';
  const headings = Array.from(view.querySelectorAll(headingsSelector)).filter(heading => {
    const text = (heading.innerText || '').trim();
    return text && !heading.closest('.header-row, .annexure-line-instructions, .annexure-instructions-card');
  });
  headings.forEach((heading, idx) => {
    ensureEditableHeading(heading, `${viewId}-title-auto-${idx}`, '14px');
  });

  // 2. Process all table headers in Annexures 1-7 and B-K
  if (isAnnexure) {
    const tables = view.querySelectorAll('table.anx-tbl, table');
    tables.forEach((table, tIdx) => {
      const tableId = table.id || `table-idx-${tIdx}`;
      const headers = table.querySelectorAll('thead th');
      headers.forEach((th, thIdx) => {
        const text = th.textContent.trim();
        if (!text || /action|sl\s*no|sl\.no|s\.no|select|delete|edit/i.test(text)) return;
        
        let span = th.querySelector('.editable-title');
        const expectedKey = `${viewId}-${tableId}-th-${thIdx}`;
        th.removeAttribute('contenteditable');
        if (!span) {
          const originalText = th.innerText.trim();
          th.innerHTML = '';
          
          span = document.createElement('span');
          span.className = 'editable-title';
          span.setAttribute('data-key', expectedKey);
          span.innerText = originalText;
          th.appendChild(span);
          
          const icon = document.createElement('i');
          icon.setAttribute('data-lucide', 'pencil-line');
          icon.style.width = '11px';
          icon.style.height = '11px';
          icon.style.color = 'var(--primary)';
          icon.style.flexShrink = '0';
          icon.style.marginLeft = '4px';
          th.appendChild(icon);
        } else {
          span.setAttribute('data-key', expectedKey);
        }
      });
    });
  }

  // 3. Apply Admin vs Non-Admin attributes, borders, cursor, events & icons visibility
  view.querySelectorAll('.editable-title').forEach(span => {
    span.style.fontWeight = '600';
    if (!span.__editableTitleListenerAdded) {
      setupEditableTitleEvents(span, viewId);
    }
    
    if (isAdmin) {
      span.contentEditable = 'true';
      span.style.borderBottom = span.tagName === 'TH' || span.parentElement?.tagName === 'TH' ? '1px dashed #94a3b8' : '2px dashed #94a3b8';
      span.style.cursor = 'text';
      span.style.outline = 'none';
      span.style.padding = span.tagName === 'TH' || span.parentElement?.tagName === 'TH' ? '1px 3px' : '2px 6px';
      span.style.borderRadius = '3px';
    } else {
      span.contentEditable = 'false';
      span.style.borderBottom = 'none';
      span.style.cursor = 'default';
      span.style.outline = 'none';
      span.style.padding = '0';
    }
  });

  view.querySelectorAll('i[data-lucide="pencil-line"], svg.lucide-pencil-line').forEach(el => {
    el.style.display = isAdmin ? '' : 'none';
  });
  
  syncEditableAnnexureTitleUI(viewId);
  if (window.initLucide) window.initLucide();
}

window.refreshCurrentLivePreview = refreshCurrentLivePreview;
window.getEditableAnnexureTitle = getEditableAnnexureTitle;
window.syncEditableAnnexureTitleUI = syncEditableAnnexureTitleUI;
window.setupEditableTitleEvents = setupEditableTitleEvents;
window.makeAllSectionTitlesEditable = makeAllSectionTitlesEditable;

window.getAnnexurePreviewIframe = getAnnexurePreviewIframe;
window.setAnnexurePreviewIframeSrc = setAnnexurePreviewIframeSrc;
window.pdfPreview = pdfPreview;
const PROJECT_WORKSPACE_VIEWS = new Set([
  'workflow',
  'front-matter',
  'chapters',
  'plates',
  'replenishment',
  'graphs',
  'anx1',
  'anx2',
  'anx3',
  'anx4',
  'anx5',
  'anx6',
  'anx7',
  'annexure-b',
  'annexure-c',
  'annexure-d',
  'annexure-e',
  'annexure-f',
  'annexure-g',
  'annexure-h',
  'annexure-i',
  'annexure-j',
  'annexure-k',
  'demand-table',
  'auction-table',
  'summary-table',
  'benchmark-table',
  'generate'
]);
function updateProjectWorkspaceShell() {
  const viewId = typeof currentViewId === 'string' ? currentViewId : '';
  const hasProject = Boolean(window.S && S.activeProject);
  const isProjectWorkspace = hasProject && PROJECT_WORKSPACE_VIEWS.has(viewId);
  const isMobileShell = window.matchMedia && window.matchMedia('(max-width: 1280px)').matches;
  document.body.classList.toggle('project-workspace-active', isProjectWorkspace);
  document.body.classList.remove('project-workspace-inactive');
  document.body.classList.toggle('dashboard-layout-active', Boolean(viewId));
  const sidebar = document.getElementById('sidebar');
  if (isMobileShell) {
    if (sidebar) sidebar.classList.remove('mobile-open');
    document.body.classList.remove('mobile-sidebar-open');
    document.body.classList.add('sidebar-hidden');
  } else if (sidebar) {
    sidebar.classList.remove('mobile-open');
    document.body.classList.remove('mobile-sidebar-open');
  }
  hydrateSidebarTooltips();
  if (typeof updateSidebarToggleVisibility === 'function') updateSidebarToggleVisibility();
}
function hydrateSidebarTooltips() {
  document.querySelectorAll('#sidebar .sb-item').forEach((item) => {
    const label = Array.from(item.childNodes)
      .map((node) => node.nodeType === Node.TEXT_NODE ? node.textContent : (node.classList && !node.classList.contains('sb-ico') ? node.textContent : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (label) {
      item.dataset.tooltip = label;
      item.setAttribute('title', label);
    }
    if (item.dataset.tooltipReady === '1') return;
    item.dataset.tooltipReady = '1';
    item.addEventListener('mouseenter', () => {
      const rect = item.getBoundingClientRect();
      item.style.setProperty('--tooltip-y', `${rect.top + (rect.height / 2)}px`);
    }, { passive: true });
  });
}
function initializeDashboardSidebarState() {
  const isMobileShell = window.matchMedia && window.matchMedia('(max-width: 1280px)').matches;
  if (isMobileShell) {
    setSidebarCollapsed(true);
    return;
  }
  let stored = null;
  try {
    stored = localStorage.getItem('dsr_sidebar_collapsed');
  } catch (_) {}
  setSidebarCollapsed(stored === '1');
}
function initProjectWorkspaceShell() {
  if (window.__projectWorkspaceShellReady) return;
  window.__projectWorkspaceShellReady = true;
  initializeDashboardSidebarState();
  hydrateSidebarTooltips();
  const originalShowView = window.showView;
  if (typeof originalShowView === 'function') {
    window.showView = function(id, btn, push) {
      const result = originalShowView.apply(this, arguments);
      setTimeout(updateProjectWorkspaceShell, 0);
      return result;
    };
  }
  const originalOpenProject = window.openProject;
  if (typeof originalOpenProject === 'function') {
    window.openProject = async function(id) {
      const result = await originalOpenProject.apply(this, arguments);
      updateProjectWorkspaceShell();
      return result;
    };
  }
  const originalClearActiveProject = window.clearActiveProject;
  if (typeof originalClearActiveProject === 'function') {
    window.clearActiveProject = function() {
      const result = originalClearActiveProject.apply(this, arguments);
      updateProjectWorkspaceShell();
      return result;
    };
  }
  window.addEventListener('resize', updateProjectWorkspaceShell);
  updateProjectWorkspaceShell();
}
function initPreviewSplitResizer() {
  if (window.__previewSplitResizerReady) return;
  const workspace = document.querySelector('.app-workspace');
  const resizer = document.getElementById('pdf-preview-resizer');
  if (!workspace || !resizer) return;
  window.__previewSplitResizerReady = true;
  const minEditor = 55;
  const maxEditor = 75;
  const storageKey = 'dsr_preview_editor_split';
  const clamp = value => Math.max(minEditor, Math.min(maxEditor, value));
  const applySplit = value => {
    const editor = clamp(Number(value) || 62);
    const preview = 100 - editor;
    workspace.style.setProperty('--editor-split', `${editor}%`);
    workspace.style.setProperty('--preview-split', `${preview}%`);
    document.documentElement.style.setProperty('--editor-split', `${editor}%`);
    document.documentElement.style.setProperty('--preview-split', `${preview}%`);
    resizer.setAttribute('aria-valuenow', String(Math.round(editor)));
  };
  const saved = Number(localStorage.getItem(storageKey));
  if (!Number.isNaN(saved) && saved > 0) applySplit(saved);
  const updateFromPointer = event => {
    const rect = workspace.getBoundingClientRect();
    if (!rect.width) return;
    applySplit(((event.clientX - rect.left) / rect.width) * 100);
  };
  resizer.setAttribute('aria-valuemin', String(minEditor));
  resizer.setAttribute('aria-valuemax', String(maxEditor));
  resizer.addEventListener('pointerdown', event => {
    if (!document.body.classList.contains('preview-open')) return;
    event.preventDefault();
    resizer.setPointerCapture?.(event.pointerId);
    document.body.classList.add('preview-resizing');
    updateFromPointer(event);
    const onMove = moveEvent => updateFromPointer(moveEvent);
    const onUp = upEvent => {
      updateFromPointer(upEvent);
      document.body.classList.remove('preview-resizing');
      resizer.releasePointerCapture?.(event.pointerId);
      const current = parseFloat(getComputedStyle(workspace).getPropertyValue('--editor-split'));
      if (!Number.isNaN(current)) localStorage.setItem(storageKey, String(clamp(current)));
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  });
  resizer.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const current = parseFloat(getComputedStyle(workspace).getPropertyValue('--editor-split')) || 62;
    const next = event.key === 'Home' ? minEditor
      : event.key === 'End' ? maxEditor
      : current + (event.key === 'ArrowRight' ? 2 : -2);
    applySplit(next);
    localStorage.setItem(storageKey, String(clamp(next)));
  });
}
window.addEventListener('DOMContentLoaded', () => {
  pdfPreview.init();
  initProjectWorkspaceShell();
  initPreviewSplitResizer();
});

;
