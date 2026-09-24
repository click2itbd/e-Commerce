import { logoBase64 } from './logoBase64';

import { Order, Transaction, SiteSettings } from '../types';
import { formatCurrency } from './utils';

function amountToWords(num: number): string {
    const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
    const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];

    if (num === 0) return 'Zero';

    const numStr = Math.floor(num).toString();
    if (numStr.length > 9) return 'Amount too large';

    const n = ('000000000' + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{3})$/);
    if (!n) return '';

    let str = '';
    
    let crore = parseInt(n[1]);
    if (crore > 0) {
        if (crore < 20) str += a[crore];
        else str += b[Math.floor(crore / 10)] + ' ' + a[crore % 10];
        str += 'Crore ';
    }

    let lakh = parseInt(n[2]);
    if (lakh > 0) {
        if (lakh < 20) str += a[lakh];
        else str += b[Math.floor(lakh / 10)] + ' ' + a[lakh % 10];
        str += 'Lakh ';
    }

    let thousand = parseInt(n[3]);
    if (thousand > 0) {
        if (thousand < 20) str += a[thousand];
        else str += b[Math.floor(thousand / 10)] + ' ' + a[thousand % 10];
        str += 'Thousand ';
    }

    let units = parseInt(n[4]);
    if (units > 0) {
        let hundred = Math.floor(units / 100);
        let rem = units % 100;
        
        if (hundred > 0) {
            str += a[hundred] + 'Hundred ';
        }
        if (rem > 0) {
            if (rem < 20) str += a[rem];
            else str += b[Math.floor(rem / 10)] + ' ' + (rem % 10 ? a[rem % 10] : '');
        }
    }

    return str.trim();
}

export const generatePDF = async (order: Order | Transaction, type: 'invoice' | 'quotation' | 'challan' | 'receipt', settings: SiteSettings, action: 'download' | 'doc' = 'download'): Promise<any> => {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const doc = new jsPDF('p', 'mm', 'a4'); 
  let currentY = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const useLetterhead = settings?.documentDesign?.printOnLetterhead;

  // ----- HEADER -----
  if (!useLetterhead) {
    try {
      doc.addImage(logoBase64, 'PNG', 20, currentY, 25, 20);
    } catch(e) {
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 58, 138); // Deep Blue
      doc.text(settings?.brandName || 'CLICK2IT BD', 20, currentY + 10);
    }
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Shop No. 1072, Level-10, Multiplan Center', 20, currentY + 25);
    doc.text('69-71, New Elephant Road, Dhaka-1205, Bangladesh.', 20, currentY + 29);
    doc.text('Phone: 01916618866, 01712258259 | Web: click2itbd.com', 20, currentY + 33);
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

  currentY += 45;

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
    doc.text(`Receipt No: ${tx.referenceId}`, pageWidth - 80, currentY + 11);
    doc.text(`Date: ${new Date(tx.date).toLocaleDateString()}`, pageWidth - 80, currentY + 17);
    currentY += 30;
    
    // Rect box for receipt amount
    doc.setFillColor(245, 245, 245);
    doc.rect(20, currentY, pageWidth - 40, 20, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Amount Received:', 30, currentY + 13);
    doc.setTextColor(30, 58, 138);
    doc.text(formatCurrency(tx.amount, settings), pageWidth - 70, currentY + 13);
    
    currentY += 40;
  } else {
    const o = order as Order;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text(type === 'challan' ? 'Ship To:' : 'Bill To:', 20, currentY + 5);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(o.customerName, 20, currentY + 12);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(o.customerPhone, 20, currentY + 17);
    
    let addressY = currentY + 22;
    if (type === 'challan') {
      const addressText = doc.splitTextToSize(`Address: ${o.shippingAddress || 'N/A'}`, 80);
      doc.text(addressText, 20, addressY);
      addressY += (addressText.length * 5);
    } else if (o.paymentMethod === 'cod') {
      doc.text('Address: Pay On Delivery', 20, addressY);
      addressY += 5;
    }

    doc.setFont('helvetica', 'bold');
    let detailsLabel = 'Invoice Details:';
    if (type === 'quotation') detailsLabel = 'Quote Details:';
    if (type === 'challan') detailsLabel = 'Challan Details:';
    
    doc.text(detailsLabel, pageWidth - 80, currentY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`Doc No: ${o.documentNumber || o.id.substring(0, 8).toUpperCase()}`, pageWidth - 80, currentY + 11);
    doc.text(`Date: ${new Date(o.createdAt).toLocaleDateString()}`, pageWidth - 80, currentY + 17);
    currentY = Math.max(addressY, currentY + 20) + 10;
    
    // Table
    const tableData = o.items.map(item => {
      let nameDesc = item.name;
      if (item.hasSerialTracking && type !== 'quotation') {
        const serials = item.selectedSerials?.join(', ') || 'N/A';
        nameDesc += `\nSN: ${serials}`;
        if (item.warrantyMonths && item.warrantyMonths > 0) {
          const warrantyEnd = new Date(o.createdAt);
          warrantyEnd.setMonth(warrantyEnd.getMonth() + item.warrantyMonths);
          nameDesc += `\nWarranty: ${item.warrantyMonths} Months`;
        }
      }
      return [
        nameDesc,
        item.quantity.toString(),
        type === 'challan' ? '-' : formatCurrency(item.price, settings),
        type === 'challan' ? '-' : formatCurrency(item.price * item.quantity, settings)
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
      
      const totalsX = pageWidth - 90;
      const alignRightX = pageWidth - 14;

      doc.setTextColor(80, 80, 80);
      doc.text('Subtotal:', totalsX, finalY);
      doc.setTextColor(0, 0, 0);
      doc.text(formatCurrency(subtotal, settings), alignRightX, finalY, { align: 'right' });
      
      let currTotalY = finalY;
      
      if (discount > 0) {
        currTotalY += 7;
        doc.setTextColor(80, 80, 80);
        doc.text('Discount:', totalsX, currTotalY);
        doc.setTextColor(220, 38, 38); // Red
        doc.text(`-${formatCurrency(discount, settings)}`, alignRightX, currTotalY, { align: 'right' });
      }
      
      currTotalY += 10;
      doc.setDrawColor(220, 220, 220);
      doc.line(totalsX, currTotalY - 6, alignRightX, currTotalY - 6);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 58, 138);
      doc.text('Total:', totalsX, currTotalY);
      doc.text(formatCurrency(o.total, settings), alignRightX, currTotalY, { align: 'right' });

      // Amount in words
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      const words = amountToWords(o.total);
      if (words) {
        doc.text(`In Words: ${words} Taka Only`, 20, currTotalY);
      }
      
      if (type === 'invoice') {
        const paidAmt = Number(o.paidAmount || 0);
        const totalAmt = Number(o.total || 0);
        const dueAmt = Math.max(0, totalAmt - paidAmt);
        
        currTotalY += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(80, 80, 80);
        doc.text('Paid Amount:', totalsX, currTotalY);
        doc.setTextColor(22, 163, 74); // Green
        doc.text(formatCurrency(paidAmt, settings), alignRightX, currTotalY, { align: 'right' });
        
        if (dueAmt > 0) {
          currTotalY += 7;
          doc.setTextColor(80, 80, 80);
          doc.text('Due Amount:', totalsX, currTotalY);
          doc.setTextColor(220, 38, 38); // Red
          doc.text(formatCurrency(dueAmt, settings), alignRightX, currTotalY, { align: 'right' });
        }

        currTotalY += 12;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        
        if (paidAmt === 0) {
          doc.setTextColor(220, 38, 38); // Red
          doc.text('UNPAID / FULL DUE', alignRightX, currTotalY, { align: 'right' });
        } else if (o.paymentMethod) {
          doc.setTextColor(22, 163, 74); // Green
          const methodDisplay = o.paymentMethod === 'cod' ? 'CASH ON DELIVERY' : `PAID VIA ${o.paymentMethod.toUpperCase()}`;
          doc.text(methodDisplay, alignRightX, currTotalY, { align: 'right' });
          if (o.paymentReference) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text(`Ref: ${o.paymentReference}`, alignRightX, currTotalY + 5, { align: 'right' });
          }
        }
      }

      // Notes & Terms
      let currentBottomY = currTotalY + 15;
      if (o.notes || o.termsAndConditions) {
        if (o.notes) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 58, 138);
          doc.text('Notes:', 20, currentBottomY);
          currentBottomY += 5;
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(80, 80, 80);
          const splitNotes = doc.splitTextToSize(o.notes, 120);
          doc.text(splitNotes, 20, currentBottomY);
          currentBottomY += (splitNotes.length * 4) + 5;
        }

        if (o.termsAndConditions) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 58, 138);
          doc.text('Terms & Conditions:', 20, currentBottomY);
          currentBottomY += 5;
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(80, 80, 80);
          const splitTerms = doc.splitTextToSize(o.termsAndConditions, 120);
          doc.text(splitTerms, 20, currentBottomY);
        }
      }
    }
  }

  // Signatures
  if (type === 'invoice' || type === 'challan' || type === 'quotation') {
    const sigY = doc.internal.pageSize.getHeight() - 35;
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.5);
    
    // Customer Signature
    doc.line(20, sigY, 70, sigY);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text('Customer Signature', 45, sigY + 5, { align: 'center' });

    // Authorized Signature
    doc.line(pageWidth - 70, sigY, pageWidth - 20, sigY);
    doc.text('Authorized Signature', pageWidth - 45, sigY + 5, { align: 'center' });
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setDrawColor(220, 220, 220);
  doc.line(20, footerY, pageWidth - 20, footerY);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  
  const orderDate = (order as any).createdAt || (order as any).date;
  if (orderDate) {
    doc.text(`Order Date: ${new Date(orderDate).toLocaleString()}`, pageWidth / 2, footerY + 4, { align: 'center' });
  }
  
  doc.text('Thank you for your business!', pageWidth / 2, footerY + 8, { align: 'center' });
  doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, footerY + 12, { align: 'center' });

  if ((order as any)._autoPrint) {
    doc.autoPrint();
    const blobURL = URL.createObjectURL(doc.output('blob'));
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    iframe.src = blobURL;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      setTimeout(() => { iframe.contentWindow?.print(); }, 100);
    };
  } else if (action === 'download') {
    doc.save(${type}_.pdf);
  }
  
  return doc;
};