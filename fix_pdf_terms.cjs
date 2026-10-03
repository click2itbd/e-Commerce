const fs = require('fs');
let code = fs.readFileSync('src/lib/pdf.ts', 'utf8');

const targetStr = `      const words = amountToWords(o.total);
      if (words) {
        doc.setFont("helvetica", "normal");
        doc.text(\`Taka \${words} Only\`, 48, finalY + 8);
      }
    }`;

const newStr = `      const words = amountToWords(o.total);
      if (words) {
        doc.setFont("helvetica", "normal");
        doc.text(\`Taka \${words} Only\`, 48, finalY + 8);
      }
    }
  }

  // Terms and Conditions Section (For Quotations, Invoices, etc.)
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
      const termsContent = o.termsAndConditions || o.notes;
      
      doc.text(termsTitle + ":", 15, currentY);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      
      const splitTerms = doc.splitTextToSize(termsContent || "", pageWidth - 30);
      doc.text(splitTerms, 15, currentY + 6);
    }
  }

  // Footer / Signatures
  const bottomY = signatureY;`;

code = code.replace(
  `      const words = amountToWords(o.total);
      if (words) {
        doc.setFont("helvetica", "normal");
        doc.text(\`Taka \${words} Only\`, 48, finalY + 8);
      }
    }
  }

  // Footer / Signatures
  const bottomY = doc.internal.pageSize.getHeight() - 40;`,
  newStr
);

fs.writeFileSync('src/lib/pdf.ts', code);
console.log('Fixed terms in PDF');
