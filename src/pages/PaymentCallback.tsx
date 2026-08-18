import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../context/CartContext';
import { toast } from 'react-hot-toast';

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  
  const status = searchParams.get('status');
  const orderId = searchParams.get('orderId');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const processCallback = async () => {
      if (!orderId || !status) {
        setError('Invalid payment callback parameters.');
        setLoading(false);
        return;
      }

      try {
        const orderRef = doc(db, 'invoices', orderId); // Adjust collection name if it's 'orders'
        // Wait! Need to know if they use 'orders' or 'invoices'. In Checkout.tsx they use 'invoices' and 'orders' dynamically. 
        // Let's assume 'orders' and 'invoices' are possible. We will try 'orders' first, then 'invoices'.
        
        let targetRef = doc(db, 'orders', orderId);
        let docSnap = await getDoc(targetRef);
        
        if (!docSnap.exists()) {
          targetRef = doc(db, 'invoices', orderId);
          docSnap = await getDoc(targetRef);
        }

        if (!docSnap.exists()) {
          throw new Error('Order not found in database.');
        }

        if (status === 'success') {
          // Update order status to paid/processing
          await updateDoc(targetRef, {
            status: 'processing',
            paymentStatus: 'paid',
            paymentCompletedAt: new Date().toISOString()
          });

          clearCart();
          toast.success('Payment successful!');
          navigate(`/order-success?orderId=${orderId}`, { replace: true });
        } else {
          // Update order status to failed
          await updateDoc(targetRef, {
            paymentStatus: 'failed',
            status: 'payment_failed'
          });
          
          toast.error(`Payment ${status === 'cancelled' ? 'was cancelled' : 'failed'}. Please try again.`);
          navigate(`/checkout`, { replace: true });
        }
      } catch (err: any) {
        console.error('Error processing payment callback:', err);
        setError(err.message || 'An error occurred while verifying your payment.');
      } finally {
        setLoading(false);
      }
    };

    processCallback();
  }, [orderId, status, navigate, clearCart]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <XCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Verification Failed</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button 
          onClick={() => navigate('/')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-sm w-full text-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
        <p className="text-gray-500 text-sm">Please wait while we confirm your transaction securely...</p>
      </div>
    </div>
  );
}
