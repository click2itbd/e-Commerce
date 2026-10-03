const fs = require('fs');
const lines = fs.readFileSync('src/pages/admin/tabs/services/Services.tsx', 'utf8').split('\n');

// Find start and end
const startIdx = lines.findIndex(l => l.includes('const printServiceReceipt = async'));
// Find "const printServiceBill" as the end marker
const endIdx = lines.findIndex((l, i) => i > startIdx && l.includes('const printServiceBill = async'));

console.log("start:", startIdx, "end:", endIdx);
console.log("Lines", startIdx, "to", endIdx - 1, "will be replaced");

const newFunc = `  const printServiceReceipt = async (record: ServiceRecord) => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      let currentY = 20;

      // Big title (left)
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('SERVICE RECEIPT', 15, currentY + 10);

      // Company info (right)
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text(settings?.businessName || settings?.brandName || 'CLICK2IT BD', pageWidth - 15, currentY, { align: 'right' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      let addrY = currentY + 6;
      const addr = settings?.address || 'Shop No. 1072, Level 10, Multiplan Center\\n69-71, New Elephant Road, Dhaka-1205';
      const addrLines = doc.splitTextToSize(addr.replace(/\\\\n/g, '\\n'), 80);
      addrLines.forEach((line) => { doc.text(line, pageWidth - 15, addrY, { align: 'right' }); addrY += 5; });
      const phone = settings?.contactPhone || '+8809640887777, +8801729887777';
      doc.text(phone, pageWidth - 15, addrY, { align: 'right' });
      doc.text(settings?.website || 'www.click2itbd.com', pageWidth - 15, addrY + 5, { align: 'right' });
      currentY = Math.max(currentY + 25, addrY + 15);

      // Two info boxes
      const boxHeight = 38;
      doc.setFillColor(248, 250, 252);
      doc.rect(15, currentY, (pageWidth - 30) / 2, boxHeight, 'F');
      doc.rect(15 + (pageWidth - 30) / 2, currentY, (pageWidth - 30) / 2, boxHeight, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(15 + (pageWidth - 30) / 2, currentY, 15 + (pageWidth - 30) / 2, currentY + boxHeight);

      // Left box
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('Customer Information:', 20, currentY + 8);
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(record.customerName || 'N/A', 20, currentY + 18);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text('Phone: ' + (record.customerPhone || 'N/A'), 20, currentY + 25);

      // Right box
      const rightX = 15 + (pageWidth - 30) / 2 + 5;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('Ticket Details:', rightX, currentY + 8);
      doc.setTextColor(15, 23, 42);
      doc.text('Ticket No:  ' + record.id.slice(-6).toUpperCase(), rightX, currentY + 18);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('Date:  ' + new Date(record.receivedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), rightX, currentY + 25);
      doc.text('Status:  ' + record.status.toUpperCase(), rightX, currentY + 32);
      currentY += boxHeight + 12;

      // Product details table
      autoTable(doc, {
        startY: currentY,
        head: [['S.N.', 'Product Details', 'Information']],
        body: [
          ['1', 'Product Name', record.productName || 'N/A'],
          ['2', 'Serial / IMEI', record.serialNumber || 'N/A'],
          ['3', 'Equipment Type', record.equipmentType || 'N/A'],
          ['4', 'Service Type', record.isWarranty ? 'Warranty Service' : 'Paid Service'],
          ['5', 'Issue Description', record.issueDescription || 'N/A'],
        ],
        theme: 'plain',
        headStyles: { fillColor: [15, 22, 33], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10, cellPadding: 4 },
        bodyStyles: { textColor: [15, 23, 42], fontSize: 10, cellPadding: 4 },
        columnStyles: { 0: { cellWidth: 12 }, 1: { cellWidth: 60 }, 2: { cellWidth: 'auto' } },
      });

      // Footer signatures
      const bottomY = doc.internal.pageSize.getHeight() - 40;
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.5);
      doc.line(15, bottomY, 70, bottomY);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text('Authorized Signature', 15, bottomY + 5);
      doc.line(pageWidth - 70, bottomY, pageWidth - 15, bottomY);
      doc.text('Customer Signature', pageWidth - 15, bottomY + 5, { align: 'right' });
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('* Note: There is no warranty in case of Burning or Physical Damages.', 15, bottomY + 20);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('THANK YOU FOR YOUR BUSINESS', pageWidth / 2, bottomY + 30, { align: 'center' });

      doc.save('Service_Receipt_' + record.id.slice(-6) + '.pdf');
      toast.success('Receipt generated successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate receipt');
    }
  };
`;

lines.splice(startIdx, endIdx - startIdx, newFunc);
fs.writeFileSync('src/pages/admin/tabs/services/Services.tsx', lines.join('\n'), 'utf8');
console.log("Replaced printServiceReceipt");
