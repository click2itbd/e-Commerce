import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { Layout } from '../components/Layout';
import { formatCurrency } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { Lock, ArrowRight } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { generateDocumentNumber } from '../lib/numbering';
import { OrderType } from '../types';

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
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
      toast.success('Order placed successfully!');
      clearCart();
      navigate(`/order-success/${docRef.id}`);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to place order');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8 mb-20">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-light text-[#1a2b3c]">Checkout</h1>
            <p className="text-gray-500 text-sm mt-1">Please enter your personal details and billing information to checkout.</p>
          </div>
          {!user && (
            <button 
              onClick={() => navigate('/login')}
              className="bg-[#17a2b8] hover:bg-[#138496] px-4 py-2 text-white rounded text-sm transition-colors"
            >
              Already Registered?
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {!user && (
            <div className="mb-8 relative border-t border-gray-200 pt-6">
              <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#f8f9fa] px-4 text-[#1a2b3c] text-xl font-light">Sign Up</span>
              <p className="text-center text-sm text-gray-400 mb-4">Save time by signing up using an existing account with any of the services below.</p>
              <div className="flex justify-center">
                <button type="button" onClick={handleGoogleSignIn} className="flex flex-row items-center justify-center gap-2 border border-gray-300 rounded px-6 py-2 hover:bg-gray-50 bg-white shadow-sm transition-colors text-sm">
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                  Sign in with Google
                </button>
              </div>
            </div>
          )}

          <div className="mb-8 relative border-t border-gray-200 pt-6">
            <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#f8f9fa] px-4 text-[#1a2b3c] text-sm">Personal Information</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First Name" required className="border border-gray-300 p-2 rounded text-sm w-full focus:outline-none focus:border-[#17a2b8] focus:ring-1 focus:ring-[#17a2b8]" />
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last Name" required className="border border-gray-300 p-2 rounded text-sm w-full focus:outline-none focus:border-[#17a2b8]" />
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" required className="border border-gray-300 p-2 rounded text-sm w-full focus:outline-none focus:border-[#17a2b8]" />
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-l">
                  <img src="https://flagcdn.com/w20/bd.png" alt="BD" className="w-4 h-3 mr-1" /> +880
                </span>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number" required className="border border-gray-300 p-2 rounded-r text-sm w-full focus:outline-none focus:border-[#17a2b8] flex-1" />
              </div>
            </div>
          </div>

          <div className="mb-8 relative border-t border-gray-200 pt-6">
            <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#f8f9fa] px-4 text-[#1a2b3c] text-sm">Billing Address</span>
            <div className="space-y-4">
              <input type="text" name="company" value={formData.company} onChange={handleChange} placeholder="Company Name (Optional)" className="border border-gray-300 p-2 rounded text-sm w-full focus:outline-none focus:border-[#17a2b8]" />
              <input type="text" name="address1" value={formData.address1} onChange={handleChange} placeholder="Street Address" required className="border border-gray-300 p-2 rounded text-sm w-full focus:outline-none focus:border-[#17a2b8]" />
              <input type="text" name="address2" value={formData.address2} onChange={handleChange} placeholder="Street Address 2" className="border border-gray-300 p-2 rounded text-sm w-full focus:outline-none focus:border-[#17a2b8]" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="City" required className="border border-gray-300 p-2 rounded text-sm w-full focus:outline-none focus:border-[#17a2b8]" />
                <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="State" required className="border border-gray-300 p-2 rounded text-sm w-full focus:outline-none focus:border-[#17a2b8]" />
                <input type="text" name="postcode" value={formData.postcode} onChange={handleChange} placeholder="Postcode" required className="border border-gray-300 p-2 rounded text-sm w-full focus:outline-none focus:border-[#17a2b8]" />
              </div>
              <select name="country" value={formData.country} onChange={handleChange} className="border border-gray-300 p-2 rounded text-sm w-full focus:outline-none focus:border-[#17a2b8]">
                <option value="Bangladesh">Bangladesh</option>
              </select>
            </div>
          </div>

          <div className="mb-8 relative border-t border-gray-200 pt-6">
            <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#f8f9fa] px-4 text-[#17a2b8] text-sm">Additional Information</span>
            <p className="text-center text-xs text-gray-400 mb-4 italic">(required fields are marked with *)</p>
            <div>
              <label className="block text-sm text-gray-500 mb-1">How did you find us?</label>
              <select name="source" value={formData.source} onChange={handleChange} className="border border-gray-300 p-2 text-sm max-w-xs w-full focus:outline-none focus:border-[#17a2b8]">
                <option value="None">None</option>
                <option value="Google">Google</option>
                <option value="Social Media">Social Media</option>
                <option value="Friend">Friend</option>
              </select>
            </div>
          </div>

          <div className="mb-8 relative border-t border-gray-200 pt-6">
            <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#f8f9fa] px-4 text-[#17a2b8] text-sm">Domain Registrant Information</span>
            <p className="text-xs text-gray-400 mb-4 text-center px-4">You may specify alternative registered contact details for the domain registration(s) in your order when placing an order on behalf of another person or entity. If you do not require this, you can skip this section.</p>
            <div className="flex justify-center">
              <select name="domainContact" value={formData.domainContact} onChange={handleChange} className="border border-gray-300 p-2 text-sm min-w-[300px] focus:outline-none focus:border-[#17a2b8]">
                <option value="default">Use Default Contact (Details Above)</option>
                <option value="custom">Add New Contact</option>
              </select>
            </div>
          </div>

          {!user && (
            <div className="mb-8 relative border-t border-gray-200 pt-6">
              <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#f8f9fa] px-4 text-[#17a2b8] text-sm">Account Security</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                <div className="relative">
                  <Lock className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" required className="border border-gray-300 p-2 pl-8 rounded text-sm w-full focus:outline-none focus:border-[#17a2b8]" />
                </div>
                <div className="relative">
                  <Lock className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm Password" required className="border border-gray-300 p-2 pl-8 rounded text-sm w-full focus:outline-none focus:border-[#17a2b8]" />
                </div>
              </div>
              <div className="flex justify-between items-center text-xs">
                <button type="button" onClick={generatePassword} className="border border-gray-300 bg-gray-50 text-gray-700 px-3 py-1 rounded">Generate Password</button>
                <span className="text-gray-400">Password Strength: {formData.password.length > 8 ? 'Strong' : formData.password.length > 0 ? 'Weak' : 'Enter a Password'}</span>
              </div>
            </div>
          )}

          <div className="mb-8 relative border-t border-gray-200 pt-6">
            <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#f8f9fa] px-4 text-[#17a2b8] text-sm">Payment Details</span>
            <div className="bg-[#d4edda] text-[#155724] border border-[#c3e6cb] p-4 text-center rounded m-4 space-y-1">
              <div className="text-sm">Subtotal: <span className="font-bold">Tk. {total.toFixed(2)} BDT</span></div>
              <div className="text-sm">Shipping: <span className="font-bold">Tk. {shippingCost.toFixed(2)} BDT</span></div>
              <div className="text-base font-bold">Total Due Today: <span>Tk. {grandTotal.toFixed(2)} BDT</span></div>
            </div>
            
            <p className="text-xs text-gray-500 mb-2">Please choose your preferred method of payment.</p>
            <div className="flex flex-wrap gap-4 items-center">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600">
                <input type="radio" name="paymentMethod" value="bkash" checked={formData.paymentMethod === 'bkash'} onChange={handleChange} className="text-[#17a2b8] focus:ring-[#17a2b8]" />
                Bkash, Rocket, Nagad & Cellfin
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-400 hover:text-gray-600">
                <input type="radio" name="paymentMethod" value="card" checked={formData.paymentMethod === 'card'} onChange={handleChange} className="text-[#17a2b8] focus:ring-[#17a2b8]" />
                Master Card & Visa Card
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-400 hover:text-gray-600">
                <input type="radio" name="paymentMethod" value="bank" checked={formData.paymentMethod === 'bank'} onChange={handleChange} className="text-[#17a2b8] focus:ring-[#17a2b8]" />
                Bank Transfer (BD)
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-400 hover:text-gray-600">
                <input type="radio" name="paymentMethod" value="other" checked={formData.paymentMethod === 'other'} onChange={handleChange} className="text-[#17a2b8] focus:ring-[#17a2b8]" />
                Others Gateway (Open Ticket)
              </label>
            </div>
          </div>

          <div className="mb-8 relative border-t border-gray-200 pt-6">
            <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#f8f9fa] px-4 text-[#17a2b8] text-sm">Additional Notes</span>
            <textarea 
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="You can enter any additional notes or information you want included with your order here..."
              rows={4}
              className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-[#17a2b8]"
            ></textarea>
          </div>

          <div className="flex flex-col items-center justify-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
              <input type="checkbox" name="termsAccepted" checked={formData.termsAccepted} onChange={handleChange} className="focus:ring-[#17a2b8]" />
              I have read and agree to the Terms of Service
            </label>

            <button type="submit" disabled={isProcessing} className="bg-[#337ab7] hover:bg-[#286090] text-white font-bold py-2 px-6 rounded text-lg flex items-center gap-2 disabled:opacity-50 transition-colors">
              {isProcessing ? 'Processing...' : 'Complete Order'}
              <ArrowRight className="w-5 h-5 bg-white text-[#337ab7] rounded-full p-0.5" />
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};
