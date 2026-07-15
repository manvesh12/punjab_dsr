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
      ${this.buildCard("Auto Imported Information", '<svg class="w-5 h-5 text-green-600" style="width:20px; height:20px; flex-shrink:0;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>', `
        <div class="space-y-4">
          <div class="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
             <div class="flex items-center gap-3">
                <span class="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded border border-green-200">SOURCE: FINAL DSR</span>
                <span class="text-xs text-gray-500">Last Synced: 2 mins ago</span>
             </div>
             <div class="flex gap-2">
                <button class="text-xs text-blue-600 font-medium hover:underline">Compare</button>
                <button class="text-xs text-gray-500 font-medium hover:underline">Refresh</button>
             </div>
          </div>
          <div>
            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Project Name</label>
            <div class="px-4 py-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600 cursor-not-allowed flex justify-between items-center">
              <span>${inherited.project_name || "N/A"}</span>
              <svg class="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20"><path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"></path></svg>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">District</label>
              <div class="px-4 py-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600 cursor-not-allowed flex justify-between items-center">
                <span>${inherited.district || "N/A"}</span>
                <svg class="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20"><path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"></path></svg>
              </div>
            </div>
            <div>
              <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">River</label>
              <div class="px-4 py-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600 cursor-not-allowed flex justify-between items-center">
                <span>${inherited.rivers || "N/A"}</span>
                <svg class="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20"><path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"></path></svg>
              </div>
            </div>
          </div>
        </div>
      `, true, 'border-green-200 shadow-sm')}
      
      ${this.buildCard("Officer Input", '<svg class="w-5 h-5 text-blue-600" style="width:20px; height:20px; flex-shrink:0;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>', `
        <div class="space-y-6">
          <div class="relative group">
            <input type="number" id="repl-area" data-field="replenishedArea" class="block w-full px-4 pt-5 pb-2 border-b-2 border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors peer" placeholder=" " value="${state.replenishedArea || ''}">
            <label for="repl-area" class="absolute text-sm text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-blue-600 peer-focus:font-medium uppercase tracking-wide">Total Replenished Area (Hectares)</label>
          </div>
          <div class="relative group">
            <input type="number" id="repl-est" data-field="estimatedReplenishment" class="block w-full px-4 pt-5 pb-2 border-b-2 border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors peer" placeholder=" " value="${state.estimatedReplenishment || ''}">
            <label for="repl-est" class="absolute text-sm text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-blue-600 peer-focus:font-medium uppercase tracking-wide">Estimated Replenishment (MT)</label>
          </div>
          <div class="bg-blue-50 border border-blue-100 rounded-lg p-4">
             <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <div class="text-sm text-blue-800">
                   <strong>Live Validation Active:</strong> Inputs are automatically converted to standard units and mapped to the A4 document layout.
                </div>
             </div>
          </div>
        </div>
      `, false, 'border-blue-200 shadow-md', true)}

      ${this.buildCard("Upload Section", '<svg class="w-5 h-5 text-purple-600" style="width:20px; height:20px; flex-shrink:0;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>', `
        <div class="space-y-4">
          <div class="border-2 border-dashed border-purple-200 bg-purple-50/30 rounded-xl p-8 text-center hover:bg-purple-50 transition-colors cursor-pointer relative overflow-hidden group">
            <svg class="mx-auto h-12 w-12 text-purple-400 group-hover:scale-110 transition-transform" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <div class="mt-4 flex flex-col items-center justify-center">
              <span class="text-sm font-medium text-purple-700 bg-white px-4 py-1.5 rounded-full shadow-sm border border-purple-100">Browse Files or Drag & Drop</span>
              <p class="text-[11px] text-gray-500 mt-3 max-w-xs mx-auto">Supports PDF, Word, Excel, Images, DEM, Drone imagery, ZIP, GeoJSON, KML, SHP</p>
            </div>
            <input type="file" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
          </div>
          <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
             <div class="flex justify-between items-center text-xs text-gray-500 mb-2">
                <span>Upload History</span>
                <span class="text-blue-600 cursor-pointer hover:underline">View All</span>
             </div>
             <div class="flex items-center justify-center py-4 text-sm text-gray-400 border-t border-dashed border-gray-300">
                No recent uploads in this section.
             </div>
          </div>
        </div>
      `, false, 'border-purple-200')}

      ${this.buildCard("AI Generated Section", '<svg class="w-5 h-5 text-yellow-600" style="width:20px; height:20px; flex-shrink:0;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>', `
        <div class="space-y-4">
          <div class="bg-gradient-to-r from-[#17324D] to-[#2a4a6b] rounded-lg p-5 text-white shadow-lg relative overflow-hidden">
             <div class="absolute -right-4 -top-4 opacity-10">
                <svg class="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
             </div>
             <h4 class="font-bold text-lg mb-2 relative z-10 flex items-center gap-2">
                <svg class="w-5 h-5 text-[#C49A58]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                AI Assistant
             </h4>
             <p class="text-sm text-blue-100 mb-5 relative z-10">Generate technical methodology, hydrology, geology, and reserve analysis based on your uploaded data.</p>
             <div class="flex flex-wrap gap-2 relative z-10">
               <button type="button" class="flex items-center gap-1.5 py-1.5 px-3 rounded text-sm font-bold text-[#17324D] bg-[#C49A58] hover:bg-white transition-colors shadow-sm">
                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                 Generate Draft
               </button>
               <button type="button" class="flex items-center gap-1.5 py-1.5 px-3 rounded text-sm font-medium text-white bg-white/20 hover:bg-white/30 transition-colors border border-white/20">
                 Improve
               </button>
               <button type="button" class="flex items-center gap-1.5 py-1.5 px-3 rounded text-sm font-medium text-white bg-white/20 hover:bg-white/30 transition-colors border border-white/20">
                 Translate
               </button>
             </div>
          </div>
        </div>
      `, false, 'border-yellow-200')}
      
      ${this.buildCard("Validation & Missing Data", '<svg class="w-5 h-5 text-red-500" style="width:20px; height:20px; flex-shrink:0;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>', `
        <div class="space-y-3">
          <div class="flex items-start gap-3 p-3 bg-red-50 rounded border border-red-100">
             <svg class="w-4 h-4 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
             <div>
                <div class="text-sm font-medium text-red-800">Missing Drone Imagery</div>
                <div class="text-xs text-red-600 mt-1">Section 4 requires drone orthomosaic upload before submission.</div>
                <button class="mt-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 font-medium">Fix Now</button>
             </div>
          </div>
          <div class="flex items-start gap-3 p-3 bg-yellow-50 rounded border border-yellow-100">
             <svg class="w-4 h-4 text-yellow-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01"></path></svg>
             <div>
                <div class="text-sm font-medium text-yellow-800">Coordinate Mismatch Warning</div>
                <div class="text-xs text-yellow-700 mt-1">The provided coordinates do not align perfectly with the Final DSR boundaries.</div>
             </div>
          </div>
        </div>
      `, false, 'border-red-200')}
    `;

    this.container.innerHTML = html;
  }

  buildCard(title, icon, content, locked = false, customClasses = 'border-gray-200', defaultOpen = false) {
    // Generate a random ID for accordion toggling
    const id = 'acc-' + Math.random().toString(36).substr(2, 9);
    
    return `
      <div class="bg-white border rounded-xl shadow-sm overflow-hidden transition-all duration-300 group ${customClasses}">
        <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors" onclick="document.getElementById('${id}').classList.toggle('hidden'); this.querySelector('.chevron').classList.toggle('rotate-180')">
          <h3 class="text-[15px] font-bold text-[#17324D] flex items-center gap-3">
            <span>${icon}</span> ${title}
          </h3>
          ${locked 
            ? '<svg class="w-4 h-4 text-gray-400" style="width:16px; height:16px; flex-shrink:0;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>' 
            : `<svg class="chevron w-5 h-5 text-gray-400 transform transition-transform duration-300 ${defaultOpen ? 'rotate-180' : ''}" style="width:20px; height:20px; flex-shrink:0;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>`}
        </div>
        <div id="${id}" class="p-6 ${locked ? 'opacity-90 bg-gray-50/50' : ''} ${defaultOpen ? '' : 'hidden'} transition-all duration-300">
          ${content}
        </div>
      </div>
    `;
  }
}

window.replenishmentWorkspace = new Workspace();
})();
