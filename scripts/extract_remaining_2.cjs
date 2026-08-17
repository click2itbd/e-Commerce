const fs = require('fs');
const path = require('path');

const adminDashboardPath = path.join(__dirname, '../src/pages/AdminDashboard.tsx');
let adminDashboardCode = fs.readFileSync(adminDashboardPath, 'utf8');

function extractComponent(config) {
  const { name, dirPath, fileName, startMarker, endMarker, interfaceDef, propsString, componentProps, imports, localStates } = config;
  
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
  // Sales Group
  {
    name: 'PurchasesTab',
    dirPath: 'src/pages/admin/tabs/sales',
    fileName: 'Purchases.tsx',
    startMarker: "        ) : activeTab === 'purchases' ? (",
    endMarker: "\n        ) : activeTab === 'customers'",
    interfaceDef: `interface PurchasesTabProps { vendors: any[]; products: any[]; transactions: any[]; isCreatingPurchase: boolean; setIsCreatingPurchase: (v: boolean) => void; purchaseData: any; setPurchaseData: (v: any) => void; purchaseStartDate: string; setPurchaseStartDate: (v: string) => void; purchaseEndDate: string; setPurchaseEndDate: (v: string) => void; purchaseSearchQuery: string; setPurchaseSearchQuery: (v: string) => void; handleCreatePurchase: (e: any) => void; setSelectedLedgerEntity: (v: any) => void; setActiveTab: (v: string) => void; }`,
    propsString: `{ vendors, products, transactions, isCreatingPurchase, setIsCreatingPurchase, purchaseData, setPurchaseData, purchaseStartDate, setPurchaseStartDate, purchaseEndDate, setPurchaseEndDate, purchaseSearchQuery, setPurchaseSearchQuery, handleCreatePurchase, setSelectedLedgerEntity, setActiveTab }`,
    componentProps: `vendors={vendors} products={products} transactions={transactions} isCreatingPurchase={isCreatingPurchase} setIsCreatingPurchase={setIsCreatingPurchase} purchaseData={purchaseData} setPurchaseData={setPurchaseData} purchaseStartDate={purchaseStartDate} setPurchaseStartDate={setPurchaseStartDate} purchaseEndDate={purchaseEndDate} setPurchaseEndDate={setPurchaseEndDate} purchaseSearchQuery={purchaseSearchQuery} setPurchaseSearchQuery={setPurchaseSearchQuery} handleCreatePurchase={handleCreatePurchase} setSelectedLedgerEntity={setSelectedLedgerEntity} setActiveTab={setActiveTab}`,
    imports: `import { ShoppingBag, Plus, Search, Calendar, Edit, Trash2, X } from 'lucide-react';`
  },
  {
    name: 'OrdersTab',
    dirPath: 'src/pages/admin/tabs/sales',
    fileName: 'Orders.tsx',
    startMarker: "        ) : activeTab === 'orders' ? (",
    endMarker: "\n        ) : activeTab === 'purchase_return'",
    interfaceDef: `interface OrdersTabProps { orders: any[]; customers: any[]; orderSearchQuery: string; setOrderSearchQuery: (v: string) => void; orderStatusFilter: string; setOrderStatusFilter: (v: string) => void; orderStartDate: string; setOrderStartDate: (v: string) => void; orderEndDate: string; setOrderEndDate: (v: string) => void; orderSort: any; setOrderSort: (v: any) => void; selectedOrderIds: string[]; setSelectedOrderIds: (v: string[]) => void; handleExportFilteredOrders: () => void; handleBulkUpdateOrderStatus: (s: string) => void; handleBulkReturnOrders: () => void; handleBulkExportOrders: () => void; handleBulkDeleteOrders: () => void; setSelectedLedgerEntity: (v: any) => void; setActiveTab: (v: string) => void; fetchData: () => Promise<void>; }`,
    propsString: `{ orders, customers, orderSearchQuery, setOrderSearchQuery, orderStatusFilter, setOrderStatusFilter, orderStartDate, setOrderStartDate, orderEndDate, setOrderEndDate, orderSort, setOrderSort, selectedOrderIds, setSelectedOrderIds, handleExportFilteredOrders, handleBulkUpdateOrderStatus, handleBulkReturnOrders, handleBulkExportOrders, handleBulkDeleteOrders, setSelectedLedgerEntity, setActiveTab, fetchData }`,
    componentProps: `orders={orders} customers={customers} orderSearchQuery={orderSearchQuery} setOrderSearchQuery={setOrderSearchQuery} orderStatusFilter={orderStatusFilter} setOrderStatusFilter={setOrderStatusFilter} orderStartDate={orderStartDate} setOrderStartDate={setOrderStartDate} orderEndDate={orderEndDate} setOrderEndDate={setOrderEndDate} orderSort={orderSort} setOrderSort={setOrderSort} selectedOrderIds={selectedOrderIds} setSelectedOrderIds={setSelectedOrderIds} handleExportFilteredOrders={handleExportFilteredOrders} handleBulkUpdateOrderStatus={handleBulkUpdateOrderStatus} handleBulkReturnOrders={handleBulkReturnOrders} handleBulkExportOrders={handleBulkExportOrders} handleBulkDeleteOrders={handleBulkDeleteOrders} setSelectedLedgerEntity={setSelectedLedgerEntity} setActiveTab={setActiveTab} fetchData={fetchData}`,
    imports: `import { Receipt, Search, Download, Filter, Eye, Printer, ShieldAlert } from 'lucide-react';`
  },
  // Finance Reports Group
  {
    name: 'LedgerTab',
    dirPath: 'src/pages/admin/tabs/finance',
    fileName: 'Ledger.tsx',
    startMarker: "        ) : activeTab === 'ledger' && hasPermission('manage_finances') ? (",
    endMarker: "\n        ) : activeTab === 'reports'",
    interfaceDef: `interface LedgerTabProps { generalLedgerFilterType: string; setGeneralLedgerFilterType: (v: string) => void; generalLedgerStartDate: string; setGeneralLedgerStartDate: (v: string) => void; generalLedgerEndDate: string; setGeneralLedgerEndDate: (v: string) => void; getLedgerData: () => any[]; showLedgerReportModal: boolean; setShowLedgerReportModal: (v: boolean) => void; ledgerReportModalData: any[]; setLedgerReportModalData: (v: any[]) => void; ledgerReportType: string | null; setLedgerReportType: (v: string | null) => void; }`,
    propsString: `{ generalLedgerFilterType, setGeneralLedgerFilterType, generalLedgerStartDate, setGeneralLedgerStartDate, generalLedgerEndDate, setGeneralLedgerEndDate, getLedgerData, showLedgerReportModal, setShowLedgerReportModal, ledgerReportModalData, setLedgerReportModalData, ledgerReportType, setLedgerReportType }`,
    componentProps: `generalLedgerFilterType={generalLedgerFilterType} setGeneralLedgerFilterType={setGeneralLedgerFilterType} generalLedgerStartDate={generalLedgerStartDate} setGeneralLedgerStartDate={setGeneralLedgerStartDate} generalLedgerEndDate={generalLedgerEndDate} setGeneralLedgerEndDate={setGeneralLedgerEndDate} getLedgerData={getLedgerData} showLedgerReportModal={showLedgerReportModal} setShowLedgerReportModal={setShowLedgerReportModal} ledgerReportModalData={ledgerReportModalData} setLedgerReportModalData={setLedgerReportModalData} ledgerReportType={ledgerReportType} setLedgerReportType={setLedgerReportType}`,
    imports: `import { Book, Calendar, Filter, X, Eye } from 'lucide-react';\nimport { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';`
  },
  {
    name: 'SalesReportTab',
    dirPath: 'src/pages/admin/tabs/finance',
    fileName: 'SalesReport.tsx',
    startMarker: "        ) : activeTab === 'reports' && hasPermission('manage_reports') ? (",
    endMarker: "\n        ) : activeTab === 'customer_receive_report'",
    interfaceDef: `interface SalesReportTabProps { reportStartDate: string; setReportStartDate: (v: string) => void; reportEndDate: string; setReportEndDate: (v: string) => void; reportSearch: string; setReportSearch: (v: string) => void; reportSortConfig: any; setReportSortConfig: (v: any) => void; getSalesReportData: () => any[]; }`,
    propsString: `{ reportStartDate, setReportStartDate, reportEndDate, setReportEndDate, reportSearch, setReportSearch, reportSortConfig, setReportSortConfig, getSalesReportData }`,
    componentProps: `reportStartDate={reportStartDate} setReportStartDate={setReportStartDate} reportEndDate={reportEndDate} setReportEndDate={setReportEndDate} reportSearch={reportSearch} setReportSearch={setReportSearch} reportSortConfig={reportSortConfig} setReportSortConfig={setReportSortConfig} getSalesReportData={getSalesReportData}`,
    imports: `import { FileText, Search, Download, ArrowUp, ArrowDown } from 'lucide-react';`
  },
  {
    name: 'CustomerReceiveReportTab',
    dirPath: 'src/pages/admin/tabs/finance',
    fileName: 'CustomerReceiveReport.tsx',
    startMarker: "        ) : activeTab === 'customer_receive_report' && hasPermission('manage_reports') ? (",
    endMarker: "\n        ) : activeTab === 'users'",
    interfaceDef: `interface CustomerReceiveReportTabProps { crReportStartDate: string; setCrReportStartDate: (v: string) => void; crReportEndDate: string; setCrReportEndDate: (v: string) => void; crReportSearch: string; setCrReportSearch: (v: string) => void; crReportMethod: string; setCrReportMethod: (v: string) => void; crReportCustomer: string; setCrReportCustomer: (v: string) => void; customers: any[]; getCustomerReceiveReportData: () => any[]; }`,
    propsString: `{ crReportStartDate, setCrReportStartDate, crReportEndDate, setCrReportEndDate, crReportSearch, setCrReportSearch, crReportMethod, setCrReportMethod, crReportCustomer, setCrReportCustomer, customers, getCustomerReceiveReportData }`,
    componentProps: `crReportStartDate={crReportStartDate} setCrReportStartDate={setCrReportStartDate} crReportEndDate={crReportEndDate} setCrReportEndDate={setCrReportEndDate} crReportSearch={crReportSearch} setCrReportSearch={setCrReportSearch} crReportMethod={crReportMethod} setCrReportMethod={setCrReportMethod} crReportCustomer={crReportCustomer} setCrReportCustomer={setCrReportCustomer} customers={customers} getCustomerReceiveReportData={getCustomerReceiveReportData}`,
    imports: `import { FileText, Search, Download, Filter } from 'lucide-react';`
  }
];

configs.forEach(extractComponent);

fs.writeFileSync(adminDashboardPath, adminDashboardCode);
console.log('Group 2 part 1 refactored successfully.');
