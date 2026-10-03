const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/services/Services.tsx', 'utf8');

const target = 'const [vendors, setVendors] = useState<{id: string; name: string}[]>([]);';
const replacement = target + '\n  const [customers, setCustomers] = useState<any[]>([]);';

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/pages/admin/tabs/services/Services.tsx', code);
    console.log('Successfully injected customers state');
} else {
    console.log('Target string not found');
}
