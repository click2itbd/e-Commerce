const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, 'Services.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace print functions
const printFunctionsOld = `  const printServiceReceipt = (record: ServiceRecord) => {
    toast.success('Print receipt triggered');
  };

  const printServiceBill = (record: ServiceRecord) => {
    toast.success('Print bill triggered');
  };`;

const printFunctionsNew = `  const printServiceReceipt = async (record: ServiceRecord) => {
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      let currentY = 20;

      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(settings?.brandName || 'CLICK2IT', 14, currentY);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      currentY += 6;
      doc.text(settings?.contactEmail || '', 14, currentY);
      currentY += 5;
      doc.text(settings?.contactPhone || '', 14, currentY);
      
      doc.setFontSize(24);
      doc.setTextColor(0);
      doc.text('SERVICE RECEIPT', pageWidth - 14, 25, { align: 'right' });

      currentY += 10;
      doc.setLineWidth(0.5);
      doc.line(14, currentY, pageWidth - 14, currentY);
      currentY += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Customer Information:', 14, currentY);
      doc.setFont('helvetica', 'normal');
      currentY += 6;
      doc.text(\`Name: \${record.customerName}\`, 14, currentY);
      currentY += 5;
      doc.text(\`Phone: \${record.customerPhone}\`, 14, currentY);

      let rightColY = currentY - 11;
      doc.setFont('helvetica', 'bold');
      doc.text('Ticket Details:', pageWidth - 60, rightColY);
      doc.setFont('helvetica', 'normal');
      rightColY += 6;
      doc.text(\`Ticket No: \${record.id.slice(-6).toUpperCase()}\`, pageWidth - 60, rightColY);
      rightColY += 5;
      doc.text(\`Date: \${new Date(record.receivedAt).toLocaleDateString()}\`, pageWidth - 60, rightColY);
      rightColY += 5;
      doc.text(\`Status: \${record.status.toUpperCase()}\`, pageWidth - 60, rightColY);

      currentY = Math.max(currentY, rightColY) + 15;

      autoTable(doc, {
        startY: currentY,
        head: [['Product Details', 'Information']],
        body: [
          ['Product Name', record.productName],
          ['Serial Number', record.serialNumber],
          ['Equipment Type', record.equipmentType || 'N/A'],
          ['Service Type', record.isWarranty ? 'Warranty Service' : 'Paid Service'],
          ['Issue Description', record.issueDescription]
        ],
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68] }
      });

      doc.save(\`Service_Receipt_\${record.id.slice(-6)}.pdf\`);
      toast.success('Receipt generated successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate receipt');
    }
  };

  const printServiceBill = async (record: ServiceRecord) => {
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      let currentY = 20;

      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(settings?.brandName || 'CLICK2IT', 14, currentY);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      currentY += 6;
      doc.text(settings?.contactEmail || '', 14, currentY);
      currentY += 5;
      doc.text(settings?.contactPhone || '', 14, currentY);
      
      doc.setFontSize(24);
      doc.setTextColor(0);
      doc.text('SERVICE BILL', pageWidth - 14, 25, { align: 'right' });

      currentY += 10;
      doc.setLineWidth(0.5);
      doc.line(14, currentY, pageWidth - 14, currentY);
      currentY += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Customer Information:', 14, currentY);
      doc.setFont('helvetica', 'normal');
      currentY += 6;
      doc.text(\`Name: \${record.customerName}\`, 14, currentY);
      currentY += 5;
      doc.text(\`Phone: \${record.customerPhone}\`, 14, currentY);

      let rightColY = currentY - 11;
      doc.setFont('helvetica', 'bold');
      doc.text('Invoice Details:', pageWidth - 60, rightColY);
      doc.setFont('helvetica', 'normal');
      rightColY += 6;
      doc.text(\`Invoice No: BILL-\${record.id.slice(-6).toUpperCase()}\`, pageWidth - 60, rightColY);
      rightColY += 5;
      doc.text(\`Date: \${new Date(record.receivedAt).toLocaleDateString()}\`, pageWidth - 60, rightColY);

      currentY = Math.max(currentY, rightColY) + 15;

      autoTable(doc, {
        startY: currentY,
        head: [['Description', 'Amount']],
        body: [
          [\`Service charge for \${record.productName} (SN: \${record.serialNumber})\`, formatCurrency(record.serviceCharge, settings)],
          ['Issue: ' + record.issueDescription, ''],
        ],
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68] }
      });

      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFont('helvetica', 'bold');
      doc.text(\`Total Due: \${formatCurrency(record.serviceCharge, settings)}\`, pageWidth - 14, finalY, { align: 'right' });
      
      doc.setFontSize(10);
      doc.text(\`Payment Status: \${record.paymentStatus?.toUpperCase() || 'PENDING'}\`, 14, finalY);

      doc.save(\`Service_Bill_\${record.id.slice(-6)}.pdf\`);
      toast.success('Bill generated successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate bill');
    }
  };`;

content = content.replace(printFunctionsOld, printFunctionsNew);

// Add updateServiceStatus below updateRmaStatus
const rmaEndString = `      console.error('Error updating RMA status:', error);
      toast.error('Failed to update status');
    }
  };`;

const addServiceStatusFunc = `      console.error('Error updating RMA status:', error);
      toast.error('Failed to update status');
    }
  };

  const updateServiceStatus = async (record: ServiceRecord, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'services', record.id), { status: newStatus });
      toast.success(\`Service Status updated to \${newStatus}\`);
      fetchData();
    } catch (error) {
      console.error('Error updating service status:', error);
      toast.error('Failed to update status');
    }
  };`;

content = content.replace(rmaEndString, addServiceStatusFunc);

// Add in-house action buttons
const rmaActionButtonsEnd = `                          </>
                        )}`;

const inHouseActionButtons = `                          </>
                        )}
                        {record.serviceType !== 'rma' && (
                          <>
                            {record.status === 'received' && (
                              <button onClick={() => updateServiceStatus(record, 'in_progress')} className="text-blue-500 hover:text-blue-700 mx-1 bg-blue-50 p-1.5 rounded" title="Start Repair">
                                <Wrench size={16} />
                              </button>
                            )}
                            {record.status === 'in_progress' && (
                              <button onClick={() => updateServiceStatus(record, 'ready')} className="text-amber-500 hover:text-amber-700 mx-1 bg-amber-50 p-1.5 rounded" title="Mark as Ready">
                                <CheckCircle size={16} />
                              </button>
                            )}
                            {record.status === 'ready' && (
                              <button onClick={() => updateServiceStatus(record, 'delivered')} className="text-green-600 hover:text-green-800 mx-1 bg-green-50 p-1.5 rounded" title="Deliver to Customer">
                                <ShieldCheck size={16} />
                              </button>
                            )}
                          </>
                        )}`;

content = content.replace(rmaActionButtonsEnd, inHouseActionButtons);

// Make sure to add CheckCircle import
content = content.replace('X, Plus, Settings, FileText, Download, Edit2, Truck }', 'X, Plus, Settings, FileText, Download, Edit2, Truck, CheckCircle }');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patched Successfully!');
