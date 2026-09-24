import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { Package, Search, Truck, CheckCircle2, Clock, MapPin, Download, AlertCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { generatePDF } from '../../lib/pdf';
import { useSettings } from '../../context/SettingsContext';
import { Order } from '../../types';

export default function TrackOrder() {
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const { settings } = useSettings();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setOrderId(id);
      // Auto-submit track request
      const track = async (searchId: string) => {
        setLoading(true);
        try {
          let q = query(collection(db, 'orders'), where('id', '==', searchId));
          let snap = await getDocs(q);

          if (snap.empty) {
            q = query(collection(db, 'orders'), where('invoiceNumber', '==', searchId));
            snap = await getDocs(q);
          }

          if (!snap.empty) {
            setOrder({ id: snap.docs[0].id, ...snap.docs[0].data() } as Order);
          } else {
            setError('Order not found from link.');
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      track(id);
    }
  }, [searchParams]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) {
      setError('Please enter your Order ID');
      return;
    }

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      // Allow searching by actual ID (which users might not know easily) or invoiceNumber
      let q = query(collection(db, 'orders'), where('id', '==', orderId));
      let snap = await getDocs(q);

      if (snap.empty) {
        q = query(collection(db, 'orders'), where('invoiceNumber', '==', orderId));
        snap = await getDocs(q);
      }

      if (snap.empty) {
        setError('Order not found. Please check your Order ID.');
      } else {
        const foundOrder = { id: snap.docs[0].id, ...snap.docs[0].data() } as Order;
        
        // Optional phone verification
        if (phone && foundOrder.customerPhone !== phone && foundOrder.customerPhone) {
            setError('Phone number does not match this order.');
            setOrder(null);
            return;
        }

        setOrder(foundOrder);
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'pending': return 1;
      case 'processing': return 2;
      case 'shipped': return 3;
      case 'delivered': return 4;
      case 'cancelled': return -1;
      default: return 1;
    }
  };

  const handleDownloadInvoice = async () => {
    if (!order) return;
    try {
      const pdfDoc = await generatePDF(order as any, 'invoice', settings, 'doc');
      pdfDoc.autoPrint();
      window.open(pdfDoc.output('bloburl'), '_blank');
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      alert("Failed to generate PDF invoice.");
    }
  };

  const step = order ? getStatusStep(order.status) : 0;

  return (
    <div className="bg-gray-50 min-h-screen py-16">
      <Helmet>
        <title>Track Order - {settings.storeName || 'Store'}</title>
      </Helmet>

      <div className="container mx-auto px-2 sm:px-4 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
            <Package size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Track Your Order</h1>
          <p className="text-gray-600 text-lg">Enter your Order ID to see real-time updates.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="p-6 md:p-8">
            <form onSubmit={handleTrack} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Order ID or Invoice Number"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  required
                />
              </div>
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Phone Number (Optional)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-4 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold transition-colors whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Tracking...' : 'Track Order'}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2">
                <AlertCircle size={20} /> {error}
              </div>
            )}
          </div>
        </div>

        {order && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-6 mb-8 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Order #{order.invoiceNumber || order.id.slice(-6)}</h2>
                <p className="text-gray-500">Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <button 
                onClick={handleDownloadInvoice}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-900 text-white hover:bg-black rounded-lg font-medium transition-colors"
              >
                <Download size={18} /> Download Invoice
              </button>
            </div>

            {step === -1 ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Order Cancelled</h3>
                <p className="text-gray-500 mt-2">This order has been cancelled.</p>
              </div>
            ) : (
              <div className="relative mb-12">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 z-0 hidden md:block"></div>
                <div 
                  className="absolute top-1/2 left-0 h-1 bg-blue-500 -translate-y-1/2 z-0 hidden md:block transition-all duration-1000"
                  style={{ width: `${((step - 1) / 3) * 100}%` }}
                ></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8 md:gap-0">
                  {/* Step 1 */}
                  <div className="flex flex-row md:flex-col items-center gap-4 md:gap-2">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${step >= 1 ? 'bg-blue-500 border-white text-white shadow-md' : 'bg-gray-100 border-white text-gray-400'}`}>
                      <Clock size={24} />
                    </div>
                    <div className="md:text-center">
                      <p className={`font-bold ${step >= 1 ? 'text-gray-900' : 'text-gray-400'}`}>Order Placed</p>
                      <p className="text-xs text-gray-500">We have received your order</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-row md:flex-col items-center gap-4 md:gap-2">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${step >= 2 ? 'bg-blue-500 border-white text-white shadow-md' : 'bg-gray-100 border-white text-gray-400'}`}>
                      <Package size={24} />
                    </div>
                    <div className="md:text-center">
                      <p className={`font-bold ${step >= 2 ? 'text-gray-900' : 'text-gray-400'}`}>Processing</p>
                      <p className="text-xs text-gray-500">Preparing your items</p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex flex-row md:flex-col items-center gap-4 md:gap-2">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${step >= 3 ? 'bg-blue-500 border-white text-white shadow-md' : 'bg-gray-100 border-white text-gray-400'}`}>
                      <Truck size={24} />
                    </div>
                    <div className="md:text-center">
                      <p className={`font-bold ${step >= 3 ? 'text-gray-900' : 'text-gray-400'}`}>Shipped</p>
                      <p className="text-xs text-gray-500">On the way to you</p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex flex-row md:flex-col items-center gap-4 md:gap-2">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${step >= 4 ? 'bg-green-500 border-white text-white shadow-md' : 'bg-gray-100 border-white text-gray-400'}`}>
                      <CheckCircle2 size={24} />
                    </div>
                    <div className="md:text-center">
                      <p className={`font-bold ${step >= 4 ? 'text-gray-900' : 'text-gray-400'}`}>Delivered</p>
                      <p className="text-xs text-gray-500">Package has arrived</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><MapPin size={20} className="text-[#F97316]" /> Shipping Details</h3>
              <p className="text-gray-700 font-medium">{order.customerName}</p>
              <p className="text-gray-600">{order.shippingAddress}</p>
              <p className="text-gray-600">{order.customerPhone}</p>
              {order.trackingNumber && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">Courier: <span className="font-medium text-gray-900">{order.courier || 'Standard'}</span></p>
                  <p className="text-sm text-gray-500">Tracking Number: <span className="font-medium text-gray-900">{order.trackingNumber}</span></p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
