const fs = require('fs');
let code = fs.readFileSync('src/lib/pdf.ts', 'utf8');

// 1. Gap between header and Bill To box
code = code.replace(
    "currentY = Math.max(currentY + 25, addrY + 15);",
    "currentY = Math.max(currentY + 15, addrY + 5);"
);

// 2. Space inside Bill To Box
code = code.replace(
    /doc\.text\(type === "challan" \? "Ship To:" : "Bill To:", 20, currentY \+ 8\);\s+doc\.text\(o\.customerName \|\| "N\/A", 20, currentY \+ 18\);\s+doc\.setFontSize\(10\);\s+doc\.setFont\("helvetica", "normal"\);\s+doc\.setTextColor\(71, 85, 105\);\s+doc\.text\(splitAddr, 20, currentY \+ 24\);/g,
    `doc.text(type === "challan" ? "Ship To:" : "Bill To:", 20, currentY + 7);

      doc.text(o.customerName || "N/A", 20, currentY + 13);

      doc.setFontSize(9.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(splitAddr, 20, currentY + 18);`
);

// 3. Space inside Details Box
code = code.replace(
    /doc\.text\(\s+type\.charAt\(0\)\.toUpperCase\(\) \+ type\.slice\(1\) \+ " Details:",\s+15 \+ \(pageWidth - 30\) \/ 2 \+ 5,\s+currentY \+ 8,\s+\);\s+doc\.setFontSize\(10\);\s+doc\.text\(\s+\`\$\{type === "quotation" \? "Quotation" : type === "challan" \? "Challan" : "Invoice"\} No:  \$\{o\.documentNumber \|\| "N\/A"\}\`,\s+15 \+ \(pageWidth - 30\) \/ 2 \+ 5,\s+currentY \+ 18,\s+\);\s+doc\.setFont\("helvetica", "normal"\);\s+doc\.text\(\s+\`Date:   \$\{new Date\(o\.createdAt\)\.toLocaleDateString\("en-US", \{\s+month: "long",\s+day: "numeric",\s+year: "numeric",\s+\}\)\}\`,\s+15 \+ \(pageWidth - 30\) \/ 2 \+ 5,\s+currentY \+ 24,\s+\);/g,
    `doc.text(
        type.charAt(0).toUpperCase() + type.slice(1) + " Details:",
        15 + (pageWidth - 30) / 2 + 5,
        currentY + 7,
      );

      doc.setFontSize(10);
      doc.text(
        \`\${type === "quotation" ? "Quotation" : type === "challan" ? "Challan" : "Invoice"} No:  \${o.documentNumber || "N/A"}\`,
        15 + (pageWidth - 30) / 2 + 5,
        currentY + 13,
      );

      doc.setFont("helvetica", "normal");
      doc.text(
        \`Date:   \${new Date(o.createdAt).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}\`,
        15 + (pageWidth - 30) / 2 + 5,
        currentY + 18,
      );`
);

// We must also adjust the `Prepared By` if it exists. Let's do that separately by searching.
// Wait, is Prepared By below date?
// 4. Gap between Boxes and Table
code = code.replace(
    "currentY += boxHeight + 12;",
    "currentY += boxHeight + 5;" // For receipt
);
// In the invoice/quotation part, there's another gap logic:
code = code.replace(
    "currentY += boxHeight + 10;",
    "currentY += boxHeight + 5;"
);
// If it's something else, let's just do a generic replace
code = code.replace(/currentY \+= boxHeight \+ \d+;/g, "currentY += boxHeight + 5;");

fs.writeFileSync('src/lib/pdf.ts', code);
console.log("Patched PDF spacing");
