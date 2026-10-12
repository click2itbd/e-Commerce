import { getAdminDocument } from '../firebase/admin.js';
export async function getDomainPricingSettings() {
    const publicSettings = await getAdminDocument('settings', 'public_config');
    const privateSettings = await getAdminDocument('settings', 'api_keys');
    const settings = { ...(privateSettings.data || {}), ...(publicSettings.data || {}) };
    const usdToBdtRate = Number(settings.usdToBdtRate);
    const markupPercent = Number(settings.domainMarkupPercent);
    if (!Number.isFinite(usdToBdtRate) || usdToBdtRate <= 0) {
        throw new Error('Configure a valid USD to BDT exchange rate in domain pricing settings.');
    }
    if (!Number.isFinite(markupPercent) || markupPercent < 0) {
        throw new Error('Configure a valid domain markup percentage in domain pricing settings.');
    }
    return { usdToBdtRate, markupPercent };
}
export function calculateCustomerPriceBdt(supplierPriceUsd, settings) {
    const retailUsd = supplierPriceUsd * (1 + settings.markupPercent / 100);
    return Math.round(retailUsd * settings.usdToBdtRate);
}
