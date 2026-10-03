const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

code = code.replace(
  'import {\n  Trophy, generatePDF } from "../lib/pdf";',
  'import { generatePDF } from "../lib/pdf";'
);

code = code.replace(
  /import \{([^}]+)\} from 'lucide-react';/,
  (match, p1) => `import { Trophy, ${p1} } from 'lucide-react';`
);

// Fallback if the regex doesn't match single quotes
code = code.replace(
  /import \{([^}]+)\} from "lucide-react";/,
  (match, p1) => `import { Trophy, ${p1} } from "lucide-react";`
);

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
console.log('Fixed Trophy import');
