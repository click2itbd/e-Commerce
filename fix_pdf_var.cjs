const fs = require('fs');
let code = fs.readFileSync('src/lib/pdf.ts', 'utf8');

const oldStr = `  // Terms and Conditions Section (For Quotations, Invoices, etc.)
  let signatureY = doc.internal.pageSize.getHeight() - 40;
  
  if (o.termsAndConditions || o.notes) {
    let currentY = (doc as any).lastAutoTable?.finalY || 0;
    if (type !== "challan" && currentY) {
      currentY += 40; // Space for totals and word amount
    } else {
      currentY += 20;
    }

    if (currentY < signatureY - 40) { // If we have space on the page
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      
      const termsTitle = o.termsAndConditions ? "Terms & Conditions" : "Notes";
      const termsContent = o.termsAndConditions || o.notes;`;

const newStr = `  // Terms and Conditions Section (For Quotations, Invoices, etc.)
  let signatureY = doc.internal.pageSize.getHeight() - 40;
  const ord = order as any;
  if (ord.termsAndConditions || ord.notes) {
    let currentY = (doc as any).lastAutoTable?.finalY || 0;
    if (type !== "challan" && currentY) {
      currentY += 40; // Space for totals and word amount
    } else {
      currentY += 20;
    }

    if (currentY < signatureY - 40) { // If we have space on the page
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      
      const termsTitle = ord.termsAndConditions ? "Terms & Conditions" : "Notes";
      const termsContent = ord.termsAndConditions || ord.notes;`;

code = code.replace(oldStr, newStr);
fs.writeFileSync('src/lib/pdf.ts', code);
console.log('Fixed o to ord');
