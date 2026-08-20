/**
 * Payment Gateway Service
 * 
 * This file handles initiating payments with external gateways (bKash, SSLCommerz).
 * Calls Firebase Cloud Functions for secure backend processing.
 */

export interface PaymentInitiationResult {
  success: boolean;
  paymentUrl?: string;
  paymentId?: string;
  errorMessage?: string;
}

export const initiateBkashPayment = async (
  orderId: string, 
  amount: number, 
  customerEmail: string,
  customerName?: string,
  customerPhone?: string
): Promise<PaymentInitiationResult> => {
  try {
    console.log(`[bKash API] Initiating payment for Order: ${orderId}, Amount: ${amount}`);
    
    const { httpsCallable } = await import('firebase/functions');
    const { getFunctions, getApp } = await import('firebase/app');
    const { app } = await import('../firebase');
    const functions = getFunctions(app);
    const bkashCreatePayment = httpsCallable(functions, 'bkashCreatePayment');
    
    const result = await bkashCreatePayment({
      orderId,
      amount,
      customerEmail,
      customerName: customerName || '',
      customerPhone: customerPhone || ''
    });
    
    const data = result.data as any;
    
    if (data?.success && data?.paymentUrl) {
      return {
        success: true,
        paymentUrl: data.paymentUrl,
        paymentId: data.paymentId
      };
    } else {
      return {
        success: false,
        errorMessage: data?.errorMessage || 'Failed to initiate bKash payment'
      };
    }
    
  } catch (error: any) {
    console.error('bKash Payment Error:', error);
    return { success: false, errorMessage: error.message || 'Failed to initiate bKash payment' };
  }
};

export const initiateSSLCommerzPayment = async (
  orderId: string, 
  amount: number, 
  customerEmail: string,
  customerName: string,
  customerPhone: string
): Promise<PaymentInitiationResult> => {
  try {
    console.log(`[SSLCommerz API] Initiating payment for Order: ${orderId}, Amount: ${amount}`);
    
    // TODO: Replace with actual backend call when SSLCommerz is configured
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      success: true,
      paymentUrl: `/payment/simulate?method=card&orderId=${orderId}&amount=${amount}`
    };
  } catch (error: any) {
    console.error('SSLCommerz Payment Error:', error);
    return { success: false, errorMessage: error.message || 'Failed to initiate SSLCommerz payment' };
  }
};

export const initiateNagadPayment = async (
  orderId: string, 
  amount: number, 
  customerPhone: string
): Promise<PaymentInitiationResult> => {
  try {
    console.log(`[Nagad API] Initiating payment for Order: ${orderId}, Amount: ${amount}`);
    
    // TODO: Replace with actual backend call when Nagad is configured
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      success: true,
      paymentUrl: `/payment/simulate?method=nagad&orderId=${orderId}&amount=${amount}`
    };
  } catch (error: any) {
    console.error('Nagad Payment Error:', error);
    return { success: false, errorMessage: error.message || 'Failed to initiate Nagad payment' };
  }
};
