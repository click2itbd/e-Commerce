const fs = require('fs');
let code = fs.readFileSync('src/components/QuotationManager.tsx', 'utf8');

const target = 'const [customers, setCustomers] = useState<Customer[]>([]);';
const replacement = 'const [customers, setCustomers] = useState<Customer[]>([]);\n  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);';

if (code.includes(target) && !code.includes('showCustomerDropdown = useState')) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/QuotationManager.tsx', code);
  console.log('Successfully injected showCustomerDropdown state to QM');
} else {
  console.log('Target not found or already injected');
}
