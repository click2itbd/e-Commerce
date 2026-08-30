const fs = require('fs');
let file = 'src/pages/admin/tabs/finance/SalesReport.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("return data;",
  `if (reportSearch.trim()) {
      const q = reportSearch.toLowerCase();
      data = data.filter(r => 
        (r.customerName || '').toLowerCase().includes(q) ||
        (r.customerPhone || '').toLowerCase().includes(q) ||
        (r.productName || '').toLowerCase().includes(q) ||
        (r.documentNumber || '').toLowerCase().includes(q)
      );
    }
    return data;`
);

fs.writeFileSync(file, content, 'utf8');
