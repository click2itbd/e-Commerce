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
import { db, storage } from '../../../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-hot-toast';
import { formatCurrency, cn } from '../../../../lib/utils';
import { useAuth } from '../../../../context/AuthContext';
import { useSettings } from '../../../../context/SettingsContext';
import BulkEditForm from '../../../../components/BulkEditForm';
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
  {
    name: 'MenusTab',
    dirPath: 'src/pages/admin/tabs/menus',
    fileName: 'Menus.tsx',
    startMarker: "        ) : activeTab === 'menus' && isAdmin ? (",
    endMarker: "\n        ) : activeTab === 'ledger'",
    interfaceDef: `interface MenusTabProps { menus: any[]; isAddingMenu: boolean; setIsAddingMenu: (v: boolean) => void; editingMenu: any; setEditingMenu: (v: any) => void; menuFormData: any; setMenuFormData: (v: any) => void; isAddingSubCategory: boolean; setIsAddingSubCategory: (v: boolean) => void; subCategoryFormData: any; setSubCategoryFormData: (v: any) => void; handleSaveMenu: (e: any) => void; handleDeleteMenu: (id: string) => void; handleSaveSubCategory: (e: any) => void; fetchData: () => Promise<void>; }`,
    propsString: `{ menus, isAddingMenu, setIsAddingMenu, editingMenu, setEditingMenu, menuFormData, setMenuFormData, isAddingSubCategory, setIsAddingSubCategory, subCategoryFormData, setSubCategoryFormData, handleSaveMenu, handleDeleteMenu, handleSaveSubCategory, fetchData }`,
    componentProps: `menus={menus} isAddingMenu={isAddingMenu} setIsAddingMenu={setIsAddingMenu} editingMenu={editingMenu} setEditingMenu={setEditingMenu} menuFormData={menuFormData} setMenuFormData={setMenuFormData} isAddingSubCategory={isAddingSubCategory} setIsAddingSubCategory={setIsAddingSubCategory} subCategoryFormData={subCategoryFormData} setSubCategoryFormData={setSubCategoryFormData} handleSaveMenu={handleSaveMenu} handleDeleteMenu={handleDeleteMenu} handleSaveSubCategory={handleSaveSubCategory} fetchData={fetchData}`,
    imports: `import { List, Plus, Edit, Trash2, Tag, Layers, Settings, ChevronRight } from 'lucide-react';`
  },
  {
    name: 'ServicesTab',
    dirPath: 'src/pages/admin/tabs/services',
    fileName: 'Services.tsx',
    startMarker: "        ) : activeTab === 'services' ? (",
    endMarker: "\n        ) : activeTab === 'employees'",
    interfaceDef: `interface ServicesTabProps { soldSerials: any[]; serviceRecords: any[]; serviceSearchQuery: string; setServiceSearchQuery: (v: string) => void; isAddingService: boolean; setIsAddingService: (v: boolean) => void; editingService: any; setEditingService: (v: any) => void; serviceFormData: any; setServiceFormData: (v: any) => void; printServiceReceipt: (r: any) => void; printServiceBill: (r: any) => void; fetchData: () => Promise<void>; ledgerView: string; setLedgerView: (v: string) => void; ledgerSearchQuery: string; setLedgerSearchQuery: (v: string) => void; }`,
    propsString: `{ soldSerials, serviceRecords, serviceSearchQuery, setServiceSearchQuery, isAddingService, setIsAddingService, editingService, setEditingService, serviceFormData, setServiceFormData, printServiceReceipt, printServiceBill, fetchData, ledgerView, setLedgerView, ledgerSearchQuery, setLedgerSearchQuery }`,
    componentProps: `soldSerials={soldSerials} serviceRecords={serviceRecords} serviceSearchQuery={serviceSearchQuery} setServiceSearchQuery={setServiceSearchQuery} isAddingService={isAddingService} setIsAddingService={setIsAddingService} editingService={editingService} setEditingService={setEditingService} serviceFormData={serviceFormData} setServiceFormData={setServiceFormData} printServiceReceipt={printServiceReceipt} printServiceBill={printServiceBill} fetchData={fetchData} ledgerView={ledgerView} setLedgerView={setLedgerView} ledgerSearchQuery={ledgerSearchQuery} setLedgerSearchQuery={setLedgerSearchQuery}`,
    imports: `import { ShieldCheck, Search, Filter, Wrench, Printer, RefreshCw, X, Plus } from 'lucide-react';`
  },
  {
    name: 'InventoryTab',
    dirPath: 'src/pages/admin/tabs/inventory',
    fileName: 'Inventory.tsx',
    startMarker: "        ) : activeTab === 'inventory' ? (",
    endMarker: "\n        ) : activeTab === 'quotations'",
    interfaceDef: `interface InventoryTabProps { products: any[]; vendors: any[]; menus: any[]; isAddingProduct: boolean; setIsAddingProduct: (v: boolean) => void; editingProduct: any; setEditingProduct: (v: any) => void; formData: any; setFormData: (v: any) => void; inventoryCategoryFilter: string; setInventoryCategoryFilter: (v: string) => void; selectedProductIds: string[]; setSelectedProductIds: (v: string[]) => void; isBulkEditing: boolean; setIsBulkEditing: (v: boolean) => void; bulkEditData: any; setBulkEditData: (v: any) => void; isUploading: boolean; dragOver: boolean; setDragOver: (v: boolean) => void; loading: boolean; handleSaveProduct: (e: any) => void; handleDeleteProduct: (id: string) => void; handleImportProductsCSV: (e: any) => void; handleDownloadCSVTemplate: () => void; handleExportAllProducts: () => void; handleBulkExportProducts: () => void; handleBulkDeleteProducts: () => void; handleBulkUpdate: (e: any) => void; handleImageUpload: (f: any) => void; removeImage: (i: number) => void; addVariant: () => void; updateVariant: (i: number, f: string, v: any) => void; removeVariant: (i: number) => void; addSpec: () => void; updateSpec: (i: number, f: string, v: any) => void; removeSpec: (i: number) => void; setActiveTab: (v: string) => void; fetchData: () => Promise<void>; }`,
    propsString: `{ products, vendors, menus, isAddingProduct, setIsAddingProduct, editingProduct, setEditingProduct, formData, setFormData, inventoryCategoryFilter, setInventoryCategoryFilter, selectedProductIds, setSelectedProductIds, isBulkEditing, setIsBulkEditing, bulkEditData, setBulkEditData, isUploading, dragOver, setDragOver, loading, handleSaveProduct, handleDeleteProduct, handleImportProductsCSV, handleDownloadCSVTemplate, handleExportAllProducts, handleBulkExportProducts, handleBulkDeleteProducts, handleBulkUpdate, handleImageUpload, removeImage, addVariant, updateVariant, removeVariant, addSpec, updateSpec, removeSpec, setActiveTab, fetchData }`,
    componentProps: `products={products} vendors={vendors} menus={menus} isAddingProduct={isAddingProduct} setIsAddingProduct={setIsAddingProduct} editingProduct={editingProduct} setEditingProduct={setEditingProduct} formData={formData} setFormData={setFormData} inventoryCategoryFilter={inventoryCategoryFilter} setInventoryCategoryFilter={setInventoryCategoryFilter} selectedProductIds={selectedProductIds} setSelectedProductIds={setSelectedProductIds} isBulkEditing={isBulkEditing} setIsBulkEditing={setIsBulkEditing} bulkEditData={bulkEditData} setBulkEditData={setBulkEditData} isUploading={isUploading} dragOver={dragOver} setDragOver={setDragOver} loading={loading} handleSaveProduct={handleSaveProduct} handleDeleteProduct={handleDeleteProduct} handleImportProductsCSV={handleImportProductsCSV} handleDownloadCSVTemplate={handleDownloadCSVTemplate} handleExportAllProducts={handleExportAllProducts} handleBulkExportProducts={handleBulkExportProducts} handleBulkDeleteProducts={handleBulkDeleteProducts} handleBulkUpdate={handleBulkUpdate} handleImageUpload={handleImageUpload} removeImage={removeImage} addVariant={addVariant} updateVariant={updateVariant} removeVariant={removeVariant} addSpec={addSpec} updateSpec={updateSpec} removeSpec={removeSpec} setActiveTab={setActiveTab} fetchData={fetchData}`,
    imports: `import { Package, Plus, Upload, Download, Search, Edit, Trash2, X, AlertTriangle, Play, Loader2, Image as ImageIcon } from 'lucide-react';`
  }
];

configs.forEach(extractComponent);

fs.writeFileSync(adminDashboardPath, adminDashboardCode);
console.log('Group 3 (Large/Complex) refactored successfully.');
