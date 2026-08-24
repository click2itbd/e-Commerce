import { getAdminDocument } from '../firebase/admin';
import { config } from '../config/index.js';

export interface PricingSettings {
  usdToBdtRate: number;
  markupPercent: number;
}

export async function getDomainPricingSettings(): Promise<PricingSettings> {
  try {
    const result = await getAdminDocument('settings', 'api_keys');
    const data = result.data || {};

    const usdToBdtRate = parseFloat(String(data.usdToBdtRate)) || config.dynadot.exchangeRate || 120;
    const markupPercent = parseFloat(String(data.domainMarkupPercent)) || config.dynadot.markupPercent || 15;

    return {
      usdToBdtRate,
      markupPercent,
    };
  } catch (error) {
    return {
      usdToBdtRate: config.dynadot.exchangeRate || 120,
      markupPercent: config.dynadot.markupPercent || 15,
    };
  }
}

export function calculateCustomerPriceBdt(supplierPriceUsd: number, settings: PricingSettings): number {
  const retailUsd = supplierPriceUsd * (1 + settings.markupPercent / 100);
  return Math.round(retailUsd * settings.usdToBdtRate);
}
