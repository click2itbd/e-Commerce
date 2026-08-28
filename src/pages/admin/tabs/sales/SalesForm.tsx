import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { Product, Customer, DiscountCode, SiteSettings, PaymentAccount } from '../../../../types';
import { formatCurrency, cn } from '../../../../lib/utils';
import { toast } from 'react-hot-toast';
import {
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Cpu,
  X,
  Search,
  CheckCircle,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  UserCheck,
  User,
} from 'lucide-react';
import { generateDocumentNumber } from '../../../../lib/numbering';
import { sendEmail } from '../../../../services/emailService';

interface SalesFormProps {
  products: Product[];
  customers: Customer[];
  discountCodes: DiscountCode[];
  settings: SiteSettings;
  formatCurrency: (amount: number, settings?: SiteSettings) => string;
  cn: (...inputs: any[]) => string;
  toast: any;
  fetchData: () => Promise<void>;
  checkLowStock: (productName: string, newStock: number) => Promise<void>;
  setActiveTab: (tab: string) => void;
  setIsAddingCustomer: (val: boolean) => void;
}

export const SalesForm: React.FC<SalesFormProps> = ({
  products,
  customers: initialCustomers,
  discountCodes,
  settings,
  formatCurrency,
  cn,
  toast,
  fetchData,
  checkLowStock,
  setActiveTab,
}) => {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers || []);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  const [saleData, setSaleData] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    shippingAddress: '',
    items: [] as any[],
    type: 'invoice' as 'invoice' | 'challan' | 'quotation',
    saleSource: 'in_store' as 'in_store' | 'online',
    paymentMethod: 'cash',
    paymentAccountId: '',
    paidAmount: 0,
    discountAmount: 0,
    appliedDiscountPercentage: 0,
    appliedDiscountCode: '',
    notes: '',
  });

  const [saleDiscountCodeInput, setSaleDiscountCodeInput] = useState('');
  const [showPCBuilderModal, setShowPCBuilderModal] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [submitting, setSubmitting] = useState(false);

  // Sync customers and fetch accounts
  const loadData = async () => {
    try {
      const [custSnap, accSnap] = await Promise.all([
        getDocs(query(collection(db, 'customers'), orderBy('name'))),
        getDocs(query(collection(db, 'payment_accounts'), orderBy('name'))),
      ]);
      const fetchedCusts = custSnap.docs.map(d => ({ id: d.id, ...d.data() } as Customer));
      setCustomers(fetchedCusts);

      const accs = accSnap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentAccount));
      setPaymentAccounts(accs);
      if (accs.length > 0 && !saleData.paymentAccountId) {
        setSaleData(prev => ({
          ...prev,
          paymentAccountId: accs[0].id,
          paymentMethod: accs[0].type || 'cash',
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Subtotal & Total Calculations
  const subtotal = saleData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const effectiveDiscount = saleData.appliedDiscountPercentage > 0
    ? (subtotal * saleData.appliedDiscountPercentage) / 100
    : (saleData.discountAmount || 0);
  const netTotal = Math.max(0, subtotal - effectiveDiscount);

  // Net total computed
  const handleCustomerChange = (customerId: string) => {
    const selected = customers.find(c => c.id === customerId);
    if (selected) {
      setSaleData(prev => ({
        ...prev,
        customerId: selected.id,
        customerName: selected.name,
        customerPhone: selected.phone || '',
        customerEmail: selected.email || '',
        shippingAddress: selected.address || '',
      }));
    } else {
      setSaleData(prev => ({
        ...prev,
        customerId: '',
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        shippingAddress: '',
      }));
    }
  };

  // Create new customer modal submission
  const handleQuickAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerForm.name.trim()) {
      toast.error('Customer name is required');
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'customers'), {
        name: newCustomerForm.name.trim(),
        phone: newCustomerForm.phone.trim(),
        email: newCustomerForm.email.trim(),
        address: newCustomerForm.address.trim(),
        createdAt: new Date().toISOString(),
      });

      const newlyAdded: Customer = {
        id: docRef.id,
        name: newCustomerForm.name.trim(),
        phone: newCustomerForm.phone.trim(),
        email: newCustomerForm.email.trim(),
        address: newCustomerForm.address.trim(),
        createdAt: new Date().toISOString(),
      };

      setCustomers(prev => [...prev, newlyAdded]);
      // Auto select the newly added customer
      setSaleData(prev => ({
        ...prev,
        customerId: newlyAdded.id,
        customerName: newlyAdded.name,
        customerPhone: newlyAdded.phone || '',
        customerEmail: newlyAdded.email || '',
        shippingAddress: newlyAdded.address || '',
      }));

      setIsAddingNewCustomer(false);
      setNewCustomerForm({ name: '', phone: '', email: '', address: '' });
      toast.success(`Customer "${newlyAdded.name}" added and selected!`);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to add customer');
    }
  };

  const handleApplySaleDiscountCode = () => {
    if (!saleDiscountCodeInput.trim()) return;
    const foundCode = discountCodes.find(
      c => c.code.toUpperCase() === saleDiscountCodeInput.toUpperCase() && c.isActive
    );
    if (foundCode) {
      if (new Date(foundCode.expiryDate) < new Date()) {
        toast.error('Discount code expired');
        return;
      }
      setSaleData({
        ...saleData,
        appliedDiscountPercentage: foundCode.discountPercentage,
        appliedDiscountCode: foundCode.code,
        discountAmount: 0,
      });
      toast.success(`Discount code applied: ${foundCode.discountPercentage}% off`);
    } else {
      toast.error('Invalid discount code');
    }
  };

  const addItemToSale = (product: Product) => {
    if (product.stock <= 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }

    setSaleData(prev => {
      const existing = prev.items.find(i => i.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error(`Maximum available stock is ${product.stock}`);
          return prev;
        }
        return {
          ...prev,
          items: prev.items.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i),
        };
      }
      return {
        ...prev,
        items: [...prev.items, { ...product, quantity: 1, selectedSerials: [] }],
      };
    });
    toast.success(`Added ${product.name}`);
  };

  const updateItemQty = (productId: string, newQty: number) => {
    const itemInCart = saleData.items.find(i => i.id === productId);
    if (!itemInCart) return;

    if (newQty <= 0) {
      setSaleData(prev => ({
        ...prev,
        items: prev.items.filter(i => i.id !== productId),
      }));
      return;
    }

    if (!itemInCart.isCustomService) {
      const product = products.find(p => p.id === productId);
      if (product && newQty > product.stock) {
        toast.error(`Maximum available stock is ${product.stock}`);
        return;
      }
    }

    setSaleData(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === productId ? { ...i, quantity: newQty } : i),
    }));
  };

  const updateItemPrice = (productId: string, newPrice: number) => {
    if (newPrice < 0) return;
    setSaleData(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === productId ? { ...i, price: newPrice } : i),
    }));
  };

  const updateItemName = (productId: string, newName: string) => {
    setSaleData(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === productId ? { ...i, name: newName } : i),
    }));
  };

  const handleAddCustomService = () => {
    const serviceId = 'service-' + Date.now();
    setSaleData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: serviceId,
          name: 'Repair / Servicing',
          price: 0,
          costPrice: 0,
          quantity: 1,
          isCustomService: true,
          hasSerialTracking: false,
          hasWarranty: false,
          selectedSerials: [],
        }
      ],
    }));
  };

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();

    // MUST HAVE A REGISTERED CUSTOMER SELECTED
    if (!saleData.customerId || !saleData.customerName) {
      toast.error('Please select a registered customer for this sale');
      return;
    }

    if (saleData.items.length === 0) {
      toast.error('Please add at least one product to the sale');
      return;
    }

    try {
      setSubmitting(true);

      // Verify Serials if tracking enabled
      for (const item of saleData.items) {
        if (item.hasSerialTracking) {
          if (!item.selectedSerials || item.selectedSerials.length !== item.quantity) {
            toast.error(`Please select exactly ${item.quantity} serial(s) for ${item.name}`);
            setSubmitting(false);
            return;
          }
        }
      }

      const docType = saleData.type === 'quotation' ? 'QUO' : (saleData.type === 'challan' ? 'CHA' : 'INV');
      const docNumber = await generateDocumentNumber(docType);

      const processedItems = saleData.items.map(item => {
        if (item.isCustomService) {
          return {
            productId: item.id,
            name: item.name,
            price: Number(item.price),
            costPrice: 0,
            quantity: Number(item.quantity),
            hasWarranty: false,
            warrantyYears: 0,
            warrantyMonths: 0,
            selectedSerials: [],
            itemType: 'service',
          };
        }
        
        const currentProduct = products.find(p => p.id === item.id);
        const wMonths = item.hasWarranty ? (item.warrantyYears || 0) * 12 : (currentProduct?.warrantyMonths || 0);
        return {
          productId: item.id,
          name: item.name,
          price: Number(item.price),
          costPrice: Number(currentProduct?.costPrice) || 0,
          quantity: Number(item.quantity),
          hasWarranty: Boolean(item.hasWarranty),
          warrantyYears: Number(item.warrantyYears) || 0,
          warrantyMonths: wMonths,
          selectedSerials: item.selectedSerials || [],
        };
      });

      const totalCost = processedItems.reduce((acc, i) => acc + (i.costPrice * i.quantity), 0);
      const profit = netTotal - totalCost;

      const paid = saleData.type === 'quotation' ? 0 : Math.min(netTotal, Number(saleData.paidAmount) || 0);
      const paymentStatus = paid >= netTotal ? 'paid' : (paid > 0 ? 'partial' : 'unpaid');
      const createdAt = new Date().toISOString();

      const orderData = {
        documentNumber: docNumber,
        type: saleData.type,
        saleSource: saleData.saleSource,
        customerId: saleData.customerId,
        customerName: saleData.customerName,
        customerPhone: saleData.customerPhone || '',
        customerEmail: saleData.customerEmail || '',
        shippingAddress: saleData.shippingAddress || '',
        items: processedItems,
        subtotal,
        discountAmount: effectiveDiscount,
        appliedDiscountPercentage: saleData.appliedDiscountPercentage,
        appliedDiscountCode: saleData.appliedDiscountCode,
        total: netTotal,
        totalCost,
        profit,
        paidAmount: paid,
        paymentStatus,
        paymentMethod: saleData.paymentMethod || 'cash',
        paymentAccountId: saleData.paymentAccountId || '',
        status: saleData.type === 'quotation' ? 'pending' : 'delivered',
        userId: 'admin',
        notes: saleData.notes || '',
        createdAt,
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);

      // Deduct stock and record serial warranties if invoice/challan
      if (saleData.type === 'invoice' || saleData.type === 'challan') {
        for (const item of saleData.items) {
          if (item.isCustomService) continue;
          const productRef = doc(db, 'products', item.id);
          const currentProduct = products.find(p => p.id === item.id);
          if (currentProduct) {
            const updates: any = {};
            const newStock = Math.max(0, currentProduct.stock - item.quantity);
            updates.stock = newStock;

            if (currentProduct.hasSerialTracking && item.selectedSerials) {
              const remainingSerials = (currentProduct.availableSerials || []).filter(
                (s: string) => !item.selectedSerials.includes(s)
              );
              updates.availableSerials = remainingSerials;

              const warrantyEndDate = new Date();
              const wMonths = item.hasWarranty ? (item.warrantyYears || 0) * 12 : (currentProduct.warrantyMonths || 0);
              warrantyEndDate.setMonth(warrantyEndDate.getMonth() + wMonths);

              for (const serial of item.selectedSerials) {
                await addDoc(collection(db, 'sold_serials'), {
                  serial,
                  productId: currentProduct.id,
                  productName: currentProduct.name,
                  orderId: orderRef.id,
                  documentNumber: docNumber,
                  customerName: saleData.customerName,
                  customerPhone: saleData.customerPhone,
                  soldAt: createdAt,
                  warrantyEndDate: warrantyEndDate.toISOString(),
                  status: 'active',
                });
              }
            }

            await updateDoc(productRef, updates);
            checkLowStock(currentProduct.name, newStock);
          }
        }

        // Record Cash/Bank Inflow Transaction in Firestore
        if (paid > 0) {
          const selectedAcc = paymentAccounts.find(a => a.id === saleData.paymentAccountId);
          await addDoc(collection(db, 'transactions'), {
            type: 'sale',
            amount: paid,
            date: createdAt,
            description: `Sale to ${saleData.customerName} (#${docNumber})`,
            entityId: saleData.customerId,
            entityName: saleData.customerName,
            entityType: 'customer',
            referenceId: orderRef.id,
            documentNumber: docNumber,
            paymentAccountId: selectedAcc?.id || '',
            paymentMethod: selectedAcc?.type || selectedAcc?.name || saleData.paymentMethod || 'cash',
            createdAt,
          });
        }
      }

      const typeStr = saleData.type === 'quotation' ? 'Quotation' : (saleData.type === 'challan' ? 'Challan' : 'Invoice');
      
      // Send email invoice (non-blocking - never prevents sale from saving)
      if (saleData.customerEmail) {
        try {
          const emailHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h2>${settings?.brandName || 'Click2IT'}</h2>
                <h3>${typeStr} #${docNumber}</h3>
              </div>
              <p>Dear <strong>${saleData.customerName}</strong>,</p>
              <p>Thank you for your business. Please find the details of your recent ${typeStr.toLowerCase()} below:</p>
              
              <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                  <tr style="background-color: #f3f4f6;">
                    <th style="padding: 10px; text-align: left; border: 1px solid #e5e7eb;">Item</th>
                    <th style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">Qty</th>
                    <th style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">Price</th>
                    <th style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${processedItems.map((item: any) => `
                    <tr>
                      <td style="padding: 10px; border: 1px solid #e5e7eb;">${item.name}</td>
                      <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">${item.quantity}</td>
                      <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">${formatCurrency(item.price, settings)}</td>
                      <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">${formatCurrency(item.price * item.quantity, settings)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div style="margin-top: 20px; text-align: right;">
                <p><strong>Subtotal:</strong> ${formatCurrency(subtotal, settings)}</p>
                ${effectiveDiscount > 0 ? `<p><strong>Discount:</strong> -${formatCurrency(effectiveDiscount, settings)}</p>` : ''}
                <p style="font-size: 1.2em;"><strong>Net Total:</strong> ${formatCurrency(netTotal, settings)}</p>
                ${saleData.type === 'invoice' ? `
                <p><strong>Paid:</strong> ${formatCurrency(paid, settings)}</p>
                <p><strong>Due:</strong> ${formatCurrency(Math.max(0, netTotal - paid), settings)}</p>
                ` : ''}
              </div>
              
              <p style="margin-top: 30px; font-size: 0.9em; color: #6b7280; text-align: center;">
                If you have any questions, please contact us.<br>
                ${settings?.brandName || 'Store Team'}
              </p>
            </div>
          `;
          
          sendEmail({
            to: saleData.customerEmail,
            subject: `${typeStr} #${docNumber} from ${settings?.brandName || 'Our Store'}`,
            html: emailHtml,
            orderId: orderRef.id,
            category: saleData.type
          }).then(() => {
            toast.success(`Email sent to ${saleData.customerEmail}`);
          }).catch((emailErr: any) => {
            console.error("Failed to send email", emailErr);
          });
        } catch (emailBuildErr) {
          console.error("Email build error", emailBuildErr);
        }
      }

      toast.success(`${typeStr} #${docNumber} created successfully!`);

      // Reset form
      setSaleData({
        customerId: '',
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        shippingAddress: '',
        items: [],
        type: 'invoice',
        paymentMethod: paymentAccounts[0]?.type || 'cash',
        paymentAccountId: paymentAccounts[0]?.id || '',
        saleSource: 'in_store',
        paidAmount: 0,
        discountAmount: 0,
        appliedDiscountPercentage: 0,
        appliedDiscountCode: '',
        notes: '',
      });
      setSaleDiscountCodeInput('');
      fetchData();
    } catch (error) {
      console.error('Error creating sale:', error);
      toast.error('Failed to record sale');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter products on the right catalog
  const filteredProducts = products.filter(product => {
    if (selectedCategory !== 'all' && product.category !== selectedCategory) return false;
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      const matchesName = product.name.toLowerCase().includes(q);
      const matchesCategory = (product.category || '').toLowerCase().includes(q);
      const matchesBrand = (product.brand || '').toLowerCase().includes(q);
      const matchesModel = (product.model || '').toLowerCase().includes(q);
      const matchesModel = (product.model || '').toLowerCase().includes(q);
      if (!matchesName && !matchesCategory && !matchesBrand) return false;
    }
    return true;
  });

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* --- LEFT: SALES ORDER INVOICE FORM (7 COLS) --- */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShoppingBag className="text-[#EF4444]" /> Create Sale & Invoice
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddCustomService}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all border border-indigo-200"
              >
                <Plus size={14} /> Add Service/Repair
              </button>
              <button
                type="button"
                onClick={() => setShowPCBuilderModal(true)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <Cpu size={14} className="text-[#EF4444]" /> PC Builder
              </button>
            </div>
          </div>

          <form onSubmit={handleCreateSale} className="space-y-6 text-xs">
            {/* Document Type & Customer Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Document Type</label>
                <select
                  value={saleData.type}
                  onChange={e => setSaleData({ ...saleData, type: e.target.value as any })}
                  className="w-full border border-gray-200 rounded-lg p-2.5 font-bold text-gray-800"
                >
                  <option value="invoice">Invoice</option>
                  <option value="challan">Challan</option>
                  <option value="quotation">Quotation</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Customer <span className="text-red-500">*</span> (Must Select)
                </label>
                <div className="flex gap-2">
                  <select
                    required
                    value={saleData.customerId}
                    onChange={e => handleCustomerChange(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2.5 font-bold text-gray-900 bg-white"
                  >
                    <option value="">-- Select Customer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewCustomer(true)}
                    className="bg-[#081621] hover:bg-[#EF4444] text-white px-3 py-2 rounded-lg font-bold flex items-center gap-1 transition-all shrink-0"
                    title="Add New Customer"
                  >
                    <Plus size={16} /> New
                  </button>
                </div>
              </div>
            </div>

            {/* Selected Customer Details Card */}
            {saleData.customerId ? (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-full shrink-0">
                    <UserCheck size={18} />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-emerald-950 block">{saleData.customerName}</span>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-emerald-800 mt-0.5">
                      {saleData.customerPhone && (
                        <span className="flex items-center gap-1"><Phone size={10} /> {saleData.customerPhone}</span>
                      )}
                      {saleData.customerEmail && (
                        <span className="flex items-center gap-1"><Mail size={10} /> {saleData.customerEmail}</span>
                      )}
                      {saleData.shippingAddress && (
                        <span className="flex items-center gap-1"><MapPin size={10} /> {saleData.shippingAddress}</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCustomerChange('')}
                  className="text-xs font-bold text-red-600 hover:underline shrink-0"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center gap-2.5 text-amber-800 text-xs">
                <AlertCircle size={16} className="shrink-0 text-amber-600" />
                <span>
                  Please select an existing customer from the dropdown above, or click <strong>&quot;+ New&quot;</strong> to register one.
                </span>
              </div>
            )}

            {/* Cart Items Table */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="font-bold text-gray-700 uppercase tracking-wider">
                  Selected Items ({saleData.items.length})
                </label>
                {saleData.items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSaleData({ ...saleData, items: [] })}
                    className="text-red-500 hover:text-red-700 text-[11px]"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {saleData.items.length === 0 ? (
                <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400">
                  <ShoppingBag size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="font-medium">No items selected yet.</p>
                  <p className="text-[11px]">Click items from the product catalog on the right to add them to this sale.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {saleData.items.map((item, idx) => {
                    const originalProd = products.find(p => p.id === item.id);
                    return (
                      <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-2">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            {item.isCustomService ? (
                              <div className="flex flex-col gap-1 w-full max-w-sm mb-1">
                                <label className="text-[10px] uppercase font-bold text-indigo-500">Service Description</label>
                                <input 
                                  type="text" 
                                  value={item.name} 
                                  onChange={e => updateItemName(item.id, e.target.value)}
                                  placeholder="e.g. OS Installation, Keyboard Repair..."
                                  className="w-full border border-indigo-200 bg-indigo-50/30 rounded py-1 px-2 font-semibold text-xs focus:ring-indigo-500"
                                />
                              </div>
                            ) : (
                              <span className="font-bold text-gray-900 block text-xs">{item.name}</span>
                            )}
                            
                            {!item.isCustomService && (
                              <span className="text-[10px] text-gray-400">
                                Stock: {originalProd?.stock || 0} | <span className="text-amber-600 font-bold">Buy Price: {formatCurrency(originalProd?.costPrice || 0, settings)}</span>
                              </span>
                            )}
                          </div>

                          {/* Editable Sale Price */}
                          <div className="flex flex-col items-center">
                            <label className="text-[9px] font-bold text-blue-500 uppercase">Sale Price</label>
                            <input
                              type="number"
                              min={0}
                              value={item.price}
                              onChange={e => updateItemPrice(item.id, Number(e.target.value))}
                              className="w-24 text-center border border-blue-200 bg-blue-50/50 rounded py-0.5 font-bold text-blue-900 focus:ring-blue-500"
                            />
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex flex-col items-center gap-1">
                            <label className="text-[9px] font-bold text-gray-500 uppercase">Qty</label>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => updateItemQty(item.id, item.quantity - 1)}
                                className="p-1 bg-white border border-gray-200 rounded hover:bg-gray-100"
                              >
                                <Minus size={12} />
                              </button>
                            <input
                              type="number"
                              min={1}
                              max={originalProd?.stock || 9999}
                              value={item.quantity}
                              onChange={e => updateItemQty(item.id, Number(e.target.value))}
                              className="w-12 text-center border border-gray-200 rounded py-0.5 font-bold"
                            />
                            <button
                              type="button"
                              onClick={() => updateItemQty(item.id, item.quantity + 1)}
                              className="p-1 bg-white border border-gray-200 rounded hover:bg-gray-100"
                            >
                              <Plus size={12} />
                            </button>
                            </div>
                          </div>

                          {/* Item Total */}
                          <div className="text-right min-w-20">
                            <span className="font-black text-gray-900 text-sm block">
                              {formatCurrency(item.price * item.quantity, settings)}
                            </span>
                          </div>

                          {/* Remove */}
                          <button
                            type="button"
                            onClick={() => setSaleData(prev => ({
                              ...prev,
                              items: prev.items.filter(i => i.id !== item.id),
                            }))}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {/* Serial Number Picker */}
                        {item.hasSerialTracking && (
                          <div className="border-t border-gray-200 pt-2">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                              Select Serial Numbers (Required: {item.quantity} | Selected: {item.selectedSerials?.length || 0})
                            </label>
                            <div className="flex flex-wrap gap-1">
                              {(originalProd?.availableSerials || []).map((serial: string) => {
                                const isSelected = (item.selectedSerials || []).includes(serial);
                                return (
                                  <button
                                    type="button"
                                    key={serial}
                                    onClick={() => {
                                      let newSelected = [...(item.selectedSerials || [])];
                                      if (isSelected) {
                                        newSelected = newSelected.filter(s => s !== serial);
                                      } else if (newSelected.length < item.quantity) {
                                        newSelected.push(serial);
                                      } else {
                                        toast.error(`Already selected ${item.quantity} serial(s)`);
                                      }
                                      setSaleData(prev => ({
                                        ...prev,
                                        items: prev.items.map(i => i.id === item.id ? { ...i, selectedSerials: newSelected } : i),
                                      }));
                                    }}
                                    className={cn(
                                      "px-2 py-0.5 text-[11px] rounded border font-mono transition-all",
                                      isSelected ? "bg-[#EF4444] text-white border-[#EF4444]" : "bg-white text-gray-700 border-gray-300 hover:border-red-300"
                                    )}
                                  >
                                    {serial}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Discounts & Payment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
              {/* Left: Discounts */}
              <div className="space-y-3 bg-gray-50/50 p-3.5 rounded-xl border border-gray-200">
                <span className="font-bold text-gray-700 uppercase block">Discounts & Coupons</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Coupon Code"
                    value={saleDiscountCodeInput}
                    onChange={e => setSaleDiscountCodeInput(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg p-2 uppercase font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleApplySaleDiscountCode}
                    className="bg-gray-800 text-white px-3 py-2 rounded-lg font-bold hover:bg-black"
                  >
                    Apply
                  </button>
                </div>
                {saleData.appliedDiscountCode && (
                  <div className="flex justify-between items-center bg-green-50 p-2 rounded-lg border border-green-200">
                    <span className="text-green-700 font-bold text-[11px]">
                      {saleData.appliedDiscountCode} ({saleData.appliedDiscountPercentage}% OFF)
                    </span>
                    <button
                      type="button"
                      onClick={() => setSaleData({ ...saleData, appliedDiscountCode: '', appliedDiscountPercentage: 0 })}
                      className="text-red-500 font-bold text-[11px] hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Manual Discount</label>
                  <input
                    type="number"
                    min={0}
                    disabled={saleData.appliedDiscountPercentage > 0}
                    value={saleData.discountAmount || ''}
                    onChange={e => setSaleData({ ...saleData, discountAmount: Number(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full border border-gray-200 rounded-lg p-2"
                  />
                </div>
              </div>

              {/* Right: Payment Method & Paid Amount */}
              {saleData.type !== 'quotation' && (
                <div className="space-y-3 bg-gray-50/50 p-3.5 rounded-xl border border-gray-200">
                  <span className="font-bold text-gray-700 uppercase block">Payment Collection</span>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Receive In Account</label>
                    <select
                      value={saleData.paymentAccountId}
                      onChange={e => {
                        const acc = paymentAccounts.find(a => a.id === e.target.value);
                        setSaleData({
                          ...saleData,
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

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Sale Notes (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={saleData.notes}
                      onChange={e => setSaleData({ ...saleData, notes: e.target.value })}
                      placeholder="e.g. Courier via SA Paribahan, handle with care..."
                      className="w-full border border-gray-200 rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Paid Amount - Total: {formatCurrency(netTotal, settings)}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={saleData.paidAmount || ''}
                      onChange={e => setSaleData({ ...saleData, paidAmount: Number(e.target.value) || 0 })}
                      className="w-full border border-gray-200 rounded-lg p-2 font-black text-gray-900 text-sm"
                    />
                  </div>

                  {/* Due preview */}
                  {netTotal > saleData.paidAmount && (
                    <div className="flex justify-between items-center text-xs font-bold text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                      <span>Customer Due Balance:</span>
                      <span>{formatCurrency(netTotal - saleData.paidAmount, settings)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Total Summary Footer */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal, settings)}</span>
              </div>
              {effectiveDiscount > 0 && (
                <div className="flex justify-between text-green-600 font-bold">
                  <span>Discount</span>
                  <span>- {formatCurrency(effectiveDiscount, settings)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t border-gray-200">
                <span>Net Total Payable</span>
                <span className="text-xl text-[#EF4444]">{formatCurrency(netTotal, settings)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || saleData.items.length === 0 || !saleData.customerId}
              className="w-full bg-[#081621] hover:bg-[#EF4444] disabled:opacity-50 text-white py-3.5 rounded-xl font-black text-sm transition-all shadow-md flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} />
              {submitting ? 'Generating Document...' : `Confirm & Save ${saleData.type.toUpperCase()}`}
            </button>
          </form>
        </div>
      </div>

      {/* --- RIGHT: PRODUCT CATALOG & QUICK SELECT (5 COLS) --- */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">Product Catalog</h3>
            <span className="text-xs text-gray-500">{filteredProducts.length} Items</span>
          </div>

          {/* Search & Category Filter */}
          <div className="space-y-2 text-xs">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products by name, SKU..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-red-100"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            </div>

            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full py-1.5 px-3 border border-gray-200 rounded-lg outline-none font-medium"
            >
              <option value="all">-- All Categories --</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Product Items List */}
          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs">
                No products match your search.
              </div>
            ) : (
              filteredProducts.map(product => {
                const isOutOfStock = product.stock <= 0;
                return (
                  <div
                    key={product.id}
                    className={cn(
                      "flex items-center justify-between p-3 border rounded-xl transition-all",
                      isOutOfStock ? "bg-gray-50/70 border-gray-200 opacity-60" : "bg-white border-gray-200 hover:border-[#EF4444] shadow-xs"
                    )}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <span className="font-bold text-xs text-gray-900 block truncate">{product.name}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-black text-[#EF4444]">
                          {formatCurrency(product.price, settings)}
                        </span>
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.2 rounded font-bold uppercase",
                          product.stock > 5 ? "bg-green-100 text-green-700" :
                          product.stock > 0 ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        )}>
                          Stock: {product.stock}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => addItemToSale(product)}
                      className={cn(
                        "p-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1",
                        isOutOfStock ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-[#081621] hover:bg-[#EF4444] text-white shadow-xs"
                      )}
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Quick Add Customer Modal */}
      {isAddingNewCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-5 bg-[#081621] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <User size={16} className="text-[#EF4444]" /> Add & Select New Customer
              </h3>
              <button onClick={() => setIsAddingNewCustomer(false)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleQuickAddCustomer} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shakib Al Hasan"
                  value={newCustomerForm.name}
                  onChange={e => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2.5 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="017XXXXXXXX"
                  value={newCustomerForm.phone}
                  onChange={e => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="customer@example.com"
                  value={newCustomerForm.email}
                  onChange={e => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Address</label>
                <input
                  type="text"
                  placeholder="House, Road, City"
                  value={newCustomerForm.address}
                  onChange={e => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2.5 font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#EF4444] hover:bg-red-600 text-white font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle size={14} /> Add & Select Customer
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingNewCustomer(false)}
                  className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

