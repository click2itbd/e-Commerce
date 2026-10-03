const fs = require('fs');
let code = fs.readFileSync('src/lib/pdf.ts', 'utf8');

// 1. Fix the Page Break Threshold
code = code.replace(
    "let finalY = (doc as any).lastAutoTable.finalY + 10;\n        \n        // Ensure enough space for summary, terms, and signatures\n        if (finalY > doc.internal.pageSize.getHeight() - 100) {",
    "let finalY = (doc as any).lastAutoTable.finalY + 5;\n        \n        // Ensure enough space for summary, terms, and signatures\n        if (finalY > doc.internal.pageSize.getHeight() - 75) {"
);

// 2. Reduce gap after Amount in words
code = code.replace(
    "currentY = finalY + 16;",
    "currentY = finalY + 14;"
);

// 3. Fix the Terms condition (remove the horrible if space check, just draw it)
// And adjust signatureY to be at least below terms, but stick to bottom if possible
code = code.replace(
    /if \(currentY < signatureY - 40\) \{\s*\/\/ If we have space on the page\s*doc\.setFontSize\(10\);\s*doc\.setFont\("helvetica", "bold"\);\s*doc\.setTextColor\(15, 23, 42\);\s*const termsTitle = ord\.termsAndConditions \? "Terms & Conditions" : "Notes";\s*const termsContent = ord\.termsAndConditions \|\| ord\.notes;\s*doc\.text\(termsTitle \+ ":", 15, currentY\);\s*doc\.setFontSize\(9\);\s*doc\.setFont\("helvetica", "normal"\);\s*doc\.setTextColor\(71, 85, 105\);\s*const splitTerms = doc\.splitTextToSize\(termsContent \|\| "", pageWidth - 30\);\s*doc\.text\(splitTerms, 15, currentY \+ 6\);\s*\}/,
    `// Draw terms without arbitrarily skipping
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      const termsTitle = ord.termsAndConditions ? "Terms & Conditions" : "Notes";
      const termsContent = ord.termsAndConditions || ord.notes;
      doc.text(termsTitle + ":", 15, currentY);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      const splitTerms = doc.splitTextToSize(termsContent || "", pageWidth - 30);
      doc.text(splitTerms, 15, currentY + 6);
      currentY += 6 + (splitTerms.length * 4);`
);

// 4. Adjust signatureY to be pageHeight - 30, but ensure it doesn't overlap terms
code = code.replace(
    "let signatureY = doc.internal.pageSize.getHeight() - 40;",
    "let signatureY = doc.internal.pageSize.getHeight() - 30;"
);

// We need to also ensure bottomY is at least currentY + 15
code = code.replace(
    "const bottomY = signatureY;",
    "const bottomY = Math.max(signatureY, currentY + 15);"
);

fs.writeFileSync('src/lib/pdf.ts', code);
console.log("Patched PDF footer compaction");
