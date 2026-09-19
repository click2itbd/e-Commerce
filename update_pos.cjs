@
const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/POS/index.tsx', 'utf8');

if (!content.includes('import { logoBase64 }')) {
  content = content.replace('import React', 'import { logoBase64 } from \\'../../../lib/logoBase64\\';\nimport React');
}

const oldHtml = `<div class="brand-info">
              <h1>${settings?.brandName || 'Click2IT'}</h1>
              <p>${settings?.address || ''}</p>
              <p>Phone: ${settings?.phone || ''}</p>
              <p>Email: ${settings?.email || ''}</p>
            </div>`;
            
const newHtml = `<div class="brand-info">
              <img src="${logoBase64}" alt="Logo" style="max-height: 40px; margin-bottom: 10px;" />
              <p style="font-weight: bold; color: #111;">Shop No. 1072, Level-10, Multiplan Center</p>
              <p>69-71, New Elephant Road, Dhaka-1205, Bangladesh.</p>
              <p>Phone: 01686800755 | Web: click2itbd.com</p>
            </div>`;

content = content.replace(oldHtml, newHtml);

const oldThermalHtml = `<div class="header">
            <h1>${settings?.brandName || "Click2IT"}</h1>
            <p>${settings?.address || ""}</p>
            <p>Phone: ${settings?.phone || ""}</p>`;

const newThermalHtml = `<div class="header">
            <img src="${logoBase64}" alt="Logo" style="max-width: 150px; margin-bottom: 5px;" />
            <p>Shop No. 1072, Level-10, Multiplan Center</p>
            <p>69-71, New Elephant Road, Dhaka-1205</p>
            <p>Phone: 01686800755</p>`;

content = content.replace(oldThermalHtml, newThermalHtml);

fs.writeFileSync('src/pages/admin/POS/index.tsx', content);
console.log('Done');
@
