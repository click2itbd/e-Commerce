import React, { useState, useEffect, useMemo } from 'react';
import { collection, addDoc, updateDoc, doc, getDocs, query, orderBy, deleteDoc, setDoc, where, increment, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../../../../firebase';
import { Product, Vendor, Customer, Order, Transaction, SiteSettings, PaymentAccount, WorkOrder } from '../../../../types';
import { formatCurrency, cn, warrantyToMonths, monthsToWarrantyValue, type WarrantyUnit } from '../../../../lib/utils';
import { calculateAccountBalance, validateSufficientBalance } from '../../../../lib/accountBalance';
import {
  calculateCustomerAccountPosition,
  computeWorkOrderFinancials,
  discoverProjectWorkOrders,
  hasActiveProjectOrWorkOrderScope,
} from '../../../../utils/customerAdvanceAccounting';
import { CustomerAdvanceModal } from '../../modals/CustomerAdvanceModal';

const itemWarrantyMonths = (i: any): number =>
  i.warrantyValue !== undefined
    ? warrantyToMonths(Number(i.warrantyValue) || 0, (i.warrantyUnit || 'years') as WarrantyUnit)
    : (Number(i.warrantyYears) || 0) * 12;
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../../context/AuthContext';
import { logAudit } from '../../../../lib/audit';
import { moveToTrash } from '../../../../lib/trash';
import { sanitizePublicProductData, saveProductPrivateCost, addProductPrivateCostToBatch } from '../../../../lib/productCosts';
import { PreparedBySelect } from '../../../../components/common/PreparedBySelect';
import {
  Edit2,
  ShoppingBag, Barcode, ScanLine,
  Plus,
  Trash2,
  Search,
  Download,
  Printer,
  Boxes,
  CheckCircle,
  Eye,
  X,
  AlertCircle,
  History,
  Paperclip,
  Upload,
  Image as ImageIcon,
  Truck,
  ExternalLink,
  Wallet,
  FolderKanban,
  FileText,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { generateDocumentNumber } from '../../../../lib/numbering';
import { AIPolishButton } from '../../../../components/common/AIPolishButton';
import { Pagination } from '../../../../components/common/Pagination';
import { issueCheque } from '../../../../services/chequeService';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PurchaseItem {
  unit?: string;
  id: string;
  name: string;
  category?: string;
  images?: string[];
  purchasePrice: number;
  salesPrice?: number;
  quantity: number;
  hasWarranty?: boolean;
  warrantyYears?: number;
  warrantyValue?: number;
  warrantyUnit?: 'days' | 'months' | 'years';
  hasSerialTracking?: boolean;
  newSerials?: string | string[];
  sku?: string;
  brand?: string;
  subCategory?: string;
}

interface PurchaseRecord {
  shippingCost?: number;
  discountAmount?: number;
  createdBy?: string;
  id: string;
  documentNumber: string;
  vendorId: string;
  vendorName: string;
  date: string;
  items: PurchaseItem[];
  subtotal: number;
  total: number;
  paidAmount: number;
  dueAmount?: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  isChequePayment?: boolean;
  chequeNumber?: string;
  chequeClearingDate?: string;
  chequeStatus?: 'pending' | 'cleared' | 'bounced';
  paymentAccountId?: string;
  paymentMethod?: string;
  reference?: string;
  workOrderNumber?: string;
  projectName?: string;
  branchName?: string;
  customerId?: string;
  customerName?: string;
  attachmentUrl?: string;
  notes?: string;
  createdAt: string;
}

interface PurchasesProps {
  users?: any[];
  vendors?: Vendor[];
  customers?: Customer[];
  products?: Product[];
  transactions?: Transaction[];
  settings?: SiteSettings;
  setSelectedLedgerEntity?: (entity: { id: string; name: string; type: 'customer' | 'vendor' }) => void;
  setActiveTab?: (tab: string) => void;
  fetchData?: () => Promise<void>;
}

const Purchases: React.FC<PurchasesProps> = ({
  users = [],
  vendors: initialVendors = [],
  customers: initialCustomers = [],
  products: initialProducts = [],
  transactions: initialTransactions = [],
  settings,
  setSelectedLedgerEntity,
  setActiveTab,
  fetchData = async () => {},
}) => {
  const { profile } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseRecord[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [workOrderFilter, setWorkOrderFilter] = useState<string>('all');
  const [rawMenus, setRawMenus] = useState<any[]>([]);
  const [globalBrands, setGlobalBrands] = useState<any[]>([]);
  const [pickForm, setPickForm] = useState({
    category: '',
    subCategory: '',
    brand: '',
    name: '',
    model: '',
    variant: '',
    costPrice: '',
    salesPrice: '',
    barcode: ''
  });

  // Categories state
  const [savedCategories, setSavedCategories] = useState<string[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);
  const [isAddingSubCategory, setIsAddingSubCategory] = useState(false);
  const [newSubCategoryName, setNewSubCategoryName] = useState('');
  const [savingSubCategory, setSavingSubCategory] = useState(false);
  const [isAddingBrand, setIsAddingBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [savingBrand, setSavingBrand] = useState(false);

  // Purchase Form State
  const [isCreatingPurchase, setIsCreatingPurchase] = useState(() => {
    try {
      const draft = localStorage.getItem('draft_purchase_form');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed && (parsed.forceOpen || parsed.vendorId || parsed.workOrderNumber || parsed.projectName || parsed.items?.length > 0)) return true;
      }
    } catch(e) {}
    return false;
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [productCatalogSearch, setProductCatalogSearch] = useState<string>('');

  // Quick Add Product
  const [isQuickAddingProduct, setIsQuickAddingProduct] = useState(false);
  const [quickProductData, setQuickProductData] = useState({ name: '', sku: '', model: '', category: '', costPrice: 0, price: 0, stock: 0, hasWarranty: false, warrantyMonths: 0 });

    const [purchaseForm, setPurchaseForm] = useState(() => {
    try {
      const draft = localStorage.getItem('draft_purchase_form');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed && (parsed.forceOpen || parsed.vendorId || parsed.workOrderNumber || parsed.projectName || parsed.items?.length > 0)) {
          setTimeout(() => toast('Loaded purchase draft', { icon: '📝' }), 1000);
          return {
            vendorId: '',
            vendorName: '',
            date: new Date().toISOString().split('T')[0],
            reference: '',
            workOrderNumber: '',
            projectName: '',
            customerId: '',
            customerName: '',
            items: [] as PurchaseItem[],
            paymentAccountId: '',
            paymentMethod: '',
            paidAmount: 0,
            isChequePayment: false,
            chequeNumber: '',
            chequeClearingDate: new Date().toISOString().split('T')[0],
            discountAmount: 0,
            shippingCost: 0,
            attachmentUrl: '',
            notes: '',
            createdBy: '',
            ...parsed,
          };
        }
      }
    } catch(e) {}
    return {
      vendorId: '',
      vendorName: '',
      date: new Date().toISOString().split('T')[0],
      reference: '',
      workOrderNumber: '',
      projectName: '',
      customerId: '',
      customerName: '',
      items: [] as PurchaseItem[],
      paymentAccountId: '',
      paymentMethod: '',
      paidAmount: 0,
      isChequePayment: false,
      chequeNumber: '',
      chequeClearingDate: new Date().toISOString().split('T')[0],
      discountAmount: 0,
      shippingCost: 0,
      attachmentUrl: '',
      notes: '',
      createdBy: ''
    };
  });
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  useEffect(() => {
    if (purchaseForm.vendorId || purchaseForm.workOrderNumber || purchaseForm.projectName || purchaseForm.customerId || purchaseForm.items.length > 0) {
      localStorage.setItem('draft_purchase_form', JSON.stringify(purchaseForm));
    }
  }, [purchaseForm]);

  // Table Filters & Pagination
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [vendorFilter, setVendorFilter] = useState('all');
  const [searchHistory, setSearchHistory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Detail Modal
  const [viewingPurchase, setViewingPurchase] = useState<PurchaseRecord | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [venSnap, custSnap, prodSnap, accSnap, purSnap, catSnap, brandSnap, txSnap, woSnap, ordSnap] = await Promise.all([
        getDocs(query(collection(db, 'vendors'), orderBy('name'))),
        getDocs(query(collection(db, 'customers'), orderBy('name'))).catch(() => ({ docs: [] })),
        getDocs(query(collection(db, 'products'), orderBy('name'))),
        getDocs(query(collection(db, 'payment_accounts'), orderBy('name'))),
        getDocs(query(collection(db, 'purchases'), orderBy('createdAt', 'desc'))).catch(() => ({ docs: [] })),
        getDocs(query(collection(db, 'menus'))).catch(() => ({ docs: [] })),
        getDocs(query(collection(db, 'brands'))).catch(() => ({ docs: [] })),
        getDocs(query(collection(db, 'transactions'), orderBy('date', 'desc'))).catch(() => ({ docs: [] })),
        getDocs(collection(db, 'work_orders')).catch(() => ({ docs: [] })),
        getDocs(collection(db, 'orders')).catch(() => ({ docs: [] })),
      ]);

      const vens = venSnap.docs.map(d => ({ id: d.id, ...d.data() } as Vendor));
      const custs = custSnap.docs.map(d => ({ id: d.id, ...d.data() } as Customer));
      const prods = prodSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      const accs = accSnap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentAccount));
      const purs = purSnap.docs.map(d => ({ id: d.id, ...d.data() } as PurchaseRecord));
      const wos = woSnap.docs.map(d => ({ id: d.id, ...d.data() } as WorkOrder));
      wos.sort((a, b) => new Date(b.issuedDate || b.createdAt || 0).getTime() - new Date(a.issuedDate || a.createdAt || 0).getTime());
      setCustomers(custs);
      setOrders(ordSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      setWorkOrders(wos);
      setTransactions(txSnap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
      
      // Auto-recover any NEW_ products that were left out due to the bug
      let recoveredAny = false;
      for (const pur of purs) {
         let needsUpdate = false;
         for (let i = 0; i < pur.items.length; i++) {
            const item = pur.items[i];
            if (item.id && item.id.startsWith('NEW_')) {
               // Check if it already exists by SKU
               let matched = item.sku ? prodSnap.docs.find(d => d.data().sku === item.sku) : undefined;
               
               // Also check by name+category+subCategory+brand
               if (!matched) {
                  matched = prodSnap.docs.find(d => {
                     const pd = d.data();
                     return pd.name?.toLowerCase() === item.name?.toLowerCase() &&
                        (pd.category || '').toLowerCase() === (item.category || '').toLowerCase() &&
                        (pd.subCategory || '').toLowerCase() === (item.subCategory || '').toLowerCase() &&
                        (pd.brand || '').toLowerCase() === (item.brand || '').toLowerCase();
                  });
               }
               
               let realId = matched ? matched.id : null;
               
               if (matched) {
                  // Merge stock into existing
                  const existingData = matched.data();
                  const updates: any = {
                     stock: (existingData.stock || 0) + Number(item.quantity || 0),
                  };
                  if (item.purchasePrice) updates.costPrice = Number(item.purchasePrice);
                  if (item.salesPrice) updates.price = Number(item.salesPrice);
                  const { publicData, privateCostData } = sanitizePublicProductData(updates, true);
                  await updateDoc(matched.ref, publicData);
                  await saveProductPrivateCost(matched.id, privateCostData);
                  recoveredAny = true;
               } else {
                  const addedSerials = Array.isArray(item.newSerials) ? item.newSerials.filter((s: string) => s.trim()) : [];
                  const newProductData = {
                     name: item.name,
                     category: item.category || 'General',
                     subCategory: item.subCategory || '',
                     brand: item.brand || '',
                     description: item.name,
                     images: [],
                     sku: item.sku || '',
                     costPrice: Number(item.purchasePrice) || 0,
                     price: Number(item.salesPrice) || 0,
                     stock: Number(item.quantity) || 0,
                     hasWarranty: Boolean(item.hasWarranty),
                     warrantyMonths: item.hasWarranty ? itemWarrantyMonths(item) : 0,
                     warrantyUnit: item.warrantyUnit || 'years',
                     hasSerialTracking: Boolean(item.hasSerialTracking),
                     availableSerials: addedSerials,
                     createdAt: new Date().toISOString()
                  };
                  const { publicData, privateCostData } = sanitizePublicProductData(newProductData, false);
                  const docRef = await addDoc(collection(db, 'products'), publicData);
                  await saveProductPrivateCost(docRef.id, privateCostData);
                  realId = docRef.id;
                  recoveredAny = true;
               }
               
               if (realId) {
                  pur.items[i].id = realId;
                  needsUpdate = true;
               }
            }
         }
         if (needsUpdate) {
            await updateDoc(doc(db, 'purchases', pur.id), { items: pur.items });
         }
      }
      
      if (recoveredAny) {
         const newProdSnap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
         setProducts(newProdSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
      } else {
         setProducts(prods);
      }
      
      setPurchaseHistory(purs);

      const namesToDelete = ['Rem mollit deserunt', 'Hii', 'km'];
      const badBrandIds: string[] = [];
      for (const doc of brandSnap.docs) {
         if (namesToDelete.includes(doc.data().name)) {
            badBrandIds.push(doc.id);
            await deleteDoc(doc.ref);
         }
      }

      for (const mDoc of catSnap.docs) {
         const mData = mDoc.data() as any;
         let updated = false;
         if (mData.subCategories && Array.isArray(mData.subCategories)) {
            mData.subCategories.forEach((sub: any) => {
               if (sub.brands && Array.isArray(sub.brands)) {
                  const origLen = sub.brands.length;
                  sub.brands = sub.brands.filter((bId: string) => !badBrandIds.includes(bId));
                  if (sub.brands.length !== origLen) updated = true;
               }
            });
         }
         if (updated) await updateDoc(mDoc.ref, { subCategories: mData.subCategories });
      }

      const rawMenusData = catSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRawMenus(rawMenusData);
      
      const filteredBrands = brandSnap.docs.filter(d => !namesToDelete.includes(d.data().name));
      setGlobalBrands(filteredBrands.map(d => ({ id: d.id, ...d.data() })));
      const cats: string[] = [];
      catSnap.docs.forEach(d => {
        const data = d.data() as any;
        if (data.name) cats.push(data.name);
        if (data.subCategories && Array.isArray(data.subCategories)) {
          data.subCategories.forEach((sub: any) => {
            if (sub.name) cats.push(sub.name);
          });
        }
      });

      setVendors(vens);
      if (!recoveredAny) setProducts(prods);
      setPaymentAccounts(accs);
      setPurchaseHistory(purs);
      setSavedCategories(cats);

      
    } catch (err) {
      console.error(err);
      toast.error('Failed to load purchases data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Add a new product category to Firestore
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      toast.error('Category name cannot be empty');
      return;
    }
    const allCategories = Array.from(new Set([
      ...savedCategories,
      ...products.map(p => p.category).filter(Boolean),
    ]));
    if (allCategories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(`Category "${trimmed}" already exists`);
      return;
    }
    try {
      setSavingCategory(true);
      await addDoc(collection(db, 'menus'), {
        name: trimmed,
        slug: trimmed.toLowerCase().replace(/\s+/g, '-'),
        order: 0,
        subCategories: []
      });
      setSavedCategories(prev => [...prev, trimmed].sort());
      setNewCategoryName('');
      setIsAddingCategory(false);
      toast.success(`Category "${trimmed}" added successfully!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to add category');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleAddSubCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSubCategoryName.trim();
    if (!trimmed) {
      toast.error('Sub-category name cannot be empty');
      return;
    }
    if (!pickForm.category) {
      toast.error('Please select a category first');
      return;
    }
    
    const categoryMenu = rawMenus.find(m => m.name === pickForm.category);
    if (!categoryMenu) {
      toast.error('Selected category not found in menus');
      return;
    }
    
    const existingSubs = categoryMenu.subCategories || [];
    if (existingSubs.some((s: any) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(`Sub-category "${trimmed}" already exists`);
      return;
    }
    
    try {
      setSavingSubCategory(true);
      const newSub = {
        id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: trimmed,
        slug: trimmed.toLowerCase().replace(/\s+/g, '-'),
        order: existingSubs.length
      };
      
      const updatedSubs = [...existingSubs, newSub];
      await updateDoc(doc(db, 'menus', categoryMenu.id), {
        subCategories: updatedSubs
      });
      
      // Update local state so UI reflects immediately
      setRawMenus(prev => prev.map(m => m.id === categoryMenu.id ? { ...m, subCategories: updatedSubs } : m));
      
      setNewSubCategoryName('');
      setIsAddingSubCategory(false);
      setPickForm(prev => ({ ...prev, subCategory: trimmed }));
      toast.success(`Sub-category "${trimmed}" added!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to add sub-category');
    } finally {
      setSavingSubCategory(false);
    }
  };

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newBrandName.trim();
    if (!trimmed) {
      toast.error('Brand name cannot be empty');
      return;
    }
    if (globalBrands.some((b: any) => b.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(`Brand "${trimmed}" already exists`);
      return;
    }
    try {
      setSavingBrand(true);
      const docRef = await addDoc(collection(db, 'brands'), {
        name: trimmed
      });
      const newBrandObj = { id: docRef.id, name: trimmed };
      
      // Update local state
      setGlobalBrands(prev => [...prev, newBrandObj].sort((a, b) => a.name.localeCompare(b.name)));
      
      setNewBrandName('');
      setIsAddingBrand(false);
      setPickForm(prev => ({ ...prev, brand: trimmed }));
      toast.success(`Brand "${trimmed}" added!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to add brand');
    } finally {
      setSavingBrand(false);
    }
  };

  // Quick Add Product: create product in Firestore and add to purchase list
  const handleBarcodeScan = async () => {
    const { category, subCategory, brand, name, model, variant, barcode, costPrice, salesPrice } = pickForm;
    const scannedCode = (barcode || '').trim();

    if (!category) {
      toast.error('Please select a category first');
      return;
    }

    // 1. If Barcode/SKU was scanned or entered
    if (scannedCode) {
      const existingItemIndex = purchaseForm.items.findIndex((i: any) => 
        i.sku === scannedCode || (Array.isArray(i.newSerials) && i.newSerials.includes(scannedCode))
      );
      if (existingItemIndex > -1) {
        setPurchaseForm(prev => {
          const newItems = [...prev.items];
          const item = newItems[existingItemIndex];
          let updatedSerials = Array.isArray(item.newSerials) ? [...item.newSerials] : [];
          if (!updatedSerials.includes(scannedCode) && scannedCode !== item.sku) updatedSerials.push(scannedCode);
          newItems[existingItemIndex] = {
            ...item,
            quantity: item.quantity + 1,
            newSerials: updatedSerials.length > 0 ? updatedSerials : item.newSerials
          };
          return { ...prev, items: newItems };
        });
        setPickForm(prev => ({ ...prev, barcode: '' }));
        toast.success('Quantity increased by 1');
        return;
      }

      const existingProduct = products.find(p => p.sku === scannedCode || p.availableSerials?.includes(scannedCode));
      if (existingProduct) {
        setPurchaseForm(prev => ({
          ...prev, 
          items: [...prev.items, {
            id: existingProduct.id,
            name: existingProduct.name,
            category: existingProduct.category,
            purchasePrice: existingProduct.costPrice || Number(costPrice) || 0,
            salesPrice: existingProduct.price || Number(salesPrice) || 0,
            quantity: 1,
            discount: 0,
            tax: 0,
            total: existingProduct.costPrice || Number(costPrice) || 0,
            hasWarranty: Boolean(existingProduct.warrantyMonths && existingProduct.warrantyMonths > 0),
            warrantyUnit: existingProduct.warrantyUnit || 'years',
            warrantyValue: existingProduct.warrantyMonths ? monthsToWarrantyValue(existingProduct.warrantyMonths, (existingProduct.warrantyUnit || 'years') as WarrantyUnit) : 1,
            hasSerialTracking: Boolean(existingProduct.hasSerialTracking),
            sku: existingProduct.sku || scannedCode,
            newSerials: scannedCode !== existingProduct.sku ? [scannedCode] : [],
          }]
        }));
        setPickForm(prev => ({ ...prev, barcode: '' }));
        toast.success(`"${existingProduct.name}" added to purchase`);
        return;
      }

      if (!name || !name.trim()) {
        toast.error('Please enter product name for new item');
        return;
      }

      const combinedName = (name.trim() + (model ? ' ' + model.trim() : '') + (variant ? ' ' + variant.trim() : '')).trim();
      setPurchaseForm(prev => ({
        ...prev, 
        items: [...prev.items, {
          id: 'NEW_' + Math.random().toString(36).substring(2, 9),
          name: combinedName,
          category: category,
          subCategory: subCategory,
          brand: brand,
          purchasePrice: Number(costPrice) || 0,
          salesPrice: Number(salesPrice) || 0,
          quantity: 1,
          discount: 0,
          tax: 0,
          total: Number(costPrice) || 0,
          hasWarranty: false,
          warrantyUnit: 'years',
          warrantyValue: 1,
          hasSerialTracking: true,
          sku: scannedCode,
          newSerials: [scannedCode],
        }]
      }));
      setPickForm(prev => ({ ...prev, name: '', model: '', variant: '', costPrice: '', salesPrice: '', barcode: '' }));
      toast.success(`"${combinedName}" drafted for purchase`);
      return;
    }

    // 2. If Barcode/SKU is NOT provided (Normal Product Name & Category add)
    if (!name || !name.trim()) {
      toast.error('Please enter product name or scan barcode');
      return;
    }

    const combinedName = (name.trim() + (model ? ' ' + model.trim() : '') + (variant ? ' ' + variant.trim() : '')).trim();

    // Check if an existing product already matches this name
    const existingProductByName = products.find(p => 
      p.name?.toLowerCase().trim() === combinedName.toLowerCase() ||
      (p.name?.toLowerCase().trim() === name.trim().toLowerCase() && 
       (p.category || '').toLowerCase() === (category || '').toLowerCase())
    );

    if (existingProductByName) {
      const inPurchaseIdx = purchaseForm.items.findIndex(i => i.id === existingProductByName.id);
      if (inPurchaseIdx > -1) {
        setPurchaseForm(prev => {
          const newItems = [...prev.items];
          const newQty = newItems[inPurchaseIdx].quantity + 1;
          newItems[inPurchaseIdx] = {
            ...newItems[inPurchaseIdx],
            quantity: newQty,
            total: newQty * Number(newItems[inPurchaseIdx].purchasePrice || 0)
          };
          return { ...prev, items: newItems };
        });
        toast.success(`"${existingProductByName.name}" quantity increased by 1`);
      } else {
        setPurchaseForm(prev => ({
          ...prev, 
          items: [...prev.items, {
            id: existingProductByName.id,
            name: existingProductByName.name,
            category: existingProductByName.category,
            purchasePrice: existingProductByName.costPrice || Number(costPrice) || 0,
            salesPrice: existingProductByName.price || Number(salesPrice) || 0,
            quantity: 1,
            discount: 0,
            tax: 0,
            total: existingProductByName.costPrice || Number(costPrice) || 0,
            hasWarranty: Boolean(existingProductByName.warrantyMonths && existingProductByName.warrantyMonths > 0),
            warrantyUnit: existingProductByName.warrantyUnit || 'years',
            warrantyValue: existingProductByName.warrantyMonths ? monthsToWarrantyValue(existingProductByName.warrantyMonths, (existingProductByName.warrantyUnit || 'years') as WarrantyUnit) : 1,
            hasSerialTracking: Boolean(existingProductByName.hasSerialTracking),
            sku: existingProductByName.sku || '',
            newSerials: [],
          }]
        }));
        toast.success(`"${existingProductByName.name}" added to purchase`);
      }
      setPickForm(prev => ({ ...prev, name: '', model: '', variant: '', costPrice: '', salesPrice: '', barcode: '' }));
      return;
    }

    // Completely new product without barcode: Auto-generate SKU & do not force serial tracking
    const autoSku = 'PRD-' + Math.floor(10000000 + Math.random() * 90000000);
    setPurchaseForm(prev => ({
      ...prev, 
      items: [...prev.items, {
        id: 'NEW_' + Math.random().toString(36).substring(2, 9),
        name: combinedName,
        category: category,
        subCategory: subCategory,
        brand: brand,
        purchasePrice: Number(costPrice) || 0,
        salesPrice: Number(salesPrice) || 0,
        quantity: 1,
        discount: 0,
        tax: 0,
        total: Number(costPrice) || 0,
        hasWarranty: false,
        warrantyUnit: 'years',
        warrantyValue: 1,
        hasSerialTracking: false,
        sku: autoSku,
        newSerials: [],
      }]
    }));
    setPickForm(prev => ({ ...prev, name: '', model: '', variant: '', costPrice: '', salesPrice: '', barcode: '' }));
    toast.success(`"${combinedName}" added to purchase (Auto SKU: ${autoSku})`);
  };

  const handleQuickAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickProductData.name.trim();
    if (!trimmed) { toast.error('Product name is required'); return; }
    if (!quickProductData.category) { toast.error('Please select a category'); return; }
    try {
      const productData = {
          name: trimmed,
          model: quickProductData.model || '',
          sku: quickProductData.sku || '',
          category: quickProductData.category,
        costPrice: quickProductData.costPrice || 0,
        price: quickProductData.price || 0,
        stock: quickProductData.stock || 0,
          warrantyMonths: quickProductData.hasWarranty ? (quickProductData.warrantyMonths || 12) : 0,
        description: '',
        images: [],
        createdAt: new Date().toISOString(),
      };
      const { publicData, privateCostData } = sanitizePublicProductData(productData, false);
      const docRef = await addDoc(collection(db, 'products'), publicData);
      await saveProductPrivateCost(docRef.id, privateCostData);
      const newProduct = { id: docRef.id, ...productData } as Product;
      setProducts(prev => [...prev, newProduct]);
      addItemToPurchase(newProduct);
      setQuickProductData({ name: '', sku: '', model: '', category: '', costPrice: 0, price: 0, stock: 0, hasWarranty: false, warrantyMonths: 0 });
      setIsQuickAddingProduct(false);
      toast.success(`Product "${trimmed}" created & added to purchase!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to create product');
    }
  };

  // Compute bill subtotal, discount, shipping, and total
  const itemsSubtotal = purchaseForm.items.reduce((sum, item) => sum + (item.purchasePrice * item.quantity), 0);
  const totalShippingCost = Number(purchaseForm.shippingCost) || 0;
  const totalDiscount = Number(purchaseForm.discountAmount) || 0;
  const billTotal = Math.max(0, itemsSubtotal + totalShippingCost - totalDiscount);

  useEffect(() => {
    if (initialCustomers.length > 0 && customers.length === 0) {
      setCustomers(initialCustomers);
    }
  }, [initialCustomers, customers.length]);

  const discoveredScopes = useMemo(
    () =>
      discoverProjectWorkOrders({
        workOrders,
        transactions,
        orders,
        purchases: purchaseHistory,
        customers,
      }),
    [workOrders, transactions, orders, purchaseHistory, customers]
  );

  const projectSuggestions = useMemo(() => {
    const set = new Set<string>();
    discoveredScopes.forEach(s => {
      if (s.projectName) set.add(s.projectName);
    });
    customers.forEach(c => {
      if (c.branchName) set.add(c.branchName.trim());
      (c.branches || []).forEach(b => b && set.add(b.trim()));
      if (c.name) set.add(c.name.trim());
    });
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [discoveredScopes, customers]);

  const customersWithAdvance = useMemo(() => {
    return customers
      .map(c => ({
        customer: c,
        pos: calculateCustomerAccountPosition(transactions, c),
      }))
      .filter(entry => entry.pos.explicitAdvanceBalance > 0.01)
      .sort((a, b) => b.pos.explicitAdvanceBalance - a.pos.explicitAdvanceBalance);
  }, [customers, transactions]);

  const quickPickScopes = useMemo(() => {
    return discoveredScopes.filter(
      s =>
        s.financials.explicitRemainingAdvance > 0 ||
        (s.isRegisteredWO && s.status === 'active') ||
        (s.financials.totalPurchasesCost > s.financials.totalSalesInvoiced &&
          s.financials.customerDue <= 0)
    );
  }, [discoveredScopes]);

  const activePurchaseContext = useMemo(() => {
    const cleanWO = String(purchaseForm.workOrderNumber || '').trim().replace(/^#+/, '').trim();
    const cleanProj = String(purchaseForm.projectName || '').trim();
    const hasScope = hasActiveProjectOrWorkOrderScope({
      workOrderNumber: cleanWO || undefined,
      projectName: cleanProj || undefined,
    });

    const matchedScope = cleanWO
      ? discoveredScopes.find(
          s => s.workOrderNumber.trim().toLowerCase() === cleanWO.toLowerCase()
        )
      : cleanProj
      ? discoveredScopes.find(
          s => !s.workOrderNumber && s.projectName.trim().toLowerCase() === cleanProj.toLowerCase()
        ) ||
        discoveredScopes.find(
          s => s.projectName.trim().toLowerCase() === cleanProj.toLowerCase()
        )
      : undefined;

    const cleanProjLow = cleanProj.toLowerCase();
    const matchedCustomer =
      (purchaseForm.customerId && customers.find(c => c.id === purchaseForm.customerId)) ||
      (matchedScope?.customerId && customers.find(c => c.id === matchedScope.customerId)) ||
      (matchedScope?.clientName &&
        customers.find(
          c => c.name.trim().toLowerCase() === matchedScope.clientName.trim().toLowerCase()
        )) ||
      (cleanProjLow
        ? customers.find(
            c =>
              c.name.trim().toLowerCase() === cleanProjLow ||
              (c.branchName || '').trim().toLowerCase() === cleanProjLow ||
              (c.branches || []).some(b => b.trim().toLowerCase() === cleanProjLow)
          )
        : undefined) ||
      null;

    const otherPurchases = purchaseForm.id
      ? purchaseHistory.filter(p => p.id !== purchaseForm.id)
      : purchaseHistory;

    const scopedFinancials = hasScope
      ? computeWorkOrderFinancials({
          workOrderNumber: cleanWO || undefined,
          projectName: cleanProj || undefined,
          transactions,
          orders,
          purchases: otherPurchases,
        })
      : null;

    const overallCustomerPos = matchedCustomer
      ? calculateCustomerAccountPosition(transactions, matchedCustomer)
      : null;

    let preferredAccountId = matchedScope?.preferredPaymentAccountId || '';
    if (!preferredAccountId && matchedCustomer) {
      const advTx = transactions.find(
        t =>
          (t.type === 'payment_received' || t.type === 'money_receipt') &&
          Boolean((t as any).isAdvance || t.category === 'Customer Advance') &&
          t.entityId === matchedCustomer.id &&
          Boolean(t.paymentAccountId)
      );
      if (advTx?.paymentAccountId) preferredAccountId = advTx.paymentAccountId;
    }
    const preferredAccount = preferredAccountId
      ? paymentAccounts.find(a => a.id === preferredAccountId)
      : undefined;

    return {
      cleanWO,
      cleanProj,
      hasScope,
      matchedScope,
      matchedCustomer,
      scopedFinancials,
      overallCustomerPos,
      preferredAccount,
    };
  }, [
    purchaseForm.workOrderNumber,
    purchaseForm.projectName,
    purchaseForm.customerId,
    purchaseForm.id,
    discoveredScopes,
    customers,
    purchaseHistory,
    transactions,
    orders,
    paymentAccounts,
  ]);

  // Bill total computed

  // Merged categories: saved + product-derived (deduplicated)
  const productCategories = Array.from(new Set([
    ...savedCategories,
    ...products.map(p => p.category).filter(Boolean),
  ])).sort();

  // Filter products for the catalog
  const filteredCatalogProducts = products.filter(product => {
    if (pickForm.category && product.category !== pickForm.category) return false;
    if (pickForm.name.trim()) {
      const q = pickForm.name.toLowerCase();
      const matchesName = product.name.toLowerCase().includes(q) || (product.model || '').toLowerCase().includes(q);
      const matchesCat = (product.category || '').toLowerCase().includes(q);
      const matchesBrand = (product.brand || '').toLowerCase().includes(q);
      if (!matchesName && !matchesCat && !matchesBrand) return false;
    }
    return true;
  });

  const addItemToPurchase = (product: Product) => {
    setPurchaseForm(prev => {
      const existing = prev.items.find(i => i.id === product.id);
      if (existing) {
        return {
          ...prev,
          items: prev.items.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i),
        };
      }
      return {
        ...prev,
        items: [
          ...prev.items,
          {
            id: product.id,
            name: product.name,
            category: product.category || 'General',
            images: product.images || [],
            purchasePrice: Number(product.costPrice) || Number(product.price) * 0.8 || 0,
            salesPrice: Number(product.price) || 0,
            quantity: 1,
            hasWarranty: Boolean(product.warrantyMonths && product.warrantyMonths > 0),
            warrantyUnit: product.warrantyUnit || 'years',
            warrantyValue: product.warrantyMonths ? monthsToWarrantyValue(product.warrantyMonths, (product.warrantyUnit || 'years') as WarrantyUnit) : 1,
            hasSerialTracking: Boolean(product.hasSerialTracking),
              sku: product.sku || '',
            newSerials: '',
          },
        ],
      };
    });
    toast.success(`Added ${product.name} to purchase list`);
  };

  const updateItem = (productId: string, field: keyof PurchaseItem, value: any) => {
    setPurchaseForm(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === productId ? { ...i, [field]: value } : i),
    }));
  };

  const removeItem = (productId: string) => {
    setPurchaseForm(prev => ({
      ...prev,
      items: prev.items.filter(i => i.id !== productId),
    }));
  };

  const getLastPurchaseInfo = (productId?: string, productName?: string) => {
    if (!productId && !productName) return null;
    for (const pur of purchaseHistory) {
      const foundItem = pur.items?.find(i => 
        (productId && i.id === productId) || 
        (productName && i.name?.toLowerCase().trim() === productName.toLowerCase().trim())
      );
      if (foundItem) {
        return {
          price: Number(foundItem.purchasePrice) || 0,
          date: pur.date || pur.createdAt,
          vendorName: pur.vendorName,
          documentNumber: pur.documentNumber
        };
      }
    }
    const prod = products.find(p => 
      (productId && p.id === productId) || 
      (productName && p.name?.toLowerCase().trim() === productName.toLowerCase().trim())
    );
    if (prod && Number(prod.costPrice) > 0) {
      return {
        price: Number(prod.costPrice),
        date: prod.createdAt || '',
        vendorName: '',
        documentNumber: ''
      };
    }
    return null;
  };

  const handleBillFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB!');
      return;
    }
    try {
      setUploadingAttachment(true);
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storageRef = ref(storage, `purchases/bills/${Date.now()}_${safeName}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      setPurchaseForm(prev => ({ ...prev, attachmentUrl: downloadUrl }));
      toast.success('Vendor bill/memo copy uploaded successfully!');
    } catch (err) {
      console.error('Bill upload failed:', err);
      toast.error('Failed to upload memo! Please try again.');
    } finally {
      setUploadingAttachment(false);
      e.target.value = '';
    }
  };

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!purchaseForm.vendorId) {
      toast.error('Please select a supplier/vendor');
      return;
    }

    if (purchaseForm.items.length === 0) {
      toast.error('Please add at least one product to the purchase');
      return;
    }

    // 1. Zero and Negative Value Blocking
    for (const item of purchaseForm.items) {
      const qty = Number(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        toast.error(`"${item.name}": Product quantity must be greater than 0!`);
        return;
      }
      const cost = Number(item.purchasePrice);
      if (isNaN(cost) || cost <= 0) {
        toast.error(`"${item.name}": Purchase cost price must be greater than 0!`);
        return;
      }
      if (item.salesPrice !== undefined && Number(item.salesPrice) < 0) {
        toast.error(`"${item.name}": Sales price cannot be negative!`);
        return;
      }
    }
    if (Number(purchaseForm.shippingCost) < 0) {
      toast.error('Shipping cost cannot be negative!');
      return;
    }
    if (Number(purchaseForm.discountAmount) < 0) {
      toast.error('Discount cannot be negative!');
      return;
    }
    if (Number(purchaseForm.discountAmount) > itemsSubtotal) {
      toast.error('Discount cannot exceed items subtotal!');
      return;
    }

    // 2. Cost Price vs Sales Price (Margin validation)
    for (const item of purchaseForm.items) {
      const cost = Number(item.purchasePrice) || 0;
      const sale = Number(item.salesPrice) || 0;
      if (sale > 0 && cost > sale) {
        toast.error(`"${item.name}": Purchase cost (${formatCurrency(cost, settings)}) cannot exceed sales price (${formatCurrency(sale, settings)})!`);
        return;
      }
    }

    // 3. Serial Number & Quantity Match
    for (const item of purchaseForm.items) {
      if (item.hasSerialTracking || (Array.isArray(item.newSerials) && item.newSerials.length > 0)) {
        const serials = Array.isArray(item.newSerials)
          ? item.newSerials.filter((s: string) => s && s.trim())
          : String(item.newSerials || '').split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        const qty = Number(item.quantity) || 0;
        if (serials.length !== qty) {
          toast.error(`"${item.name}": Quantity (${qty}) does not match scanned serials count (${serials.length})!`);
          return;
        }
      }
    }

    // 4. Duplicate Serial Number Check
    const seenSerials = new Set<string>();
    for (const item of purchaseForm.items) {
      if (item.hasSerialTracking || (Array.isArray(item.newSerials) && item.newSerials.length > 0)) {
        const serials = Array.isArray(item.newSerials)
          ? item.newSerials.filter((s: string) => s && s.trim())
          : String(item.newSerials || '').split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        
        for (const s of serials) {
          const lowerS = s.toLowerCase();
          // Check duplicate within the same purchase
          if (seenSerials.has(lowerS)) {
            toast.error(`Duplicate serial number found: "${s}"! Cannot use duplicate serials in the same purchase.`);
            return;
          }
          seenSerials.add(lowerS);

          // Check duplicate across existing products in database
          const existingProd = products.find(p => 
            p.id !== item.id && 
            Array.isArray(p.availableSerials) && 
            p.availableSerials.some((existingS: string) => existingS.trim().toLowerCase() === lowerS)
          );
          if (existingProd) {
            toast.error(`Serial number "${s}" already exists for product "${existingProd.name}" in database!`);
            return;
          }
        }
      }
    }

    // 5. Vendor Memo / Challan Duplication Check
    if (purchaseForm.reference && purchaseForm.reference.trim()) {
      const trimmedRef = purchaseForm.reference.trim().toLowerCase();
      const duplicateChallan = purchaseHistory.find(p => 
        p.id !== purchaseForm.id && 
        p.vendorId === purchaseForm.vendorId && 
        p.reference && 
        p.reference.trim().toLowerCase() === trimmedRef
      );
      if (duplicateChallan) {
        toast.error(`Challan/Memo reference "${purchaseForm.reference}" already exists for this supplier (Date: ${new Date(duplicateChallan.date).toLocaleDateString()})!`);
        return;
      }
    }

    // 6. Paid Amount Limit
    const paid = Number(purchaseForm.paidAmount) || 0;
    if (paid < 0) {
      toast.error('Paid amount cannot be negative!');
      return;
    }
    if (paid > billTotal) {
      toast.error(`Paid amount (${formatCurrency(paid, settings)}) cannot exceed total bill (${formatCurrency(billTotal, settings)})!`);
      return;
    }
    if (paid > 0) {
      if (!purchaseForm.paymentAccountId) {
        toast.error('Please select a payment account to disburse funds from!');
        return;
      }
      const selectedAcc = paymentAccounts.find(a => a.id === purchaseForm.paymentAccountId);
      if (purchaseForm.isChequePayment) {
        if (!purchaseForm.chequeNumber || !purchaseForm.chequeNumber.trim()) {
          toast.error('Please enter the Cheque Number!');
          return;
        }
      } else {
        const validation = validateSufficientBalance(selectedAcc, transactions, paid);
        if (!validation.valid) {
          toast.error(validation.error || 'Insufficient account balance!');
          return;
        }
      }
    }

    try {
      setSubmitting(true);
      
      let finalDocNumber = purchaseForm.documentNumber || '';
      let finalCreatedAt = new Date().toISOString();

      const batch = writeBatch(db);

      if (purchaseForm.id) {
         // REVERT OLD PURCHASE
         const oldPur = purchaseHistory.find((p: any) => p.id === purchaseForm.id);
         if (oldPur) {
            finalDocNumber = oldPur.documentNumber || finalDocNumber;
            finalCreatedAt = oldPur.createdAt || finalCreatedAt;
            for (const item of (oldPur.items || [])) {
                const prodRef = doc(db, 'products', item.id);
                const pData = products.find((p: any) => p.id === item.id);
                if (pData) {
                    const qtyToRevert = Number(item.quantity) || 0;
                    const revertedStock = Math.max(0, (Number(pData.stock) || 0) - qtyToRevert);
                    batch.update(prodRef, { stock: increment(-qtyToRevert) });
                    // IMPORTANT: Update local state so the adding logic later uses the reverted stock!
                    pData.stock = revertedStock;
                }
            }
         }
         // Delete old transactions (both by referenceId and documentNumber)
         const txToDelete = new Map<string, any>();
         const snap1 = await getDocs(query(collection(db, 'transactions'), where('referenceId', '==', purchaseForm.id)));
         snap1.docs.forEach(d => txToDelete.set(d.id, d.ref));
         if (purchaseForm.documentNumber) {
           const snap2 = await getDocs(query(collection(db, 'transactions'), where('documentNumber', '==', purchaseForm.documentNumber)));
           snap2.docs.forEach(d => txToDelete.set(d.id, d.ref));
           const snap3 = await getDocs(query(collection(db, 'transactions'), where('referenceId', '==', purchaseForm.documentNumber)));
           snap3.docs.forEach(d => txToDelete.set(d.id, d.ref));
         }
         txToDelete.forEach(ref => batch.delete(ref));
         // We will overwrite the purchase doc using batch.set later
      } else {
         finalDocNumber = await generateDocumentNumber('PUR');
      }
      const docNumber = finalDocNumber;
      const createdAt = finalCreatedAt;
      const paid = Math.min(billTotal, Math.max(0, Number(purchaseForm.paidAmount) || 0));
      const paymentStatus: 'paid' | 'partial' | 'unpaid' =
        paid >= billTotal ? 'paid' : (paid > 0 ? 'partial' : 'unpaid');

      // 1. Prepare Product Inventory & Stock & Cost Price
      const updatedItems = [...purchaseForm.items];
      
      const totalQuantity = updatedItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      const totalShippingCost = Number(purchaseForm.shippingCost) || 0;
      const totalDiscount = Number(purchaseForm.discountAmount) || 0;
      const netPerUnitAdjustment = totalQuantity > 0 ? (totalShippingCost - totalDiscount) / totalQuantity : 0;
      
      // Map to hold newly created/updated products within this transaction
      const localProductsMap = new Map<string, any>();

      for (let i = 0; i < updatedItems.length; i++) {
        const item = updatedItems[i];
        
        const effectivePurchasePrice = Math.max(0, Number(item.purchasePrice) + netPerUnitAdjustment);
        updatedItems[i].purchasePrice = effectivePurchasePrice;
        
        let currentProduct = localProductsMap.get(item.id) || products.find(p => p.id === item.id);

        if (!currentProduct && item.id.startsWith('NEW_')) {
           currentProduct = Array.from(localProductsMap.values()).find(p => 
              p.name.toLowerCase() === item.name.toLowerCase() &&
              (p.category || '').toLowerCase() === (item.category || '').toLowerCase() &&
              (p.brand || '').toLowerCase() === (item.brand || '').toLowerCase()
           ) || products.find(p => 
              p.name.toLowerCase() === item.name.toLowerCase() &&
              (p.category || '').toLowerCase() === (item.category || '').toLowerCase() &&
              (p.brand || '').toLowerCase() === (item.brand || '').toLowerCase()
           );
        }

        if (currentProduct) {
          const oldStock = Number(currentProduct.stock) || 0;
          const oldCost = Number(currentProduct.costPrice) || 0;
          const newStock = Number(item.quantity) || 0;
          const newCost = effectivePurchasePrice;
          
          const totalStock = oldStock + newStock;
          const averageCostPrice = totalStock > 0 
            ? ((oldStock * oldCost) + (newStock * newCost)) / totalStock 
            : newCost;

          const productRef = doc(db, 'products', currentProduct.id);
          const updates: any = {
            stock: totalStock,
            costPrice: averageCostPrice,
          };

          if (item.variantName) {
             let existingVariants = currentProduct.variants || [];
             const vIndex = existingVariants.findIndex((v: any) => v.name.toLowerCase() === item.variantName?.toLowerCase() || (item.sku && v.sku === item.sku));
             if (vIndex > -1) {
               existingVariants[vIndex].stock = (Number(existingVariants[vIndex].stock) || 0) + Number(item.quantity);
               if (item.salesPrice) existingVariants[vIndex].price = Number(item.salesPrice);
             } else {
               existingVariants.push({
                 id: crypto.randomUUID(),
                 name: item.variantName,
                 sku: item.sku || '',
                 price: Number(item.salesPrice) || 0,
                 stock: Number(item.quantity) || 0
               });
             }
             updates.variants = existingVariants;
             currentProduct.variants = existingVariants;
          } else {
             if (item.salesPrice) updates.price = Number(item.salesPrice);
             if (item.sku) updates.sku = item.sku;
          }

          if (item.hasWarranty && itemWarrantyMonths(item) > 0) {
            updates.warrantyMonths = itemWarrantyMonths(item);
            updates.warrantyUnit = item.warrantyUnit || 'years';
          }

          if ((currentProduct.hasSerialTracking || item.hasSerialTracking || (Array.isArray(item.newSerials) && item.newSerials.length > 0)) && item.newSerials) {
            const addedSerials = Array.isArray(item.newSerials)
              ? item.newSerials.filter((s: string) => s.trim())
              : String(item.newSerials)
                  .split(/[\n,]/)
                  .map((s: string) => s.trim())
                  .filter((s: string) => s);

            updates.hasSerialTracking = true;
            updates.availableSerials = [...(currentProduct.availableSerials || []), ...addedSerials];
            if (!updates.sku && addedSerials[0]) updates.sku = addedSerials[0];
          }

          const { publicData, privateCostData } = sanitizePublicProductData(updates, true);
          batch.update(productRef, publicData);
          addProductPrivateCostToBatch(batch, currentProduct.id, privateCostData);
          
          currentProduct.stock = totalStock;
          currentProduct.costPrice = averageCostPrice;
          localProductsMap.set(currentProduct.id, currentProduct);
          updatedItems[i].id = currentProduct.id;

        } else {
          // Completely new product
          const addedSerials = Array.isArray(item.newSerials)
             ? item.newSerials.filter((s: string) => s.trim())
             : String(item.newSerials || '')
                 .split(/[\n,]/)
                 .map((s: string) => s.trim())
                 .filter((s: string) => s);
                 
          const newProductData: any = {
             name: item.name,
             category: item.category || 'General',
             subCategory: item.subCategory || '',
             brand: item.brand || '',
             description: item.name,
             images: [],
             sku: item.variantName ? '' : (item.sku || ''),
             costPrice: Number(item.purchasePrice) || 0,
             price: Number(item.salesPrice) || 0,
             stock: Number(item.quantity) || 0,
             hasWarranty: Boolean(item.hasWarranty),
             warrantyMonths: item.hasWarranty ? itemWarrantyMonths(item) : 0,
             warrantyUnit: item.warrantyUnit || 'years',
             hasSerialTracking: Boolean(item.hasSerialTracking || (addedSerials && addedSerials.length > 0)),
             availableSerials: addedSerials,
             createdAt: new Date().toISOString()
          };

          if (item.variantName) {
             newProductData.variants = [{
                id: crypto.randomUUID(),
                name: item.variantName,
                sku: item.sku || '',
                price: Number(item.salesPrice) || 0,
                stock: Number(item.quantity) || 0
             }];
          }
          
          const docRef = doc(collection(db, 'products'));
          const { publicData, privateCostData } = sanitizePublicProductData(newProductData, false);
          batch.set(docRef, publicData);
          addProductPrivateCostToBatch(batch, docRef.id, privateCostData);
          newProductData.id = docRef.id;
          localProductsMap.set(docRef.id, newProductData);
          updatedItems[i].id = docRef.id;
        }
      }

      // 2. Save Purchase Record to Firestore `purchases`
      const selectedAcc = paymentAccounts.find(a => a.id === purchaseForm.paymentAccountId);
      
      const sanitizedItems = updatedItems.map(item => {
        const clean: any = {};
        for (const [k, v] of Object.entries(item)) {
          if (v !== undefined) clean[k] = v;
        }
        return clean;
      });

      const cleanWo = (purchaseForm.workOrderNumber || '').trim().replace(/^#+/, '').trim();
      const cleanProj = (purchaseForm.projectName || '').trim();
      const linkedCustomerId =
        purchaseForm.customerId || activePurchaseContext.matchedCustomer?.id || '';
      const linkedCustomerName =
        purchaseForm.customerName ||
        activePurchaseContext.matchedCustomer?.name ||
        '';
      const scopeTagParts = [cleanWo ? `WO: #${cleanWo}` : '', cleanProj ? `Project: ${cleanProj}` : ''].filter(Boolean);
      const scopeSuffix = scopeTagParts.length > 0 ? ` [${scopeTagParts.join(' | ')}]` : '';

      const purchaseRecord: Record<string, any> = {
        documentNumber: docNumber,
        vendorId: purchaseForm.vendorId || '',
        vendorName: purchaseForm.vendorName || '',
        date: new Date(purchaseForm.date).toISOString(),
        items: sanitizedItems,
        subtotal: itemsSubtotal,
        discountAmount: totalDiscount,
        total: billTotal,
        shippingCost: totalShippingCost,
        paidAmount: purchaseForm.isChequePayment ? 0 : paid,
        paymentStatus: purchaseForm.isChequePayment ? 'due' : paymentStatus,
        isChequePayment: Boolean(purchaseForm.isChequePayment),
        chequeNumber: purchaseForm.chequeNumber || '',
        chequeClearingDate: purchaseForm.chequeClearingDate || '',
        ...(purchaseForm.isChequePayment ? { chequeStatus: 'pending' } : {}),
        paymentAccountId: selectedAcc?.id || '',
        paymentMethod: purchaseForm.isChequePayment ? 'Bank Cheque (PDC)' : (selectedAcc?.type || selectedAcc?.name || purchaseForm.paymentMethod || 'cash'),
        reference: purchaseForm.reference || '',
        workOrderNumber: cleanWo,
        projectName: cleanProj,
        branchName: cleanProj,
        customerId: linkedCustomerId,
        customerName: linkedCustomerName,
        attachmentUrl: purchaseForm.attachmentUrl || '',
        notes: purchaseForm.notes || '',
        createdAt,
        createdBy: purchaseForm.createdBy || 'Admin',
      };

      const purchaseDocRef = purchaseForm.id ? doc(db, 'purchases', purchaseForm.id) : doc(collection(db, 'purchases'));
      batch.set(purchaseDocRef, purchaseRecord);

      // 3. Record Outflow in Firestore `transactions`
      // Always record the full purchase amount to update the vendor ledger (Payable)
      const purchaseTxRef = doc(collection(db, 'transactions'));
      batch.set(purchaseTxRef, {
        type: 'purchase',
        amount: billTotal,
        date: new Date(purchaseForm.date).toISOString(),
        description: `Purchase from ${purchaseForm.vendorName} (#${docNumber})${scopeSuffix}`,
        entityId: purchaseForm.vendorId,
        entityName: purchaseForm.vendorName,
        entityType: 'vendor',
        referenceId: purchaseDocRef.id,
        documentNumber: docNumber,
        workOrderNumber: cleanWo,
        projectName: cleanProj,
        branchName: cleanProj,
        linkedCustomerId,
        linkedCustomerName,
        paymentAccountId: '', // No payment for the purchase itself
        paymentMethod: '',
        createdAt,
        createdBy: purchaseForm.createdBy || 'Admin',
      });

      // If any amount was paid, record the payment transaction
      if (paid > 0 && !purchaseForm.isChequePayment) {
        const payTxRef = doc(collection(db, 'transactions'));
        batch.set(payTxRef, {
          type: 'payment_made',
          amount: paid,
          date: new Date(purchaseForm.date).toISOString(),
          description: `Payment for Purchase #${docNumber}${scopeSuffix}`,
          entityId: purchaseForm.vendorId,
          entityName: purchaseForm.vendorName,
          entityType: 'vendor',
          referenceId: purchaseDocRef.id,
          documentNumber: docNumber,
          workOrderNumber: cleanWo,
          projectName: cleanProj,
          branchName: cleanProj,
          linkedCustomerId,
          linkedCustomerName,
          paymentAccountId: selectedAcc?.id || '',
          paymentMethod: selectedAcc?.type || selectedAcc?.name || purchaseForm.paymentMethod || 'cash',
          createdAt: new Date().toISOString(),
        });
      }

      // ATOMICALLY COMMIT ALL DATABASE OPERATIONS
      await batch.commit();

      // If cheque payment, issue cheque after successful batch commit
      if (paid > 0 && purchaseForm.isChequePayment) {
        await issueCheque({
          chequeNumber: purchaseForm.chequeNumber || `CK-${Date.now().toString().slice(-6)}`,
          amount: paid,
          bankAccountId: selectedAcc?.id || '',
          bankAccountName: selectedAcc?.name || 'Bank',
          bankName: (selectedAcc as any)?.bankName || selectedAcc?.name || 'Bank',
          vendorId: purchaseForm.vendorId,
          vendorName: purchaseForm.vendorName,
          payeeName: purchaseForm.vendorName,
          issueDate: purchaseForm.date,
          clearingDate: purchaseForm.chequeClearingDate || purchaseForm.date,
          purchaseId: purchaseDocRef.id,
          purchaseNumber: docNumber,
          notes: purchaseForm.notes,
          user: purchaseForm.createdBy || 'Admin',
        });
      }

      toast.success(`Purchase #${docNumber} recorded & inventory restocked successfully!`);

      // Log purchase to Audit Trail
      const isPurchaseEdit = Boolean(purchaseForm.id);
      const oldPurchaseRecord = isPurchaseEdit ? purchaseHistory.find((p: any) => p.id === purchaseForm.id) : null;
      await logAudit(
        isPurchaseEdit ? 'EDIT' : 'CREATE',
        'Purchase',
        `${isPurchaseEdit ? 'Updated' : 'Recorded'} Purchase #${docNumber} from ${purchaseForm.vendorName} (Total: ৳${billTotal}, Paid: ৳${paid}, Items: ${purchaseForm.items.length})`,
        purchaseForm.createdBy || profile?.displayName || profile?.email || 'Admin',
        {
          entityId: purchaseDocRef.id,
          previousState: oldPurchaseRecord ? {
            documentNumber: oldPurchaseRecord.documentNumber || docNumber,
            vendorName: oldPurchaseRecord.vendorName,
            total: oldPurchaseRecord.total,
            paidAmount: oldPurchaseRecord.paidAmount,
            dueAmount: oldPurchaseRecord.dueAmount,
            items: oldPurchaseRecord.items
          } : null,
          newState: {
            documentNumber: docNumber,
            vendorName: purchaseForm.vendorName,
            total: billTotal,
            paidAmount: paid,
            dueAmount: Math.max(0, billTotal - paid),
            items: purchaseForm.items,
            paymentMethod: purchaseForm.paymentMethod,
            createdBy: purchaseForm.createdBy
          }
        }
      );

      // Reset form
      setIsCreatingPurchase(false);
      localStorage.removeItem('draft_purchase_form');
      setPurchaseForm({
        id: undefined,
        documentNumber: undefined,
        vendorId: '',
        vendorName: '',
        date: new Date().toISOString().split('T')[0],
        reference: '',
        workOrderNumber: '',
        projectName: '',
        customerId: '',
        customerName: '',
        items: [],
        paymentAccountId: '',
        paymentMethod: '',
        paidAmount: 0,
        shippingCost: 0,
        attachmentUrl: '',
        notes: '',
        createdBy: '',
      });

      loadData();
      fetchData();
    } catch (error: any) {
      console.error('Error recording purchase:', error);
      toast.error(error?.message || 'Failed to record purchase');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter Purchase History
  const filteredPurchases = purchaseHistory.filter(pur => {
    const pDate = new Date(pur.date || pur.createdAt).toISOString().split('T')[0];
    const matchesDate = pDate >= startDate && pDate <= endDate;
    if (!matchesDate) return false;

    if (vendorFilter !== 'all' && pur.vendorId !== vendorFilter) return false;

    if (workOrderFilter !== 'all') {
      const target = workOrderFilter.toLowerCase();
      const purKey = pur.workOrderNumber
        ? `wo:${pur.workOrderNumber.trim().replace(/^#+/, '').toLowerCase()}`
        : (pur.projectName || pur.branchName)
        ? `proj:${(pur.projectName || pur.branchName || '').trim().toLowerCase()}`
        : '';
      if (purKey !== target) return false;
    }

    if (searchHistory.trim()) {
      const q = searchHistory.toLowerCase();
      const matchesDoc = (pur.documentNumber || '').toLowerCase().includes(q);
      const matchesVen = (pur.vendorName || '').toLowerCase().includes(q);
      const matchesRef = (pur.reference || '').toLowerCase().includes(q);
      const matchesWO = (pur.workOrderNumber || '').toLowerCase().includes(q);
      const matchesProj = (pur.projectName || pur.branchName || '').toLowerCase().includes(q);
      const matchesCust = (pur.customerName || '').toLowerCase().includes(q);
      if (!matchesDoc && !matchesVen && !matchesRef && !matchesWO && !matchesProj && !matchesCust) return false;
    }

    return true;
  });

  const totalPurchasesAmount = filteredPurchases.reduce((sum, p) => sum + (p.total || 0), 0);
  const totalPaidOutflow = filteredPurchases.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  const totalOutstandingPayable = Math.max(0, totalPurchasesAmount - totalPaidOutflow);

  // Export CSV
  const exportToCSV = () => {
    if (filteredPurchases.length === 0) {
      toast.error('No purchases to export');
      return;
    }

    const headers = ['Purchase #', 'Date', 'Supplier / Vendor', 'Items Qty', 'Total Bill (৳)', 'Paid (৳)', 'Due (৳)', 'Payment Status', 'Reference'];
    const rows = filteredPurchases.map(p => {
      const totalQty = p.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0;
      const due = Math.max(0, (p.total || 0) - (p.paidAmount || 0));
      return [
        `"${p.documentNumber}"`,
        new Date(p.date || p.createdAt).toLocaleDateString(),
        `"${p.vendorName}"`,
        totalQty,
        p.total,
        p.paidAmount,
        due,
        p.paymentStatus.toUpperCase(),
        `"${p.reference || ''}"`,
      ];
    });

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Purchase_Report_${startDate}_to_${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Export PDF
  const exportToPDF = () => {
    if (filteredPurchases.length === 0) {
      toast.error('No purchases to export');
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(settings?.siteName || 'Click2IT', 14, 18);
    doc.setFontSize(11);
    doc.text('Product Purchases & Supplier Invoices Report', 14, 25);
    doc.setFontSize(9);
    doc.text(
      `Period: ${startDate} to ${endDate} | Total Purchases: ${formatCurrency(totalPurchasesAmount, settings)} | Total Paid: ${formatCurrency(totalPaidOutflow, settings)}`,
      14,
      31
    );

    const body = filteredPurchases.map(p => [
      p.documentNumber || '-',
      new Date(p.date || p.createdAt).toLocaleDateString(),
      p.vendorName || '-',
      p.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0,
      formatCurrency(p.total, settings),
      formatCurrency(p.paidAmount, settings),
      formatCurrency(Math.max(0, p.total - p.paidAmount), settings),
      p.paymentStatus.toUpperCase(),
        p.createdBy || 'Admin',
      ]);

    autoTable(doc, {
      startY: 36,
      head: [['Purchase #', 'Date', 'Supplier', 'Items', 'Total Bill', 'Paid', 'Due', 'Status', 'Prepared By']],
      body: body,
      theme: 'striped',
      headStyles: { fillColor: [8, 22, 33] },
      styles: { fontSize: 7 },
    });

    doc.save(`Purchase_Report_${startDate}_to_${endDate}.pdf`);
  };

  const resetPurchaseForm = () => {
    setPurchaseForm({
      id: undefined,
      documentNumber: undefined,
      vendorId: '',
      vendorName: '',
      date: new Date().toISOString().split('T')[0],
      reference: '',
      workOrderNumber: '',
      projectName: '',
      customerId: '',
      customerName: '',
      items: [],
      paymentAccountId: '',
      paymentMethod: '',
      paidAmount: 0,
      isChequePayment: false,
      chequeNumber: '',
      chequeClearingDate: new Date().toISOString().split('T')[0],
      discountAmount: 0,
      shippingCost: 0,
      attachmentUrl: '',
      notes: '',
      createdBy: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* ── TOP ACTION & SUMMARY BAR ── */}
      <div className="bg-gradient-to-r from-slate-900 to-[#081621] rounded-2xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-800 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-black uppercase tracking-widest mb-3">
              <ShoppingBag size={12} className="text-blue-400" /> Inventory Procurement
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
              Product Purchases & Restocking
            </h2>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl">
              Procure inventory stock from suppliers, update cost prices, register serial numbers, and track vendor bills.
            </p>
          </div>

          <div className="flex bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50 backdrop-blur-sm shrink-0 flex-wrap gap-1.5">
            <button
              onClick={exportToCSV}
              className="px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 bg-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-600 border border-slate-600/50"
            >
              <Download size={14} /> CSV
            </button>
            <button
              onClick={exportToPDF}
              className="px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 bg-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-600 border border-slate-600/50"
            >
              <Printer size={14} /> PDF
            </button>
            <button
              onClick={() => {
                if (isCreatingPurchase) {
                  setIsCreatingPurchase(false);
                  resetPurchaseForm();
                } else {
                  resetPurchaseForm();
                  setIsCreatingPurchase(true);
                }
              }}
              className={cn(
                "px-5 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 shadow-md border",
                isCreatingPurchase 
                  ? "bg-red-500 hover:bg-red-600 text-white border-red-500" 
                  : "bg-white hover:bg-blue-50 text-slate-900 border-white"
              )}
            >
              {isCreatingPurchase ? <X size={16} /> : <Plus size={16} />}
              {isCreatingPurchase ? (purchaseForm.id ? 'Cancel Edit' : 'Close Purchase Form') : 'New Product Purchase'}
            </button>
          </div>
        </div>
      </div>

      {/* ── NEW PURCHASE CREATION WORKFLOW ── */}
      {isCreatingPurchase && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: PURCHASE ORDER BILL FORM (7 COLS) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                  <Boxes className="text-[#EF4444]" /> {purchaseForm.id ? `Edit Purchase Voucher #${purchaseForm.documentNumber || ''}` : 'Purchase Voucher & Supplier Bill'}
                </h3>
                <div className="flex items-center gap-4">
                  <button 
                    type="button"
                    onClick={() => {
                      if(window.confirm('Clear all drafted data?')) {
                        localStorage.removeItem('draft_purchase_form');
                        resetPurchaseForm();
                      }
                    }}
                    className="text-xs text-red-500 hover:text-red-700 font-bold"
                  >
                    Clear Draft
                  </button>
                  <span className="text-xs text-gray-400">{purchaseForm.id ? 'Updates Inventory on Save' : 'Restocks Inventory on Save'}</span>
                </div>
              </div>

              <form onSubmit={handleSavePurchase} className="space-y-6 text-xs">
                {/* Vendor, Date & Reference */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">
                      Prepared By (Staff)
                    </label>
                    <PreparedBySelect
                      value={purchaseForm.createdBy || ''}
                      onChange={val => setPurchaseForm(prev => ({ ...prev, createdBy: val }))}
                      users={users}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">
                      Supplier / Vendor <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={purchaseForm.vendorId}
                      onChange={e => {
                        const ven = vendors.find(v => v.id === e.target.value);
                        setPurchaseForm({
                          ...purchaseForm,
                          vendorId: e.target.value,
                          vendorName: ven?.name || '',
                        });
                      }}
                      className="w-full h-[42px] border border-gray-200 rounded-lg px-3 font-bold text-gray-900"
                    >
                      <option value="">-- Select Vendor --</option>
                      {vendors.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.category || 'General'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Purchase Date</label>
                    <input
                      type="date"
                      value={purchaseForm.date}
                      onChange={e => setPurchaseForm({ ...purchaseForm, date: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg p-2.5 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Supplier Challan / Bill #</label>
                    <input
                      type="text"
                      placeholder="e.g. CH-9941"
                      value={purchaseForm.reference}
                      onChange={e => setPurchaseForm({ ...purchaseForm, reference: e.target.value })}
                      className={cn(
                        "w-full border rounded-lg p-2.5 font-medium",
                        purchaseForm.vendorId && purchaseForm.reference && purchaseHistory.some(p => p.id !== purchaseForm.id && p.vendorId === purchaseForm.vendorId && p.reference?.trim().toLowerCase() === purchaseForm.reference.trim().toLowerCase())
                          ? "border-amber-400 bg-amber-50/50"
                          : "border-gray-200"
                      )}
                    />
                    {purchaseForm.vendorId && purchaseForm.reference && purchaseHistory.some(p => p.id !== purchaseForm.id && p.vendorId === purchaseForm.vendorId && p.reference?.trim().toLowerCase() === purchaseForm.reference.trim().toLowerCase()) && (
                      <p className="text-[11px] text-amber-700 font-bold mt-1 flex items-center gap-1">
                        <AlertCircle size={12} className="shrink-0" /> Challan/Memo reference already recorded for this vendor!
                      </p>
                    )}
                  </div>

                  {/* Project / Work Order Allocation */}
                  <div className="md:col-span-2 bg-indigo-50/50 border border-indigo-200/80 rounded-xl p-3.5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                        <FolderKanban size={13} className="text-indigo-600" />
                        Work Order / Project & Customer Advance Link (Optional)
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAdvanceModal(true)}
                        className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Wallet size={11} /> + Receive Customer Advance
                      </button>
                    </div>

                    {/* Quick-Pick Pills for Active Advances / Work Orders */}
                    {(quickPickScopes.length > 0 || customersWithAdvance.length > 0) && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500 mr-1">Quick Pick:</span>
                        {quickPickScopes.slice(0, 5).map(scope => {
                          const isSelected =
                            (scope.workOrderNumber &&
                              activePurchaseContext.cleanWO.toLowerCase() === scope.workOrderNumber.trim().toLowerCase()) ||
                            (!scope.workOrderNumber &&
                              scope.projectName &&
                              activePurchaseContext.cleanProj.toLowerCase() === scope.projectName.trim().toLowerCase());
                          const prefAcc = scope.preferredPaymentAccountId
                            ? paymentAccounts.find(a => a.id === scope.preferredPaymentAccountId)
                            : undefined;
                          const hasExplicitAdv = scope.financials.explicitRemainingAdvance > 0;
                          return (
                            <button
                              key={scope.key}
                              type="button"
                              onClick={() => {
                                setPurchaseForm(prev => ({
                                  ...prev,
                                  workOrderNumber: scope.workOrderNumber || '',
                                  projectName: scope.projectName || scope.clientName || scope.title || prev.projectName,
                                  customerId: scope.customerId || prev.customerId || '',
                                  customerName: scope.clientName || prev.customerName || '',
                                  ...(!prev.paymentAccountId && prefAcc
                                    ? {
                                        paymentAccountId: prefAcc.id,
                                        paymentMethod: prefAcc.type || 'cash',
                                      }
                                    : {}),
                                }));
                              }}
                              className={cn(
                                "px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1",
                                isSelected
                                  ? "bg-indigo-600 text-white border-indigo-700 shadow-xs"
                                  : hasExplicitAdv
                                  ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200"
                                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                              )}
                            >
                              <span className="font-mono">
                                {scope.workOrderNumber ? `#${scope.workOrderNumber}` : scope.projectName}
                              </span>
                              {scope.clientName && (
                                <span className={isSelected ? "text-indigo-100" : "text-slate-500"}>
                                  · {scope.clientName}
                                </span>
                              )}
                              {hasExplicitAdv && (
                                <span className={cn(
                                  "px-1 py-0.2 rounded font-black",
                                  isSelected ? "bg-emerald-400/30 text-white" : "bg-emerald-100 text-emerald-800"
                                )}>
                                  Adv {formatCurrency(scope.financials.explicitRemainingAdvance, settings)}
                                </span>
                              )}
                            </button>
                          );
                        })}
                        {customersWithAdvance
                          .filter(
                            cEntry =>
                              !quickPickScopes.slice(0, 5).some(s => s.customerId === cEntry.customer.id)
                          )
                          .slice(0, 3)
                          .map(({ customer, pos }) => {
                            const isSelected = purchaseForm.customerId === customer.id;
                            const advTx = transactions.find(
                              t =>
                                (t.type === 'payment_received' || t.type === 'money_receipt') &&
                                Boolean((t as any).isAdvance || t.category === 'Customer Advance') &&
                                t.entityId === customer.id &&
                                Boolean(t.paymentAccountId)
                            );
                            const prefAcc = advTx?.paymentAccountId
                              ? paymentAccounts.find(a => a.id === advTx.paymentAccountId)
                              : undefined;
                            return (
                              <button
                                key={`adv-${customer.id}`}
                                type="button"
                                onClick={() => {
                                  setPurchaseForm(prev => ({
                                    ...prev,
                                    customerId: customer.id,
                                    customerName: customer.name,
                                    workOrderNumber: prev.workOrderNumber || String((advTx as any)?.workOrderNumber || ''),
                                    projectName:
                                      prev.projectName ||
                                      String((advTx as any)?.projectName || (advTx as any)?.branchName || customer.branchName || customer.name),
                                    ...(!prev.paymentAccountId && prefAcc
                                      ? {
                                          paymentAccountId: prefAcc.id,
                                          paymentMethod: prefAcc.type || 'cash',
                                        }
                                      : {}),
                                  }));
                                }}
                                className={cn(
                                  "px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1",
                                  isSelected
                                    ? "bg-teal-600 text-white border-teal-700 shadow-xs"
                                    : "bg-teal-50 hover:bg-teal-100 text-teal-900 border-teal-200"
                                )}
                              >
                                <UserCheck size={10} />
                                <span>{customer.name}</span>
                                <span className={cn(
                                  "px-1 rounded font-black",
                                  isSelected ? "bg-white/20 text-white" : "bg-teal-100 text-teal-800"
                                )}>
                                  Adv {formatCurrency(pos.explicitAdvanceBalance, settings)}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-indigo-900 uppercase mb-1">
                          Work Order # / PO (Optional)
                        </label>
                        <input
                          type="text"
                          list="purchase-work-orders-list"
                          placeholder="e.g. 5520 or WO-2026-001"
                          value={purchaseForm.workOrderNumber || ''}
                          onChange={e => {
                            const val = e.target.value;
                            const valClean = val.trim().replace(/^#+/, '').trim().toLowerCase();
                            const matchedScope = valClean
                              ? discoveredScopes.find(
                                  s => s.workOrderNumber.trim().toLowerCase() === valClean
                                )
                              : undefined;
                            const prefAcc = matchedScope?.preferredPaymentAccountId
                              ? paymentAccounts.find(a => a.id === matchedScope.preferredPaymentAccountId)
                              : undefined;
                            setPurchaseForm(prev => ({
                              ...prev,
                              workOrderNumber: val,
                              ...(matchedScope
                                ? {
                                    projectName: matchedScope.projectName || matchedScope.title || prev.projectName,
                                    customerId: matchedScope.customerId || prev.customerId,
                                    customerName: matchedScope.clientName || prev.customerName,
                                    ...(!prev.paymentAccountId && prefAcc
                                      ? {
                                          paymentAccountId: prefAcc.id,
                                          paymentMethod: prefAcc.type || 'cash',
                                        }
                                      : {}),
                                  }
                                : {}),
                            }));
                          }}
                          className="w-full border border-indigo-200 bg-white rounded-lg p-2 font-bold text-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                        <datalist id="purchase-work-orders-list">
                          {discoveredScopes
                            .filter(s => s.workOrderNumber)
                            .map(s => (
                              <option key={s.key} value={s.workOrderNumber}>
                                {`${s.projectName || s.title}${s.clientName ? ` (${s.clientName})` : ''}${
                                  s.financials.advancesReceived > 0 ? ` — Adv ৳${s.financials.advancesReceived}` : ''
                                }`}
                              </option>
                            ))}
                        </datalist>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-indigo-900 uppercase mb-1">
                          Project / Branch (Optional)
                        </label>
                        <input
                          type="text"
                          list="purchase-projects-list"
                          placeholder="e.g. Yeasin / HQ Setup"
                          value={purchaseForm.projectName || ''}
                          onChange={e => {
                            const val = e.target.value;
                            const valLow = val.trim().toLowerCase();
                            const matchedCust = valLow
                              ? customers.find(
                                  c =>
                                    c.name.trim().toLowerCase() === valLow ||
                                    (c.branchName || '').trim().toLowerCase() === valLow ||
                                    (c.branches || []).some(b => b.trim().toLowerCase() === valLow)
                                )
                              : undefined;
                            const matchedScope = valLow
                              ? discoveredScopes.find(s => s.projectName.trim().toLowerCase() === valLow)
                              : undefined;
                            setPurchaseForm(prev => ({
                              ...prev,
                              projectName: val,
                              ...(!prev.customerId && (matchedCust || matchedScope?.customerId)
                                ? {
                                    customerId: matchedCust?.id || matchedScope?.customerId || '',
                                    customerName: matchedCust?.name || matchedScope?.clientName || '',
                                  }
                                : {}),
                              ...(!prev.workOrderNumber && matchedScope?.workOrderNumber
                                ? { workOrderNumber: matchedScope.workOrderNumber }
                                : {}),
                            }));
                          }}
                          className="w-full border border-indigo-200 bg-white rounded-lg p-2 font-bold text-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                        <datalist id="purchase-projects-list">
                          {projectSuggestions.map(p => (
                            <option key={p} value={p} />
                          ))}
                        </datalist>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-indigo-900 uppercase mb-1">
                          Client / Customer (Advance Track)
                        </label>
                        <select
                          value={purchaseForm.customerId || activePurchaseContext.matchedCustomer?.id || ''}
                          onChange={e => {
                            const cust = customers.find(c => c.id === e.target.value);
                            setPurchaseForm(prev => ({
                              ...prev,
                              customerId: cust?.id || '',
                              customerName: cust?.name || '',
                              projectName: prev.projectName || cust?.branchName || cust?.name || '',
                            }));
                          }}
                          className="w-full border border-indigo-200 bg-white rounded-lg p-2 font-bold text-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-400"
                        >
                          <option value="">-- Optional Customer Link --</option>
                          {customers.map(c => {
                            const pos = calculateCustomerAccountPosition(transactions, c);
                            return (
                              <option key={c.id} value={c.id}>
                                {c.name}
                                {pos.explicitAdvanceBalance > 0
                                  ? ` (Adv: ৳${pos.explicitAdvanceBalance.toLocaleString()})`
                                  : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>

                    {/* Live Work Order / Customer Advance Status Banner */}
                    {(activePurchaseContext.hasScope || activePurchaseContext.matchedCustomer) && (
                      <div className="bg-white/95 border border-indigo-200 rounded-xl p-3 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                          <div className="flex items-center gap-2 flex-wrap font-bold text-slate-800">
                            {activePurchaseContext.cleanWO && (
                              <span className="px-2 py-0.5 bg-slate-900 text-white rounded font-mono text-[10px]">
                                WO #{activePurchaseContext.cleanWO}
                              </span>
                            )}
                            {activePurchaseContext.cleanProj && (
                              <span className="px-2 py-0.5 bg-cyan-50 text-cyan-800 border border-cyan-200 rounded text-[10px]">
                                Project: {activePurchaseContext.cleanProj}
                              </span>
                            )}
                            {activePurchaseContext.matchedCustomer ? (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] flex items-center gap-1">
                                <UserCheck size={10} /> Customer: {activePurchaseContext.matchedCustomer.name}
                              </span>
                            ) : (
                              activePurchaseContext.cleanProj && (
                                <span className="text-[10px] text-amber-700 font-semibold">
                                  No customer matched "{activePurchaseContext.cleanProj}" yet — select Client above or log Advance.
                                </span>
                              )
                            )}
                          </div>

                          {activePurchaseContext.preferredAccount &&
                            purchaseForm.paymentAccountId !== activePurchaseContext.preferredAccount.id && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPurchaseForm(prev => ({
                                    ...prev,
                                    paymentAccountId: activePurchaseContext.preferredAccount!.id,
                                    paymentMethod: activePurchaseContext.preferredAccount!.type || 'cash',
                                  }))
                                }
                                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Wallet size={10} /> Use {activePurchaseContext.preferredAccount.name}
                              </button>
                            )}
                        </div>

                        {activePurchaseContext.scopedFinancials &&
                        (activePurchaseContext.scopedFinancials.advancesReceived > 0 ||
                          activePurchaseContext.scopedFinancials.totalPurchasesCost > 0 ||
                          activePurchaseContext.scopedFinancials.totalSalesInvoiced > 0) ? (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                            <div className="bg-teal-50/80 border border-teal-200 rounded-lg px-2.5 py-1.5">
                              <div className="text-[9px] font-bold uppercase text-teal-700">Customer Advance</div>
                              <div className="text-xs font-black text-teal-900">
                                {formatCurrency(activePurchaseContext.scopedFinancials.advancesReceived, settings)}
                              </div>
                            </div>
                            <div className="bg-amber-50/80 border border-amber-200 rounded-lg px-2.5 py-1.5">
                              <div className="text-[9px] font-bold uppercase text-amber-700">Prior Purchases</div>
                              <div className="text-xs font-black text-amber-900">
                                {formatCurrency(activePurchaseContext.scopedFinancials.totalPurchasesCost, settings)}
                              </div>
                            </div>
                            {(() => {
                              const availAdvForPurchases =
                                activePurchaseContext.scopedFinancials.netAdvanceDeposits -
                                activePurchaseContext.scopedFinancials.totalPurchasesCost;
                              const leftAfterBill = availAdvForPurchases - billTotal;
                              return (
                                <div
                                  className={cn(
                                    "rounded-lg px-2.5 py-1.5 border",
                                    leftAfterBill >= 0
                                      ? "bg-emerald-50/80 border-emerald-200"
                                      : "bg-rose-50/80 border-rose-200"
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "text-[9px] font-bold uppercase",
                                      leftAfterBill >= 0 ? "text-emerald-700" : "text-rose-700"
                                    )}
                                  >
                                    {leftAfterBill >= 0 ? 'Adv Left After Bill' : 'Extra Above Advance'}
                                  </div>
                                  <div
                                    className={cn(
                                      "text-xs font-black",
                                      leftAfterBill >= 0 ? "text-emerald-900" : "text-rose-800"
                                    )}
                                  >
                                    {formatCurrency(Math.abs(leftAfterBill), settings)}
                                  </div>
                                </div>
                              );
                            })()}
                            <div className="bg-blue-50/80 border border-blue-200 rounded-lg px-2.5 py-1.5">
                              <div className="text-[9px] font-bold uppercase text-blue-700">Sales Billed</div>
                              <div className="text-xs font-black text-blue-900">
                                {formatCurrency(activePurchaseContext.scopedFinancials.totalSalesInvoiced, settings)}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-50/70 border border-amber-200 rounded-lg px-2.5 py-2 text-[11px] text-amber-900">
                            <span>
                              No Customer Advance recorded yet for{' '}
                              <b>
                                {activePurchaseContext.cleanWO
                                  ? `WO #${activePurchaseContext.cleanWO}`
                                  : activePurchaseContext.cleanProj || activePurchaseContext.matchedCustomer?.name}
                              </b>
                              {activePurchaseContext.overallCustomerPos &&
                                activePurchaseContext.overallCustomerPos.explicitAdvanceBalance > 0 && (
                                  <span className="ml-1.5 text-teal-800 font-bold">
                                    (Customer Overall Advance Wallet:{' '}
                                    {formatCurrency(activePurchaseContext.overallCustomerPos.explicitAdvanceBalance, settings)})
                                  </span>
                                )}
                              .
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowAdvanceModal(true)}
                              className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-[10px] font-bold cursor-pointer shrink-0"
                            >
                              + Record Advance Here
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Vendor Bill Attachment */}
                  <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block font-bold text-gray-700 uppercase flex items-center gap-1.5 text-[11px]">
                        <Paperclip size={13} className="text-blue-600" /> Vendor Paper Bill / Memo (Attachment)
                      </label>
                      {uploadingAttachment && (
                        <span className="text-blue-600 font-bold flex items-center gap-1 text-[11px] animate-pulse">
                          <Upload size={12} className="animate-bounce" /> Uploading file...
                        </span>
                      )}
                    </div>

                    {purchaseForm.attachmentUrl ? (
                      <div className="flex items-center justify-between bg-white border border-emerald-200 rounded-lg p-2.5 shadow-sm">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <ImageIcon size={20} className="text-emerald-600 shrink-0" />
                          <div className="truncate">
                            <span className="text-xs font-bold text-slate-800 block">Vendor Memo / Challan Attached ✓</span>
                            <a 
                              href={purchaseForm.attachmentUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-1 font-semibold"
                            >
                              View in Full Size <ExternalLink size={10} />
                            </a>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPurchaseForm(prev => ({ ...prev, attachmentUrl: '' }))}
                          className="text-xs text-rose-600 hover:bg-rose-50 px-2.5 py-1 rounded-md font-bold border border-rose-200 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 border border-dashed border-slate-300 hover:border-blue-400 bg-white hover:bg-blue-50/50 p-2.5 rounded-lg cursor-pointer transition-colors text-slate-600 hover:text-blue-700 font-bold text-xs">
                        <Upload size={14} className="text-blue-600" />
                        <span>{uploadingAttachment ? 'Uploading file...' : 'Upload vendor bill/memo image or PDF (up to 10MB)'}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          disabled={uploadingAttachment}
                          onChange={handleBillFileUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Items in Purchase Order */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="font-bold text-gray-700 uppercase tracking-wider">
                      Purchased Items ({purchaseForm.items.length})
                    </label>
                    {purchaseForm.items.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setPurchaseForm({ ...purchaseForm, items: [] })}
                        className="text-red-500 hover:text-red-700 text-[11px]"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {purchaseForm.items.length === 0 ? (
                    <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400">
                      <ShoppingBag size={32} className="mx-auto mb-2 opacity-40" />
                      <p className="font-medium">No products added to this purchase yet.</p>
                      <p className="text-[11px]">Select a category on the right and click products to add.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {purchaseForm.items.map((item, idx) => (
                        <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex-1 min-w-[150px] w-full break-words">
                              <span className="font-bold text-gray-900 block text-xs">{item.name}{item.variantName ? ` - ${item.variantName}` : ""}</span>
                              <span className="text-[10px] text-gray-400">Category: {item.category}</span>
                            </div>

                            <div className="flex flex-wrap items-center justify-end gap-3 shrink-0">
{/* Purchase Cost Price */}
                            <div>
                              <label className="block text-[9px] font-bold text-gray-500 uppercase">Cost Price (৳)</label>
                              <input
                                type="number"
                                min={1}
                                value={item.purchasePrice}
                                onChange={e => updateItem(item.id, 'purchasePrice', Number(e.target.value))}
                                className="w-20 text-right border border-gray-200 rounded p-1 font-black text-gray-900"
                              />
                              {(() => {
                                const lastPur = getLastPurchaseInfo(item.id, item.name);
                                if (!lastPur) return null;
                                const formattedDate = lastPur.date ? new Date(lastPur.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '';
                                return (
                                  <div 
                                    className="mt-1 text-[9px] text-blue-800 bg-blue-50/80 border border-blue-200/60 rounded px-1 py-0.5 flex items-center gap-0.5 whitespace-nowrap cursor-help"
                                    title={`Last purchased at: ৳${lastPur.price}${lastPur.vendorName ? ` (Vendor: ${lastPur.vendorName})` : ''}${lastPur.documentNumber ? ` [Bill #${lastPur.documentNumber}]` : ''}`}
                                  >
                                    <History size={10} className="text-blue-600 shrink-0" />
                                    <span>Last: <strong>৳{lastPur.price}</strong>{formattedDate ? ` (${formattedDate})` : ''}</span>
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Sales Price */}
                            <div>
                              <label className="block text-[9px] font-bold text-blue-500 uppercase">Sales Price (৳)</label>
                              <input
                                type="number"
                                min={1}
                                value={item.salesPrice || 0}
                                onChange={e => updateItem(item.id, 'salesPrice', Number(e.target.value))}
                                className={cn(
                                  "w-20 text-right border rounded p-1 font-black outline-none focus:ring-1",
                                  item.salesPrice && Number(item.purchasePrice) > Number(item.salesPrice)
                                    ? "border-red-400 bg-red-50 text-red-900 focus:ring-red-500"
                                    : "border-blue-200 bg-blue-50/50 text-blue-900 focus:ring-blue-500"
                                )}
                              />
                            </div>

                                                          {/* Quantity & Unit */}
                              <div>
                                <label className="block text-[9px] font-bold text-gray-500 uppercase">Qty & Unit</label>
                                <div className="flex">
                                  <input
                                    type="number"
                                    min={1}
                                    value={item.quantity}
                                    onChange={e => updateItem(item.id, 'quantity', Math.max(1, Number(e.target.value)))}
                                    className="w-16 text-center border border-gray-200 rounded-l p-1 font-bold focus:ring-1 focus:ring-blue-500 outline-none"
                                  />
                                  <select
                                    value={item.unit || 'pcs'}
                                    onChange={e => updateItem(item.id, 'unit', e.target.value)}
                                    className="w-16 border-y border-r border-gray-200 rounded-r p-1 text-xs font-bold text-gray-700 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                  >
                                    <option value="pcs">pcs</option>
                                    <option value="nos">nos</option>
                                    <option value="meter">meter</option>
                                    <option value="kg">kg</option>
                                    <option value="gm">gm</option>
                                    <option value="litre">litre</option>
                                    <option value="box">box</option>
                                    <option value="pack">pack</option>
                                    <option value="chop">chop</option>
                                  </select>
                                </div>
                              </div>

                            {/* Warranty */}
                            <div>
                              <label className="flex items-center gap-1 text-[9px] font-bold text-gray-500 uppercase cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(item.hasWarranty)}
                                  onChange={e => updateItem(item.id, 'hasWarranty', e.target.checked)}
                                  className="rounded border-gray-300 text-blue-600 w-3 h-3"
                                />
                                Warranty
                              </label>
                              <div className="flex">
                                <input
                                  type="number"
                                  min={1}
                                  disabled={!item.hasWarranty}
                                  value={item.warrantyValue ?? 1}
                                  onChange={e => updateItem(item.id, 'warrantyValue', Math.max(1, Number(e.target.value)))}
                                  className="w-14 text-center border border-gray-200 rounded-l p-1 font-bold focus:ring-1 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                                />
                                <select
                                  disabled={!item.hasWarranty}
                                  value={item.warrantyUnit || 'years'}
                                  onChange={e => updateItem(item.id, 'warrantyUnit', e.target.value)}
                                  className="w-[4.5rem] border-y border-r border-gray-200 rounded-r p-1 text-xs font-bold text-gray-700 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:bg-gray-100 disabled:text-gray-400"
                                >
                                  <option value="days">Days</option>
                                  <option value="months">Months</option>
                                  <option value="years">Years</option>
                                </select>
                              </div>
                            </div>

                            {/* Total for item */}
                            <div className="text-right min-w-20">
                              <label className="block text-[9px] font-bold text-gray-500 uppercase">Total</label>
                              <span className="font-black text-gray-900 text-sm block">
                                {formatCurrency(item.purchasePrice * item.quantity, settings)}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                            >
                              <Trash2 size={14} />
                            </button>
</div>
                          </div>

                          {/* Margin warning if cost > sales price */}
                          {item.salesPrice !== undefined && Number(item.salesPrice) > 0 && Number(item.purchasePrice) > Number(item.salesPrice) && (
                            <div className="w-full text-[11px] text-red-600 font-bold bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 mt-1">
                              <AlertCircle size={13} className="shrink-0 text-red-500" />
                              <span>Warning: Purchase cost (৳{item.purchasePrice}) exceeds selling price (৳{item.salesPrice})!</span>
                            </div>
                          )}

                          {/* Landed Cost breakdown when shipping/discount added */}
                          {(() => {
                            const totalQty = purchaseForm.items.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
                            const shipCost = Number(purchaseForm.shippingCost) || 0;
                            const discCost = Number(purchaseForm.discountAmount) || 0;
                            if ((shipCost <= 0 && discCost <= 0) || totalQty <= 0) return null;
                            const perUnitAdjustment = (shipCost - discCost) / totalQty;
                            const effectiveCost = Math.max(0, Number(item.purchasePrice) + perUnitAdjustment);
                            return (
                              <div className="w-full text-[11px] text-indigo-700 font-medium bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-1.5 mt-1">
                                <span className="flex items-center gap-1.5">
                                  <Truck size={13} className="shrink-0 text-indigo-600" />
                                  <span>Net Landed Unit Cost: <strong className="font-bold text-indigo-900">৳{effectiveCost.toFixed(2)}</strong> / unit</span>
                                </span>
                                <span className="text-[10px] text-indigo-600 font-bold bg-white px-2 py-0.5 rounded border border-indigo-200">
                                  {perUnitAdjustment >= 0 ? `+৳${perUnitAdjustment.toFixed(2)}` : `-৳${Math.abs(perUnitAdjustment).toFixed(2)}`} / unit overhead adjustment
                                </span>
                              </div>
                            );
                          })()}

                          {/* Barcode & Serial Scanning Section (Available for every item) */}
                          {(() => {
                            const serials = Array.isArray(item.newSerials) ? item.newSerials : [];
                            const serialCount = serials.length;
                            const isMatch = serialCount === Number(item.quantity);
                            const isOver = serialCount > Number(item.quantity);

                            const addBarcodesToItem = (rawText: string) => {
                              if (!rawText || !rawText.trim()) return;
                              const tokens = rawText.split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
                              if (tokens.length === 0) return;

                              const currentSerials = Array.isArray(item.newSerials) ? item.newSerials : [];
                              const otherItemSerials = purchaseForm.items
                                .filter(i => i.id !== item.id && Array.isArray(i.newSerials))
                                .flatMap(i => i.newSerials as string[]);

                              const validNew: string[] = [];
                              for (const cleanS of tokens) {
                                if (currentSerials.some(cs => cs.toLowerCase() === cleanS.toLowerCase()) || validNew.some(vn => vn.toLowerCase() === cleanS.toLowerCase())) {
                                  continue;
                                }
                                if (otherItemSerials.some(os => os.toLowerCase() === cleanS.toLowerCase())) {
                                  toast.error(`Barcode "${cleanS}" has already been scanned for another item in this purchase!`);
                                  continue;
                                }
                                const existingInDb = products.find(p => 
                                  p.id !== item.id && 
                                  Array.isArray(p.availableSerials) && 
                                  p.availableSerials.some((existingS: string) => existingS.trim().toLowerCase() === cleanS.toLowerCase())
                                );
                                if (existingInDb) {
                                  toast.error(`Barcode "${cleanS}" already exists under product "${existingInDb.name}"!`);
                                  continue;
                                }
                                validNew.push(cleanS);
                              }

                              if (validNew.length > 0) {
                                const updatedSerials = [...currentSerials, ...validNew];
                                const newQty = Math.max(item.quantity, updatedSerials.length);
                                setPurchaseForm(prev => ({
                                  ...prev,
                                  items: prev.items.map(i => 
                                    i.id === item.id 
                                      ? { 
                                          ...i, 
                                          newSerials: updatedSerials, 
                                          quantity: newQty,
                                          total: (Number(i.purchasePrice) || 0) * newQty,
                                          hasSerialTracking: true,
                                          sku: (!i.sku || i.sku.startsWith('PRD-')) ? updatedSerials[0] : i.sku
                                        } 
                                      : i
                                  )
                                }));
                                if (validNew.length === 1) {
                                  toast.success(`Barcode "${validNew[0]}" added (Quantity: ${newQty})`);
                                } else {
                                  toast.success(`${validNew.length} barcodes added (Total Quantity: ${newQty})`);
                                }
                              } else if (tokens.length > 0) {
                                toast.error('Barcodes already scanned or exist in database!');
                              }
                            };

                            return (
                              <div className="border-t border-gray-200/80 pt-3 mt-2.5">
                                {/* Header with title, count badge, and clear button */}
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                  <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1.5">
                                    <Barcode size={15} className="text-blue-600" />
                                    <span>Barcode / Serial Scanning</span>
                                  </label>

                                  <div className="flex items-center gap-2">
                                    {serials.length > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPurchaseForm(prev => ({
                                            ...prev,
                                            items: prev.items.map(i => 
                                              i.id === item.id 
                                                ? { ...i, newSerials: [], quantity: 1, total: Number(i.purchasePrice) || 0 } 
                                                : i
                                            )
                                          }));
                                          toast.success('All scanned barcodes cleared');
                                        }}
                                        className="text-[10px] text-red-600 hover:text-red-700 hover:underline font-bold"
                                      >
                                        Clear All
                                      </button>
                                    )}
                                    <span className={cn(
                                      "px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1",
                                      serials.length === 0
                                        ? "bg-gray-100 text-gray-600 border border-gray-200"
                                        : isMatch
                                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                          : isOver
                                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                                            : "bg-blue-100 text-blue-800 border border-blue-200"
                                    )}>
                                      {serials.length === 0
                                        ? `Pending: 0 / ${item.quantity}`
                                        : isMatch
                                          ? `✓ Matched: ${serials.length} / ${item.quantity}`
                                          : isOver
                                            ? `⚠️ Excess: ${serials.length} / ${item.quantity}`
                                            : `Scanned: ${serials.length} / ${item.quantity}`}
                                    </span>
                                  </div>
                                </div>

                                {/* Barcode Scan / Paste Input */}
                                <div className="relative mb-2">
                                  <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                  <input
                                    type="text"
                                    placeholder="Scan barcode or paste serials (comma, space or newline separated)..."
                                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-xs"
                                    onPaste={(e) => {
                                      e.preventDefault();
                                      const pasteData = e.clipboardData.getData('text');
                                      if (pasteData) {
                                        addBarcodesToItem(pasteData);
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const val = e.currentTarget.value.trim();
                                        if (val) {
                                          addBarcodesToItem(val);
                                          e.currentTarget.value = '';
                                        }
                                      }
                                    }}
                                    onChange={(e) => {
                                      const val = e.currentTarget.value;
                                      if (val.includes(',') || val.includes('\n')) {
                                        addBarcodesToItem(val);
                                        e.currentTarget.value = '';
                                      }
                                    }}
                                  />
                                </div>

                                {/* Scanned Barcodes Badges */}
                                {serials.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50/90 rounded-lg border border-gray-200 max-w-full">
                                    {serials.map((serial, sIdx) => (
                                      <span
                                        key={sIdx}
                                        className="inline-flex items-center gap-1.5 bg-white border border-gray-300 text-gray-800 text-[11px] font-mono px-2 py-0.5 rounded shadow-xs break-all"
                                      >
                                        <span className="text-[9px] text-gray-400 select-none">#{sIdx + 1}</span>
                                        <span className="font-semibold">{serial}</span>
                                        <button
                                          type="button"
                                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-0.5 rounded transition-colors"
                                          title="Remove"
                                          onClick={() => {
                                            const updatedSerials = serials.filter((_, idx) => idx !== sIdx);
                                            const newQty = Math.max(1, updatedSerials.length);
                                            setPurchaseForm(prev => ({
                                              ...prev,
                                              items: prev.items.map(i => 
                                                i.id === item.id 
                                                  ? { 
                                                      ...i, 
                                                      newSerials: updatedSerials, 
                                                      quantity: newQty,
                                                      total: (Number(i.purchasePrice) || 0) * newQty,
                                                      sku: updatedSerials[0] || i.sku
                                                    } 
                                                  : i
                                              )
                                            }));
                                          }}
                                        >
                                          <X size={12} />
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                ) : item.sku ? (
                                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-600 bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5">
                                    <span className="font-medium text-gray-500">Default Barcode / SKU:</span>
                                    <span className="font-mono font-bold text-gray-800 bg-white px-2 py-0.5 rounded border border-gray-200">{item.sku}</span>
                                    {item.sku.startsWith('PRD-') ? (
                                      <span className="text-[10px] text-blue-600 font-sans">(Auto SKU — scanning or pasting multiple serials will expand quantity)</span>
                                    ) : (
                                      <span className="text-[10px] text-gray-500 font-sans">(Automatically updates when a new barcode is scanned)</span>
                                    )}
                                  </div>
                                ) : null}

                                <p className="text-[10px] text-gray-500 mt-1.5">
                                  💡 Scan or paste multiple barcodes separated by spaces, commas, or newlines. Quantity will automatically update.
                                </p>
                              </div>
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Payment Section */}
                {(() => {
                  const selectedAccount = paymentAccounts.find(a => a.id === purchaseForm.paymentAccountId);
                  const availableBalance = selectedAccount ? calculateAccountBalance(selectedAccount, transactions) : 0;
                  const isInsufficient = Boolean(selectedAccount && purchaseForm.paidAmount > availableBalance);
                  return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                  <div className="bg-gray-50/70 p-3.5 rounded-xl border border-gray-200 space-y-3">
                    <span className="font-bold text-gray-700 uppercase block">Payment Source Account</span>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Paid From Account</label>
                      <select
                        value={purchaseForm.paymentAccountId}
                        onChange={e => {
                          const acc = paymentAccounts.find(a => a.id === e.target.value);
                          setPurchaseForm({
                            ...purchaseForm,
                            paymentAccountId: e.target.value,
                            paymentMethod: acc?.type || 'cash',
                          });
                        }}
                        className="w-full border border-gray-200 rounded-lg p-2 font-medium"
                      >
                        <option value="">-- Select Account --</option>
                        {paymentAccounts.map(a => {
                          const bal = calculateAccountBalance(a, transactions);
                          return (
                            <option key={a.id} value={a.id}>
                              {a.name} ({a.type}) — Balance: ৳{bal.toLocaleString()}
                            </option>
                          );
                        })}
                      </select>
                      {activePurchaseContext.preferredAccount &&
                        purchaseForm.paymentAccountId !== activePurchaseContext.preferredAccount.id && (
                          <button
                            type="button"
                            onClick={() =>
                              setPurchaseForm(prev => ({
                                ...prev,
                                paymentAccountId: activePurchaseContext.preferredAccount!.id,
                                paymentMethod: activePurchaseContext.preferredAccount!.type || 'cash',
                              }))
                            }
                            className="mt-1.5 w-full px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Wallet size={12} /> Pay from Customer Advance Account ({activePurchaseContext.preferredAccount.name})
                          </button>
                        )}
                      {selectedAccount && (
                        <div className={cn(
                          "mt-2 text-xs px-2.5 py-1.5 rounded-lg flex items-center justify-between font-bold",
                          availableBalance > 0 ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
                        )}>
                          <span>Current Balance:</span>
                          <span>{formatCurrency(availableBalance, settings)}</span>
                        </div>
                      )}
                    </div>

                    {/* Cheque Payment Option */}
                    <div className="pt-2 border-t border-gray-200">
                      <label className="flex items-center gap-2 text-xs font-bold text-indigo-900 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(purchaseForm.isChequePayment)}
                          onChange={e => setPurchaseForm({ 
                            ...purchaseForm, 
                            isChequePayment: e.target.checked,
                            chequeClearingDate: purchaseForm.chequeClearingDate || new Date().toISOString().split('T')[0]
                          })}
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                        <span>🏦 Pay via Bank Cheque / PDC (Post-Dated Cheque)</span>
                      </label>

                      {purchaseForm.isChequePayment && (
                        <div className="mt-2.5 bg-indigo-50/80 border border-indigo-200 rounded-xl p-3 space-y-2 animate-in fade-in">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-indigo-950 uppercase mb-1">
                                Cheque Number (Cheque No) *
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. CK-890123"
                                value={purchaseForm.chequeNumber || ''}
                                onChange={e => setPurchaseForm({ ...purchaseForm, chequeNumber: e.target.value })}
                                className="w-full bg-white border border-indigo-200 rounded-lg p-1.5 font-mono font-bold text-xs outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-indigo-950 uppercase mb-1">
                                Cheque Clearing Date (PDC Date) *
                              </label>
                              <input
                                type="date"
                                value={purchaseForm.chequeClearingDate || ''}
                                onChange={e => setPurchaseForm({ ...purchaseForm, chequeClearingDate: e.target.value })}
                                className="w-full bg-white border border-indigo-200 rounded-lg p-1.5 font-bold text-xs outline-none text-indigo-950"
                              />
                            </div>
                          </div>
                          <p className="text-[10px] text-indigo-700 font-medium">
                            💡 Cheque will be marked as "Pending Clearance" in Cheque Tracker and alert on clearing date.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase">
                          Purchase Notes (Optional)
                        </label>
                        <AIPolishButton
                          value={purchaseForm.notes}
                          onPolished={p => setPurchaseForm({ ...purchaseForm, notes: p })}
                          context="notes"
                          compact
                        />
                      </div>
                      <textarea
                        rows={2}
                        value={purchaseForm.notes}
                        onChange={e => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                        placeholder="e.g. Courier instructions, internal notes..."
                        className="w-full border border-gray-200 rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50/70 p-3.5 rounded-xl border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-gray-700 uppercase">Disbursement / Paid Amount</span>
                      <div className="flex items-center gap-1">
                        {billTotal > 0 && (
                          <button
                            type="button"
                            onClick={() => setPurchaseForm(prev => ({ ...prev, paidAmount: billTotal }))}
                            className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold cursor-pointer"
                          >
                            Pay Full
                          </button>
                        )}
                        {purchaseForm.paidAmount > 0 && (
                          <button
                            type="button"
                            onClick={() => setPurchaseForm(prev => ({ ...prev, paidAmount: 0 }))}
                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded text-[10px] font-bold cursor-pointer"
                          >
                            Clear (Due)
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                        Paid Amount (৳) — Bill: {formatCurrency(billTotal, settings)}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={purchaseForm.paidAmount || ''}
                        onChange={e => setPurchaseForm({ ...purchaseForm, paidAmount: Number(e.target.value) || 0 })}
                        className={cn(
                          "w-full border rounded-lg p-2 font-black text-gray-900 text-sm",
                          purchaseForm.paidAmount > billTotal || isInsufficient ? "border-red-400 bg-red-50 text-red-900" : "border-gray-200"
                        )}
                      />
                      {purchaseForm.paidAmount > billTotal && (
                        <p className="text-[11px] text-red-600 font-bold mt-1 flex items-center gap-1">
                          <AlertCircle size={12} className="shrink-0" /> Paid amount cannot exceed total purchase bill ({formatCurrency(billTotal, settings)})!
                        </p>
                      )}
                      {isInsufficient && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 text-xs text-red-800 space-y-1.5 mt-2">
                          <div className="font-black flex items-center gap-1.5 text-red-900">
                            <AlertCircle size={14} className="shrink-0 text-red-600" />
                            Insufficient Balance! Account balance cannot go below zero.
                          </div>
                          <p className="text-[11px] text-red-700">
                            "{selectedAccount?.name}" has available balance <b>{formatCurrency(availableBalance, settings)}</b>, but you entered <b>{formatCurrency(purchaseForm.paidAmount, settings)}</b>.
                          </p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {availableBalance > 0 && (
                              <button
                                type="button"
                                onClick={() => setPurchaseForm({ ...purchaseForm, paidAmount: Math.min(billTotal, availableBalance) })}
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-black rounded text-[11px] transition shadow-xs cursor-pointer"
                              >
                                Pay {formatCurrency(Math.min(billTotal, availableBalance), settings)} (Remaining {formatCurrency(billTotal - Math.min(billTotal, availableBalance), settings)} Due)
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setPurchaseForm({ ...purchaseForm, paidAmount: 0 })}
                              className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-black rounded text-[11px] transition shadow-xs cursor-pointer"
                            >
                              Keep full bill ({formatCurrency(billTotal, settings)}) as Due
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Discount & Shipping Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                          Discount (৳)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={purchaseForm.discountAmount || ''}
                          onChange={e => setPurchaseForm({ ...purchaseForm, discountAmount: Math.max(0, Number(e.target.value) || 0) })}
                          className="w-full border border-gray-200 rounded-lg p-2 font-black text-gray-900 text-sm focus:ring-2 focus:ring-[#EF4444] outline-none"
                          placeholder="e.g. 500"
                        />
                        <p className="text-[9px] text-gray-500 mt-1">Supplier discount deducted from total bill.</p>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                          Shipping / Other Cost (৳)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={purchaseForm.shippingCost || ''}
                          onChange={e => setPurchaseForm({ ...purchaseForm, shippingCost: Math.max(0, Number(e.target.value) || 0) })}
                          className="w-full border border-gray-200 rounded-lg p-2 font-black text-gray-900 text-sm focus:ring-2 focus:ring-[#EF4444] outline-none"
                          placeholder="e.g. 100"
                        />
                        <p className="text-[9px] text-gray-500 mt-1">Added to product acquisition cost.</p>
                      </div>
                    </div>

                    {billTotal > purchaseForm.paidAmount && (
                      <div className="flex justify-between items-center text-xs font-bold text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                        <span>Supplier Due Payable:</span>
                        <span>{formatCurrency(billTotal - purchaseForm.paidAmount, settings)}</span>
                      </div>
                    )}
                  </div>
                </div>
                  );
                })()}

                {/* Bill Total Breakdown & Submit */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-gray-600">
                    <span>Items Subtotal:</span>
                    <span className="font-bold text-gray-900">{formatCurrency(itemsSubtotal, settings)}</span>
                  </div>
                  {Number(purchaseForm.discountAmount) > 0 && (
                    <div className="flex justify-between items-center text-xs font-bold text-emerald-700">
                      <span>Supplier Discount:</span>
                      <span>- {formatCurrency(Number(purchaseForm.discountAmount), settings)}</span>
                    </div>
                  )}
                  {Number(purchaseForm.shippingCost) > 0 && (
                    <div className="flex justify-between items-center text-xs font-bold text-indigo-700">
                      <span>Shipping / Additional Cost:</span>
                      <span>+ {formatCurrency(Number(purchaseForm.shippingCost), settings)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="font-bold text-gray-800 uppercase text-sm">Total Purchase Bill</span>
                    <span className="text-xl font-black text-[#EF4444]">{formatCurrency(billTotal, settings)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || purchaseForm.items.length === 0 || !purchaseForm.vendorId || (Boolean(!purchaseForm.isChequePayment && purchaseForm.paymentAccountId && purchaseForm.paidAmount > calculateAccountBalance(paymentAccounts.find(a => a.id === purchaseForm.paymentAccountId), transactions)))}
                  className="w-full bg-[#081621] hover:bg-[#EF4444] disabled:opacity-50 text-white py-3.5 rounded-xl font-black text-sm transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} />
                  {submitting 
                    ? (purchaseForm.id ? 'Updating Purchase...' : 'Restocking Inventory...') 
                    : (purchaseForm.id ? 'Update & Save Purchase' : 'Confirm Purchase & Restock Inventory')}
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT: CATEGORY SELECTOR & PRODUCT PICKER (5 COLS) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
              <div>
                <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">
                  Pick Products by Category
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Select category below to filter products easily</p>
              </div>

              {/* Category Dropdown + Add Category */}
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-gray-700 uppercase">
                      Select Category <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(true)}
                      className="flex items-center gap-1 text-[10px] font-bold text-[#EF4444] hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg transition-all border border-red-200"
                    >
                      <Plus size={11} /> Add Category
                    </button>
                  </div>

                  {/* Inline Add Category form */}
                  {isAddingCategory && (
                    <form
                      onSubmit={handleAddCategory}
                      className="mb-2 flex gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg"
                    >
                      <input
                        type="text"
                        autoFocus
                        placeholder="e.g. Laptop, Monitor, Accessories..."
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                        className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-red-200"
                      />
                      <button
                        type="submit"
                        disabled={savingCategory || !newCategoryName.trim()}
                        className="bg-[#EF4444] hover:bg-red-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 transition-all"
                      >
                        <CheckCircle size={12} /> {savingCategory ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsAddingCategory(false); setNewCategoryName(''); }}
                        className="text-gray-500 hover:text-gray-800 px-2 py-1.5 rounded-lg bg-white border border-gray-200 font-bold text-xs"
                      >
                        <X size={12} />
                      </button>
                    </form>
                  )}

                  <select
                    value={pickForm.category}
                    onChange={e => setPickForm({ ...pickForm, category: e.target.value, subCategory: '', brand: '' })}
                    className="w-full py-2 px-3 border border-gray-200 rounded-lg outline-none font-bold text-gray-900 bg-white mb-2"
                  >
                    <option value="">-- Select Category * --</option>
                    {rawMenus.map((c: any) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>

                  <div className="flex items-center justify-between mt-2 mb-1">
                    <label className="font-bold text-gray-700 uppercase">Select Sub Category</label>
                    <button
                      type="button"
                      onClick={() => setIsAddingSubCategory(true)}
                      className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-all border border-blue-200"
                    >
                      <Plus size={11} /> Add Sub Category
                    </button>
                  </div>
                  {isAddingSubCategory && (
                    <form onSubmit={handleAddSubCategory} className="mb-2 flex gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                      <input type="text" autoFocus placeholder="e.g. Gaming, Office..." value={newSubCategoryName} onChange={e => setNewSubCategoryName(e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-200" />
                      <button type="submit" disabled={savingSubCategory || !newSubCategoryName.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 transition-all">
                        <CheckCircle size={12} /> Save
                      </button>
                      <button type="button" onClick={() => { setIsAddingSubCategory(false); setNewSubCategoryName(''); }} className="text-gray-500 hover:text-gray-800 px-2 py-1.5 rounded-lg bg-white border border-gray-200 font-bold text-xs">
                        <X size={12} />
                      </button>
                    </form>
                  )}
                  <select
                    value={pickForm.subCategory}
                    onChange={e => setPickForm({ ...pickForm, subCategory: e.target.value, brand: '' })}
                    className="w-full py-2 px-3 border border-gray-200 rounded-lg outline-none font-bold text-gray-900 bg-white mb-2"
                  >
                    <option value="">-- Select Sub Category --</option>
                    {(rawMenus.find(m => m.name === pickForm.category)?.subCategories || []).map((sub: any) => (
                      <option key={sub.id} value={sub.name}>{sub.name}</option>
                    ))}
                  </select>

                  <div className="flex items-center justify-between mt-2 mb-1">
                    <label className="font-bold text-gray-700 uppercase">Select Brand</label>
                    <button
                      type="button"
                      onClick={() => setIsAddingBrand(true)}
                      className="flex items-center gap-1 text-[10px] font-bold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-lg transition-all border border-purple-200"
                    >
                      <Plus size={11} /> Add Brand
                    </button>
                  </div>
                  {isAddingBrand && (
                    <form onSubmit={handleAddBrand} className="mb-2 flex gap-2 p-2.5 bg-purple-50 border border-purple-200 rounded-lg">
                      <input type="text" autoFocus placeholder="e.g. Asus, Dell..." value={newBrandName} onChange={e => setNewBrandName(e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-purple-200" />
                      <button type="submit" disabled={savingBrand || !newBrandName.trim()} className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 transition-all">
                        <CheckCircle size={12} /> Save
                      </button>
                      <button type="button" onClick={() => { setIsAddingBrand(false); setNewBrandName(''); }} className="text-gray-500 hover:text-gray-800 px-2 py-1.5 rounded-lg bg-white border border-gray-200 font-bold text-xs">
                        <X size={12} />
                      </button>
                    </form>
                  )}
                  <select
                    value={pickForm.brand}
                    onChange={e => setPickForm({ ...pickForm, brand: e.target.value })}
                    className="w-full py-2 px-3 border border-gray-200 rounded-lg outline-none font-bold text-gray-900 bg-white"
                  >
                    <option value="">-- Select Brand --</option>
                    {globalBrands.map((b: any) => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <input 
                      type="text" 
                      list="product-names-list" 
                      placeholder="Product Name *" 
                      value={pickForm.name} 
                      onChange={e => setPickForm({...pickForm, name: e.target.value})} 
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleBarcodeScan(); } }}
                      className="w-full py-2 px-3 border border-gray-200 rounded-lg outline-none text-xs font-bold" 
                    />
                    <datalist id="product-names-list">
                      {Array.from(new Set(products.map(p => p.name).filter(Boolean))).map((n, i) => <option key={i} value={n} />)}
                    </datalist>
                    
                    <input 
                      type="text" 
                      list="product-models-list" 
                      placeholder="Model (Optional)" 
                      value={pickForm.model} 
                      onChange={e => setPickForm({...pickForm, model: e.target.value})} 
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleBarcodeScan(); } }}
                      className="w-full py-2 px-3 border border-gray-200 rounded-lg outline-none text-xs font-bold" 
                    />
                    <datalist id="product-models-list">
                      {Array.from(new Set(products.map(p => p.model).filter(Boolean))).map((m, i) => <option key={i} value={m} />)}
                    </datalist>
                  </div>
                  
                  <input 
                    type="text" 
                    list="product-variants-list" 
                    placeholder="Variant (Optional)" 
                    value={pickForm.variant} 
                    onChange={e => setPickForm({...pickForm, variant: e.target.value})} 
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleBarcodeScan(); } }}
                    className="w-full py-2 px-3 border border-gray-200 rounded-lg outline-none text-xs font-bold mt-2" 
                  />
                  <datalist id="product-variants-list">
                      {Array.from(new Set(products.flatMap(p => p.variants?.map(v => v.name) || []).filter(Boolean))).map((v, i) => <option key={i} value={v} />)}
                  </datalist>
                  
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <input 
                      type="number" 
                      min={0} 
                      placeholder="Cost Price (Optional)" 
                      value={pickForm.costPrice} 
                      onChange={e => setPickForm({...pickForm, costPrice: e.target.value})} 
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleBarcodeScan(); } }}
                      className="w-full py-2 px-3 border border-gray-200 rounded-lg outline-none text-xs font-bold" 
                    />
                    <input 
                      type="number" 
                      min={0} 
                      placeholder="Sales Price (Optional)" 
                      value={pickForm.salesPrice} 
                      onChange={e => setPickForm({...pickForm, salesPrice: e.target.value})} 
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleBarcodeScan(); } }}
                      className="w-full py-2 px-3 border border-gray-200 rounded-lg outline-none text-xs font-bold text-blue-600" 
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Scan Barcode / Enter SKU (Optional)..."
                      value={pickForm.barcode}
                      onChange={e => setPickForm({...pickForm, barcode: e.target.value})}
                      onKeyDown={(e) => {
                         if (e.key === 'Enter') {
                            e.preventDefault();
                            handleBarcodeScan();
                         }
                      }}
                      className="w-full pl-10 pr-3 py-3 border-2 border-green-500 rounded-lg outline-none focus:ring-4 focus:ring-green-100 font-bold"
                      autoFocus
                    />
                    <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600" size={18} />
                  </div>
                  <button
                    type="button"
                    onClick={handleBarcodeScan}
                    className="bg-green-600 hover:bg-green-700 text-white px-5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <Plus size={18} /> Add
                  </button>
                </div>
              </div>

              {/* Product Catalog List */}
              <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
                {filteredCatalogProducts.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-xs">
                    No products found in this category.
                  </div>
                ) : (
                  filteredCatalogProducts.map(product => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-xl bg-white hover:border-[#EF4444] transition-all shadow-xs"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <span className="font-bold text-xs text-gray-900 block truncate">{product.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-black text-gray-700">
                            Cost: {formatCurrency(product.costPrice || product.price * 0.8, settings)}
                          </span>
                          <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.2 rounded">
                            Current Stock: {product.stock}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => addItemToPurchase(product)}
                        className="p-2 rounded-lg font-bold text-xs bg-[#081621] hover:bg-[#EF4444] text-white shadow-xs transition-all flex items-center gap-1 shrink-0"
                      >
                        <Plus size={14} /> Add
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PURCHASE HISTORY TABLE ── */}
      {/* ── PURCHASE HISTORY TABLE ── */}
      <div className="bg-white rounded-2xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden flex flex-col">
        {/* Table Filters */}
        <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <select
                value={vendorFilter}
                onChange={e => { setVendorFilter(e.target.value); setCurrentPage(1); }}
                className="py-2.5 px-4 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="all">-- All Suppliers --</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={workOrderFilter}
                onChange={e => { setWorkOrderFilter(e.target.value); setCurrentPage(1); }}
                className="py-2.5 px-4 text-xs bg-indigo-50/70 border border-indigo-200 rounded-xl outline-none font-bold text-indigo-800 focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <option value="all">-- All Work Orders / Projects --</option>
                {discoveredScopes.map(s => (
                  <option key={s.key} value={s.key}>
                    {s.workOrderNumber ? `WO #${s.workOrderNumber}` : 'Project'}
                    {s.projectName ? ` — ${s.projectName}` : ''}
                    {s.clientName && s.clientName !== s.projectName ? ` (${s.clientName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">From</label>
              <input
                type="date"
                value={startDate}
                onChange={e => { setStartDate(e.target.value); setCurrentPage(1); }}
                className="border-none bg-transparent text-xs font-bold text-slate-800 p-0 focus:ring-0 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">To</label>
              <input
                type="date"
                value={endDate}
                onChange={e => { setEndDate(e.target.value); setCurrentPage(1); }}
                className="border-none bg-transparent text-xs font-bold text-slate-800 p-0 focus:ring-0 outline-none"
              />
            </div>
          </div>

          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Search purchase #, supplier..."
              value={searchHistory}
              onChange={e => { setSearchHistory(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          </div>
        </div>

        {/* Purchases Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Purchase #</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Supplier / Vendor</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap text-center">Items Qty</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">Total Bill</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">Paid Amount</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">Due Balance</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap text-center">Prepared By</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-400 font-medium">Loading purchase records...</td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-400 italic font-medium">
                    No purchase records match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredPurchases.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((pur, idx) => {
                  const totalQty = pur.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0;
                  const due = Math.max(0, (pur.total || 0) - (pur.paidAmount || 0));
                  return (
                    <tr key={pur.id || idx} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 font-black font-mono text-xs text-slate-900">
                        {pur.documentNumber}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500 whitespace-nowrap">
                        {new Date(pur.date || pur.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {pur.vendorName}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {pur.reference && (
                            <span className="text-[10px] text-slate-400 font-mono font-medium">Challan: #{pur.reference}</span>
                          )}
                          {pur.workOrderNumber && (
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                const k = `wo:${pur.workOrderNumber!.trim().replace(/^#+/, '').toLowerCase()}`;
                                setWorkOrderFilter(prev => (prev === k ? 'all' : k));
                                setCurrentPage(1);
                              }}
                              title="Click to filter by this Work Order"
                              className="text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-1.5 py-0.5 rounded font-mono cursor-pointer transition-colors"
                            >
                              WO: #{pur.workOrderNumber}
                            </button>
                          )}
                          {(pur.projectName || pur.branchName) && (
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                if (!pur.workOrderNumber) {
                                  const k = `proj:${(pur.projectName || pur.branchName || '').trim().toLowerCase()}`;
                                  setWorkOrderFilter(prev => (prev === k ? 'all' : k));
                                  setCurrentPage(1);
                                }
                              }}
                              className="text-[10px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-1.5 py-0.5 rounded"
                            >
                              {pur.projectName || pur.branchName}
                            </button>
                          )}
                          {pur.customerName &&
                            pur.customerName.trim().toLowerCase() !==
                              (pur.projectName || pur.branchName || '').trim().toLowerCase() && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                Client: {pur.customerName}
                              </span>
                            )}
                          {pur.attachmentUrl && (
                            <a
                              href={pur.attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-1.5 py-0.5 rounded transition-colors"
                              title="View supplier invoice / challan document"
                            >
                              <Paperclip size={10} /> Bill Copy
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-xs font-bold text-slate-600">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-full">{totalQty} Units</span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-black text-slate-900">
                        {formatCurrency(pur.total, settings)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-emerald-600">
                        {formatCurrency(pur.paidAmount, settings)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {due > 0 ? (
                          <span className="font-black text-sm text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
                            {formatCurrency(due, settings)}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-bold">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                          pur.paymentStatus === 'paid' ? "bg-emerald-100 text-emerald-700" :
                          pur.paymentStatus === 'partial' ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        )}>
                          {pur.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                        {pur.createdBy || "Admin"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setViewingPurchase(pur)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-200 shadow-sm opacity-100 md:opacity-70 group-hover:opacity-100"
                          title="View Purchase Bill"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                             e.stopPropagation();
                             setPurchaseForm({
                                 id: pur.id,
                                 documentNumber: pur.documentNumber,
                                 vendorId: pur.vendorId,
                                 vendorName: pur.vendorName,
                                 date: (pur.date || pur.createdAt || new Date().toISOString()).split('T')[0],
                                 reference: pur.reference || '',
                                 workOrderNumber: pur.workOrderNumber || '',
                                 projectName: pur.projectName || pur.branchName || '',
                                 customerId: pur.customerId || '',
                                 customerName: pur.customerName || '',
                                 items: pur.items || [],
                                 paymentAccountId: pur.paymentAccountId || '',
                                 paymentMethod: pur.paymentMethod || 'cash',
                                 paidAmount: pur.paidAmount || 0,
                                 isChequePayment: Boolean(pur.isChequePayment),
                                 chequeNumber: pur.chequeNumber || '',
                                 chequeClearingDate: pur.chequeClearingDate || new Date().toISOString().split('T')[0],
                                 shippingCost: pur.shippingCost || 0,
                                 discountAmount: pur.discountAmount || 0,
                                 attachmentUrl: pur.attachmentUrl || '',
                                 notes: pur.notes || '',
                                 createdBy: pur.createdBy || '',
                             });
                             setIsCreatingPurchase(true);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-200 shadow-sm opacity-100 md:opacity-70 group-hover:opacity-100"
                          title="Edit Purchase"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={async (e) => {
                             e.stopPropagation();
                             if (!window.confirm('Delete this purchase? This will revert stock and delete related transactions.')) return;
                             try {
                                 for (const item of (pur.items || [])) {
                                     const prodRef = doc(db, 'products', item.id);
                                     const pData = products.find((p: any) => p.id === item.id);
                                     if (pData) {
                                         await updateDoc(prodRef, { stock: increment(-(Number(item.quantity) || 0)) });
                                     }
                                 }
                                 const snap = await getDocs(query(collection(db, 'transactions'), where('referenceId', '==', pur.id))); const archivedTxs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                                 for (const d of snap.docs) {
                                     await deleteDoc(doc(db, 'transactions', d.id));
                                 }
                                 const pAny = pur as any; await moveToTrash({ category: 'purchases', subCategory: 'Purchase Bill', collectionName: 'purchases', entityId: pur.id, title: `${pAny.purchaseNumber || pAny.documentNumber || pAny.invoiceNumber || pur.id} — ${pAny.supplierName || pur.vendorName || 'Supplier'}`, subtitle: `${(pur.items || []).length} item(s) • Paid: ৳${Number(pur.paidAmount || 0).toLocaleString()} • Due: ৳${Number(pAny.dueAmount ?? Math.max(0, Number(pur.total || 0) - Number(pur.paidAmount || 0))).toLocaleString()}`, amount: Number(pAny.totalAmount || pur.total || 0), data: pur, relatedData: { transactions: archivedTxs }, deletedBy: auth.currentUser?.displayName || auth.currentUser?.email || 'Admin', details: `Deleted purchase bill #${pAny.purchaseNumber || pAny.documentNumber || pAny.invoiceNumber || pur.id}` }); await deleteDoc(doc(db, 'purchases', pur.id));
                                 toast.success('Purchase deleted!');
                                 fetchData();
                             } catch(err) {
                                 toast.error('Failed to delete purchase');
                             }
                          }}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-200 shadow-sm opacity-100 md:opacity-70 group-hover:opacity-100"
                          title="Delete Purchase"
                        >
                          <Trash2 size={16} />
                        </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-6 bg-white border-t border-slate-100 rounded-b-2xl">
          <Pagination
            currentPage={currentPage}
            totalItems={filteredPurchases.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>
      </div>

      {/* Purchase Detail Modal */}
      {viewingPurchase && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden">
            <div className="p-5 bg-[#081621] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <ShoppingBag size={16} className="text-[#EF4444]" /> Purchase Voucher #{viewingPurchase.documentNumber}
                </h3>
                <span className="text-[10px] text-gray-300">
                  Supplier: {viewingPurchase.vendorName} | Date: {new Date(viewingPurchase.date || viewingPurchase.createdAt).toLocaleDateString()} | By: {viewingPurchase.createdBy || 'Admin'}
                </span>
              </div>
              <button onClick={() => setViewingPurchase(null)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {(viewingPurchase.workOrderNumber ||
                viewingPurchase.projectName ||
                viewingPurchase.branchName ||
                viewingPurchase.customerName) && (
                <div className="flex flex-wrap items-center gap-2 bg-indigo-50/70 border border-indigo-200 rounded-xl px-3.5 py-2.5 text-[11px] font-bold">
                  {viewingPurchase.workOrderNumber && (
                    <span className="px-2 py-0.5 bg-indigo-600 text-white rounded font-mono">
                      WO #{viewingPurchase.workOrderNumber}
                    </span>
                  )}
                  {(viewingPurchase.projectName || viewingPurchase.branchName) && (
                    <span className="px-2 py-0.5 bg-cyan-50 text-cyan-800 border border-cyan-200 rounded">
                      Project: {viewingPurchase.projectName || viewingPurchase.branchName}
                    </span>
                  )}
                  {viewingPurchase.customerName && (
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
                      Customer: {viewingPurchase.customerName}
                    </span>
                  )}
                </div>
              )}

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 font-bold text-gray-600 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2">Item Name</th>
                      <th className="px-4 py-2 text-right">Cost Price</th>
                      <th className="px-4 py-2 text-center">Qty</th>
                      <th className="px-4 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {viewingPurchase.items?.map((item, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 font-bold text-gray-900">{item.name}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(item.purchasePrice, settings)}</td>
                        <td className="px-4 py-2 text-center font-bold">{item.quantity} {item.unit || 'pcs'}</td>
                        <td className="px-4 py-2 text-right font-black text-gray-900">
                          {formatCurrency(item.purchasePrice * item.quantity, settings)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-1">
                {Number(viewingPurchase.subtotal || 0) > 0 && (
                  <div className="flex justify-between text-gray-600 font-medium text-xs">
                    <span>Items Subtotal:</span>
                    <span className="font-bold text-gray-900">{formatCurrency(viewingPurchase.subtotal || 0, settings)}</span>
                  </div>
                )}
                {Number(viewingPurchase.discountAmount || 0) > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold text-xs">
                    <span>Supplier Discount:</span>
                    <span>- {formatCurrency(viewingPurchase.discountAmount || 0, settings)}</span>
                  </div>
                )}
                {Number(viewingPurchase.shippingCost || 0) > 0 && (
                  <div className="flex justify-between text-indigo-700 font-bold text-xs">
                    <span className="flex items-center gap-1.5"><Truck size={13} className="text-indigo-600" /> Shipping / Additional Cost:</span>
                    <span>+ {formatCurrency(viewingPurchase.shippingCost || 0, settings)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold pt-1 border-t border-gray-200">
                  <span>Total Purchase Bill:</span>
                  <span className="text-[#EF4444]">{formatCurrency(viewingPurchase.total, settings)}</span>
                </div>
                <div className="flex justify-between text-green-700 font-bold">
                  <span>Paid Amount:</span>
                  <span>{formatCurrency(viewingPurchase.paidAmount, settings)}</span>
                </div>
                <div className="flex justify-between text-red-600 font-black pt-1 border-t border-gray-200">
                  <span>Due Payable:</span>
                  <span>{formatCurrency(Math.max(0, viewingPurchase.total - viewingPurchase.paidAmount), settings)}</span>
                </div>
              </div>

              {/* Original Bill / Memo Attachment Preview */}
              {viewingPurchase.attachmentUrl && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800 flex items-center gap-1.5 text-xs">
                      <Paperclip size={14} className="text-blue-600" /> Supplier Invoice / Bill Attachment:
                    </span>
                    <a
                      href={viewingPurchase.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 bg-white border border-blue-200 px-2.5 py-1 rounded-lg shadow-xs hover:bg-blue-50 transition-colors"
                    >
                      View Original Size <ExternalLink size={12} />
                    </a>
                  </div>
                  <div className="max-h-56 overflow-hidden rounded-lg border border-gray-200 bg-white flex items-center justify-center p-2">
                    <img
                      src={viewingPurchase.attachmentUrl}
                      alt="Supplier Bill Attachment"
                      className="max-h-52 w-auto object-contain rounded transition-transform"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                {setActiveTab &&
                (viewingPurchase.workOrderNumber ||
                  viewingPurchase.projectName ||
                  viewingPurchase.branchName ||
                  viewingPurchase.customerId) ? (
                  <button
                    type="button"
                    onClick={() => {
                      const targetProj = viewingPurchase.projectName || viewingPurchase.branchName || '';
                      const matchedCust = customers.find(
                        c =>
                          (viewingPurchase.customerId && c.id === viewingPurchase.customerId) ||
                          (viewingPurchase.customerName &&
                            c.name.trim().toLowerCase() === viewingPurchase.customerName.trim().toLowerCase()) ||
                          (targetProj && c.name.trim().toLowerCase() === targetProj.trim().toLowerCase())
                      );
                      localStorage.setItem(
                        'sales_form_draft',
                        JSON.stringify({
                          customerId: matchedCust?.id || viewingPurchase.customerId || '',
                          customerName:
                            matchedCust?.name || viewingPurchase.customerName || targetProj || '',
                          customerPhone: matchedCust?.phone || '',
                          customerEmail: matchedCust?.email || '',
                          shippingAddress: matchedCust?.address || '',
                          workOrderNumber: viewingPurchase.workOrderNumber || '',
                          branchName: targetProj,
                          notes: viewingPurchase.workOrderNumber
                            ? `Ref Work Order #${viewingPurchase.workOrderNumber}`
                            : targetProj
                            ? `Ref Project: ${targetProj}`
                            : '',
                          items: [],
                        })
                      );
                      setViewingPurchase(null);
                      setActiveTab('sales');
                      toast.success('Loaded Work Order / Customer into Sales Form!');
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    Bill / Create Sale for This WO <ArrowRight size={14} />
                  </button>
                ) : (
                  <span />
                )}
                <button
                  onClick={() => setViewingPurchase(null)}
                  className="px-5 py-2 bg-gray-800 hover:bg-black text-white font-bold rounded-lg transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <CustomerAdvanceModal
        isOpen={showAdvanceModal}
        onClose={() => setShowAdvanceModal(false)}
        customers={customers}
        paymentAccounts={paymentAccounts}
        transactions={transactions}
        workOrders={workOrders}
        initialCustomer={activePurchaseContext.matchedCustomer}
        initialCustomerName={
          purchaseForm.customerName || activePurchaseContext.matchedCustomer?.name || ''
        }
        initialWorkOrderNumber={activePurchaseContext.cleanWO}
        initialProjectName={activePurchaseContext.cleanProj}
        onCustomerCreated={newCust => {
          setCustomers(prev => (prev.some(c => c.id === newCust.id) ? prev : [...prev, newCust]));
          setPurchaseForm(prev => ({
            ...prev,
            customerId: newCust.id,
            customerName: newCust.name,
            projectName: prev.projectName || newCust.branchName || newCust.name,
          }));
        }}
        onSuccess={async () => {
          await loadData();
          await fetchData();
        }}
      />
    </div>
  );
};

export default Purchases;
