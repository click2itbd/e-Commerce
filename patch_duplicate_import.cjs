const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/sales/Orders.tsx', 'utf8');

// The import line has multiple 'Eye's now.
// Let's replace 'Eye, Eye,' with just 'Eye,' or find the exact string.
// Actually, it's safer to just run a regex that removes duplicate words in that import block.
// Let's just find "Eye, " and replace it if it appears more than once.

let importMatch = content.match(/import\s+\{([^}]+)\}\s+from\s+'lucide-react'/);
if (importMatch) {
    let imports = importMatch[1].split(',').map(s => s.trim()).filter(s => s);
    let uniqueImports = [...new Set(imports)];
    let newImportStr = `import { ${uniqueImports.join(', ')} } from 'lucide-react'`;
    content = content.replace(importMatch[0], newImportStr);
    fs.writeFileSync('src/pages/admin/tabs/sales/Orders.tsx', content, 'utf8');
    console.log('Fixed duplicate imports');
} else {
    console.log('Could not find lucide-react import');
}