import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, User, Plus, Trash2, CreditCard, Banknote, List, UserPlus, CheckCircle2 } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { generateDocumentNumber } from '../lib/numbering';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, limit, addDoc, doc, updateDoc } from 'firebase/firestore';
import { Product, Customer, PaymentAccount } from '../types';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';

export const RetailPOS = () => {
  const { settings } = useSettings();
  const { user } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Extended cart item to hold selectedSerials
  const [cart, setCart] = useState<{product: Product, quantity: number, hasWarranty?: boolean, warrantyYears?: number, selectedSerials?: string[]}[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Serial Selection Modal State
  const [showSerialModal, setShowSerialModal] = useState(false);
  const [activeSerialItemIdx, setActiveSerialItemIdx] = useState<number | null>(null);

  // Payment Selection Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodSnap, custSnap, paySnap] = await Promise.all([
          getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(500))),
          getDocs(query(collection(db, 'customers'), orderBy('createdAt', 'desc'), limit(200))),
          getDocs(query(collection(db, 'payment_accounts'), orderBy('name')))
        ]);
        setProducts(prodSnap.docs.map(d => ({id: d.id, ...d.data()})) as Product[]);
        setCustomers(custSnap.docs.map(d => ({id: d.id, ...d.data()})) as Customer[]);
        setPaymentAccounts(paySnap.docs.map(d => ({id: d.id, ...d.data()})) as PaymentAccount[]);
      } catch (err) {
        console.error("Failed to load POS data", err);
        toast.error("Failed to load POS data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast.error('Item is out of stock', { icon: '🚫' });
      return;
    }
    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.product.id === product.id);
      if (existingIdx >= 0) {
        const newCart = [...prev];
        if (newCart[existingIdx].quantity < product.stock) {
          newCart[existingIdx].quantity += 1;
        } else {
          toast.error('Cannot exceed available stock');
        }
        return newCart;
      }
      return [...prev, {product, quantity: 1, selectedSerials: []}];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const adjustQty = (productId: string, qty: number) => {
    if (qty < 1) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          if (qty > item.product.stock) {
            toast.error('Cannot exceed available stock');
            return item;
          }
          return {...item, quantity: qty};
        }
        return item;
      });
    });
  };

  const openSerialModal = (idx: number) => {
    setActiveSerialItemIdx(idx);
    setShowSerialModal(true);
  };

  const toggleSerialSelection = (serial: string) => {
    if (activeSerialItemIdx === null) return;
    
    setCart(prev => {
      const newCart = [...prev];
      const item = newCart[activeSerialItemIdx];
      const currentSerials = item.selectedSerials || [];
      
      if (currentSerials.includes(serial)) {
        item.selectedSerials = currentSerials.filter(s => s !== serial);
      } else {
        if (currentSerials.length >= item.quantity) {
          toast.error(`You only need ${item.quantity} serial(s)`);
          return prev;
        }
        item.selectedSerials = [...currentSerials, serial];
      }
      return newCart;
    });
  };



  const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const tax = 0; // Configurable tax later
  const total = subtotal + tax;

  const handleCheckoutClick = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    // Validate Serials
    for (const item of cart) {
      if (item.product.hasSerialTracking) {
        const selectedCount = item.selectedSerials?.length || 0;
        if (selectedCount !== item.quantity) {
          toast.error(`Please select ${item.quantity} serial(s) for ${item.product.name}`);
          return;
        }
      }
    }

    setShowPaymentModal(true);
  };

  const processPaymentAndOrder = async (accountId: string, method: string) => {
    try {
      setIsProcessing(true);
      const createdAt = new Date().toISOString();
      const docNumber = await generateDocumentNumber('invoice');
      
      // 1. Create Order
      const processedItems = cart.map(c => ({
        id: c.product.id,
        productId: c.product.id,
        name: c.product.name,
        price: c.product.price,
        costPrice: c.product.costPrice || 0,
        quantity: c.quantity,
        hasSerialTracking: c.product.hasSerialTracking || false,
        selectedSerials: c.selectedSerials || [],
        hasWarranty: c.hasWarranty || false,
        warrantyYears: c.warrantyYears || 0
      }));

      const totalCost = processedItems.reduce((acc, i) => acc + (i.costPrice * i.quantity), 0);
      const profit = total - totalCost;

      const orderData = {
        documentNumber: docNumber,
        type: 'pos_sale',
        customerId: selectedCustomer?.id || 'walk-in',
        customerName: selectedCustomer ? selectedCustomer.name : 'Walk-in Customer',
        customerPhone: selectedCustomer?.phone || '',
        customerEmail: selectedCustomer?.email || '',
        customerAddress: selectedCustomer?.address || '',
        items: processedItems,
        subtotal,
        discountAmount: 0,
        totalCost,
        profit,
        total,
        paidAmount: total, // Fully paid in POS
        paymentStatus: 'paid',
        paymentMethod: method,
        paymentAccountId: accountId,
        status: 'delivered', // POS is instant delivery
        userId: user?.uid || 'admin',
        createdAt,
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);

      // 2. Process Stock & Serials
      for (const item of cart) {
        const prodRef = doc(db, 'products', item.product.id);
        const updates: any = {};
        updates.stock = Math.max(0, item.product.stock - item.quantity);
        
        if (item.product.hasSerialTracking && item.selectedSerials) {
          const remainingSerials = (item.product.availableSerials || []).filter(
            (s: string) => !item.selectedSerials!.includes(s)
          );
          updates.availableSerials = remainingSerials;
          
          const warrantyEndDate = new Date();
          const wMonths = item.hasWarranty ? (item.warrantyYears || 0) * 12 : (item.product.warrantyMonths || 0);
          warrantyEndDate.setMonth(warrantyEndDate.getMonth() + wMonths);

          for (const serial of item.selectedSerials) {
            await addDoc(collection(db, 'sold_serials'), {
              serial,
              productId: item.product.id,
              productName: item.product.name,
              orderId: orderRef.id,
              documentNumber: docNumber,
              customerName: orderData.customerName,
              customerPhone: orderData.customerPhone,
              soldAt: createdAt,
              warrantyEndDate: warrantyEndDate.toISOString(),
              status: 'active',
            });
          }
        }
        
        await updateDoc(prodRef, updates);
      }

      // 3. Create Transaction
      const paymentAcc = paymentAccounts.find(p => p.id === accountId);
      await addDoc(collection(db, 'transactions'), {
        type: 'sale',
        amount: total,
        date: createdAt.split('T')[0],
        description: `POS Sale - ${docNumber}`,
        entityId: selectedCustomer?.id || 'walk-in',
        entityName: orderData.customerName,
        entityType: 'customer',
        paymentMethod: method,
        paymentAccountId: accountId,
        paymentAccountName: paymentAcc?.name || method,
        referenceId: orderRef.id,
        createdAt,
      });

      toast.success('Sale completed successfully!');
      
      // Cleanup
      setCart([]);
      setSelectedCustomer(null);
      setShowPaymentModal(false);
      
      // Re-fetch products to update stock in UI
      const prodSnap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(500)));
      setProducts(prodSnap.docs.map(d => ({id: d.id, ...d.data()})) as Product[]);

      printReceipt(orderData);

    } catch (err) {
      console.error("Checkout failed:", err);
      toast.error('Checkout failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const printReceipt = (orderData: any) => {
    // Generate an A4 size printable invoice
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let itemsHtml = '';
    orderData.items.forEach((item: any, index: number) => {
      itemsHtml += `
        <tr>
          <td style="text-align: center;">${index + 1}</td>
          <td>
            <strong>${item.name}</strong>
            ${item.selectedSerials?.length > 0 ? `<br><span style="color: #666; font-size: 12px;">Serial Numbers: ${item.selectedSerials.join(', ')}</span>` : ''}
            ${item.hasWarranty ? `<br><span style="color: #666; font-size: 12px;">Warranty: ${item.warrantyYears} Years</span>` : ''}
          </td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: right;">${formatCurrency(item.price, settings)}</td>
          <td style="text-align: right;">${formatCurrency(item.price * item.quantity, settings)}</td>
        </tr>
      `;
    });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${orderData.documentNumber}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 40px; color: #333; max-width: 210mm; margin: 0 auto; background: #fff; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; margin-bottom: 30px; }
            .brand-info h1 { font-size: 28px; font-weight: 800; color: #2563eb; margin: 0 0 5px 0; }
            .brand-info p { margin: 2px 0; font-size: 13px; color: #6b7280; }
            .invoice-title h2 { font-size: 24px; color: #111; margin: 0 0 10px 0; text-align: right; text-transform: uppercase; letter-spacing: 1px; }
            .meta-info { text-align: right; font-size: 13px; color: #4b5563; }
            .meta-info p { margin: 4px 0; }
            .meta-info strong { color: #111; }
            
            .billing-section { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .bill-to h3 { margin: 0 0 10px 0; font-size: 14px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; }
            .bill-to p { margin: 4px 0; font-size: 14px; color: #111; }
            
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            .items-table th { background: #f9fafb; border-bottom: 2px solid #e5e7eb; padding: 12px; text-align: left; font-size: 13px; color: #4b5563; text-transform: uppercase; }
            .items-table td { border-bottom: 1px solid #e5e7eb; padding: 15px 12px; font-size: 14px; color: #1f2937; vertical-align: top; }
            
            .summary-section { display: flex; justify-content: flex-end; }
            .summary-box { width: 320px; }
            .summary-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #4b5563; }
            .summary-row.total { font-size: 18px; font-weight: 700; color: #111; border-top: 2px solid #e5e7eb; border-bottom: none; padding-top: 15px; margin-top: 5px; }
            .summary-row.paid { font-size: 14px; font-weight: 600; color: #059669; }
            
            .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px; }
            
            @media print {
              body { padding: 20px; }
              @page { margin: 0; size: A4 portrait; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand-info">
              <h1>${settings?.brandName || 'CLICK POS'}</h1>
              <p>${settings?.address || 'Store Address Here'}</p>
              <p>Phone: ${settings?.phone || 'N/A'}</p>
              ${settings?.email ? `<p>Email: ${settings.email}</p>` : ''}
            </div>
            <div class="invoice-title">
              <h2>INVOICE</h2>
              <div class="meta-info">
                <p>Invoice No: <strong>${orderData.documentNumber}</strong></p>
                <p>Date: <strong>${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></p>
              </div>
            </div>
          </div>
          
          <div class="billing-section">
            <div class="bill-to">
              <h3>Billed To</h3>
              <p><strong>${orderData.customerName}</strong></p>
              ${orderData.customerPhone ? `<p>${orderData.customerPhone}</p>` : ''}
              ${orderData.customerEmail ? `<p>${orderData.customerEmail}</p>` : ''}
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th style="text-align: center; width: 5%;">#</th>
                <th style="width: 45%;">Item Description</th>
                <th style="text-align: center; width: 10%;">Qty</th>
                <th style="text-align: right; width: 20%;">Price</th>
                <th style="text-align: right; width: 20%;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div class="summary-section">
            <div class="summary-box">
              <div class="summary-row">
                <span>Subtotal</span>
                <span>${formatCurrency(orderData.subtotal, settings)}</span>
              </div>
              <div class="summary-row">
                <span>Discount</span>
                <span>${formatCurrency(orderData.discountAmount || 0, settings)}</span>
              </div>
              <div class="summary-row total">
                <span>Total Amount</span>
                <span>${formatCurrency(orderData.total, settings)}</span>
              </div>
              <div class="summary-row paid">
                <span>Paid via ${orderData.paymentMethod.toUpperCase()}</span>
                <span>${formatCurrency(orderData.paidAmount, settings)}</span>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p>Thank you for your business!</p>
            <p>This is a computer-generated document. No signature is required.</p>
          </div>
          
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const activeSerialItem = activeSerialItemIdx !== null ? cart[activeSerialItemIdx] : null;

  // Extract unique categories
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Products Config */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Modern Header */}
        <header className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-200">
              <ShoppingCart className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">CLICK POS</h1>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Retail System</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search products..." 
                className="pl-10 pr-4 py-2.5 bg-slate-100 border-transparent rounded-xl w-72 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-sm text-slate-700 placeholder-slate-400"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </header>

        {/* Category Filter Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex gap-2 overflow-x-auto whitespace-nowrap hide-scrollbar shadow-sm z-0 relative">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-bold transition-all border",
                activeCategory === cat 
                  ? "bg-slate-800 text-white border-slate-800 shadow-md shadow-slate-200" 
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
               <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center border-2 border-dashed border-slate-200">
                 <Search size={40} className="text-slate-300" />
               </div>
               <div className="text-center">
                 <p className="font-bold text-slate-600 text-lg">No products found</p>
                 <p className="text-sm">Try adjusting your search or category filter.</p>
               </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {filteredProducts.map(product => (
                <div 
                  key={product.id} 
                  className={cn(
                    "bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden transition-all flex flex-col group",
                    product.stock > 0 ? "cursor-pointer hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 active:scale-95" : "opacity-60 cursor-not-allowed"
                  )}
                  onClick={() => product.stock > 0 && addToCart(product)}
                >
                  <div className="h-40 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0 relative border-b border-slate-100 p-4">
                     {product.images && product.images[0] ? (
                       <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                     ) : (
                       <span className="text-slate-300 text-xs font-bold uppercase tracking-widest">No Image</span>
                     )}
                     {product.stock <= 0 && (
                       <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
                         <span className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-black tracking-wider shadow-lg">OUT OF STOCK</span>
                       </div>
                     )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <span className="text-[10px] text-slate-400 font-bold mb-1.5 uppercase tracking-wider">{product.category}</span>
                    <h3 className="text-sm font-bold text-slate-800 leading-tight mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">{product.name}</h3>
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
                      <div className="font-black text-slate-900 text-base">{formatCurrency(product.price, settings)}</div>
                      <span className={cn(
                        "text-[10px] font-black uppercase px-2 py-1 rounded-md tracking-wider",
                        product.stock > 0 ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                      )}>
                        {product.stock > 0 ? `${product.stock} In` : 'Out'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart Drawer */}
      <div className="w-[420px] bg-white border-l border-slate-200 shadow-2xl flex flex-col z-20">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 flex-shrink-0">
            <User size={18} className="text-blue-500" />
          </div>
          <div className="flex-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block mb-0.5">Customer</label>
            <select 
               className="w-full border-none p-0 text-sm font-bold text-slate-800 bg-transparent focus:ring-0 cursor-pointer"
               value={selectedCustomer?.id || ''}
               onChange={e => {
                 const c = customers.find(x => x.id === e.target.value);
                 setSelectedCustomer(c || null);
               }}
            >
              <option value="">Walk-in Customer</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.phone || c.email})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
          {cart.map((item, idx) => (
            <div key={`${item.product.id}-${idx}`} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
               <div className="flex justify-between items-start gap-2">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800 leading-tight line-clamp-2 text-sm">{item.product.name}</span>
                    <span className="text-[10px] text-amber-600 font-bold mt-0.5 tracking-wider">Buy Price: {formatCurrency(item.product.costPrice || 0, settings)}</span>
                  </div>
                  <button onClick={() => removeFromCart(item.product.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors flex-shrink-0"><Trash2 size={16} /></button>
               </div>
               
               {item.product.hasSerialTracking && (
                 <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-3 flex justify-between items-center">
                   <div className="flex flex-col">
                     <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Serial Numbers</span>
                     <span className="text-xs font-bold text-amber-900 mt-0.5">
                       {item.selectedSerials?.length || 0} / {item.quantity} selected
                     </span>
                   </div>
                   <button 
                     onClick={() => openSerialModal(idx)}
                     className={cn(
                       "text-xs px-3 py-1.5 rounded-lg font-bold transition-all shadow-sm",
                       (item.selectedSerials?.length || 0) === item.quantity ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "bg-amber-500 text-white hover:bg-amber-600 hover:shadow-md"
                     )}
                   >
                     {(item.selectedSerials?.length || 0) === item.quantity ? 'Edit' : 'Select'}
                   </button>
                 </div>
               )}

               <div className="flex items-center gap-3">
                 <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
                   <input
                     type="checkbox"
                     checked={item.hasWarranty || false}
                     onChange={(e) => {
                       const newCart = [...cart];
                       newCart[idx].hasWarranty = e.target.checked;
                       setCart(newCart);
                     }}
                     className="rounded border-slate-300 text-blue-600 focus:ring-blue-600/20 w-4 h-4"
                   />
                   Warranty
                 </label>
                 {item.hasWarranty && (
                   <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                     <input
                       type="number"
                       min="1"
                       value={item.warrantyYears || ''}
                       onChange={(e) => {
                         const newCart = [...cart];
                         newCart[idx].warrantyYears = Number(e.target.value);
                         setCart(newCart);
                       }}
                       className="w-10 text-xs border-none bg-transparent p-0 text-center font-black text-slate-800 focus:ring-0"
                       placeholder="0"
                     />
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Yrs</span>
                   </div>
                 )}
               </div>

               <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                 <div className="flex flex-col items-center">
                   <label className="text-[8px] font-bold text-blue-500 uppercase">Sale Price</label>
                   <input
                     type="number"
                     min={0}
                     value={item.product.price}
                     onChange={(e) => {
                       const newCart = [...cart];
                       newCart[idx].product = { ...newCart[idx].product, price: Number(e.target.value) };
                       setCart(newCart);
                     }}
                     className="w-20 text-center border border-blue-200 bg-blue-50/50 rounded py-0.5 font-bold text-blue-900 focus:ring-blue-500 text-xs"
                   />
                 </div>
                 
                 <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                   <button onClick={() => adjustQty(item.product.id, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-sm rounded-lg font-bold transition-all">-</button>
                   <span className="font-black w-6 text-center text-sm text-slate-800">{item.quantity}</span>
                   <button onClick={() => adjustQty(item.product.id, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-sm rounded-lg font-bold transition-all">+</button>
                 </div>
                 
                 <div className="flex flex-col items-end">
                   <label className="text-[8px] font-bold text-slate-400 uppercase">Total</label>
                   <span className="font-black text-blue-600 text-sm">{formatCurrency(item.product.price * item.quantity, settings)}</span>
                 </div>
               </div>
            </div>
          ))}
          
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 py-20">
               <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                 <ShoppingCart size={32} className="text-slate-300" />
               </div>
               <div className="text-center space-y-1">
                 <p className="font-black text-slate-600 text-lg">Cart is empty</p>
                 <p className="text-xs font-medium text-slate-400 px-8">Add items from the product grid to get started.</p>
               </div>
            </div>
          )}
        </div>

        {/* Totals & Checkout */}
        <div className="p-6 bg-white border-t border-slate-200 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] relative z-10">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm font-bold text-slate-500">
              <span>Subtotal</span>
              <span className="text-slate-800">{formatCurrency(subtotal, settings)}</span>
            </div>
            <div className="flex justify-between text-xl font-black text-slate-900 pt-3 border-t border-slate-100">
              <span>Total</span>
              <span className="text-blue-600">{formatCurrency(total, settings)}</span>
            </div>
          </div>

          <button 
             onClick={handleCheckoutClick} 
             disabled={cart.length === 0 || isProcessing}
             className="w-full bg-slate-900 hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 text-white py-4 rounded-xl flex items-center justify-center gap-3 font-black text-lg shadow-xl shadow-slate-900/20 hover:shadow-slate-900/40 transition-all disabled:shadow-none"
           >
            <Banknote size={24} />
            {isProcessing ? 'Processing...' : 'Charge Amount'}
          </button>
        </div>
      </div>

      {/* Serial Selection Modal */}
      {showSerialModal && activeSerialItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-[500px] max-w-[90vw] max-h-[85vh] flex flex-col">
            <h2 className="text-xl font-black text-gray-900 mb-1">Select Serial Numbers</h2>
            <p className="text-sm text-gray-500 mb-4 pb-4 border-b border-gray-100">
              {activeSerialItem.product.name}
            </p>

            <div className="flex justify-between items-center mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <span className="text-sm font-bold text-gray-700">Required: {activeSerialItem.quantity}</span>
              <span className={cn(
                "text-sm font-bold",
                (activeSerialItem.selectedSerials?.length || 0) === activeSerialItem.quantity ? "text-green-600" : "text-amber-600"
              )}>
                Selected: {activeSerialItem.selectedSerials?.length || 0}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[200px] mb-4">
              {(!activeSerialItem.product.availableSerials || activeSerialItem.product.availableSerials.length === 0) ? (
                <div className="text-center py-8 text-red-500 font-bold">
                  No serial numbers available for this product in stock.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {activeSerialItem.product.availableSerials.map((serial: string) => {
                    const isSelected = (activeSerialItem.selectedSerials || []).includes(serial);
                    return (
                      <button
                        key={serial}
                        onClick={() => toggleSerialSelection(serial)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg border text-sm font-mono transition-all",
                          isSelected 
                            ? "bg-green-500 text-white border-green-600 shadow-inner" 
                            : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                        )}
                      >
                        {isSelected && <CheckCircle2 size={14} className="inline mr-1" />}
                        {serial}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowSerialModal(false);
                  setActiveSerialItemIdx(null);
                }}
                className="px-6 py-2 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Account Selection Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-[500px] max-w-[90vw]">
            <h2 className="text-xl font-black text-gray-900 mb-4 pb-4 border-b border-gray-100">Receive Payment</h2>
            
            <div className="mb-6">
              <div className="text-center text-3xl font-black text-[#3B82F6] mb-2">
                {formatCurrency(total, settings)}
              </div>
              <div className="text-center text-sm font-bold text-gray-500 uppercase tracking-widest">
                Total Payable
              </div>
            </div>

            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
              {paymentAccounts.filter(acc => acc.status !== 'inactive').map(acc => (
                <button
                  key={acc.id}
                  onClick={() => processPaymentAndOrder(acc.id, acc.type || 'cash')}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-[#3B82F6] hover:bg-blue-50 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div>
                    <div className="font-bold text-gray-900 group-hover:text-[#3B82F6]">{acc.name}</div>
                    <div className="text-xs text-gray-500 uppercase mt-0.5">{acc.type}</div>
                  </div>
                  <div className="text-gray-400 group-hover:text-[#3B82F6]">
                    <CreditCard size={20} />
                  </div>
                </button>
              ))}
              {paymentAccounts.length === 0 && (
                <div className="text-center py-6 text-red-500 text-sm font-bold">
                  No payment accounts configured. Please add an account in Settings/Accounts first.
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={isProcessing}
                className="px-4 py-2 text-gray-500 font-bold hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
