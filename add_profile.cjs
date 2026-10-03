const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

code = code.replace(/const \{ isAdmin, isManager, isStaff, hasPermission \} = useAuth\(\);/, "const { profile, isAdmin, isManager, isStaff, hasPermission } = useAuth();");

fs.writeFileSync('src/pages/AdminDashboard.tsx', code, 'utf8');
console.log("Added profile to useAuth");
