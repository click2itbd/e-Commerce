const fs = require('fs');
let code = fs.readFileSync('src/lib/pdf.ts', 'utf8');

// 1. Remove from bottom
const oldSignatureBlock = `  // Prepared By
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "bold");
  doc.text(\`Prepared By: \${order.createdBy || 'Admin'}\`, 15, bottomY - 10);`;

code = code.replace(oldSignatureBlock, "");

// 2. Add to top
const targetBlock = `      let currentRightY = currentY + 30;
      
      if (o.workOrderNumber) {
          doc.setFont("helvetica", "bold");
          doc.text("Work Order: ", 15 + (pageWidth - 30) / 2 + 5, currentRightY);
          doc.setFont("helvetica", "normal");
          doc.text(o.workOrderNumber, 15 + (pageWidth - 30) / 2 + 30, currentRightY);
      }`;

const newBlock = `      let currentRightY = currentY + 30;
      
      doc.setFont("helvetica", "bold");
      doc.text("Prepared By: ", 15 + (pageWidth - 30) / 2 + 5, currentRightY);
      doc.setFont("helvetica", "normal");
      doc.text(o.createdBy || "Admin", 15 + (pageWidth - 30) / 2 + 28, currentRightY);
      currentRightY += 6;
      
      if (o.workOrderNumber) {
          doc.setFont("helvetica", "bold");
          doc.text("Work Order: ", 15 + (pageWidth - 30) / 2 + 5, currentRightY);
          doc.setFont("helvetica", "normal");
          doc.text(o.workOrderNumber, 15 + (pageWidth - 30) / 2 + 28, currentRightY);
      }`;

if (code.includes('let currentRightY = currentY + 30;')) {
    code = code.replace(targetBlock, newBlock);
    fs.writeFileSync('src/lib/pdf.ts', code, 'utf8');
    console.log("Moved Prepared By to top");
} else {
    console.log("Could not find target block");
}
