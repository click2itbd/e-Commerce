import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Order } from '../types';
import { Layout } from '../components/Layout';
import { useSettings } from '../context/SettingsContext';
import { generatePDF } from '../lib/pdf';
import { formatCurrency } from '../lib/utils';
import { CheckCircle, Download, ArrowRight, Package } from 'lucide-react';

export const OrderSuccess: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { settings } = useSettings();

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'orders', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setOrder({ id: docSnap.id, ...docSnap.data() } as Order);
        }
      } catch (err) {
        console.error("Error fetching order:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

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

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header section */}
            <div className="bg-green-50 px-8 py-10 text-center border-b border-green-100">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="text-green-600 w-10 h-10" />
              </div>
              <h1 className="text-3xl font-bold text-green-800 mb-2">Order Completed!</h1>
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
                    {order.company && <p>{order.company}</p>}
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
                      {order.shippingCost > 0 && (
                        <tr>
                          <th scope="row" colSpan={2} className="px-6 py-3 text-right text-sm font-normal text-gray-500">Shipping</th>
                          <td className="px-6 py-3 text-right text-sm text-gray-900">{formatCurrency(order.shippingCost, settings)}</td>
                        </tr>
                      )}
                      <tr>
                        <th scope="row" colSpan={2} className="px-6 py-4 text-right text-base font-bold text-gray-900">Total</th>
                        <td className="px-6 py-4 text-right text-base font-bold text-gray-900">{formatCurrency(order.total, settings)}</td>
                      </tr>
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
