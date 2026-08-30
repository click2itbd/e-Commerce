const fs = require('fs');
let file = 'src/pages/admin/POS/components/POSHeader.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "(p as any).barcode === searchQuery.trim() ||",
  "(p as any).barcode === searchQuery.trim() ||\n                    (p.model && p.model.toLowerCase() === searchLower) ||"
);

fs.writeFileSync(file, content, 'utf8');
