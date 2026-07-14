import codecs
path = 'c:/Users/iPC/Downloads/punjab_dsr-main final/punjab_dsr-main/frontend/public/legacy/js/portal.bundle.js'
with codecs.open(path, 'r', 'utf-8') as f:
    content = f.read()

target = """    const packageData = await packageResponse.json();
    const importedState = JSON.parse(packageData.projectState || '{}');
    const sectionUrl = (fileName) => new URL(fileName, packageUrl).pathname;
    (importedState.sourceSections || []).forEach(section => { section.url = sectionUrl(section.file); });"""

replacement = """    const packageData = await packageResponse.json();
    const importedState = JSON.parse(packageData.projectState || '{}');
    if (packageData.sections) importedState.sourceSections = packageData.sections;
    if (packageData.importedAnnexures) importedState.importedAnnexures = packageData.importedAnnexures;

    if (!importedState.plates || importedState.plates.length === 0) {
      importedState.plates = (importedState.sourceSections || [])
        .filter(s => s.category === 'plate')
        .map((s, idx) => ({
          id: Date.now() + idx,
          name: s.title,
          summary: '',
          fileName: s.file
        }));
    }
    
    if (!importedState.chapters || importedState.chapters.length === 0) {
      importedState.chapters = (importedState.sourceSections || [])
        .filter(s => s.category === 'chapter')
        .map((s, idx) => ({
          id: Date.now() + idx,
          name: s.title,
          summary: '',
          fileName: s.file
        }));
    }

    const sectionUrl = (fileName) => new URL(fileName, packageUrl).pathname;
    (importedState.sourceSections || []).forEach(section => { section.url = sectionUrl(section.file); });"""

content = content.replace(target, replacement)

with codecs.open(path, 'w', 'utf-8') as f:
    f.write(content)
print('Replaced import logic')
