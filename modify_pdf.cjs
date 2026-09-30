const fs = require('fs');
let code = fs.readFileSync('src/lib/pdf.ts', 'utf8');

// Reduce top margin
code = code.replace('currentY += 40;', 'currentY += 25;');

// Box replacements
let oldBoxSection = `    // Light Grey Box Backgrounds
    doc.setFillColor(248, 250, 252);

    // Left Box - Bill To
    doc.rect(15, currentY, (pageWidth - 30) / 2, 45, "F");
    // Right Box - Details
    doc.rect(
      15 + (pageWidth - 30) / 2,
      currentY,
      (pageWidth - 30) / 2,
      45,
      "F",
    );

    // Vertical Divider Line (Subtle)
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(
      15 + (pageWidth - 30) / 2,
      currentY,
      15 + (pageWidth - 30) / 2,
      currentY + 45,
    );

    // Box 1 (Left) Content
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(type === "challan" ? "Ship To:" : "Bill To:", 20, currentY + 10);

    doc.text(o.customerName || "N/A", 20, currentY + 22);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    const splitAddr = doc.splitTextToSize(
      o.shippingAddress || o.customerPhone || "N/A",
      (pageWidth - 30) / 2 - 10,
    );
    doc.text(splitAddr, 20, currentY + 28);

    // Box 2 (Right) Content
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(
      type.charAt(0).toUpperCase() + type.slice(1) + " Details:",
      15 + (pageWidth - 30) / 2 + 5,
      currentY + 10,
    );

    doc.setFontSize(10);
    doc.text(
      \`\${type.charAt(0).toUpperCase() + type.slice(1)} No: \`,
      15 + (pageWidth - 30) / 2 + 5,
      currentY + 22,
    );
    doc.setFont("helvetica", "normal");
    doc.text(
      \`\${o.documentNumber || o.id.substring(0, 8).toUpperCase()}\`,
      15 + (pageWidth - 30) / 2 + 30,
      currentY + 22,
    );

    doc.setFont("helvetica", "bold");
    doc.text("Date: ", 15 + (pageWidth - 30) / 2 + 5, currentY + 28);
    doc.setFont("helvetica", "normal");
    doc.text(
      \`\${new Date(o.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}\`,
      15 + (pageWidth - 30) / 2 + 18,
      currentY + 28,
    );

    currentY += 55;`;

let newBoxSection = `    // Light Grey Box Backgrounds
    doc.setFillColor(248, 250, 252);
    
    // Calculate dynamic box height based on address length
    const splitAddr = doc.splitTextToSize(
      o.shippingAddress || o.customerPhone || "N/A",
      (pageWidth - 30) / 2 - 10,
    );
    // Base lines + extra for address + extra for workOrder
    let rightSideLines = 2; // Details No, Date
    if (o.workOrderNumber) rightSideLines++;
    
    const leftSideHeight = 22 + (splitAddr.length * 5) + 5; // 22 is start of addr, + height, + bottom padding
    const rightSideHeight = 16 + (rightSideLines * 6) + 5; 
    
    const boxHeight = Math.max(leftSideHeight, rightSideHeight, 32); // minimum 32 height

    // Left Box - Bill To
    doc.rect(15, currentY, (pageWidth - 30) / 2, boxHeight, "F");
    // Right Box - Details
    doc.rect(
      15 + (pageWidth - 30) / 2,
      currentY,
      (pageWidth - 30) / 2,
      boxHeight,
      "F",
    );

    // Vertical Divider Line (Subtle)
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(
      15 + (pageWidth - 30) / 2,
      currentY,
      15 + (pageWidth - 30) / 2,
      currentY + boxHeight,
    );

    // Box 1 (Left) Content
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(type === "challan" ? "Ship To:" : "Bill To:", 20, currentY + 8);

    doc.text(o.customerName || "N/A", 20, currentY + 18);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(splitAddr, 20, currentY + 24);

    // Box 2 (Right) Content
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(
      type.charAt(0).toUpperCase() + type.slice(1) + " Details:",
      15 + (pageWidth - 30) / 2 + 5,
      currentY + 8,
    );

    doc.setFontSize(10);
    doc.text(
      \`\${type.charAt(0).toUpperCase() + type.slice(1)} No: \`,
      15 + (pageWidth - 30) / 2 + 5,
      currentY + 18,
    );
    doc.setFont("helvetica", "normal");
    doc.text(
      \`\${o.documentNumber || o.id.substring(0, 8).toUpperCase()}\`,
      15 + (pageWidth - 30) / 2 + 30,
      currentY + 18,
    );

    doc.setFont("helvetica", "bold");
    doc.text("Date: ", 15 + (pageWidth - 30) / 2 + 5, currentY + 24);
    doc.setFont("helvetica", "normal");
    doc.text(
      \`\${new Date(o.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}\`,
      15 + (pageWidth - 30) / 2 + 18,
      currentY + 24,
    );
    
    let currentRightY = currentY + 30;
    
    if (o.workOrderNumber) {
        doc.setFont("helvetica", "bold");
        doc.text("Work Order: ", 15 + (pageWidth - 30) / 2 + 5, currentRightY);
        doc.setFont("helvetica", "normal");
        doc.text(o.workOrderNumber, 15 + (pageWidth - 30) / 2 + 30, currentRightY);
    }

    currentY += boxHeight + 10;`;

if (!code.includes(oldBoxSection.substring(0, 50))) {
    console.error("Could not find the old block to replace!");
} else {
    code = code.replace(oldBoxSection, newBoxSection);
    fs.writeFileSync('src/lib/pdf.ts', code, 'utf8');
    console.log("Successfully updated pdf.ts");
}
