const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, '../src/pages/AdminDashboard.tsx');
let code = fs.readFileSync(dashboardPath, 'utf8');
let lines = code.split('\n');

function getBlockByStart(startStr, fromLine = 0) {
  const si = lines.findIndex((l, i) => i >= fromLine && l.includes(startStr));
  if (si < 0) return { start: -1, end: -1, code: '', found: false };
  let braces = 0, end = si;
  for (let i = si; i < lines.length; i++) {
    braces += (lines[i].match(/{/g) || []).length - (lines[i].match(/}/g) || []).length;
    if (braces === 0 && i > si) { end = i; break; }
    if (braces === 0 && i === si && !lines[i].includes('{')) { end = i; break; }
  }
  return { start: si, end, code: lines.slice(si, end + 1).join('\n'), found: true };
}

function extractBlock(startStr) {
  const b = getBlockByStart(startStr);
  if (!b.found) { console.log('NOT FOUND: ' + startStr); return ''; }
  lines.splice(b.start, b.end - b.start + 1);
  return b.code;
}

function extractLine(str) {
  const i = lines.findIndex(l => l.includes(str));
  if (i < 0) { console.log('NOT FOUND LINE: ' + str); return ''; }
  const line = lines[i];
  lines.splice(i, 1);
  return line;
}

// ======= ORDERS LOGIC HOOK =======
const ordersStates = [
  extractLine('const [orders, setOrders]'),
  extractBlock('const [serialSelectionModal, setSerialSelectionModal] = useState<{'),
  extractLine('const [isCreatingSale, setIsCreatingSale]'),
  extractLine('const [isCreatingPurchase, setIsCreatingPurchase]'),
  extractLine('const [showPCBuilderModal, setShowPCBuilderModal]'),
  extractLine('const [purchaseStartDate, setPurchaseStartDate]'),
  extractLine('const [purchaseEndDate, setPurchaseEndDate]'),
  extractLine('const [purchaseSearchQuery, setPurchaseSearchQuery]'),
  extractLine('const [orderStatusFilter, setOrderStatusFilter]'),
  extractLine('const [orderSort, setOrderSort]'),
  extractLine('const [orderSearchQuery, setOrderSearchQuery]'),
  extractLine('const [orderStartDate, setOrderStartDate]'),
  extractLine('const [orderEndDate, setOrderEndDate]'),
  extractLine('const [selectedOrderIds, setSelectedOrderIds]'),
  extractLine('const [isBulkEditing, setIsBulkEditing]'),
  extractBlock('const [bulkEditData, setBulkEditData] = useState({'),
  extractBlock('const [saleData, setSaleData] = useState({'),
  extractLine('const [saleDiscountCodeInput, setSaleDiscountCodeInput]'),
  extractBlock('const [purchaseData, setPurchaseData] = useState({'),
  extractLine('const [soldSerials, setSoldSerials]'),
];

const ordersHandlers = [
  extractBlock('const handleApplySaleDiscountCode = '),
  extractBlock('const handleConfirmSerialSelection = async'),
  extractBlock('const updateOrderDiscount = async'),
  extractBlock('const handleBulkDeleteOrders = async'),
  extractBlock('const handleBulkReturnOrders = async'),
  extractBlock('const handleBulkUpdateOrderStatus = '),
  extractBlock('const handleDownloadCSVTemplate = '),
  extractBlock('const handleExportFilteredOrders = '),
  extractBlock('const handleBulkExportOrders = '),
  extractBlock('const handleCreatePurchase = async'),
  extractBlock('const handleCreateSale = async'),
  extractBlock('const addItemToSale = '),
  extractBlock('const addItemToPurchase = '),
];

// Payment states from orders section
const extraOrdersStates = [
  extractLine('const [isRecordingPayment, setIsRecordingPayment]'),
  extractBlock('const [paymentFormData, setPaymentFormData] = useState('),
  extractLine('const [selectedCustomerId, setSelectedCustomerId]'),
];

const ordersHookContent = `import React, { useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../../firebase';
import toast from 'react-hot-toast';
import { Order, OrderStatus, Product, SoldSerial } from '../../../types';
import { formatCurrency } from '../../../lib/utils';
import { generateDocumentNumber } from '../../../lib/numbering';

export function useOrdersLogic({ setConfirmModal, fetchData, settings, customers, vendors, products, discountCodes }: any) {

  ${ordersStates.filter(s => s.trim()).join('\n  ')}

  ${extraOrdersStates.filter(s => s.trim()).join('\n  ')}

  ${ordersHandlers.filter(h => h.trim()).join('\n\n  ')}

  return {
    orders, setOrders,
    serialSelectionModal, setSerialSelectionModal,
    isCreatingSale, setIsCreatingSale,
    isCreatingPurchase, setIsCreatingPurchase,
    showPCBuilderModal, setShowPCBuilderModal,
    purchaseStartDate, setPurchaseStartDate,
    purchaseEndDate, setPurchaseEndDate,
    purchaseSearchQuery, setPurchaseSearchQuery,
    orderStatusFilter, setOrderStatusFilter,
    orderSort, setOrderSort,
    orderSearchQuery, setOrderSearchQuery,
    orderStartDate, setOrderStartDate,
    orderEndDate, setOrderEndDate,
    selectedOrderIds, setSelectedOrderIds,
    isBulkEditing, setIsBulkEditing,
    bulkEditData, setBulkEditData,
    saleData, setSaleData,
    saleDiscountCodeInput, setSaleDiscountCodeInput,
    purchaseData, setPurchaseData,
    soldSerials, setSoldSerials,
    isRecordingPayment, setIsRecordingPayment,
    paymentFormData, setPaymentFormData,
    selectedCustomerId, setSelectedCustomerId,
    handleApplySaleDiscountCode,
    handleConfirmSerialSelection,
    updateOrderDiscount,
    handleBulkDeleteOrders,
    handleBulkReturnOrders,
    handleBulkUpdateOrderStatus,
    handleDownloadCSVTemplate,
    handleExportFilteredOrders,
    handleBulkExportOrders,
    handleCreatePurchase,
    handleCreateSale,
    addItemToSale,
    addItemToPurchase,
  };
}
`;

const hooksDir = path.join(__dirname, '../src/pages/admin/hooks');
fs.mkdirSync(hooksDir, { recursive: true });
fs.writeFileSync(path.join(hooksDir, 'useOrdersLogic.ts'), ordersHookContent);
console.log('useOrdersLogic.ts created');

// Now write updated AdminDashboard
fs.writeFileSync(dashboardPath, lines.join('\n'));
console.log('AdminDashboard.tsx updated (orders states/handlers removed)');
