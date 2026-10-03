const fs = require('fs');
let code = fs.readFileSync('src/components/QuotationManager.tsx', 'utf8');

const duplicateString = `  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);\n  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);`;
const correctString = `  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);`;

if (code.includes(duplicateString)) {
  code = code.replace(duplicateString, correctString);
  fs.writeFileSync('src/components/QuotationManager.tsx', code);
  console.log('Removed duplicate declaration!');
} else {
  console.log('Duplicate not found using exact string.');
  // Fallback: replace all occurrences of the line and just put one back
  const lines = code.split('\n');
  const filtered = lines.filter(l => !l.includes('const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);'));
  // Find where customers state is
  const cIndex = filtered.findIndex(l => l.includes('const [customers, setCustomers]'));
  if (cIndex !== -1) {
    filtered.splice(cIndex + 1, 0, '  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);');
    fs.writeFileSync('src/components/QuotationManager.tsx', filtered.join('\n'));
    console.log('Removed duplicates via fallback method!');
  }
}
