const fs = require('fs');
let file = fs.readFileSync('src/pages/admin/tabs/others/Settings.tsx', 'utf8');

const lines = file.split('\n');
const startIdx = lines.findIndex(l => l.includes('<div className="mt-8 pt-6 border-t">'));
if (startIdx !== -1) {
  const endIdx = lines.findIndex((l, i) => i > startIdx && l.includes(') : ('));
  if (endIdx !== -1) {
    const newUI = lines.splice(startIdx, endIdx - startIdx).join('\n');
    lines.splice(startIdx - 2, 0, newUI);
    fs.writeFileSync('src/pages/admin/tabs/others/Settings.tsx', lines.join('\n'));
    console.log('Fixed JSX structure');
  }
}
