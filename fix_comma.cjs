const fs = require('fs');

function updateFile(filePath) {
  let c = fs.readFileSync(filePath, 'utf8');
  const nl = c.includes('\r\n') ? '\r\n' : '\n';
  c = c.replace(/\r\n/g, '\n');

  const oldLogic = `const items = bulkSpecInput.split(/[\\n,]+/).map(s => s.trim()).filter(s => s);`;
  const newLogic = `
      let items = [];
      if (bulkSpecInput.includes('\\n')) {
        items = bulkSpecInput.split('\\n').map(s => s.trim()).filter(s => s);
      } else {
        items = bulkSpecInput.split(',').map(s => s.trim()).filter(s => s);
      }`;

  if (c.includes(oldLogic)) {
    // Replace all occurrences (usually 2: one for onKeyDown Enter, one for onClick Add Fields)
    c = c.split(oldLogic).join(newLogic);
    fs.writeFileSync(filePath, c.replace(/\n/g, nl));
    console.log('Successfully updated ' + filePath);
  } else {
    console.log('Regex failed in ' + filePath);
  }
}

updateFile('src/pages/admin/tabs/inventory/Inventory.tsx');
updateFile('src/pages/ecommerceDashboard/EcommerceInventory.tsx');