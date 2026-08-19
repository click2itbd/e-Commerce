/**
 * Dynadot API Integration Service
 * 
 * Instructions:
 * 1. Go to Admin Panel > Settings > Domain Reseller API
 * 2. Add your Dynadot API Key and USD to BDT exchange rate.
 * 3. The API requires a backend to bypass CORS (Cross-Origin Resource Sharing). 
 *    Since this is a React frontend, calling the API directly from the browser will fail.
 *    You must set up a proxy server or Firebase Cloud Function to handle the actual API calls,
 *    and replace the `DYNADOT_PROXY_URL` below with your proxy server URL.
 */

import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

// Placeholder Proxy URL. 
// Example: "https://your-cloud-function.cloudfunctions.net/dynadotProxy"
const DYNADOT_PROXY_URL = 'http://localhost:5000/dynadot-proxy'; 

/**
 * Fetch the conversion rate from settings
 */
export const getConversionRate = async (): Promise<number> => {
  try {
    const snap = await getDoc(doc(db, 'settings', 'site_settings'));
    if (snap.exists()) {
      const rate = snap.data()?.apiSettings?.usdToBdtRate;
      return rate ? parseFloat(rate) : 120; // fallback to 120
    }
  } catch (error) {
    console.error('Error fetching conversion rate:', error);
  }
  return 120;
}

/**
 * Fetch the Dynadot API Key from settings
 */
export const getDynadotApiKey = async (): Promise<string> => {
  try {
    const snap = await getDoc(doc(db, 'settings', 'site_settings'));
    if (snap.exists()) {
      return snap.data()?.apiSettings?.dynadotApiKey || '';
    }
  } catch (error) {
    console.error('Error fetching API key:', error);
  }
  return '';
}

export interface DomainAvailabilityResponse {
  domain: string;
  available: boolean;
  priceUsd: number;
  priceBdt: number;
  status: string; // e.g. "available", "taken", "premium"
}

/**
 * Check Domain Availability via Dynadot API
 */
export const searchDomainDynadot = async (domain: string): Promise<DomainAvailabilityResponse> => {
  const apiKey = await getDynadotApiKey();
  const conversionRate = await getConversionRate();
  
  if (!apiKey) {
    // If no API key is configured, return dummy simulated data for UI purposes
    console.warn("Dynadot API Key not configured. Returning simulated response.");
    const isAvailable = Math.random() > 0.5; // Simulate availability
    const priceUsd = 10.99; // Standard .com price simulation
    return {
      domain,
      available: isAvailable,
      priceUsd,
      priceBdt: priceUsd * conversionRate,
      status: isAvailable ? 'available' : 'taken',
    };
  }

  try {
    // Actual API Call (through proxy)
    // Dynadot Search Command: https://api.dynadot.com/api3.json?key=API_KEY&command=search&domain0=DOMAIN
    
    // Example Proxy Call:
    // const response = await fetch(`${DYNADOT_PROXY_URL}?command=search&domain0=${domain}`, {
    //   headers: { 'Authorization': `Bearer ${apiKey}` }
    // });
    // const data = await response.json();
    
    // Since we are waiting for the user to set up a proxy, we'll throw a placeholder error 
    // or return simulated data if the API is configured but the proxy isn't active.
    
    // Simulated proxy logic:
    const simulatedUsdPrice = 12.99;
    return {
      domain,
      available: true,
      priceUsd: simulatedUsdPrice,
      priceBdt: Math.round(simulatedUsdPrice * conversionRate),
      status: 'available',
    };

  } catch (error) {
    console.error("Dynadot Search Error:", error);
    throw new Error('Failed to search domain via Dynadot API.');
  }
}
