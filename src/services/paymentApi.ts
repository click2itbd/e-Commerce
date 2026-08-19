/**
 * Payment Gateway Service
 * 
 * This file handles initiating payments with external gateways (bKash, SSLCommerz).
 * Currently, it returns a simulated URL. When the backend APIs are ready, replace
 * the simulated logic with actual fetch calls to your backend endpoints.
 */

export interface PaymentInitiationResult {
  success: boolean;
  paymentUrl?: string;
  errorMessage?: string;
}

export const initiateBkashPayment = async (
  orderId: string, 
  amount: number, 
  customerEmail: string
): Promise<PaymentInitiationResult> => {
  try {
    console.log(`[bKash API] Initiating payment for Order: ${orderId}, Amount: ${amount}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // TODO: Replace this block with your actual backend call
    // const response = await fetch('/api/bkash/create', { ... });
    // const data = await response.json();
    // return { success: true, paymentUrl: data.url };

    // Simulated Response
    return {
      success: true,
      paymentUrl: `/payment/simulate?method=bkash&orderId=${orderId}&amount=${amount}`
    };
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
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // TODO: Replace this block with your actual backend call
    // const response = await fetch('/api/sslcommerz/init', { ... });
    // const data = await response.json();
    // return { success: true, paymentUrl: data.url };

    // Simulated Response
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
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulated Response
    return {
      success: true,
      paymentUrl: `/payment/simulate?method=nagad&orderId=${orderId}&amount=${amount}`
    };
  } catch (error: any) {
    console.error('Nagad Payment Error:', error);
    return { success: false, errorMessage: error.message || 'Failed to initiate Nagad payment' };
  }
};
