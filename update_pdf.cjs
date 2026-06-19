const fs = require('fs');
const path = './src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /const generatePDF = \([\s\S]*?doc\.save\(\`\$\{type\}_\$\{order\.id\}\.pdf\`\);\n\s*\};\n/;

const newGeneratePDF = `const generatePDF = (order: Order | Transaction, type: 'invoice' | 'quotation' | 'challan' | 'receipt') => {
    const doc = new jsPDF('p', 'mm', 'a4'); 
    let currentY = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const useLetterhead = settings?.documentDesign?.printOnLetterhead;

    // ----- HEADER -----
    if (!useLetterhead) {
      // Company brand and contacts
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 58, 138); // Deep Blue
      doc.text(settings?.brandName || 'STAR TECH', 20, currentY + 10);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(settings?.contactPhone || '16793 | startech.com.bd', 20, currentY + 17);
      doc.text(settings?.contactAddress || '123 Main Street, City, Country', 20, currentY + 22);
    } else {
      currentY += 30; // Extra shift for letterhead
    }

    // Document Title Box
    doc.setFillColor(30, 58, 138); // Deep Blue
    doc.rect(pageWidth - 70, currentY - 5, 50, 14, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(type.toUpperCase(), pageWidth - 45, currentY + 4, { align: 'center' });

    currentY += 35;

    // ----- CUSTOMER & DOC INFO -----
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(20, currentY - 5, pageWidth - 20, currentY - 5);

    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    
    if (type === 'receipt') {
      const tx = order as Transaction;
      doc.setFont('helvetica', 'bold');
      doc.text('Bill To:', 20, currentY + 5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(tx.entityName, 20, currentY + 11);
      
      doc.setTextColor(80, 80, 80);
      doc.setFont('helvetica', 'bold');
      doc.text('Receipt Details:', pageWidth - 80, currentY + 5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(\`Receipt No: \${tx.referenceId}\`, pageWidth - 80, currentY + 11);
      doc.text(\`Date: \${new Date(tx.date).toLocaleDateString()}\`, pageWidth - 80, currentY + 17);
      currentY += 30;
      
      // Rect box for receipt amount
      doc.setFillColor(245, 245, 245);
      doc.rect(20, currentY, pageWidth - 40, 20, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Amount Received:', 30, currentY + 13);
      doc.setTextColor(30, 58, 138);
      doc.text(formatCurrency(tx.amount), pageWidth - 70, currentY + 13);
      
      currentY += 40;
    } else {
      const o = order as Order;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text('Bill To:', 20, currentY + 5);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(o.customerName, 20, currentY + 12);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(o.customerPhone, 20, currentY + 17);
      if (o.paymentMethod === 'cod') doc.text('Address: Pay On Delivery', 20, currentY + 22);

      doc.setFont('helvetica', 'bold');
      doc.text(\`\${type === 'quotation' ? 'Quote' : 'Invoice'} Details:\`, pageWidth - 80, currentY + 5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(\`Doc No: \${o.documentNumber || o.id.substring(0, 8).toUpperCase()}\`, pageWidth - 80, currentY + 11);
      doc.text(\`Date: \${new Date(o.createdAt).toLocaleDateString()}\`, pageWidth - 80, currentY + 17);
      currentY += 30;
      
      // Table
      const tableData = o.items.map(item => {
        let nameDesc = item.name;
        if (item.hasSerialTracking && type !== 'quotation') {
          const serials = item.selectedSerials?.join(', ') || 'N/A';
          nameDesc += \`\\nSN: \${serials}\`;
          if (item.warrantyMonths && item.warrantyMonths > 0) {
            const warrantyEnd = new Date(o.createdAt);
            warrantyEnd.setMonth(warrantyEnd.getMonth() + item.warrantyMonths);
            nameDesc += \`\\nWarranty: \${item.warrantyMonths} Months\`;
          }
        }
        return [
          nameDesc,
          item.quantity.toString(),
          type === 'challan' ? '-' : formatCurrency(item.price),
          type === 'challan' ? '-' : formatCurrency(item.price * item.quantity)
        ];
      });
      
      autoTable(doc, {
        startY: currentY,
        head: [['Product Description', 'Qty', 'Unit Price', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: {
          1: { halign: 'center' },
          2: { halign: 'right' },
          3: { halign: 'right' }
        }
      });
      
      if (type !== 'challan') {
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(10);
        
        const subtotal = o.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const discount = o.discountAmount || 0;
        
        const totalsX = pageWidth - 60;
        const alignRightX = pageWidth - 20;

        doc.setTextColor(80, 80, 80);
        doc.text('Subtotal:', totalsX, finalY);
        doc.setTextColor(0, 0, 0);
        doc.text(formatCurrency(subtotal), alignRightX, finalY, { align: 'right' });
        
        let currTotalY = finalY;
        
        if (discount > 0) {
          currTotalY += 7;
          doc.setTextColor(80, 80, 80);
          doc.text('Discount:', totalsX, currTotalY);
          doc.setTextColor(220, 38, 38); // Red
          doc.text(\`-\${formatCurrency(discount)}\`, alignRightX, currTotalY, { align: 'right' });
        }
        
        currTotalY += 10;
        doc.setDrawColor(220, 220, 220);
        doc.line(totalsX, currTotalY - 6, alignRightX, currTotalY - 6);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 58, 138);
        doc.text('Total Amount:', totalsX, currTotalY);
        doc.text(formatCurrency(o.total), alignRightX, currTotalY, { align: 'right' });
        
        if (type === 'invoice' && o.paymentMethod) {
          currTotalY += 14;
          // Add Paid Stamp or Payment Info
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(22, 163, 74); // Green
          const methodDisplay = o.paymentMethod === 'cod' ? 'CASH ON DELIVERY' : \`PAID VIA \${o.paymentMethod.toUpperCase()}\`;
          doc.text(methodDisplay, alignRightX, currTotalY, { align: 'right' });
          if (o.paymentReference) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text(\`Ref: \${o.paymentReference}\`, alignRightX, currTotalY + 5, { align: 'right' });
          }
        }
        
        currentY = currTotalY + 20;
      } else {
         currentY = (doc as any).lastAutoTable.finalY + 30;
      }
    }
    
    // ----- FOOTER -----
    const pageHeight = doc.internal.pageSize.getHeight();
    if (pageHeight - currentY < 40) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(20, pageHeight - 40, pageWidth - 20, pageHeight - 40);
    
    // Signatures
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text('Customer Signature', 30, pageHeight - 20);
    doc.text('Authorized Signature', pageWidth - 70, pageHeight - 20);
    
    // Thank you text
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for your business!', pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    doc.save(\`\${type}_\${order.id}\.pdf\`);
  };
`;

if (regex.test(content)) {
    content = content.replace(regex, newGeneratePDF);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Successfully updated generatePDF for custom formats');
} else {
    console.error('generatePDF method not found using regex');
}
