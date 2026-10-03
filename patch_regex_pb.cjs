const fs = require('fs');
let code = fs.readFileSync('src/lib/pdf.ts', 'utf8');

const regex = /if \(type !== "challan"\) \{\s+let finalY = \(doc as any\)\.lastAutoTable\.finalY \+ 15;/;
const replacement = `if (type !== "challan") {
        let finalY = (doc as any).lastAutoTable.finalY + 10;
        
        // Ensure enough space for summary, terms, and signatures
        if (finalY > doc.internal.pageSize.getHeight() - 100) {
          doc.addPage();
          finalY = 20;
        }`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/lib/pdf.ts', code);
    console.log("Regex patch successful");
} else {
    console.log("Regex did not match");
}
