import { getAdminDocument } from '../firebase/admin';

export interface PricingSettings {
  usdToBdtRate: number;
  markupPercent: number;
}

export async function getDomainPricingSettings(): Promise<PricingSettings> {
  try {
    const result = await getAdminDocument('settings', 'api_keys');
    const data = result.data || {};

    const usdToBdtRate = parseFloat(String(data.usdToBdtRate)) || 120;
    const markupPercent = parseFloat(String(data.domainMarkupPercent)) || 15;

    return {
      usdToBdtRate,
      markupPercent,
    };
  } catch (error) {
    console.error('Failed to load domain pricing settings from Firestore, using defaults:', error);
    return {
      usdToBdtRate: 120,
      markupPercent: 15,
    };
  }
}

export function calculateCustomerPriceBdt(supplierPriceUsd: number, settings: PricingSettings): number {
  const retailUsd = supplierPriceUsd * (1 + settings.markupPercent / 100);
  return Math.round(retailUsd * settings.usdToBdtRate);
}
