/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   SIGNATURES & CHECKLISTS
 â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function renderSignatures() {
  const el=document.getElementById('sig-list'); if(!el) return;
  el.innerHTML=S.signatures.map((s,i)=>{
    const prevSigned=i===0||S.signatures[i-1].signed;
    const canSign=prevSigned&&!s.signed;
    return `<div class="sig-card">
      <div class="sig-num" style="background:${s.signed?'var(--green-lt)':canSign?'var(--saffron-lt)':'var(--bg)'};color:${s.signed?'var(--green)':canSign?'var(--saffron)':'var(--text-faint)'};display:flex;align-items:center;justify-content:center;">
        <i data-lucide="${s.signed?'check':canSign?'clock':'lock'}" style="width:16px;height:16px;"></i>
      </div>
      <div class="sig-info">
        <div class="sig-role">Authority ${s.order} - ${s.role}</div>
        <div class="sig-name">${s.name}</div>
        <div class="sig-dept">${s.dept}</div>
        ${s.signed?`<div style="font-size:10.5px;color:var(--green);margin-top:3px">Signed: ${s.signedAt} via ${s.method}</div>
        ${s.signatureImage ? `<div style="margin-top:6px; background:white; padding:4px; border-radius:4px; display:inline-block;"><img src="${s.signatureImage}" style="height:35px; border-bottom:1px solid #ddd; filter: brightness(0); mix-blend-mode: multiply;"></div>` : ''}`:''}
      </div>
      <div class="sig-status">
        <span class="badge ${s.signed?'badge-green':canSign?'badge-saffron':'badge-gray'}" style="display:inline-flex;align-items:center;gap:4px;">
          <i data-lucide="${s.signed?'check':canSign?'clock':'lock'}" style="width:12px;height:12px;"></i>
          ${s.signed?'Signed':canSign?'Pending':'Locked'}
        </span>
        ${canSign?`<button class="btn btn-saffron btn-xs" onclick="openSign(${s.id})">Sign Now</button>`:''}
      </div>
    </div>`;
  }).join('');
  const pendingCountEl = document.getElementById('sb-pending-sigs');
  if (pendingCountEl) pendingCountEl.textContent=S.signatures.filter(s=>!s.signed).length;
  initLucide();
}
function openSign(id) {
  const s=S.signatures.find(x=>x.id===id);
  document.getElementById('sign-modal-title').textContent=`Sign - ${s.role}`;
  document.getElementById('sign-modal-content').innerHTML=`
    <div style="background:var(--off);border:1px solid var(--border);border-radius:var(--r-md);padding:14px;margin-bottom:14px">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-faint);margin-bottom:4px">Signing as</div>
      <div style="font-size:14px;font-weight:700;color:var(--text)">${s.name}</div>
      <div style="font-size:11.5px;color:var(--text-soft)">${s.dept}</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:9px">
      <label style="display:flex;align-items:center;gap:9px;cursor:pointer;font-size:12.5px"><input type="checkbox" checked> I have reviewed the complete DSR report</label>
      <label style="display:flex;align-items:center;gap:9px;cursor:pointer;font-size:12.5px"><input type="checkbox" checked> I certify the data accuracy and EMGSM 2020 compliance</label>
      <label style="display:flex;align-items:center;gap:9px;cursor:pointer;font-size:12.5px"><input type="checkbox" checked> I authorize forwarding to the next authority</label>
    </div>
    <div style="margin-top:12px"><label style="font-size:11px;font-weight:700;color:var(--text-mid);text-transform:uppercase;letter-spacing:.04em">Sign Method</label>
      <div style="display:flex;gap:8px;margin-top:6px">
        <label class="btn btn-outline btn-xs" style="cursor:pointer"><input type="radio" name="signmethod" value="aadhaar" checked style="margin-right:4px"> Aadhaar eSign</label>
        <label class="btn btn-outline btn-xs" style="cursor:pointer"><input type="radio" name="signmethod" value="dsc" style="margin-right:4px"> DSC</label>
        <label class="btn btn-outline btn-xs" style="cursor:pointer"><input type="radio" name="signmethod" value="otp" style="margin-right:4px"> OTP</label>
      </div>
    </div>`;
  S.pendingOTPsigId=id;
  document.getElementById('sign-otp').value='';
  document.getElementById('modal-sign').classList.add('open');
  initSignaturePad();
  initLucide();
}
let sigCanvas, sigCtx, isSigDrawing = false;
function initSignaturePad(canvasId = 'signature-pad') {
  sigCanvas = document.getElementById(canvasId);
  if(!sigCanvas) return;
  sigCtx = sigCanvas.getContext('2d');
  clearSignatureCanvas();
  sigCanvas.onmousedown = (e) => { isSigDrawing = true; drawSig(e); };
  sigCanvas.onmouseup = () => { isSigDrawing = false; sigCtx.beginPath(); };
  sigCanvas.onmousemove = drawSig;
  sigCanvas.onmouseout = () => { isSigDrawing = false; sigCtx.beginPath(); };
  sigCanvas.ontouchstart = (e) => { e.preventDefault(); isSigDrawing = true; drawSig(e.touches[0]); };
  sigCanvas.ontouchend = (e) => { e.preventDefault(); isSigDrawing = false; sigCtx.beginPath(); };
  sigCanvas.ontouchmove = (e) => { e.preventDefault(); drawSig(e.touches[0]); };
}
function drawSig(e) {
  if(!isSigDrawing) return;
  const rect = sigCanvas.getBoundingClientRect();
  const scaleX = sigCanvas.width / rect.width;
  const scaleY = sigCanvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;
  sigCtx.lineWidth = 3;
  sigCtx.lineCap = 'round';
  sigCtx.strokeStyle = document.documentElement.classList.contains('dark') ? '#ffffff' : '#0d1d36';
  sigCtx.lineTo(x, y);
  sigCtx.stroke();
  sigCtx.beginPath();
  sigCtx.moveTo(x, y);
}
function clearSignatureCanvas() {
  if(!sigCtx) return;
  sigCtx.clearRect(0,0,sigCanvas.width, sigCanvas.height);
  sigCtx.beginPath();
}
function doSign() {
  const otp=document.getElementById('sign-otp').value;
  if (otp!=='123456') { toast('Invalid OTP. Demo: 123456','error'); return; }
  const s=S.signatures.find(x=>x.id===S.pendingOTPsigId);
  if (s) {
    s.signed=true; s.signedAt=new Date().toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'});
    const method=document.querySelector('input[name="signmethod"]:checked')?.value||'Aadhaar eSign';
    s.method=method==='aadhaar'?'Aadhaar eSign':method==='dsc'?'DSC Token':'OTP Verified';
    if(sigCanvas) {
      s.signatureImage = sigCanvas.toDataURL('image/png');
    }
  }
  closeModal('modal-sign');
  renderSignatures(); renderFinalChecklist();
  if (S.activeProject && S.activeProject.id) {
    const stateSnapshot = {
      frontMatter: S.frontMatter, chapters: S.chapters, plates: S.plates, graphs: S.graphs,
      graphCharts: S.graphCharts, signatures: S.signatures, demandDistricts: S.demandDistricts,
      summarySources: S.summarySources, auctionData: S.auctionData, uploadedPDFs: S.uploadedPDFs,
      annexureB: S.annexureB, annexureC: S.annexureC, annexureD: S.annexureD, annexureE: S.annexureE,
      annexureG: S.annexureG, annexureH: S.annexureH, annexureI: S.annexureI, annexureJ: S.annexureJ
    };
    apiFetch(`/projects/${S.activeProject.id}/state`, {
      method: 'PUT',
      body: JSON.stringify({ state: JSON.stringify(stateSnapshot) })
    }).then(() => {
      toast('Signed successfully! Next authority has been notified.','success');
      const nextSig=S.signatures.find(x=>!x.signed);
      if (nextSig) toast(`Notification sent to ${nextSig.role}`,'info');
      else toast('All signatures complete! PDF can now be generated.','success');
    }).catch(e => {
      console.error('Failed to persist signature:', e);
      toast('Error saving signature to server.','error');
    });
  } else {
    toast('Signed successfully (Local).','success');
  }
}
function renderFinalChecklist() {
  const el = document.getElementById('final-checklist');
  if (!el) return;
  const p = S.activeProject;
  if (!p) {
    el.innerHTML = '<div style="font-size:12.5px;color:var(--text-soft);text-align:center;padding:20px 0;">Please select a project first.</div>';
    return;
  }
  
  const fmOk = !!(
    S.uploadedPDFs && 
    S.uploadedPDFs.cover && 
    S.uploadedPDFs.cert && 
    S.uploadedPDFs.toc && 
    (S.uploadedPDFs.pref || (S.frontMatter && S.frontMatter.preface && S.frontMatter.preface.trim().length > 10)) && 
    (S.uploadedPDFs.ack || (S.frontMatter && S.frontMatter.acknowledgement && S.frontMatter.acknowledgement.trim().length > 10))
  );

  const uploadedChaptersCount = S.chapters ? S.chapters.filter(ch => ch.fileName || (S.chapterPDFs && S.chapterPDFs[ch.id])).length : 0;
  const chaptersOk = S.chapters && S.chapters.length >= 2 && uploadedChaptersCount >= S.chapters.length;

  const uploadedPlatesCount = S.plates ? S.plates.filter(pl => pl.fileName).length : 0;
  const platesOk = S.plates && S.plates.length > 0 && uploadedPlatesCount >= S.plates.length;

  const graphsOk = !!(S.graphsOpened || (S.graphs && S.graphs.length > 0));

  const anx1Ok = S.uploadedPDFs && !!S.uploadedPDFs.anx1;
  const anx2Ok = S.uploadedPDFs && !!S.uploadedPDFs.anx2;
  const anx3Ok = S.uploadedPDFs && !!S.uploadedPDFs.anx3;
  const anx4Ok = S.uploadedPDFs && !!S.uploadedPDFs.anx4;
  const anx5Ok = S.uploadedPDFs && !!S.uploadedPDFs.anx5;
  const anx6Ok = S.uploadedPDFs && !!S.uploadedPDFs.anx6;
  const anx7Ok = S.uploadedPDFs && !!S.uploadedPDFs.anx7;
  const annexuresOk = !!(S.annexuresOpened || (anx1Ok && anx2Ok && anx3Ok && anx4Ok && anx5Ok && anx6Ok && anx7Ok));

  const hasTableData = (S.annexureB && S.annexureB.length > 0) || 
                       (S.annexureC && S.annexureC.length > 0) || 
                       (S.annexureD && S.annexureD.length > 0) || 
                       (S.annexureE && S.annexureE.length > 0) ||
                       (S.annexureG && S.annexureG.length > 0) ||
                       (S.annexureH && S.annexureH.length > 0) ||
                       (S.annexureI && S.annexureI.length > 0) ||
                       (S.annexureJ && S.annexureJ.length > 0) ||
                       (S.auctionData && S.auctionData.length > 0);
  const tablesOk = !!(S.tablesOpened || hasTableData);

  const pdfOk = !!(S.activeProject && (S.activeProject.finalPdfName || S.activeProject.finalPdfGeneratedAt));

  // Sequential locked conditions
  const setupOk = true;
  const step2Done = setupOk && fmOk;
  const step3Done = step2Done && chaptersOk;
  const step4Done = step3Done && platesOk;
  const graphsDone = step4Done && graphsOk;
  const step5Done = graphsDone && annexuresOk;
  const step6Done = step5Done && tablesOk;
  const step7Done = step6Done && pdfOk;

  const items = [
    { n: 'Project Setup', ok: setupOk, note: 'District, year, mineral type' },
    { n: 'Front Matter', ok: step2Done, note: step2Done ? 'Cover page, certificate, table of contents, preface and acknowledgement completed' : (setupOk ? 'Pending Cover, Certificate, Table of Contents, Preface, or Acknowledgement upload' : 'Locked - complete previous stages first') },
    { n: 'All Chapters', ok: step3Done, note: step3Done ? 'All chapters uploaded/filled' : (step2Done ? `${uploadedChaptersCount}/${S.chapters ? S.chapters.length : 2} chapters uploaded/filled` : 'Locked - complete previous stages first') },
    { n: 'Plate Section', ok: step4Done, note: step4Done ? 'All plates setup' : (step3Done ? `${uploadedPlatesCount}/${S.plates ? S.plates.length : 2} plates setup` : 'Locked - complete previous stages first') },
    { n: 'Cross Section Graphs', ok: graphsDone, note: graphsDone ? 'Cross sections generated or opened' : (step4Done ? 'Pending generation or page view' : 'Locked - complete previous stages first') },
    { n: 'Annexures I-VII', ok: step5Done, note: step5Done ? 'All 7 annexure PDFs uploaded or opened' : (graphsDone ? 'Pending Annexure I to VII PDF upload or page view' : 'Locked - complete previous stages first') },
    { n: 'Annexures B to K', ok: step6Done, note: step6Done ? 'Annexures B to K opened' : (step5Done ? 'Pending tables page view' : 'Locked - complete previous stages first') },
    { n: 'Report PDF Generation', ok: step7Done, note: step7Done ? 'Final DSR report generated' : (step6Done ? 'Pending final report compilation' : 'Locked - complete previous stages first') }
  ];

  el.innerHTML = items.map(it => `
    <div style="display:flex;align-items:center;gap:9px;padding:8px 0;border-bottom:1px solid var(--border)">
      <span style="display:flex;align-items:center;color:${it.ok ? 'var(--green)' : 'var(--text-faint)'}">
        <i data-lucide="${it.ok ? 'check-circle-2' : 'circle'}" style="width:16px;height:16px;"></i>
      </span>
      <div style="flex:1">
        <div style="font-size:12.5px;font-weight:600;color:${it.ok ? 'var(--text)' : 'var(--text-soft)'}">${it.n}</div>
        <div style="font-size:10.5px;color:var(--text-soft)">${it.note}</div>
      </div>
      <span class="badge ${it.ok ? 'badge-green' : 'badge-amber'}">${it.ok ? 'Done' : 'Pending'}</span>
    </div>`).join('');

  const countEl = document.getElementById('pdf-page-count');
  if (countEl) countEl.textContent = S.activeProject?.finalPdfPages || `~${(S.chapters.length * 4) + (S.plates.length * 1) + 32} estimated`;
  const resultBox = document.getElementById('final-pdf-result');
  if (resultBox) resultBox.style.display = S.activeProject?.finalPdfName ? 'block' : 'none';
  if (typeof updateFinalPdfAdminUI === 'function') updateFinalPdfAdminUI();
  if (window.initLucide) initLucide();
}

function renderWorkflowChecklist() {
  const el=document.getElementById('workflow-checklist'); if(!el) return;
  const p = S.activeProject;
  if (!p) {
    el.innerHTML = '<div style="font-size:12.5px;color:var(--text-soft);text-align:center;padding:20px 0;">Please select a project above to view workflow completion checklist.</div>';
    return;
  }
  
  const fmOk = !!(
    S.uploadedPDFs && 
    S.uploadedPDFs.cover && 
    S.uploadedPDFs.cert && 
    S.uploadedPDFs.toc && 
    (S.uploadedPDFs.pref || (S.frontMatter && S.frontMatter.preface && S.frontMatter.preface.trim().length > 10)) && 
    (S.uploadedPDFs.ack || (S.frontMatter && S.frontMatter.acknowledgement && S.frontMatter.acknowledgement.trim().length > 10))
  );

  const uploadedChaptersCount = S.chapters ? S.chapters.filter(ch => ch.fileName || (S.chapterPDFs && S.chapterPDFs[ch.id])).length : 0;
  const chaptersOk = S.chapters && S.chapters.length >= 2 && uploadedChaptersCount >= S.chapters.length;

  const uploadedPlatesCount = S.plates ? S.plates.filter(pl => pl.fileName).length : 0;
  const platesOk = S.plates && S.plates.length > 0 && uploadedPlatesCount >= S.plates.length;

  const graphsOk = !!(S.graphsOpened || (S.graphs && S.graphs.length > 0));

  const anx1Ok = S.uploadedPDFs && !!S.uploadedPDFs.anx1;
  const anx2Ok = S.uploadedPDFs && !!S.uploadedPDFs.anx2;
  const anx3Ok = S.uploadedPDFs && !!S.uploadedPDFs.anx3;
  const anx4Ok = S.uploadedPDFs && !!S.uploadedPDFs.anx4;
  const anx5Ok = S.uploadedPDFs && !!S.uploadedPDFs.anx5;
  const anx6Ok = S.uploadedPDFs && !!S.uploadedPDFs.anx6;
  const anx7Ok = S.uploadedPDFs && !!S.uploadedPDFs.anx7;
  const annexuresOk = !!(S.annexuresOpened || (anx1Ok && anx2Ok && anx3Ok && anx4Ok && anx5Ok && anx6Ok && anx7Ok));

  const hasTableData = (S.annexureB && S.annexureB.length > 0) || 
                       (S.annexureC && S.annexureC.length > 0) || 
                       (S.annexureD && S.annexureD.length > 0) || 
                       (S.annexureE && S.annexureE.length > 0) ||
                       (S.annexureG && S.annexureG.length > 0) ||
                       (S.annexureH && S.annexureH.length > 0) ||
                       (S.annexureI && S.annexureI.length > 0) ||
                       (S.annexureJ && S.annexureJ.length > 0) ||
                       (S.auctionData && S.auctionData.length > 0);
  const tablesOk = !!(S.tablesOpened || hasTableData);

  const pdfOk = !!(S.activeProject && (S.activeProject.finalPdfName || S.activeProject.finalPdfGeneratedAt));

  // Sequential locked conditions
  const setupOk = true;
  const step2Done = setupOk && fmOk;
  const step3Done = step2Done && chaptersOk;
  const step4Done = step3Done && platesOk;
  const graphsDone = step4Done && graphsOk;
  const step5Done = graphsDone && annexuresOk;
  const step6Done = step5Done && tablesOk;
  const step7Done = step6Done && pdfOk;

  const items=[
    {n:'Project Setup',ok:setupOk,note:'District, year, mineral type'},
    {n:'Front Matter',ok:step2Done,note:step2Done ? 'Cover page, certificate, table of contents, preface and acknowledgement completed' : (setupOk ? 'Pending Cover, Certificate, Table of Contents, Preface, or Acknowledgement upload' : 'Locked - complete previous stages first')},
    {n:'All Chapters',ok:step3Done,note:step3Done ? 'All chapters uploaded/filled' : (step2Done ? `${uploadedChaptersCount}/${S.chapters ? S.chapters.length : 2} chapters uploaded/filled` : 'Locked - complete previous stages first')},
    {n:'Plate Section',ok:step4Done,note:step4Done ? 'All plates setup' : (step3Done ? `${uploadedPlatesCount}/${S.plates ? S.plates.length : 2} plates setup` : 'Locked - complete previous stages first')},
    {n:'Cross Section Graphs',ok:graphsDone,note:graphsDone ? 'Cross sections generated or opened' : (step4Done ? 'Pending generation or page view' : 'Locked - complete previous stages first')},
    {n:'Annexures I-VII',ok:step5Done,note:step5Done ? 'All 7 annexure PDFs uploaded or opened' : (graphsDone ? 'Pending Annexure I to VII PDF upload or page view' : 'Locked - complete previous stages first')},
    {n:'Annexures B to K',ok:step6Done,note:step6Done ? 'Annexures B to K opened' : (step5Done ? 'Pending tables page view' : 'Locked - complete previous stages first')},
    {n:'Report PDF Generation',ok:step7Done,note:step7Done ? 'Final DSR report generated' : (step6Done ? 'Pending final report compilation' : 'Locked - complete previous stages first')}
  ];
  el.innerHTML=items.map(it=>`
    <div style="display:flex;align-items:center;gap:9px;padding:8px 0;border-bottom:1px solid var(--border)">
      <span style="display:flex;align-items:center;color:${it.ok?'var(--green)':'var(--text-faint)'}">
        <i data-lucide="${it.ok?'check-circle-2':'circle'}" style="width:16px;height:16px;"></i>
      </span>
      <div style="flex:1"><div style="font-size:12.5px;font-weight:600;color:${it.ok?'var(--text)':'var(--text-soft)'}">${it.n}</div><div style="font-size:10.5px;color:var(--text-soft)">${it.note}</div></div>
      <span class="badge ${it.ok?'badge-green':'badge-amber'}">${it.ok?'Done':'Pending'}</span>
    </div>`).join('');
  if (window.initLucide) initLucide();
}

function renderWorkflowStepBar() {
  const el = document.getElementById('workflow-step-bar');
  if (!el) return;
  const p = S.activeProject;
  if (!p) {
    el.innerHTML = `
      <div class="step">
        <div class="step-dot">1</div>
        <div class="step-lbl">Project Setup</div>
      </div>
      <div class="step">
        <div class="step-dot">2</div>
        <div class="step-lbl">Front Matter</div>
      </div>
      <div class="step">
        <div class="step-dot">3</div>
        <div class="step-lbl">Chapters</div>
      </div>
      <div class="step">
        <div class="step-dot">4</div>
        <div class="step-lbl">Plates</div>
      </div>
      <div class="step">
        <div class="step-dot">5</div>
        <div class="step-lbl">Annexures</div>
      </div>
      <div class="step">
        <div class="step-dot">6</div>
        <div class="step-lbl">Annexures B-K</div>
      </div>
      <div class="step">
        <div class="step-dot">7</div>
        <div class="step-lbl">PDF</div>
      </div>
    `;
    return;
  }

  const step1Done = true;
  const step2Done = step1Done && !!(
    S.uploadedPDFs && 
    S.uploadedPDFs.cover && 
    S.uploadedPDFs.cert && 
    S.uploadedPDFs.toc && 
    (S.uploadedPDFs.pref || (S.frontMatter && S.frontMatter.preface && S.frontMatter.preface.trim().length > 10)) && 
    (S.uploadedPDFs.ack || (S.frontMatter && S.frontMatter.acknowledgement && S.frontMatter.acknowledgement.trim().length > 10))
  );
  const uploadedChaptersCount = S.chapters ? S.chapters.filter(ch => ch.fileName || (S.chapterPDFs && S.chapterPDFs[ch.id])).length : 0;
  const step3Done = step2Done && (S.chapters && S.chapters.length >= 2 && uploadedChaptersCount >= S.chapters.length);
  const uploadedPlatesCount = S.plates ? S.plates.filter(pl => pl.fileName).length : 0;
  const step4Done = step3Done && (S.plates && S.plates.length > 0 && uploadedPlatesCount >= S.plates.length);
  
  const anx1Ok = S.uploadedPDFs && !!S.uploadedPDFs.anx1;
  const anx2Ok = S.uploadedPDFs && !!S.uploadedPDFs.anx2;
  const anx3Ok = S.uploadedPDFs && !!S.uploadedPDFs.anx3;
  const anx4Ok = S.uploadedPDFs && !!S.uploadedPDFs.anx4;
  const anx5Ok = S.uploadedPDFs && !!S.uploadedPDFs.anx5;
  const anx6Ok = S.uploadedPDFs && !!S.uploadedPDFs.anx6;
  const anx7Ok = S.uploadedPDFs && !!S.uploadedPDFs.anx7;
  const step5Done = step4Done && (S.annexuresOpened || (anx1Ok && anx2Ok && anx3Ok && anx4Ok && anx5Ok && anx6Ok && anx7Ok));
  const hasTableData = (S.annexureB && S.annexureB.length > 0) || 
                       (S.annexureC && S.annexureC.length > 0) || 
                       (S.annexureD && S.annexureD.length > 0) || 
                       (S.annexureE && S.annexureE.length > 0) ||
                       (S.annexureG && S.annexureG.length > 0) ||
                       (S.annexureH && S.annexureH.length > 0) ||
                       (S.annexureI && S.annexureI.length > 0) ||
                       (S.annexureJ && S.annexureJ.length > 0) ||
                       (S.auctionData && S.auctionData.length > 0);
  const step6Done = step5Done && (S.tablesOpened || hasTableData);
  const step7Done = step6Done && !!(S.activeProject && (S.activeProject.finalPdfName || S.activeProject.finalPdfGeneratedAt));

  let activeStep = 1;
  if (!step1Done) activeStep = 1;
  else if (!step2Done) activeStep = 2;
  else if (!step3Done) activeStep = 3;
  else if (!step4Done) activeStep = 4;
  else if (!step5Done) activeStep = 5;
  else if (!step6Done) activeStep = 6;
  else if (!step7Done) activeStep = 7;
  else activeStep = 8; // All done

  const steps = [
    { num: 1, label: 'Project Setup', done: step1Done, labelText: 'OK' },
    { num: 2, label: 'Front Matter', done: step2Done, labelText: '2' },
    { num: 3, label: 'Chapters', done: step3Done, labelText: '3' },
    { num: 4, label: 'Plates', done: step4Done, labelText: '4' },
    { num: 5, label: 'Annexures', done: step5Done, labelText: '5' },
    { num: 6, label: 'Annexures B-K', done: step6Done, labelText: '6' },
    { num: 7, label: 'PDF', done: step7Done, labelText: '7' }
  ];

  el.innerHTML = steps.map(s => {
    let classes = 'step';
    if (s.done) classes += ' done';
    if (s.num === activeStep) classes += ' active';
    const dotText = s.done ? 'OK' : s.labelText;
    return `
      <div class="${classes}">
        <div class="step-dot">${dotText}</div>
        <div class="step-lbl">${s.label}</div>
      </div>
    `;
  }).join('');
  if (window.initLucide) initLucide();
}

function generateFinalPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  const W=210, pad=15;
  let y=20;
  const dist=document.getElementById('pdf-district')?.value||'Jalandhar';
  const yr=document.getElementById('pdf-year')?.value||'2025-26';
  const govBlue=[26,51,102];
  const navyArr=[11,29,58];
  const saffron=[224,123,0];
  const addPageHeader=(section)=>{
    doc.setFillColor(...navyArr); doc.rect(0,0,W,14,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(255,255,255);
    doc.text('DISTRICT SURVEY REPORT - GOVERNMENT OF PUNJAB Â· EMGSM 2020',W/2,8,{align:'center'});
    doc.text(section,W-pad,8,{align:'right'});
    doc.setDrawColor(224,123,0); doc.setLineWidth(0.8); doc.line(pad,15,W-pad,15);
  };
  let coverInserted = false;
  if (S.uploadedPDFs && S.uploadedPDFs.cover && S.uploadedPDFs.cover.length) {
    S.uploadedPDFs.cover.forEach((img, idx) => {
      if (idx > 0) doc.addPage();
      try { doc.addImage(img, 'PNG', 0, 0, W, 297); } catch(e) { try { doc.addImage(img, 'JPEG', 0, 0, W, 297); } catch(_){} }
    });
    coverInserted = true;
  }
  if (!coverInserted) {
    addPageHeader('COVER PAGE');
    doc.setTextColor(...govBlue); doc.setFont('helvetica','bold'); doc.setFontSize(11);
    doc.text('Enforcement & Monitoring Guidelines for Sand Mining', W/2, 30, {align:'center'});
    doc.setDrawColor(...govBlue); doc.setLineWidth(0.5); doc.line(pad,33,W-pad,33);
    doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.setTextColor(...navyArr);
    doc.text(S.frontMatter.title.toUpperCase(), W/2, 55, {align:'center', maxWidth: W - 2*pad});
    doc.setFontSize(14); doc.text('FOR SAND MINING', W/2, 65, {align:'center'});
    doc.setFontSize(20); doc.setTextColor(...saffron);
    doc.text(S.frontMatter.district.toUpperCase() + ' DISTRICT', W/2, 80, {align:'center'});
    doc.setFontSize(13); doc.setTextColor(...navyArr); doc.text(S.frontMatter.state + ' Â· ' + S.frontMatter.year, W/2, 90, {align:'center'});
    doc.setFontSize(10); doc.setTextColor(...govBlue);
    const prepLines = doc.splitTextToSize('PREPARED BY: ' + S.frontMatter.preparedBy.toUpperCase(), W - 2*pad);
    doc.text(prepLines, W/2, 130, {align:'center'});
    const assistLines = doc.splitTextToSize('ASSISTED BY: ' + S.frontMatter.assistedBy.toUpperCase(), W - 2*pad);
    doc.text(assistLines, W/2, 130 + (prepLines.length * 6), {align:'center'});
  }
  ['cert','toc'].forEach(type => {
    const pages = S.uploadedPDFs && S.uploadedPDFs[type];
    if (pages && pages.length) {
      pages.forEach(img => { doc.addPage(); try { doc.addImage(img, 'PNG', 0, 0, W, 297); } catch(e) { try { doc.addImage(img, 'JPEG', 0, 0, W, 297); } catch(_){} } });
    }
  });
  let prefaceInserted = false;
  if (S.uploadedPDFs && S.uploadedPDFs.pref && S.uploadedPDFs.pref.length) {
    S.uploadedPDFs.pref.forEach(img => { doc.addPage(); try { doc.addImage(img, 'PNG', 0, 0, W, 297); } catch(e) { try { doc.addImage(img, 'JPEG', 0, 0, W, 297); } catch(_){} } });
    prefaceInserted = true;
  }
  if (!prefaceInserted && S.frontMatter.preface) {
    doc.addPage(); y = 25; addPageHeader('PREFACE');
    doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(...navyArr);
    doc.text('PREFACE', W/2, y, {align:'center'}); y += 15;
    doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(50,50,70);
    const prefLines = doc.splitTextToSize(S.frontMatter.preface, W - 2*pad);
    doc.text(prefLines, pad, y);
  }
  if (S.frontMatter.acknowledgement) {
    doc.addPage(); y = 25; addPageHeader('ACKNOWLEDGEMENT');
    doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(...navyArr);
    doc.text('ACKNOWLEDGEMENT', W/2, y, {align:'center'}); y += 15;
    doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(50,50,70);
    const ackLines = doc.splitTextToSize(S.frontMatter.acknowledgement, W - 2*pad);
    doc.text(ackLines, pad, y);
  }
  doc.addPage(); y=25; addPageHeader('CONTENTS');
  doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(...navyArr);
  doc.text('TABLE OF CONTENTS', W/2, y, {align:'center'}); y+=12;
  S.chapters.forEach((ch,i)=>{
    if (y>265){doc.addPage();y=20;addPageHeader('CONTENTS');}
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(50,50,80);
    doc.text(`${i+1}.  ${ch.name}`, pad, y); y+=7;
  });
  S.chapters.forEach((ch,i)=>{
    doc.addPage(); addPageHeader('CHAPTER '+(i+1));
    y=25;
    doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(...navyArr);
    doc.text(ch.name, pad, y, {maxWidth:W-2*pad}); y+=14;
    doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(60,60,80);
    const lines=doc.splitTextToSize(ch.summary, W-2*pad);
    doc.text(lines, pad, y); y+=lines.length*6+8;
    const chapterPages = S.chapterPDFs && S.chapterPDFs[ch.id];
    if (chapterPages && chapterPages.length) {
      doc.setFontSize(9); doc.setTextColor(120,120,140);
      doc.text(`[Chapter content appended from uploaded file: ${ch.fileName || 'document.pdf'}]`, pad, y);
      chapterPages.forEach((img, pageIdx) => {
        doc.addPage();
        doc.setFillColor(...navyArr); doc.rect(0, 0, W, 14, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(255, 255, 255);
        doc.text(`DISTRICT SURVEY REPORT - ${dist.toUpperCase()} Â· EMGSM 2020`, W/2, 8, {align:'center'});
        doc.text(`CHAPTER ${i+1} - UPLOADED CONTENT (Pg ${pageIdx + 1}/${chapterPages.length})`, W-pad, 8, {align:'right'});
        doc.setDrawColor(224,123,0); doc.setLineWidth(0.8); doc.line(pad,15,W-pad,15);
        doc.setDrawColor(200,200,200); doc.setLineWidth(0.5);
        doc.rect(pad, 20, W - 2*pad, 260); // Frame
        try {
          doc.addImage(img, 'PNG', pad + 1, 21, W - 2*pad - 2, 258);
        } catch(e) {
          try { doc.addImage(img, 'JPEG', pad + 1, 21, W - 2*pad - 2, 258); } catch(_){}
        }
      });
    } else {
      doc.setFontSize(9); doc.setTextColor(120,120,140);
      doc.text('[Full chapter content to be included from uploaded PDF or text data]', pad, y);
    }
  });
  if (S.graphs.length) {
    doc.addPage(); addPageHeader('CROSS SECTION ANALYSIS'); y=25;
    doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(...navyArr);
    doc.text('CROSS SECTION ANALYSIS & SANDBAR CALCULATIONS', W/2, y, {align:'center'}); y+=12;
    S.graphs.forEach(g=>{
      if (y>220){doc.addPage();y=20;addPageHeader('CROSS SECTION');}
      const o=calcGraph(g);
      doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...navyArr);
      doc.text(g.name, pad, y); y+=7;
      doc.autoTable({
        startY:y,margin:{left:pad,right:pad},styles:{fontSize:9},
        headStyles:{fillColor:navyArr},
        head:[['Metric','Value','Unit']],
        body:[
          ['Average Thickness',o.avgThick.toFixed(3),'m'],
          ['Potential Area',o.pArea.toFixed(2),'Ha'],
          ['Volume',fmtN(o.volume,0),'mÂ³'],
          ['Allowed Excavation',fmtN(o.allowed,0),'MT'],
          ['Bulk Density',g.bulk,'g/cc'],
          ['Mining %',g.pct+'%','EMGSM 2020']
        ]
      });
      y=doc.lastAutoTable.finalY+10;
      const canvas = document.getElementById('canvas-' + g.id + '-post') || document.getElementById('canvas-' + g.id);
      if (canvas) {
        if (y > 200) { doc.addPage(); y=20; addPageHeader('CROSS SECTION GRAPH'); }
        try {
          const imgData = canvas.toDataURL('image/png', 1.0);
          doc.addImage(imgData, 'PNG', pad, y, W - 2*pad, 65);
          y += 75;
        } catch(e) { console.error('Canvas capture failed', e); }
      }
    });
  }
  if (S.plates.length) {
    doc.addPage(); addPageHeader('PLATE SECTION'); y=25;
    doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(...navyArr);
    doc.text('PLATE SECTION - MAPS & SITE PHOTOGRAPHS', W/2, y, {align:'center'}); y+=10;
    S.plates.forEach((p,i)=>{
      if (y>250){doc.addPage();y=20;addPageHeader('PLATES');}
      doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(60,60,80);
      const fileStatus = p.fileName ? `[File: ${p.fileName}]` : '[No file uploaded]';
      doc.text(`Plate ${i+1}: ${p.name}  ${fileStatus}`, pad, y); y+=7;
    });
    S.plates.forEach((p, i) => {
      if (p.pages && p.pages.length) {
        p.pages.forEach((img, pageIdx) => {
          doc.addPage();
          doc.setFillColor(...navyArr); doc.rect(0, 0, W, 12, 'F');
          doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(255, 255, 255);
          doc.text(`PLATE ${i+1}: ${p.name.toUpperCase()} (Page ${pageIdx + 1}/${p.pages.length})`, pad, 8);
          try {
            doc.addImage(img, 'JPEG', 0, 12, W, 285);
          } catch(e) {
            try {
              doc.addImage(img, 'PNG', 0, 12, W, 285);
            } catch(e2) {
              console.error(`Failed to add plate ${i+1} page to PDF:`, e2);
            }
          }
        });
      }
    });
  }
  const allTablesData = [
    { title: 'ANNEXURE I(a) - RIVERS', id: '#anx1-rivers' },
    { title: 'ANNEXURE I(b) - DE-SILTATION', id: '#anx1-desilt' },
    { title: 'ANNEXURE I(c) - PATTA LANDS', id: '#anx1-patta' },
    { title: 'ANNEXURE I(d) - M-SAND PLANTS', id: '#anx1-msand' },
    { title: 'ANNEXURE II(a) - MINING LEASES', id: '#anx2-leases' },
    { title: 'ANNEXURE II(b) - PATTA LANDS', id: '#anx2-patta' },
    { title: 'ANNEXURE II(c) - DE-SILTATION', id: '#anx2-desilt' },
    { title: 'ANNEXURE II(d) - M-SAND PLANTS', id: '#anx2-msand' },
    { title: 'ANNEXURE III(a) - CLUSTERS', id: '#anx3-clusters' },
    { title: 'ANNEXURE III(b) - CONTIGUOUS CLUSTERS', id: '#anx3-contiguous' },
    { title: 'ANNEXURE IV(a) - LEASE ROUTES', id: '#anx4-routes' },
    { title: 'ANNEXURE IV(b) - CLUSTER ROUTES', id: '#anx4-cluster-routes' },
    { title: 'ANNEXURE V - BENCH MARK & CORS', id: '#anx5-benchmarks' },
    { title: 'ANNEXURE V - MINING LEASES', id: '#anx5-mining' },
    { title: 'ANNEXURE V - PATTA LANDS', id: '#anx5-patta' },
    { title: 'ANNEXURE V - DE-SILTATION', id: '#anx5-desilt' },
    { title: 'ANNEXURE V - M-SAND PLANTS', id: '#anx5-msand' },
    { title: 'ANNEXURE VI - FINAL CLUSTERS', id: '#anx6-final-clusters' },
    { title: 'ANNEXURE VI - CONTIGUOUS CLUSTERS', id: '#anx6-contiguous-clusters' },
    { title: 'ANNEXURE VII - INDIVIDUAL ROUTES', id: '#anx7-routes' },
    { title: 'ANNEXURE VII - CLUSTER ROUTES', id: '#anx7-cluster-routes' },
    { title: 'ANNEXURE VII - FINAL PATTA LANDS', id: '#anx7-patta-final' },
    { title: 'ANNEXURE F - SAND GHATS', id: '#annexure-f-sand' },
    { title: 'ANNEXURE F - BENCH MARKS', id: '#annexure-f-benchmark' },
    { title: 'ANNEXURE F - CORS STATIONS', id: '#annexure-f-cors' },
    { title: 'ANNEXURE K - PROFORMA AUCTIONED SITES', id: '#annexure-k-proforma' },
    { title: 'ANNEXURE K - ANNEXURE A', id: '#annexure-k-annexure-a' },
    { title: 'ADDITIONAL - SAND GHATS COORDS', id: '#anx-coords-tbl' },
    { title: 'ADDITIONAL - BENCH MARKS', id: '#anx-benchmark-tbl' },
    { title: 'ADDITIONAL - CORS STATIONS', id: '#anx-cors-tbl' },
    { title: 'ADDITIONAL - FINAL CLUSTERS', id: '#anx-final-clusters-tbl' },
    { title: 'ADDITIONAL - FINAL PATTA LANDS', id: '#anx-patta-final-tbl' },
    { title: 'ADDITIONAL - FINAL DE-SILTATION', id: '#anx-desilt-final-tbl' },
    { title: 'DATA TABLE - PROJECTED DEMAND', id: '#demand-tbl' },
    { title: 'DATA TABLE - AUCTIONED SITES', id: '#auction-tbl' },
    { title: 'DATA TABLE - SOURCE SUMMARY', id: '#summary-tbl' }
  ];
  allTablesData.forEach((tblConfig, index) => {
    const baseId = tblConfig.id.replace('#', '');
    const tables = Array.from(document.querySelectorAll(`table[id^="${baseId}"]`));
    tables.forEach((tableEl, tblIdx) => {
      if (tableEl && tableEl.rows.length > 1) { // ensure it has rows beyond header
        doc.addPage(); addPageHeader(tblConfig.title.split(' - ')[0]); y=25;
        doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(...navyArr);
        let title = tblConfig.title;
        if (tables.length > 1) {
          title += ` (Table ${tblIdx + 1})`;
        }
        doc.text(title, W/2, y, {align:'center'}); y+=10;
        const head = []; const body = []; const foot = [];
        tableEl.querySelectorAll('thead tr').forEach(tr => {
          const rowData = [];
          getPrintableTableCells(tr).forEach(cell => rowData.push(cell.innerText.trim()));
          head.push(rowData);
        });
        tableEl.querySelectorAll('tbody tr').forEach(tr => {
          const rowData = [];
          getPrintableTableCells(tr).forEach(cell => {
            const select = cell.querySelector('select');
            rowData.push(select ? select.value : cell.innerText.trim().replace('âœ•',''));
          });
          body.push(rowData);
        });
        tableEl.querySelectorAll('tfoot tr').forEach(tr => {
          const rowData = [];
          getPrintableTableCells(tr).forEach(cell => {
            const colspan = parseInt(cell.getAttribute('colspan') || '1', 10);
            rowData.push({ content: cell.innerText.trim(), colSpan: colspan });
          });
          foot.push(rowData);
        });
        doc.autoTable({
          startY: y, margin: {left:pad, right:pad}, styles: {fontSize: 7, cellPadding: 2},
          headStyles: {fillColor: navyArr},
          footStyles: {fillColor: [240,240,245], textColor: navyArr, fontStyle: 'bold'},
          head: head,
          body: body,
          foot: foot.length > 0 ? foot : false,
          theme: 'grid'
        });
      }
    });
    const currentPrefix = tblConfig.title.split('(')[0].trim().split(' ')[0] + ' ' + tblConfig.title.split('(')[0].trim().split(' ')[1]; // E.g. "ANNEXURE I"
    const nextTblConfig = allTablesData[index + 1];
    let nextPrefix = '';
    if (nextTblConfig) {
      nextPrefix = nextTblConfig.title.split('(')[0].trim().split(' ')[0] + ' ' + nextTblConfig.title.split('(')[0].trim().split(' ')[1];
    }
    if (currentPrefix !== nextPrefix && currentPrefix.startsWith('ANNEXURE')) {
      let uploadKey = '';
      if (currentPrefix === 'ANNEXURE I') uploadKey = 'anx1';
      else if (currentPrefix === 'ANNEXURE II') uploadKey = 'anx2';
      else if (currentPrefix === 'ANNEXURE III') uploadKey = 'anx3';
      else if (currentPrefix === 'ANNEXURE IV') uploadKey = 'anx4';
      if (uploadKey && S.uploadedPDFs && S.uploadedPDFs[uploadKey] && S.uploadedPDFs[uploadKey].length > 0) {
        S.uploadedPDFs[uploadKey].forEach((img, pageIdx) => {
          doc.addPage();
          doc.setFillColor(...navyArr); doc.rect(0, 0, W, 14, 'F');
          doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(255, 255, 255);
          doc.text(`DISTRICT SURVEY REPORT - ${dist.toUpperCase()} Â· EMGSM 2020`, W/2, 8, {align:'center'});
          doc.text(`${currentPrefix} - UPLOADED DOCUMENT (Pg ${pageIdx + 1}/${S.uploadedPDFs[uploadKey].length})`, W-pad, 8, {align:'right'});
          doc.setDrawColor(224,123,0); doc.setLineWidth(0.8); doc.line(pad,15,W-pad,15);
          doc.setDrawColor(200,200,200); doc.setLineWidth(0.5);
          doc.rect(pad, 20, W - 2*pad, 260); // Frame
          try { 
            doc.addImage(img, 'PNG', pad + 1, 21, W - 2*pad - 2, 258); 
          } catch(e) { 
            try { doc.addImage(img, 'JPEG', pad + 1, 21, W - 2*pad - 2, 258); } catch(_){} 
          }
        });
      }
    }
  });
  const total=doc.getNumberOfPages();
  for (let p=1;p<=total;p++) {
    doc.setPage(p);
    doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(120,120,140);
    doc.setDrawColor(200,200,200); doc.line(pad,287,W-pad,287);
    const line1 = `PREPARED BY: SUB-DIVISIONAL COMMITTEE OF ${dist.toUpperCase()} DISTRICT`;
    const line2 = `ASSISTED BY: RSP GREEN DEVELOPMENT AND LABORATORIES PVT. LTD`;
    doc.text(line1, W / 2, 291, { align: 'center' });
    doc.text(line2, W / 2, 294, { align: 'center' });
    doc.text(`Page ${p} of ${total}`, W-pad, 292, {align:'right'});
  }
  const fname=`DSR-${dist}-${yr.replace('/','-')}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fname);
  toast('PDF generated: '+fname,'success');
}
async function generateFinalPDF(regenerate = false) {
  if (!canAccessFinalDsrPdf()) {
    showFinalPdfAccessDenied();
    return;
  }
  const progressBox = document.getElementById('final-pdf-progress');
  const progressLabel = document.getElementById('final-pdf-progress-label');
  const progressPct = document.getElementById('final-pdf-progress-pct');
  const progressBar = document.getElementById('final-pdf-progress-bar');
  const warningBox = null;
  const resultBox = document.getElementById('final-pdf-result');
  const generateBtn = document.getElementById('final-pdf-generate-btn');
  const setProgress = (label, pct) => {
    if (progressBox) progressBox.style.display = 'block';
    if (progressLabel) progressLabel.textContent = label;
    if (progressPct) progressPct.textContent = `${pct}%`;
    if (progressBar) progressBar.style.width = `${pct}%`;
  };
  const showWarnings = (warnings) => {
    if (!warningBox) return;
    if (!warnings.length) {
      warningBox.style.display = 'none';
      warningBox.innerHTML = '';
      return;
    }
    warningBox.style.display = 'block';
    warningBox.innerHTML = `<strong>Warnings:</strong><br>${warnings.map(w => `- ${w}`).join('<br>')}`;
  };
  try {
    if (!window.jspdf || !window.jspdf.jsPDF || !window.jspdf.jsPDF.API.autoTable) {
      setProgress('Loading PDF engine...', 5);
      await ensurePortalVendors(['jspdf', 'autotable']);
    }
    if (generateBtn) generateBtn.disabled = true;
    if (resultBox) resultBox.style.display = 'none';
    setProgress('Collecting Data...', 12);
    if (typeof persistProjectState === 'function') {
      await persistProjectState();
    }
    const warnings = [];
    setProgress('Building PDF...', 28);
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210;
    const H = 297;
    const pad = 12;
    const tableWidth = W - (pad * 2);
    const pageFrameMargin = 5;
    const imagePageMargin = 4;
    const navy = [11, 29, 58];
    const blue = [26, 51, 102];
    const saffron = [196, 154, 88];
    const muted = [86, 96, 112];
    const district = document.getElementById('pdf-district')?.value || S.frontMatter?.district || S.activeProject?.district || 'Punjab';
    const year = document.getElementById('pdf-year')?.value || S.frontMatter?.year || S.activeProject?.year || '2025-26';
    const version = document.getElementById('pdf-version')?.value || S.frontMatter?.version || 'Final Approved Draft';
    const generatedAt = new Date();
    const sectionStarts = [];
    const titlePages = [];
    const uploadedPages = [];
    const borderPages = [];
    let borderActive = false;
    const originalAddPage = doc.addPage.bind(doc);
    doc.addPage = function(...args) {
      originalAddPage(...args);
      const pNum = doc.getCurrentPageInfo().pageNumber;
      if (borderActive) {
        borderPages.push(pNum);
      }
    };
    let isFirstPage = true;
    const safe = (value, fallback = '-') => String(value ?? fallback).trim() || fallback;
    const hasText = (value) => String(value ?? '').trim().length > 0;
    const hexToRgb = (hex, fallback = [245, 158, 11]) => {
      const value = String(hex || '').replace('#', '').trim();
      if (!/^[0-9a-f]{6}$/i.test(value)) return fallback;
      return [0, 2, 4].map(index => parseInt(value.slice(index, index + 2), 16));
    };

    const addTitlePage = (titleText, subtitleText = '') => {
      if (isFirstPage) {
        isFirstPage = false;
      } else {
        doc.addPage();
      }
      const pNum = doc.getCurrentPageInfo().pageNumber;
      titlePages.push(pNum);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(0, 0, 0);
      doc.text(titleText, W / 2, H / 2 - 10, { align: 'center', maxWidth: W - 40 });
      const isRedundant = subtitleText && (
        titleText.toLowerCase().includes(subtitleText.toLowerCase()) || 
        subtitleText.toLowerCase().includes(titleText.toLowerCase()) ||
        titleText.toLowerCase().replace(/[^a-z0-9]/g, '') === subtitleText.toLowerCase().replace(/[^a-z0-9]/g, '')
      );
      if (subtitleText && !isRedundant) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(subtitleText, W / 2, H / 2 + 5, { align: 'center', maxWidth: W - 40 });
      }
    };

    const addHeader = (sectionTitle) => {
      // Stub to satisfy table of contents calls or fallbacks
    };

    const beginSection = (title) => {
      doc.addPage();
      return 25;
    };

    const writeParagraph = (text, y, options = {}) => {
      if (!hasText(text)) return y;
      doc.setFont('helvetica', options.bold ? 'bold' : 'normal');
      doc.setFontSize(options.size || 10);
      doc.setTextColor(...(options.color || [0, 0, 0]));
      const lines = doc.splitTextToSize(String(text), options.width || W - (pad * 2));
      doc.text(lines, options.x || pad, y);
      return y + (lines.length * (options.lineHeight || 5.5)) + (options.after || 6);
    };

    const getImageFormat = (src) => /^data:image\/jpe?g/i.test(String(src || '')) ? 'JPEG' : 'PNG';
    const drawFittedImagePage = (src) => {
      const format = getImageFormat(src);
      const props = doc.getImageProperties(src);
      
      const topMargin = 7;
      const leftMargin = 7;
      const bottomMargin = 20; // leaves space at the bottom (ends at y=277)
      
      const maxW = W - (leftMargin * 2);
      const maxH = H - topMargin - bottomMargin;
      
      const ratio = Math.min(maxW / props.width, maxH / props.height);
      const drawW = props.width * ratio;
      const drawH = props.height * ratio;
      const x = (W - drawW) / 2;
      const y = topMargin + (maxH - drawH) / 2;
      
      doc.addImage(src, format, x, y, drawW, drawH, undefined, 'FAST');
    };

    const addImagePage = (src, title) => {
      if (!src) return;
      if (isFirstPage) {
        isFirstPage = false;
      } else {
        doc.addPage();
      }
      const pNum = doc.getCurrentPageInfo().pageNumber;
      uploadedPages.push(pNum);
      try {
        drawFittedImagePage(src);
      } catch (err) {
        try {
          doc.addImage(src, 'JPEG', 7, 7, W - 14, H - 27, undefined, 'FAST');
        } catch (innerErr) {
          console.warn('Could not embed uploaded page:', innerErr);
        }
      }
    };
    const addPreviewImagePage = (src, title) => {
      if (!src) return;
      if (isFirstPage) {
        isFirstPage = false;
      } else {
        doc.addPage();
      }
      const pNum = doc.getCurrentPageInfo().pageNumber;
      uploadedPages.push(pNum);
      try {
        drawFittedImagePage(src);
      } catch (err) {
        try {
          doc.addImage(src, 'JPEG', 7, 7, W - 14, H - 27, undefined, 'FAST');
        } catch (innerErr) {
          console.warn('Could not embed live preview page:', innerErr);
        }
      }
    };

    const addUploadedPages = (pages, title) => {
      if (!Array.isArray(pages) || !pages.length) return false;
      pages.forEach((page, index) => addImagePage(page, `${title} - Page ${index + 1}`));
      return true;
    };

    const tableRowsFromElement = (table) => {
      if (!table) return null;
      const getCells = (row) => getPrintableTableCells(row)
        .map(cell => {
          const select = cell.querySelector('select');
          const input = cell.querySelector('input');
          const textarea = cell.querySelector('textarea');
          let val = '';
          if (select) {
            val = select.value;
          } else if (input) {
            val = input.value;
          } else if (textarea) {
            val = textarea.value;
          } else {
            val = cell.innerText || '';
          }
          val = val.replace(/\s+/g, ' ').trim();
          return val || 'NA';
        });
      const head = Array.from(table.querySelectorAll('thead tr')).map(getCells).filter(row => row.some(Boolean));
      const bodyRows = Array.from(table.querySelectorAll('tbody tr'))
        .map(row => ({ cells: getCells(row), meta: { origin: row.dataset.phaseOrigin || '', color: row.dataset.phaseColor || '' } }))
        .filter(row => row.cells.some(Boolean));
      const body = bodyRows.map(row => row.cells);
      if (!head.length && !body.length) return null;
      if (!body.some(row => row.some(cell => cell && !/^na$/i.test(cell)))) return null;
      return { head: head.length ? head : [body.shift() || ['Details']], body, rowMeta: bodyRows.map(row => row.meta) };
    };

    const addTable = (table, title) => {
      if (!table) return false;
      const clone = table.cloneNode(true);
      clone.querySelectorAll('select').forEach(select => {
        const val = select.value || '';
        const textNode = document.createTextNode(val || 'NA');
        select.parentNode.replaceChild(textNode, select);
      });
      clone.querySelectorAll('input, textarea').forEach(input => {
        const val = input.value || '';
        const textNode = document.createTextNode(val || 'NA');
        input.parentNode.replaceChild(textNode, input);
      });
      clone.querySelectorAll('td, th').forEach(cell => {
        cell.querySelectorAll('button, a, .btn, .actions, .edit-btn, .delete-btn').forEach(el => el.remove());
        const txt = (cell.textContent || '').trim();
        if (!txt) {
          cell.textContent = 'NA';
        }
      });
      doc.addPage();
      let y = 25;
      y = writeParagraph(title, y, { bold: true, size: 11, color: [0, 0, 0], after: 6 });
      doc.autoTable({
        html: clone,
        startY: y,
        margin: { left: pad, right: pad },
        tableWidth,
        theme: 'grid',
        styles: { fontSize: 7.5, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.2, textColor: [0, 0, 0], overflow: 'linebreak' },
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', lineColor: [0, 0, 0], lineWidth: 0.2 },
        alternateRowStyles: { fillColor: [255, 255, 255] }
      });
      return true;
    };

    const addPhaseChangeSummary = () => {
      if (typeof getPhaseChangeSummaryRows !== 'function') return false;
      const rows = getPhaseChangeSummaryRows();
      if (!rows.length) return false;
      doc.addPage();
      let y = 25;
      y = writeParagraph('Phase Change Summary', y, { bold: true, size: 12, color: [0, 0, 0], after: 6 });
      y = writeParagraph(`This report is generated for ${getProjectPhaseLabel(S.activeProject)}. Imported Phase 1 data remains locked; new and updated Phase 2 records are tracked with color metadata.`, y, { size: 9.5, after: 6 });
      doc.autoTable({
        startY: y,
        margin: { left: pad, right: pad },
        tableWidth,
        head: [['Type', 'Record / Section', 'Color']],
        body: rows.map(row => [row[0], row[1], row[2]]),
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2.4, lineColor: [0, 0, 0], lineWidth: 0.2, textColor: [0, 0, 0] },
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', lineColor: [0, 0, 0], lineWidth: 0.2 }
      });
      return true;
    };

    const addTables = (configs) => {
      let added = false;
      configs.forEach(cfg => {
        const tables = cfg.all ? Array.from(document.querySelectorAll(cfg.selector)) : [document.querySelector(cfg.selector)].filter(Boolean);
        tables.forEach((table, index) => {
          const suffix = tables.length > 1 ? ` (${index + 1})` : '';
          if (addTable(table, cfg.title + suffix)) added = true;
        });
      });
      return added;
    };

    const addEntryList = (title, entries) => {
      const rows = (entries || []).filter(item => hasText(item.name) || hasText(item.summary) || (item.pages && item.pages.length));
      if (!rows.length) return false;
      doc.addPage();
      let y = 25;
      y = writeParagraph(title, y, { bold: true, size: 12, color: [0, 0, 0], after: 8 });
      rows.forEach((item, index) => {
        if (y > 260) {
          doc.addPage();
          y = 25;
          y = writeParagraph(`${title} Continued`, y, { bold: true, size: 12, color: [0, 0, 0], after: 8 });
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`${index + 1}. ${safe(item.name, 'Entry')}`, pad, y);
        y += 6;
        y = writeParagraph(item.summary || '', y, { size: 9, after: 4 });
        if (item.fileName) {
          y = writeParagraph(`Attachment: ${item.fileName}`, y, { size: 8.5, color: [100, 100, 100], after: 6 });
        }
        addUploadedPages(item.pages, `${title} - ${safe(item.name, `Entry ${index + 1}`)}`);
      });
      return true;
    };

    const addGraphSection = () => {
      if (!Array.isArray(S.graphs) || !S.graphs.length) return false;
      addTitlePage('CROSS SECTION GRAPHS');
      sectionStarts.push({ title: 'Cross Section Graphs', page: doc.getCurrentPageInfo().pageNumber });
      S.graphs.forEach((g, index) => {
        doc.addPage();
        let y = 25;
        y = writeParagraph(`${index + 1}. ${safe(g.name || g.subName, 'Cross Section')}`, y, { bold: true, size: 12, color: [0, 0, 0] });
        const calc = typeof calcGraph === 'function' ? calcGraph(g) : null;
        doc.autoTable({
          startY: y,
          margin: { left: pad, right: pad },
          tableWidth,
          head: [['Metric', 'Value']],
          body: [
            ['Distance Points', safe(g.dist)],
            ['Post Monsoon Levels', safe(g.post)],
            ['Reduced Level', safe(g.red)],
            ['Thalweg Level', safe(g.thal)],
            ['Area', safe(g.area)],
            ['Bulk Density', safe(g.bulk)],
            ['Mining Percentage', safe(g.pct) + '%'],
            ['Estimated Volume', calc ? fmtN(calc.volume, 0) : '-']
          ],
          styles: { fontSize: 8, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.2, textColor: [0, 0, 0] },
          headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', lineColor: [0, 0, 0], lineWidth: 0.2 },
          theme: 'grid'
        });
        y = doc.lastAutoTable.finalY + 8;
        const canvas = document.getElementById(`canvas-${g.id}-post`) || document.getElementById(`canvas-${g.id}`);
        if (canvas) {
          try {
            doc.addImage(canvas.toDataURL('image/png', 1), 'PNG', pad, y, tableWidth, 65);
          } catch (err) {
            console.warn('Cross-section canvas capture failed:', err);
          }
        }
      });
      return true;
    };

    const addFrontMatter = () => {
      // Handled inline in main execution flow to enforce Cover -> TOC -> Preface/Chapters order
      return true;
    };

    const addChapter = (chapterNo) => {
      const ch = (S.chapters || []).find(item => Number(item.id) === chapterNo) || (S.chapters || [])[chapterNo - 1];
      if (!ch || (!hasText(ch.name) && !hasText(ch.summary) && !S.chapterPDFs?.[ch.id]?.length)) return false;
      const chapterTitle = `CHAPTER ${chapterNo}`;
      const chapterSub = ch.name || '';
      addTitlePage(chapterTitle, chapterSub);
      sectionStarts.push({ title: `Chapter ${chapterNo} - ${chapterSub}`, page: doc.getCurrentPageInfo().pageNumber });
      doc.addPage();
      let y = 25;
      y = writeParagraph(ch.name || `Chapter ${chapterNo}`, y, { bold: true, size: 14, color: [0, 0, 0], after: 8 });
      y = writeParagraph(ch.summary || 'Chapter content will be appended from uploaded project records.', y);
      if (ch.fileName) {
        y = writeParagraph(`Uploaded source: ${ch.fileName}`, y, { size: 8.5, color: [100, 100, 100] });
      }
      addUploadedPages(S.chapterPDFs?.[ch.id], `Chapter ${chapterNo}`);
      return true;
    };

    const addPlates = () => {
      if (!Array.isArray(S.plates) || !S.plates.length) return false;
      S.plates.forEach((plate, index) => {
        const plateTitle = `PLATE ${plate.id || (index + 1)}`;
        const plateSub = plate.name || '';
        addTitlePage(plateTitle, plateSub);
        sectionStarts.push({ title: `${plateTitle} - ${plateSub}`, page: doc.getCurrentPageInfo().pageNumber });
        doc.addPage();
        let y = 25;
        y = writeParagraph(`${plateTitle} Â· ${safe(plate.name, 'Plate')}`, y, { bold: true, size: 13, color: [0, 0, 0], after: 5 });
        y = writeParagraph(plate.summary || 'No plate description has been entered.', y, { size: 9.5, after: 6 });
        if (plate.fileName) {
          y = writeParagraph(`Attachment: ${plate.fileName}`, y, { size: 8.5, color: [100, 100, 100], after: 5 });
        }
        const source = Array.isArray(plate.pages)
          ? plate.pages.find(page => /^data:image\//i.test(String(page || '')))
          : '';
        if (source) {
          try {
            const format = /^data:image\/jpeg/i.test(source) ? 'JPEG' : 'PNG';
            doc.addImage(source, format, pad, y, tableWidth, H - y - 16, undefined, 'FAST');
          } catch (err) {
            console.warn('Could not embed plate attachment:', err);
          }
        } else {
          writeParagraph('No PDF or image has been uploaded for this plate.', y + 10, { size: 9, color: muted });
        }
      });
      return true;
    };

    const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const withTimeout = (promise, ms, label) => Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), ms))
    ]);
    const dataUrlToBlob = async (dataUrl) => {
      const res = await fetch(dataUrl);
      return res.blob();
    };
    const pdfBlobToImages = async (blob) => {
      await ensurePortalVendors(['pdfjs']);
      const arrayBuffer = await blob.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pages = [];
      for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
        const page = await pdf.getPage(pageNo);
        const viewport = page.getViewport({ scale: 1.7 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport }).promise;
        pages.push(canvas.toDataURL('image/jpeg', 0.92));
      }
      return pages;
    };
    const htmlPreviewToPdfBlob = async (iframe, filename, elementToRender) => {
      await ensurePortalVendors(['html2pdf']);
      const body = iframe?.contentDocument?.body;
      const target = elementToRender || body;
      if (!target) return null;
      const opt = {
        margin: 0,
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, windowWidth: target.scrollWidth || document.body.scrollWidth },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', 'h4'] }
      };
      return withTimeout(
        html2pdf().set(opt).from(target).toPdf().get('pdf').then(pdf => pdf.output('blob')),
        9000,
        filename
      );
    };
    const getPreviewIframe = (viewId) => {
      if (window.getAnnexurePreviewIframe) return window.getAnnexurePreviewIframe(viewId);
      const ids = window.pdfPreview?.IFRAME_IDS || {};
      return document.getElementById(ids[viewId] || 'pdf-preview-iframe');
    };
    const waitForPreviewBlob = async (viewId) => {
      const iframe = getPreviewIframe(viewId);
      for (let attempt = 0; attempt < 30; attempt += 1) {
        const src = iframe?.getAttribute('src') || '';
        if (src && src !== 'about:blank') {
          if (src.startsWith('blob:') || src.startsWith('http')) return withTimeout(fetch(src).then(res => res.blob()), 6000, `${viewId} preview fetch`);
          if (src.startsWith('data:application/pdf')) return dataUrlToBlob(src);
        }
        if (iframe?.srcdoc && iframe.contentDocument?.body) {
          return htmlPreviewToPdfBlob(iframe, `${viewId}.pdf`);
        }
        await waitFor(150);
      }
      return null;
    };
    const addPagesFromPreviewBlob = async (viewId, title) => {
      const blob = await waitForPreviewBlob(viewId);
      if (!blob) return false;
      const pages = await pdfBlobToImages(blob);
      if (!pages.length) return false;
      pages.forEach((page, index) => addPreviewImagePage(page, `${title} - Page ${index + 1}`));
      return true;
    };
    const addLivePreviewHtmlPages = async (title, viewId) => {
      if (!window.pdfPreview || typeof pdfPreview.buildAnnexureHtmlDocument !== 'function') return false;
      let html = pdfPreview.buildAnnexureHtmlDocument(viewId);
      if (!html) return false;
      const iframe = document.createElement('iframe');
      const previewWidth = 1040; // Force standard high-res width
      html = html.replace('</style>', `
            body{width:${previewWidth}px!important;max-width:${previewWidth}px!important;}
            .sheet{width:${previewWidth}px!important;max-width:${previewWidth}px!important;box-shadow:none!important;margin:0!important;}
          </style>`);
      iframe.style.position = 'fixed';
      iframe.style.left = '-10000px';
      iframe.style.top = '0';
      iframe.style.width = `${previewWidth}px`;
      iframe.style.height = '1200px';
      iframe.style.border = '0';
      iframe.style.pointerEvents = 'none';
      iframe.setAttribute('aria-hidden', 'true');
      document.body.appendChild(iframe);
      try {
        await ensurePortalVendors(['html2pdf', 'pdfjs']);
        iframe.srcdoc = html;
        await withTimeout(new Promise(resolve => {
          iframe.onload = () => resolve();
          setTimeout(resolve, 250);
        }), 3000, `${viewId} HTML preview render`);
        const body = iframe.contentDocument?.body;
        if (body) {
          body.style.width = `${previewWidth}px`;
          body.style.maxWidth = `${previewWidth}px`;
          body.style.overflow = 'visible';
          iframe.style.height = (body.scrollHeight + 100) + 'px';
        }
        const elementToRender = body?.querySelector('.sheet') || body;
        if (!elementToRender) return false;
        
        const blob = await htmlPreviewToPdfBlob(iframe, `${viewId}.pdf`, elementToRender);
        if (!blob) return false;
        const pages = await pdfBlobToImages(blob);
        if (!pages.length) return false;
        pages.forEach((page, index) => addPreviewImagePage(page, `${title} - Page ${index + 1}`));
        return true;
      } catch (err) {
        console.warn(`Could not merge ${viewId} from HTML live preview:`, err);
        return false;
      } finally {
        iframe.remove();
      }
    };
    const addAnnexureExportBlobPages = async (title, viewId) => {
      try {
        await ensurePortalVendors(['jspdf', 'autotable', 'pdfjs']);
        let blob = null;
        if (viewId === 'annexure-f' && typeof exportAnnexureFPDF === 'function') {
          blob = await exportAnnexureFPDF(null, false, true);
        } else if (viewId === 'annexure-j' && typeof exportAnnexureJPDF === 'function') {
          blob = await exportAnnexureJPDF(null, false, null, true);
        } else if (viewId === 'annexure-k' && typeof exportAnnexureKPDF === 'function') {
          blob = await exportAnnexureKPDF(null, false, true);
        }
        if (!blob) return false;
        const pages = await pdfBlobToImages(blob);
        if (!pages.length) return false;
        pages.forEach((page, index) => addPreviewImagePage(page, `${title} - Page ${index + 1}`));
        return true;
      } catch (err) {
        console.warn(`Could not merge ${viewId} from generated annexure PDF:`, err);
        return false;
      }
    };
    const simpleAnnexurePreviewIds = ['annexure-b', 'annexure-c', 'annexure-d', 'annexure-e', 'annexure-g', 'annexure-h', 'annexure-i'];
    const ensureSimpleAnnexurePreviewState = (viewId) => {
      const letter = viewId.replace('annexure-', '').toUpperCase();
      const stateKey = `annexure${letter}`;
      if (!Array.isArray(S[stateKey])) S[stateKey] = [];
      if (!S[stateKey].length) {
        S[stateKey].push({
          id: Date.now(),
          name: `Annexure ${letter} - Entry 1`,
          summary: `Upload your Annexure ${letter} PDF or image here.`,
          fileName: null,
          fileSize: null,
          pages: null
        });
      }
      const renderName = `renderAnnexure${letter}`;
      if (typeof window[renderName] === 'function') window[renderName]();
      return S[stateKey];
    };
    const addSimpleAnnexurePreviewPages = (title, viewId) => {
      const letter = viewId.replace('annexure-', '').toUpperCase();
      const fnName = `getAnnexure${letter}Pages`;
      if (!window.pdfPreview || typeof pdfPreview[fnName] !== 'function') return false;
      ensureSimpleAnnexurePreviewState(viewId);
      let pages = pdfPreview[fnName]();
      if (!pages.length && typeof pdfPreview.renderTextPageCanvas === 'function') {
        pages = [{
          src: pdfPreview.renderTextPageCanvas(`Annexure ${letter} - Entry 1`, `Upload your Annexure ${letter} PDF or image here.`, `Annexure ${letter}`),
          label: `${title} - Page 1`,
          generated: true
        }];
      }
      if (!pages.length) return false;
      pages.forEach((p, idx) => addPreviewImagePage(p.src, `${title} - Page ${idx + 1}`));
      return true;
    };
    const fallbackTables = {
      anx1: [
        { title: 'a) Rivers:', selector: 'table[id^="anx1-rivers"]', all: true },
        { title: 'b) De-Siltation Location (Lakes/Ponds/Dams etc.):', selector: 'table[id^="anx1-desilt"]', all: true },
        { title: 'c) Patta lands/Khatedari land:', selector: 'table[id^="anx1-patta"]', all: true },
        { title: 'd) M-Sand Plants:', selector: 'table[id^="anx1-msand"]', all: true }
      ],
      anx2: [
        { title: 'Annexure II(a) - Mining Leases', selector: 'table[id^="anx2-leases"]', all: true },
        { title: 'Annexure II(b) - Patta Lands', selector: 'table[id^="anx2-patta"]', all: true },
        { title: 'Annexure II(c) - De-siltation', selector: 'table[id^="anx2-desilt"]', all: true },
        { title: 'Annexure II(d) - M-Sand Plants', selector: 'table[id^="anx2-msand"]', all: true }
      ],
      anx3: [
        { title: 'Annexure III(a) - Clusters', selector: 'table[id^="anx3-clusters"]', all: true },
        { title: 'Annexure III(b) - Contiguous Clusters', selector: 'table[id^="anx3-contiguous"]', all: true }
      ],
      anx4: [
        { title: 'Annexure IV(a) - Lease Routes', selector: 'table[id^="anx4-routes"]', all: true },
        { title: 'Annexure IV(b) - Cluster Routes', selector: 'table[id^="anx4-cluster-routes"]', all: true }
      ],
      anx5: [
        { title: 'Annexure V - Bench Mark & CORS', selector: 'table[id^="anx5-benchmarks"]', all: true },
        { title: 'Annexure V - Mining Leases', selector: 'table[id^="anx5-mining"]', all: true },
        { title: 'Annexure V - Patta Lands', selector: 'table[id^="anx5-patta"]', all: true },
        { title: 'Annexure V - De-siltation', selector: 'table[id^="anx5-desilt"]', all: true },
        { title: 'Annexure V - M-Sand Plants', selector: 'table[id^="anx5-msand"]', all: true }
      ],
      anx6: [
        { title: 'Annexure VI - Final Cluster Details', selector: 'table[id^="anx6-final-clusters"]', all: true },
        { title: 'Annexure VI - Contiguous Cluster Details', selector: 'table[id^="anx6-contiguous-clusters"]', all: true }
      ],
      anx7: [
        { title: 'Annexure VII - Individual Routes', selector: 'table[id^="anx7-routes"]', all: true },
        { title: 'Annexure VII - Cluster Routes', selector: 'table[id^="anx7-cluster-routes"]', all: true },
        { title: 'Annexure VII - Transportation Routes', selector: 'table[id^="anx7-patta-final"]', all: true }
      ],
      'annexure-b': [
        { title: 'Annexure B - Mining Leases', selector: 'table[id^="annexure-b-leases"]', all: true }
      ],
      'annexure-c': [
        { title: 'Annexure C - Cluster details', selector: 'table[id^="annexure-c-details"]', all: true }
      ],
      'annexure-d': [
        { title: 'Annexure D - Details', selector: 'table[id^="annexure-d-details"]', all: true }
      ],
      'annexure-e': [
        { title: 'Annexure E - Details', selector: 'table[id^="annexure-e-details"]', all: true }
      ],
      'annexure-f': [
        { title: 'Annexure F - Sand Ghats', selector: 'table[id^="annexure-f-sand"]', all: true },
        { title: 'Annexure F - Bench Marks', selector: 'table[id^="annexure-f-benchmark"]', all: true },
        { title: 'Annexure F - CORS Stations', selector: 'table[id^="annexure-f-cors"]', all: true }
      ],
      'annexure-g': [
        { title: 'Annexure G - Details', selector: 'table[id^="annexure-g-details"]', all: true }
      ],
      'annexure-h': [
        { title: 'Annexure H - Details', selector: 'table[id^="annexure-h-details"]', all: true }
      ],
      'annexure-i': [
        { title: 'Annexure I - Details', selector: 'table[id^="annexure-i-details"]', all: true }
      ],
      'annexure-j': [
        { title: 'Annexure J - Details', selector: 'table[id^="annexure-j-details"]', all: true }
      ],
      'annexure-k': [
        { title: 'Annexure K - Proforma Auctioned Sites', selector: 'table[id^="annexure-k-proforma"]', all: true },
        { title: 'Annexure K - Annexure A', selector: 'table[id^="annexure-k-annexure-a"]', all: true }
      ]
    };

    const renderAnnexureTables = (viewId, title) => {
      const configs = fallbackTables[viewId];
      if (!configs) return false;
      
      let addedAny = false;
      let startY = 25;
      
      configs.forEach((cfg) => {
        const tables = cfg.all ? Array.from(document.querySelectorAll(cfg.selector)) : [document.querySelector(cfg.selector)].filter(Boolean);
        tables.forEach((table) => {
          const clone = table.cloneNode(true);
          
          clone.querySelectorAll('select').forEach(select => {
            const val = select.value || '';
            const textNode = document.createTextNode(val || 'NA');
            select.parentNode.replaceChild(textNode, select);
          });
          
          clone.querySelectorAll('input, textarea').forEach(input => {
            const val = input.value || '';
            const textNode = document.createTextNode(val || 'NA');
            input.parentNode.replaceChild(textNode, input);
          });

          const headers = Array.from(clone.querySelectorAll('thead tr th, thead tr td, tbody tr th, tbody tr td'));
          let actionColIndexes = [];
          
          clone.querySelectorAll('tr').forEach(row => {
            const cells = Array.from(row.children);
            cells.forEach((cell, idx) => {
              const txt = (cell.textContent || '').trim().toLowerCase();
              if (txt === 'action' || txt === 'actions' || cell.classList.contains('actions') || cell.classList.contains('action')) {
                if (!actionColIndexes.includes(idx)) {
                  actionColIndexes.push(idx);
                }
              }
            });
          });

          actionColIndexes.sort((a, b) => b - a);

          clone.querySelectorAll('tr').forEach(row => {
            const cells = Array.from(row.children);
            actionColIndexes.forEach(idx => {
              if (cells[idx]) cells[idx].remove();
            });
          });

          clone.querySelectorAll('td, th').forEach(cell => {
            cell.querySelectorAll('button, a, .btn, .actions, .edit-btn, .delete-btn, i, svg').forEach(el => el.remove());
            const txt = (cell.textContent || '').trim();
            if (!txt) {
              cell.textContent = 'NA';
            }
          });

          if (!addedAny) {
            doc.addPage();
            startY = 25;
            addedAny = true;
          } else {
            if (startY > 250) {
              doc.addPage();
              startY = 25;
            }
          }

          startY = writeParagraph(cfg.title, startY, { bold: true, size: 11, color: [0, 0, 0], after: 4 });

          const firstRow = clone.querySelector('tr');
          const colCount = firstRow ? firstRow.children.length : 0;
          const isWide = colCount > 8;
          const fontSize = isWide ? 5.8 : 7.5;
          const cellPadding = isWide ? 1.2 : 2;

          doc.autoTable({
            html: clone,
            startY: startY,
            margin: { left: pad, right: pad },
            tableWidth,
            theme: 'grid',
            styles: { fontSize: fontSize, cellPadding: cellPadding, lineColor: [0, 0, 0], lineWidth: 0.2, textColor: [0, 0, 0], overflow: 'linebreak' },
            headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', lineColor: [0, 0, 0], lineWidth: 0.2 },
            alternateRowStyles: { fillColor: [255, 255, 255] }
          });

          startY = doc.lastAutoTable.finalY + 10;
        });
      });

      return addedAny;
    };

    const hasAnnexureContent = (viewId) => {
      if (['annexure-f', 'annexure-j', 'annexure-k'].includes(viewId)) {
        if (window.pdfPreview && typeof pdfPreview.prepareAnnexureLivePreviewSource === 'function') {
          pdfPreview.prepareAnnexureLivePreviewSource(viewId);
        }
        if (viewId === 'annexure-j' && typeof getAnnexureJDemandTables === 'function' && getAnnexureJDemandTables().length) {
          return true;
        }
      }
      const hasUpload = Array.isArray(S.uploadedPDFs?.[viewId]) && S.uploadedPDFs[viewId].length > 0;
      if (simpleAnnexurePreviewIds.includes(viewId)) {
        ensureSimpleAnnexurePreviewState(viewId);
        return true;
      }
      
      let hasLetterUpload = false;
      if (viewId.startsWith('annexure-')) {
        const letter = viewId.replace('annexure-', '').toUpperCase();
        const stateKey = `annexure${letter}`;
        const entries = S[stateKey];
        if (Array.isArray(entries)) {
          hasLetterUpload = entries.length > 0;
        }
      }

      const hasDomTable = !!document.querySelector(`table[id*="${viewId}"], table[id*="${viewId.replace('annexure-', 'anx')}"]`);
      const iframe = getPreviewIframe(viewId);
      const hasIframe = !!(iframe && (iframe.getAttribute('src') || iframe.srcdoc));
      return hasUpload || hasLetterUpload || hasDomTable || hasIframe;
    };

    const addAnnexureFromPreview = async (title, viewId) => {
      const uploaded = S.uploadedPDFs?.[viewId];
      if (Array.isArray(uploaded) && uploaded.length > 0) {
        uploaded.forEach((page, index) => addImagePage(page, `${title} - Page ${index + 1}`));
        return true;
      }

      if (['annexure-f', 'annexure-j', 'annexure-k'].includes(viewId)) {
        const addedGeneratedPdf = await addAnnexureExportBlobPages(title, viewId);
        if (addedGeneratedPdf) return true;
        const addedLivePreview = await addLivePreviewHtmlPages(title, viewId);
        if (addedLivePreview) return true;
      }

      if (simpleAnnexurePreviewIds.includes(viewId)) {
        return addSimpleAnnexurePreviewPages(title, viewId);
      }
      
      if (viewId.startsWith('annexure-')) {
        const letter = viewId.replace('annexure-', '').toUpperCase();
        const simpleLetters = ['B', 'C', 'D', 'E', 'G', 'H', 'I'];
        if (simpleLetters.includes(letter)) {
          const fnName = `getAnnexure${letter}Pages`;
          if (typeof pdfPreview[fnName] === 'function') {
            const pages = pdfPreview[fnName]();
            pages.forEach((p, idx) => addImagePage(p.src, `${title} - Page ${idx + 1}`));
            return true;
          }
        }
      }

      let hasTables = false;
      const renderedTables = renderAnnexureTables(viewId, title);
      if (renderedTables) hasTables = true;
      
      let hasAttachments = false;
      const prevBorderActive = borderActive;
      if (viewId === 'annexure-f') {
        const fAttachment = typeof getAnnexureFAttachment === 'function' ? getAnnexureFAttachment() : null;
        if (fAttachment && fAttachment.pages && fAttachment.pages.length) {
          borderActive = false;
          fAttachment.pages.forEach((page, index) => addImagePage(page, `${title} - Supporting - Page ${index + 1}`));
          borderActive = prevBorderActive;
          hasAttachments = true;
        }
      } else if (viewId === 'annexure-j') {
        const jAttachments = typeof getAnnexureJAttachments === 'function' ? getAnnexureJAttachments() : [];
        let anyJ = false;
        jAttachments.forEach(att => {
          if (att.pages && att.pages.length) {
            anyJ = true;
          }
        });
        if (anyJ) {
          borderActive = false;
          jAttachments.forEach(att => {
            if (att.pages && att.pages.length) {
              att.pages.forEach((page, index) => addImagePage(page, `${title} - Supporting - Page ${index + 1}`));
            }
          });
          borderActive = prevBorderActive;
          hasAttachments = true;
        }
      } else if (viewId === 'annexure-k') {
        const kAttachment = typeof getAnnexureKAttachment === 'function' ? getAnnexureKAttachment() : null;
        if (kAttachment && kAttachment.pages && kAttachment.pages.length) {
          borderActive = false;
          kAttachment.pages.forEach((page, index) => addImagePage(page, `${title} - Supporting - Page ${index + 1}`));
          borderActive = prevBorderActive;
          hasAttachments = true;
        }
      }

      if (!hasTables && !hasAttachments) {
        const letter = viewId.replace('annexure-', '').toUpperCase();
        const fnName = `getAnnexure${letter}Pages`;
        if (typeof pdfPreview[fnName] === 'function') {
          const pages = pdfPreview[fnName]();
          pages.forEach((p, idx) => addPreviewImagePage(p.src, `${title} - Page ${idx + 1}`));
        }
      }

      return renderedTables;
    };

    // 1. Cover Page
    const coverPages = pdfPreview.getFrontMatterPages().filter(p => /^cover/i.test(p.label));
    if (coverPages.length > 0) {
      coverPages.forEach(p => addImagePage(p.src, 'Cover Page'));
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.setTextColor(0, 0, 0);
      doc.text('DISTRICT SURVEY REPORT', W / 2, 70, { align: 'center' });
      doc.text(`FOR SAND MINING IN ${district.toUpperCase()} DISTRICT`, W / 2, 84, { align: 'center', maxWidth: W - 30 });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text(`Government of Punjab\nDepartment of Mining and Geology`, W / 2, H / 2 - 10, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`Year: ${year}`, W / 2, H - 50, { align: 'center' });
      doc.text(`Version: ${version}`, W / 2, H - 42, { align: 'center' });
    }

    // 2. Table of Contents (TOC) from Front Matter
    const tocPages = pdfPreview.getFrontMatterPages().filter(p => /^content/i.test(p.label));
    if (tocPages.length > 0) {
      sectionStarts.push({ title: 'Table of Contents', page: doc.getCurrentPageInfo().pageNumber + 1 });
      tocPages.forEach(p => addImagePage(p.src, 'Table of Contents'));
    }

    // 3. Preface
    const prefPages = pdfPreview.getFrontMatterPages().filter(p => /^preface/i.test(p.label));
    if (prefPages.length > 0) {
      sectionStarts.push({ title: 'Preface', page: doc.getCurrentPageInfo().pageNumber + 1 });
      prefPages.forEach(p => addImagePage(p.src, 'Preface'));
    }

    // 4. Acknowledgement
    const ackPages = pdfPreview.getFrontMatterPages().filter(p => /^acknowledgement/i.test(p.label));
    if (ackPages.length > 0) {
      sectionStarts.push({ title: 'Acknowledgement', page: doc.getCurrentPageInfo().pageNumber + 1 });
      ackPages.forEach(p => addImagePage(p.src, 'Acknowledgement'));
    }

    // 5. Certificate of Compliance
    const certPages = pdfPreview.getFrontMatterPages().filter(p => /^certificate of compliance/i.test(p.label));
    if (certPages.length > 0) {
      sectionStarts.push({ title: 'Certificate of Compliance', page: doc.getCurrentPageInfo().pageNumber + 1 });
      certPages.forEach(p => addImagePage(p.src, 'Certificate of Compliance'));
    }

    // 6. Chapters 1 to 10
    for (let i = 1; i <= 10; i += 1) {
      const chPages = pdfPreview.getChapterPages().filter(p => new RegExp('^Chapter ' + i + '\\b', 'i').test(p.label));
      if (chPages.length > 0) {
        const ch = (S.chapters || [])[i - 1] || (S.chapters || []).find(c => Number(c.id) === i) || {};
        const chapterTitle = safe(ch.name, `Chapter ${i}`);
        addTitlePage(chapterTitle);
        sectionStarts.push({ title: chapterTitle, page: doc.getCurrentPageInfo().pageNumber + 1 });
        chPages.forEach(p => addImagePage(p.src, chapterTitle));
      }
    }

    // 7. Plates
    setProgress('Merging Sections...', 52);
    (S.plates || []).forEach((plate, idx) => {
      const pNum = idx + 1;
      const pName = plate.name || '';
      const platePages = pdfPreview.getPlatePages().filter(p => new RegExp('^Plate P' + pNum + '\\b|^Plate ' + pNum + '\\b', 'i').test(p.label));
      if (platePages.length > 0) {
        const plateTitle = safe(pName, `Plate ${pNum}`);
        addTitlePage(plateTitle);
        sectionStarts.push({ title: plateTitle, page: doc.getCurrentPageInfo().pageNumber + 1 });
        platePages.forEach(p => addImagePage(p.src, plateTitle));
      }
    });

    // 8. Cross Section Graphs: REMOVED as requested.

    // 9. Annexures I to VII & B to K
    const annexurePreviewOrder = [
      ['Annexure I - Sources', 'anx1'],
      ['Annexure II - Leases', 'anx2'],
      ['Annexure III - Clusters', 'anx3'],
      ['Annexure IV - Transport', 'anx4'],
      ['Annexure V - Bench Mark & CORS', 'anx5'],
      ['Annexure VI - Final Cluster Details', 'anx6'],
      ['Annexure VII - Transportation Routes', 'anx7'],
      ['Annexure B', 'annexure-b'],
      ['Annexure C', 'annexure-c'],
      ['Annexure D', 'annexure-d'],
      ['Annexure E', 'annexure-e'],
      ['Annexure F', 'annexure-f'],
      ['Annexure G', 'annexure-g'],
      ['Annexure H', 'annexure-h'],
      ['Annexure I', 'annexure-i'],
      ['Annexure J', 'annexure-j'],
      ['Annexure K', 'annexure-k']
    ];

    for (let annexureIndex = 0; annexureIndex < annexurePreviewOrder.length; annexureIndex += 1) {
      const [title, viewId] = annexurePreviewOrder[annexureIndex];
      if (!hasAnnexureContent(viewId)) continue;
      const editableTitle = typeof getEditableAnnexureTitle === 'function'
        ? getEditableAnnexureTitle(viewId, title)
        : title;
      setProgress(`Merging Sections... ${editableTitle}`, 52 + Math.min(24, Math.round(annexureIndex * 1.4)));
      
      const isAllowed = ['anx1', 'anx2', 'anx3', 'anx4', 'anx5', 'anx6', 'anx7', 'annexure-f', 'annexure-j', 'annexure-k'].includes(viewId);
      borderActive = isAllowed;
      
      addTitlePage(editableTitle);
      sectionStarts.push({ title: editableTitle, page: doc.getCurrentPageInfo().pageNumber + 1 });
      await addAnnexureFromPreview(editableTitle, viewId);
      
      borderActive = false;
    }

    setProgress('Finalizing Document...', 78);

    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p += 1) {
      doc.setPage(p);
      if (p === 1) continue;
      
      const isTitlePage = titlePages.includes(p);
      
      if (borderPages.includes(p)) {
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);
        doc.rect(pageFrameMargin, pageFrameMargin, W - (pageFrameMargin * 2), H - pageFrameMargin - 18, 'S');
      }
      
      if (!isTitlePage) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(0, 0, 0);
        const districtNameUpper = String(district || 'PUNJAB').toUpperCase();
        const footerLeft = `PREPARED BY: SUB-DIVISIONAL COMMITTEE OF ${districtNameUpper} DISTRICT`;
        const footerLeft2 = `ASSISTED BY: RSP GREEN DEVELOPMENT AND LABORATORIES PVT. LTD`;
        doc.text(footerLeft, W / 2, 286, { align: 'center' });
        doc.text(footerLeft2, W / 2, 290, { align: 'center' });
        doc.text(`Page ${p}`, W - 8, 288, { align: 'right' });
      }
    }

    setProgress('Finalizing Document...', 90);
    const safeDistrict = district.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'Punjab';
    const safeYear = year.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || '2025-26';
    const fileName = `DSR-${safeDistrict}-${safeYear}-Final-${generatedAt.toISOString().slice(0, 10)}.pdf`;
    const dataUri = doc.output('datauristring');
    const base64 = dataUri.split(',')[1];
    if (S.activeProject?.id) {
      apiFetch('/upload-pdf', {
        method: 'POST',
        body: JSON.stringify({
          projectId: S.activeProject.id,
          fileName,
          pdf: base64,
          annexureId: 'final'
        })
      }).catch(err => console.warn('Background PDF upload failed:', err));
      S.activeProject.finalPdfName = fileName;
      S.activeProject.finalPdfGeneratedAt = generatedAt.toISOString();
      S.activeProject.finalPdfPages = totalPages;
      if (!S.activeProject.pdfData) S.activeProject.pdfData = {};
      S.activeProject.pdfData.final = window.projectPdfUrl ? window.projectPdfUrl('final', true) : `/api/download-pdf?projectId=${encodeURIComponent(S.activeProject.id)}&annexureId=final&inline=true`;
      const idx = S.projects.findIndex(p => String(p.id) === String(S.activeProject.id));
      if (idx !== -1) {
        S.projects[idx].finalPdfName = fileName;
        S.projects[idx].finalPdfGeneratedAt = S.activeProject.finalPdfGeneratedAt;
        S.projects[idx].finalPdfPages = totalPages;
      }
      if (typeof persistProjectState === 'function') await persistProjectState();
      if (typeof renderDashboard === 'function') renderDashboard();
    }
    if (window.finalDsrPdfBlobUrl) {
      try { URL.revokeObjectURL(window.finalDsrPdfBlobUrl); } catch (_) {}
    }
    window.finalDsrPdfBlob = doc.output('blob');
    window.finalDsrPdfBlobUrl = URL.createObjectURL(window.finalDsrPdfBlob);
    window.finalDsrPdfFileName = fileName;
    setProgress('Finalizing Document...', 100);
    if (resultBox) resultBox.style.display = 'block';
    const pageCountEl = document.getElementById('pdf-page-count');
    if (pageCountEl) pageCountEl.textContent = totalPages;
    const previewContainer = document.querySelector('#view-generate .pdf-preview');
    if (previewContainer && window.finalDsrPdfBlobUrl) {
      previewContainer.innerHTML = `<iframe title="Final DSR PDF Live Preview" src="${window.finalDsrPdfBlobUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH" style="width:100%;height:800px;border:none;border-radius:6px;background:#fff;"></iframe>`;
    }
    if (typeof initLucide === 'function') initLucide();
    toast(`${regenerate ? 'Regenerated' : 'Generated'} final DSR PDF: ${fileName}`, 'success');
  } catch (err) {
    console.error('Final PDF generation failed:', err);
    toast(`Final PDF generation failed: ${err.message || err}`, 'error');
  } finally {
    if (generateBtn) generateBtn.disabled = false;
  }
}
function validateFinalPdfInputs() {
  const warnings = [];
  if (!S.frontMatter || !S.frontMatter.title || !S.frontMatter.district) {
    warnings.push('Front Matter is incomplete.');
  }
  for (let i = 1; i <= 10; i += 1) {
    const ch = (S.chapters || []).find(item => Number(item.id) === i) || (S.chapters || [])[i - 1];
    if (!ch || (!String(ch.summary || '').trim() && !S.chapterPDFs?.[ch.id]?.length)) {
      warnings.push(`Chapter ${i} has no summary or uploaded document.`);
    }
  }
  if (!Array.isArray(S.plates) || !S.plates.length) warnings.push('Plate Section has no plate records.');
  if (!Array.isArray(S.graphs) || !S.graphs.length) warnings.push('Cross Section Graphs are not available.');
  ['anx1', 'anx2', 'anx3', 'anx4', 'anx5', 'anx6', 'anx7'].forEach(key => {
    const hasUpload = Array.isArray(S.uploadedPDFs?.[key]) && S.uploadedPDFs[key].length > 0;
    const hasDomTable = !!document.querySelector(`#${key}-rivers, #${key}-leases, #${key}-clusters, #${key}-routes, #${key}-benchmarks, #${key}-final-clusters, #${key}-patta-final`);
    if (!hasUpload && !hasDomTable) warnings.push(`${key.toUpperCase()} reference data is not loaded or has no attachment.`);
  });
  return warnings;
}
function getFinalPdfUrl(inline = true) {
  if (window.finalDsrPdfBlobUrl) return window.finalDsrPdfBlobUrl;
  if (!S.activeProject?.id || !S.activeProject?.finalPdfName) return '';
  return window.projectPdfUrl ? window.projectPdfUrl('final', inline) : `/api/download-pdf?projectId=${encodeURIComponent(S.activeProject.id)}&annexureId=final${inline ? '&inline=true' : ''}`;
}
function canAccessFinalDsrPdf() {
  if (typeof hasAdminAccess === 'function') return hasAdminAccess();
  const role = (window.S && (S.backendRole || S.user?.backendRole || S.user?.roleCode || S.user?.role)) || '';
  return /^(ADMIN|STATE_ADMIN)$/i.test(String(role));
}
function showFinalPdfAccessDenied() {
  const message = 'Access Denied - Only Administrators can download the Final DSR PDF.';
  if (typeof toast === 'function') toast(message, 'error');
  else alert(message);
}
function updateFinalPdfAdminUI() {
  const allowed = canAccessFinalDsrPdf();
  document.querySelectorAll('.final-pdf-admin-action').forEach(el => {
    el.style.display = allowed ? '' : 'none';
    el.disabled = !allowed;
  });
  const lock = document.getElementById('final-pdf-admin-lock');
  if (lock) lock.style.display = allowed ? 'none' : 'block';
}
async function fetchFinalPdfBlob(inline = true) {
  if (!canAccessFinalDsrPdf()) {
    showFinalPdfAccessDenied();
    return null;
  }
  const url = getFinalPdfUrl(inline);
  if (!url) {
    toast('Generate the final PDF first.', 'info');
    return null;
  }
  if (window.finalDsrPdfBlob && url === window.finalDsrPdfBlobUrl) return window.finalDsrPdfBlob;
  if (url.startsWith('blob:')) return fetch(url).then(res => res.blob());
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('dsr_token') || ''}`
    }
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || 'Unable to access Final DSR PDF');
  }
  return response.blob();
}
async function previewFinalPDF() {
  const url = getFinalPdfUrl(true);
  try {
    const blob = await fetchFinalPdfBlob(true);
    if (!blob) return;
    window.open(URL.createObjectURL(blob), '_blank');
  } catch (err) {
    toast(err.message || 'Unable to preview Final DSR PDF', 'error');
  }
}
async function downloadFinalPDF() {
  try {
    const blob = await fetchFinalPdfBlob(false);
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = S.activeProject?.finalPdfName || window.finalDsrPdfFileName || 'Final-DSR.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err) {
    toast(err.message || 'Unable to download Final DSR PDF', 'error');
  }
}
async function emailFinalPDF() {
  if (!canAccessFinalDsrPdf()) {
    showFinalPdfAccessDenied();
    return;
  }
  if (!S.activeProject?.id || !S.activeProject?.finalPdfName) {
    toast('Generate the final PDF first.', 'info');
    return;
  }
  const email = prompt('Enter recipient email address:', S.user?.email || 'admin@demo.com');
  if (!email) return;
  try {
    await apiFetch('/email-final-pdf', {
      method: 'POST',
      body: JSON.stringify({ projectId: S.activeProject.id, email })
    });
    toast('Final DSR PDF email queued successfully.', 'success');
  } catch (err) {
    toast(err.message || 'Unable to email Final DSR PDF', 'error');
  }
}
window.generateFinalPDF = generateFinalPDF;
window.previewFinalPDF = previewFinalPDF;
window.downloadFinalPDF = downloadFinalPDF;
window.emailFinalPDF = emailFinalPDF;
window.updateFinalPdfAdminUI = updateFinalPdfAdminUI;
window.canAccessFinalDsrPdf = canAccessFinalDsrPdf;
window.showFinalPdfAccessDenied = showFinalPdfAccessDenied;
async function submitForReview(ignoreWarning = false) {
  if (!S.activeProject) return;
  try {
    if (typeof apiFetchReportHistory === 'function') {
      const history = await apiFetchReportHistory(S.activeProject.id);
      if (history && history.length > 0) {
        const latest = history[0];
        if (latest.action === 'RETURN' || latest.action === 'REJECT') {
          alert("Mandatory: You must submit a reply to the reviewer's comments on the dashboard before resubmitting the report.");
          toast("Please submit a reply on the dashboard first.", "error");
          return;
        }
      }
    }
  } catch (err) {
    console.error('Failed to verify report history state:', err);
  }
  try {
    let deoRemarks = 'Submitted by DEO';
    if (!ignoreWarning) {
        const reply = prompt('Enter your reply / remarks for the reviewer (Optional):', '');
        if (reply !== null && reply.trim() !== '') {
            deoRemarks = reply.trim();
        } else if (reply === null) {
            return; // Cancelled
        }
    }
    const payload = { action: 'SUBMIT', remarks: deoRemarks, ignoreWarning: ignoreWarning };
    await apiFetch(`/reports/${S.activeProject.id}/workflow`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    toast('Report submitted to authority dashboard!', 'success');
    if (typeof renderProjects === 'function') renderProjects();
    showView('dashboard', null);
  } catch (e) {
    if (e.isWarning) {
       if (confirm(e.warningData.message || "You are submitting the same data. Do you want to proceed?")) {
           submitForReview(true);
       }
    } else {
       toast('Error submitting report: ' + e.message, 'error');
    }
  }
}
/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   AUTHORITY DASHBOARD
 â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function renderAuthorityReports() {
  const el=document.getElementById('authority-reports'); if(!el) return;
  const reports=[
    { id:1, title:'DSR - Jalandhar Sand Mining 2025-26', district:'Jalandhar', by:'Rajinder Kumar, SDO', at:'May 21, 2026 Â· 11:42 AM', status:'Awaiting Your Signature', done:1, sections:12 },
    { id:2, title:'DSR - Ludhiana Sand Mining 2025-26', district:'Ludhiana', by:'Priya Sharma, SDO', at:'May 20, 2026 Â· 3:15 PM', status:'Under Review', done:1, sections:10 },
    { id:3, title:'DSR - Patiala Sand Mining 2025-26', district:'Patiala', by:'Harjinder Singh, SDO', at:'May 19, 2026 Â· 9:00 AM', status:'Awaiting Your Signature', done:1, sections:11 }
  ];
  el.innerHTML=reports.map(r=>`
    <div class="review-card">
      <div class="review-card-hd">
        <div><div style="font-size:14.5px;font-weight:700;color:var(--text)">${r.title}</div>
          <div style="font-size:11px;color:var(--text-soft);margin-top:2px">Submitted by ${r.by} Â· ${r.at}</div></div>
        <span class="badge ${r.status.includes('Awaiting')?'badge-saffron':'badge-amber'}">${r.status}</span>
      </div>
      <div class="review-card-bd">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px">
          <span class="badge badge-navy" style="display:inline-flex;align-items:center;gap:4px;"><i data-lucide="map-pin" style="width:12px;height:12px;"></i>${r.district}</span>
          <span class="badge badge-teal" style="display:inline-flex;align-items:center;gap:4px;"><i data-lucide="check-circle-2" style="width:12px;height:12px;"></i>${r.done}/5 signed</span>
          <span class="badge badge-navy" style="display:inline-flex;align-items:center;gap:4px;"><i data-lucide="file-text" style="width:12px;height:12px;"></i>${r.sections} sections</span>
          <div style="flex:1"></div>
          <button class="btn btn-outline btn-sm" onclick="toast('PDF preview opened','info')">Preview Preview</button>
          <button class="btn btn-navy btn-sm" onclick="toast('DSR-${r.district}-2025-26.pdf downloading...','info')">Download</button>
          <button class="btn btn-saffron btn-sm" onclick="openAuthoritySign(${r.id},'${r.title}')">Sign Now</button>
        </div>
        <div style="font-size:11px;font-weight:600;color:var(--text-soft);margin-bottom:7px">Signature Progress:</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${['SDO','DMO','DC','Director','Pr. Secy'].map((role,i)=>`
            <div style="display:flex;align-items:center;gap:4px;background:${i<r.done?'var(--green-lt)':i===r.done?'var(--saffron-lt)':'var(--bg)'};border:1px solid ${i<r.done?'var(--green)':i===r.done?'var(--saffron)':'var(--border)'};border-radius:99px;padding:4px 10px;font-size:11px;font-weight:600;color:${i<r.done?'var(--green)':i===r.done?'var(--saffron)':'var(--text-faint)'}">
              <i data-lucide="${i<r.done?'check-circle-2':i===r.done?'clock':'minus-circle'}" style="width:12px;height:12px;"></i>
              ${role}
            </div>`).join('')}
        </div>
      </div>
    </div>`).join('');
  initLucide();
}
function openAuthoritySign(id, title) {
  document.getElementById('auth-sign-content').innerHTML=`
    <div style="background:var(--off);border:1px solid var(--border);border-radius:var(--r-md);padding:14px;margin-bottom:14px">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-faint);margin-bottom:4px">Report to Sign</div>
      <div style="font-size:14px;font-weight:700;color:var(--text)">${title}</div>
      <div style="font-size:11.5px;color:var(--text-soft);margin-top:3px">Your position: District Mining Officer (Authority #2)</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:9px">
      <label style="display:flex;align-items:center;gap:9px;cursor:pointer;font-size:12.5px"><input type="checkbox" checked> I have reviewed the complete DSR report</label>
      <label style="display:flex;align-items:center;gap:9px;cursor:pointer;font-size:12.5px"><input type="checkbox" checked> I certify data accuracy and EMGSM 2020 compliance</label>
      <label style="display:flex;align-items:center;gap:9px;cursor:pointer;font-size:12.5px"><input type="checkbox" checked> I authorize forwarding to the next authority</label>
    </div>`;
  document.getElementById('auth-otp').value='';
  document.getElementById('modal-auth-sign').classList.add('open');
  if (typeof initSignaturePad === 'function') {
    initSignaturePad('auth-signature-pad');
  }
  initLucide();
}
function authoritySign() {
  if (document.getElementById('auth-otp').value!=='123456') { toast('Invalid OTP. Demo: 123456','error'); return; }
  closeModal('modal-auth-sign');
  toast('Report signed! Deputy Commissioner has been notified.','success');
}

;
