import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, setDoc, getDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { formatCurrency, cn } from '../../../../lib/utils';
import { useAuth } from '../../../../context/AuthContext';
import { useSettings } from '../../../../context/SettingsContext';
import { 
  Server, 
  Edit, 
  Trash2, 
  Plus, 
  X, 
  Settings2, 
  Database, 
  LayoutTemplate, 
  Save, 
  DollarSign, 
  Calculator, 
  RefreshCw,
  Zap,
  Globe,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  Shield
} from 'lucide-react';

export const DEFAULT_HOSTING_FEATURES = [
  { id: 'disk_space', name: 'Storage Space', category: 'Standard Features', type: 'text', order: 1 },
  { id: 'bandwidth', name: 'Bandwidth', category: 'Standard Features', type: 'text', order: 2 },
  { id: 'addon_domains', name: 'Addon Domains', category: 'Standard Features', type: 'text', order: 3 },
  { id: 'subdomains', name: 'Subdomains', category: 'Standard Features', type: 'text', order: 4 },
  { id: 'emails', name: 'Email Accounts', category: 'Email & DB', type: 'text', order: 5 },
  { id: 'databases', name: 'MySQL Databases', category: 'Email & DB', type: 'text', order: 6 },
  { id: 'free_ssl', name: 'Free SSL Certificate', category: 'Security', type: 'boolean', order: 7 },
  { id: 'litespeed', name: 'LiteSpeed Web Server', category: 'Server', type: 'boolean', order: 8 },
  { id: 'daily_backup', name: 'Daily Backup', category: 'Security', type: 'boolean', order: 9 },
  { id: 'cpanel', name: 'cPanel Control Panel', category: 'Server', type: 'boolean', order: 10 },
  { id: 'softaculous', name: 'Softaculous', category: 'Server', type: 'boolean', order: 11 },
  { id: 'max_accounts', name: 'Maximum amount of hosting accounts', category: 'CloudLinux License', type: 'text', order: 12 },
  { id: 'lve_limits', name: 'Resources limits (LVE)', category: 'CloudLinux License', type: 'boolean', order: 13 },
  { id: 'cagefs', name: 'CageFS', category: 'CloudLinux License', type: 'boolean', order: 14 },
  { id: 'mysql_governor', name: 'MySQL Governor', category: 'CloudLinux License', type: 'boolean', order: 15 },
  { id: 'php_selector', name: 'PHP Selector', category: 'CloudLinux License', type: 'boolean', order: 16 },
  { id: 'ruby_selector', name: 'Ruby Selector', category: 'CloudLinux License', type: 'boolean', order: 17 },
  { id: 'python_selector', name: 'Python Selector', category: 'CloudLinux License', type: 'boolean', order: 18 },
  { id: 'nodejs_selector', name: 'NodeJS Selector', category: 'CloudLinux License', type: 'boolean', order: 19 },
  { id: 'hardened_php', name: 'HardenedPHP', category: 'CloudLinux License', type: 'boolean', order: 20 },
  { id: 'apache_mod_lsapi_pro', name: 'Apache mod_lsapi PRO', category: 'CloudLinux License', type: 'boolean', order: 21 },
  { id: 'secure_links', name: 'SecureLinks (symlink protection)', category: 'CloudLinux License', type: 'boolean', order: 22 },
  { id: 'website_monitoring', name: 'Website monitoring tool', category: 'CloudLinux License', type: 'boolean', order: 23 },
  { id: 'slow_site_analyzer', name: 'Slow Site analyzer', category: 'CloudLinux License', type: 'boolean', order: 24 },
  { id: 'php_xray', name: 'PHP X-Ray', category: 'CloudLinux License', type: 'boolean', order: 25 },
  { id: 'centralized_monitoring', name: 'Centralized Monitoring', category: 'CloudLinux License', type: 'boolean', order: 26 },
  { id: 'accelerate_wp', name: 'AccelerateWP', category: 'CloudLinux License', type: 'boolean', order: 27 },
  { id: 'support_247', name: 'Support 24/7', category: 'CloudLinux License', type: 'boolean', order: 28 }
];

export const DEFAULT_HOSTING_PACKAGES = [
  // 1. Shared cPanel Tier
  {
    id: 'plan_student',
    name: 'Student',
    slug: 'student',
    category: 'shared',
    order: 1,
    status: 'published',
    badge: 'Budget Friendly',
    priceOverride: true,
    overridePrice: 75,
    overrideAnnualPrice: 720,
    pricing: { licenseCostUsd: 0, monthly: 75, annually: 720, billingCycle: 'monthly' },
    cloudLinuxLimits: { cpu: '100', pmem: '1024', vmem: '2048', io: '10', iops: '1024', ep: '20', nproc: '100', inodes: '150000' },
    comparisonValues: {
      disk_space: '2 GB NVMe SSD',
      bandwidth: '50 GB',
      addon_domains: '0',
      subdomains: '3',
      emails: '2',
      databases: '2',
      free_ssl: true,
      litespeed: true,
      daily_backup: false,
      cpanel: true,
      softaculous: true
    },
    popular: false,
    allowCustomization: false
  },
  {
    id: 'plan_starter',
    name: 'Starter',
    slug: 'starter',
    category: 'shared',
    order: 2,
    status: 'published',
    badge: 'Standard Starter',
    priceOverride: true,
    overridePrice: 150,
    overrideAnnualPrice: 1440,
    pricing: { licenseCostUsd: 0, monthly: 150, annually: 1440, billingCycle: 'monthly' },
    cloudLinuxLimits: { cpu: '100', pmem: '1024', vmem: '2048', io: '10', iops: '1024', ep: '20', nproc: '100', inodes: '250000' },
    comparisonValues: {
      disk_space: '5 GB NVMe SSD',
      bandwidth: '100 GB',
      addon_domains: '0',
      subdomains: 'Unlimited',
      emails: '5',
      databases: '5',
      free_ssl: true,
      litespeed: true,
      daily_backup: false,
      cpanel: true,
      softaculous: true
    },
    popular: false,
    allowCustomization: false
  },
  {
    id: 'plan_standard',
    name: 'Standard',
    slug: 'standard',
    category: 'shared',
    order: 3,
    status: 'published',
    badge: 'Most Popular',
    priceOverride: true,
    overridePrice: 350,
    overrideAnnualPrice: 3360,
    pricing: { licenseCostUsd: 0, monthly: 350, annually: 3360, billingCycle: 'monthly' },
    cloudLinuxLimits: { cpu: '150', pmem: '2048', vmem: '4096', io: '20', iops: '2048', ep: '30', nproc: '150', inodes: '500000' },
    comparisonValues: {
      disk_space: '10 GB NVMe SSD',
      bandwidth: 'Unlimited',
      addon_domains: '3',
      subdomains: 'Unlimited',
      emails: '20',
      databases: '20',
      free_ssl: true,
      litespeed: true,
      daily_backup: true,
      cpanel: true,
      softaculous: true
    },
    popular: true,
    allowCustomization: true
  },
  {
    id: 'plan_professional',
    name: 'Professional',
    slug: 'professional',
    category: 'shared',
    order: 4,
    status: 'published',
    badge: 'Business Boost',
    priceOverride: true,
    overridePrice: 650,
    overrideAnnualPrice: 6240,
    pricing: { licenseCostUsd: 0, monthly: 650, annually: 6240, billingCycle: 'monthly' },
    cloudLinuxLimits: { cpu: '200', pmem: '4096', vmem: '8192', io: '30', iops: '4096', ep: '50', nproc: '200', inodes: '750000' },
    comparisonValues: {
      disk_space: '20 GB NVMe SSD',
      bandwidth: 'Unlimited',
      addon_domains: '10',
      subdomains: 'Unlimited',
      emails: 'Unlimited',
      databases: 'Unlimited',
      free_ssl: true,
      litespeed: true,
      daily_backup: true,
      cpanel: true,
      softaculous: true
    },
    popular: false,
    allowCustomization: true
  },
  {
    id: 'plan_premium',
    name: 'Premium',
    slug: 'premium',
    category: 'shared',
    order: 5,
    status: 'published',
    badge: 'Maximum Power',
    priceOverride: true,
    overridePrice: 1200,
    overrideAnnualPrice: 11520,
    pricing: { licenseCostUsd: 0, monthly: 1200, annually: 11520, billingCycle: 'monthly' },
    cloudLinuxLimits: { cpu: '300', pmem: '8192', vmem: '16384', io: '50', iops: '8192', ep: '100', nproc: '300', inodes: '1000000' },
    comparisonValues: {
      disk_space: '50 GB NVMe SSD',
      bandwidth: 'Unlimited',
      addon_domains: 'Unlimited',
      subdomains: 'Unlimited',
      emails: 'Unlimited',
      databases: 'Unlimited',
      free_ssl: true,
      litespeed: true,
      daily_backup: true,
      cpanel: true,
      softaculous: true
    },
    popular: false,
    allowCustomization: true
  },

  // 2. Managed WordPress Cloud Tier (BDIX Turbo)
  {
    id: 'wp_starter',
    name: 'WP Starter',
    slug: 'wp-starter',
    category: 'wordpress',
    order: 6,
    status: 'published',
    badge: 'Student & Blogger',
    priceOverride: true,
    overridePrice: 250,
    overrideAnnualPrice: 2400,
    pricing: { licenseCostUsd: 0, monthly: 250, annually: 2400, billingCycle: 'monthly' },
    cloudLinuxLimits: { cpu: '200', pmem: '2048', vmem: '4096', io: '30', iops: '2048', ep: '40', nproc: '150', inodes: '350000' },
    comparisonValues: {
      disk_space: '10 GB Pure NVMe SSD',
      bandwidth: '100 GB BDIX',
      addon_domains: '1 Website',
      subdomains: '5',
      emails: '10',
      databases: '5',
      free_ssl: true,
      litespeed: true,
      daily_backup: true,
      cpanel: true,
      softaculous: true
    },
    popular: false,
    features: [
      '10 GB Pure NVMe SSD',
      '2 vCPU Cores & 2 GB RAM',
      'LiteSpeed Enterprise Web Server',
      'LSCache & Redis Acceleration',
      'Free Unlimited SSL Certificate',
      '1-Click WordPress Staging',
      'Daily Automated JetBackup',
      'Automated WP Core & Plugin Updates',
      'Free Website Migration',
      '24/7 Priority Support'
    ]
  },
  {
    id: 'wp_pro',
    name: 'WP Pro Turbo',
    slug: 'wp-pro-turbo',
    category: 'wordpress',
    order: 7,
    status: 'published',
    badge: 'Most Popular',
    popular: true,
    priceOverride: true,
    overridePrice: 500,
    overrideAnnualPrice: 4800,
    pricing: { licenseCostUsd: 0, monthly: 500, annually: 4800, billingCycle: 'monthly' },
    cloudLinuxLimits: { cpu: '400', pmem: '4096', vmem: '8192', io: '50', iops: '4096', ep: '60', nproc: '250', inodes: '600000' },
    comparisonValues: {
      disk_space: '25 GB Pure NVMe SSD',
      bandwidth: 'Unlimited BDIX',
      addon_domains: '5 Websites',
      subdomains: 'Unlimited',
      emails: 'Unlimited',
      databases: 'Unlimited',
      free_ssl: true,
      litespeed: true,
      daily_backup: true,
      cpanel: true,
      softaculous: true
    },
    features: [
      '25 GB Pure NVMe SSD',
      '4 vCPU Cores & 4 GB RAM',
      'LiteSpeed Enterprise + QUIC.cloud',
      'Dedicated Redis Object Cache',
      'Free SSL & HTTP/3 Support',
      'Multi-Site Staging Environment',
      'Daily Automated JetBackup (30 Days)',
      'Malware Scanner & Auto-Clean',
      'Free VIP Migration by Experts',
      'Dedicated DevOps WhatsApp Support'
    ]
  },
  {
    id: 'wp_ecom',
    name: 'E-Commerce Ultra',
    slug: 'wp-ecom-ultra',
    category: 'wordpress',
    order: 8,
    status: 'published',
    badge: 'WooCommerce Boosted',
    popular: false,
    priceOverride: true,
    overridePrice: 950,
    overrideAnnualPrice: 9120,
    pricing: { licenseCostUsd: 0, monthly: 950, annually: 9120, billingCycle: 'monthly' },
    cloudLinuxLimits: { cpu: '600', pmem: '8192', vmem: '16384', io: '80', iops: '8192', ep: '100', nproc: '400', inodes: '1000000' },
    comparisonValues: {
      disk_space: '50 GB Pure NVMe SSD',
      bandwidth: 'Unlimited BDIX',
      addon_domains: '10 Websites',
      subdomains: 'Unlimited',
      emails: 'Unlimited',
      databases: 'Unlimited',
      free_ssl: true,
      litespeed: true,
      daily_backup: true,
      cpanel: true,
      softaculous: true
    },
    features: [
      '50 GB Pure NVMe SSD in RAID 10',
      '6 vCPU Cores & 8 GB RAM',
      'WooCommerce High-Concurrency Engine',
      'Dedicated Redis Cache Instance',
      'Free Wildcard SSL Certificate',
      'Real-time Cart Abandonment Protection',
      'Automated Hourly Database Backup',
      'Enterprise DDoS Mitigation (Cloudflare)',
      'Zero Downtime Traffic Spike Shield',
      'Dedicated Account Manager'
    ]
  },
  {
    id: 'wp_mega',
    name: 'Mega Portal Cloud',
    slug: 'wp-mega-portal',
    category: 'wordpress',
    order: 9,
    status: 'published',
    badge: 'Enterprise WP',
    popular: false,
    priceOverride: true,
    overridePrice: 1800,
    overrideAnnualPrice: 17280,
    pricing: { licenseCostUsd: 0, monthly: 1800, annually: 17280, billingCycle: 'monthly' },
    cloudLinuxLimits: { cpu: '800', pmem: '16384', vmem: '32768', io: '100', iops: '10240', ep: '150', nproc: '600', inodes: '2000000' },
    comparisonValues: {
      disk_space: '100 GB Enterprise NVMe',
      bandwidth: 'Unlimited BDIX',
      addon_domains: 'Unlimited Websites',
      subdomains: 'Unlimited',
      emails: 'Unlimited',
      databases: 'Unlimited',
      free_ssl: true,
      litespeed: true,
      daily_backup: true,
      cpanel: true,
      softaculous: true
    },
    features: [
      '100 GB Enterprise NVMe SSD',
      '8 vCPU Cores & 16 GB RAM',
      'Isolated Containerized Environment',
      'Custom Redis & Memcached Pools',
      'Dedicated Public IPv4 Address',
      'Enterprise SLA 99.99% Guaranteed',
      'Real-time Continuous Backups',
      'Custom PHP Extension Configuration',
      '24/7/365 On-Call Senior Engineer',
      'White-Glove Architecture Consultation'
    ]
  },

  // 3. High-Performance KVM Cloud VPS Tier
  {
    id: 'vps_starter',
    name: 'Cloud VPS 1',
    slug: 'vps-starter',
    category: 'vps',
    order: 10,
    status: 'published',
    badge: 'Standard Starter',
    popular: false,
    priceOverride: true,
    overridePrice: 1800,
    overrideAnnualPrice: 17280,
    pricing: { licenseCostUsd: 0, monthly: 1800, annually: 17280, billingCycle: 'monthly' },
    cloudLinuxLimits: { cpu: '2 Cores', pmem: '4096', vmem: '4096', io: '50', iops: '5000', ep: '50', nproc: '200', inodes: '1000000' },
    comparisonValues: {
      disk_space: '60 GB NVMe SSD',
      bandwidth: '2 TB BDIX & Global',
      addon_domains: 'Unlimited',
      subdomains: 'Unlimited',
      emails: 'Unlimited',
      databases: 'Unlimited',
      free_ssl: true,
      litespeed: false,
      daily_backup: true,
      cpanel: false,
      softaculous: false
    },
    features: [
      'Pure NVMe Storage in RAID 10',
      '1 Dedicated Public IPv4',
      'BDIX 1Gbps Peering Included',
      'KVM Hardware Virtualization',
      'Automated Weekly Backups',
      '24/7 Server Monitoring'
    ]
  },
  {
    id: 'vps_standard',
    name: 'Cloud VPS 2',
    slug: 'vps-standard',
    category: 'vps',
    order: 11,
    status: 'published',
    badge: 'Most Popular',
    popular: true,
    priceOverride: true,
    overridePrice: 3500,
    overrideAnnualPrice: 33600,
    pricing: { licenseCostUsd: 0, monthly: 3500, annually: 33600, billingCycle: 'monthly' },
    cloudLinuxLimits: { cpu: '4 Cores', pmem: '8192', vmem: '8192', io: '80', iops: '8000', ep: '80', nproc: '400', inodes: '2000000' },
    comparisonValues: {
      disk_space: '120 GB NVMe SSD',
      bandwidth: '5 TB BDIX & Global',
      addon_domains: 'Unlimited',
      subdomains: 'Unlimited',
      emails: 'Unlimited',
      databases: 'Unlimited',
      free_ssl: true,
      litespeed: false,
      daily_backup: true,
      cpanel: false,
      softaculous: false
    },
    features: [
      'Pure NVMe Storage in RAID 10',
      '1 Dedicated Public IPv4',
      'BDIX 1Gbps Peering Included',
      'KVM Hardware Virtualization',
      'Automated Daily Snapshots',
      'Free OS Reinstall Anytime',
      '24/7 Priority Ticket Support'
    ]
  },
  {
    id: 'vps_pro',
    name: 'Cloud VPS 3',
    slug: 'vps-pro',
    category: 'vps',
    order: 12,
    status: 'published',
    badge: 'Heavy Production',
    popular: false,
    priceOverride: true,
    overridePrice: 6800,
    overrideAnnualPrice: 65280,
    pricing: { licenseCostUsd: 0, monthly: 6800, annually: 65280, billingCycle: 'monthly' },
    cloudLinuxLimits: { cpu: '8 Cores', pmem: '16384', vmem: '16384', io: '100', iops: '12000', ep: '120', nproc: '800', inodes: '4000000' },
    comparisonValues: {
      disk_space: '240 GB NVMe SSD',
      bandwidth: '10 TB BDIX & Global',
      addon_domains: 'Unlimited',
      subdomains: 'Unlimited',
      emails: 'Unlimited',
      databases: 'Unlimited',
      free_ssl: true,
      litespeed: false,
      daily_backup: true,
      cpanel: false,
      softaculous: false
    },
    features: [
      'Pure NVMe Storage in RAID 10',
      '2 Dedicated Public IPv4 Included',
      'BDIX 10Gbps Peering Included',
      'KVM Hardware Virtualization',
      'Automated Daily Snapshots',
      'DDoS Protection up to 500Gbps',
      'Direct DevOps Phone Support'
    ]
  },
  {
    id: 'vps_ultra',
    name: 'Cloud VPS Pro',
    slug: 'vps-ultra',
    category: 'vps',
    order: 13,
    status: 'published',
    badge: 'Enterprise Dedicated',
    popular: false,
    priceOverride: true,
    overridePrice: 12500,
    overrideAnnualPrice: 120000,
    pricing: { licenseCostUsd: 0, monthly: 12500, annually: 120000, billingCycle: 'monthly' },
    cloudLinuxLimits: { cpu: '16 Cores', pmem: '32768', vmem: '32768', io: '150', iops: '20000', ep: '200', nproc: '1500', inodes: '8000000' },
    comparisonValues: {
      disk_space: '480 GB Enterprise NVMe',
      bandwidth: '15 TB Unmetered',
      addon_domains: 'Unlimited',
      subdomains: 'Unlimited',
      emails: 'Unlimited',
      databases: 'Unlimited',
      free_ssl: true,
      litespeed: false,
      daily_backup: true,
      cpanel: false,
      softaculous: false
    },
    features: [
      'Enterprise NVMe in RAID 10',
      '2 Dedicated Public IPv4 Included',
      'BDIX 10Gbps Peering Included',
      'Zero Resource Contention',
      'Automated Daily Snapshots',
      'Enterprise DDoS Mitigation',
      'Direct WhatsApp DevOps Support'
    ]
  },

  // 4. CloudLinux OS License Tier
  {
    id: 'cloudlinux_solo',
    name: 'CloudLinux OS Solo',
    slug: 'cloudlinux-os-solo',
    category: 'cloudlinux_license',
    order: 11,
    status: 'published',
    badge: 'Single Account',
    popular: false,
    priceOverride: true,
    overridePrice: 1100,
    overrideAnnualPrice: 13200,
    pricing: { licenseCostUsd: 0, monthly: 1100, annually: 13200, billingCycle: 'monthly' },
    cloudLinuxLimits: {
      max_accounts: '1',
      lve_limits: 'No',
      cagefs: 'Yes',
      mysql_governor: 'No',
      php_selector: 'Yes',
      centralized_monitoring: 'No'
    },
    comparisonValues: {
      price: '৳1,100 /mo',
      max_accounts: '1',
      lve_limits: false,
      cagefs: true,
      mysql_governor: false,
      php_selector: true,
      ruby_selector: null,
      python_selector: null,
      nodejs_selector: null,
      hardened_php: null,
      apache_mod_lsapi_pro: null,
      secure_links: null,
      website_monitoring: null,
      slow_site_analyzer: null,
      php_xray: null,
      centralized_monitoring: false,
      accelerate_wp: null,
      support_247: null
    },
    features: [
      '1 Hosting Account Supported',
      'CageFS Virtualized File System',
      'PHP Selector (Multiple PHP Versions)',
      'Stable & Secure Linux Environment',
      'Instant License Activation'
    ]
  },
  {
    id: 'cloudlinux_admin',
    name: 'CloudLinux OS Admin',
    slug: 'cloudlinux-os-admin',
    category: 'cloudlinux_license',
    order: 12,
    status: 'published',
    badge: 'Up to 5 Accounts',
    popular: true,
    priceOverride: true,
    overridePrice: 1800,
    overrideAnnualPrice: 21600,
    pricing: { licenseCostUsd: 0, monthly: 1800, annually: 21600, billingCycle: 'monthly' },
    cloudLinuxLimits: {
      max_accounts: '5',
      lve_limits: 'No',
      cagefs: 'Yes',
      mysql_governor: 'No',
      php_selector: 'Yes',
      centralized_monitoring: 'No'
    },
    comparisonValues: {
      price: '৳1,800 /mo',
      max_accounts: '5',
      lve_limits: false,
      cagefs: true,
      mysql_governor: false,
      php_selector: true,
      ruby_selector: null,
      python_selector: null,
      nodejs_selector: null,
      hardened_php: null,
      apache_mod_lsapi_pro: null,
      secure_links: null,
      website_monitoring: null,
      slow_site_analyzer: null,
      php_xray: null,
      centralized_monitoring: false,
      accelerate_wp: null,
      support_247: null
    },
    features: [
      'Up to 5 Hosting Accounts Supported',
      'CageFS Virtualized File System',
      'PHP Selector (Multiple PHP Versions)',
      'Ideal for Multi-Site Admin Servers',
      'Instant License Activation'
    ]
  },
  {
    id: 'cloudlinux_shared_pro',
    name: 'CloudLinux OS Shared Pro',
    slug: 'cloudlinux-os-shared-pro',
    category: 'cloudlinux_license',
    order: 13,
    status: 'published',
    badge: 'Unlimited Power',
    popular: false,
    priceOverride: true,
    overridePrice: 2700,
    overrideAnnualPrice: 32400,
    pricing: { licenseCostUsd: 0, monthly: 2700, annually: 32400, billingCycle: 'monthly' },
    cloudLinuxLimits: {
      max_accounts: 'Unlimited',
      lve_limits: 'Yes',
      cagefs: 'Yes',
      mysql_governor: 'Yes',
      php_selector: 'Yes',
      centralized_monitoring: 'Yes'
    },
    comparisonValues: {
      price: '৳2,700 /mo',
      max_accounts: 'Unlimited',
      lve_limits: true,
      cagefs: true,
      mysql_governor: true,
      php_selector: true,
      ruby_selector: null,
      python_selector: null,
      nodejs_selector: null,
      hardened_php: null,
      apache_mod_lsapi_pro: null,
      secure_links: null,
      website_monitoring: null,
      slow_site_analyzer: null,
      php_xray: null,
      centralized_monitoring: true,
      accelerate_wp: null,
      support_247: null
    },
    features: [
      'Unlimited Hosting Accounts',
      'Resource Limits (LVE Manager)',
      'CageFS User Isolation',
      'MySQL Governor (DB Protection)',
      'PHP Selector Support',
      'Centralized Monitoring Dashboard',
      'Enterprise Density & Stability'
    ]
  }
];

const HostingPlansTab: React.FC = () => {
  const { isAdmin, hasPermission } = useAuth();
  const { settings } = useSettings();

  const [activeSubTab, setActiveSubTab] = useState<'packages' | 'features' | 'pricing'>('packages');
  const [packageCategoryFilter, setPackageCategoryFilter] = useState<'all' | 'shared' | 'wordpress' | 'vps' | 'cloudlinux_license'>('all');

  // State for Features
  const [features, setFeatures] = useState<any[]>(DEFAULT_HOSTING_FEATURES);
  const [isAddingFeature, setIsAddingFeature] = useState(false);
  const [editingFeature, setEditingFeature] = useState<any>(null);
  const [featureForm, setFeatureForm] = useState({ id: '', name: '', category: 'Standard Features', type: 'text', order: 0 });

  // State for Packages
  const [packages, setPackages] = useState<any[]>(DEFAULT_HOSTING_PACKAGES);
  const [isAddingPackage, setIsAddingPackage] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [packageForm, setPackageForm] = useState({
    name: '',
    slug: '',
    category: 'shared',
    status: 'published',
    badge: '',
    popular: false,
    order: 0,
    pricing: { licenseCostUsd: 0, monthly: 150, annually: 1440, billingCycle: 'monthly' as const },
    cloudLinuxLimits: { cpu: '100', pmem: '1024', vmem: '2048', io: '10', iops: '1024', ep: '20', nproc: '100', inodes: '250000' },
    allowCustomization: false,
    comparisonValues: {} as Record<string, any>,
    priceOverride: true,
    overridePrice: 150,
    overrideAnnualPrice: 1440
  });
  const [packageModalTab, setPackageModalTab] = useState<'basic' | 'cloudlinux' | 'compare'>('basic');

  // State for Pricing
  const [customPricing, setCustomPricing] = useState({
    perGbDisk: 50,
    perWebsite: 40,
    perCoreCpu: 120,
    perGbRam: 80,
    perEmail: 2,
    perDatabase: 5,
    basePrice: 100,
    annualDiscountPercent: 20
  });

  const fetchData = async () => {
    try {
      const featSnap = await getDocs(query(collection(db, 'hosting_features'), orderBy('order', 'asc')));
      if (!featSnap.empty) {
        setFeatures(featSnap.docs.map(d => ({ docId: d.id, ...d.data() })));
      } else {
        setFeatures(DEFAULT_HOSTING_FEATURES);
      }

      const packSnap = await getDocs(query(collection(db, 'hostingPlans'), orderBy('order', 'asc')));
      if (!packSnap.empty) {
        const dbPlans = packSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const mergedMap = new Map();
        DEFAULT_HOSTING_PACKAGES.forEach(pkg => mergedMap.set(pkg.id, pkg));
        dbPlans.forEach(pkg => mergedMap.set(pkg.id, { ...mergedMap.get(pkg.id), ...pkg }));
        const allMerged = Array.from(mergedMap.values()).sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        setPackages(allMerged);

        // Auto-seed missing packages silently
        const missing = DEFAULT_HOSTING_PACKAGES.filter(p => !dbPlans.some(d => d.id === p.id));
        if (missing.length > 0) {
          missing.forEach(async (m) => {
            try {
              await setDoc(doc(db, 'hostingPlans', m.id), m, { merge: true });
            } catch (e) {}
          });
        }
      } else {
        setPackages(DEFAULT_HOSTING_PACKAGES);
        DEFAULT_HOSTING_PACKAGES.forEach(async (pkg) => {
          try {
            await setDoc(doc(db, 'hostingPlans', pkg.id), pkg, { merge: true });
          } catch (e) {}
        });
      }

      const pricingSnap = await getDoc(doc(db, 'settings', 'custom_hosting_pricing'));
      if (pricingSnap.exists()) {
        setCustomPricing(pricingSnap.data() as any);
      } else {
        const legacySnap = await getDoc(doc(db, 'custom_hosting_pricing', 'global_pricing'));
        if (legacySnap.exists()) {
          setCustomPricing(legacySnap.data() as any);
        }
      }
    } catch (error) {
      console.error('Error fetching hosting data:', error);
      toast.error('Failed to load hosting data');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const calculatePlanPrice = (plan: any) => {
    if (!plan) return { monthly: 0, annually: 0, isOverridden: false };
    
    if (plan.priceOverride && plan.overridePrice > 0) {
      return { 
        monthly: plan.overridePrice, 
        annually: plan.overrideAnnualPrice || Math.round(plan.overridePrice * 12 * 0.8), 
        isOverridden: true 
      };
    }

    const licenseCostUsd = plan.pricing?.licenseCostUsd || 0;
    const exchangeRate = settings.apiSettings?.usdToBdtRate || settings.usdToBdtRate || 120;
    const markupPercent = settings.apiSettings?.hostingMarkupPercent || settings.hostingMarkupPercent || 35;
    
    const calculatedMonthly = Math.round(licenseCostUsd * exchangeRate * (1 + markupPercent / 100));
    const calculatedAnnually = Math.round(calculatedMonthly * 12 * 0.8);
    
    return { monthly: calculatedMonthly, annually: calculatedAnnually, isOverridden: false };
  };

  // --- FEATURE HANDLERS ---
  const handleSaveFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFeature) {
        await updateDoc(doc(db, 'hosting_features', editingFeature.docId), featureForm);
        toast.success('Feature updated');
      } else {
        await setDoc(doc(db, 'hosting_features', featureForm.id), featureForm);
        toast.success('Feature added');
      }
      setIsAddingFeature(false);
      setEditingFeature(null);
      setFeatureForm({ id: '', name: '', category: 'Standard Features', type: 'text', order: 0 });
      fetchData();
    } catch (error) {
      toast.error('Failed to save feature');
    }
  };

  const handleDeleteFeature = async (id: string) => {
    if (window.confirm('Delete this feature?')) {
      await deleteDoc(doc(db, 'hosting_features', id));
      toast.success('Deleted');
      fetchData();
    }
  };

  // --- PACKAGE HANDLERS ---
  const handleSeedPackages = async () => {
    try {
      toast.loading('Syncing all 13 hosting packages...', { id: 'seed' });
      for (const feat of DEFAULT_HOSTING_FEATURES) {
        await setDoc(doc(db, 'hosting_features', feat.id), feat, { merge: true });
      }
      for (const pkg of DEFAULT_HOSTING_PACKAGES) {
        await setDoc(doc(db, 'hostingPlans', pkg.id), pkg, { merge: true });
      }
      toast.success('All 13 packages synchronized with live database!', { id: 'seed' });
      fetchData();
    } catch (error) {
      toast.error('Failed to sync packages', { id: 'seed' });
    }
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const packageData = {
        ...packageForm,
        category: packageForm.category || 'shared',
        pricing: {
          ...packageForm.pricing,
          monthly: packageForm.priceOverride ? packageForm.overridePrice : packageForm.pricing.monthly,
          annually: packageForm.priceOverride ? packageForm.overrideAnnualPrice : packageForm.pricing.annually
        }
      };

      if (editingPackage) {
        await updateDoc(doc(db, 'hostingPlans', editingPackage.id), packageData);
        toast.success('Package updated successfully!');
      } else {
        const customId = packageForm.slug ? `plan_${packageForm.slug}` : `plan_${Date.now()}`;
        await setDoc(doc(db, 'hostingPlans', customId), packageData);
        toast.success('Package created successfully!');
      }
      setIsAddingPackage(false);
      setEditingPackage(null);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save package');
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this package?')) {
      await deleteDoc(doc(db, 'hostingPlans', id));
      toast.success('Package deleted');
      fetchData();
    }
  };

  const handleSaveCustomPricing = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'settings', 'custom_hosting_pricing'), customPricing, { merge: true });
      await setDoc(doc(db, 'custom_hosting_pricing', 'global_pricing'), customPricing, { merge: true });
      toast.success('Custom hosting unit rates updated successfully!');
    } catch (error) {
      console.error('Error saving custom pricing:', error);
      toast.error('Failed to update custom rates');
    }
  };

  // Filtered packages
  const filteredPackages = useMemo(() => {
    if (packageCategoryFilter === 'all') return packages;
    return packages.filter(p => (p.category || 'shared') === packageCategoryFilter);
  }, [packages, packageCategoryFilter]);

  const sharedCount = packages.filter(p => (p.category || 'shared') === 'shared').length;
  const wpCount = packages.filter(p => p.category === 'wordpress').length;
  const vpsCount = packages.filter(p => p.category === 'vps').length;
  const licenseCount = packages.filter(p => p.category === 'cloudlinux_license').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Main Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Server className="text-blue-600" />
            Hosting Package Control Hub
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage cPanel Hosting, WordPress Cloud Turbo, Cloud VPS Servers, and Custom Resource rates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSeedPackages}
            className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition-all shadow-sm cursor-pointer"
            title="Seed all 13 canonical packages to database"
          >
            <RefreshCw size={14} /> Sync All 13 Packages
          </button>

          <button
            onClick={() => {
              setEditingPackage(null);
              setPackageForm({
                name: '',
                slug: '',
                category: packageCategoryFilter === 'all' ? 'shared' : packageCategoryFilter,
                status: 'published',
                badge: '',
                popular: false,
                order: packages.length + 1,
                pricing: { licenseCostUsd: 0, monthly: 200, annually: 1920, billingCycle: 'monthly' },
                cloudLinuxLimits: { cpu: '100', pmem: '1024', vmem: '2048', io: '10', iops: '1024', ep: '20', nproc: '100', inodes: '250000' },
                allowCustomization: false,
                comparisonValues: {},
                priceOverride: true,
                overridePrice: 200,
                overrideAnnualPrice: 1920
              });
              setIsAddingPackage(true);
              setPackageModalTab('basic');
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <Plus size={15} /> Add New Package
          </button>
        </div>
      </div>

      {/* Main SubTabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveSubTab('packages')}
          className={cn(
            "pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2",
            activeSubTab === 'packages'
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-900"
          )}
        >
          <Layers size={16} /> Hosting Packages ({packages.length})
        </button>

        <button
          onClick={() => setActiveSubTab('pricing')}
          className={cn(
            "pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2",
            activeSubTab === 'pricing'
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-900"
          )}
        >
          <Calculator size={16} /> Custom Package Rates (৳/GB)
        </button>

        <button
          onClick={() => setActiveSubTab('features')}
          className={cn(
            "pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2",
            activeSubTab === 'features'
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-900"
          )}
        >
          <Settings2 size={16} /> Comparison Features ({features.length})
        </button>
      </div>

      {/* SUBTAB 1: PACKAGES LIST & CATEGORY CONTROLLER */}
      {activeSubTab === 'packages' && (
        <div className="space-y-6">
          {/* Category Filter Bar */}
          <div className="flex items-center justify-between gap-3 flex-wrap bg-gray-50 p-2.5 rounded-2xl border border-gray-200">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setPackageCategoryFilter('all')}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all",
                  packageCategoryFilter === 'all'
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                )}
              >
                All Packages ({packages.length})
              </button>

              <button
                onClick={() => setPackageCategoryFilter('shared')}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                  packageCategoryFilter === 'shared'
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                )}
              >
                <Server size={13} /> Shared cPanel ({sharedCount})
              </button>

              <button
                onClick={() => setPackageCategoryFilter('wordpress')}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                  packageCategoryFilter === 'wordpress'
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                )}
              >
                <Zap size={13} /> WordPress Cloud ({wpCount})
              </button>

              <button
                onClick={() => setPackageCategoryFilter('vps')}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                  packageCategoryFilter === 'vps'
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                )}
              >
                <Cpu size={13} /> Cloud VPS ({vpsCount})
              </button>

              <button
                onClick={() => setPackageCategoryFilter('cloudlinux_license')}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                  packageCategoryFilter === 'cloudlinux_license'
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                )}
              >
                <Shield size={13} /> CloudLinux OS License ({licenseCount})
              </button>
            </div>

            <div className="text-xs text-gray-500 font-medium">
              Showing <strong>{filteredPackages.length}</strong> active plans
            </div>
          </div>

          {/* Packages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPackages.map((p) => {
              const calculated = calculatePlanPrice(p);
              const cat = p.category || 'shared';

              return (
                <div 
                  key={p.id} 
                  className={cn(
                    "bg-white border rounded-2xl p-5 relative group transition-all duration-200 hover:shadow-lg flex flex-col justify-between",
                    p.popular ? "border-blue-500 ring-2 ring-blue-500/10" : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  {/* Actions Top Right */}
                  <div className="absolute top-4 right-4 flex space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button 
                      onClick={() => { 
                        setEditingPackage(p); 
                        setPackageForm({ 
                          name: p.name || '', 
                          slug: p.slug || '', 
                          category: p.category || 'shared',
                          status: p.status || 'published', 
                          badge: p.badge || '',
                          popular: p.popular || false,
                          order: p.order || 0, 
                          pricing: p.pricing || { licenseCostUsd: 0, monthly: 0, annually: 0, billingCycle: 'monthly' }, 
                          cloudLinuxLimits: p.cloudLinuxLimits || { cpu: '100', pmem: '1024', vmem: '2048', io: '10', iops: '1024', ep: '20', nproc: '100', inodes: '250000' }, 
                          allowCustomization: p.allowCustomization || false, 
                          comparisonValues: p.comparisonValues || {}, 
                          priceOverride: p.priceOverride || false, 
                          overridePrice: p.overridePrice || 0,
                          overrideAnnualPrice: p.overrideAnnualPrice || 0
                        }); 
                        setIsAddingPackage(true); 
                        setPackageModalTab('basic'); 
                      }} 
                      className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                      title="Edit Package"
                    >
                      <Edit size={15} />
                    </button>
                    <button 
                      onClick={() => handleDeletePackage(p.id)} 
                      className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                      title="Delete Package"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div>
                    {/* Category & Status Badges */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className={cn(
                        "text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider",
                        cat === 'shared' ? "bg-blue-100 text-blue-800" :
                        cat === 'wordpress' ? "bg-purple-100 text-purple-800" :
                        cat === 'cloudlinux_license' ? "bg-emerald-100 text-emerald-800" : "bg-indigo-100 text-indigo-800"
                      )}>
                        {cat === 'shared' ? 'Shared cPanel' : cat === 'wordpress' ? 'WP Cloud Turbo' : cat === 'cloudlinux_license' ? 'CloudLinux OS License' : 'Cloud VPS'}
                      </span>

                      {p.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          {p.badge}
                        </span>
                      )}

                      {p.popular && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          ⭐ POPULAR
                        </span>
                      )}
                    </div>

                    <h4 className="text-xl font-black text-gray-900 mb-1">{p.name}</h4>
                    
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-3xl font-black text-blue-600">৳{calculated.monthly.toLocaleString()}</span>
                      <span className="text-xs text-gray-500 font-medium">/ month</span>
                    </div>

                    <p className="text-xs text-gray-400 mb-4 font-semibold">
                      ৳{calculated.annually.toLocaleString()} / yr (Prepayment Discount)
                    </p>

                    {/* Specs Preview Box */}
                    <div className="space-y-1.5 text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100 mb-4">
                      {p.comparisonValues?.disk_space && (
                        <p className="flex items-center justify-between">
                          <span className="text-gray-400 font-medium">Storage:</span>
                          <strong className="text-gray-800">{p.comparisonValues.disk_space}</strong>
                        </p>
                      )}
                      {p.comparisonValues?.bandwidth && (
                        <p className="flex items-center justify-between">
                          <span className="text-gray-400 font-medium">Bandwidth:</span>
                          <strong className="text-gray-800">{p.comparisonValues.bandwidth}</strong>
                        </p>
                      )}
                      {p.comparisonValues?.addon_domains && (
                        <p className="flex items-center justify-between">
                          <span className="text-gray-400 font-medium">Websites / Domains:</span>
                          <strong className="text-gray-800">{p.comparisonValues.addon_domains}</strong>
                        </p>
                      )}
                      {p.cloudLinuxLimits && (
                        <p className="flex items-center justify-between pt-1 border-t border-gray-200/60">
                          <span className="text-gray-400 font-medium">Resources:</span>
                          <span className="font-bold text-blue-700">CPU {p.cloudLinuxLimits.cpu}% | RAM {p.cloudLinuxLimits.pmem}MB</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer info */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-[11px] text-gray-400">
                    <span>Order: #{p.order || 0}</span>
                    <span className={cn("font-bold capitalize", p.status === 'published' ? "text-emerald-600" : "text-gray-400")}>
                      ● {p.status || 'published'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 2: CUSTOM PACKAGE RATES FORM */}
      {activeSubTab === 'pricing' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
          <div className="max-w-3xl mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Calculator className="text-indigo-600" />
              Dynamic Custom Package Pricing Engine
            </h3>
            <p className="text-xs text-gray-500">
              Configure the exact unit price in BDT for custom packages designed by users on the slider builder.
            </p>
          </div>

          <form onSubmit={handleSaveCustomPricing} className="space-y-6 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Storage Rate (৳ per GB NVMe)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">৳</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={customPricing.perGbDisk}
                    onChange={(e) => setCustomPricing({ ...customPricing, perGbDisk: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                    placeholder="50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Website / Addon Domain (৳ each)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">৳</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={customPricing.perWebsite}
                    onChange={(e) => setCustomPricing({ ...customPricing, perWebsite: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                    placeholder="40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Price per vCPU Core (৳)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">৳</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={customPricing.perCoreCpu}
                    onChange={(e) => setCustomPricing({ ...customPricing, perCoreCpu: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                    placeholder="120"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Price per GB RAM (৳)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">৳</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={customPricing.perGbRam}
                    onChange={(e) => setCustomPricing({ ...customPricing, perGbRam: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                    placeholder="80"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Base Setup Fee / Minimum (৳)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">৳</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={customPricing.basePrice}
                    onChange={(e) => setCustomPricing({ ...customPricing, basePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                    placeholder="100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Annual Discount Prepayment (%)
                </label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">%</span>
                  <input
                    type="number"
                    min="0"
                    max="80"
                    required
                    value={customPricing.annualDiscountPercent}
                    onChange={(e) => setCustomPricing({ ...customPricing, annualDiscountPercent: parseFloat(e.target.value) || 0 })}
                    className="w-full pr-8 pl-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                    placeholder="20"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer"
              >
                <Save size={16} /> Save Custom Rates
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUBTAB 3: COMPARISON FEATURES */}
      {activeSubTab === 'features' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Compare Table Features</h3>
              <p className="text-xs text-gray-500">Configure the rows shown in the public plan comparison table.</p>
            </div>
            <button 
              onClick={() => { setIsAddingFeature(true); setEditingFeature(null); }} 
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center hover:bg-blue-700 shadow-md cursor-pointer"
            >
              <Plus size={15} className="mr-1.5" /> Add Feature
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-3 text-xs font-bold text-gray-700">Order</th>
                  <th className="p-3 text-xs font-bold text-gray-700">ID</th>
                  <th className="p-3 text-xs font-bold text-gray-700">Name</th>
                  <th className="p-3 text-xs font-bold text-gray-700">Category</th>
                  <th className="p-3 text-xs font-bold text-gray-700">Type</th>
                  <th className="p-3 text-xs font-bold text-gray-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {features.map(f => (
                  <tr key={f.id} className="hover:bg-gray-50/50">
                    <td className="p-3 font-semibold text-gray-400">{f.order}</td>
                    <td className="p-3 font-mono text-gray-600">{f.id}</td>
                    <td className="p-3 font-bold text-gray-900">{f.name}</td>
                    <td className="p-3 text-gray-600">{f.category}</td>
                    <td className="p-3">
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase", f.type === 'boolean' ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700")}>
                        {f.type}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => { setEditingFeature(f); setFeatureForm(f); setIsAddingFeature(true); }} className="text-blue-600 hover:text-blue-800 p-1 mr-2"><Edit size={14} /></button>
                      <button onClick={() => handleDeleteFeature(f.id)} className="text-red-600 hover:text-red-800 p-1"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Feature Modal */}
      {isAddingFeature && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-base">{editingFeature ? 'Edit Feature' : 'Add Feature'}</h3>
              <button onClick={() => setIsAddingFeature(false)}><X size={18} className="text-gray-500 hover:text-red-500" /></button>
            </div>
            <form onSubmit={handleSaveFeature} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Feature ID (e.g. disk_space)</label>
                <input type="text" required disabled={!!editingFeature} value={featureForm.id} onChange={(e) => setFeatureForm({...featureForm, id: e.target.value})} className="w-full px-3 py-2 border rounded-xl text-xs" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Display Name</label>
                <input type="text" required value={featureForm.name} onChange={(e) => setFeatureForm({...featureForm, name: e.target.value})} className="w-full px-3 py-2 border rounded-xl text-xs" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                <select value={featureForm.category} onChange={(e) => setFeatureForm({...featureForm, category: e.target.value})} className="w-full px-3 py-2 border rounded-xl text-xs">
                  <option>Standard Features</option><option>CloudLinux Limits</option><option>Email & DB</option><option>Security</option><option>Server</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Type</label>
                <select value={featureForm.type} onChange={(e) => setFeatureForm({...featureForm, type: e.target.value})} className="w-full px-3 py-2 border rounded-xl text-xs">
                  <option value="text">Text (e.g. 10 GB NVMe)</option><option value="boolean">Boolean (Yes/No Icon)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Order</label>
                <input type="number" required value={featureForm.order} onChange={(e) => setFeatureForm({...featureForm, order: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border rounded-xl text-xs" />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer">Save Feature</button>
            </form>
          </div>
        </div>
      )}

      {/* Package Edit/Add Modal */}
      {isAddingPackage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in">
            <div className="flex justify-between items-center p-5 border-b bg-gray-50/80">
              <div>
                <h3 className="font-black text-lg text-gray-900">{editingPackage ? 'Edit Hosting Package' : 'Create New Hosting Package'}</h3>
                <p className="text-xs text-gray-500">Configure name, pricing, tier, and server specifications.</p>
              </div>
              <button onClick={() => setIsAddingPackage(false)}><X size={20} className="text-gray-500 hover:text-red-500" /></button>
            </div>
            
            <div className="flex border-b bg-white px-6 gap-2">
              <button onClick={() => setPackageModalTab('basic')} className={cn("py-3 text-xs font-bold border-b-2 transition-all", packageModalTab === 'basic' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500")}>Basic Info & Price</button>
              <button onClick={() => setPackageModalTab('cloudlinux')} className={cn("py-3 text-xs font-bold border-b-2 transition-all", packageModalTab === 'cloudlinux' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500")}>Server & Limits</button>
              <button onClick={() => setPackageModalTab('compare')} className={cn("py-3 text-xs font-bold border-b-2 transition-all", packageModalTab === 'compare' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500")}>Compare Specs</button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {packageModalTab === 'basic' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Package Name</label>
                      <input type="text" required value={packageForm.name} onChange={(e) => setPackageForm({...packageForm, name: e.target.value})} className="w-full border p-2.5 rounded-xl text-xs font-bold" placeholder="e.g. WP Pro Turbo" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Slug / Identifier</label>
                      <input type="text" required value={packageForm.slug} onChange={(e) => setPackageForm({...packageForm, slug: e.target.value})} className="w-full border p-2.5 rounded-xl text-xs" placeholder="e.g. wp-pro" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Package Tier / Category</label>
                      <select value={packageForm.category || 'shared'} onChange={(e) => setPackageForm({...packageForm, category: e.target.value})} className="w-full border p-2.5 rounded-xl text-xs font-bold">
                        <option value="shared">Shared cPanel Hosting</option>
                        <option value="wordpress">Managed WordPress Cloud</option>
                        <option value="vps">High-Performance Cloud VPS</option>
                        <option value="cloudlinux_license">CloudLinux OS License</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Status</label>
                      <select value={packageForm.status} onChange={(e) => setPackageForm({...packageForm, status: e.target.value})} className="w-full border p-2.5 rounded-xl text-xs font-bold">
                        <option value="published">Published</option>
                        <option value="draft">Draft (Hidden)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Badge Tag</label>
                      <input type="text" value={packageForm.badge || ''} onChange={(e) => setPackageForm({...packageForm, badge: e.target.value})} className="w-full border p-2.5 rounded-xl text-xs" placeholder="e.g. Most Popular" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Display Sort Order</label>
                      <input type="number" value={packageForm.order} onChange={(e) => setPackageForm({...packageForm, order: parseInt(e.target.value) || 0})} className="w-full border p-2.5 rounded-xl text-xs" />
                    </div>
                  </div>

                  {/* Pricing Box */}
                  <div className="border rounded-2xl p-5 bg-slate-50 border-gray-200">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <DollarSign size={15} className="text-emerald-600" /> Package Pricing Configuration (BDT)
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Monthly Price (৳)</label>
                        <input 
                          type="number" 
                          min="0"
                          required
                          value={packageForm.overridePrice || 0} 
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setPackageForm({
                              ...packageForm, 
                              priceOverride: true, 
                              overridePrice: val,
                              overrideAnnualPrice: Math.round(val * 12 * 0.8)
                            });
                          }} 
                          className="w-full border p-2.5 rounded-xl text-sm font-bold bg-white" 
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Annual Prepayment Price (৳)</label>
                        <input 
                          type="number" 
                          min="0"
                          required
                          value={packageForm.overrideAnnualPrice || Math.round((packageForm.overridePrice || 0) * 12 * 0.8)} 
                          onChange={(e) => setPackageForm({...packageForm, overrideAnnualPrice: parseFloat(e.target.value) || 0})} 
                          className="w-full border p-2.5 rounded-xl text-sm font-bold bg-white" 
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Default is 20% discount on 12 months prepayment</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-200">
                      <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={packageForm.popular || false} 
                          onChange={(e) => setPackageForm({...packageForm, popular: e.target.checked})} 
                          className="rounded text-blue-600"
                        />
                        Mark as "Most Popular" Featured Plan
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {packageModalTab === 'cloudlinux' && (
                <div className="space-y-4">
                  <p className="text-xs text-gray-500">Specify system resource caps for this package.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold mb-1">CPU Limit (e.g. 200% or 4 Cores)</label><input type="text" value={packageForm.cloudLinuxLimits.cpu} onChange={(e) => setPackageForm({...packageForm, cloudLinuxLimits: {...packageForm.cloudLinuxLimits, cpu: e.target.value}})} className="w-full border p-2 rounded-xl text-xs" /></div>
                    <div><label className="block text-xs font-bold mb-1">RAM (MB / GB)</label><input type="text" value={packageForm.cloudLinuxLimits.pmem} onChange={(e) => setPackageForm({...packageForm, cloudLinuxLimits: {...packageForm.cloudLinuxLimits, pmem: e.target.value}})} className="w-full border p-2 rounded-xl text-xs" /></div>
                    <div><label className="block text-xs font-bold mb-1">IO Usage (MB/s)</label><input type="text" value={packageForm.cloudLinuxLimits.io} onChange={(e) => setPackageForm({...packageForm, cloudLinuxLimits: {...packageForm.cloudLinuxLimits, io: e.target.value}})} className="w-full border p-2 rounded-xl text-xs" /></div>
                    <div><label className="block text-xs font-bold mb-1">Entry Processes (EP)</label><input type="text" value={packageForm.cloudLinuxLimits.ep} onChange={(e) => setPackageForm({...packageForm, cloudLinuxLimits: {...packageForm.cloudLinuxLimits, ep: e.target.value}})} className="w-full border p-2 rounded-xl text-xs" /></div>
                  </div>
                </div>
              )}

              {packageModalTab === 'compare' && (
                <div className="space-y-4">
                  <p className="text-xs text-gray-500 mb-4">Set the features and specifications that appear in public tables and cards.</p>
                  {features.map(f => (
                    <div key={f.id} className="grid grid-cols-3 items-center border-b border-gray-100 pb-3 text-xs">
                      <div className="col-span-1">
                        <p className="font-bold text-gray-900">{f.name}</p>
                        <p className="text-[10px] text-gray-400">{f.category}</p>
                      </div>
                      <div className="col-span-2">
                        {f.type === 'boolean' ? (
                          <select 
                            value={packageForm.comparisonValues[f.id] === undefined ? 'true' : String(packageForm.comparisonValues[f.id])} 
                            onChange={(e) => setPackageForm({...packageForm, comparisonValues: {...packageForm.comparisonValues, [f.id]: e.target.value === 'true'}})}
                            className="w-full border p-2 rounded-xl text-xs font-medium"
                          >
                            <option value="true">Included (✅)</option>
                            <option value="false">Not Included (❌)</option>
                          </select>
                        ) : (
                          <input 
                            type="text" 
                            value={packageForm.comparisonValues[f.id] || ''} 
                            onChange={(e) => setPackageForm({...packageForm, comparisonValues: {...packageForm.comparisonValues, [f.id]: e.target.value}})}
                            placeholder="e.g. 10 GB Pure NVMe SSD, Unlimited, etc."
                            className="w-full border p-2 rounded-xl text-xs font-medium" 
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setIsAddingPackage(false)}
                className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-gray-100 text-gray-700"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleSavePackage} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                Save Package
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HostingPlansTab;
