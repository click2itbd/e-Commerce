const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/sales/CustomerDueList.tsx', 'utf8');

code = code.replace(/let runningBalance = 0;\s*let totalDebit = 0;\s*let totalCredit = 0;\s*\/\/ Reverse so oldest is first for running balance calculation\s*let runningBalance = 0;\s*let totalDebit = 0;\s*let totalCredit = 0;/, `// Reverse so oldest is first for running balance calculation
        let runningBalance = 0;
        let totalDebit = 0;
        let totalCredit = 0;`);

fs.writeFileSync('src/pages/admin/tabs/sales/CustomerDueList.tsx', code, 'utf8');
console.log("Fixed CustomerDueList duplicate declarations");
