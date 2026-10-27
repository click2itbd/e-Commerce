import { Order, SiteSettings } from '../types';
import { printBlobPdf } from './pdf';

export interface BranchFinancialSummary {
  branchName: string;
  orderCount: number;
  invoiced: number;
  paid: number;
  due: number;
  lastOrderDate?: string;
}

export interface CorporateStatementParams {
  companyName: string;
  companyId: string;
  clientName?: string;
  clientPhone?: string;
  clientAddress?: string;
  periodLabel: string;
  branchSummaries: BranchFinancialSummary[];
  orders: Order[];
  settings?: SiteSettings | any;
  action?: 'download' | 'print';
}

export async function generateCorporateGroupStatement(params: CorporateStatementParams): Promise<void> {
  const {
    companyName,
    clientName = companyName,
    clientPhone = '',
    clientAddress = '',
    periodLabel,
    branchSummaries,
    orders,
    settings,
    action = 'download',
  } = params;

  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const brandName = settings?.businessName || settings?.brandName || 'CLICK2IT BD';
  const brandPhone = settings?.phone || '+880 1712-220734';
  const brandEmail = settings?.email || 'sales@click2itbd.com';
  const brandAddress = settings?.address || 'Dhaka, Bangladesh';

  // Overall Totals
  const totalInvoiced = branchSummaries.reduce((s, b) => s + b.invoiced, 0);
  const totalPaid = branchSummaries.reduce((s, b) => s + b.paid, 0);
  const totalDue = Math.max(0, totalInvoiced - totalPaid);
  const totalOrdersCount = orders.length;

  let currentY = 16;

  // Header Banner Background
  doc.setFillColor(8, 22, 33); // #081621
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Decorative Accent Strip
  doc.setFillColor(239, 68, 68); // #EF4444 red accent
  doc.rect(0, 38, pageWidth, 2.5, 'F');

  // Header Left: Brand info
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(brandName, 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`Corporate IT Solutions, Hardware & Enterprise Services`, 14, 24);
  doc.text(`Phone: ${brandPhone}  |  Email: ${brandEmail}`, 14, 29);
  doc.text(`Address: ${brandAddress}`, 14, 34);

  // Header Right: Document Title & Metadata
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('CORPORATE STATEMENT', pageWidth - 14, 18, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  const refNo = `STMT-${Date.now().toString().slice(-6)}`;
  doc.text(`Ref: ${refNo}`, pageWidth - 14, 24, { align: 'right' });
  doc.text(`Statement Period: ${periodLabel}`, pageWidth - 14, 29, { align: 'right' });
  doc.text(`Date Generated: ${new Date().toLocaleDateString('en-GB')}`, pageWidth - 14, 34, { align: 'right' });

  currentY = 48;

  // Client Details & Bill To
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, pageWidth - 28, 26, 2, 2, 'FD');

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('BILL TO CORPORATE GROUP / CLIENT:', 18, currentY + 6);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.text(clientName, 18, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const clientContactLine = [
    clientPhone ? `Contact: ${clientPhone}` : null,
    clientAddress ? `Address: ${clientAddress}` : null,
    `Active Projects / Branches: ${branchSummaries.length}`
  ].filter(Boolean).join('   |   ');
  doc.text(clientContactLine || 'Corporate Accounts Department', 18, currentY + 18);

  currentY += 32;

  // Financial Summary Cards Row
  const cardWidth = (pageWidth - 28 - 9) / 4;
  const cardHeight = 18;

  // Card 1: Total Invoiced
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL BILLED', 17, currentY + 5.5);
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`BDT ${totalInvoiced.toLocaleString()}`, 17, currentY + 13);

  // Card 2: Total Paid
  const c2X = 14 + cardWidth + 3;
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(c2X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(5, 150, 105);
  doc.text('TOTAL PAID / SETTLED', c2X + 3, currentY + 5.5);
  doc.setFontSize(10.5);
  doc.setTextColor(6, 95, 70);
  doc.text(`BDT ${totalPaid.toLocaleString()}`, c2X + 3, currentY + 13);

  // Card 3: Total Outstanding Due
  const c3X = c2X + cardWidth + 3;
  doc.setFillColor(254, 242, 242); // rose-50
  doc.setDrawColor(254, 205, 211);
  doc.roundedRect(c3X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(225, 29, 72);
  doc.text('OUTSTANDING DUE', c3X + 3, currentY + 5.5);
  doc.setFontSize(10.5);
  doc.setTextColor(159, 18, 57);
  doc.text(`BDT ${totalDue.toLocaleString()}`, c3X + 3, currentY + 13);

  // Card 4: Projects / Settlement Status
  const c4X = c3X + cardWidth + 3;
  doc.setFillColor(238, 242, 255); // indigo-50
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(c4X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(79, 70, 229);
  doc.text('TOTAL INVOICES', c4X + 3, currentY + 5.5);
  doc.setFontSize(10.5);
  doc.setTextColor(49, 46, 129);
  const collRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 100;
  doc.text(`${totalOrdersCount} Bills (${collRate}% Paid)`, c4X + 3, currentY + 13);

  currentY += 24;

  // Section 1 Heading: Branch-wise Breakdown
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Project & Branch-Wise Financial Breakdown', 14, currentY);

  currentY += 4;

  // Branch Summary Table
  const branchTableRows = branchSummaries.map((b, idx) => [
    (idx + 1).toString(),
    b.branchName || 'Main / General Office',
    b.orderCount.toString(),
    `BDT ${b.invoiced.toLocaleString()}`,
    `BDT ${b.paid.toLocaleString()}`,
    `BDT ${b.due.toLocaleString()}`,
    b.due <= 0 ? 'Clear' : 'Pending'
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    head: [['#', 'Project / Branch Name', 'Bills', 'Total Billed', 'Total Paid', 'Outstanding Due', 'Status']],
    body: branchTableRows,
    foot: [[
      '',
      'Total Across All Projects',
      totalOrdersCount.toString(),
      `BDT ${totalInvoiced.toLocaleString()}`,
      `BDT ${totalPaid.toLocaleString()}`,
      `BDT ${totalDue.toLocaleString()}`,
      totalDue <= 0 ? 'All Clear' : 'Action Required'
    ]],
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 'auto', fontStyle: 'bold' },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 32, halign: 'right' },
      4: { cellWidth: 32, halign: 'right', textColor: [5, 150, 105] },
      5: { cellWidth: 32, halign: 'right', textColor: [225, 29, 72], fontStyle: 'bold' },
      6: { cellWidth: 22, halign: 'center' },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Check page break for Section 2
  if (currentY > pageHeight - 65) {
    doc.addPage();
    currentY = 18;
  }

  // Section 2 Heading: Itemized Invoices
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Itemized Invoices & Billing Ledger', 14, currentY);

  currentY += 4;

  const invoiceTableRows = orders.slice(0, 40).map((o, idx) => {
    const rawDate = o.createdAt || (o as any).date || '';
    const dateStr = rawDate ? new Date(rawDate).toLocaleDateString('en-GB') : '-';
    const total = Number(o.total || 0);
    const paid = Number(o.paidAmount || (o as any).amountPaid || 0);
    const due = Math.max(0, total - paid);
    const branch = o.branchName || o.projectName || (o as any).shippingAddress?.slice(0, 25) || 'Main';
    const wo = (o as any).workOrderNumber || '-';

    return [
      dateStr,
      o.documentNumber || o.id.slice(0, 10),
      branch,
      wo,
      `BDT ${total.toLocaleString()}`,
      `BDT ${paid.toLocaleString()}`,
      `BDT ${due.toLocaleString()}`,
      due <= 0 ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'UNPAID')
    ];
  });

  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    head: [['Date', 'Invoice #', 'Project / Branch', 'WO / Ref #', 'Total', 'Paid', 'Due', 'Payment']],
    body: invoiceTableRows,
    theme: 'striped',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [241, 245, 249],
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 26, fontStyle: 'bold' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 24 },
      4: { cellWidth: 24, halign: 'right' },
      5: { cellWidth: 24, halign: 'right', textColor: [5, 150, 105] },
      6: { cellWidth: 24, halign: 'right', textColor: [225, 29, 72], fontStyle: 'bold' },
      7: { cellWidth: 18, halign: 'center' },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // Check if bank & signature fit, else add page
  if (currentY > pageHeight - 45) {
    doc.addPage();
    currentY = 20;
  }

  // Bank & Cheque Clearing Instructions
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, 110, 24, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('PAYMENT INSTRUCTIONS & BANK DETAILS:', 18, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`Account Name: ${settings?.bankAccountName || brandName}`, 18, currentY + 10);
  doc.text(`Bank Name: ${settings?.bankName || 'Dutch-Bangla Bank / City Bank'}   |   Branch: Principal`, 18, currentY + 14.5);
  doc.text(`Account No: ${settings?.bankAccountNumber || 'Contact Accounts'}   |   Routing: ${settings?.bankRouting || 'Available upon request'}`, 18, currentY + 19);

  // Signatures on Right
  const sigX = 145;
  doc.setDrawColor(148, 163, 184);
  doc.line(sigX, currentY + 17, sigX + 45, currentY + 17);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Authorized Signatory & Seal', sigX + 5, currentY + 21);

  // Document Footer
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Confidential Corporate Document — ${brandName} — Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  // Action
  if (action === 'print') {
    const blob = doc.output('blob');
    printBlobPdf(blob);
  } else {
    const safeCompName = companyName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    doc.save(`corporate_statement_${safeCompName}_${new Date().toISOString().split('T')[0]}.pdf`);
  }
}
