const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/services/Services.tsx', 'utf8');

// For printServiceReceipt
code = code.replace(
  "        doc.save(`Service_Receipt_${record.id.slice(-6)}.pdf`);",
  "        const finalYReceipt = (doc as any).lastAutoTable.finalY + 30;\n        doc.setFontSize(10);\n        if (record.preparedBy) doc.text(`Prepared By: ${record.preparedBy}`, 14, finalYReceipt - 5);\n        doc.line(14, finalYReceipt, 60, finalYReceipt);\n        doc.text('Authorized Signature', 14, finalYReceipt + 5);\n        doc.line(pageWidth - 60, finalYReceipt, pageWidth - 14, finalYReceipt);\n        doc.text('Customer Signature', pageWidth - 14, finalYReceipt + 5, { align: 'right' });\n        doc.save(`Service_Receipt_${record.id.slice(-6)}.pdf`);"
);

// For printServiceBill
code = code.replace(
  "        doc.save(`Service_Bill_${record.id.slice(-6)}.pdf`);",
  "        const finalYBill = finalY + 30;\n        doc.setFontSize(10);\n        if (record.preparedBy) doc.text(`Prepared By: ${record.preparedBy}`, 14, finalYBill - 5);\n        doc.line(14, finalYBill, 60, finalYBill);\n        doc.text('Authorized Signature', 14, finalYBill + 5);\n        doc.line(pageWidth - 60, finalYBill, pageWidth - 14, finalYBill);\n        doc.text('Customer Signature', pageWidth - 14, finalYBill + 5, { align: 'right' });\n        doc.save(`Service_Bill_${record.id.slice(-6)}.pdf`);"
);

fs.writeFileSync('src/pages/admin/tabs/services/Services.tsx', code);
console.log('Added signatures to Service PDFs');
