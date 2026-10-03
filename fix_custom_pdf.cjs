const fs = require('fs');
let code = fs.readFileSync('src/lib/pdf.ts', 'utf8');

const oldPdfWarranty = `        if (item.warrantyMonths) {
          warranty =
            item.warrantyMonths > 12
              ? \`\${item.warrantyMonths / 12} Yrs\`
              : \`\${item.warrantyMonths} Mos\`;
        } else if (item.specs?.Warranty) {
          warranty = item.specs.Warranty;
        }`;

const newPdfWarranty = `        if (item.warrantyMonths) {
          warranty =
            item.warrantyMonths > 12
              ? \`\${item.warrantyMonths / 12} Yrs\`
              : \`\${item.warrantyMonths} Mos\`;
        } else if ((item as any).warranty) {
          warranty = (item as any).warranty;
        } else if (item.specs?.Warranty) {
          warranty = item.specs.Warranty;
        }`;

code = code.replace(oldPdfWarranty, newPdfWarranty);

fs.writeFileSync('src/lib/pdf.ts', code);
console.log('Fixed pdf.ts custom item warranty');
