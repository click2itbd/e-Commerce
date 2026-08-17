const fs = require('fs');
const path = require('path');

const tabsDir = path.join(__dirname, '../src/pages/admin/tabs');

const replacements = [
  {
    file: 'finance/CustomerReceiveReport.tsx',
    find: `, getCustomerReceiveReportData }) => {`,
    replace: `, getCustomerReceiveReportData, exportCrToCSV }) => {`
  },
  {
    file: 'finance/SalesReport.tsx',
    find: `, getSalesReportData }) => {`,
    replace: `, getSalesReportData, exportToCSV }) => {`
  },
  {
    file: 'hosting/HostingPlans.tsx',
    find: `import { useAuth } from '../../../../context/AuthContext';`,
    replace: `import { useAuth } from '../../../../context/AuthContext';\nimport { useSettings } from '../../../../context/SettingsContext';`
  },
  {
    file: 'inventory/Inventory.tsx',
    find: `const InventoryTab: React.FC<InventoryTabProps> = ({`,
    replace: `import { useRef } from 'react';\n\nconst InventoryTab: React.FC<InventoryTabProps> = ({`
  },
  {
    file: 'inventory/Inventory.tsx',
    find: `const { settings } = useSettings();`,
    replace: `const { settings } = useSettings();\n  const fileInputRef = useRef<HTMLInputElement>(null);`
  },
  {
    file: 'inventory/Inventory.tsx',
    find: `removeSpec, setActiveTab, fetchData }) => {`,
    replace: `removeSpec, setActiveTab, fetchData, setIsAddingMenu }) => {`
  },
  {
    file: 'sales/Orders.tsx',
    find: `import { OrderStatus } from '../../../../types';`,
    replace: `export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';`
  },
  {
    file: 'sales/Orders.tsx',
    find: `setSelectedLedgerEntity, setActiveTab, fetchData }) => {`,
    replace: `setSelectedLedgerEntity, setActiveTab, fetchData, updateOrderDiscount, updateOrderStatus, generatePDF }) => {`
  },
  {
    file: 'sales/Purchases.tsx',
    find: `setSelectedLedgerEntity, setActiveTab }) => {`,
    replace: `setSelectedLedgerEntity, setActiveTab, addItemToPurchase, updatePurchaseItem, removeItemFromPurchase }) => {`
  }
];

replacements.forEach(rep => {
  const filePath = path.join(tabsDir, rep.file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(rep.find)) {
      content = content.replace(rep.find, rep.replace);
      fs.writeFileSync(filePath, content);
      console.log('Updated ' + rep.file);
    } else {
      console.log('Could not find match in ' + rep.file);
    }
  } else {
    console.log('File not found: ' + filePath);
  }
});
