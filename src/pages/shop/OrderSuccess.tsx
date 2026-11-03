// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Order } from '../../types';
import { Layout } from '../../components/Layout';
import { useSettings } from '../../context/SettingsContext';
import { generatePDF } from '../../lib/pdf';
import { formatCurrency } from '../../lib/utils';
import { initiateEpsPayment } from '../../services/paymentApi';
import { CheckCircle, Download, ArrowRight, Package, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const OrderSuccess: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [initiatingEps, setInitiatingEps] = useState(false);
  const { settings } = useSettings();

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'orders', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setOrder({ id: docSnap.id, ...data } as Order);
        }
      } catch (err) {
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handlePayWithEps = async () => {
    if (!id) return;
    setInitiatingEps(true);
    try {
      const res = await initiateEpsPayment(id);
      const redirectUrl = res.paymentUrl || res.redirectUrl;
      if (res.success && redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        toast.error(res.error || 'Failed to start EPS payment.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to initialize EPS payment.');
    } finally {
      setInitiatingEps(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a2b3c]"></div>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50 px-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Not Found</h1>
          <p className="text-gray-500 mb-6">We couldn't locate the details for this order.</p>
          <Link to="/" className="text-blue-600 hover:underline">Return to Home</Link>
        </div>
      </Layout>
    );
  }

  const isOnlineOrder = order.paymentMethod !== 'cod';
  const isPaid = order.paymentStatus === 'verified';
  const isCancelled = order.status === 'cancelled' || order.paymentStatus === 'cancelled' || order.paymentStatus === 'failed';
  const advancePaid = Number((order as any).advancePaidAmount || (order as any).paidAmount || (order as any).shippingCost || 0);
  const remainingDue = Math.max(0, Number(order.total || 0) - advancePaid);

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header section */}
            {isCancelled ? (
              <div className="bg-red-50 px-8 py-10 text-center border-b border-red-100">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <Package className="text-red-600 w-10 h-10" />
                </div>
                <h1 className="text-3xl font-bold text-red-950 mb-2">Order Incomplete / Cancelled</h1>
                <p className="text-red-700 mb-6 max-w-md mx-auto text-sm leading-relaxed">
                  পেমেন্ট অথবা অগ্রিম ডেলিভারি চার্জ পরিশোধ সম্পন্ন না করায় অর্ডারটি বাতিল অবস্থায় রয়েছে। অর্ডারটি সক্রিয় করতে অনুগ্রহ করে পুনরায় পেমেন্ট করুন।
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button
                    onClick={handlePayWithEps}
                    disabled={initiatingEps}
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-bold rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 transition"
                  >
                    <ShieldCheck className="mr-2 h-5 w-5" />
                    {initiatingEps ? 'Connecting to Payment...' : 'পেমেন্ট পুনরায় চেষ্টা করুন'}
                  </button>
                  <Link
                    to="/"
                    className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition"
                  >
                    Continue Shopping
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 px-8 py-10 text-center border-b border-green-100">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="text-green-600 w-10 h-10" />
                </div>
                <h1 className="text-3xl font-bold text-green-800 mb-2">Order Received!</h1>
                <p className="text-green-600 mb-6">Thank you, {order.customerName}. Your order has been placed successfully.</p>
                
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button
                    onClick={() => generatePDF(order, 'invoice', settings)}
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 transition"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Download PDF Invoice
                  </button>
                  <Link
                    to="/"
                    className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition"
                  >
                    Continue Shopping
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Online EPS Payment Action Section (if payment is still pending) */}
            {isOnlineOrder && !isPaid && !isCancelled && (
              <div className="bg-emerald-50 border-l-4 border-emerald-600 p-6 mx-8 mt-8 rounded-r-lg">
                <div className="flex items-start gap-3 mb-3">
                  <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-bold text-emerald-950">
                      {order.paymentMethod === 'cod_advance_paid' ? 'Pay Advance Delivery Fee' : 'Complete Online Payment'}
                    </h3>
                    <p className="text-emerald-800 text-sm mt-1">
                      {order.paymentMethod === 'cod_advance_paid'
                        ? 'ক্যাশ অন ডেলিভারিতে অর্ডার কনফার্ম করতে অগ্রিম ডেলিভারি চার্জ অনলাইনে পরিশোধ করতে হবে।'
                        : 'Your order is awaiting online payment. Click below to complete your payment securely.'}
                    </p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-emerald-200 mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">
                      {order.paymentMethod === 'cod_advance_paid' ? 'Payable Advance Delivery Charge' : 'Payable Amount'}
                    </p>
                    <p className="text-xl font-bold text-emerald-700">
                      {formatCurrency(
                        order.paymentMethod === 'cod_advance_paid' && advancePaid > 0
                          ? advancePaid
                          : order.total,
                        settings
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase font-bold">Invoice Ref</p>
                    <p className="font-mono font-bold text-gray-800">{order.documentNumber || order.id.slice(0, 8)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handlePayWithEps}
                  disabled={initiatingEps}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  {initiatingEps ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Redirecting to Payment Gateway...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      {order.paymentMethod === 'cod_advance_paid' ? 'Pay Advance Delivery Fee' : 'Pay Online Now'}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Verified Payment Status */}
            {isPaid && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mx-8 mt-8 rounded-r-lg">
                <h3 className="text-lg font-bold text-blue-900 mb-2">
                  {order.paymentMethod === 'cod_advance_paid' ? 'Advance Courier Payment Verified' : 'Payment Verified'}
                </h3>
                <p className="text-blue-800 text-sm">
                  {order.paymentMethod === 'cod_advance_paid'
                    ? `অগ্রিম ডেলিভারি চার্জ (${formatCurrency(advancePaid, settings)}) সফলভাবে গৃহীত হয়েছে। অবশিষ্ট ৳${remainingDue} ডেলিভারির সময় ক্যাশ পরিশোধ করতে হবে।`
                    : 'Your payment has been verified successfully. Your order is now being processed.'}
                </p>
                {(order as any).transactionId && (
                  <p className="text-sm text-blue-700 mt-2">
                    Transaction ID: <span className="font-mono font-bold">{(order as any).transactionId}</span>
                  </p>
                )}
                <p className="text-sm text-blue-700 mt-1">
                  Status: <span className="font-medium capitalize">{order.paymentStatus}</span>
                  {order.paymentMethod === 'cod_advance_paid' && (
                    <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-bold">
                      Due on Delivery: {formatCurrency(remainingDue, settings)}
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Order details */}
            <div className="p-8">
              <div className="flex justify-between items-end mb-6 pb-6 border-b border-gray-100">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 mb-1">Order Details</h2>
                  <p className="text-sm text-gray-500">
                    Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Order Number</p>
                  <p className="font-mono text-gray-900 font-bold">{order.documentNumber || order.id.toUpperCase().slice(0, 8)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Customer Information</h3>
                  <div className="text-sm text-gray-800 space-y-1">
                    <p className="font-medium">{order.customerName}</p>
                    <p>{order.customerEmail}</p>
                    <p>{order.customerPhone}</p>
                    {(order as any).company && <p>{(order as any).company}</p>}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Shipping Address</h3>
                  <div className="text-sm text-gray-800 space-y-1">
                    <p>{order.shippingAddress || 'Digital Delivery'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4" /> Order Items
                </h3>
                <div className="border border-gray-100 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {order.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{item.quantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(item.price * item.quantity, settings)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <th scope="row" colSpan={2} className="px-6 py-3 text-right text-sm font-normal text-gray-500">Subtotal</th>
                        <td className="px-6 py-3 text-right text-sm text-gray-900">{formatCurrency(order.items.reduce((s, i) => s + (i.price * i.quantity), 0), settings)}</td>
                      </tr>
                      {(order as any).shippingCost > 0 && (
                        <tr>
                          <th scope="row" colSpan={2} className="px-6 py-3 text-right text-sm font-normal text-gray-500">Shipping</th>
                          <td className="px-6 py-3 text-right text-sm text-gray-900">{formatCurrency((order as any).shippingCost, settings)}</td>
                        </tr>
                      )}
                      <tr>
                        <th scope="row" colSpan={2} className="px-6 py-4 text-right text-base font-bold text-gray-900">Total</th>
                        <td className="px-6 py-4 text-right text-base font-bold text-gray-900">{formatCurrency(order.total, settings)}</td>
                      </tr>
                      {order.paymentMethod === 'cod_advance_paid' && (
                        <>
                          <tr className="bg-emerald-50/60 text-emerald-800">
                            <th scope="row" colSpan={2} className="px-6 py-2.5 text-right text-sm font-semibold">
                              Advance Delivery Fee (Paid Online)
                            </th>
                            <td className="px-6 py-2.5 text-right text-sm font-bold text-emerald-700">
                              - {formatCurrency(advancePaid, settings)}
                            </td>
                          </tr>
                          <tr className="bg-amber-50/80 border-t border-amber-200">
                            <th scope="row" colSpan={2} className="px-6 py-3 text-right text-base font-black text-amber-950">
                              Due on Delivery (Pay in Cash)
                            </th>
                            <td className="px-6 py-3 text-right text-base font-black text-amber-950">
                              {formatCurrency(remainingDue, settings)}
                            </td>
                          </tr>
                        </>
                      )}
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
