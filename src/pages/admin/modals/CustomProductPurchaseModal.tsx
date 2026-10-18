import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase';
import { 
  X, 
  CheckCircle, 
  PackagePlus, 
  Tag, 
  Barcode, 
  Store, 
  Layers, 
  ShieldCheck, 
  CreditCard, 
  Package, 
  Cpu, 
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { generateDocumentNumber } from '../../../lib/numbering';
import { Vendor, PaymentAccount, NavigationMenu } from '../../../types';
import { cn } from '../../../lib/utils';

interface CustomProductPurchaseModalProps {
  onClose: () => void;
  onSuccess: (product: any) => void;
}

export const CustomProductPurchaseModal: React.FC<CustomProductPurchaseModalProps> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [menus, setMenus] = useState<NavigationMenu[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    subCategory: '',
    brand: '',
    model: '',
    barcode: '',
    vendorId: '',
    costPrice: 0,
    salesPrice: 0,
    quantity: 1,
    unit: 'pcs',
    warrantyMonths: 0,
    warrantyUnit: 'months',
    paymentAccountId: '',
    paidAmount: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [venSnap, accSnap, menuSnap] = await Promise.all([
          getDocs(query(collection(db, 'vendors'), orderBy('name'))),
          getDocs(query(collection(db, 'payment_accounts'), orderBy('name'))),
          getDocs(collection(db, 'menus')),
        ]);
        
        const fetchedVendors = venSnap.docs.map(d => ({ id: d.id, ...d.data() } as Vendor));
        const fetchedAccs = accSnap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentAccount));
        const fetchedMenus = menuSnap.docs.map(d => ({ id: d.id, ...d.data() } as NavigationMenu));
        
        setVendors(fetchedVendors);
        setAccounts(fetchedAccs);
        setMenus(fetchedMenus);

        if (fetchedAccs.length > 0) {
          setFormData(prev => ({ ...prev, paymentAccountId: fetchedAccs[0].id }));
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        toast.error('Failed to load vendors and accounts');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.vendorId || formData.quantity <= 0) {
      toast.error('Please fill required fields (Name, Vendor, Quantity > 0)');
      return;
    }

    if (Number(formData.costPrice) <= 0) {
      toast.error('ক্রয়মূল্য (Cost Price) অবশ্যই ০ এর বেশি হতে হবে!');
      return;
    }

    if (Number(formData.salesPrice) > 0 && Number(formData.costPrice) > Number(formData.salesPrice)) {
      toast.error(`কেনা মূল্য (৳${formData.costPrice}) বিক্রয় মূল্যের (৳${formData.salesPrice}) চেয়ে বেশি হতে পারে না!`);
      return;
    }

    const calculatedTotal = (Number(formData.costPrice) || 0) * (Number(formData.quantity) || 1);
    const enteredPaid = Number(formData.paidAmount) || 0;
    if (enteredPaid < 0) {
      toast.error('পরিশোধিত টাকা (Paid Amount) নেগেটিভ হতে পারে না!');
      return;
    }
    if (enteredPaid > calculatedTotal) {
      toast.error(`পরিশোধিত টাকা (৳${enteredPaid}) মোট বিলের (৳${calculatedTotal}) চেয়ে বেশি হতে পারে না!`);
      return;
    }
    if (enteredPaid > 0 && !formData.paymentAccountId) {
      toast.error('টাকা পরিশোধের জন্য একটি পেমেন্ট অ্যাকাউন্ট সিলেক্ট করুন!');
      return;
    }
    
    setSubmitting(true);
    try {
      const vendor = vendors.find(v => v.id === formData.vendorId);
      const account = accounts.find(a => a.id === formData.paymentAccountId);

      // 1. Create Product
      const categoryName = menus.find(m => m.id === formData.categoryId)?.title || 'Custom Product';
      const productData = {
        name: formData.name.trim(),
        description: 'Custom Product',
        price: Number(formData.salesPrice) || 0,
        costPrice: Number(formData.costPrice) || 0,
        stock: Number(formData.quantity) || 1,
        unit: formData.unit || 'pcs',
        warrantyMonths: Number(formData.warrantyMonths) || 0,
        warrantyUnit: formData.warrantyUnit || 'months',
        categoryId: formData.categoryId || '',
        category: categoryName,
        subCategory: formData.subCategory || '',
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        barcode: formData.barcode.trim(),
        images: [],
        vendorId: formData.vendorId,
        createdAt: new Date().toISOString(),
      };
      const prodRef = await addDoc(collection(db, 'products'), productData);
      const newProduct = { id: prodRef.id, ...productData };

      // 2. Create Purchase
      const totalAmount = (Number(formData.costPrice) || 0) * (Number(formData.quantity) || 1);
      const docNumber = await generateDocumentNumber('purchase');
      const paid = Number(formData.paidAmount) || 0;
      const purchaseData = {
        documentNumber: docNumber,
        vendorId: formData.vendorId,
        vendorName: vendor?.name || 'Unknown Vendor',
        date: new Date().toISOString().split('T')[0],
        items: [{
          id: prodRef.id,
          name: formData.name.trim(),
          purchasePrice: Number(formData.costPrice) || 0,
          salesPrice: Number(formData.salesPrice) || 0,
          quantity: Number(formData.quantity) || 1,
          unit: formData.unit || 'pcs',
        }],
        subtotal: totalAmount,
        total: totalAmount,
        paidAmount: paid,
        paymentStatus: paid >= totalAmount ? 'paid' : (paid > 0 ? 'partial' : 'unpaid'),
        paymentAccountId: formData.paymentAccountId,
        paymentMethod: account?.type || 'cash',
        createdAt: new Date().toISOString(),
      };
      
      const purchaseRef = await addDoc(collection(db, 'purchases'), purchaseData);

      // 3. Create Accounting Transactions
      await addDoc(collection(db, 'transactions'), {
        type: 'purchase',
        amount: purchaseData.total,
        date: purchaseData.date,
        description: `Purchase from ${vendor?.name || 'Unknown Vendor'} (#${docNumber})`,
        entityId: formData.vendorId,
        entityName: vendor?.name || 'Unknown Vendor',
        entityType: 'vendor',
        referenceId: purchaseRef.id,
        documentNumber: docNumber,
        paymentAccountId: '',
        paymentMethod: '',
        createdAt: new Date().toISOString(),
      });

      if (paid > 0) {
        await addDoc(collection(db, 'transactions'), {
          type: 'payment_made',
          amount: paid,
          date: purchaseData.date,
          paymentAccountId: formData.paymentAccountId,
          paymentMethod: account?.type || 'cash',
          entityId: formData.vendorId,
          entityName: vendor?.name || 'Unknown Vendor',
          entityType: 'vendor',
          referenceId: purchaseRef.id,
          documentNumber: docNumber,
          description: `Payment for custom purchase #${docNumber}`,
          createdAt: new Date().toISOString(),
        });
      }

      toast.success('Custom product purchased successfully!');
      onSuccess(newProduct);
    } catch (err) {
      console.error('Error purchasing custom product:', err);
      toast.error('Failed to purchase custom product');
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmount = (Number(formData.costPrice) || 0) * (Number(formData.quantity) || 1);
  const remainingDue = Math.max(0, totalAmount - (Number(formData.paidAmount) || 0));

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
        <div className="bg-white px-6 py-5 rounded-2xl shadow-xl flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="font-bold text-xs text-slate-700">Loading Vendors & Accounts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in-50">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80 my-auto">
        {/* Modern Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20 shrink-0">
              <PackagePlus size={20} />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                Quick Purchase: Custom Product
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                Record an instant vendor purchase and push the item directly to the active sales cart
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {/* Section 1: Product Specifications (Horizontal 3-column Grid) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-extrabold uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100">
              <Package size={14} className="text-indigo-600" />
              <span>Product Information</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
              {/* Product Name */}
              <div className="md:col-span-6">
                <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-10 border border-slate-200 rounded-xl pl-3 pr-3 text-xs font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-2xs"
                    placeholder="e.g. Core i9 14900K Box Processor"
                  />
                </div>
              </div>

              {/* Barcode / SKU */}
              <div className="md:col-span-3">
                <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1 flex items-center gap-1">
                  <Barcode size={12} className="text-slate-400" /> Barcode / SKU
                </label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs font-mono font-bold text-slate-800 placeholder:font-normal placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-2xs"
                  placeholder="Scan or enter code"
                />
              </div>

              {/* Category */}
              <div className="md:col-span-3">
                <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1 flex items-center gap-1">
                  <Layers size={12} className="text-slate-400" /> Category
                </label>
                <select
                  value={formData.categoryId}
                  onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full h-10 border border-slate-200 rounded-xl px-2.5 text-xs font-bold text-slate-800 bg-white outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-2xs cursor-pointer"
                >
                  <option value="">-- General / Custom --</option>
                  {menus.map(m => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>

              {/* Brand */}
              <div className="md:col-span-6">
                <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1 flex items-center gap-1">
                  <Tag size={12} className="text-slate-400" /> Brand
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={e => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-2xs"
                  placeholder="e.g. Intel, Asus, Samsung"
                />
              </div>

              {/* Model */}
              <div className="md:col-span-6">
                <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1 flex items-center gap-1">
                  <Cpu size={12} className="text-slate-400" /> Model / Specs
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={e => setFormData({ ...formData, model: e.target.value })}
                  className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-2xs"
                  placeholder="e.g. ROG STRIX Z790-E"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Vendor, Pricing & Inventory (Horizontal 4-column Grid) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-slate-800 font-extrabold uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100">
              <Store size={14} className="text-emerald-600" />
              <span>Vendor, Pricing & Inventory</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
              {/* Vendor Selector */}
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
                  Vendor / Supplier <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.vendorId}
                  onChange={e => setFormData({ ...formData, vendorId: e.target.value })}
                  className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs font-bold text-slate-900 bg-white outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all shadow-2xs cursor-pointer"
                >
                  <option value="">-- Select Vendor --</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              {/* Cost Price */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
                  Cost / Buy Price (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.costPrice || ''}
                  onChange={e => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                  className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs font-black text-amber-900 bg-amber-50/30 outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-500 transition-all shadow-2xs"
                  placeholder="0"
                />
              </div>

              {/* Sales Price */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
                  Selling Price (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.salesPrice || ''}
                  onChange={e => setFormData({ ...formData, salesPrice: Number(e.target.value) })}
                  className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs font-black text-emerald-900 bg-emerald-50/30 outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all shadow-2xs"
                  placeholder="0"
                />
              </div>

              {/* Quantity Stepper & Unit */}
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
                  Purchase Quantity & Unit <span className="text-red-500">*</span>
                </label>
                <div className="flex items-stretch border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs h-10">
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity || ''}
                    onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="flex-1 px-3 text-xs font-black text-slate-900 outline-none"
                    placeholder="1"
                  />
                  <select
                    value={formData.unit || 'pcs'}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    className="border-l border-slate-200 px-3 text-xs font-bold bg-slate-50 text-slate-700 outline-none cursor-pointer"
                  >
                    <option value="pcs">pcs</option>
                    <option value="nos">nos</option>
                    <option value="kg">kg</option>
                    <option value="gm">gm</option>
                    <option value="ltr">ltr</option>
                    <option value="meter">meter</option>
                    <option value="box">box</option>
                    <option value="set">set</option>
                    <option value="pack">pack</option>
                  </select>
                </div>
              </div>

              {/* Warranty */}
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1 flex items-center gap-1">
                  <ShieldCheck size={12} className="text-slate-400" /> Warranty Period
                </label>
                <div className="flex items-stretch border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs h-10">
                  <input
                    type="number"
                    min="0"
                    value={formData.warrantyMonths || ''}
                    onChange={e => setFormData({ ...formData, warrantyMonths: Number(e.target.value) })}
                    className="flex-1 px-3 text-xs font-semibold text-slate-900 outline-none"
                    placeholder="0 (No Warranty)"
                  />
                  <select
                    value={formData.warrantyUnit || 'months'}
                    onChange={e => setFormData({ ...formData, warrantyUnit: e.target.value })}
                    className="border-l border-slate-200 px-3 text-xs font-bold bg-slate-50 text-slate-700 outline-none cursor-pointer"
                  >
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Payment & Accounting (Horizontal 2-Column Split Card) */}
          <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-extrabold uppercase tracking-wider text-[11px]">
              <CreditCard size={14} className="text-blue-600" />
              <span>Purchase Payment & Accounting</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Payment Account */}
              <div className="md:col-span-4">
                <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
                  Pay From Account
                </label>
                <select
                  value={formData.paymentAccountId}
                  onChange={e => setFormData({ ...formData, paymentAccountId: e.target.value })}
                  className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs font-bold text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 shadow-2xs cursor-pointer"
                >
                  <option value="">-- No Immediate Payment --</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                  ))}
                </select>
              </div>

              {/* Paid Amount Input & Quick Actions */}
              <div className="md:col-span-4">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-extrabold text-slate-600 uppercase">
                    Paid Amount (৳)
                  </label>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, paidAmount: 0 })}
                      className="text-slate-500 hover:text-slate-800 hover:underline"
                    >
                      Keep Due
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, paidAmount: totalAmount })}
                      className="text-emerald-700 hover:underline"
                    >
                      Full Paid
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  max={totalAmount}
                  value={formData.paidAmount || ''}
                  onChange={e => setFormData({ ...formData, paidAmount: Number(e.target.value) })}
                  className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs font-black text-slate-900 bg-white outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 shadow-2xs"
                  placeholder="0 (Full Due)"
                />
              </div>

              {/* Summary Stats Box */}
              <div className="md:col-span-4 bg-white border border-slate-200/90 rounded-xl p-3 flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Total Cost</span>
                  <span className="text-base font-black text-slate-900">৳ {totalAmount.toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Supplier Due</span>
                  <span className={cn(
                    "text-sm font-black",
                    remainingDue > 0 ? "text-amber-700" : "text-emerald-600"
                  )}>
                    ৳ {remainingDue.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-slate-900 hover:bg-[#EF4444] text-white font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle size={15} />
              {submitting ? 'Purchasing & Adding...' : 'Purchase & Add to Cart'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

