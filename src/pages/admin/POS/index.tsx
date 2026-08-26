import React, { useState, useEffect } from 'react';
import { formatCurrency, cn } from '../../../lib/utils';
import { generateDocumentNumber } from '../../../lib/numbering';
import { db } from '../../../firebase';
import { collection, getDocs, query, orderBy, limit, addDoc, doc, updateDoc } from 'firebase/firestore';
import { Product, Customer, PaymentAccount } from '../../../types';
import toast from 'react-hot-toast';
import { useSettings } from '../../../context/SettingsContext';
import { useAuth } from '../../../context/AuthContext';
import { POSHeader } from './components/POSHeader';
import { POSCartArea } from './components/POSCartArea';
import { POSSidebar } from './components/POSSidebar';
import { POSModals } from './components/POSModals';

export const RetailPOS = () => {
  const { settings } = useSettings();
  const { user } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  const [cart, setCart] = useState<{cartItemId: string, product: Product, quantity: number, hasWarranty?: boolean, warrantyYears?: number, selectedSerials?: string[], selectedVariant?: any}[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [showSerialModal, setShowSerialModal] = useState(false);
  const [activeSerialItemIdx, setActiveSerialItemIdx] = useState<number | null>(null);

  const [isPaymentView, setIsPaymentView] = useState(false);

  const [discountType, setDiscountType] = useState<'flat' | 'percentage'>('flat');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(0);

  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [customerFormData, setCustomerFormData] = useState({ name: '', phone: '', email: '', address: '' });

  const [heldCarts, setHeldCarts] = useState<{id: string, time: string, cart: any[], customer: any}[]>([]);
  const [showHeldCarts, setShowHeldCarts] = useState(false);

  const [payments, setPayments] = useState<{accountId: string, amount: number}[]>([]);
  const [receivedAmount, setReceivedAmount] = useState<number | ''>('');

  useEffect(() => {
    const stored = localStorage.getItem('pos_held_carts');
    if (stored) {
      try {
        setHeldCarts(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

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

  useEffect(() => {
    let barcode = '';
    let timeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key === 'Enter') {
        if (barcode.trim().length > 0) {
          const scanValue = barcode.trim();
          const searchLower = scanValue.toLowerCase();
          
          const exactMatches = products.filter(p => 
            p.id === scanValue || 
            (p as any).barcode === scanValue || 
            p.name.toLowerCase() === searchLower
          );
          
          const partialMatches = products.filter(p => p.name.toLowerCase().includes(searchLower));
          
          const bestMatch = exactMatches.length === 1 ? exactMatches[0] : (partialMatches.length === 1 ? partialMatches[0] : null);

          if (bestMatch) {
            addToCart(bestMatch);
            setSearchQuery('');
            toast.success(`Scanned: ${bestMatch.name}`);
          } else if (exactMatches.length > 1 || partialMatches.length > 1) {
            toast.success(`Found multiple items. Please select manually.`);
          } else {
            toast.error('No matching product found for scan');
          }
        }
        barcode = '';
      } else if (e.key.length === 1) {
        barcode += e.key;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          barcode = '';
        }, 50);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeout);
    };
  }, [products]);

  const handleQuickAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, 'customers'), {
        ...customerFormData,
        createdAt: new Date().toISOString()
      });
      const newC = { id: docRef.id, ...customerFormData, createdAt: new Date().toISOString() } as Customer;
      setCustomers([newC, ...customers]);
      setSelectedCustomer(newC);
      setIsAddingCustomer(false);
      setCustomerFormData({ name: '', phone: '', email: '', address: '' });
      toast.success('Customer added seamlessly!');
    } catch (err) {
      toast.error('Failed to add customer');
    }
  };

  const holdCurrentCart = () => {
    if (cart.length === 0) return;
    const newHold = {
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString(),
      cart,
      customer: selectedCustomer
    };
    const updated = [newHold, ...heldCarts];
    setHeldCarts(updated);
    localStorage.setItem('pos_held_carts', JSON.stringify(updated));
    setCart([]);
    setSelectedCustomer(null);
    toast.success('Cart held!');
  };

  const restoreCart = (id: string) => {
    const toRestore = heldCarts.find(h => h.id === id);
    if (toRestore) {
      if (cart.length > 0) holdCurrentCart();
      setCart(toRestore.cart);
      setSelectedCustomer(toRestore.customer);
      const updated = heldCarts.filter(h => h.id !== id);
      setHeldCarts(updated);
      localStorage.setItem('pos_held_carts', JSON.stringify(updated));
      setShowHeldCarts(false);
      toast.success('Cart restored');
    }
  };

  const deleteHeldCart = (id: string) => {
    const updated = heldCarts.filter(h => h.id !== id);
    setHeldCarts(updated);
    localStorage.setItem('pos_held_carts', JSON.stringify(updated));
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast.error('Item is out of stock', { icon: '🚫' });
      return;
    }
    
    setCart(prev => {
      const hasVariants = product.variants && product.variants.length > 0;
      const existingIdx = prev.findIndex(item => 
        item.product.id === product.id && 
        (!hasVariants || item.selectedVariant === null)
      );
      
      if (existingIdx >= 0 && !hasVariants) {
        const newCart = [...prev];
        if (newCart[existingIdx].quantity < product.stock) {
          newCart[existingIdx].quantity += 1;
        } else {
          toast.error('Cannot exceed available stock');
        }
        return newCart;
      }
      
      return [...prev, {
        cartItemId: Date.now().toString() + Math.random().toString(),
        product: product, 
        quantity: 1, 
        selectedSerials: [],
        selectedVariant: null
      }];
    });
  };

  const changeVariant = (cartItemId: string, variantId: string) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.cartItemId === cartItemId && item.product.variants) {
          const v = item.product.variants.find((x: any) => x.id === variantId);
          if (v) {
             return { ...item, selectedVariant: v, product: { ...item.product, price: v.price } };
          }
        }
        return item;
      });
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const adjustQty = (cartItemId: string, qty: number) => {
    if (qty < 1) {
      removeFromCart(cartItemId);
      return;
    }
    setCart(prev => {
      return prev.map(item => {
        if (item.cartItemId === cartItemId) {
          const currentStockLimit = item.selectedVariant && item.selectedVariant.stock > 0 ? item.selectedVariant.stock : item.product.stock;
          if (qty > currentStockLimit) {
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

  const [isRedeemingPoints, setIsRedeemingPoints] = useState(false);
  const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  let calculatedDiscount = discountType === 'percentage' ? (subtotal * discountValue) / 100 : discountValue;
  if (isRedeemingPoints) calculatedDiscount += 40;
  const subtotalAfterDiscount = Math.max(0, subtotal - calculatedDiscount);
  const calculatedTax = (subtotalAfterDiscount * taxPercent) / 100;
  const total = subtotalAfterDiscount + calculatedTax;

  useEffect(() => {
    if (isPaymentView && paymentAccounts.length > 0 && payments.length === 0) {
      setPayments([{ accountId: paymentAccounts[0].id, amount: total }]);
    }
  }, [isPaymentView, total, paymentAccounts]);

  const handleCheckoutClick = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    for (const item of cart) {
      if (item.product.variants && item.product.variants.length > 0 && !item.selectedVariant) {
        toast.error(`Please select a variant for ${item.product.name}`);
        return;
      }
    }

    setIsPaymentView(true);
  };

  const processPaymentAndOrder = async () => {
    try {
      if (cart.length === 0) {
        toast.error('Cart is empty');
        return;
      }

      for (const item of cart) {
        if (item.product.variants && item.product.variants.length > 0 && !item.selectedVariant) {
          toast.error(`Please select a variant for ${item.product.name}`);
          return;
        }
      }

      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      if (Math.abs(totalPaid - total) > 0.01) {
        toast.error(`Payment amount (${formatCurrency(totalPaid, settings)}) does not match total (${formatCurrency(total, settings)})`);
        return;
      }

      setIsProcessing(true);
      const createdAt = new Date().toISOString();
      const docNumber = await generateDocumentNumber('invoice');
      
      const processedItems = cart.map(c => {
        const itemName = c.selectedVariant ? `${c.product.name} (${c.selectedVariant.name})` : c.product.name;
        return {
          id: c.product.id,
          productId: c.product.id,
          variantId: c.selectedVariant?.id || null,
          name: itemName,
          price: c.product.price,
          costPrice: c.product.costPrice || 0,
          quantity: c.quantity,
          hasSerialTracking: c.product.hasSerialTracking || false,
          selectedSerials: c.selectedSerials || [],
          hasWarranty: c.hasWarranty || false,
          warrantyYears: c.warrantyYears || 0
        };
      });

      const totalCost = processedItems.reduce((acc, i) => acc + (i.costPrice * i.quantity), 0);
      const profit = total - totalCost;

      const methodsUsed = payments.map(p => {
        const acc = paymentAccounts.find(a => a.id === p.accountId);
        return acc ? acc.name : 'Unknown';
      }).join(', ');

      const orderData = {
        documentNumber: docNumber,
        type: 'pos_sale',
        customerId: selectedCustomer?.id || 'general',
        customerName: selectedCustomer ? selectedCustomer.name : 'General Customer',
        customerPhone: selectedCustomer?.phone || '',
        customerEmail: selectedCustomer?.email || '',
        customerAddress: selectedCustomer?.address || '',
        items: processedItems,
        subtotal,
        discountAmount: calculatedDiscount,
        taxAmount: calculatedTax,
        totalCost,
        profit,
        total,
        paidAmount: total,
        paymentStatus: 'paid',
        paymentMethod: methodsUsed,
        splitPayments: payments,
        status: 'delivered',
        userId: user?.uid || 'admin',
        createdAt,
      };

      let orderRefId = '';
      try {
        const orderRef = await addDoc(collection(db, 'orders'), orderData);
        orderRefId = orderRef.id;
      } catch (e) {
        console.error("Failed adding to orders:", e);
        throw new Error("orders");
      }

      for (const item of cart) {
        const prodRef = doc(db, 'products', item.product.id);
        const updates: any = {};
        
        updates.stock = Math.max(0, item.product.stock - item.quantity);
        
        if (item.selectedVariant && item.product.variants) {
          updates.variants = item.product.variants.map((v: any) => 
            v.id === item.selectedVariant!.id 
              ? { ...v, stock: Math.max(0, v.stock - item.quantity) } 
              : v
          );
        }
        
        if (item.product.hasSerialTracking) {
          const serialsToUse = (item.selectedSerials && item.selectedSerials.length === item.quantity) 
            ? item.selectedSerials 
            : (item.product.availableSerials || []).slice(0, item.quantity);
            
          const remainingSerials = (item.product.availableSerials || []).filter(
            (s: string) => !serialsToUse.includes(s)
          );
          updates.availableSerials = remainingSerials;
          
          const warrantyEndDate = new Date();
          const wMonths = item.hasWarranty ? (item.warrantyYears || 0) * 12 : (item.product.warrantyMonths || 0);
          warrantyEndDate.setMonth(warrantyEndDate.getMonth() + wMonths);

          for (const serial of serialsToUse) {
            try {
              await addDoc(collection(db, 'sold_serials'), {
                serial,
                productId: item.product.id,
                productName: item.product.name,
                orderId: orderRefId,
                documentNumber: docNumber,
                customerName: orderData.customerName,
                customerPhone: orderData.customerPhone,
                soldAt: createdAt,
                warrantyEndDate: warrantyEndDate.toISOString(),
                status: 'active',
              });
            } catch (e) {
              console.error("Failed adding to sold_serials:", e);
              throw new Error("sold_serials");
            }
          }
        }
        
        try {
          await updateDoc(prodRef, updates);
        } catch (e) {
          console.error("Failed updating product:", e);
          throw new Error("products");
        }
      }

      for (const p of payments) {
        if (p.amount <= 0) continue;
        const paymentAcc = paymentAccounts.find(a => a.id === p.accountId);
        if (!paymentAcc) continue;

        try {
          await addDoc(collection(db, 'transactions'), {
            type: 'sale',
            amount: p.amount,
            date: createdAt.split('T')[0],
            description: `POS Sale - ${docNumber} (Split Payment)`,
            entityId: selectedCustomer?.id || 'general',
            entityName: orderData.customerName,
            entityType: 'customer',
            paymentMethod: paymentAcc.type || 'cash',
            paymentAccountId: paymentAcc.id,
            paymentAccountName: paymentAcc.name,
            referenceId: orderRefId,
            createdAt,
          });
        } catch (e) {
          console.error("Failed adding transaction:", e);
          throw new Error("transactions");
        }
      }

      const pointsRedeemed = isRedeemingPoints ? 100 : 0;
      const pointsEarned = Math.floor(total / 100);

      toast.success('Sale completed successfully!');
      
      if (selectedCustomer) {
        try {
          const custRef = doc(db, 'customers', selectedCustomer.id);
          const newPoints = (selectedCustomer.loyaltyPoints || 0) - pointsRedeemed + pointsEarned;
          await updateDoc(custRef, {
            loyaltyPoints: newPoints
          });
          setSelectedCustomer({ ...selectedCustomer, loyaltyPoints: newPoints });
        } catch (e) {
          console.error('Failed to update loyalty points', e);
          // Don't throw here to avoid failing checkout for just loyalty points
        }
      }

      setCart([]);
      setSelectedCustomer(null);
      setIsPaymentView(false);
      setIsRedeemingPoints(false);
      setReceivedAmount('');
      setPayments([]);
      
      const prodSnap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(500)));
      setProducts(prodSnap.docs.map(d => ({id: d.id, ...d.data()})) as Product[]);

      printReceipt(orderData);

    } catch (err: any) {
      console.error("Checkout failed:", err);
      toast.error('Checkout failed: ' + (err.message || 'Permissions error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const printReceipt = (orderData: any) => {
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
              <p>${settings?.address || 'Shop 1072, Level 10, ECS Computer City, New Elephant Road, Dhaka, Bangladesh, 1205'}</p>
              <p>Phone: ${settings?.phone || '+8809640887777'}</p>
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
              ${orderData.taxAmount ? `
              <div class="summary-row">
                <span>VAT / Tax</span>
                <span>${formatCurrency(orderData.taxAmount, settings)}</span>
              </div>` : ''}
              <div class="summary-row total">
                <span>Total Amount</span>
                <span>${formatCurrency(orderData.total, settings)}</span>
              </div>
              <div class="summary-row paid">
                <span>Paid via: ${orderData.paymentMethod.toUpperCase()}</span>
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

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <POSHeader 
          heldCarts={heldCarts}
          showHeldCarts={showHeldCarts}
          setShowHeldCarts={setShowHeldCarts}
          restoreCart={restoreCart}
          deleteHeldCart={deleteHeldCart}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          products={products}
          filteredProducts={filteredProducts}
          addToCart={addToCart}
          settings={settings}
        />

        <POSCartArea
          cart={cart}
          setCart={setCart}
          settings={settings}
          adjustQty={adjustQty}
          changeVariant={changeVariant}
          removeFromCart={removeFromCart}
          openSerialModal={openSerialModal}
          selectedCustomer={selectedCustomer}
          setSelectedCustomer={setSelectedCustomer}
          customers={customers}
          setIsAddingCustomer={setIsAddingCustomer}
        />
      </div>

      <POSSidebar
        isPaymentView={isPaymentView}
        setIsPaymentView={setIsPaymentView}
        payments={payments}
        setPayments={setPayments}
        paymentAccounts={paymentAccounts}
        receivedAmount={receivedAmount}
        setReceivedAmount={setReceivedAmount}
        total={total}
        subtotal={subtotal}
        discountType={discountType}
        setDiscountType={setDiscountType}
        discountValue={discountValue}
        setDiscountValue={setDiscountValue}
        taxPercent={taxPercent}
        setTaxPercent={setTaxPercent}
        holdCurrentCart={holdCurrentCart}
        processPaymentAndOrder={processPaymentAndOrder}
        cart={cart}
        isProcessing={isProcessing}
        settings={settings}
        isRedeemingPoints={isRedeemingPoints}
        setIsRedeemingPoints={setIsRedeemingPoints}
        selectedCustomer={selectedCustomer}
      />

      <POSModals
        showSerialModal={showSerialModal}
        activeSerialItem={activeSerialItem}
        setShowSerialModal={setShowSerialModal}
        setActiveSerialItemIdx={setActiveSerialItemIdx}
        toggleSerialSelection={toggleSerialSelection}
        isAddingCustomer={isAddingCustomer}
        setIsAddingCustomer={setIsAddingCustomer}
        customerFormData={customerFormData}
        setCustomerFormData={setCustomerFormData}
        handleQuickAddCustomer={handleQuickAddCustomer}
      />
    </div>
  );
};
