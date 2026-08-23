import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useSettings } from '../../context/SettingsContext';
import { Layout } from '../../components/Layout';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'react-hot-toast';
import { Lock, ShieldCheck, CheckCircle, CreditCard, Landmark, Wallet, ArrowRight, Loader2, Server, Key } from 'lucide-react';
import { db } from '../../firebase';
import { collection, addDoc, query, where, getDocs, doc, writeBatch } from 'firebase/firestore';
import { generateDocumentNumber } from '../../lib/numbering';
import { initiateBkashPayment, initiateSSLCommerzPayment, initiateNagadPayment } from '../../services/paymentApi';
import { apiPost } from '../../services/apiClient';

export const HostingCheckout: React.FC = () => {
  const { user } = useAuth();
  const { items: allItems, total, clearCart } = useCart();
  const { settings } = useSettings();
  const navigate = useNavigate();
  
  const items = allItems.filter(i => i.category === 'Hosting & Domains');
  const hostingSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = 0;

  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [isValidatingCode, setIsValidatingCode] = useState(false);

  const discountAmount = appliedDiscount ? (hostingSubtotal * appliedDiscount.discountPercentage) / 100 : 0;
  const grandTotal = hostingSubtotal - discountAmount + shippingCost;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    company: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postcode: '',
    country: 'Bangladesh',
    paymentMethod: 'bkash',
    transactionId: '',
    termsAccepted: false
  });

  const [domainConfig, setDomainConfig] = useState({
    ns1: 'ns1.click2itbd.com',
    ns2: 'ns2.click2itbd.com',
    useCustomNs: false
  });

  const [hostingConfig, setHostingConfig] = useState({
    domain: ''
  });

  const [transferAuthCodes, setTransferAuthCodes] = useState<Record<string, string>>({});
  const [bkashNumber, setBkashNumber] = useState('');

  useEffect(() => {
    const fetchBkashNumber = async () => {
      try {
        const res = await fetch('/api/public/config');
        const json = await res.json();
        if (json.success && json.data?.manualBkashNumber) {
          setBkashNumber(json.data.manualBkashNumber);
        }
      } catch (e) {
        console.error('Failed to load bKash number:', e);
      }
    };
    fetchBkashNumber();
  }, []);

  const hasDomain = items.some(i => i.itemType === 'domain');
  const hasHosting = items.some(i => i.itemType === 'hosting');
  const hasTransfer = items.some(i => i.itemType === 'domain_transfer');

  const [isProcessing, setIsProcessing] = useState(false);
  const [existingOrderId, setExistingOrderId] = useState<string | null>(null);

  if (items.length === 0) {
    navigate('/hosting/cart');
    return null;
  }

  // Auth Enforcement
  if (!user) {
    return (
      <Layout fullWidth>
        <div className="min-h-[60vh] flex items-center justify-center bg-gray-50 px-4 py-12">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden text-center p-8">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-500 mb-8">Please login or create an account to securely complete your hosting and domain purchase.</p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/login?redirect=/hosting/checkout')}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-md shadow-blue-200"
              >
                Login or Create Account
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    setIsValidatingCode(true);
    try {



      const q = query(
        collection(db, 'couponCodes'), 
        where('code', '==', discountCode.trim().toUpperCase()),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        toast.error('Invalid or inactive discount code');
        return;
      }

      const codeData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
      
      if (new Date(codeData.expiryDate) < new Date()) {
        toast.error('This discount code has expired');
        return;
      }

      setAppliedDiscount(codeData);
      toast.success(`Discount applied: ${codeData.discountPercentage}% off`);
    } catch (error) {
      console.error('Error validating discount code:', error);
      toast.error('Failed to validate discount code');
    } finally {
      setIsValidatingCode(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.name]: value }));
  };

  const handleCompleteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.termsAccepted) {
      toast.error('You must agree to the Terms and Conditions.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    const phoneRegex = /^(?:\+88|88)?(01[3-9]\d{8})$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error('Please enter a valid Bangladeshi phone number.');
      return;
    }

    if (hasHosting && !hasDomain) {
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
      if (!hostingConfig.domain || !domainRegex.test(hostingConfig.domain)) {
        toast.error('Please enter a valid domain name for your hosting plan.');
        return;
      }
    }

    if (['card', 'nagad'].includes(formData.paymentMethod)) {
      toast.error('This payment method is coming soon.');
      return;
    }

    if (formData.paymentMethod === 'bkash' && !formData.transactionId.trim()) {
      toast.error('Please enter the Transaction ID for your bKash payment.');
      return;
    }

    const transferItems = items.filter(i => i.itemType === 'domain_transfer');
    for (const item of transferItems) {
      const code = transferAuthCodes[item.id]?.trim();
      if (!code) {
        toast.error(`Please enter the Auth/EPP Code for ${item.domain || item.id.replace('domain_transfer_', '')}`);
        return;
      }
      if (code.length < 5) {
        toast.error(`Auth/EPP Code for ${item.domain || item.id.replace('domain_transfer_', '')} appears too short.`);
        return;
      }
    }

    setIsProcessing(true);

    try {
      let orderId = existingOrderId;

      if (!orderId) {
      const docType = 'INV'; 
      const docNumber = await generateDocumentNumber(docType);

      const orderData = {
        userId: user?.uid || 'guest',
        items: items.map(item => ({ ...item, isDigital: true })),
        total: grandTotal,
        shippingCost,
        status: 'pending',
        paymentStatus: 'pending',
        type: 'invoice',
        documentNumber: docNumber,
        customerName: `${formData.firstName} ${formData.lastName}`.trim(),
        customerEmail: formData.email,
        customerPhone: formData.phone,
        shippingAddress: `${formData.address1}, ${formData.address2 ? formData.address2 + ', ' : ''}${formData.city}, ${formData.state} - ${formData.postcode}, ${formData.country}`,
        company: formData.company,
        paymentMethod: formData.paymentMethod,
        transactionId: ['bkash', 'bank'].includes(formData.paymentMethod) ? formData.transactionId.trim() : null,
        discountAmount: discountAmount,
        appliedDiscountCode: appliedDiscount ? appliedDiscount.code : null,
        createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

      const batch = writeBatch(db);
      const newOrderRef = doc(collection(db, 'orders'));
      batch.set(newOrderRef, orderData);
      
      
      const domainItems = items.filter(item => item.itemType === 'domain');
      
      const renewalItems = items.filter(item => item.itemType === 'domain_renewal');
      const transferItems = items.filter(item => item.itemType === 'domain_transfer');


      const hostingItems = items.filter(item => item.itemType === 'hosting');

      for (const domainItem of domainItems) {
        const domain = domainItem.id.replace('domain_', '');
        const tld = domainItem.domainTld || domain.split('.').pop() || '';
        const dOrderRef = doc(collection(db, 'domainOrders'));
        batch.set(dOrderRef, {
          userId: user?.uid || 'guest',
          orderId: newOrderRef.id,
          domain: domain,
          tld: tld,
          termYears: domainItem.termYears || 1,
          price: domainItem.price,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      
      for (const rItem of renewalItems) {
        const dOrderRef = doc(collection(db, 'domainOrders'));
        batch.set(dOrderRef, {
          userId: user?.uid || 'guest',
          orderId: newOrderRef.id,
          domain: rItem.domain,
          tld: rItem.domain.split('.').pop() || '',
          termYears: rItem.termYears || 1,
          price: rItem.price,
          status: 'pending',
          action: 'renewal',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      
      for (const tItem of transferItems) {
        const dOrderRef = doc(collection(db, 'domainOrders'));
        batch.set(dOrderRef, {
          userId: user?.uid || 'guest',
          orderId: newOrderRef.id,
          domain: tItem.domain || tItem.id.replace('domain_transfer_', ''),
          tld: (tItem.domain || tItem.id.replace('domain_transfer_', '')).split('.').pop() || '',
          termYears: tItem.termYears || 1,
          price: tItem.price,
          status: 'pending',
          action: 'transfer',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      for (const hostingItem of hostingItems) {
        const hAccountRef = doc(collection(db, 'hostingAccounts'));
        
        batch.set(hAccountRef, {
          userId: user?.uid || 'guest',
          orderId: newOrderRef.id,
          planId: hostingItem.id.replace('hosting_', ''),
          domain: hostingConfig.domain || null,
          provider: 'cpanel',
          status: 'pending',
          provisioningStatus: 'pending',
          billingCycle: hostingItem.billingCycle || 'monthly',
          autoRenew: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      await batch.commit();
      orderId = newOrderRef.id;
        setExistingOrderId(orderId);
      } // End if (!orderId)

      // Store transfer auth codes securely via backend API
      if (transferItems.length > 0) {
        try {
          const authCodesPayload = transferItems
            .filter(item => transferAuthCodes[item.id]?.trim())
            .map(item => ({
              orderId,
              domain: item.domain || item.id.replace('domain_transfer_', ''),
              authCode: transferAuthCodes[item.id].trim(),
            }));
          
          if (authCodesPayload.length > 0) {
            await apiPost('/api/domain/transfer-auth-codes', {
              orderId,
              authCodes: authCodesPayload,
            });
          }
        } catch (error) {
          console.error('Failed to store transfer auth codes:', error);
          toast.error('Failed to secure transfer authorization codes. Please try again.');
          setIsProcessing(false);
          return;
        }
      }

      // Process payment
      if (formData.paymentMethod === 'bkash') {
        clearCart();
        navigate(`/order-success/${orderId}`);
        return;
      } else if (formData.paymentMethod === 'card') {
        const res = await initiateSSLCommerzPayment(
          orderId, 
          grandTotal, 
          formData.email, 
          `${formData.firstName} ${formData.lastName}`, 
          formData.phone
        );
        if (res.success && res.paymentUrl) {
          window.location.href = res.paymentUrl;
          return;
        } else {
          throw new Error(res.errorMessage || 'Failed to initiate Card payment');
        }
      } else if (formData.paymentMethod === 'nagad') {
        const res = await initiateNagadPayment(orderId, grandTotal, formData.phone);
        if (res.success && res.paymentUrl) {
          window.location.href = res.paymentUrl;
          return;
        } else {
          throw new Error(res.errorMessage || 'Failed to initiate Nagad payment');
        }
      }

      toast.success('Order completed successfully!');
      clearCart();
      navigate(`/order-success/${orderId}`);
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to place order');
      setIsProcessing(false);
    }
  };

  return (
    <Layout fullWidth>
      <div className="bg-gray-50 min-h-screen pb-20">
        {/* Header */}
        <div className="bg-[#0a1628] py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Secure Checkout</h1>
                <p className="text-blue-200 mt-1">Complete your order securely and quickly.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
          <form onSubmit={handleCompleteOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left Column (Forms) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Product Configuration */}
              {(hasDomain || hasHosting) && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Server className="w-5 h-5 text-blue-600" />
                      Product Configuration
                    </h2>
                  </div>
                  <div className="p-6 space-y-6">
                    {hasHosting && !hasDomain && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-900">Hosting Domain</h3>
                        <p className="text-sm text-gray-500">Please specify the domain name you will use for your hosting plan.</p>
                        <input 
                          type="text" 
                          placeholder="e.g., mydomain.com"
                          value={hostingConfig.domain}
                          onChange={(e) => setHostingConfig({...hostingConfig, domain: e.target.value})}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" 
                        />
                      </div>
                    )}
                    
                    {hasDomain && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-900">Nameservers</h3>
                        
                        <div className="space-y-3">
                          <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                            <input 
                              type="radio" 
                              checked={!domainConfig.useCustomNs} 
                              onChange={() => setDomainConfig({...domainConfig, useCustomNs: false})}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Use Default Nameservers</p>
                              <p className="text-xs text-gray-500">ns1.click2itbd.com, ns2.click2itbd.com (Recommended)</p>
                            </div>
                          </label>

                          <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                            <input 
                              type="radio" 
                              checked={domainConfig.useCustomNs} 
                              onChange={() => setDomainConfig({...domainConfig, useCustomNs: true})}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Use Custom Nameservers</p>
                              <p className="text-xs text-gray-500">Enter your own nameservers below</p>
                            </div>
                          </label>
                        </div>

                        {domainConfig.useCustomNs && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-1.5">
                              <label className="text-sm font-medium text-gray-700">Nameserver 1</label>
                              <input 
                                type="text" 
                                value={domainConfig.ns1}
                                onChange={(e) => setDomainConfig({...domainConfig, ns1: e.target.value})}
                                placeholder="ns1.example.com"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" 
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-sm font-medium text-gray-700">Nameserver 2</label>
                              <input 
                                type="text" 
                                value={domainConfig.ns2}
                                onChange={(e) => setDomainConfig({...domainConfig, ns2: e.target.value})}
                                placeholder="ns2.example.com"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" 
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Transfer Auth Codes */}
              {hasTransfer && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Key className="w-5 h-5 text-blue-600" />
                      Transfer Authorization Codes
                    </h2>
                  </div>
                  <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-500">Please provide the Auth/EPP Code for each domain you are transferring. These codes are required by your current registrar to authorize the transfer.</p>
                    {items.filter(i => i.itemType === 'domain_transfer').map((item) => (
                      <div key={item.id} className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">
                          Auth/EPP Code for <span className="text-blue-600 font-semibold">{item.domain || item.id.replace('domain_transfer_', '')}</span>
                        </label>
                        <input
                          type="text"
                          value={transferAuthCodes[item.id] || ''}
                          onChange={(e) => setTransferAuthCodes(prev => ({ ...prev, [item.id]: e.target.value.trim() }))}
                          placeholder="Enter your Auth/EPP Code"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Billing Details */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <h2 className="text-lg font-semibold text-gray-900">Billing Details</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">First Name *</label>
                      <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Last Name *</label>
                      <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Email Address *</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Phone Number *</label>
                      <div className="flex">
                        <span className="inline-flex items-center px-4 py-2.5 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 text-gray-500">
                          +880
                        </span>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="flex-1 w-full px-4 py-2.5 rounded-r-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" />
                      </div>
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-sm font-medium text-gray-700">Company (Optional)</label>
                      <input type="text" name="company" value={formData.company} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-sm font-medium text-gray-700">Street Address *</label>
                      <input type="text" name="address1" value={formData.address1} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-sm font-medium text-gray-700">Address Line 2 (Optional)</label>
                      <input type="text" name="address2" value={formData.address2} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">City *</label>
                      <input type="text" name="city" value={formData.city} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">State/Region *</label>
                      <input type="text" name="state" value={formData.state} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Postcode *</label>
                      <input type="text" name="postcode" value={formData.postcode} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Country *</label>
                      <select name="country" value={formData.country} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white">
                        <option value="Bangladesh">Bangladesh</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <h2 className="text-lg font-semibold text-gray-900">Payment Method</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <label className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.paymentMethod === 'bkash' ? 'border-pink-600 bg-pink-50/50' : 'border-gray-100 hover:border-gray-200'}`}>
                      <input type="radio" name="paymentMethod" value="bkash" checked={formData.paymentMethod === 'bkash'} onChange={handleChange} className="sr-only" />
                      <Wallet className={`w-8 h-8 mb-2 ${formData.paymentMethod === 'bkash' ? 'text-pink-600' : 'text-gray-400'}`} />
                      <span className={`text-sm font-medium ${formData.paymentMethod === 'bkash' ? 'text-pink-900' : 'text-gray-600'}`}>bKash</span>
                      {formData.paymentMethod === 'bkash' && <div className="absolute top-2 right-2"><CheckCircle className="w-4 h-4 text-pink-600" /></div>}
                    </label>

                    <label className="relative flex flex-col items-center justify-center p-4 rounded-xl border-2 border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed">
                      <input type="radio" name="paymentMethod" value="nagad" disabled className="sr-only" />
                      <Wallet className="w-8 h-8 mb-2 text-gray-400" />
                      <span className="text-sm font-medium text-gray-500">Nagad</span>
                      <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[1px] rounded-xl">
                        <span className="bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap">Coming Soon</span>
                      </div>
                    </label>

                    <label className="relative flex flex-col items-center justify-center p-4 rounded-xl border-2 border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed">
                      <input type="radio" name="paymentMethod" value="card" disabled className="sr-only" />
                      <CreditCard className="w-8 h-8 mb-2 text-gray-400" />
                      <span className="text-sm font-medium text-gray-500">Credit Card</span>
                      <span className="text-[10px] text-gray-400 mt-1">Visa, Master</span>
                      <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[1px] rounded-xl">
                        <span className="bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap">Coming Soon</span>
                      </div>
                    </label>

                    <label className="relative flex flex-col items-center justify-center p-4 rounded-xl border-2 border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed">
                      <input type="radio" name="paymentMethod" value="bank" disabled className="sr-only" />
                      <Landmark className="w-8 h-8 mb-2 text-gray-400" />
                      <span className="text-sm font-medium text-gray-500">Bank Transfer</span>
                      <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[1px] rounded-xl">
                        <span className="bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap">Coming Soon</span>
                      </div>
                    </label>
                  </div>

                  {formData.paymentMethod === 'bkash' && (
                    <div className="mt-6 p-4 bg-pink-50 border border-pink-100 rounded-xl space-y-4">
                      <h4 className="font-semibold text-pink-900">bKash Payment</h4>
                      <p className="text-sm text-pink-800">
                        Send the exact amount to the bKash number below, then enter your Transaction ID.
                      </p>
                      
                      <div className="bg-white p-4 rounded-lg border border-pink-200">
                        <p className="text-xs text-gray-500 mb-1">Send payment to</p>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-2xl font-bold text-pink-600 tracking-wider">
                            {bkashNumber || '01727666677'}
                          </p>
                          <button
                            type="button"
                            onClick={async () => {
                              if (bkashNumber) {
                                await navigator.clipboard.writeText(bkashNumber);
                                toast.success('bKash number copied.');
                              }
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-pink-700 bg-pink-100 rounded-md hover:bg-pink-200 transition-colors"
                          >
                            Copy Number
                          </button>
                        </div>
                        <p className="text-sm text-gray-800 mt-3">
                          Amount to Pay: <span className="font-bold text-lg">{formatCurrency(grandTotal)}</span>
                        </p>
                      </div>

                      <div className="text-xs text-pink-700 space-y-1">
                        <p className="font-medium">Instructions:</p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Open your bKash app and select <strong>Send Money</strong>.</li>
                          <li>Send the exact amount to the number above.</li>
                          <li>Copy the Transaction ID from your bKash confirmation.</li>
                          <li>Paste it below and click <strong>Complete Order</strong>.</li>
                        </ol>
                      </div>

                      <div className="pt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          bKash Transaction ID <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="transactionId"
                          value={formData.transactionId || ''}
                          onChange={handleChange}
                          placeholder="e.g. 8KJ7D92ABC"
                          maxLength={64}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500 text-sm outline-none"
                        />
                        {formData.paymentMethod === 'bkash' && !formData.transactionId.trim() && (
                          <p className="text-xs text-red-500 mt-1">Please enter a valid bKash Transaction ID.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Right Column (Sticky Order Summary) */}
            <div className="lg:col-span-1 lg:sticky lg:top-24 space-y-6">
              <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
                </div>
                
                <div className="p-6">
                  {/* Items List */}
                  <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between items-start text-sm">
                        <div className="flex-1 pr-4">
                          <p className="font-medium text-gray-900 line-clamp-2">{item.name}</p>
                          <p className="text-gray-500 mt-0.5 text-xs">{item.itemType === 'domain' ? `${item.termYears || 1} Year(s)` : item.billingCycle}</p>
                        </div>
                        <span className="font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(item.price)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Subtotal</span>
                      <span>{formatCurrency(hostingSubtotal)}</span>
                    </div>
                    
                    {appliedDiscount && (
                      <div className="flex justify-between text-green-600 font-medium text-sm">
                        <div className="flex items-center gap-1">
                          <span>Discount ({appliedDiscount.code})</span>
                          <button type="button" onClick={handleRemoveDiscount} className="text-gray-400 hover:text-red-500">
                            <span className="text-xs ml-1">[Remove]</span>
                          </button>
                        </div>
                        <span>-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}

                    {!appliedDiscount && (
                      <div className="pt-2 pb-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Discount Code"
                            value={discountCode}
                            onChange={e => setDiscountCode(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 uppercase"
                          />
                          <button
                            type="button"
                            onClick={handleApplyDiscount}
                            disabled={isValidatingCode || !discountCode.trim()}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                          >
                            {isValidatingCode ? '...' : 'Apply'}
                          </button>
                        </div>
                      </div>
                    )}

                    {shippingCost > 0 && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Taxes & Fees</span>
                        <span>{formatCurrency(shippingCost)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-end pt-3 border-t border-gray-100">
                      <div>
                        <span className="block text-sm text-gray-500">Total Due Today</span>
                        <span className="block text-2xl font-bold text-gray-900 leading-none mt-1">{formatCurrency(grandTotal)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="mt-8 mb-6">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center mt-0.5">
                        <input type="checkbox" name="termsAccepted" checked={formData.termsAccepted} onChange={handleChange} className="peer sr-only" />
                        <div className="w-5 h-5 border-2 border-gray-300 rounded transition-all peer-checked:bg-blue-600 peer-checked:border-blue-600 group-hover:border-blue-500"></div>
                        <CheckCircle className="w-3.5 h-3.5 text-white absolute opacity-0 scale-50 peer-checked:opacity-100 peer-checked:scale-100 transition-all pointer-events-none" />
                      </div>
                      <span className="text-sm text-gray-600 leading-tight">
                        I have read and agree to the <a href="/terms" target="_blank" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">Privacy Policy</a>.
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isProcessing || !formData.termsAccepted}
                    className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Complete Order
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  {/* Trust Badges */}
                  <div className="mt-6 flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <ShieldCheck className="w-5 h-5 text-green-500" />
                      <span>Secure 256-bit SSL Encryption</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>30-Day Money-Back Guarantee</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </form>
        </div>
      </div>
    </Layout>
  );
};













