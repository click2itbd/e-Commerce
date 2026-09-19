@
const fs = require('fs');
let content = fs.readFileSync('src/lib/pdf.ts', 'utf8');

const oldStr = `  // ----- HEADER -----
  if (!useLetterhead) {
    // Company brand and contacts
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138); // Deep Blue
    doc.text(settings?.brandName || 'STAR TECH', 20, currentY + 10);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(settings?.contactPhone || '16793 | startech.com.bd', 20, currentY + 17);
    doc.text(settings?.contactAddress || '123 Main Street, City, Country', 20, currentY + 22);`;

const newStr = `  // ----- HEADER -----
  if (!useLetterhead) {
    try {
      doc.addImage(logoBase64, 'PNG', 20, currentY, 45, 12);
    } catch(e) {
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 58, 138); // Deep Blue
      doc.text(settings?.brandName || 'CLICK2IT BD', 20, currentY + 10);
    }
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Shop No. 1072, Level-10, Multiplan Center', 20, currentY + 18);
    doc.text('69-71, New Elephant Road, Dhaka-1205, Bangladesh.', 20, currentY + 22);
    doc.text('Phone: 01686800755 | Web: click2itbd.com', 20, currentY + 26);`;

content = content.replace(oldStr, newStr);
fs.writeFileSync('src/lib/pdf.ts', content);
@
