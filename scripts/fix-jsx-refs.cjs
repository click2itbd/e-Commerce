const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/pages/AdminDashboard.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Replace lucide icons with new alias names in JSX
// <Users size={...} --> <UsersIcon size={...}
code = code.replace(/<Users size=/g, '<UsersIcon size=');
// <Settings size={...} --> <SettingsIcon size={...}
code = code.replace(/<Settings size=/g, '<SettingsIcon size=');

// Also fix icon closing tags - but the above inline self-closing tags only
// No standalone </Users> or </Settings> for icons

// 2. Replace tab component JSX tags to use the new alias names
// <Users users={users} --> <UsersTab users={users}
code = code.replace(/<Users users=/g, '<UsersTab users=');
// Replace closing /Users /> (they're self-closing, no need)
// <Employees employees= --> <EmployeesTab employees=
code = code.replace(/<Employees employees=/g, '<EmployeesTab employees=');
// <Leave employeeLeaves= --> <LeaveTab employeeLeaves=
code = code.replace(/<Leave employeeLeaves=/g, '<LeaveTab employeeLeaves=');
// <Salary employeeSalaries= --> <SalaryTab employeeSalaries=
code = code.replace(/<Salary employeeSalaries=/g, '<SalaryTab employeeSalaries=');

fs.writeFileSync(filePath, code);
console.log('Done fixing JSX references.');
