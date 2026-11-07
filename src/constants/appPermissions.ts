export interface PermissionItem {
  key: string;
  label: string;
  description?: string;
  isSensitive?: boolean;
}

export interface PermissionSection {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  items: PermissionItem[];
}

export const APP_PERMISSION_SECTIONS: PermissionSection[] = [
  {
    id: 'dashboard_core',
    title: '1. Dashboard & Core Overview',
    subtitle: 'মূল ড্যাশবোর্ড, প্রফিট অ্যানালিটিক্স ও পিওএস',
    badge: 'Core',
    items: [
      { key: 'dashboard', label: 'Overview', description: 'দৈনিক সেলস ও বিজনেস সামারি ড্যাশবোর্ড' },
      { key: 'analytics', label: 'Analytics (Profit & Margins)', description: 'বিজনেস প্রফিট, মার্জিন ও সেলস গ্রাফ', isSensitive: true },
      { key: 'inventory', label: 'Stock (Inventory)', description: 'পণ্য স্টক তালিকা ও ইনভেন্টরি ম্যানেজমেন্ট' },
      { key: 'pos', label: 'CLICK POS', description: 'পস ক্যাশিয়ার ও সরাসরি সেলস উইন্ডো' },
    ],
  },
  {
    id: 'sale_customer',
    title: '2. Sale & Customer',
    subtitle: 'বিক্রয়, ইনভয়েস, কাস্টমার ও বকেয়া তালিকা',
    badge: 'Sales',
    items: [
      { key: 'sales', label: 'Sale', description: 'নতুন সেল বা ইনভয়েস তৈরি' },
      { key: 'sale_return', label: 'Sale Return', description: 'কাস্টমার পণ্য ফেরত / রিটার্ন ইনভয়েস' },
      { key: 'orders', label: 'Orders & Docs', description: 'পূর্বের সেলস ইনভয়েস ও চালান তালিকা' },
      { key: 'customers', label: 'Customer', description: 'কাস্টমার প্রোফাইল ও ডিরেক্টরি' },
      { key: 'deliveries', label: 'Deliveries', description: 'অনলাইন ও কুরিয়ার ডেলিভারি ট্র্যাকিং' },
      { key: 'customer_due_list', label: 'Customer Due List', description: 'কাস্টমার বকেয়া তালিকা ও পেমেন্ট রিসিভ' },
      { key: 'quotations', label: 'Quotation System', description: 'প্রাইস কোটেশন তৈরি ও ম্যানেজ' },
      { key: 'build_requests', label: 'PC Build Requests', description: 'গ্রাহকদের কাস্টম পিসি রিকোয়েস্ট' },
    ],
  },
  {
    id: 'purchase_supplier',
    title: '3. Purchase & Supplier',
    subtitle: 'সাপ্লায়ার, পারচেজ বিল, সাপ্লায়ার বকেয়া ও চেক',
    badge: 'Purchases',
    items: [
      { key: 'purchases', label: 'Purchase', description: 'সাপ্লায়ার থেকে পণ্য ক্রয় বা পারচেজ বিল' },
      { key: 'purchase_return', label: 'Purchase Return', description: 'সাপ্লায়ারকে পণ্য ফেরত বা রিটার্ন' },
      { key: 'vendors', label: 'Supplier', description: 'ভেন্ডর ও সাপ্লায়ার তালিকা' },
      { key: 'vendor_due_list', label: 'Supplier Due List', description: 'সাপ্লায়ারের বকেয়া তালিকা ও পেমেন্ট পে' },
      { key: 'cheques', label: 'Cheque Tracker (PDC)', description: 'পোস্ট ডেটেড চেক ট্র্যাকিং' },
    ],
  },
  {
    id: 'warranty_service',
    title: '4. Warranty & Servicing',
    subtitle: 'সার্ভিস টিকেট, ওয়ারেন্টি ও রিপেয়ার বিল',
    badge: 'Services',
    items: [
      { key: 'services', label: 'Warranty & Service', description: 'প্রোডাক্ট সার্ভিসিং, আউটসোর্স ও মানি রিসিট' },
    ],
  },
  {
    id: 'accounting_wallets',
    title: '5. Accounting & Cash Wallets',
    subtitle: 'ক্যাশ ড্রয়ার, ব্যাংক অ্যাকাউন্ট, লেজার ও লাভ-ক্ষতি',
    badge: 'Finance (Sensitive)',
    items: [
      { key: 'internal_notes', label: 'Staff Notes', description: 'টিমের অভ্যন্তরীণ নোটিশ ও মেমো বোর্ড' },
      { key: 'menus', label: 'Products Category', description: 'পণ্যের ক্যাটাগরি ও মেনু কনফিগারেশন' },
      { key: 'payment_accounts', label: 'Payment Account (Cash & Bank)', description: 'দোকানের ক্যাশ ড্রয়ার ও ব্যাংক অ্যাকাউন্টস', isSensitive: true },
      { key: 'ledger', label: 'Ledger', description: 'পূর্ণাঙ্গ অ্যাকাউন্টিং খতিয়ান বা লেজার', isSensitive: true },
      { key: 'daily_collection_payout', label: 'Daily Collection Payout', description: 'দৈনিক কালেকশন ও পেআউট বিবরণী', isSensitive: true },
      { key: 'manual_income', label: 'Income', description: 'অন্যান্য খাত থেকে বিবিধ আয় এন্ট্রি' },
      { key: 'manual_expense', label: 'Expense', description: 'দোকানের যাবতীয় দৈনন্দিন খরচ এন্ট্রি' },
      { key: 'tx_categories', label: 'Categories (Transactions)', description: 'আয় ও ব্যয়ের ক্যাটাগরি তৈরি' },
      { key: 'reports', label: 'Sales Accounting', description: 'বিক্রয় ও লাভ সংক্রান্ত অ্যাকাউন্টিং' },
      { key: 'stock_accounting', label: 'Stock Accounting', description: 'স্টক মূল্যায়ন ও ইনভেন্টরি অ্যাকাউন্টিং' },
      { key: 'customer_receive_report', label: 'Receive Report', description: 'কাস্টমারদের থেকে টাকা প্রাপ্তির হিসাব' },
      { key: 'deposits_withdrawals', label: 'Deposit / Withdraw / Transfer', description: 'ফান্ড ট্রান্সফার, ক্যাশ জমা ও উত্তোলন', isSensitive: true },
      { key: 'account_balance', label: 'Account Balance', description: 'প্রতিটি ওয়ালেটের লাইভ ব্যালেন্স স্ট্যাটাস', isSensitive: true },
      { key: 'account_statement', label: 'Account Statement', description: 'নির্দিষ্ট অ্যাকাউন্টের ব্যাংক স্টেটমেন্ট', isSensitive: true },
      { key: 'balance_sheet', label: 'Balance Sheet', description: 'সম্পদ ও দায়ের পূর্ণাঙ্গ ব্যালেন্স শিট', isSensitive: true },
      { key: 'trial_balance', label: 'Trial Balance', description: 'হিসাবের শুদ্ধতা যাচাইয়ের রেওয়ামিল', isSensitive: true },
      { key: 'day_book', label: 'Day Book', description: 'দৈনিক সমস্ত ক্যাশ ও ব্যাংক লেনদেন' },
      { key: 'transaction_history', label: 'Transaction History', description: 'সকল লেনদেনের হিস্টোরি অডিট' },
      { key: 'profit_loss', label: 'Profit & Loss', description: 'দোকানের লাভ-ক্ষতির চূড়ান্ত হিসাব', isSensitive: true },
      { key: 'all_reports', label: 'All Reports', description: 'অন্যান্য সকল ফাইন্যান্সিয়াল রিপোর্টস' },
    ],
  },
  {
    id: 'marketing_feedback',
    title: '6. Marketing & Feedback',
    subtitle: 'ক্যাম্পেইন, ডিসকাউন্ট ও কাস্টমার রিভিউ',
    badge: 'Marketing',
    items: [
      { key: 'campaigns', label: 'Marketing', description: 'মার্কেটিং প্রমোশন ও ক্যাম্পেইন' },
      { key: 'discountCodes', label: 'Discounts', description: 'কুপন কোড ও ছাড় কনফিগারেশন' },
      { key: 'reviews', label: 'Reviews', description: 'ই-কমার্স ওয়েবসাইটের গ্রাহক রিভিউ' },
    ],
  },
  {
    id: 'human_resource',
    title: '7. Human Resource',
    subtitle: 'টিম মেম্বার, কর্মচারী, পারফরম্যান্স ও বেতন',
    badge: 'HR',
    items: [
      { key: 'users', label: 'App Access', description: 'অন্যান্য স্টাফদের পারমিশন ও ইউজার রোল কন্ট্রোল', isSensitive: true },
      { key: 'employees', label: 'Employees', description: 'কর্মচারীদের প্রোফাইল ও বায়োডাটা' },
      { key: 'staff_performance', label: 'Performance', description: 'স্টাফ সেলস ও পারফরম্যান্স স্কোর' },
      { key: 'leave', label: 'Leave', description: 'ছুটির আবেদন ও ছুটি অনুমোদন' },
      { key: 'salary', label: 'Salary Overview', description: 'মাসিক বেতন ও অ্যাডভান্স পেমেন্ট হিসাব', isSensitive: true },
    ],
  },
  {
    id: 'system_settings',
    title: '8. System & Settings',
    subtitle: 'সিআরএম, টাস্ক লিস্ট, অডিট লগ ও সেটিংস',
    badge: 'Settings',
    items: [
      { key: 'crm', label: 'CRM System', description: 'গ্রাহক ফলোআপ ও প্রজেক্ট লিড ম্যানেজমেন্ট' },
      { key: 'tasks', label: 'To-Do List', description: 'দোকানের ব্যক্তিগত ও টিম টাস্ক' },
      { key: 'audit_logs', label: 'Audit Logs', description: 'সিস্টেমের সকল অ্যাক্টিভিটি ও অডিট লগ', isSensitive: true },
      { key: 'restore', label: 'Restore', description: 'রিসাইকেল বিন ও ডিলিট করা ডাটা রিকভারি', isSensitive: true },
      { key: 'settings', label: 'Settings', description: 'দোকানের ঠিকানা, ইনভয়েস ও সাধারণ সেটিংস', isSensitive: true },
    ],
  },
];

// Helper to get all permission keys
export const ALL_APP_PERMISSION_KEYS = APP_PERMISSION_SECTIONS.flatMap(s => s.items.map(i => i.key));

// Role presets for quick assignment
export const ROLE_PERMISSION_PRESETS: Record<string, { label: string; description: string; keys: string[] }> = {
  sales_staff: {
    label: 'Sales Staff (বিক্রয়কর্মী)',
    description: 'শুধু সেলস, অর্ডার ও কাস্টমার ডিউ দেখতে পারবে',
    keys: ['dashboard', 'inventory', 'pos', 'sales', 'sale_return', 'orders', 'customers', 'customer_due_list', 'quotations', 'internal_notes', 'tasks'],
  },
  service_tech: {
    label: 'Service & Repair Tech (সার্ভিস টেকনিশিয়ান)',
    description: 'ওয়ারেন্টি, সার্ভিস রিপেয়ার ও স্টক দেখতে পারবে',
    keys: ['dashboard', 'inventory', 'services', 'internal_notes', 'customers', 'tasks'],
  },
  accountant: {
    label: 'Accountant (হিসাবরক্ষক)',
    description: 'কাস্টমার/সাপ্লায়ার ডিউ, চেক ও সমস্ত অ্যাকাউন্টিং অ্যাক্সেস',
    keys: [
      'dashboard', 'analytics', 'customer_due_list', 'vendor_due_list', 'cheques',
      'internal_notes', 'payment_accounts', 'ledger', 'daily_collection_payout', 'manual_income', 'manual_expense',
      'tx_categories', 'reports', 'stock_accounting', 'customer_receive_report', 'deposits_withdrawals',
      'account_balance', 'account_statement', 'balance_sheet', 'trial_balance', 'day_book', 'transaction_history',
      'profit_loss', 'all_reports', 'salary'
    ],
  },
  store_manager: {
    label: 'Store Manager (ম্যানেজার)',
    description: 'সেলস, পারচেজ, স্টক, সার্ভিস ও সাধারণ রিপোর্টস (ব্যাংক ড্রয়ার ব্যতীত)',
    keys: [
      'dashboard', 'inventory', 'pos', 'sales', 'sale_return', 'orders', 'customers', 'deliveries',
      'customer_due_list', 'quotations', 'build_requests', 'purchases', 'purchase_return', 'vendors',
      'vendor_due_list', 'cheques', 'services', 'internal_notes', 'manual_expense', 'reports',
      'stock_accounting', 'customer_receive_report', 'day_book', 'campaigns', 'discountCodes',
      'employees', 'leave', 'crm', 'tasks'
    ],
  },
  super_admin: {
    label: 'Full Access (সকল সেকশন)',
    description: 'সিস্টেমের সমস্ত মেনু এবং অ্যাকাউন্টের পূর্ণ ক্ষমতা',
    keys: [...ALL_APP_PERMISSION_KEYS, 'access_ecommerce', 'access_hosting'],
  },
};
