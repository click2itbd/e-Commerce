const fs = require('fs');
let code = fs.readFileSync('src/lib/pdf.ts', 'utf8');

const regex = /doc\.setFont\("helvetica", "bold"\);\s*doc\.text\("Date: ", 15 \+ \(pageWidth - 30\) \/ 2 \+ 5, currentY \+ 24\);\s*doc\.setFont\("helvetica", "normal"\);\s*doc\.text\([\s\S]*?currentY \+ 24,\s*\);\s*let currentRightY = currentY \+ 24;/;

const replacement = `doc.setFontSize(9.5);
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
    console.log("Regex patch for Date and Prepared By successful");
} else {
    console.log("Regex didn't match.");
}
