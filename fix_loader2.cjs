const fs = require('fs');
let c = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

if (!c.includes('Loader2') || c.indexOf('Loader2') === c.lastIndexOf('Loader2')) {
  // Add Loader2 to the lucide-react import
  c = c.replace(/import\s+\{([\s\S]*?)\}\s+from\s+"lucide-react";/, (match, p1) => {
    if (!p1.includes('Loader2')) {
      return `import {${p1}, Loader2\n} from "lucide-react";`;
    }
    return match;
  });
  fs.writeFileSync('src/pages/AdminDashboard.tsx', c);
  console.log('Loader2 added to imports');
} else {
  console.log('Loader2 already imported?');
}