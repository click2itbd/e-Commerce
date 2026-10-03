const fs = require('fs');
let code = fs.readFileSync('src/components/QuotationManager.tsx', 'utf8');

const lines = code.split('\n');
const idx = lines.findIndex(l => l.includes('                             let warranty = "-";'));

if (idx !== -1) {
    let block = lines.slice(idx, idx + 8).join('\n');
    lines.splice(idx, 8, `                             let warranty = "-";
                             if ((item as any).warranty) {
                               warranty = (item as any).warranty;
                             } else if ((item as any).warrantyMonths) {
                               warranty = (item as any).warrantyMonths > 12 ? \`\${(item as any).warrantyMonths / 12} Yrs\` : \`\${(item as any).warrantyMonths} Mos\`;
                             } else if ((item as any).specs?.Warranty) {
                               warranty = (item as any).specs.Warranty;
                             }`);
                             
    code = lines.join('\n');
    fs.writeFileSync('src/components/QuotationManager.tsx', code);
    console.log('Fixed QM view warranty logic');
}
