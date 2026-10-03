const fs = require('fs');
let code = fs.readFileSync('src/lib/pdf.ts', 'utf8');

code = code.replace(
    "let currentRightY = currentY + 30;",
    "let currentRightY = currentY + 24;"
);

// Box height calculation
code = code.replace(
    "const leftSideHeight = 22 + (splitAddr.length * 5) + 5;",
    "const leftSideHeight = 18 + (splitAddr.length * 5) + 3;"
);
code = code.replace(
    "const rightSideHeight = 16 + (rightSideLines * 6) + 5;",
    "const rightSideHeight = 13 + (rightSideLines * 6) + 3;"
);
code = code.replace(
    "const boxHeight = Math.max(leftSideHeight, rightSideHeight, 32);",
    "const boxHeight = Math.max(leftSideHeight, rightSideHeight, 26);"
);

fs.writeFileSync('src/lib/pdf.ts', code);
console.log("Patched Prepared By spacing and box height");
