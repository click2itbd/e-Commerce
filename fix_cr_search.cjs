const fs = require('fs');
let file = 'src/pages/admin/tabs/accounting/CustomerReceiveReport.tsx';
let content = fs.readFileSync(file, 'utf8');

const updated = `const getCustomerReceiveReportData = () => {
    let reportData: Array<any> = []; // keeping structure

    const allReceives = transactions.filter(
      tx => tx.type === 'payment_received' || tx.type === 'sale' || tx.type === 'money_receipt'
    );
`;

content = content.replace("const getCustomerReceiveReportData = () => {\n    const reportData: Array<{", "const getCustomerReceiveReportData = () => {\n    let reportData: Array<{");

// Wait, it's easier to just find the end of getCustomerReceiveReportData where it returns `reportData.sort(...)`
content = content.replace("return reportData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());",
  `return reportData.filter(r => {
      if (!crReportSearch.trim()) return true;
      const q = crReportSearch.toLowerCase();
      return (r.customerName || '').toLowerCase().includes(q) ||
             (r.ref || '').toLowerCase().includes(q) ||
             (r.desc || '').toLowerCase().includes(q);
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());`
);

fs.writeFileSync(file, content, 'utf8');
