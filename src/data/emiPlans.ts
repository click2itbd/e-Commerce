export interface EMITenureRate {
  months: number;
  label: string;
  rate: number | null; // percentage, null if not available
}

export interface BankEMIPlan {
  id: string;
  name: string;
  shortName: string;
  minPurchase: number;
  rates: {
    '3M': number | null;
    '6M': number | null;
    '9M': number | null;
    '12M': number | null;
    '18M': number | null;
    '24M': number | null;
    '36M': number | null;
  };
  logo?: string;
}

export const EMI_TENURES = [
  { key: '3M', months: 3, label: '3 Months' },
  { key: '6M', months: 6, label: '6 Months' },
  { key: '9M', months: 9, label: '9 Months' },
  { key: '12M', months: 12, label: '12 Months' },
  { key: '18M', months: 18, label: '18 Months' },
  { key: '24M', months: 24, label: '24 Months' },
  { key: '36M', months: 36, label: '36 Months' },
] as const;

export type EMITenureKey = typeof EMI_TENURES[number]['key'];

export const MINIMUM_EMI_PURCHASE = 5000;

export const BANK_EMI_PLANS: BankEMIPlan[] = [
  {
    id: 'dutch-bangla',
    name: 'Dutch-Bangla Bank PLC',
    shortName: 'Dutch Bangla',
    minPurchase: 5000,
    rates: {
      '3M': 4.25,
      '6M': 5.75,
      '9M': 8.50,
      '12M': 10.25,
      '18M': 12.25,
      '24M': 15.25,
      '36M': 18.25,
    },
  },
  {
    id: 'eastern-bank',
    name: 'Eastern Bank PLC (EBL)',
    shortName: 'Eastern Bank',
    minPurchase: 5000,
    rates: {
      '3M': 4.25,
      '6M': 5.75,
      '9M': 8.50,
      '12M': 10.25,
      '18M': 12.25,
      '24M': 15.25,
      '36M': 22.25,
    },
  },
  {
    id: 'southeast-bank',
    name: 'Southeast Bank PLC',
    shortName: 'Southeast Bank',
    minPurchase: 5000,
    rates: {
      '3M': 4.25,
      '6M': 5.75,
      '9M': 8.50,
      '12M': 10.25,
      '18M': 12.25,
      '24M': 15.25,
      '36M': 22.25,
    },
  },
  {
    id: 'midland-bank',
    name: 'Midland Bank PLC',
    shortName: 'Midland Bank',
    minPurchase: 5000,
    rates: {
      '3M': 4.25,
      '6M': 5.75,
      '9M': 8.50,
      '12M': 10.25,
      '18M': 12.25,
      '24M': 15.25,
      '36M': 15.25,
    },
  },
  {
    id: 'pubali-bank',
    name: 'Pubali Bank PLC',
    shortName: 'Pubali Bank',
    minPurchase: 5000,
    rates: {
      '3M': 4.25,
      '6M': 5.75,
      '9M': 8.50,
      '12M': 10.25,
      '18M': 15.25,
      '24M': 15.25,
      '36M': 18.25,
    },
  },
  {
    id: 'trust-bank',
    name: 'Trust Bank Limited',
    shortName: 'Trust Bank',
    minPurchase: 5000,
    rates: {
      '3M': 4.25,
      '6M': 5.75,
      '9M': 9.50,
      '12M': 12.25,
      '18M': 17.25,
      '24M': 19.25,
      '36M': 25.25,
    },
  },
  {
    id: 'premier-bank',
    name: 'The Premier Bank PLC',
    shortName: 'Premier Bank',
    minPurchase: 5000,
    rates: {
      '3M': 4.25,
      '6M': 5.75,
      '9M': 8.50,
      '12M': 10.25,
      '18M': 12.25,
      '24M': 15.25,
      '36M': null, // Not Available (-)
    },
  },
  {
    id: 'prime-bank',
    name: 'Prime Bank PLC',
    shortName: 'Prime Bank',
    minPurchase: 5000,
    rates: {
      '3M': 4.25,
      '6M': 5.75,
      '9M': 8.50,
      '12M': 10.25,
      '18M': 12.25,
      '24M': 15.25,
      '36M': 22.25,
    },
  },
  {
    id: 'nrb-bank',
    name: 'NRB Bank PLC',
    shortName: 'NRB Bank',
    minPurchase: 5000,
    rates: {
      '3M': 4.25,
      '6M': 5.75,
      '9M': 8.50,
      '12M': 10.25,
      '18M': 12.25,
      '24M': 15.25,
      '36M': null, // Not Available (-)
    },
  },
  {
    id: 'al-arafah-islami',
    name: 'Al-Arafah Islami Bank PLC',
    shortName: 'Al-Arafah Islami',
    minPurchase: 5000,
    rates: {
      '3M': 4.25,
      '6M': 5.75,
      '9M': 8.50,
      '12M': 10.25,
      '18M': 12.25,
      '24M': 15.25,
      '36M': 22.25,
    },
  },
  {
    id: 'ncc-bank',
    name: 'NCC Bank PLC',
    shortName: 'NCC Bank',
    minPurchase: 5000,
    rates: {
      '3M': 4.25,
      '6M': 5.75,
      '9M': 8.50,
      '12M': 10.25,
      '18M': 12.25,
      '24M': 15.25,
      '36M': 22.25,
    },
  },
  {
    id: 'city-bank',
    name: 'The City Bank PLC (City Alo / Amex)',
    shortName: 'City Bank',
    minPurchase: 5000,
    rates: {
      '3M': 4.25,
      '6M': 5.75,
      '9M': 8.50,
      '12M': 10.25,
      '18M': 12.25,
      '24M': 15.25,
      '36M': 22.25,
    },
  },
  {
    id: 'meghna-bank',
    name: 'Meghna Bank PLC',
    shortName: 'Meghna Bank',
    minPurchase: 5000,
    rates: {
      '3M': 4.25,
      '6M': 5.75,
      '9M': 8.50,
      '12M': 10.25,
      '18M': 12.25,
      '24M': 15.25,
      '36M': 22.25,
    },
  },
  {
    id: 'community-bank',
    name: 'Community Bank Bangladesh PLC',
    shortName: 'Community Bank',
    minPurchase: 5000,
    rates: {
      '3M': 4.25,
      '6M': 5.75,
      '9M': 8.50,
      '12M': 10.25,
      '18M': 12.25,
      '24M': 15.25,
      '36M': 22.25,
    },
  },
  {
    id: 'ab-bank',
    name: 'AB Bank PLC',
    shortName: 'AB Bank',
    minPurchase: 5000,
    rates: {
      '3M': 4.25,
      '6M': 5.75,
      '9M': 8.50,
      '12M': 10.25,
      '18M': 12.25,
      '24M': 15.25,
      '36M': 22.25,
    },
  },
  {
    id: 'jamuna-bank',
    name: 'Jamuna Bank PLC',
    shortName: 'Jamuna Bank',
    minPurchase: 5000,
    rates: {
      '3M': 4.25,
      '6M': 5.75,
      '9M': 8.50,
      '12M': 10.25,
      '18M': 12.25,
      '24M': 15.25,
      '36M': 22.25,
    },
  },
];

export interface EMICalculationResult {
  months: number;
  tenureKey: EMITenureKey;
  rate: number;
  chargeAmount: number;
  totalPayable: number;
  monthlyInstallment: number;
}

/**
 * Calculates EMI details for a specific bank and tenure.
 */
export function calculateEMI(
  productPrice: number,
  bankId: string,
  tenureKey: EMITenureKey
): EMICalculationResult | null {
  const bank = BANK_EMI_PLANS.find(b => b.id === bankId);
  if (!bank) return null;

  const rate = bank.rates[tenureKey];
  if (rate === null || rate === undefined) return null;

  const tenure = EMI_TENURES.find(t => t.key === tenureKey);
  if (!tenure) return null;

  const chargeAmount = (productPrice * rate) / 100;
  const totalPayable = productPrice + chargeAmount;
  const monthlyInstallment = Math.round(totalPayable / tenure.months);

  return {
    months: tenure.months,
    tenureKey,
    rate,
    chargeAmount: Math.round(chargeAmount),
    totalPayable: Math.round(totalPayable),
    monthlyInstallment,
  };
}

/**
 * Calculates all available tenure options for a specific bank and product price.
 */
export function getBankEMIOptions(
  productPrice: number,
  bankId: string
): EMICalculationResult[] {
  const bank = BANK_EMI_PLANS.find(b => b.id === bankId);
  if (!bank) return [];

  const results: EMICalculationResult[] = [];
  EMI_TENURES.forEach(tenure => {
    const calc = calculateEMI(productPrice, bankId, tenure.key);
    if (calc) results.push(calc);
  });

  return results;
}

/**
 * Returns the lowest monthly installment among standard tenures (e.g., 12M or 36M) for a product price.
 */
export function getLowestMonthlyEMI(productPrice: number): number {
  if (productPrice < MINIMUM_EMI_PURCHASE) return 0;
  let lowest = Infinity;

  BANK_EMI_PLANS.forEach(bank => {
    // Check 36M or 24M or 12M
    const keys: EMITenureKey[] = ['36M', '24M', '12M', '6M'];
    for (const key of keys) {
      const calc = calculateEMI(productPrice, bank.id, key);
      if (calc && calc.monthlyInstallment < lowest) {
        lowest = calc.monthlyInstallment;
      }
    }
  });

  return lowest === Infinity ? 0 : lowest;
}

/**
 * Returns true if product qualifies for EMI (price >= 5,000)
 */
export function isEligibleForEMI(price: number): boolean {
  return price >= MINIMUM_EMI_PURCHASE;
}
