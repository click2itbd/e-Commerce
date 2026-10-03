const fs = require('fs');
let code = fs.readFileSync('src/lib/pdf.ts', 'utf8');

// The block where "Taka In Word: " is printed:
const oldStr = `      const words = amountToWords(o.total);
      if (words) {
        doc.setFont("helvetica", "normal");
        doc.text(\`Taka \${words} Only\`, 48, finalY + 8);
      }
    }
  }

  // Terms and Conditions Section (For Quotations, Invoices, etc.)
  let signatureY = doc.internal.pageSize.getHeight() - 40;
  const ord = order as any;
  if (ord.termsAndConditions || ord.notes) {
    let currentY = (doc as any).lastAutoTable?.finalY || 0;
    if (type !== "challan" && currentY) {
      currentY += 40; // Space for totals and word amount
    } else {
      currentY += 20;
    }`;

const newStr = `      const words = amountToWords(o.total);
      if (words) {
        doc.setFont("helvetica", "normal");
        doc.text(\`Taka \${words} Only\`, 48, finalY + 8);
      }
      currentY = finalY + 20; // Update global currentY
    } else {
      currentY = (doc as any).lastAutoTable?.finalY + 20 || currentY + 20;
    }
  }

  // Terms and Conditions Section (For Quotations, Invoices, etc.)
  let signatureY = doc.internal.pageSize.getHeight() - 40;
  const ord = order as any;
  if (ord.termsAndConditions || ord.notes) {
    // currentY is already at the correct position from above, just add a small margin
    currentY += 5;`;

code = code.replace(oldStr, newStr);
fs.writeFileSync('src/lib/pdf.ts', code);
console.log('Fixed terms overlap Y position');
