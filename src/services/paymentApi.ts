import { auth } from '../firebase';

const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';
};

async function getAuthHeaders(token?: string): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  let resolvedToken = token;
  if (!resolvedToken && auth.currentUser) {
    try {
      resolvedToken = await auth.currentUser.getIdToken();
    } catch {
      // ignore token fetch error
    }
  }
  if (resolvedToken) {
    headers['Authorization'] = `Bearer ${resolvedToken}`;
  }
  return headers;
}

export interface PaymentResponse {
  success: boolean;
  paymentUrl?: string;
  redirectUrl?: string;
  paymentId?: string;
  merchantTransactionId?: string;
  transactionId?: string;
  status?: string;
  message?: string;
  error?: string;
}

/**
 * Initialize an online payment session through the official EPS Payment Gateway.
 * Server calculates the exact payable amount from the order document.
 */
export const initiateEpsPayment = async (orderId: string, token?: string): Promise<PaymentResponse> => {
  const apiUrl = getApiBaseUrl();
  const headers = await getAuthHeaders(token);

  const response = await fetch(`${apiUrl}/api/orders/${encodeURIComponent(orderId)}/payment/eps/init`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ orderId }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.error || data.message || 'Failed to initialize EPS payment gateway.');
  }
  return data;
};

/**
 * Verify an EPS payment transaction server-to-server via CheckMerchantTransactionStatus.
 */
export const verifyEpsPayment = async (
  orderId: string,
  merchantTransactionId?: string,
  token?: string
): Promise<PaymentResponse> => {
  const apiUrl = getApiBaseUrl();
  const headers = await getAuthHeaders(token);

  const response = await fetch(`${apiUrl}/api/orders/${encodeURIComponent(orderId)}/payment/eps/verify`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      merchantTransactionId,
      paymentId: merchantTransactionId,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.error || data.message || 'Failed to verify EPS payment with gateway.');
  }
  return data;
};

/**
 * Cancel an order if EPS payment is failed or cancelled by user.
 */
export const cancelEpsPayment = async (
  orderId: string,
  status: 'failed' | 'cancelled',
  reason?: string,
  token?: string
): Promise<PaymentResponse> => {
  const apiUrl = getApiBaseUrl();
  const headers = await getAuthHeaders(token);

  const response = await fetch(`${apiUrl}/api/orders/${encodeURIComponent(orderId)}/payment/eps/fail-or-cancel`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ status, reason }),
  });

  const data = await response.json().catch(() => ({ success: false }));
  return data;
};

// Backwards-compatible aliases that strictly route through EPS Gateway
export const initiateBkashPayment = async (orderId: string, _amount?: number, token?: string): Promise<PaymentResponse> => {
  return initiateEpsPayment(orderId, token);
};

export const initiateSSLCommerzPayment = async (
  orderId: string,
  _amount?: number,
  _customerInfo?: any,
  token?: string
): Promise<PaymentResponse> => {
  return initiateEpsPayment(orderId, token);
};

export const initiateNagadPayment = async (orderId: string, _amount?: number, token?: string): Promise<PaymentResponse> => {
  return initiateEpsPayment(orderId, token);
};

export const executeBkashPayment = async (
  orderId: string,
  paymentId: string,
  token?: string
): Promise<PaymentResponse> => {
  return verifyEpsPayment(orderId, paymentId, token);
};

export const queryBkashPayment = async (
  orderId: string,
  paymentId: string,
  token?: string
): Promise<PaymentResponse> => {
  const apiUrl = getApiBaseUrl();
  const headers = await getAuthHeaders(token);

  const response = await fetch(
    `${apiUrl}/api/orders/${encodeURIComponent(orderId)}/payment/query-bkash?paymentId=${encodeURIComponent(paymentId)}`,
    {
      method: 'GET',
      headers,
    }
  );
  return response.json();
};
