const fs = require('fs');
let lines = fs.readFileSync('src/components/QuotationManager.tsx', 'utf8').split('\n');

// Verify that line 217 (index 216) is indeed "  };"
if (lines[216].trim() === "};") {
    lines.splice(216, 1);
    fs.writeFileSync('src/components/QuotationManager.tsx', lines.join('\n'));
    console.log('Removed extra };');
} else {
    console.log('Line 217 is not };, it is: ' + lines[216]);
}
