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
      ${this.buildCard("Inherited Data (Final DSR)", "🟢", `
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Project Name</label>
            <div class="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 cursor-not-allowed">
              ${inherited.project_name || "N/A"}
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">District</label>
              <div class="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 cursor-not-allowed">${inherited.district || "N/A"}</div>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">River</label>
              <div class="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 cursor-not-allowed">${inherited.rivers || "N/A"}</div>
            </div>
          </div>
        </div>
      `, true)}
      
      ${this.buildCard("Survey Input", "🔵", `
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Total Replenished Area (Hectares)</label>
            <input type="number" data-field="replenishedArea" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" placeholder="e.g. 15.5">
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Estimated Replenishment (MT)</label>
            <input type="number" data-field="estimatedReplenishment" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" placeholder="e.g. 500000">
          </div>
        </div>
      `)}

      ${this.buildCard("File Management Center", "🟣", `
        <div class="space-y-3">
          <div class="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer">
            <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <div class="mt-4 flex text-sm text-gray-600 justify-center">
              <label for="file-upload" class="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                <span>Upload a file</span>
                <input id="file-upload" name="file-upload" type="file" class="sr-only">
              </label>
              <p class="pl-1">or drag and drop</p>
            </div>
            <p class="text-xs text-gray-500 mt-1">GIS, DEM, Drone imagery (ZIP, TIF, PDF)</p>
          </div>
        </div>
      `)}

      ${this.buildCard("AI Generation", "🟡", `
        <div class="space-y-4">
          <p class="text-sm text-gray-600">Let AI assist you in generating the technical methodology and analysis based on the uploaded data.</p>
          <button type="button" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Generate Geological Analysis
          </button>
        </div>
      `)}
    `;

    this.container.innerHTML = html;
  }

  buildCard(title, icon, content, locked = false) {
    return `
      <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-4">
        <div class="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between cursor-pointer">
          <h3 class="text-sm font-bold text-gray-800 flex items-center gap-2">
            <span>${icon}</span> ${title}
          </h3>
          ${locked ? '<svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>' : '<svg class="w-4 h-4 text-gray-400 transform rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>'}
        </div>
        <div class="p-4 ${locked ? 'opacity-80' : ''}">
          ${content}
        </div>
      </div>
    `;
  }
}

window.replenishmentWorkspace = new Workspace();
})();
