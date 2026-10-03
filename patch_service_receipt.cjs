const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/services/Services.tsx', 'utf8');

const targetFunctionStart = "  const printServiceReceipt = async (record: ServiceRecord) => {";
const targetFunctionEnd = "  const printServiceBill = async (record: ServiceRecord) => {";

const startIndex = code.indexOf(targetFunctionStart);
const endIndex = code.indexOf(targetFunctionEnd);

if (startIndex !== -1 && endIndex !== -1) {
    const newFunction = `  const printServiceReceipt = async (record: ServiceRecord) => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      let currentY = 20;

      // TOP LEFT: SERVICE RECEIPT
      doc.setFontSize(26);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("SERVICE RECEIPT", 14, currentY + 10);

      // TOP RIGHT: COMPANY INFO
      doc.setFontSize(14);
      doc.text(settings?.businessName || settings?.brandName || "CLICK2IT BD", pageWidth - 14, currentY, { align: "right" });
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105); // slate-600
      
      let finalAddress = settings?.address || "Shop No. 1072, Level 10, Multiplan Center\\n69-71, New Elephant Road, Dhaka-1205";
      if (finalAddress.trim() === 'Dhaka, Bangladesh') {
         finalAddress = "Shop No. 1072, Level 10, Multiplan Center\\n69-71, New Elephant Road, Dhaka-1205";
      }
      const addressLines = doc.splitTextToSize(finalAddress, 80);
      addressLines.forEach((line: string) => {
        currentY += 5;
        doc.text(line, pageWidth - 14, currentY, { align: "right" });
      });
      
      const finalPhones = settings?.contactPhone ? (settings.contactPhone.includes('+880') ? settings.contactPhone : \`+8809640887777, +8801729887777\`) : "+8809640887777, +8801729887777";
      currentY += 5;
      doc.text(finalPhones, pageWidth - 14, currentY, { align: "right" });
      
      currentY += 5;
      doc.text("www.click2itbd.com", pageWidth - 14, currentY, { align: "right" });

      currentY += 15;

      // CUSTOMER & TICKET DETAILS BOX
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(14, currentY, pageWidth - 28, 35, "F");
      
      // Vertical separator line
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(pageWidth / 2, currentY + 5, pageWidth / 2, currentY + 30);

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139); // slate-500
      
      let boxY = currentY + 8;
      doc.text("Customer Information:", 20, boxY);
      doc.text("Ticket Details:", (pageWidth / 2) + 6, boxY);

      boxY += 8;
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(record.customerName || "Walk-in Customer", 20, boxY);
      
      doc.setFontSize(10);
      doc.text(\`Ticket No: \`, (pageWidth / 2) + 6, boxY);
      doc.text(record.id.slice(-6).toUpperCase(), (pageWidth / 2) + 26, boxY);

      boxY += 7;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text(\`Phone: \${record.customerPhone || "N/A"}\`, 20, boxY);
      doc.text(\`Date: \${new Date(record.receivedAt).toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' })}\`, (pageWidth / 2) + 6, boxY);

      boxY += 7;
      doc.text(\`Status: \${record.status.toUpperCase()}\`, (pageWidth / 2) + 6, boxY);

      currentY += 45;

      // TABLE
      autoTable(doc, {
        startY: currentY,
        head: [['S.N.', 'Product Details', 'Information']],
        body: [
          ['1', 'Product Name', record.productName || ''],
          ['2', 'Serial / IMEI', record.serialNumber || ''],
          ['3', 'Equipment Type', record.equipmentType || 'Laptop'],
          ['4', 'Service Type', record.isWarranty ? 'Warranty Service' : 'Paid Service'],
          ['5', 'Issue Description', record.issueDescription || '']
        ],
        theme: 'plain',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: 255,
          fontStyle: 'bold',
          cellPadding: 4
        },
        bodyStyles: {
          textColor: [15, 23, 42],
          cellPadding: 6,
          fontSize: 10
        },
        columnStyles: {
          0: { cellWidth: 15, fontStyle: 'normal' },
          1: { cellWidth: 70 },
          2: { cellWidth: 'auto' }
        },
        alternateRowStyles: {
          fillColor: [255, 255, 255]
        }
      });

      let finalY = (doc as any).lastAutoTable.finalY + 40;
      
      if (finalY > 260) {
        doc.addPage();
        finalY = 40;
      }

      // SIGNATURES
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      
      // Authorized Signature
      doc.line(14, finalY, 70, finalY);
      doc.text("Authorized Signature", 14, finalY + 5);
      
      // Customer Signature
      doc.line(pageWidth - 70, finalY, pageWidth - 14, finalY);
      doc.text("Customer Signature", pageWidth - 14, finalY + 5, { align: "right" });

      finalY += 15;
      
      // Note
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("* Note: There is no warranty in case of Burning or Physical Damages.", 14, finalY);

      finalY += 15;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("THANK YOU FOR YOUR BUSINESS", pageWidth / 2, finalY, { align: "center" });

      doc.save(\`Service_Receipt_\${record.id.slice(-6)}.pdf\`);
      toast.success('Receipt generated successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate receipt');
    }
  };

`;
    
    code = code.substring(0, startIndex) + newFunction + code.substring(endIndex);
    fs.writeFileSync('src/pages/admin/tabs/services/Services.tsx', code);
    console.log('Successfully replaced printServiceReceipt');
} else {
    console.log('Could not find target strings');
}
