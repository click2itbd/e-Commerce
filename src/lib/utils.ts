import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, settings?: any) {
  const code = settings?.currency || 'BDT'; // Could be 'Tk.', '$' etc, we'll try to use it as prefix/suffix if not a valid ISO code
  const isAfter = settings?.currencyPosition === 'After Amount';
  const decimals = settings?.precision === '0 Digit' ? 0 : 2;
  const tSep = settings?.thousandSeparator;
  const dSep = settings?.decimalSeparator;

  // Let's use standard number format for the raw digits
  let formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);

  // Apply custom separators if provided
  if (tSep === 'Comma (,)' && dSep === 'Comma (,)') {
     // Swap . and , which is common in european, but usually it's dot for thousand
     // This is tricky, let's keep it simple: en-US uses dot for decimal, comma for thousand.
  } else if (dSep === 'Comma (,)') {
     formatted = formatted.replace(/\./g, 'DECIMAL_POINT').replace(/,/g, '.').replace(/DECIMAL_POINT/g, ',');
  }
  
  if (isAfter) {
    return `${formatted} ${code}`;
  }
  return `${code} ${formatted}`;
}
