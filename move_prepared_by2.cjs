const fs = require('fs');
let code = fs.readFileSync('src/lib/pdf.ts', 'utf8');

const targetBlock = /let currentRightY = currentY \+ 30;\s*if \(o\.workOrderNumber\) \{\s*doc\.setFont\("helvetica", "bold"\);\s*doc\.text\("Work Order: ", 15 \+ \(pageWidth - 30\) \/ 2 \+ 5, currentRightY\);\s*doc\.setFont\("helvetica", "normal"\);\s*doc\.text\(o\.workOrderNumber, 15 \+ \(pageWidth - 30\) \/ 2 \+ 30, currentRightY\);\s*\}/s;

const newBlock = `let currentRightY = currentY + 30;

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

if (code.match(targetBlock)) {
    code = code.replace(targetBlock, newBlock);
    fs.writeFileSync('src/lib/pdf.ts', code, 'utf8');
    console.log("Moved Prepared By to top");
} else {
    console.log("Could not find target block");
}
