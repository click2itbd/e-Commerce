const fs = require('fs');
const path = 'C:/Users/User/OneDrive/Desktop/e-Commerce/src/pages/AdminDashboard.tsx';
const lines = fs.readFileSync(path, 'utf8').split('\n');

const toRemove = new Set();

// Only remove exact single-line state declarations
const exactStateLines = [
  'const [isAddingCustomer, setIsAddingCustomer] = useState(false);',
  'const [isAddingVendor, setIsAddingVendor] = useState(false);',
  'const [isAddingMenu, setIsAddingMenu] = useState(false);',
  'const [isAddingCampaign, setIsAddingCampaign] = useState(false);',
  'const [isAddingDiscountCode, setIsAddingDiscountCode] = useState(false);',
  'const [isAddingHostingPlan, setIsAddingHostingPlan] = useState(false);',
  'const [isAddingHostingService, setIsAddingHostingService] = useState(false);',
  'const [isAddingSubCategory, setIsAddingSubCategory] = useState(false);',
  'const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);',
  'const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);',
  'const [editingMenu, setEditingMenu] = useState<NavigationMenu | null>(null);',
  'const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);',
  'const [editingDiscountCode, setEditingDiscountCode] = useState<DiscountCode | null>(null);',
  'const [editingHostingPlan, setEditingHostingPlan] = useState<HostingPlan | null>(null);',
  'const [editingHostingService, setEditingHostingService] = useState<HostingService | null>(null);',
  'const [employees, setEmployees] = useState<any[]>([]);',
  'const [employeeLeaves, setEmployeeLeaves] = useState<any[]>([]);',
  'const [employeeSalaries, setEmployeeSalaries] = useState<any[]>([]);',
  'const [isAddingEmployee, setIsAddingEmployee] = useState(false);',
  'const [editingEmployee, setEditingEmployee] = useState<any>(null);',
  'const [isAddingLeave, setIsAddingLeave] = useState(false);',
  'const [editingLeave, setEditingLeave] = useState<any>(null);',
  'const [isAddingSalary, setIsAddingSalary] = useState(false);',
  'const [editingSalary, setEditingSalary] = useState<any>(null);',
  'const [isAddingUser, setIsAddingUser] = useState(false);',
  'const [userFormData, setUserFormData] = useState({ name: \'\', email: \'\', password: \'\', role: \'user\', permissions: [] as UserPermission[] });',
  'const [editingUserPermissions, setEditingUserPermissions] = useState<any | null>(null);',
  'const [showPermissionsModal, setShowPermissionsModal] = useState(false);',
  'const [paymentAccounts, setPaymentAccounts] = useState<any[]>([]);',
  'const [isAddingPaymentAccount, setIsAddingPaymentAccount] = useState(false);',
  'const [paymentAccountFormData, setPaymentAccountFormData] = useState({ type: \'\', name: \'\', description: \'\', openingBalance: 0, status: \'active\' });',
  'const [settingsTab, setSettingsTab] = useState<',
  'const [settingsFormData, setSettingsFormData] = useState<SiteSettings>(settings);',
  'const [taxCalcAmount, setTaxCalcAmount] = useState<number>(0);',
  'const [conveyances, setConveyances] = useState<{id: string, date: string, description: string, amount: number, employee: string}[]>([]);',
  'const [isAddingConveyance, setIsAddingConveyance] = useState(false);',
  'const [newConveyance, setNewConveyance] = useState({date: new Date().toISOString().split(\'T\')[0], description: \'\', amount: 0, employee: \'\'});',
];

for (let idx = 0; idx < lines.length; idx++) {
  const trimmed = lines[idx].trim();
  if (exactStateLines.some(s => trimmed === s)) {
    toRemove.add(idx);
  }
}

// Remove comment sections
const commentSections = [
  '// Report State',
  '// Customer Receive Report Filter State',
  '// Purchase Filter State',
];

for (const comment of commentSections) {
  for (let idx = 0; idx < lines.length; idx++) {
    if (lines[idx].trim() === comment) {
      let end = idx + 1;
      while (end < lines.length && lines[end].trim() !== '' && !lines[end].trim().startsWith('const ')) {
        end++;
      }
      for (let r = idx; r < end; r++) {
        toRemove.add(r);
      }
    }
  }
}

// Remove generalLedgerFilterType block
for (let idx = 0; idx < lines.length; idx++) {
  if (lines[idx].includes('generalLedgerFilterType')) {
    let end = idx;
    while (end < lines.length && !lines[end].includes('editingUserPermissions')) {
      end++;
    }
    for (let r = idx; r < end; r++) {
      toRemove.add(r);
    }
    break;
  }
}

// Remove showLedgerReportModal block
for (let idx = 0; idx < lines.length; idx++) {
  if (lines[idx].includes('showLedgerReportModal')) {
    let end = idx;
    while (end < lines.length && !lines[end].includes('const { settings, updateSettings }')) {
      end++;
    }
    for (let r = idx; r < end; r++) {
      toRemove.add(r);
    }
    break;
  }
}

// Remove paymentAccountSort
for (let idx = 0; idx < lines.length; idx++) {
  if (lines[idx].includes('paymentAccountSort')) {
    toRemove.add(idx);
  }
}

// Build cleaned content
const cleanedLines = [];
for (let idx = 0; idx < lines.length; idx++) {
  if (!toRemove.has(idx)) {
    cleanedLines.push(lines[idx]);
  }
}

const cleaned = cleanedLines.join('\n');
console.log('Before:', lines.length, 'After:', cleanedLines.length);
fs.writeFileSync(path, cleaned);
