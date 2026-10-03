const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/services/Services.tsx', 'utf8');

const target = "setVendors(vendorsSnap.docs.map(v => ({ id: v.id, name: v.data().name })));";
const replacement = target + "\n        const custSnap = await getDocs(query(collection(db, 'customers')));\n        setCustomers(custSnap.docs.map(d => ({ id: d.id, ...d.data() })));";

if (code.includes(target) && !code.includes('const custSnap')) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/pages/admin/tabs/services/Services.tsx', code);
    console.log('Successfully injected customers fetch');
} else {
    console.log('Target string not found or already injected');
}
