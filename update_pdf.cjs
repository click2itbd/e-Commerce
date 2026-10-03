const fs = require('fs');
let code = fs.readFileSync('src/lib/pdf.ts', 'utf8');

const oldSignature = `  // Authorized Signature
  doc.line(15, bottomY, 70, bottomY);`;

const newSignature = `  // Prepared By
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "bold");
  doc.text(\`Prepared By: \${order.createdBy || 'Admin'}\`, 15, bottomY - 10);

  // Authorized Signature
  doc.line(15, bottomY, 70, bottomY);`;

code = code.replace(oldSignature, newSignature);
fs.writeFileSync('src/lib/pdf.ts', code, 'utf8');
console.log("Updated pdf.ts signatures");
