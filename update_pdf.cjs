const fs = require('fs');
let content = fs.readFileSync('src/lib/pdf.ts', 'utf8');

if (!content.includes('import { logoBase64 }')) {
  content = 'import { logoBase64 } from \'./logoBase64\';\n' + content;
}

const targetBlock = "  // ----- HEADER -----\n" +
"  if (!useLetterhead) {\n" +
"    // Company brand and contacts\n" +
"    doc.setFontSize(26);\n" +
"    doc.setFont('helvetica', 'bold');\n" +
"    doc.setTextColor(30, 58, 138); // Deep Blue\n" +
"    doc.text(settings?.brandName || 'STAR TECH', 20, currentY + 10);\n" +
"    \n" +
"    doc.setFontSize(10);\n" +
"    doc.setFont('helvetica', 'normal');\n" +
"    doc.setTextColor(100, 100, 100);\n" +
"    doc.text(settings?.contactPhone || '16793 | startech.com.bd', 20, currentY + 17);\n" +
"    doc.text(settings?.contactAddress || '123 Main Street, City, Country', 20, currentY + 22);\n" +
"  } else {";

const replacementBlock = "  // ----- HEADER -----\n" +
"  if (!useLetterhead) {\n" +
"    try {\n" +
"      doc.addImage(logoBase64, 'PNG', 20, currentY, 45, 12);\n" +
"    } catch(e) {\n" +
"      doc.setFontSize(26);\n" +
"      doc.setFont('helvetica', 'bold');\n" +
"      doc.setTextColor(30, 58, 138);\n" +
"      doc.text(settings?.brandName || 'CLICK2IT BD', 20, currentY + 10);\n" +
"    }\n" +
"    \n" +
"    doc.setFontSize(9);\n" +
"    doc.setFont('helvetica', 'normal');\n" +
"    doc.setTextColor(100, 100, 100);\n" +
"    doc.text('Shop No. 1072, Level-10, Multiplan Center', 20, currentY + 18);\n" +
"    doc.text('69-71, New Elephant Road, Dhaka-1205, Bangladesh.', 20, currentY + 22);\n" +
"    doc.text('Phone: 01686800755 | Web: click2itbd.com', 20, currentY + 26);\n" +
"  } else {";

content = content.replace(targetBlock, replacementBlock);
fs.writeFileSync('src/lib/pdf.ts', content);
console.log('Done updating pdf.ts');
