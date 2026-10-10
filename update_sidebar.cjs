const fs = require('fs');

const platformUtilPath = 'src/lib/platform.ts';
if (!fs.existsSync(platformUtilPath)) {
  fs.writeFileSync(platformUtilPath, `export const getPlatform = () => {
  if (typeof window === 'undefined') return 'ecommerce';
  const host = window.location.hostname;
  if (host.includes('click2itbd.com') || host.includes('localhost') || host.includes('127.0.0.1')) return 'ecommerce';
  if (host.includes('click2it.bd')) return 'hosting';
  return 'ecommerce';
};
`);
}

let code = fs.readFileSync('src/pages/admin/AdminSidebar.tsx', 'utf8');

// Ensure import exists
if (!code.includes('getPlatform')) {
  code = code.replace("import { cn } from '../../lib/utils';", "import { cn } from '../../lib/utils';\nimport { getPlatform } from '../../lib/platform';");
}

// Ensure platform variable exists
if (!code.includes('const platform = getPlatform()')) {
  code = code.replace("export const AdminSidebar: React.FC<AdminSidebarProps> = ({", "export const AdminSidebar: React.FC<AdminSidebarProps> = ({\n  activeTab,\n  setActiveTab,\n  isAdmin,\n  isManager,\n  isStaff,\n  hasPermission,\n  navigate,\n}) => {\n  const platform = getPlatform();\n\n  return ( // replaced below");
  code = code.replace(/export const AdminSidebar[\s\S]*?return \(/, "export const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, setActiveTab, isAdmin, isManager, isStaff, hasPermission, navigate }) => {\n  const platform = getPlatform();\n  return (");
}

// Replace Sections based on platform
// Section 1: Overview, Analytics, Inventory, Categories, POS
code = code.replace(/{[\s\S]*?Section 1[\s\S]*?<div className="px-4 mb-2">/, `{/* Section 1 */}
        <div className="px-4 mb-2">
          {platform === 'ecommerce' && (
            <>`);
code = code.replace(/<ShoppingCart size={18} className="text-gray-400" \/> CLICK POS\s*<\/button>\s*<\/div>/, `<ShoppingCart size={18} className="text-gray-400" /> CLICK POS\n          </button>\n          </>\n          )}\n        </div>`);

// Section 2: Sale & Customer
// Orders & Docs -> Both, Quotation -> Ecommerce, Customers -> Both, Customer Due List -> Both
// Sale, Sale Return -> Ecommerce
code = code.replace(/{[\s\S]*?Section 2: Sale & Customer[\s\S]*?<div className="px-4 mb-2">/, `{/* Section 2 */}
        <div className="px-4 mb-2">`);
code = code.replace(/<div className="text-\[10px\] uppercase font-bold text-gray-400 mb-1 px-3">Sale & Customer<\/div>/, `<div className="text-[10px] uppercase font-bold text-gray-400 mb-1 px-3">Sale & Customer</div>\n          {platform === 'ecommerce' && (\n            <>`);
code = code.replace(/<ArrowLeftRight size={16} className={activeTab === 'sale_return' \? "text-blue-600" : "text-gray-400"} \/> Sale Return\s*<\/button>\s*\)}/, `<ArrowLeftRight size={16} className={activeTab === 'sale_return' ? "text-blue-600" : "text-gray-400"} /> Sale Return\n            </button>\n          )}\n          </>\n          )}`);

// Section 3: Purchase & Supplier -> Ecommerce
code = code.replace(/{[\s\S]*?Section 3: Purchase & Supplier[\s\S]*?<div className="px-4 mb-2">/, `{/* Section 3 */}\n        {platform === 'ecommerce' && (\n        <div className="px-4 mb-2">`);
code = code.replace(/<Briefcase size={16} className={activeTab === 'vendor_due_list' \? "text-blue-600" : "text-gray-400"} \/> Vendor Due List\s*<\/button>\s*<\/div>/, `<Briefcase size={16} className={activeTab === 'vendor_due_list' ? "text-blue-600" : "text-gray-400"} /> Vendor Due List\n          </button>\n        </div>\n        )}`);

// Accounts -> Both (Data will be filtered later)

// Hosting & Services -> Hosting Only
code = code.replace(/{[\s\S]*?Section 5: Hosting & Services[\s\S]*?<div className="px-4 mb-2">/, `{/* Section 5 */}\n        {platform === 'hosting' && (\n        <div className="px-4 mb-2">`);
code = code.replace(/<Server size={16} className={activeTab === 'domainPricing' \? "text-blue-600" : "text-gray-400"} \/> Domain Pricing\s*<\/button>\s*\)}\s*<\/div>/, `<Server size={16} className={activeTab === 'domainPricing' ? "text-blue-600" : "text-gray-400"} /> Domain Pricing\n                </button>\n              )}\n        </div>\n        )}`);

// Products -> Ecommerce
code = code.replace(/{[\s\S]*?Section 7: Products[\s\S]*?<div className="px-4 mb-2">/, `{/* Section 7 */}\n        {platform === 'ecommerce' && (\n        <div className="px-4 mb-2">`);
code = code.replace(/<Tag size={16} className={activeTab === 'brands' \? "text-blue-600" : "text-gray-400"} \/> Brands\s*<\/button>\s*<\/div>/, `<Tag size={16} className={activeTab === 'brands' ? "text-blue-600" : "text-gray-400"} /> Brands\n          </button>\n        </div>\n        )}`);

fs.writeFileSync('src/pages/admin/AdminSidebar.tsx', code);
