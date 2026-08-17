const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/pages/AdminDashboard.tsx');
let code = fs.readFileSync(filePath, 'utf8');

const replaceBlock = (tabCondition, replacement) => {
  const regex = new RegExp(`\\s*\\)\\s*:\\s*activeTab\\s*===\\s*'${tabCondition}'.*?\\?\\s*\\([\\s\\S]*?(?=\\s*\\)\\s*:\\s*activeTab\\s*===|\\s*\\)\\s*:\\s*\\()`);
  
  const match = code.match(regex);
  if (match) {
    console.log(`Matched block for ${tabCondition}, length: ${match[0].length}`);
    const condition = tabCondition === 'users' ? ' && isAdmin' : tabCondition === 'settings' ? " && hasPermission('manage_settings')" : '';
    const replacementStr = `\n        ) : activeTab === '${tabCondition}'${condition} ? (\n          ${replacement}`;
    code = code.replace(match[0], replacementStr);
  } else {
    console.log(`Could NOT find block for ${tabCondition}`);
  }
};

replaceBlock('users', `<Users users={users} isAdmin={isAdmin} hasPermission={hasPermission} formatCurrency={formatCurrency} cn={cn} toast={toast} fetchData={fetchData} />`);
replaceBlock('employees', `<Employees employees={employees} isAdmin={isAdmin} hasPermission={hasPermission} formatCurrency={formatCurrency} cn={cn} toast={toast} fetchData={fetchData} />`);
replaceBlock('leave', `<Leave employeeLeaves={employeeLeaves} employees={employees} isAdmin={isAdmin} hasPermission={hasPermission} formatCurrency={formatCurrency} cn={cn} toast={toast} fetchData={fetchData} />`);
replaceBlock('salary', `<Salary employeeSalaries={employeeSalaries} employees={employees} settings={settings} isAdmin={isAdmin} hasPermission={hasPermission} formatCurrency={formatCurrency} cn={cn} toast={toast} fetchData={fetchData} />`);
replaceBlock('settings', `<Settings />`);

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
