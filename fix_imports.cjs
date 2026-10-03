const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/modals/EditOrderModal.tsx', 'utf8');

code = code.replace(/..\/..\/..\/..\/lib\/audit/g, "../../../lib/audit");
code = code.replace(/..\/..\/..\/..\/context\/AuthContext/g, "../../../context/AuthContext");
code = code.replace(/..\/..\/..\/..\/types/g, "../../../types");
code = code.replace(/..\/..\/..\/..\/firebase/g, "../../../firebase");

fs.writeFileSync('src/pages/admin/modals/EditOrderModal.tsx', code, 'utf8');
console.log("Fixed imports");
