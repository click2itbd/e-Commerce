const fs = require('fs');
let code = fs.readFileSync('src/lib/pdf.ts', 'utf8');

const startIdx = code.indexOf('if (type === "receipt") {');
const endIdx = code.indexOf('} else {', startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const replacement = `if (type === "receipt") {
      const tx = order as Transaction;
      
      const boxHeight = 32;

      // Left Box - Bill To
      doc.setFillColor(248, 250, 252);
      doc.rect(15, currentY, (pageWidth - 30) / 2, boxHeight, "F");
      // Right Box - Details
      doc.rect(
        15 + (pageWidth - 30) / 2,
        currentY,
        (pageWidth - 30) / 2,
        boxHeight,
        "F"
      );
  
      // Vertical Divider Line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(
        15 + (pageWidth - 30) / 2,
        currentY,
        15 + (pageWidth - 30) / 2,
        currentY + boxHeight
      );

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      
      // Box 1
      doc.text("Bill To:", 20, currentY + 8);
      doc.text(tx.entityName || "N/A", 20, currentY + 18);
      
      // Box 2
      const rightX = 15 + (pageWidth - 30) / 2 + 5;
      doc.text("Receipt Details:", rightX, currentY + 8);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      
      doc.text(\`Receipt No: \${tx.referenceId}\`, rightX, currentY + 18);
      doc.text(\`Date: \${new Date(tx.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}\`, rightX, currentY + 24);

      currentY += boxHeight + 15;

      autoTable(doc, {
        startY: currentY,
        head: [["SL", "Payment Method", "Reference", "Amount"]],
        body: [
          ["1", tx.paymentMethod ? tx.paymentMethod.toUpperCase() : "CASH", tx.referenceId || "N/A", formatCurrency(tx.amount, settings)]
        ],
        theme: "plain",
        headStyles: {
          fillColor: [241, 245, 249],
          textColor: [71, 85, 105],
          fontStyle: "bold",
          halign: "left",
          fontSize: 10,
        },
        bodyStyles: {
          textColor: [15, 23, 42],
          fontSize: 10,
        },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 60 },
          2: { cellWidth: 'auto' },
          3: { halign: "right", cellWidth: 40 },
        },
        didParseCell: function (data: any) {
          if (data.section === 'head' && data.column.index === 3) {
            data.cell.styles.halign = 'right';
          }
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("Total Received:", pageWidth - 70, currentY);
      doc.text(formatCurrency(tx.amount, settings), pageWidth - 15, currentY, { align: "right" });
      currentY += 40;
    } else {`;
    
    code = code.substring(0, startIdx) + replacement + code.substring(endIdx + 8);
    fs.writeFileSync('src/lib/pdf.ts', code, 'utf8');
    console.log("Updated receipt PDF layout successfully via simpler match");
} else {
    console.log("Could not find start or end index");
}
