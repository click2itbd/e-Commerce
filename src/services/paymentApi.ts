/**
 * Payment Service
 * 
 * This file handles manual payment submission for the release.
 * Automatic bKash/SSLCommerz/Nagad initiation is NOT required for this release.
 * Customers submit payment information manually via the backend API.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export interface PaymentInitiationResult {
  success: boolean;
  paymentUrl?: string;
  paymentId?: string;
  errorMessage?: string;
}

export const submitManualPayment = async (
  orderId: string,
  transactionId: string,
  token: string
): Promise<PaymentInitiationResult> => {
  try {
    const response = await apiRequest<{ success: boolean; message: string; emailSent: boolean }>(
      `/api/orders/${orderId}/payment/manual-bkash`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ transactionId }),
      }
    );
    
    if (response.success) {
      return {
        success: true,
        paymentId: orderId,
      };
    } else {
      return {
        success: false,
        errorMessage: response.message || 'Failed to submit payment.',
      };
    }
  } catch (error: any) {
    console.error('Manual Payment Error:', error);
    return { success: false, errorMessage: error.message || 'Failed to submit payment.' };
  }
};

export const initiateBkashPayment = async (): Promise<PaymentInitiationResult> => {
  return {
    success: false,
    errorMessage: 'Automatic bKash payment is not configured. Please use manual payment.',
  };
};

export const initiateSSLCommerzPayment = async (): Promise<PaymentInitiationResult> => {
  return {
    success: false,
    errorMessage: 'SSLCommerz payment is not configured. Please use manual payment.',
  };
};

export const initiateNagadPayment = async (): Promise<PaymentInitiationResult> => {
  return {
    success: false,
    errorMessage: 'Nagad payment is not configured. Please use manual payment.',
  };
};
