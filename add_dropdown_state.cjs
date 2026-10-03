const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

if (!code.includes("const [isProfileDropdownOpen")) {
    code = code.replace(/const \[isRecordingPayment, setIsRecordingPayment\] = useState\(false\);/, "const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);\n  const [isRecordingPayment, setIsRecordingPayment] = useState(false);");
    fs.writeFileSync('src/pages/AdminDashboard.tsx', code, 'utf8');
    console.log("Added isProfileDropdownOpen");
}
