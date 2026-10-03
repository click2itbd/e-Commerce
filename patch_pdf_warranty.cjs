const fs = require('fs');
let code = fs.readFileSync('src/lib/pdf.ts', 'utf8');

const targetStr = `      let warranty = "-";
      if (item.warrantyMonths) {
        warranty = \`\${item.warrantyMonths} Months\`;
      } else if (item.specs?.Warranty) {
        warranty = item.specs.Warranty;
      }`;

const replacementStr = `      let warranty = "-";
      if (item.warrantyMonths) {
        warranty = item.warrantyMonths > 12 ? \`\${item.warrantyMonths / 12} Yrs\` : \`\${item.warrantyMonths} Mos\`;
      } else if (item.specs?.Warranty) {
        warranty = item.specs.Warranty;
      }
      if (item.warranty) {
        warranty = item.warranty;
      }`;

// Since formatting might differ, let's just do a string replace carefully
const lines = code.split('\n');
const idx = lines.findIndex(l => l.includes('let warranty = "-";'));

if (idx !== -1) {
    let block = lines.slice(idx, idx + 6).join('\n');
    lines.splice(idx, 6, `      let warranty = "-";
      if (item.warranty) {
        warranty = item.warranty;
      } else if (item.warrantyMonths) {
        warranty = item.warrantyMonths > 12 ? \`\${item.warrantyMonths / 12} Yrs\` : \`\${item.warrantyMonths} Mos\`;
      } else if (item.specs?.Warranty) {
        warranty = item.specs.Warranty;
      }`);
      
    code = lines.join('\n');
    fs.writeFileSync('src/lib/pdf.ts', code);
    console.log('Fixed pdf.ts warranty fallback');
}
