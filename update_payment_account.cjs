const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', 'utf8');

// 1. Remove auto-selection in useEffect
code = code.replace(/if \(accs\.length > 0 && !saleData\.paymentAccountId\) \{\s*setSaleData\(prev => \(\{\s*\.\.\.prev,\s*paymentAccountId: accs\[0\]\.id,\s*paymentMethod: accs\[0\]\.type \|\| 'cash',\s*\}\)\);\s*\}/, "");

// 2. Add validation before saving
const validationStr = `if (saleData.type !== 'quotation' && saleData.paidAmount > 0 && !saleData.paymentAccountId) {
      toast.error('Please select a payment account to receive the paid amount');
      return;
    }`;
const submitFuncStart = "const handleCreateSale = async (e: React.FormEvent) => {\n    e.preventDefault();";
code = code.replace(submitFuncStart, submitFuncStart + "\n\n    " + validationStr);

// 3. Reset form cleanly
code = code.replace(/paymentMethod: paymentAccounts\[0\]\?\.type \|\| 'cash',\n\s*paymentAccountId: paymentAccounts\[0\]\?\.id \|\| '',/, "paymentMethod: '',\n        paymentAccountId: '',");

fs.writeFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', code, 'utf8');
console.log("Updated payment account selection logic");
