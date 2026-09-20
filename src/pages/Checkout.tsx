import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { Layout } from '../components/Layout';
import { toast } from 'react-hot-toast';
import { Lock, ArrowRight } from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, addDoc, doc, writeBatch } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { generateDocumentNumber } from '../lib/numbering';
import { generatePDF } from '../lib/pdf';
import { initiateBkashPayment, initiateSSLCommerzPayment, initiateNagadPayment } from '../services/paymentApi';
import { apiPost } from '../services/apiClient';

export const Checkout: React.FC = () => {
  const { user } = useAuth();
  const { items, total, clearCart } = useCart();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const shippingCost = settings.shippingCost || 0;
  const grandTotal = total + shippingCost;

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
    source: 'None',
    domainContact: 'default',
    password: '',
    confirmPassword: '',
    paymentMethod: 'bkash',
    notes: '',
    termsAccepted: false
  });

  const [isProcessing, setIsProcessing] = useState(false);

  // If cart is empty, redirect to cart
  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success('Signed in with Google!');
    } catch (error) {
      toast.error('Google sign in failed');
    }
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pwd = "";
    for (let i = 0; i < 12; i++) {
        pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({...prev, password: pwd, confirmPassword: pwd}));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.termsAccepted) {
      toast.error('You must agree to the Terms of Service.');
      return;
    }

    setIsProcessing(true);

    try {
      let currentUserId = user?.uid;

      if (!user && formData.password) {
        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwords do not match");
          setIsProcessing(false);
          return;
        }
        try {
          const newUserCred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
          currentUserId = newUserCred.user.uid;
        } catch (error: any) {
          toast.error(error.message);
          setIsProcessing(false);
          return;
        }
      } else if (!user) {
        toast.error("Please login, sign in with Google or create a password to checkout.");
        setIsProcessing(false);
        return;
      }

      const docType = 'INV'; // default to invoice
      const docNumber = await generateDocumentNumber(docType);

      const orderData = {
        userId: currentUserId,
        items,
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
        notes: formData.notes,
        createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

      const batch = writeBatch(db);
      const newOrderRef = doc(collection(db, 'orders'));
      batch.set(newOrderRef, orderData);
      
      const domainItems = items.filter(item => item.itemType === 'domain');
      const hostingItems = items.filter(item => item.itemType === 'hosting');

      for (const domainItem of domainItems) {
        const domain = domainItem.id.replace('domain_', '');
        const tld = domainItem.domainTld || domain.split('.').pop() || '';
        const dOrderRef = doc(collection(db, 'domainOrders'));
        batch.set(dOrderRef, {
          domain,
          tld,
          userId: currentUserId,
          orderId: newOrderRef.id,
          status: 'pending',
          years: domainItem.termYears || 1,
          autoRenew: false,
          nameservers: [],
          price: domainItem.price,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      for (const hostingItem of hostingItems) {
        const hAccountRef = doc(collection(db, 'hostingAccounts'));
        batch.set(hAccountRef, {
          userId: currentUserId,
          orderId: newOrderRef.id,
          planId: hostingItem.id.replace('hosting_', ''),
          provider: 'dummy',
          status: 'pending',
          billingCycle: hostingItem.billingCycle || 'monthly',
          autoRenew: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

        await batch.commit();
        
        // Notify Admin and Customer
        try {
          if (user) {
            const token = await user.getIdToken();
            await apiPost('/api/send-email/notify-admin-new-order', { orderId: newOrderRef.id, orderData }, token);
            
            // Generate PDF for customer
            const pdfDoc = generatePDF({ id: newOrderRef.id, ...orderData } as any, 'invoice', settings);
            const pdfBase64 = pdfDoc.output('datauristring');
            
            // Send Order Confirmation to Customer
            await apiPost('/api/send-email/order-confirmation', {
              orderId: newOrderRef.id,
              customerName: `${formData.firstName} ${formData.lastName}`,
              customerEmail: formData.email,
              attachments: [
                {
                  filename: `Invoice-${newOrderRef.id}.pdf`,
                  content: pdfBase64.split('base64,')[1],
                  encoding: 'base64',
                  contentType: 'application/pdf'
                }
              ]
            }, token);
          }
        } catch (err) {
          console.error('Failed to send order emails:', err);
        }
      
      // Update docRef for payment initiation logic below
      const docRef = newOrderRef;
      // Only clear cart and show success if not redirecting to a payment gateway
      if (formData.paymentMethod === 'bkash') {
        const res = await initiateBkashPayment(docRef.id, grandTotal, formData.email, `${formData.firstName} ${formData.lastName}`, formData.phone);
        if (res.success && res.paymentUrl) {
          window.location.href = res.paymentUrl;
          return;
        } else {
          throw new Error(res.errorMessage || 'Failed to initiate bKash payment');
        }
      } else if (formData.paymentMethod === 'card') {
        const res = await initiateSSLCommerzPayment(
          docRef.id, 
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
        const res = await initiateNagadPayment(docRef.id, grandTotal, formData.phone);
        if (res.success && res.paymentUrl) {
          window.location.href = res.paymentUrl;
          return;
        } else {
          throw new Error(res.errorMessage || 'Failed to initiate Nagad payment');
        }
      }

      // For manual methods (bank transfer, etc), proceed directly
      toast.success('Order placed successfully!');
      clearCart();
      navigate(`/order-success/${docRef.id}`);
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to place order');
      setIsProcessing(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-12 mb-20 bg-slate-50 min-h-screen">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Checkout</h1>
            <p className="text-slate-500 text-base mt-2">Please enter your personal details and billing information to complete your order.</p>
          </div>
          {!user && (
            <button 
              onClick={() => navigate('/login')}
              className="bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-6 py-2.5 text-slate-700 font-semibold rounded-xl text-sm transition-all shadow-sm"
            >
              Already Registered? Login
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-100">
          {!user && (
            <div className="mb-12 relative border-t border-slate-200 pt-8 mt-4">
              <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-6 py-1 rounded-full text-slate-800 text-sm font-semibold border border-slate-100 shadow-sm">Sign Up</span>
              <p className="text-center text-slate-500 mb-6">Save time by signing up using an existing account.</p>
              <div className="flex justify-center">
                <button type="button" onClick={handleGoogleSignIn} className="flex flex-row items-center justify-center gap-3 border border-slate-200 rounded-xl px-8 py-3 hover:bg-slate-50 bg-white shadow-sm transition-all text-sm font-bold text-slate-700 hover:-translate-y-0.5">
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                  Sign in with Google
                </button>
              </div>
            </div>
          )}

          <div className="mb-12 relative border-t border-slate-200 pt-8">
            <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-6 py-1 rounded-full text-slate-800 text-sm font-semibold border border-slate-100 shadow-sm">Personal Information</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First Name *" required className="border border-slate-200 bg-slate-50/50 p-3.5 rounded-xl text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all" />
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last Name *" required className="border border-slate-200 bg-slate-50/50 p-3.5 rounded-xl text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all" />
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email Address *" required className="border border-slate-200 bg-slate-50/50 p-3.5 rounded-xl text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all" />
              <div className="flex">
                <span className="inline-flex items-center px-4 border border-r-0 border-slate-200 bg-slate-100 text-slate-600 font-medium text-sm rounded-l-xl">
                  <img src="https://flagcdn.com/w20/bd.png" alt="BD" className="w-5 h-auto mr-2 rounded-sm shadow-sm" /> +880
                </span>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number *" required className="border border-slate-200 bg-slate-50/50 p-3.5 rounded-r-xl text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all flex-1" />
              </div>
            </div>
          </div>

          <div className="mb-12 relative border-t border-slate-200 pt-8">
            <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-6 py-1 rounded-full text-slate-800 text-sm font-semibold border border-slate-100 shadow-sm">Billing Address</span>
            <div className="space-y-5">
              <input type="text" name="company" value={formData.company} onChange={handleChange} placeholder="Company Name (Optional)" className="border border-slate-200 bg-slate-50/50 p-3.5 rounded-xl text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all" />
              <input type="text" name="address1" value={formData.address1} onChange={handleChange} placeholder="Street Address *" required className="border border-slate-200 bg-slate-50/50 p-3.5 rounded-xl text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all" />
              <input type="text" name="address2" value={formData.address2} onChange={handleChange} placeholder="Apartment, suite, etc. (Optional)" className="border border-slate-200 bg-slate-50/50 p-3.5 rounded-xl text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="City *" required className="border border-slate-200 bg-slate-50/50 p-3.5 rounded-xl text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all" />
                <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="State/Division *" required className="border border-slate-200 bg-slate-50/50 p-3.5 rounded-xl text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all" />
                <input type="text" name="postcode" value={formData.postcode} onChange={handleChange} placeholder="Postcode *" required className="border border-slate-200 bg-slate-50/50 p-3.5 rounded-xl text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all" />
              </div>
              <select name="country" value={formData.country} onChange={handleChange} className="border border-slate-200 bg-slate-50/50 p-3.5 rounded-xl text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all">
                <option value="Bangladesh">Bangladesh</option>
              </select>
            </div>
          </div>

          <div className="mb-12 relative border-t border-slate-200 pt-8">
            <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-6 py-1 rounded-full text-slate-800 text-sm font-semibold border border-slate-100 shadow-sm">Additional Information</span>
            <div className="max-w-xs mx-auto text-center">
              <label className="block text-sm font-medium text-slate-700 mb-3">How did you find us?</label>
              <select name="source" value={formData.source} onChange={handleChange} className="border border-slate-200 bg-slate-50/50 p-3.5 rounded-xl text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all text-center">
                <option value="None">Please Select...</option>
                <option value="Google">Google Search</option>
                <option value="Social Media">Social Media</option>
                <option value="Friend">Friend / Recommendation</option>
              </select>
            </div>
          </div>

          {items.some(item => item.itemType === 'domain') && (
            <div className="mb-10 relative border-t border-slate-200 pt-8">
              <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-50 px-6 py-1 rounded-full text-slate-800 text-sm font-semibold border border-slate-100 shadow-sm">Domain Registrant Information</span>
              <p className="text-sm text-slate-500 mb-6 text-center max-w-2xl mx-auto">You may specify alternative registered contact details for the domain registration(s) in your order when placing an order on behalf of another person or entity.</p>
              <div className="flex justify-center">
                <select name="domainContact" value={formData.domainContact} onChange={handleChange} className="border border-slate-200 p-3 rounded-xl text-sm min-w-[300px] bg-white focus:outline-none focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all">
                  <option value="default">Use Default Contact (Details Above)</option>
                  <option value="custom">Add New Contact</option>
                </select>
              </div>
            </div>
          )}

          {!user && (
            <div className="mb-12 relative border-t border-slate-200 pt-8">
              <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-6 py-1 rounded-full text-slate-800 text-sm font-semibold border border-slate-100 shadow-sm">Account Security</span>
              <p className="text-center text-sm text-slate-500 mb-6">Create a password to easily access your orders and track status.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-3">
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-[#0E2A47] transition-colors" />
                  <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password *" required className="border border-slate-200 bg-slate-50/50 p-3.5 pl-11 rounded-xl text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all" />
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-[#0E2A47] transition-colors" />
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm Password *" required className="border border-slate-200 bg-slate-50/50 p-3.5 pl-11 rounded-xl text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all" />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-center text-sm gap-3">
                <button type="button" onClick={generatePassword} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors">Generate Password</button>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Password Strength:</span>
                  <span className={`font-semibold ${formData.password.length > 8 ? 'text-emerald-500' : formData.password.length > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                    {formData.password.length > 8 ? 'Strong' : formData.password.length > 0 ? 'Weak' : 'Enter Password'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="mb-12 relative border-t border-slate-200 pt-8">
            <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-6 py-1 rounded-full text-slate-800 text-sm font-semibold border border-slate-100 shadow-sm">Payment Details</span>
            
            <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl mb-8">
              <div className="space-y-3 max-w-sm mx-auto">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold">৳ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600 pb-3 border-b border-slate-200">
                  <span>Shipping:</span>
                  <span className="font-semibold">৳ {shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-900 pt-1">
                  <span className="font-bold text-lg">Total Due:</span>
                  <span className="font-black text-xl text-[#6EC72A]">৳ {grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <p className="text-center text-slate-600 font-medium mb-6">Select Payment Method</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { id: 'bkash', label: 'bKash', img: 'https://freelogopng.com/images/all_img/1656234745bkash-app-logo-png.png' },
                { id: 'nagad', label: 'Nagad', img: 'https://download.logo.wine/logo/Nagad/Nagad-Logo.wine.png' },
                { id: 'card', label: 'Cards (Visa/Master)', img: 'https://cdn-icons-png.flaticon.com/512/196/196578.png' },
                { id: 'bank', label: 'Bank Transfer', img: 'https://cdn-icons-png.flaticon.com/512/2830/2830284.png' }
              ].map(method => (
                <label key={method.id} className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition-all ${formData.paymentMethod === method.id ? 'border-[#6EC72A] bg-[#6EC72A]/5' : 'border-slate-100 hover:border-slate-300'}`}>
                  <input type="radio" name="paymentMethod" value={method.id} checked={formData.paymentMethod === method.id} onChange={handleChange} className="hidden" />
                  <div className="h-10 flex items-center justify-center">
                    <img src={method.img} alt={method.label} className="max-h-full object-contain mix-blend-multiply opacity-90" />
                  </div>
                  <span className={`text-xs font-semibold text-center ${formData.paymentMethod === method.id ? 'text-[#6EC72A]' : 'text-slate-500'}`}>{method.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-12 relative border-t border-slate-200 pt-8">
            <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-6 py-1 rounded-full text-slate-800 text-sm font-semibold border border-slate-100 shadow-sm">Additional Notes</span>
            <textarea 
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Enter any additional notes, delivery instructions, or special requests..."
              rows={4}
              className="w-full border border-slate-200 bg-slate-50/50 rounded-xl p-4 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all resize-y"
            ></textarea>
          </div>

          <div className="flex flex-col items-center justify-center gap-6 pt-4 border-t border-slate-100">
            <label className="flex items-center gap-3 text-sm text-slate-600 cursor-pointer group">
              <div className="relative flex items-center">
                <input type="checkbox" name="termsAccepted" checked={formData.termsAccepted} onChange={handleChange} className="w-5 h-5 border-2 border-slate-300 rounded text-[#0E2A47] focus:ring-[#0E2A47] cursor-pointer transition-colors" />
              </div>
              <span>I have read and agree to the <a href="/terms" className="text-[#0E2A47] font-semibold hover:underline" target="_blank">Terms of Service</a> & Privacy Policy</span>
            </label>

            <button type="submit" disabled={isProcessing} className="bg-gradient-to-r from-[#0E2A47] to-[#1a426e] hover:shadow-xl hover:shadow-[#0E2A47]/20 hover:-translate-y-0.5 text-white font-bold py-4 px-10 rounded-xl text-lg flex items-center gap-3 disabled:opacity-50 disabled:hover:translate-y-0 transition-all min-w-[300px] justify-center group">
              {isProcessing ? 'Processing Order...' : 'Complete Order'}
              {!isProcessing && (
                <span className="bg-white/20 p-1.5 rounded-full group-hover:bg-white/30 transition-colors">
                  <ArrowRight size={20} />
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

