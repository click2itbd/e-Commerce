export type UserRole = 'admin' | 'manager' | 'staff' | 'user';

export type UserPermission = 'view_dashboard' | 'manage_users' | 'manage_settings' | 'manage_inventory' | 'manage_orders' | 'manage_finances' | 'manage_reports' | 'manage_hr' | 'manage_services' | 'manage_marketing';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  permissions?: UserPermission[];
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  name: string; // e.g., "Red", "Large"
  sku: string;
  price: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
  variants?: ProductVariant[];
  specs?: Record<string, string>;
  socketType?: string; // For CPU/Motherboard compatibility
  ramType?: string;    // For RAM/Motherboard compatibility
  chipset?: string;    // For Motherboard
  vendorId?: string;   // Linked vendor
  hasSerialTracking?: boolean;
  availableSerials?: string[];
  warrantyMonths?: number;
  isAccessory?: boolean;
  createdAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  category: string; // e.g., "Mainboard", "CPU", "General"
  createdAt: string;
}

export interface PaymentAccount {
  id: string;
  type: string;
  name: string;
  description: string;
  openingBalance: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export type TransactionType = 'sale' | 'purchase' | 'expense' | 'income' | 'payment_received' | 'payment_made' | 'money_receipt' | 'return';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
  entityId: string; // Customer ID or Vendor ID
  entityName: string;
  referenceId?: string; // Order ID or Invoice ID
  categoryId?: string;
  categoryName?: string;
  createdAt: string;
  paymentMethod?: string;
}

export interface TransactionCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  description?: string;
  createdAt: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSerials?: string[];
  itemType?: 'product' | 'domain' | 'hosting';
  domainTld?: string;
  billingCycle?: 'monthly' | 'yearly';
  termYears?: number;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
export type OrderType = 'invoice' | 'quotation' | 'challan';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  type: OrderType;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  paymentMethod?: string;
  paymentReference?: string;
  documentNumber?: string;
  invoiceNumber?: string;
  discountAmount?: number;
  discountCode?: string;
  createdAt: string;
}

export interface SubCategory {
  id: string;
  name: string;
  slug: string;
}

export interface NavigationMenu {
  id: string;
  name: string;
  slug: string;
  subCategories: SubCategory[];
  order: number;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface DocumentDesignSettings {
  invoiceHeader: string;
  invoiceFooter: string;
  quotationHeader: string;
  quotationFooter: string;
  challanHeader: string;
  challanFooter: string;
  showCompanyLogo: boolean;
  showBankDetails: boolean;
  bankDetails: string;
  printOnLetterhead?: boolean;
}

export interface SoldSerial {
  id: string;
  serial: string;
  productId: string;
  productName: string;
  orderId: string;
  customerName: string;
  customerPhone?: string;
  soldAt: string;
  warrantyEndDate: string;
  status: 'active' | 'in_repair' | 'void' | 'returned';
}

export interface ServiceRecord {
  id: string;
  serialNumber: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  equipmentType?: string; // Laptop, Desktop, Printer, etc.
  issueDescription: string;
  isWarranty: boolean;
  serviceCharge: number;
  status: 'received' | 'in_progress' | 'ready' | 'delivered';
  paymentStatus?: 'pending' | 'paid';
  paymentMethod?: string;
  medeaPayment?: string; // Additional field for Medea Payment track
  receivedAt: string;
  deliveredAt?: string;
}

export interface ApiSettings {
  domainApiType: 'manual' | 'resellerclub' | 'namecheap';
  domainApiKey: string;
  cloudLinuxApiType: 'manual' | 'cpanel';
  cloudLinuxApiKey: string;
  vpsApiType: 'manual' | 'solusvm' | 'virtualizor';
  vpsApiKey: string;
}

export interface SiteSettings {
  id: string;
  brandName: string;
  brandShortName: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  footerText: string;
  popupEnabled: boolean;
  popupTitle: string;
  popupMessage: string;
  popupImageUrl?: string;
  popupLink?: string;
  popupDelay: number;
  lowStockThreshold?: number;
  lowStockEmail?: string;
  apiSettings?: ApiSettings;
  documentDesign?: DocumentDesignSettings;
  
  // New Business Settings from UI
  businessName?: string;
  website?: string;
  dateFormat?: string;
  zoneName?: string;
  currency?: string;
  currencyPosition?: string;
  precision?: string;
  thousandSeparator?: string;
  decimalSeparator?: string;
  installmentDays?: string;
  ecommerceChecker?: string;
  shippingCost?: number;

  // Review Widget Settings
  reviewWidgetEnabled?: boolean;
  reviewWidgetProvider?: string;
  reviewWidgetConfig?: string;

  // External Store Integration
  externalStoreEnabled?: boolean;
  externalStoreType?: 'webhook' | 'shopify' | 'woocommerce' | 'custom';
  externalStoreUrl?: string;
  externalStoreKey?: string;

  // Item Setting
  isLoyaltyEnable?: string;
  minimumPointToRedeem?: number;
  loyaltyRate?: number;
  productCodeStartFrom?: string;

  // Admin Auth
  adminPin?: string;

  updatedAt: string;
  [key: string]: any;
}

export interface HostingService {
  id: string;
  title: string;
  description: string;
  iconPath: string;
  startingPrice: number;
  billingCycle: string;
  order: number;
  currency?: string;
  isActive: boolean;
}

export interface HostingPlan {
  id: string;
  serviceId: string;
  name: string;
  price: number;
  billingCycle: string;
  features: string[];
  popular?: boolean;
  order: number;
}

export interface Campaign {
  id: string;
  title: string;
  channel?: 'email' | 'sms' | 'whatsapp' | 'facebook' | 'instagram' | 'google';
  subject?: string;
  content: string;
  recipients?: string[]; // List of emails or phone numbers
  targetAudience?: string; // e.g., "Men 18-35", "Retargeting Cart Abandoners"
  budget?: number;
  targetUrl?: string;
  imageUrl?: string;
  status: 'draft' | 'sent' | 'scheduled' | 'sending' | 'active' | 'paused' | 'completed';
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  // Tracking Metrics
  sent?: number;
  delivered?: number;
  opened?: number;
  clicked?: number;
  impressions?: number;
}

export interface Subscriber {
  id: string;
  email: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  joinDate: string;
  baseSalary: number;
  status: 'active' | 'on_leave' | 'terminated';
  createdAt: string;
}

export interface EmployeeLeave {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  type: 'sick' | 'casual' | 'annual' | 'unpaid';
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  createdAt: string;
}

export interface EmployeeSalary {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string; // e.g., "YYYY-MM"
  baseAmount: number;
  bonus: number;
  deductions: number;
  netPay: number;
  paymentDate: string;
  paymentMethod: string;
  status: 'pending' | 'paid';
  createdAt: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  discountPercentage: number;
  expiryDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface Audience {
  id: string;
  name: string;
  description: string;
  filterCriteria: {
    source?: string;
    status?: string;
    keyword?: string;
  };
  userId: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  leadOwner: string;
  title: string;
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  secondaryEmail?: string;
  phone: string;
  mobile: string;
  fax?: string;
  website?: string;
  industry: string;
  noOfEmployees?: string;
  rating?: string;
  skypeId?: string;
  twitter?: string;
  annualRevenue?: number;
  emailOptOut: boolean;
  
  address: {
    country?: string;
    flatNo?: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  
  dob?: string;
  anniversary?: string;

  source: 'web_form' | 'whatsapp' | 'social' | 'google_ads' | 'manual' | 'web_chat';
  status: 'new' | 'contacted' | 'qualified' | 'lost';
  aiSummary?: string;
  description?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: string;
  createdAt: string;
  userId?: string;
}

export interface SupportTicket {
  id: string;
  title: string;
  description: string;
  type: 'maintenance' | 'technical' | 'bill' | 'sales' | 'complaints' | 'other';
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
  userId?: string;
  customerName?: string;
  customerEmail?: string;
}

export interface DomainOrder {
  id: string;
  domain: string;
  tld: string;
  userId: string;
  orderId: string;
  status: 'pending' | 'active' | 'suspended' | 'cancelled';
  years: number;
  autoRenew: boolean;
  nameservers: string[];
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface HostingAccount {
  id: string;
  userId: string;
  orderId: string;
  planId: string;
  domain: string;
  provider: string;
  status: 'pending' | 'active' | 'suspended' | 'cancelled';
  billingCycle: 'monthly' | 'yearly';
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HostingOrder {
  id: string;
  userId: string;
  items: any[];
  total: number;
  shippingCost: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  type: 'invoice';
  documentNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  company: string;
  paymentMethod: string;
  createdAt: string;
}
