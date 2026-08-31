import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, getDocs, query, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { Product, Vendor, Transaction, SiteSettings, PaymentAccount } from '../../../../types';
import { formatCurrency, cn } from '../../../../lib/utils';
import { toast } from 'react-hot-toast';
import {
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
} from 'lucide-react';
import { generateDocumentNumber } from '../../../../lib/numbering';
import { Pagination } from '../../../../components/common/Pagination';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PurchaseItem {
  id: string;
  name: string;
  category?: string;
  images?: string[];
  purchasePrice: number;
  salesPrice?: number;
  quantity: number;
  hasWarranty?: boolean;
  warrantyYears?: number;
  hasSerialTracking?: boolean;
  newSerials?: string | string[];
  sku?: string;
}

interface PurchaseRecord {
  id: string;
  documentNumber: string;
  vendorId: string;
  vendorName: string;
  date: string;
  items: PurchaseItem[];
  subtotal: number;
  total: number;
  paidAmount: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  paymentAccountId?: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  createdAt: string;
}

interface PurchasesProps {
  vendors?: Vendor[];
  products?: Product[];
  transactions?: Transaction[];
  settings?: SiteSettings;
  setSelectedLedgerEntity?: (entity: { id: string; name: string; type: string }) => void;
  setActiveTab?: (tab: string) => void;
  fetchData?: () => Promise<void>;
}

const Purchases: React.FC<PurchasesProps> = ({
  vendors: initialVendors = [],
  products: initialProducts = [],
  settings,
  setSelectedLedgerEntity,
  setActiveTab,
  fetchData = async () => {},
}) => {
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Purchase Form State
  const [isCreatingPurchase, setIsCreatingPurchase] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [productCatalogSearch, setProductCatalogSearch] = useState<string>('');

  // Quick Add Product
  const [isQuickAddingProduct, setIsQuickAddingProduct] = useState(false);
  const [quickProductData, setQuickProductData] = useState({ name: '', sku: '', model: '', category: '', costPrice: 0, price: 0, stock: 0, hasWarranty: false, warrantyMonths: 0 });

  const [purchaseForm, setPurchaseForm] = useState({
    vendorId: '',
    vendorName: '',
    date: new Date().toISOString().split('T')[0],
    reference: '',
    items: [] as PurchaseItem[],
    paymentAccountId: '',
    paymentMethod: 'cash',
    paidAmount: 0,
    notes: '',
  });

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
      const [venSnap, prodSnap, accSnap, purSnap, catSnap, brandSnap] = await Promise.all([
        getDocs(query(collection(db, 'vendors'), orderBy('name'))),
        getDocs(query(collection(db, 'products'), orderBy('name'))),
        getDocs(query(collection(db, 'payment_accounts'), orderBy('name'))),
        getDocs(query(collection(db, 'purchases'), orderBy('createdAt', 'desc'))).catch(() => ({ docs: [] })),
        getDocs(query(collection(db, 'menus'))).catch(() => ({ docs: [] })),
        getDocs(query(collection(db, 'brands'))).catch(() => ({ docs: [] })),
      ]);

      const vens = venSnap.docs.map(d => ({ id: d.id, ...d.data() } as Vendor));
      const prods = prodSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      const accs = accSnap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentAccount));
      const purs = purSnap.docs.map(d => ({ id: d.id, ...d.data() } as PurchaseRecord));
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
      setProducts(prods);
      setPaymentAccounts(accs);
      setPurchaseHistory(purs);
      setSavedCategories(cats);

      if (accs.length > 0 && !purchaseForm.paymentAccountId) {
        setPurchaseForm(prev => ({
          ...prev,
          paymentAccountId: accs[0].id,
          paymentMethod: accs[0].type || 'cash',
        }));
      }
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

  // Quick Add Product: create product in Firestore and add to purchase list
  const handleBarcodeScan = async () => {
    const { category, subCategory, brand, name, model, variant, barcode, costPrice, salesPrice } = pickForm;
    const scannedCode = barcode.trim();
    if (!scannedCode) return;
    if (!category) { toast.error('Please select a category first'); return; }

    const existingItemIndex = purchaseForm.items.findIndex((i: any) => i.sku === scannedCode || (Array.isArray(i.newSerials) && i.newSerials.includes(scannedCode)));
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
            warrantyYears: existingProduct.warrantyMonths ? existingProduct.warrantyMonths / 12 : 0,
            hasSerialTracking: Boolean(existingProduct.hasSerialTracking),
            sku: existingProduct.sku || scannedCode,
            newSerials: scannedCode !== existingProduct.sku ? [scannedCode] : [],
          }]
       }));
       setPickForm(prev => ({ ...prev, barcode: '' }));
       toast.success('Product added to purchase');
       return;
    }

    if (!name) { toast.error('Product Name is required for new items'); return; }
    setPurchaseForm(prev => ({
      ...prev, 
      items: [...prev.items, {
        id: 'NEW_' + Math.random().toString(36).substring(2, 9),
        name: name + (model ? ' ' + model : '') + (variant ? ' ' + variant : ''),
        category: category,
        purchasePrice: Number(costPrice) || 0,
        salesPrice: Number(salesPrice) || 0,
        quantity: 1,
        discount: 0,
        tax: 0,
        total: Number(costPrice) || 0,
        warrantyYears: 0,
        hasSerialTracking: true,
        sku: scannedCode,
        newSerials: [scannedCode],
      }]
    }));
    setPickForm(prev => ({ ...prev, barcode: '' }));
    toast.success('New item drafted to purchase');
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
      const docRef = await addDoc(collection(db, 'products'), productData);
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

  // Compute bill total
  const billTotal = purchaseForm.items.reduce((sum, item) => sum + (item.purchasePrice * item.quantity), 0);

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
            warrantyYears: product.warrantyMonths ? Math.round(product.warrantyMonths / 12) : 1,
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

    try {
      setSubmitting(true);
      const docNumber = await generateDocumentNumber('PUR');
      const createdAt = new Date().toISOString();
      const paid = Math.min(billTotal, Math.max(0, Number(purchaseForm.paidAmount) || 0));
      const paymentStatus: 'paid' | 'partial' | 'unpaid' =
        paid >= billTotal ? 'paid' : (paid > 0 ? 'partial' : 'unpaid');

      // 1. Update Product Inventory & Stock & Cost Price
      for (const item of purchaseForm.items) {
        const productRef = doc(db, 'products', item.id);
        const currentProduct = products.find(p => p.id === item.id);

        if (currentProduct) {
          const updates: any = {
            stock: (currentProduct.stock || 0) + Number(item.quantity),
            costPrice: Number(item.purchasePrice),
          };

          if (item.salesPrice) {
            updates.price = Number(item.salesPrice);
          }

          if (item.hasWarranty && item.warrantyYears) {
            updates.warrantyMonths = Number(item.warrantyYears) * 12;
          }

          if (currentProduct.hasSerialTracking && item.newSerials) {
            const addedSerials = Array.isArray(item.newSerials)
              ? item.newSerials.filter((s: string) => s.trim())
              : String(item.newSerials)
                  .split(/[\n,]/)
                  .map((s: string) => s.trim())
                  .filter((s: string) => s);

            updates.availableSerials = [...(currentProduct.availableSerials || []), ...addedSerials];
          }

          await updateDoc(productRef, updates);
        }
      }

      // 2. Save Purchase Record to Firestore `purchases`
      const selectedAcc = paymentAccounts.find(a => a.id === purchaseForm.paymentAccountId);
      const purchaseRecord: Omit<PurchaseRecord, 'id'> = {
        documentNumber: docNumber,
        vendorId: purchaseForm.vendorId,
        vendorName: purchaseForm.vendorName,
        date: new Date(purchaseForm.date).toISOString(),
        items: purchaseForm.items,
        subtotal: billTotal,
        total: billTotal,
        paidAmount: paid,
        paymentStatus,
        paymentAccountId: selectedAcc?.id || '',
        paymentMethod: selectedAcc?.type || selectedAcc?.name || purchaseForm.paymentMethod || 'cash',
        reference: purchaseForm.reference || '',
        notes: purchaseForm.notes || '',
        createdAt,
      };

      const purchaseDocRef = await addDoc(collection(db, 'purchases'), purchaseRecord);

      // 3. Record Outflow in Firestore `transactions`
      if (paid > 0) {
        await addDoc(collection(db, 'transactions'), {
          type: 'purchase',
          amount: paid,
          date: new Date(purchaseForm.date).toISOString(),
          description: `Purchase from ${purchaseForm.vendorName} (#${docNumber})`,
          entityId: purchaseForm.vendorId,
          entityName: purchaseForm.vendorName,
          entityType: 'vendor',
          referenceId: purchaseDocRef.id,
          documentNumber: docNumber,
          paymentAccountId: selectedAcc?.id || '',
          paymentMethod: selectedAcc?.type || selectedAcc?.name || purchaseForm.paymentMethod || 'cash',
          createdAt,
        });
      }

      toast.success(`Purchase #${docNumber} recorded & inventory restocked successfully!`);

      // Reset form
      setIsCreatingPurchase(false);
      setPurchaseForm({
        vendorId: '',
        vendorName: '',
        date: new Date().toISOString().split('T')[0],
        reference: '',
        items: [],
        paymentAccountId: paymentAccounts[0]?.id || '',
        paymentMethod: paymentAccounts[0]?.type || 'cash',
        paidAmount: 0,
        notes: '',
      });

      loadData();
      fetchData();
    } catch (error) {
      console.error('Error recording purchase:', error);
      toast.error('Failed to record purchase');
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

    if (searchHistory.trim()) {
      const q = searchHistory.toLowerCase();
      const matchesDoc = (pur.documentNumber || '').toLowerCase().includes(q);
      const matchesVen = (pur.vendorName || '').toLowerCase().includes(q);
      const matchesRef = (pur.reference || '').toLowerCase().includes(q);
      if (!matchesDoc && !matchesVen && !matchesRef) return false;
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
    ]);

    autoTable(doc, {
      startY: 36,
      head: [['Purchase #', 'Date', 'Supplier', 'Items', 'Total Bill', 'Paid', 'Due', 'Status']],
      body: body,
      theme: 'striped',
      headStyles: { fillColor: [8, 22, 33] },
      styles: { fontSize: 7 },
    });

    doc.save(`Purchase_Report_${startDate}_to_${endDate}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* ── TOP ACTION & SUMMARY BAR ── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShoppingBag className="text-[#EF4444]" /> Product Purchases & Restocking
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Procure inventory stock from suppliers, update cost prices, register serial numbers, and track vendor bills.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportToCSV}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <Download size={13} /> CSV
            </button>
            <button
              onClick={exportToPDF}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <Printer size={13} /> PDF
            </button>
            <button
              onClick={() => setIsCreatingPurchase(!isCreatingPurchase)}
              className="bg-[#081621] hover:bg-[#EF4444] text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
            >
              {isCreatingPurchase ? <X size={15} /> : <Plus size={15} />}
              {isCreatingPurchase ? 'Close Purchase Form' : 'New Product Purchase'}
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
                  <Boxes className="text-[#EF4444]" /> Purchase Voucher & Supplier Bill
                </h3>
                <span className="text-xs text-gray-400">Restocks Inventory on Save</span>
              </div>

              <form onSubmit={handleSavePurchase} className="space-y-6 text-xs">
                {/* Vendor, Date & Reference */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                      className="w-full border border-gray-200 rounded-lg p-2.5 font-bold text-gray-900"
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
                      className="w-full border border-gray-200 rounded-lg p-2.5 font-medium"
                    />
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
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1">
                              <span className="font-bold text-gray-900 block text-xs">{item.name}</span>
                              <span className="text-[10px] text-gray-400">Category: {item.category}</span>
                            </div>

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
                            </div>

                            {/* Sales Price */}
                            <div>
                              <label className="block text-[9px] font-bold text-blue-500 uppercase">Sales Price (৳)</label>
                              <input
                                type="number"
                                min={1}
                                value={item.salesPrice || 0}
                                onChange={e => updateItem(item.id, 'salesPrice', Number(e.target.value))}
                                className="w-20 text-right border border-blue-200 bg-blue-50/50 rounded p-1 font-black text-blue-900 focus:ring-blue-500"
                              />
                            </div>

                            {/* Quantity */}
                            <div>
                              <label className="block text-[9px] font-bold text-gray-500 uppercase">Qty</label>
                              <input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={e => updateItem(item.id, 'quantity', Math.max(1, Number(e.target.value)))}
                                className="w-16 text-center border border-gray-200 rounded p-1 font-bold"
                              />
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

                          {/* Serial Numbers Input if serial tracking enabled */}
                          {item.hasSerialTracking && (
                            <div className="border-t border-gray-200 pt-3 mt-3">
                              <label className="block text-xs font-bold text-gray-700 uppercase mb-2 flex justify-between items-center">
                                <span>Barcode / Serial Scanning</span>
                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Scanned: {Array.isArray(item.newSerials) ? item.newSerials.length : 0}</span>
                              </label>
                              
                              <div className="flex gap-2 mb-2">
                                <div className="relative flex-1">
                                  <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                  <input
                                    type="text"
                                    placeholder="Scan barcode and press Enter..."
                                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const val = e.currentTarget.value.trim();
                                        if (val) {
                                          const currentSerials = Array.isArray(item.newSerials) ? item.newSerials : [];
                                          if (!currentSerials.includes(val)) {
                                            const updatedSerials = [...currentSerials, val];
                                            setPurchaseForm(prev => ({
                                              ...prev,
                                              items: prev.items.map(i => 
                                                i.id === item.id 
                                                  ? { ...i, newSerials: updatedSerials, quantity: updatedSerials.length } 
                                                  : i
                                              )
                                            }));
                                            e.currentTarget.value = ''; // clear input
                                          } else {
                                            toast.error('Barcode already scanned!');
                                            e.currentTarget.value = '';
                                          }
                                        }
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                              
                              {/* Scanned Badges */}
                              {Array.isArray(item.newSerials) && item.newSerials.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                  {item.newSerials.map((serial, sIdx) => (
                                    <span key={sIdx} className="inline-flex items-center gap-1 bg-white border border-gray-200 text-gray-700 text-[10px] font-mono px-2 py-1 rounded-md shadow-sm">
                                      {serial}
                                      <button 
                                        type="button" 
                                        className="text-gray-400 hover:text-red-500"
                                        onClick={() => {
                                          const updatedSerials = (item.newSerials as string[]).filter((_, idx) => idx !== sIdx);
                                          setPurchaseForm(prev => ({
                                            ...prev,
                                            items: prev.items.map(i => 
                                              i.id === item.id 
                                                ? { ...i, newSerials: updatedSerials, quantity: Math.max(1, updatedSerials.length) } 
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
                              )}
                              
                              <p className="text-[10px] text-gray-500 mt-1">
                                Scanning a barcode will automatically increase the quantity.
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Payment Section */}
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
                        {paymentAccounts.map(a => (
                          <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                        ))}
                      </select>
                    </div>

                    <div className="pt-2">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                        Purchase Notes (Optional)
                      </label>
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
                    <span className="font-bold text-gray-700 uppercase block">Disbursement / Paid Amount</span>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                        Paid Amount (৳) — Bill: {formatCurrency(billTotal, settings)}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={purchaseForm.paidAmount || ''}
                        onChange={e => setPurchaseForm({ ...purchaseForm, paidAmount: Number(e.target.value) || 0 })}
                        className="w-full border border-gray-200 rounded-lg p-2 font-black text-gray-900 text-sm"
                      />
                    </div>
                    {billTotal > purchaseForm.paidAmount && (
                      <div className="flex justify-between items-center text-xs font-bold text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                        <span>Supplier Due Payable:</span>
                        <span>{formatCurrency(billTotal - purchaseForm.paidAmount, settings)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bill Total & Submit */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex justify-between items-center">
                  <span className="font-bold text-gray-700 uppercase">Total Purchase Bill</span>
                  <span className="text-xl font-black text-[#EF4444]">{formatCurrency(billTotal, settings)}</span>
                </div>

                <button
                  type="submit"
                  disabled={submitting || purchaseForm.items.length === 0 || !purchaseForm.vendorId}
                  className="w-full bg-[#081621] hover:bg-[#EF4444] disabled:opacity-50 text-white py-3.5 rounded-xl font-black text-sm transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} />
                  {submitting ? 'Restocking Inventory...' : 'Confirm Purchase & Restock Inventory'}
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
                    className="w-full py-2 px-3 border border-gray-200 rounded-lg outline-none font-bold text-gray-900 bg-white"
                  >
                    <option value="">-- Select Category * --</option>
                    {rawMenus.map((c: any) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>

                  <select
                    value={pickForm.subCategory}
                    onChange={e => setPickForm({ ...pickForm, subCategory: e.target.value, brand: '' })}
                    className="w-full py-2 px-3 border border-gray-200 rounded-lg outline-none font-bold text-gray-900 bg-white mt-2"
                  >
                    <option value="">-- Select Sub Category --</option>
                    {(rawMenus.find(m => m.name === pickForm.category)?.subCategories || []).map((sub: any) => (
                      <option key={sub.id} value={sub.name}>{sub.name}</option>
                    ))}
                  </select>

                  <select
                    value={pickForm.brand}
                    onChange={e => setPickForm({ ...pickForm, brand: e.target.value })}
                    className="w-full py-2 px-3 border border-gray-200 rounded-lg outline-none font-bold text-gray-900 bg-white mt-2"
                  >
                    <option value="">-- Select Brand --</option>
                    {globalBrands.map((b: any) => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <input type="text" placeholder="Product Name" value={pickForm.name} onChange={e => setPickForm({...pickForm, name: e.target.value})} className="w-full py-2 px-3 border border-gray-200 rounded-lg outline-none text-xs font-bold" />
                    <input type="text" placeholder="Model (Optional)" value={pickForm.model} onChange={e => setPickForm({...pickForm, model: e.target.value})} className="w-full py-2 px-3 border border-gray-200 rounded-lg outline-none text-xs font-bold" />
                  </div>
                  
                  <input type="text" placeholder="Variant (Optional)" value={pickForm.variant} onChange={e => setPickForm({...pickForm, variant: e.target.value})} className="w-full py-2 px-3 border border-gray-200 rounded-lg outline-none text-xs font-bold mt-2" />
                  
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <input type="number" min={0} placeholder="Cost Price (Optional)" value={pickForm.costPrice} onChange={e => setPickForm({...pickForm, costPrice: e.target.value})} className="w-full py-2 px-3 border border-gray-200 rounded-lg outline-none text-xs font-bold" />
                    <input type="number" min={0} placeholder="Sales Price (Optional)" value={pickForm.salesPrice} onChange={e => setPickForm({...pickForm, salesPrice: e.target.value})} className="w-full py-2 px-3 border border-gray-200 rounded-lg outline-none text-xs font-bold text-blue-600" />
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Scan Barcode / Enter SKU..."
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden space-y-4">
        {/* Table Filters */}
        <div className="p-6 pb-0 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <select
                value={vendorFilter}
                onChange={e => { setVendorFilter(e.target.value); setCurrentPage(1); }}
                className="py-1.5 px-3 text-xs border border-gray-200 rounded-lg outline-none font-medium"
              >
                <option value="all">-- All Suppliers --</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              <label className="text-[10px] font-bold text-gray-500 uppercase">From</label>
              <input
                type="date"
                value={startDate}
                onChange={e => { setStartDate(e.target.value); setCurrentPage(1); }}
                className="border-none bg-transparent text-xs font-bold text-gray-800 p-0 focus:ring-0"
              />
            </div>

            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              <label className="text-[10px] font-bold text-gray-500 uppercase">To</label>
              <input
                type="date"
                value={endDate}
                onChange={e => { setEndDate(e.target.value); setCurrentPage(1); }}
                className="border-none bg-transparent text-xs font-bold text-gray-800 p-0 focus:ring-0"
              />
            </div>
          </div>

          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search purchase #, supplier..."
              value={searchHistory}
              onChange={e => { setSearchHistory(e.target.value); setCurrentPage(1); }}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-red-100"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
          </div>
        </div>

        {/* Purchases Table */}
        <div className="overflow-x-auto border-t border-gray-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase font-bold border-b border-gray-200">
              <tr>
                <th className="px-6 py-3.5">Purchase #</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Supplier / Vendor</th>
                <th className="px-6 py-3.5 text-center">Items Qty</th>
                <th className="px-6 py-3.5 text-right">Total Bill</th>
                <th className="px-6 py-3.5 text-right">Paid Amount</th>
                <th className="px-6 py-3.5 text-right">Due Balance</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400">Loading purchase records...</td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400 italic">
                    No purchase records match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredPurchases.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((pur, idx) => {
                  const totalQty = pur.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0;
                  const due = Math.max(0, (pur.total || 0) - (pur.paidAmount || 0));
                  return (
                    <tr key={pur.id || idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3.5 font-bold font-mono text-gray-900">
                        {pur.documentNumber}
                      </td>
                      <td className="px-6 py-3.5 text-gray-500 whitespace-nowrap">
                        {new Date(pur.date || pur.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3.5 font-bold text-gray-800">
                        {pur.vendorName}
                        {pur.reference && (
                          <span className="text-[10px] text-gray-400 font-mono block">Challan: #{pur.reference}</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-center font-bold text-gray-700">
                        {totalQty} Units
                      </td>
                      <td className="px-6 py-3.5 text-right font-black text-gray-900">
                        {formatCurrency(pur.total, settings)}
                      </td>
                      <td className="px-6 py-3.5 text-right font-bold text-green-700">
                        {formatCurrency(pur.paidAmount, settings)}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        {due > 0 ? (
                          <span className="font-black text-red-600 bg-red-50 px-2 py-0.5 rounded">
                            {formatCurrency(due, settings)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          pur.paymentStatus === 'paid' ? "bg-green-100 text-green-700" :
                          pur.paymentStatus === 'partial' ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        )}>
                          {pur.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <button
                          onClick={() => setViewingPurchase(pur)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View Purchase Bill"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-6 pt-0">
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
                  Supplier: {viewingPurchase.vendorName} | Date: {new Date(viewingPurchase.date || viewingPurchase.createdAt).toLocaleDateString()}
                </span>
              </div>
              <button onClick={() => setViewingPurchase(null)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
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
                        <td className="px-4 py-2 text-center font-bold">{item.quantity}</td>
                        <td className="px-4 py-2 text-right font-black text-gray-900">
                          {formatCurrency(item.purchasePrice * item.quantity, settings)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-1">
                <div className="flex justify-between font-bold">
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

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setViewingPurchase(null)}
                  className="px-5 py-2 bg-gray-800 hover:bg-black text-white font-bold rounded-lg transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchases;
