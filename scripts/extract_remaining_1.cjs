const fs = require('fs');
const path = require('path');

const adminDashboardPath = path.join(__dirname, '../src/pages/AdminDashboard.tsx');
let adminDashboardCode = fs.readFileSync(adminDashboardPath, 'utf8');

function extractComponent(config) {
  const { name, dirPath, fileName, startMarker, endMarker, interfaceDef, propsString, componentProps, imports } = config;
  
  const startIndex = adminDashboardCode.indexOf(startMarker);
  if (startIndex === -1) {
    console.error(`Could not find start marker for ${name}. Try refining the start marker.`);
    return;
  }
  
  const endIndex = adminDashboardCode.indexOf(endMarker, startIndex + startMarker.length);
  if (endIndex === -1) {
    console.error(`Could not find end marker for ${name}. Try refining the end marker.`);
    return;
  }

  let jsxBlock = adminDashboardCode.substring(startIndex + startMarker.length, endIndex).trim();
  
  const componentContent = `import React from 'react';
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
  // Finance Reports
  {
    name: 'CustomersTab',
    dirPath: 'src/pages/admin/tabs/finance',
    fileName: 'Customers.tsx',
    startMarker: "        ) : activeTab === 'customers' ? (",
    endMarker: "\n        ) : activeTab === 'vendors'",
    interfaceDef: `interface CustomersTabProps { customers: any[]; isAddingCustomer: boolean; setIsAddingCustomer: (v: boolean) => void; editingCustomer: any; setEditingCustomer: (v: any) => void; customerFormData: any; setCustomerFormData: (v: any) => void; handleSaveCustomer: (e: any) => void; handleDeleteCustomer: (id: string) => void; setSelectedLedgerEntity: (v: any) => void; setActiveTab: (v: string) => void; }`,
    propsString: `{ customers, isAddingCustomer, setIsAddingCustomer, editingCustomer, setEditingCustomer, customerFormData, setCustomerFormData, handleSaveCustomer, handleDeleteCustomer, setSelectedLedgerEntity, setActiveTab }`,
    componentProps: `customers={customers} isAddingCustomer={isAddingCustomer} setIsAddingCustomer={setIsAddingCustomer} editingCustomer={editingCustomer} setEditingCustomer={setEditingCustomer} customerFormData={customerFormData} setCustomerFormData={setCustomerFormData} handleSaveCustomer={handleSaveCustomer} handleDeleteCustomer={handleDeleteCustomer} setSelectedLedgerEntity={setSelectedLedgerEntity} setActiveTab={setActiveTab}`,
    imports: `import { Users, Plus, Edit, Trash2, ArrowRight } from 'lucide-react';`
  },
  {
    name: 'VendorsTab',
    dirPath: 'src/pages/admin/tabs/finance',
    fileName: 'Vendors.tsx',
    startMarker: "        ) : activeTab === 'vendors' ? (",
    endMarker: "\n        ) : activeTab === 'conveyance'",
    interfaceDef: `interface VendorsTabProps { vendors: any[]; isAddingVendor: boolean; setIsAddingVendor: (v: boolean) => void; editingVendor: any; setEditingVendor: (v: any) => void; vendorFormData: any; setVendorFormData: (v: any) => void; handleSaveVendor: (e: any) => void; handleDeleteVendor: (id: string) => void; setSelectedLedgerEntity: (v: any) => void; setLedgerView: (v: any) => void; setActiveTab: (v: string) => void; }`,
    propsString: `{ vendors, isAddingVendor, setIsAddingVendor, editingVendor, setEditingVendor, vendorFormData, setVendorFormData, handleSaveVendor, handleDeleteVendor, setSelectedLedgerEntity, setLedgerView, setActiveTab }`,
    componentProps: `vendors={vendors} isAddingVendor={isAddingVendor} setIsAddingVendor={setIsAddingVendor} editingVendor={editingVendor} setEditingVendor={setEditingVendor} vendorFormData={vendorFormData} setVendorFormData={setVendorFormData} handleSaveVendor={handleSaveVendor} handleDeleteVendor={handleDeleteVendor} setSelectedLedgerEntity={setSelectedLedgerEntity} setLedgerView={setLedgerView} setActiveTab={setActiveTab}`,
    imports: `import { Briefcase, Plus, Edit, Trash2, ArrowRight, Package } from 'lucide-react';`
  },
  // Sales
  {
    name: 'PurchaseReturnTab',
    dirPath: 'src/pages/admin/tabs/sales',
    fileName: 'PurchaseReturn.tsx',
    startMarker: "        ) : activeTab === 'purchase_return' ? (",
    endMarker: "\n        ) : activeTab === 'sale_return'",
    interfaceDef: `interface PurchaseReturnTabProps { vendors: any[]; products: any[]; setActiveTab: (v: string) => void; }`,
    propsString: `{ vendors, products, setActiveTab }`,
    componentProps: `vendors={vendors} products={products} setActiveTab={setActiveTab}`,
    imports: `import { RotateCcw, Plus, Download, Printer } from 'lucide-react';`
  },
  {
    name: 'SaleReturnTab',
    dirPath: 'src/pages/admin/tabs/sales',
    fileName: 'SaleReturn.tsx',
    startMarker: "        ) : activeTab === 'sale_return' ? (",
    endMarker: "\n        ) : activeTab === 'purchases'",
    interfaceDef: `interface SaleReturnTabProps { customers: any[]; setActiveTab: (v: string) => void; }`,
    propsString: `{ customers, setActiveTab }`,
    componentProps: `customers={customers} setActiveTab={setActiveTab}`,
    imports: `import { RotateCcw, Plus, Download, Printer } from 'lucide-react';`
  }
];

configs.forEach(extractComponent);

fs.writeFileSync(adminDashboardPath, adminDashboardCode);
console.log('Finance Reports and some Sales tabs refactored successfully.');
