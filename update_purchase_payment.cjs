const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', 'utf8');

// 1. Remove auto-selection in useEffect
code = code.replace(/if \(accs\.length > 0 && !purchaseForm\.paymentAccountId\) \{\s*setPurchaseForm\(prev => \(\{\s*\.\.\.prev,\s*paymentAccountId: accs\[0\]\.id,\s*paymentMethod: accs\[0\]\.type \|\| 'cash',\s*\}\)\);\s*\}/, "");

// 2. Add validation before saving
const validationStr = `if (purchaseForm.paidAmount > 0 && !purchaseForm.paymentAccountId) {
      toast.error('Please select a payment account to pay from');
      return;
    }`;
const submitFuncStart = "const handleSavePurchase = async (e: React.FormEvent) => {\n    e.preventDefault();";
code = code.replace(submitFuncStart, submitFuncStart + "\n\n    " + validationStr);

// 3. Reset form cleanly
code = code.replace(/paymentAccountId: paymentAccounts\[0\]\?\.id \|\| '',\n\s*paymentMethod: paymentAccounts\[0\]\?\.type \|\| 'cash',/, "paymentAccountId: '',\n          paymentMethod: '',");

fs.writeFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', code, 'utf8');
console.log("Updated payment account selection logic in Purchases");
