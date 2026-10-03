const fs = require('fs');
let code = fs.readFileSync('src/lib/pdf.ts', 'utf8');

// Reduce gap before Amount in words
code = code.replace(
    "finalY += 20;\n\n      // Amount in words Box",
    "finalY += 12;\n\n      // Amount in words Box"
);

// Reduce gap after Amount in words
code = code.replace(
    "currentY = finalY + 20; // Update global currentY",
    "currentY = finalY + 16; // Update global currentY"
);

// Slightly compress table
code = code.replace(
    "styles: { fontSize: 8, cellPadding: 2, textColor: [15, 23, 42] }",
    "styles: { fontSize: 7.5, cellPadding: 1.5, textColor: [15, 23, 42] }"
);

fs.writeFileSync('src/lib/pdf.ts', code);
console.log("Compressed PDF layout");
