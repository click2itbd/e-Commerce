const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/pages/AdminDashboard.tsx');
let code = fs.readFileSync(filePath, 'utf8');

function replaceSection(code, searchStart, searchEndNext, replacement) {
  const startIndex = code.indexOf(searchStart);
  if (startIndex === -1) {
    console.log("Could not find start:", searchStart.trim());
    return code;
  }
  const nextConditionIndex = code.indexOf(searchEndNext, startIndex + searchStart.length);
  if (nextConditionIndex === -1) {
    console.log("Could not find next condition:", searchEndNext.trim());
    return code;
  }
  // nextConditionIndex points to the start of `searchEndNext`
  const block = code.substring(startIndex, nextConditionIndex);
  console.log(`Replacing block of length ${block.length}`);
  
  return code.substring(0, startIndex) + replacement + code.substring(nextConditionIndex);
}

// 1. Users
code = replaceSection(
  code, 
  "        ) : activeTab === 'users' && isAdmin ? (", 
  "\n        ) : activeTab === 'campaigns'", 
  "        ) : activeTab === 'users' && isAdmin ? (\n          <Users users={users} isAdmin={isAdmin} hasPermission={hasPermission} formatCurrency={formatCurrency} cn={cn} toast={toast} fetchData={fetchData} />"
);

// 2. Settings
code = replaceSection(
  code, 
  "        ) : activeTab === 'settings' && hasPermission('manage_settings') ? (", 
  "\n        ) : activeTab === 'services'", 
  "        ) : activeTab === 'settings' && hasPermission('manage_settings') ? (\n          <Settings />"
);

// 3. Employees
code = replaceSection(
  code, 
  "        ) : activeTab === 'employees' ? (", 
  "\n        ) : activeTab === 'leave'", 
  "        ) : activeTab === 'employees' ? (\n          <Employees employees={employees} isAdmin={isAdmin} hasPermission={hasPermission} formatCurrency={formatCurrency} cn={cn} toast={toast} fetchData={fetchData} />"
);

// 4. Leave
code = replaceSection(
  code, 
  "        ) : activeTab === 'leave' ? (", 
  "\n        ) : activeTab === 'salary'", 
  "        ) : activeTab === 'leave' ? (\n          <Leave employeeLeaves={employeeLeaves} employees={employees} isAdmin={isAdmin} hasPermission={hasPermission} formatCurrency={formatCurrency} cn={cn} toast={toast} fetchData={fetchData} />"
);

// 5. Salary
code = replaceSection(
  code, 
  "        ) : activeTab === 'salary' ? (", 
  "\n        ) : (", 
  "        ) : activeTab === 'salary' ? (\n          <Salary employeeSalaries={employeeSalaries} employees={employees} settings={settings} isAdmin={isAdmin} hasPermission={hasPermission} formatCurrency={formatCurrency} cn={cn} toast={toast} fetchData={fetchData} />"
);

// Add imports
const importStatements = `
import { Users } from './admin/tabs/hr/Users';
import { Employees } from './admin/tabs/hr/Employees';
import { Leave } from './admin/tabs/hr/Leave';
import { Salary } from './admin/tabs/hr/Salary';
import { Settings } from './admin/tabs/others/Settings';
`;

if (!code.includes('import { Users } from')) {
  code = code.replace(/import {[^}]*} from 'lucide-react';/, match => match + '\n' + importStatements);
}

// Remove old settings states
code = code.replace(/const \[settingsFormData, setSettingsFormData\] = useState<SiteSettings>\(settings\);\s*const \[taxCalcAmount, setTaxCalcAmount\] = useState<number>\(0\);\s*useEffect\(\(\) => {\s*setSettingsFormData\(settings\);\s*}, \[settings\]\);/g, '');

const handleSaveSettingsRegex = /const handleSaveSettings = async \(e: React\.FormEvent\) => {[\s\S]*?toast\.error\('Failed to save site settings'\);\s*}\s*finally\s*{\s*setLoading\(false\);\s*}\s*};/;
code = code.replace(handleSaveSettingsRegex, '');

fs.writeFileSync(filePath, code);
console.log('AdminDashboard.tsx refactored successfully.');
