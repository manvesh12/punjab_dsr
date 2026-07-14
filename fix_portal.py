import codecs

path = 'frontend/public/legacy/js/portal.bundle.js'
with codecs.open(path, 'r', 'utf-8') as f:
    content = f.read()

# Fix error reporting
old_catch = '''  } catch (e) {
    console.error('State persist error:', e);
  }'''

new_catch = '''  } catch (e) {
    console.error('State persist error:', e);
    toast('Error saving project: ' + e.message, 'error');
  }'''

content = content.replace(old_catch, new_catch)

# Fix large payload issues by scrubbing huge image arrays before stringifying
old_snapshot_line = "JSON.stringify({ state: JSON.stringify(stateSnapshot) })"
new_snapshot_line = "JSON.stringify({ state: JSON.stringify(Object.fromEntries(Object.entries(stateSnapshot).map(([k, v]) => [k, (Array.isArray(v) && v.length > 0 && typeof v[0] === 'string' && v[0].startsWith('data:image')) ? [] : v]))) })"

content = content.replace(old_snapshot_line, new_snapshot_line)

with codecs.open(path, 'w', 'utf-8') as f:
    f.write(content)

print('Fixed portal.bundle.js')
