const fs = require('fs');
let code = fs.readFileSync('src/lib/pdf.ts', 'utf8');

code = code.replace(
    "if (item.warranty) {\n        warranty = item.warranty;\n      }",
    "if (item.warranty) {\n        warranty = item.warranty;\n        if (/^\\d+$/.test(warranty)) warranty += ' Years';\n      }"
);

// also in the other place it might be (some versions of pdf.ts have it multiple times if there are multiple pdf functions)
// Quotation generator is usually first
fs.writeFileSync('src/lib/pdf.ts', code);
console.log("Patched pdf.ts");
