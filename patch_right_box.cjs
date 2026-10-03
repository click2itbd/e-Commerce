const fs = require('fs');
let code = fs.readFileSync('src/lib/pdf.ts', 'utf8');

const targetStr = `      // Box 2 (Right) Content
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
      
      let currentRightY = currentY + 24;

        doc.setFont("helvetica", "bold");
        doc.text("Prepared By: ", 15 + (pageWidth - 30) / 2 + 5, currentRightY);
        doc.setFont("helvetica", "normal");
        doc.text(o.createdBy || "Admin", 15 + (pageWidth - 30) / 2 + 28, currentRightY);
        currentRightY += 6;`;

const replacementStr = `      // Box 2 (Right) Content
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(
        type.charAt(0).toUpperCase() + type.slice(1) + " Details:",
        15 + (pageWidth - 30) / 2 + 5,
        currentY + 7,
      );

      doc.setFontSize(9.5);
      doc.text(
        \`\${type.charAt(0).toUpperCase() + type.slice(1)} No: \`,
        15 + (pageWidth - 30) / 2 + 5,
        currentY + 13,
      );
      doc.setFont("helvetica", "normal");
      doc.text(
        \`\${o.documentNumber || o.id.substring(0, 8).toUpperCase()}\`,
        15 + (pageWidth - 30) / 2 + 28,
        currentY + 13,
      );

      doc.setFont("helvetica", "bold");
      doc.text("Date: ", 15 + (pageWidth - 30) / 2 + 5, currentY + 18);
      doc.setFont("helvetica", "normal");
      doc.text(
        \`\${new Date(o.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}\`,
        15 + (pageWidth - 30) / 2 + 16,
        currentY + 18,
      );
      
      let currentRightY = currentY + 23;

        doc.setFont("helvetica", "bold");
        doc.text("Prepared By: ", 15 + (pageWidth - 30) / 2 + 5, currentRightY);
        doc.setFont("helvetica", "normal");
        doc.text(o.createdBy || "Admin", 15 + (pageWidth - 30) / 2 + 28, currentRightY);
        currentRightY += 5;`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, replacementStr);
    fs.writeFileSync('src/lib/pdf.ts', code);
    console.log("Patched Right Box logic successfully");
} else {
    console.log("Failed to find target string in Right Box logic");
}
