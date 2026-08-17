const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, '../src/pages/AdminDashboard.tsx');
const hookPath = path.join(__dirname, '../src/pages/admin/hooks/useProductsLogic.ts');

let code = fs.readFileSync(dashboardPath, 'utf8');
let lines = code.split('\n');

const extractBlock = (startStr) => {
    const startIdx = lines.findIndex(l => l.includes(startStr));
    if (startIdx === -1) return '';
    let endIdx = startIdx;
    let braces = 0;
    for (let i = startIdx; i < lines.length; i++) {
        if (lines[i].includes('{')) braces += (lines[i].match(/{/g) || []).length;
        if (lines[i].includes('}')) braces -= (lines[i].match(/}/g) || []).length;
        if (braces === 0 && i >= startIdx) {
            endIdx = i;
            break;
        }
    }
    const block = lines.slice(startIdx, endIdx + 1).join('\n');
    lines.splice(startIdx, endIdx - startIdx + 1);
    return block;
};

const extractLine = (startStr) => {
    const idx = lines.findIndex(l => l.includes(startStr));
    if (idx === -1) return '';
    const line = lines[idx];
    lines.splice(idx, 1);
    return line.trim();
};

const states = [
    extractLine('const [products, setProducts]'),
    extractLine('const [isAddingProduct, setIsAddingProduct]'),
    extractLine('const [editingProduct, setEditingProduct]'),
    extractBlock('const [formData, setFormData] = useState({'),
    extractLine('const [vendorProductSearchQuery, setVendorProductSearchQuery]'),
    extractLine('const [vendorProductCategoryFilter, setVendorProductCategoryFilter]'),
    extractLine('const [selectedProductIds, setSelectedProductIds]'),
    extractLine('const [inventoryCategoryFilter, setInventoryCategoryFilter]'),
];

const handlers = [
    extractBlock('const handleSaveProduct = async'),
    extractBlock('const handleDeleteProduct = async'),
    extractBlock('const handleBulkDeleteProducts = async'),
    extractBlock('const handleExportAllProducts = ()'),
    extractBlock('const handleBulkExportProducts = ()'),
    extractBlock('const handleImportProductsCSV = async')
];

const hookContent = `import { useState, useRef } from 'react';
import { collection, addDoc, updateDoc, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../../firebase';
import toast from 'react-hot-toast';
import { Product, ProductVariant } from '../../../types';

export function useProductsLogic({ setConfirmModal, checkLowStock, fetchData, setLoading }: any) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  ${states.filter(s => s).join('\n  ')}

  ${handlers.filter(h => h).join('\n\n  ')}

  return {
    products, setProducts,
    isAddingProduct, setIsAddingProduct,
    editingProduct, setEditingProduct,
    formData, setFormData,
    vendorProductSearchQuery, setVendorProductSearchQuery,
    vendorProductCategoryFilter, setVendorProductCategoryFilter,
    selectedProductIds, setSelectedProductIds,
    inventoryCategoryFilter, setInventoryCategoryFilter,
    handleSaveProduct,
    handleDeleteProduct,
    handleBulkDeleteProducts,
    handleExportAllProducts,
    handleBulkExportProducts,
    handleImportProductsCSV,
    fileInputRef
  };
}
`;

fs.mkdirSync(path.dirname(hookPath), { recursive: true });
fs.writeFileSync(hookPath, hookContent);

const injectIdx = lines.findIndex(l => l.includes('export const AdminDashboard: React.FC = () => {')) + 2;
const hookCall = `
  const {
    products, setProducts,
    isAddingProduct, setIsAddingProduct,
    editingProduct, setEditingProduct,
    formData, setFormData,
    vendorProductSearchQuery, setVendorProductSearchQuery,
    vendorProductCategoryFilter, setVendorProductCategoryFilter,
    selectedProductIds, setSelectedProductIds,
    inventoryCategoryFilter, setInventoryCategoryFilter,
    handleSaveProduct, handleDeleteProduct, handleBulkDeleteProducts,
    handleExportAllProducts, handleBulkExportProducts, handleImportProductsCSV, fileInputRef
  } = useProductsLogic({ setConfirmModal: (v) => setConfirmModal(v), checkLowStock: (n, s) => checkLowStock(n, s), fetchData: () => fetchData(), setLoading: (v) => setLoading(v) });
`;

lines.splice(injectIdx, 0, hookCall);

const importIdx = lines.findIndex(l => l.includes('import { useSettings }'));
lines.splice(importIdx, 0, `import { useProductsLogic } from './admin/hooks/useProductsLogic';`);

fs.writeFileSync(dashboardPath, lines.join('\n'));

console.log('useProductsLogic hook created and injected successfully.');
