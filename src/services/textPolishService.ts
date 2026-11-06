import { apiPost } from './apiClient';

export type PolishContext = 'product_name' | 'description' | 'notes' | 'quotation' | 'general';
export type PolishTargetLang = 'auto' | 'bangla' | 'english' | 'banglish_to_bangla';

export interface PolishOptions {
  context?: PolishContext;
  targetLang?: PolishTargetLang;
}

// Common Banglish to Bengali phonetic word map
const BANGLISH_DICT: Record<string, string> = {
  'kono': 'কোনো',
  'kono problem nai': 'কোনো সমস্যা নেই',
  'problem': 'সমস্যা',
  'nai': 'নেই',
  'khub': 'খুব',
  'valo': 'ভালো',
  'bhalo': 'ভালো',
  'ache': 'আছে',
  'korte': 'করতে',
  'hobe': 'হবে',
  'taka': 'টাকা',
  'tk': 'টাকা',
  'dorkar': 'দরকার',
  'proyojon': 'প্রয়োজন',
  'dhonnobad': 'ধন্যবাদ',
  'apnar': 'আপনার',
  'amader': 'আমাদের',
  'shob': 'সব',
  'sohoj': 'সহজ',
  'notun': 'নতুন',
  'puran': 'পুরাতন',
  'purano': 'পুরাতন',
  'dam': 'দাম',
  'kom': 'কম',
  'beshi': 'বেশি',
  'onek': 'অনেক',
  'ektu': 'একটু',
  'ekhon': 'এখন',
  'pore': 'পরে',
  'ajke': 'আজকে',
  'kalke': 'কালকে',
  'shokal': 'সকাল',
  'dupur': 'দুপুর',
  'bikeler': 'বিকালের',
  'raate': 'রাতে',
  'shathe': 'সাথে',
  'shate': 'সাথে',
  'sathe': 'সাথে',
  'deya': 'দেওয়া',
  'dibo': 'দিব',
  'dite': 'দিতে',
  'nibo': 'নেব',
  'nibe': 'নেবে',
  'kinte': 'কিনতে',
  'parben': 'পারবেন',
  'parbo': 'পারব',
  'chai': 'চাই',
  'chaile': 'চাইলে',
  'bochor': 'বছর',
  'mash': 'মাস',
  'din': 'দিন',
  'warrenty': 'ওয়ারেন্টি',
  'warranty': 'ওয়ারেন্টি',
  'guarenty': 'গ্যারান্টি',
  'guarantee': 'গ্যারান্টি',
  'delivary': 'ডেলিভারি',
  'delivery': 'ডেলিভারি',
  'chalan': 'চালান',
  'challan': 'চালান',
  'invoce': 'ইনভয়েস',
  'invoice': 'ইনভয়েস',
  'custmer': 'কাস্টমার',
  'customer': 'কাস্টমার',
  'kotha': 'কথা',
  'shobcheye': 'সবচেয়ে',
  'best': 'সেরা',
  'urgent': 'জরুরি',
  'shomoy': 'সময়',
  'advance': 'অগ্রিম',
  'baki': 'বাকি',
  'porishodh': 'পরিশোধ',
  'cash': 'ক্যাশ',
};

// Common tech brands and terms capitalization map
const TECH_BRANDS: Record<string, string> = {
  'samsung': 'Samsung',
  'apple': 'Apple',
  'intel': 'Intel',
  'amd': 'AMD',
  'ryzen': 'Ryzen',
  'asus': 'Asus',
  'gigabyte': 'Gigabyte',
  'msi': 'MSI',
  'dell': 'Dell',
  'hp': 'HP',
  'lenovo': 'Lenovo',
  'logitech': 'Logitech',
  'fantech': 'Fantech',
  'havit': 'Havit',
  'tp-link': 'TP-Link',
  'tplink': 'TP-Link',
  'd-link': 'D-Link',
  'dlink': 'D-Link',
  'redragon': 'Redragon',
  'a4tech': 'A4Tech',
  'razer': 'Razer',
  'corsair': 'Corsair',
  'adata': 'ADATA',
  'kingston': 'Kingston',
  'transcend': 'Transcend',
  'sandisk': 'SanDisk',
  'western digital': 'Western Digital',
  'seagate': 'Seagate',
  'toshiba': 'Toshiba',
  'hikvision': 'Hikvision',
  'dahua': 'Dahua',
  'maxline': 'Maxline',
  'xiaomi': 'Xiaomi',
  'realme': 'Realme',
  'oneplus': 'OnePlus',
  'ram': 'RAM',
  'rom': 'ROM',
  'ssd': 'SSD',
  'nvme': 'NVMe',
  'hdd': 'HDD',
  'cpu': 'CPU',
  'gpu': 'GPU',
  'usb': 'USB',
  'hdmi': 'HDMI',
  'vga': 'VGA',
  'ips': 'IPS',
  'led': 'LED',
  'oled': 'OLED',
  'rgb': 'RGB',
  'argb': 'ARGB',
  'atx': 'ATX',
  'psu': 'PSU',
  'ups': 'UPS',
  'wifi': 'Wi-Fi',
  'wi-fi': 'Wi-Fi',
  'bluetooth': 'Bluetooth',
  'lan': 'LAN',
  'rj45': 'RJ45',
  'ghz': 'GHz',
  'mhz': 'MHz',
  'hz': 'Hz',
  'fps': 'FPS',
  'gb': 'GB',
  'tb': 'TB',
  'mb': 'MB',
  'kb': 'KB',
  'watt': 'Watt',
  'dpi': 'DPI',
  'core': 'Core',
  'ddr3': 'DDR3',
  'ddr4': 'DDR4',
  'ddr5': 'DDR5',
  'pcie': 'PCIe',
  'gen3': 'Gen3',
  'gen4': 'Gen4',
  'gen5': 'Gen5',
  'sata': 'SATA',
  'pro': 'Pro',
  'plus': 'Plus',
  'ultra': 'Ultra',
  'mini': 'Mini',
  'max': 'Max',
  'lite': 'Lite',
  'gaming': 'Gaming',
  'wireless': 'Wireless',
  'motherboard': 'Motherboard',
  'processor': 'Processor',
  'monitor': 'Monitor',
  'keyboard': 'Keyboard',
  'mouse': 'Mouse',
  'casing': 'Casing',
  'power supply': 'Power Supply',
};

// Common spelling errors
const SPELLING_CORRECTIONS: Record<string, string> = {
  'warrenty': 'warranty',
  'warenty': 'warranty',
  'guarenty': 'guarantee',
  'garranty': 'guarantee',
  'prossesor': 'processor',
  'prossessor': 'processor',
  'prosesor': 'processor',
  'moterboard': 'motherboard',
  'motharboard': 'motherboard',
  'discription': 'description',
  'delivary': 'delivery',
  'delevery': 'delivery',
  'delivry': 'delivery',
  'invoce': 'invoice',
  'invice': 'invoice',
  'quotetion': 'quotation',
  'cotation': 'quotation',
  'custmer': 'customer',
  'costomer': 'customer',
  'recieved': 'received',
  'recieve': 'receive',
  'advanse': 'advance',
  'amout': 'amount',
  'ammount': 'amount',
  'percet': 'percent',
  'persent': 'percent',
  'accunt': 'account',
  'accont': 'account',
  'adress': 'address',
  'modle': 'model',
  'colur': 'color',
  'colour': 'color',
  'cabble': 'cable',
  'chargar': 'charger',
  'adaptar': 'adapter',
};

/**
 * Intelligent client-side rule-based text polisher used when offline or fallback
 */
export function polishTextLocally(text: string, options?: PolishOptions): string {
  if (!text || !text.trim()) return '';

  let str = text.trim();
  const context = options?.context || 'general';
  const targetLang = options?.targetLang || 'auto';

  // Check if mostly Bengali script
  const isBengaliScript = /[\u0980-\u09FF]/.test(str);

  if (targetLang === 'banglish_to_bangla' || (!isBengaliScript && targetLang === 'bangla')) {
    // Replace Banglish phrases/words with Bengali
    let lowerStr = str.toLowerCase();
    for (const [k, v] of Object.entries(BANGLISH_DICT)) {
      const reg = new RegExp(`\\b${k}\\b`, 'gi');
      lowerStr = lowerStr.replace(reg, v);
    }
    str = lowerStr;
  } else {
    // 1. Correct common spelling mistakes
    for (const [misspelled, correct] of Object.entries(SPELLING_CORRECTIONS)) {
      const reg = new RegExp(`\\b${misspelled}\\b`, 'gi');
      str = str.replace(reg, correct);
    }

    // 2. Capitalize technology brands and acronyms
    for (const [brandLower, brandProper] of Object.entries(TECH_BRANDS)) {
      const reg = new RegExp(`\\b${brandLower}\\b`, 'gi');
      str = str.replace(reg, brandProper);
    }
  }

  // 3. Fix spacing around punctuation: "word ,word" -> "word, word", "word .word" -> "word. Word"
  str = str
    .replace(/\s+([,.:;?!])/g, '$1')
    .replace(/([,.:;?!])(?=[^\s\d])/g, '$1 ')
    .replace(/\s{2,}/g, ' ');

  // 4. Product Name formatting: Title Case
  if (context === 'product_name') {
    str = str
      .split(' ')
      .map(word => {
        // If word is already a known uppercase brand/acronym (like SSD, RAM, ASUS, HP), preserve it
        const lower = word.toLowerCase();
        if (TECH_BRANDS[lower]) {
          return TECH_BRANDS[lower];
        }
        // Small connector words in lower case unless at beginning
        if (['and', 'or', 'with', 'for', 'in', 'of', 'to'].includes(lower)) {
          return lower;
        }
        // Standard capitalize first letter
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  } else {
    // Sentence capitalization: Capitalize first letter of each sentence
    str = str.replace(/(^\s*|[.!?]\s+)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());
  }

  return str.trim();
}

/**
 * Main AI Polish function:
 * Calls server-side Gemini AI service, with automatic seamless client fallback.
 */
export async function polishText(text: string, options?: PolishOptions): Promise<string> {
  const clean = (text || '').trim();
  if (!clean) return '';

  try {
    const res = await apiPost<{ success: boolean; polished: string }>('/api/ai/polish', {
      text: clean,
      context: options?.context || 'general',
      targetLang: options?.targetLang || 'auto',
    });

    if (res && res.success && res.polished && res.polished.trim()) {
      return res.polished.trim();
    }
  } catch (err) {
    console.warn('[polishText] Backend AI service error, falling back to local polisher:', err);
  }

  // Fallback to local heuristic polisher
  return polishTextLocally(clean, options);
}
