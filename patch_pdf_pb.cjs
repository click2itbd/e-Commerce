const fs = require('fs');
let code = fs.readFileSync('src/lib/pdf.ts', 'utf8');

const oldSig = `  // Authorized Signature
  doc.line(15, bottomY, 70, bottomY);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text("Authorized Signature", 15, bottomY + 5);`;

const newSig = `  // Authorized Signature
  if (ord?.preparedBy) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(71, 85, 105);
    doc.text(\`Prepared By: \${ord.preparedBy}\`, 15, bottomY - 5);
  }
  doc.line(15, bottomY, 70, bottomY);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text("Authorized Signature", 15, bottomY + 5);`;

code = code.replace(oldSig, newSig);
fs.writeFileSync('src/lib/pdf.ts', code);
console.log('Added preparedBy to PDF');
