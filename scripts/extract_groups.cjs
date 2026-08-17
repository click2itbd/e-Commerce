const fs = require('fs');
const path = require('path');

const adminDashboardPath = path.join(__dirname, '../src/pages/AdminDashboard.tsx');
let adminDashboardCode = fs.readFileSync(adminDashboardPath, 'utf8');

function extractComponent(config) {
  const { name, dirPath, fileName, startMarker, endMarker, interfaceDef, propsString, componentProps, localStates, imports } = config;
  
  const startIndex = adminDashboardCode.indexOf(startMarker);
  if (startIndex === -1) {
    console.error(`Could not find start marker for ${name}`);
    return;
  }
  
  const endIndex = adminDashboardCode.indexOf(endMarker, startIndex + startMarker.length);
  if (endIndex === -1) {
    console.error(`Could not find end marker for ${name}`);
    return;
  }

  let jsxBlock = adminDashboardCode.substring(startIndex + startMarker.length, endIndex).trim();
  
  const componentContent = `import React, { useState } from 'react';
import { db } from '../../../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { formatCurrency, cn } from '../../../../lib/utils';
import { useAuth } from '../../../../context/AuthContext';
import { useSettings } from '../../../../context/SettingsContext';
${imports || ''}

${interfaceDef}

const ${name}: React.FC<${name}Props> = (${propsString}) => {
  const { isAdmin, hasPermission } = useAuth();
  const { settings } = useSettings();
${localStates ? '  ' + localStates.split('\\n').join('\\n  ') : ''}

  return (
    ${jsxBlock}
  );
};

export default ${name};
`;

  const fullDirPath = path.join(__dirname, '..', dirPath);
  if (!fs.existsSync(fullDirPath)) {
    fs.mkdirSync(fullDirPath, { recursive: true });
  }

  fs.writeFileSync(path.join(fullDirPath, fileName), componentContent);
  console.log(`Created ${fileName}`);

  const replaceStr = `${startMarker}\n          <${name} ${componentProps} />`;
  adminDashboardCode = adminDashboardCode.substring(0, startIndex) + replaceStr + adminDashboardCode.substring(endIndex);
  
  const importStatement = `import ${name} from '${dirPath.replace('src/pages/', './')}/${fileName.replace('.tsx', '')}';`;
  if (!adminDashboardCode.includes(importStatement)) {
    adminDashboardCode = adminDashboardCode.replace(/import { Settings } from '.\/admin\/tabs\/others\/Settings';/, `import { Settings } from './admin/tabs/others/Settings';\n${importStatement}`);
  }
}

const configs = [
  // GROUP A
  {
    name: 'ConveyanceTab',
    dirPath: 'src/pages/admin/tabs/finance',
    fileName: 'Conveyance.tsx',
    startMarker: "        ) : activeTab === 'conveyance' && isAdmin ? (",
    endMarker: "\n        ) : activeTab === 'all_reports'",
    interfaceDef: `interface ConveyanceTabProps { conveyances: any[]; isAddingConveyance: boolean; setIsAddingConveyance: (v: boolean) => void; newConveyance: any; setNewConveyance: (v: any) => void; handleSaveConveyance: (e: any) => void; }`,
    propsString: `{ conveyances, isAddingConveyance, setIsAddingConveyance, newConveyance, setNewConveyance, handleSaveConveyance }`,
    componentProps: `conveyances={conveyances} isAddingConveyance={isAddingConveyance} setIsAddingConveyance={setIsAddingConveyance} newConveyance={newConveyance} setNewConveyance={setNewConveyance} handleSaveConveyance={handleSaveConveyance}`,
    imports: `import { Truck, Plus, Trash2 } from 'lucide-react';`
  },
  {
    name: 'AllReportsTab',
    dirPath: 'src/pages/admin/tabs/finance',
    fileName: 'AllReports.tsx',
    startMarker: "        ) : activeTab === 'all_reports' && hasPermission('manage_reports') ? (",
    endMarker: "\n        ) : activeTab === 'tx_categories'",
    interfaceDef: `interface AllReportsTabProps { setActiveTab: (v: string) => void; }`,
    propsString: `{ setActiveTab }`,
    componentProps: `setActiveTab={setActiveTab}`,
    imports: `import { FileText, ShoppingBag, Receipt, Database, CheckCircle, Clock } from 'lucide-react';`
  },
  {
    name: 'TxCategoriesTab',
    dirPath: 'src/pages/admin/tabs/finance',
    fileName: 'TxCategories.tsx',
    startMarker: "        ) : activeTab === 'tx_categories' && hasPermission('manage_finances') ? (",
    endMarker: "\n        ) : activeTab === 'manual_expense'",
    interfaceDef: `interface TxCategoriesTabProps { transactionCategories: any[]; isAddingTransactionCategory: boolean; setIsAddingTransactionCategory: (v: boolean) => void; newTransactionCategory: any; setNewTransactionCategory: (v: any) => void; handleSaveTransactionCategory: (e: any) => void; }`,
    propsString: `{ transactionCategories, isAddingTransactionCategory, setIsAddingTransactionCategory, newTransactionCategory, setNewTransactionCategory, handleSaveTransactionCategory }`,
    componentProps: `transactionCategories={transactionCategories} isAddingTransactionCategory={isAddingTransactionCategory} setIsAddingTransactionCategory={setIsAddingTransactionCategory} newTransactionCategory={newTransactionCategory} setNewTransactionCategory={setNewTransactionCategory} handleSaveTransactionCategory={handleSaveTransactionCategory}`,
    imports: `import { List, Plus, X } from 'lucide-react';`
  },
  // GROUP B
  {
    name: 'ManualExpenseTab',
    dirPath: 'src/pages/admin/tabs/finance',
    fileName: 'ManualExpense.tsx',
    startMarker: "        ) : activeTab === 'manual_expense' && hasPermission('manage_finances') ? (",
    endMarker: "\n        ) : activeTab === 'manual_income'",
    interfaceDef: `interface ManualExpenseTabProps { transactions: any[]; transactionCategories: any[]; manualTransactionType: string; setManualTransactionType: (v: any) => void; newManualTransaction: any; setNewManualTransaction: (v: any) => void; isAddingManualTransaction: boolean; setIsAddingManualTransaction: (v: boolean) => void; handleSaveManualTransaction: (e: any) => void; setActiveTab: (v: string) => void; }`,
    propsString: `{ transactions, transactionCategories, manualTransactionType, setManualTransactionType, newManualTransaction, setNewManualTransaction, isAddingManualTransaction, setIsAddingManualTransaction, handleSaveManualTransaction, setActiveTab }`,
    componentProps: `transactions={transactions} transactionCategories={transactionCategories} manualTransactionType={manualTransactionType} setManualTransactionType={setManualTransactionType} newManualTransaction={newManualTransaction} setNewManualTransaction={setNewManualTransaction} isAddingManualTransaction={isAddingManualTransaction} setIsAddingManualTransaction={setIsAddingManualTransaction} handleSaveManualTransaction={handleSaveManualTransaction} setActiveTab={setActiveTab}`,
    imports: `import { ArrowLeftRight, Plus, X } from 'lucide-react';`
  },
  {
    name: 'ManualIncomeTab',
    dirPath: 'src/pages/admin/tabs/finance',
    fileName: 'ManualIncome.tsx',
    startMarker: "        ) : activeTab === 'manual_income' && hasPermission('manage_finances') ? (",
    endMarker: "\n        ) : activeTab === 'payment_accounts'",
    interfaceDef: `interface ManualIncomeTabProps { transactions: any[]; transactionCategories: any[]; manualTransactionType: string; setManualTransactionType: (v: any) => void; newManualTransaction: any; setNewManualTransaction: (v: any) => void; isAddingManualTransaction: boolean; setIsAddingManualTransaction: (v: boolean) => void; handleSaveManualTransaction: (e: any) => void; setActiveTab: (v: string) => void; }`,
    propsString: `{ transactions, transactionCategories, manualTransactionType, setManualTransactionType, newManualTransaction, setNewManualTransaction, isAddingManualTransaction, setIsAddingManualTransaction, handleSaveManualTransaction, setActiveTab }`,
    componentProps: `transactions={transactions} transactionCategories={transactionCategories} manualTransactionType={manualTransactionType} setManualTransactionType={setManualTransactionType} newManualTransaction={newManualTransaction} setNewManualTransaction={setNewManualTransaction} isAddingManualTransaction={isAddingManualTransaction} setIsAddingManualTransaction={setIsAddingManualTransaction} handleSaveManualTransaction={handleSaveManualTransaction} setActiveTab={setActiveTab}`,
    imports: `import { ArrowLeftRight, Plus, X } from 'lucide-react';`
  },
  {
    name: 'TransactionsTab',
    dirPath: 'src/pages/admin/tabs/finance',
    fileName: 'Transactions.tsx',
    startMarker: "        ) : activeTab === 'transactions' && hasPermission('manage_finances') ? (",
    endMarker: "\n        ) : activeTab === 'menus'",
    interfaceDef: `interface TransactionsTabProps { transactions: any[]; customers: any[]; setSelectedLedgerEntity: (v: any) => void; setActiveTab: (v: string) => void; }`,
    propsString: `{ transactions, customers, setSelectedLedgerEntity, setActiveTab }`,
    componentProps: `transactions={transactions} customers={customers} setSelectedLedgerEntity={setSelectedLedgerEntity} setActiveTab={setActiveTab}`,
    imports: `import { ArrowLeftRight, Search } from 'lucide-react';`
  }
];

configs.forEach(extractComponent);

fs.writeFileSync(adminDashboardPath, adminDashboardCode);
console.log('Groups A and B (partial) refactored successfully.');
