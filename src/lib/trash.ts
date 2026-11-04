import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  increment,
} from 'firebase/firestore';
import { db } from '../firebase';
import { sanitizePublicProductData, saveProductPrivateCost } from './productCosts';

export type TrashModuleCategory =
  | 'sales'
  | 'purchases'
  | 'products'
  | 'quotations'
  | 'returns'
  | 'contacts'
  | 'accounting'
  | 'others';

export interface TrashRelatedData {
  transactions?: Record<string, any>[];
  soldSerials?: Record<string, any>[];
  privateCost?: {
    costPrice?: number;
    vendorId?: string;
    supplierName?: string;
  };
  extraDocs?: {
    collectionName: string;
    docId: string;
    data: Record<string, any>;
  }[];
}

export interface TrashArchivePayload {
  category: TrashModuleCategory;
  subCategory?: string;
  collectionName: string;
  entityId: string;
  title: string;
  subtitle?: string;
  amount?: number;
  data: Record<string, any>;
  relatedData?: TrashRelatedData;
  deletedBy: string;
  details: string;
}

export interface TrashItem {
  trashId: string; // audit_log doc id
  entityId: string;
  category: TrashModuleCategory;
  subCategory: string;
  collectionName: string;
  title: string;
  subtitle: string;
  amount?: number;
  deletedAt: string;
  deletedBy: string;
  details: string;
  data: Record<string, any> | null;
  relatedData?: TrashRelatedData;
  isRestored: boolean;
  restoredAt?: string;
  restoredBy?: string;
  canRestore: boolean;
}

interface RecycleBinStateDoc {
  restoredIds?: Record<string, { restoredAt: string; restoredBy: string }>;
  dismissedIds?: Record<string, { dismissedAt: string; dismissedBy: string }>;
  updatedAt?: string;
}

const RECYCLE_BIN_STATE_DOC = 'recycle_bin_state';

function stripUndefinedDeep<T>(input: T): T {
  if (input === null || input === undefined) return input;
  if (Array.isArray(input)) {
    return input
      .filter((item) => item !== undefined)
      .map((item) => stripUndefinedDeep(item)) as unknown as T;
  }
  if (typeof input === 'object' && !(input instanceof Date)) {
    // Check if it looks like a Firestore Timestamp or plain object
    if (typeof (input as any).toDate === 'function') {
      return input;
    }
    const result: Record<string, any> = {};
    for (const [key, val] of Object.entries(input as Record<string, any>)) {
      if (val !== undefined && typeof val !== 'function') {
        result[key] = stripUndefinedDeep(val);
      }
    }
    return result as T;
  }
  return input;
}

/**
 * Maps legacy audit_logs category + details to a TrashModuleCategory & collectionName
 */
function inferTrashCategoryAndCollection(
  auditCategory: string,
  details: string,
  previousState: any
): {
  category: TrashModuleCategory;
  subCategory: string;
  collectionName: string;
} {
  if (previousState?.__trashMeta) {
    return {
      category: previousState.__trashMeta.category || 'others',
      subCategory: previousState.__trashMeta.subCategory || auditCategory || 'General',
      collectionName: previousState.__trashMeta.collectionName || 'orders',
    };
  }

  const catUpper = (auditCategory || '').toUpperCase();
  const detLower = (details || '').toLowerCase();
  const rawData = previousState?.data || previousState || {};

  if (catUpper === 'QUOTATION' || rawData?.type === 'quotation' || detLower.includes('quotation')) {
    return { category: 'quotations', subCategory: 'Quotation', collectionName: 'orders' };
  }

  if (
    catUpper === 'ORDER' ||
    catUpper === 'SALE' ||
    catUpper === 'POS' ||
    detLower.includes('deleted order') ||
    detLower.includes('deleted invoice') ||
    detLower.includes('deleted sale')
  ) {
    const sub =
      rawData?.type === 'challan'
        ? 'Delivery Challan'
        : rawData?.type === 'pos_sale'
        ? 'POS Sale'
        : rawData?.type === 'wholesale'
        ? 'Wholesale Invoice'
        : 'Sale / Order';
    return { category: 'sales', subCategory: sub, collectionName: 'orders' };
  }

  if (catUpper === 'PURCHASE' || detLower.includes('purchase')) {
    if (detLower.includes('purchase return') || rawData?.returnNo?.startsWith('PR')) {
      return {
        category: 'returns',
        subCategory: 'Purchase Return',
        collectionName: 'purchase_returns',
      };
    }
    return { category: 'purchases', subCategory: 'Purchase Bill', collectionName: 'purchases' };
  }

  if (
    catUpper === 'RETURN' ||
    catUpper === 'SALE_RETURN' ||
    catUpper === 'PURCHASE_RETURN' ||
    detLower.includes('sale return') ||
    detLower.includes('credit note') ||
    detLower.includes('debit note')
  ) {
    const isPurchaseRet =
      catUpper === 'PURCHASE_RETURN' ||
      detLower.includes('purchase return') ||
      detLower.includes('debit note') ||
      Boolean(rawData?.purchaseNo || rawData?.vendorName);
    return {
      category: 'returns',
      subCategory: isPurchaseRet ? 'Purchase Return' : 'Sale Return',
      collectionName: isPurchaseRet ? 'purchase_returns' : 'sale_returns',
    };
  }

  if (catUpper === 'INVENTORY' || catUpper === 'PRODUCT' || detLower.includes('product')) {
    return { category: 'products', subCategory: 'Product', collectionName: 'products' };
  }

  if (
    catUpper === 'CUSTOMER' ||
    catUpper === 'VENDOR' ||
    catUpper === 'SUPPLIER' ||
    detLower.includes('customer') ||
    detLower.includes('vendor') ||
    detLower.includes('supplier')
  ) {
    const isVendor =
      catUpper === 'VENDOR' ||
      catUpper === 'SUPPLIER' ||
      detLower.includes('vendor') ||
      detLower.includes('supplier') ||
      Boolean(rawData?.company && !rawData?.totalSpent);
    return {
      category: 'contacts',
      subCategory: isVendor ? 'Supplier / Vendor' : 'Customer',
      collectionName: isVendor ? 'vendors' : 'customers',
    };
  }

  if (
    catUpper === 'ACCOUNTING' ||
    catUpper === 'EXPENSE' ||
    catUpper === 'INCOME' ||
    catUpper === 'TRANSACTION' ||
    catUpper === 'PAYMENT' ||
    detLower.includes('expense') ||
    detLower.includes('income') ||
    detLower.includes('transaction') ||
    detLower.includes('payment')
  ) {
    if (detLower.includes('payment account') || rawData?.accountName || rawData?.accountNumber) {
      return {
        category: 'accounting',
        subCategory: 'Payment Account',
        collectionName: 'payment_accounts',
      };
    }
    const txType = rawData?.type || '';
    const sub =
      txType === 'expense'
        ? 'Expense'
        : txType === 'income'
        ? 'Income'
        : txType === 'deposit' || txType === 'withdrawal' || txType === 'transfer'
        ? 'Deposit / Withdrawal'
        : txType === 'payment_received'
        ? 'Customer Payment'
        : txType === 'payment_made'
        ? 'Supplier Payment'
        : 'Transaction';
    return { category: 'accounting', subCategory: sub, collectionName: 'transactions' };
  }

  if (catUpper === 'SERVICE' || detLower.includes('service')) {
    return { category: 'others', subCategory: 'Warranty / Service', collectionName: 'services' };
  }

  if (detLower.includes('menu') || detLower.includes('category')) {
    return { category: 'others', subCategory: 'Category / Menu', collectionName: 'menus' };
  }

  if (detLower.includes('discount') || detLower.includes('coupon')) {
    return { category: 'others', subCategory: 'Discount Coupon', collectionName: 'couponCodes' };
  }

  return { category: 'others', subCategory: auditCategory || 'System Record', collectionName: '' };
}

/**
 * Extracts a human-friendly title, subtitle, and amount from raw record data
 */
function extractDisplayInfo(
  category: TrashModuleCategory,
  subCategory: string,
  entityId: string,
  details: string,
  rawData: Record<string, any> | null,
  trashMeta?: Record<string, any>
): { title: string; subtitle: string; amount?: number } {
  if (trashMeta?.title) {
    return {
      title: trashMeta.title,
      subtitle: trashMeta.subtitle || details || '',
      amount:
        trashMeta.amount !== undefined && trashMeta.amount !== null
          ? Number(trashMeta.amount)
          : undefined,
    };
  }

  if (!rawData || typeof rawData !== 'object') {
    return {
      title: details || `${subCategory} (${entityId || 'Unknown'})`,
      subtitle: entityId ? `ID: ${entityId}` : '',
    };
  }

  switch (category) {
    case 'sales':
    case 'quotations': {
      const docNo = rawData.documentNumber || rawData.id || entityId;
      const customer =
        rawData.customerName ||
        rawData.customer?.name ||
        rawData.shippingAddress?.name ||
        'Walk-in Customer';
      const phone = rawData.customerPhone || rawData.customer?.phone || '';
      const itemsCount = Array.isArray(rawData.items) ? rawData.items.length : 0;
      const total = Number(rawData.total ?? rawData.grandTotal ?? rawData.subtotal ?? 0);
      return {
        title: `${docNo} — ${customer}`,
        subtitle: `${phone ? phone + ' • ' : ''}${itemsCount} item(s) • Status: ${
          rawData.status || 'N/A'
        }`,
        amount: total,
      };
    }
    case 'purchases': {
      const purNo = rawData.purchaseNumber || rawData.invoiceNumber || rawData.id || entityId;
      const supplier = rawData.supplierName || rawData.vendorName || 'Unknown Supplier';
      const itemsCount = Array.isArray(rawData.items) ? rawData.items.length : 0;
      const total = Number(rawData.totalAmount ?? rawData.total ?? 0);
      return {
        title: `${purNo} — ${supplier}`,
        subtitle: `${itemsCount} item(s) • Paid: ৳${Number(
          rawData.paidAmount || 0
        ).toLocaleString()} • Due: ৳${Number(rawData.dueAmount || 0).toLocaleString()}`,
        amount: total,
      };
    }
    case 'products': {
      const name = rawData.name || rawData.title || `Product #${entityId}`;
      const sku = rawData.sku || rawData.productCode || 'N/A';
      const cat = rawData.category || 'Uncategorized';
      const stock = Number(rawData.stock ?? 0);
      const price = Number(rawData.price ?? 0);
      return {
        title: name,
        subtitle: `SKU: ${sku} • Category: ${cat} • Stock: ${stock}`,
        amount: price,
      };
    }
    case 'returns': {
      const retNo = rawData.returnNo || rawData.id || entityId;
      const party =
        rawData.customerName || rawData.supplierName || rawData.vendorName || 'Unknown Party';
      const refDoc = rawData.orderNo || rawData.purchaseNo || '';
      const total = Number(rawData.totalReturnAmount ?? rawData.total ?? 0);
      return {
        title: `${retNo} — ${party}`,
        subtitle: `${subCategory}${refDoc ? ` (Ref: ${refDoc})` : ''}`,
        amount: total,
      };
    }
    case 'contacts': {
      const name = rawData.name || rawData.company || `Contact #${entityId}`;
      const phone = rawData.phone || 'No Phone';
      const email = rawData.email || '';
      const balance = Number(rawData.totalDue ?? rawData.balance ?? rawData.totalSpent ?? 0);
      return {
        title: `${name} (${phone})`,
        subtitle: `${subCategory}${email ? ` • ${email}` : ''}${
          rawData.address ? ` • ${rawData.address}` : ''
        }`,
        amount: balance || undefined,
      };
    }
    case 'accounting': {
      if (subCategory === 'Payment Account' || rawData.accountName) {
        return {
          title: rawData.accountName || rawData.name || `Account #${entityId}`,
          subtitle: `${rawData.accountType || 'Account'} • ${rawData.accountNumber || ''}`,
          amount: Number(rawData.balance ?? rawData.openingBalance ?? 0),
        };
      }
      const desc =
        rawData.description ||
        rawData.category ||
        rawData.note ||
        rawData.documentNumber ||
        subCategory;
      const party = rawData.customerName || rawData.supplierName || rawData.paymentMethod || '';
      const amt = Number(rawData.amount ?? rawData.paidAmount ?? 0);
      return {
        title: `${subCategory}: ${desc}`,
        subtitle: `${party ? party + ' • ' : ''}Date: ${rawData.date || 'N/A'}`,
        amount: amt,
      };
    }
    default: {
      const title =
        rawData.name ||
        rawData.title ||
        rawData.code ||
        rawData.documentNumber ||
        details ||
        `${subCategory} (${entityId})`;
      return {
        title,
        subtitle: details || `ID: ${entityId}`,
        amount: rawData.price || rawData.amount ? Number(rawData.price || rawData.amount) : undefined,
      };
    }
  }
}

/**
 * Archives a deleted entity into Firestore audit_logs with complete snapshot & metadata
 * so it can be inspected and restored from the Restore Center.
 */
export async function moveToTrash(payload: TrashArchivePayload): Promise<string | null> {
  try {
    const cleanData = stripUndefinedDeep(payload.data || {});
    const cleanRelated = payload.relatedData ? stripUndefinedDeep(payload.relatedData) : undefined;
    const nowIso = new Date().toISOString();

    const auditCategoryMap: Record<TrashModuleCategory, string> = {
      sales: 'ORDER',
      purchases: 'PURCHASE',
      products: 'INVENTORY',
      quotations: 'QUOTATION',
      returns: 'RETURN',
      contacts: payload.collectionName === 'vendors' ? 'VENDOR' : 'CUSTOMER',
      accounting: 'ACCOUNTING',
      others: 'SYSTEM',
    };

    const logEntry = stripUndefinedDeep({
      action: 'DELETE',
      category: auditCategoryMap[payload.category] || 'SYSTEM',
      details: payload.details,
      performedBy: payload.deletedBy || 'Admin',
      timestamp: nowIso,
      entityId: payload.entityId,
      previousState: {
        __trashMeta: {
          category: payload.category,
          subCategory: payload.subCategory || payload.category,
          collectionName: payload.collectionName,
          title: payload.title,
          subtitle: payload.subtitle || '',
          amount: payload.amount,
          deletedAt: nowIso,
          deletedBy: payload.deletedBy || 'Admin',
        },
        data: cleanData,
        relatedData: cleanRelated,
      },
    });

    const docRef = await addDoc(collection(db, 'audit_logs'), logEntry);
    return docRef.id;
  } catch (err) {
    console.error('Failed to archive item to trash:', err);
    return null;
  }
}

/**
 * Loads the Recycle Bin state (restored / dismissed IDs) from settings/recycle_bin_state
 */
async function getRecycleBinState(): Promise<RecycleBinStateDoc> {
  try {
    const snap = await getDoc(doc(db, 'settings', RECYCLE_BIN_STATE_DOC));
    if (snap.exists()) {
      return snap.data() as RecycleBinStateDoc;
    }
  } catch (err) {
    console.warn('Could not read recycle_bin_state:', err);
  }
  return { restoredIds: {}, dismissedIds: {} };
}

/**
 * Updates settings/recycle_bin_state
 */
async function updateRecycleBinState(updater: (prev: RecycleBinStateDoc) => RecycleBinStateDoc) {
  const current = await getRecycleBinState();
  const next = updater({
    restoredIds: { ...(current.restoredIds || {}) },
    dismissedIds: { ...(current.dismissedIds || {}) },
  });
  next.updatedAt = new Date().toISOString();
  await setDoc(doc(db, 'settings', RECYCLE_BIN_STATE_DOC), stripUndefinedDeep(next), {
    merge: true,
  });
}

/**
 * Fetches all deleted items from audit_logs, enriches them with restore status,
 * and groups/sorts them newest-first.
 */
export async function fetchTrashItems(maxItems = 500): Promise<TrashItem[]> {
  const [logsSnap, binState] = await Promise.all([
    getDocs(query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(maxItems))),
    getRecycleBinState(),
  ]);

  const restoredByEntityOrTrashId: Record<string, { restoredAt: string; restoredBy: string }> = {
    ...(binState.restoredIds || {}),
  };
  const dismissedMap = binState.dismissedIds || {};

  // First pass: also check RESTORE action logs in audit_logs
  logsSnap.docs.forEach((docSnap) => {
    const d = docSnap.data();
    if (d.action === 'RESTORE' && d.entityId) {
      const existing = restoredByEntityOrTrashId[d.entityId];
      if (!existing || d.timestamp > existing.restoredAt) {
        restoredByEntityOrTrashId[d.entityId] = {
          restoredAt: d.timestamp,
          restoredBy: d.performedBy || 'Admin',
        };
      }
    }
  });

  const items: TrashItem[] = [];
  const seenTrashKey = new Set<string>();

  for (const docSnap of logsSnap.docs) {
    const d = docSnap.data();
    if (d.action !== 'DELETE') continue;

    const trashId = docSnap.id;
    if (dismissedMap[trashId]) continue;

    const prev = d.previousState || null;
    const trashMeta = prev?.__trashMeta || null;
    const rawData: Record<string, any> | null = prev?.__trashMeta
      ? prev.data || null
      : prev && typeof prev === 'object'
      ? prev
      : null;
    const relatedData: TrashRelatedData | undefined = prev?.__trashMeta
      ? prev.relatedData
      : undefined;

    const entityId =
      d.entityId ||
      rawData?.id ||
      trashMeta?.entityId ||
      extractEntityIdFromDetails(d.details || '') ||
      trashId;

    // Deduplicate if both logAudit and moveToTrash wrote at the same second for the same entityId
    const secondBucket = (d.timestamp || '').slice(0, 16);
    const dedupeKey = `${entityId}__${secondBucket}`;
    if (seenTrashKey.has(dedupeKey)) {
      // Keep the one with __trashMeta or richer data
      const existingIdx = items.findIndex(
        (it) => it.entityId === entityId && (it.deletedAt || '').slice(0, 16) === secondBucket
      );
      if (existingIdx !== -1 && !items[existingIdx].data && rawData) {
        items.splice(existingIdx, 1);
      } else {
        continue;
      }
    }
    seenTrashKey.add(dedupeKey);

    const { category, subCategory, collectionName } = inferTrashCategoryAndCollection(
      d.category || '',
      d.details || '',
      prev
    );

    const display = extractDisplayInfo(
      category,
      subCategory,
      entityId,
      d.details || '',
      rawData,
      trashMeta
    );

    // Check if restored AFTER this deletion occurred
    const restoreInfoByTrashId = restoredByEntityOrTrashId[trashId];
    const restoreInfoByEntity = restoredByEntityOrTrashId[entityId];
    const effectiveRestore =
      restoreInfoByTrashId ||
      (restoreInfoByEntity && restoreInfoByEntity.restoredAt >= (d.timestamp || '')
        ? restoreInfoByEntity
        : undefined);

    const canRestore = Boolean(
      rawData && Object.keys(rawData).length > 0 && collectionName && entityId
    );

    items.push({
      trashId,
      entityId,
      category,
      subCategory,
      collectionName,
      title: display.title,
      subtitle: display.subtitle,
      amount: display.amount,
      deletedAt: d.timestamp || trashMeta?.deletedAt || new Date().toISOString(),
      deletedBy: d.performedBy || trashMeta?.deletedBy || 'Admin',
      details: d.details || '',
      data: rawData,
      relatedData,
      isRestored: Boolean(effectiveRestore),
      restoredAt: effectiveRestore?.restoredAt,
      restoredBy: effectiveRestore?.restoredBy,
      canRestore,
    });
  }

  return items;
}

function extractEntityIdFromDetails(details: string): string {
  // e.g. "Deleted Order INV-1023" or "Deleted product: Router (ID: abc123)"
  const idMatch = details.match(/\(ID:\s*([^)]+)\)/i);
  if (idMatch) return idMatch[1].trim();
  const hashMatch = details.match(/#([A-Za-z0-9_-]+)/);
  if (hashMatch) return hashMatch[1].trim();
  return '';
}

/**
 * Restores a deleted item back to its original Firestore collection,
 * including its associated transactions, stock adjustments, serials, and private costs.
 */
export async function restoreTrashItem(
  item: TrashItem,
  restoredBy: string,
  options: { adjustInventoryAndAccounts?: boolean } = { adjustInventoryAndAccounts: true }
): Promise<void> {
  if (!item.canRestore || !item.data || !item.collectionName) {
    throw new Error(
      'এই ডিলিট হওয়া ডাটাটিতে সম্পূর্ণ স্ন্যাপশট নেই (পুরানো রেকর্ড), তাই এটি স্বয়ংক্রিয়ভাবে রিস্টোর করা সম্ভব নয়।'
    );
  }

  const rawData = stripUndefinedDeep({ ...item.data });
  const targetDocId = String(rawData.id || item.entityId);
  delete rawData.id;

  const shouldAdjust = options.adjustInventoryAndAccounts !== false;

  // 1. Category-specific restoration
  if (item.collectionName === 'products') {
    const publicProductData = sanitizePublicProductData(
      {
        ...rawData,
        restoredAt: new Date().toISOString(),
      },
      false
    );
    await setDoc(doc(db, 'products', targetDocId), stripUndefinedDeep(publicProductData), {
      merge: true,
    });

    const costPrice =
      item.relatedData?.privateCost?.costPrice ??
      (rawData.costPrice !== undefined ? Number(rawData.costPrice) : undefined);
    const vendorId = item.relatedData?.privateCost?.vendorId ?? rawData.vendorId;
    const supplierName = item.relatedData?.privateCost?.supplierName ?? rawData.supplierName;

    if (costPrice !== undefined || vendorId || supplierName) {
      await saveProductPrivateCost(targetDocId, {
        ...(costPrice !== undefined ? { costPrice: Number(costPrice) } : {}),
        ...(vendorId ? { vendorId: String(vendorId) } : {}),
        ...(supplierName ? { supplierName: String(supplierName) } : {}),
      });
    }
  } else if (item.collectionName === 'orders') {
    // Sales / Orders / Quotations / Challans
    await setDoc(doc(db, 'orders', targetDocId), stripUndefinedDeep(rawData), { merge: true });

    const isQuotation = rawData.type === 'quotation' || item.category === 'quotations';
    if (!isQuotation && shouldAdjust) {
      // Restore linked transactions if archived, or recreate if missing
      const archivedTxs = item.relatedData?.transactions || [];
      if (archivedTxs.length > 0) {
        for (const tx of archivedTxs) {
          const txCopy = stripUndefinedDeep({ ...tx });
          const txId = txCopy.id;
          delete txCopy.id;
          if (txId) {
            await setDoc(doc(db, 'transactions', String(txId)), txCopy, { merge: true });
          } else {
            await addDoc(collection(db, 'transactions'), txCopy);
          }
        }
      }

      // Deduct product stock & update serials if the order had deducted stock originally
      const wasActiveOrder =
        rawData.status !== 'Cancelled' &&
        rawData.status !== 'Returned' &&
        (rawData.type === 'invoice' ||
          rawData.type === 'challan' ||
          rawData.type === 'sale' ||
          rawData.type === 'pos_sale' ||
          rawData.type === 'wholesale' ||
          !rawData.type);

      if (wasActiveOrder && Array.isArray(rawData.items)) {
        for (const orderItem of rawData.items) {
          const productId = String(orderItem.id || orderItem.productId || '');
          const qty = Number(orderItem.quantity || 0);
          if (!productId || qty <= 0) continue;

          try {
            const prodRef = doc(db, 'products', productId);
            const prodSnap = await getDoc(prodRef);
            if (prodSnap.exists()) {
              const pData = prodSnap.data();
              const currentStock = Number(pData.stock || 0);
              const selectedSerials: string[] = Array.isArray(orderItem.selectedSerials)
                ? orderItem.selectedSerials
                : [];
              const currentAvailableSerials: string[] = Array.isArray(pData.availableSerials)
                ? pData.availableSerials
                : [];
              const updatedSerials =
                selectedSerials.length > 0
                  ? currentAvailableSerials.filter((s) => !selectedSerials.includes(s))
                  : currentAvailableSerials;

              await updateDoc(prodRef, {
                stock: Math.max(0, currentStock - qty),
                ...(selectedSerials.length > 0 ? { availableSerials: updatedSerials } : {}),
              });
            }
          } catch (stockErr) {
            console.warn('Could not adjust stock while restoring order item:', stockErr);
          }
        }
      }

      // Restore sold_serials if archived
      const archivedSerials = item.relatedData?.soldSerials || [];
      for (const sDoc of archivedSerials) {
        const sCopy = stripUndefinedDeep({ ...sDoc });
        const sId = sCopy.id;
        delete sCopy.id;
        if (sId) {
          await setDoc(doc(db, 'sold_serials', String(sId)), sCopy, { merge: true });
        } else {
          await addDoc(collection(db, 'sold_serials'), sCopy);
        }
      }
    }
  } else if (item.collectionName === 'purchases') {
    // Supplier Purchase Bill
    await setDoc(doc(db, 'purchases', targetDocId), stripUndefinedDeep(rawData), { merge: true });

    if (shouldAdjust) {
      // Restore linked transactions
      const archivedTxs = item.relatedData?.transactions || [];
      if (archivedTxs.length > 0) {
        for (const tx of archivedTxs) {
          const txCopy = stripUndefinedDeep({ ...tx });
          const txId = txCopy.id;
          delete txCopy.id;
          if (txId) {
            await setDoc(doc(db, 'transactions', String(txId)), txCopy, { merge: true });
          } else {
            await addDoc(collection(db, 'transactions'), txCopy);
          }
        }
      }

      // Increment product stock back since purchase deletion had decremented it
      if (Array.isArray(rawData.items)) {
        for (const purItem of rawData.items) {
          const productId = String(purItem.productId || purItem.id || '');
          const qty = Number(purItem.quantity || 0);
          if (!productId || qty <= 0) continue;

          try {
            const prodRef = doc(db, 'products', productId);
            const prodSnap = await getDoc(prodRef);
            if (prodSnap.exists()) {
              const pData = prodSnap.data();
              const newSerials: string[] = Array.isArray(purItem.newSerials)
                ? purItem.newSerials
                : [];
              const existingSerials: string[] = Array.isArray(pData.availableSerials)
                ? pData.availableSerials
                : [];
              const mergedSerials =
                newSerials.length > 0
                  ? Array.from(new Set([...existingSerials, ...newSerials]))
                  : existingSerials;

              await updateDoc(prodRef, {
                stock: increment(qty),
                ...(newSerials.length > 0 ? { availableSerials: mergedSerials } : {}),
              });
            }
          } catch (stockErr) {
            console.warn('Could not increment product stock on purchase restore:', stockErr);
          }
        }
      }
    }
  } else if (item.collectionName === 'sale_returns') {
    await setDoc(doc(db, 'sale_returns', targetDocId), stripUndefinedDeep(rawData), {
      merge: true,
    });

    if (shouldAdjust) {
      const archivedTxs = item.relatedData?.transactions || [];
      for (const tx of archivedTxs) {
        const txCopy = stripUndefinedDeep({ ...tx });
        const txId = txCopy.id;
        delete txCopy.id;
        if (txId) {
          await setDoc(doc(db, 'transactions', String(txId)), txCopy, { merge: true });
        } else {
          await addDoc(collection(db, 'transactions'), txCopy);
        }
      }

      if (Array.isArray(rawData.items)) {
        for (const retItem of rawData.items) {
          if (retItem.productId && Number(retItem.returnQty) > 0) {
            try {
              await updateDoc(doc(db, 'products', String(retItem.productId)), {
                stock: increment(Number(retItem.returnQty)),
              });
            } catch (e) {
              console.warn('Stock update skipped for sale return restore:', e);
            }
          }
        }
      }
    }
  } else if (item.collectionName === 'purchase_returns') {
    await setDoc(doc(db, 'purchase_returns', targetDocId), stripUndefinedDeep(rawData), {
      merge: true,
    });

    if (shouldAdjust) {
      const archivedTxs = item.relatedData?.transactions || [];
      for (const tx of archivedTxs) {
        const txCopy = stripUndefinedDeep({ ...tx });
        const txId = txCopy.id;
        delete txCopy.id;
        if (txId) {
          await setDoc(doc(db, 'transactions', String(txId)), txCopy, { merge: true });
        } else {
          await addDoc(collection(db, 'transactions'), txCopy);
        }
      }

      if (Array.isArray(rawData.items)) {
        for (const retItem of rawData.items) {
          if (retItem.productId && Number(retItem.returnQty) > 0) {
            try {
              await updateDoc(doc(db, 'products', String(retItem.productId)), {
                stock: increment(-Number(retItem.returnQty)),
              });
            } catch (e) {
              console.warn('Stock update skipped for purchase return restore:', e);
            }
          }
        }
      }
    }
  } else {
    // Generic collection restore (customers, vendors, transactions, payment_accounts, services, menus, couponCodes)
    await setDoc(doc(db, item.collectionName, targetDocId), stripUndefinedDeep(rawData), {
      merge: true,
    });
  }

  // Restore any extra linked docs
  if (item.relatedData?.extraDocs?.length) {
    for (const extra of item.relatedData.extraDocs) {
      await setDoc(
        doc(db, extra.collectionName, extra.docId),
        stripUndefinedDeep(extra.data),
        { merge: true }
      );
    }
  }

  const nowIso = new Date().toISOString();

  // Mark as restored in settings/recycle_bin_state
  await updateRecycleBinState((prev) => ({
    ...prev,
    restoredIds: {
      ...(prev.restoredIds || {}),
      [item.trashId]: { restoredAt: nowIso, restoredBy },
      [item.entityId]: { restoredAt: nowIso, restoredBy },
    },
  }));

  // Also log RESTORE action in audit_logs
  await addDoc(
    collection(db, 'audit_logs'),
    stripUndefinedDeep({
      action: 'RESTORE',
      category: item.category.toUpperCase(),
      details: `Restored ${item.subCategory}: ${item.title}`,
      performedBy: restoredBy || 'Admin',
      timestamp: nowIso,
      entityId: item.entityId,
      newState: {
        restoredFromTrashId: item.trashId,
        collectionName: item.collectionName,
      },
    })
  );
}

/**
 * Hides / Dismisses an item from the Recycle Bin view
 */
export async function dismissTrashItem(trashId: string, dismissedBy: string): Promise<void> {
  const nowIso = new Date().toISOString();
  await updateRecycleBinState((prev) => ({
    ...prev,
    dismissedIds: {
      ...(prev.dismissedIds || {}),
      [trashId]: { dismissedAt: nowIso, dismissedBy },
    },
  }));
}
