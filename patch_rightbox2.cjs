const fs = require('fs');
let code = fs.readFileSync('src/lib/pdf.ts', 'utf8');

const regex = /doc\.setFontSize\(10\);\s*doc\.text\(\s*\`\$\{type\.charAt\(0\)\.toUpperCase\(\) \+ type\.slice\(1\)\} No: \`,\s*15 \+ \(pageWidth - 30\) \/ 2 \+ 5,\s*currentY \+ 18,\s*\);\s*doc\.setFont\("helvetica", "normal"\);\s*doc\.text\(\s*\`\$\{o\.documentNumber \|\| o\.id\.substring\(0, 8\)\.toUpperCase\(\)\}\`,\s*15 \+ \(pageWidth - 30\) \/ 2 \+ 30,\s*currentY \+ 18,\s*\);\s*doc\.setFontSize\(9\.5\);\s*doc\.setFont\("helvetica", "bold"\);\s*doc\.text\("Date: ", 15 \+ \(pageWidth - 30\) \/ 2 \+ 5, currentY \+ 18\);\s*doc\.setFont\("helvetica", "normal"\);\s*doc\.text\(\s*\`\$\{new Date\(o\.createdAt\)\.toLocaleDateString\("en-US", \{ month: "long", day: "numeric", year: "numeric" \}\)\}\`,\s*15 \+ \(pageWidth - 30\) \/ 2 \+ 16,\s*currentY \+ 18,\s*\);\s*let currentRightY = currentY \+ 23;/;

const replacement = `doc.setFontSize(9.5);
      doc.text(
        \`\${type.charAt(0).toUpperCase() + type.slice(1)} No: \`,
        15 + (pageWidth - 30) / 2 + 5,
        currentY + 13,
      );
      doc.setFont("helvetica", "normal");
      doc.text(
        \`\${o.documentNumber || o.id.substring(0, 8).toUpperCase()}\`,
        15 + (pageWidth - 30) / 2 + 30,
        currentY + 13,
      );

      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.text("Date: ", 15 + (pageWidth - 30) / 2 + 5, currentY + 18);
      doc.setFont("helvetica", "normal");
      doc.text(
        \`\${new Date(o.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}\`,
        15 + (pageWidth - 30) / 2 + 16,
        currentY + 18,
      );
      
      let currentRightY = currentY + 23;`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/lib/pdf.ts', code);
    console.log("Regex patch for all right box lines successful");
} else {
    console.log("Regex didn't match.");
}
