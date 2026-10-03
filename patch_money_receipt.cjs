const fs = require('fs');
let code = fs.readFileSync('src/lib/pdf.ts', 'utf8');

if (!code.includes('printMoneyReceipt')) {
    const injectStr = `
// Basic number to words converter (up to cores/millions)
const numberToWords = (num: number): string => {
  const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];

  if ((num = num.toString()).length > 9) return 'Overflow';
  const n = ('000000000' + num).substr(-9).match(/^(\\d{2})(\\d{2})(\\d{2})(\\d{1})(\\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Only' : 'Only';
  return str;
};

export const printMoneyReceipt = async (transaction: any, settings: any) => {
  try {
    const doc = new jsPDF('p', 'mm', [210, 148]); // A5 size (half A4) is standard for receipts
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let currentY = 15;

    // Draw border
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(5, 5, pageWidth - 10, pageHeight - 10);
    doc.rect(6, 6, pageWidth - 12, pageHeight - 12); // Double border

    // Header Logo & Company Info
    try {
      const urlsToTry = [settings?.logoUrl, "/logo.png", "/logo.jpeg"].filter(Boolean);
      let dataUrl = "";
      let loadedImg: any = null;
      for (const url of urlsToTry) {
        if (!url) continue;
        try {
          const img = new Image();
          img.crossOrigin = "Anonymous";
          await new Promise((resolve, reject) => {
            img.onload = () => resolve(true);
            img.onerror = () => reject(new Error("Load failed"));
            img.src = url;
          });
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            dataUrl = canvas.toDataURL("image/png");
            loadedImg = img;
            break;
          }
        } catch (e) {}
      }
      const businessNameText = settings?.businessName || settings?.brandName || "CLICK2IT BD";
      if (loadedImg && dataUrl) {
        const logoHeight = 12;
        const logoWidth = (loadedImg.width / loadedImg.height) * logoHeight;
        doc.addImage(dataUrl, "PNG", 15, currentY - 5, logoWidth, logoHeight);
      }
    } catch (err) {}

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(settings?.businessName || settings?.brandName || "CLICK2IT BD", pageWidth / 2, currentY, { align: "center" });
    
    currentY += 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const address = settings?.address || "Dhaka, Bangladesh";
    doc.text(address, pageWidth / 2, currentY, { align: "center" });

    currentY += 4;
    const phone = settings?.contactPhone || "+880";
    doc.text(\`Phone: \${phone}\`, pageWidth / 2, currentY, { align: "center" });

    currentY += 10;
    
    // Receipt Title Badge
    doc.setFillColor(0);
    doc.rect((pageWidth/2) - 25, currentY, 50, 8, "F");
    doc.setTextColor(255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("MONEY RECEIPT", pageWidth / 2, currentY + 6, { align: "center" });
    
    doc.setTextColor(0);
    currentY += 15;

    // Receipt details
    doc.setFontSize(10);
    doc.text(\`Receipt No: MR-\${transaction.id.slice(-6).toUpperCase()}\`, 15, currentY);
    doc.text(\`Date: \${new Date(transaction.date).toLocaleDateString()}\`, pageWidth - 15, currentY, { align: "right" });

    currentY += 12;
    doc.text(\`Received with thanks from:\`, 15, currentY);
    doc.setFont("helvetica", "bold");
    doc.text(transaction.entityName || "Walk-in Customer", 65, currentY);
    doc.setLineWidth(0.2);
    doc.line(62, currentY + 1, pageWidth - 15, currentY + 1); // underline

    currentY += 10;
    doc.setFont("helvetica", "normal");
    doc.text(\`The sum of BDT:\`, 15, currentY);
    doc.setFont("helvetica", "bold");
    doc.text(\`\${Number(transaction.amount).toLocaleString()}\`, 45, currentY);
    doc.line(42, currentY + 1, 80, currentY + 1); // underline
    
    doc.setFont("helvetica", "normal");
    doc.text(\`By Cash/Cheque/Bkash:\`, 85, currentY);
    doc.setFont("helvetica", "bold");
    doc.text((transaction.paymentMethod || "Cash").toUpperCase(), 125, currentY);
    doc.line(122, currentY + 1, pageWidth - 15, currentY + 1); // underline

    currentY += 10;
    doc.setFont("helvetica", "normal");
    doc.text(\`Amount (in words):\`, 15, currentY);
    doc.setFont("helvetica", "bold");
    doc.text(\`\${numberToWords(Number(transaction.amount))} Taka Only\`, 48, currentY);
    doc.line(46, currentY + 1, pageWidth - 15, currentY + 1); // underline

    currentY += 10;
    doc.setFont("helvetica", "normal");
    doc.text(\`On account of:\`, 15, currentY);
    doc.text(transaction.description || "Due Payment", 42, currentY);
    doc.line(40, currentY + 1, pageWidth - 15, currentY + 1); // underline

    // Amount Box
    currentY += 20;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.rect(15, currentY - 6, 45, 12);
    doc.text(\`BDT \${Number(transaction.amount).toLocaleString()}/-\`, 37.5, currentY + 2, { align: "center" });

    // Signatures
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.line(pageWidth - 55, currentY + 5, pageWidth - 15, currentY + 5);
    doc.text("Authorized Signature", pageWidth - 35, currentY + 10, { align: "center" });

    doc.save(\`Money_Receipt_\${transaction.id.slice(-6)}.pdf\`);
  } catch (err) {
    console.error("Failed to generate Money Receipt", err);
  }
};
`;
    // Inject at the end of the file
    fs.writeFileSync('src/lib/pdf.ts', code + injectStr);
    console.log("Added printMoneyReceipt");
} else {
    console.log("printMoneyReceipt already exists");
}
