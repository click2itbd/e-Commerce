const fs = require('fs');
const path = require('path');

const adminDashboardPath = path.join(__dirname, '../src/pages/AdminDashboard.tsx');
let adminDashboardCode = fs.readFileSync(adminDashboardPath, 'utf8');

function extractComponent(config) {
  const { name, dirPath, fileName, startMarker, endMarker, interfaceDef, propsString, componentProps, imports, localStates } = config;
  
  const startIndex = adminDashboardCode.indexOf(startMarker);
  if (startIndex === -1) {
    console.error(`Could not find start marker for ${name}.`);
    return;
  }
  
  const endIndex = adminDashboardCode.indexOf(endMarker, startIndex);
  if (endIndex === -1) {
    console.error(`Could not find end marker for ${name}.`);
    return;
  }

  let jsxBlock = adminDashboardCode.substring(startIndex, endIndex).trim();
  
  const componentContent = `import React from 'react';
import { XCircle, X, FileText, Upload, Cpu, Fan, Server, Database, HardDrive, Monitor, Plug, Keyboard, Mouse, Speaker, Headphones, Wifi, ShieldCheck, BatteryCharging, Download, Search } from 'lucide-react';
import { formatCurrency, cn } from '../../../../lib/utils';
import { useSettings } from '../../../../context/SettingsContext';

${interfaceDef}

export const ${name}: React.FC<${name}Props> = (${propsString}) => {
  const { settings } = useSettings();
${localStates ? '  ' + localStates.split('\\n').join('\\n  ') : ''}

  return (
    ${jsxBlock}
  );
};
`;

  const fullDirPath = path.join(__dirname, '..', dirPath);
  if (!fs.existsSync(fullDirPath)) {
    fs.mkdirSync(fullDirPath, { recursive: true });
  }

  fs.writeFileSync(path.join(fullDirPath, fileName), componentContent);
  console.log(`Created ${fileName}`);

  const replaceStr = `<${name} ${componentProps} />`;
  adminDashboardCode = adminDashboardCode.substring(0, startIndex) + replaceStr + '\n      ' + adminDashboardCode.substring(endIndex);
  
  const importStatement = `import { ${name} } from '${dirPath.replace('src/pages/', './')}/${fileName.replace('.tsx', '')}';`;
  if (!adminDashboardCode.includes(importStatement)) {
    adminDashboardCode = adminDashboardCode.replace(/import { Settings } from '.\/admin\/tabs\/others\/Settings';/, `import { Settings } from './admin/tabs/others/Settings';\n${importStatement}`);
  }
}

const configs = [
  {
    name: 'TransactionCategoryModal',
    dirPath: 'src/pages/admin/modals',
    fileName: 'TransactionCategoryModal.tsx',
    startMarker: "{/* Transaction Category Modal */}",
    endMarker: "{/* Manual Transaction Modal */}",
    interfaceDef: `interface TransactionCategoryModalProps {\n  isAddingTransactionCategory: boolean;\n  setIsAddingTransactionCategory: (v: boolean) => void;\n  newTransactionCategory: any;\n  setNewTransactionCategory: (v: any) => void;\n  handleSaveTransactionCategory: (e: any) => void;\n}`,
    propsString: `{ isAddingTransactionCategory, setIsAddingTransactionCategory, newTransactionCategory, setNewTransactionCategory, handleSaveTransactionCategory }`,
    componentProps: `isAddingTransactionCategory={isAddingTransactionCategory} setIsAddingTransactionCategory={setIsAddingTransactionCategory} newTransactionCategory={newTransactionCategory} setNewTransactionCategory={setNewTransactionCategory} handleSaveTransactionCategory={handleSaveTransactionCategory}`
  },
  {
    name: 'ManualTransactionModal',
    dirPath: 'src/pages/admin/modals',
    fileName: 'ManualTransactionModal.tsx',
    startMarker: "{/* Manual Transaction Modal */}",
    endMarker: "{/* Conveyance Modal */}",
    interfaceDef: `interface ManualTransactionModalProps {\n  isAddingManualTransaction: boolean;\n  setIsAddingManualTransaction: (v: boolean) => void;\n  manualTransactionType: string;\n  newManualTransaction: any;\n  setNewManualTransaction: (v: any) => void;\n  handleSaveManualTransaction: (e: any) => void;\n  transactionCategories: any[];\n}`,
    propsString: `{ isAddingManualTransaction, setIsAddingManualTransaction, manualTransactionType, newManualTransaction, setNewManualTransaction, handleSaveManualTransaction, transactionCategories }`,
    componentProps: `isAddingManualTransaction={isAddingManualTransaction} setIsAddingManualTransaction={setIsAddingManualTransaction} manualTransactionType={manualTransactionType} newManualTransaction={newManualTransaction} setNewManualTransaction={setNewManualTransaction} handleSaveManualTransaction={handleSaveManualTransaction} transactionCategories={transactionCategories}`
  },
  {
    name: 'ConveyanceModal',
    dirPath: 'src/pages/admin/modals',
    fileName: 'ConveyanceModal.tsx',
    startMarker: "{/* Conveyance Modal */}",
    endMarker: "{/* Add User Modal */}",
    interfaceDef: `interface ConveyanceModalProps {\n  isAddingConveyance: boolean;\n  setIsAddingConveyance: (v: boolean) => void;\n  newConveyance: any;\n  setNewConveyance: (v: any) => void;\n  handleSaveConveyance: (e: any) => void;\n}`,
    propsString: `{ isAddingConveyance, setIsAddingConveyance, newConveyance, setNewConveyance, handleSaveConveyance }`,
    componentProps: `isAddingConveyance={isAddingConveyance} setIsAddingConveyance={setIsAddingConveyance} newConveyance={newConveyance} setNewConveyance={setNewConveyance} handleSaveConveyance={handleSaveConveyance}`
  }
];

configs.forEach(extractComponent);

fs.writeFileSync(adminDashboardPath, adminDashboardCode);
console.log('Modals extracted successfully.');
