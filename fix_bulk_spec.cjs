const fs = require('fs');
let c = fs.readFileSync('src/pages/ecommerceDashboard/EcommerceInventory.tsx', 'utf8');

if (!c.includes('const [bulkSpecInput, setBulkSpecInput]')) {
  c = c.replace(/const \[specTemplates, setSpecTemplates\] = useState<any\[\]>\(\[\]\);/, "const [specTemplates, setSpecTemplates] = useState<any[]>([]);\n  const [bulkSpecInput, setBulkSpecInput] = useState('');");
  fs.writeFileSync('src/pages/ecommerceDashboard/EcommerceInventory.tsx', c);
  console.log('Added bulkSpecInput state');
} else {
  console.log('bulkSpecInput already exists');
}