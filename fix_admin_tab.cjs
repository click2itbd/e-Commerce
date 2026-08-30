const fs = require('fs');

let adminFile = 'src/pages/AdminDashboard.tsx';
let adminContent = fs.readFileSync(adminFile, 'utf8');

// Replace activeTab initialization
adminContent = adminContent.replace(
  /const \[activeTab, setActiveTab\] = useState[^>]+>\('dashboard'\);/,
  "const [activeTab, setActiveTab] = useState<any>(() => sessionStorage.getItem('adminActiveTab') || 'dashboard');\n  useEffect(() => { sessionStorage.setItem('adminActiveTab', activeTab); }, [activeTab]);"
);

// If it hasn't been replaced properly because of the huge union type:
if (!adminContent.includes('sessionStorage.getItem')) {
  adminContent = adminContent.replace(
    /const \[activeTab, setActiveTab\] = useState[<a-zA-Z0-9_'| \n]+>\('dashboard'\);/,
    "const [activeTab, setActiveTab] = useState<any>(() => sessionStorage.getItem('adminActiveTab') || 'dashboard');\n  useEffect(() => { sessionStorage.setItem('adminActiveTab', activeTab); }, [activeTab]);"
  );
}

fs.writeFileSync(adminFile, adminContent, 'utf8');
