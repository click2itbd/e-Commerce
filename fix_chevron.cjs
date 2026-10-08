const fs = require('fs');
let c = fs.readFileSync('src/pages/ecommerceDashboard/EcommerceInventory.tsx', 'utf8');

if (!c.includes('ChevronRight')) {
  c = c.replace(/Tag \} from 'lucide-react';/, "Tag, ChevronRight } from 'lucide-react';");
  fs.writeFileSync('src/pages/ecommerceDashboard/EcommerceInventory.tsx', c);
  console.log('Added ChevronRight');
} else if (c.includes('ChevronRight') && !c.includes('ChevronRight,')) {
    c = c.replace(/Tag \} from 'lucide-react';/, "Tag, ChevronRight } from 'lucide-react';");
    fs.writeFileSync('src/pages/ecommerceDashboard/EcommerceInventory.tsx', c);
    console.log('Added ChevronRight (was used but not imported)');
} else {
  console.log('ChevronRight might already be imported');
}