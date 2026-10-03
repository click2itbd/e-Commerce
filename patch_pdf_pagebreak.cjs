const fs = require('fs');
let code = fs.readFileSync('src/lib/pdf.ts', 'utf8');

const targetStr = `      if (type !== "challan") {
        let finalY = (doc as any).lastAutoTable.finalY + 15;`;

const replacementStr = `      if (type !== "challan") {
        let finalY = (doc as any).lastAutoTable.finalY + 10;
        
        // Ensure enough space for summary, terms, and signatures
        if (finalY > doc.internal.pageSize.getHeight() - 95) {
          doc.addPage();
          finalY = 20;
        }`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, replacementStr);
    fs.writeFileSync('src/lib/pdf.ts', code);
    console.log("Patched pdf.ts with page break logic");
} else {
    console.log("Could not find target string in pdf.ts");
}
