const fs = require('fs');
const path = require('path');

const tabsDir = path.join(__dirname, '../src/pages/admin/tabs');

const replacements = [
  {
    file: 'finance/AllReports.tsx',
    find: `import { FileText, ShoppingBag, Receipt, Database, CheckCircle, Clock } from 'lucide-react';`,
    replace: `import { FileText, ShoppingBag, Receipt, Database, CheckCircle, Clock, Plus } from 'lucide-react';`
  },
  {
    file: 'finance/CustomerReceiveReport.tsx',
    find: `getCustomerReceiveReportData: () => any[]; }`,
    replace: `getCustomerReceiveReportData: () => any[]; exportCrToCSV?: () => void; }`
  },
  {
    file: 'finance/Customers.tsx',
    find: `import { Users, Plus, Edit, Trash2, ArrowRight } from 'lucide-react';`,
    replace: `import { Users, Plus, Edit, Trash2, ArrowRight, ShoppingBag, Mail, Phone, MessageCircle, FileText, Edit2 } from 'lucide-react';`
  },
  {
    file: 'finance/ManualExpense.tsx',
    find: `import { ArrowLeftRight, Plus, X } from 'lucide-react';`,
    replace: `import { ArrowLeftRight, Plus, X, Upload, List } from 'lucide-react';`
  },
  {
    file: 'finance/ManualIncome.tsx',
    find: `import { ArrowLeftRight, Plus, X } from 'lucide-react';`,
    replace: `import { ArrowLeftRight, Plus, X, Download, List } from 'lucide-react';`
  },
  {
    file: 'finance/PaymentAccounts.tsx',
    find: `import { Wallet, Plus, ArrowUpRight, ArrowDownRight, Edit, Trash2 } from 'lucide-react';`,
    replace: `import { Wallet, Plus, ArrowUpRight, ArrowDownRight, Edit, Trash2, CreditCard, CheckCircle, ArrowLeft } from 'lucide-react';`
  },
  {
    file: 'finance/SalesReport.tsx',
    find: `getSalesReportData: () => any[]; }`,
    replace: `getSalesReportData: () => any[]; exportToCSV?: () => void; }`
  },
  {
    file: 'finance/SalesReport.tsx',
    find: `import { FileText, Search, Download, ArrowUp, ArrowDown } from 'lucide-react';`,
    replace: `import { FileText, Search, Download, ArrowUp, ArrowDown, ShoppingBag } from 'lucide-react';`
  },
  {
    file: 'finance/Transactions.tsx',
    find: `import { ArrowLeftRight, Search } from 'lucide-react';`,
    replace: `import { ArrowLeftRight, Search, CreditCard } from 'lucide-react';`
  },
  {
    file: 'finance/Vendors.tsx',
    find: `import { Briefcase, Plus, Edit, Trash2, ArrowRight, Package } from 'lucide-react';`,
    replace: `import { Briefcase, Plus, Edit, Trash2, ArrowRight, Package, FileText, Edit2 } from 'lucide-react';`
  },
  {
    file: 'hosting/HostingPlans.tsx',
    find: `const { isAdmin, hasPermission } = useAuth();`,
    replace: `const { isAdmin, hasPermission } = useAuth();\n  const { settings } = useSettings();`
  },
  {
    file: 'hosting/HostingServices.tsx',
    find: `import { Database, Edit, Trash2, Plus, X } from 'lucide-react';`,
    replace: `import { Database, Edit, Trash2, Plus, X, Server } from 'lucide-react';`
  },
  {
    file: 'inventory/Inventory.tsx',
    find: `import BulkEditForm from '../../../../components/BulkEditForm';`,
    replace: `import { BulkEditForm } from '../../../../components/BulkEditForm';`
  },
  {
    file: 'inventory/Inventory.tsx',
    find: `import { Package, Plus, Upload, Download, Search, Edit, Trash2, X, AlertTriangle, Play, Loader2, Image as ImageIcon } from 'lucide-react';`,
    replace: `import { Package, Plus, Upload, Download, Search, Edit, Trash2, X, AlertTriangle, Play, Loader2, Image as ImageIcon, FileText, XCircle, Edit2, ArrowRight } from 'lucide-react';`
  },
  {
    file: 'inventory/Inventory.tsx',
    find: `removeSpec: (i: number) => void; setActiveTab: (v: string) => void; fetchData: () => Promise<void>; }`,
    replace: `removeSpec: (i: number) => void; setActiveTab: (v: string) => void; fetchData: () => Promise<void>; fileInputRef?: any; setIsAddingMenu?: (v: boolean) => void; }`
  },
  {
    file: 'marketing/Campaigns.tsx',
    find: `import { Mail, Edit, Trash2, Send, Plus, X } from 'lucide-react';`,
    replace: `import { Mail, Edit, Trash2, Send, Plus, X, Edit2 } from 'lucide-react';`
  },
  {
    file: 'marketing/DiscountCodes.tsx',
    find: `import { Tag, Edit, Trash2, Plus, X } from 'lucide-react';`,
    replace: `import { Tag, Edit, Trash2, Plus, X, Ticket, Edit2 } from 'lucide-react';`
  },
  {
    file: 'menus/Menus.tsx',
    find: `import BulkEditForm from '../../../../components/BulkEditForm';`,
    replace: `// import BulkEditForm from '../../../../components/BulkEditForm';`
  },
  {
    file: 'menus/Menus.tsx',
    find: `import { List, Plus, Edit, Trash2, Tag, Layers, Settings, ChevronRight } from 'lucide-react';`,
    replace: `import { List, Plus, Edit, Trash2, Tag, Layers, Settings, ChevronRight, Menu as MenuIcon, Cpu, Edit2 } from 'lucide-react';`
  },
  {
    file: 'sales/Orders.tsx',
    find: `import { Receipt, Search, Download, Filter, Eye, Printer, ShieldAlert } from 'lucide-react';`,
    replace: `import { Receipt, Search, Download, Filter, Eye, Printer, ShieldAlert, FileText, ArrowLeftRight, Trash2 } from 'lucide-react';`
  },
  {
    file: 'sales/Orders.tsx',
    find: `import { useSettings } from '../../../../context/SettingsContext';`,
    replace: `import { useSettings } from '../../../../context/SettingsContext';\nimport { OrderStatus } from '../../../../types';`
  },
  {
    file: 'sales/Orders.tsx',
    find: `handleBulkDeleteOrders: () => void; setSelectedLedgerEntity: (v: any) => void; setActiveTab: (v: string) => void; fetchData: () => Promise<void>; }`,
    replace: `handleBulkDeleteOrders: () => void; setSelectedLedgerEntity: (v: any) => void; setActiveTab: (v: string) => void; fetchData: () => Promise<void>; updateOrderDiscount?: (id: string, v: number) => void; updateOrderStatus?: (id: string, s: OrderStatus) => void; generatePDF?: (order: any, type: string) => void; }`
  },
  {
    file: 'sales/PurchaseReturn.tsx',
    find: `import { RotateCcw, Plus, Download, Printer } from 'lucide-react';`,
    replace: `import { RotateCcw, Plus, Download, Printer, CheckSquare, ArrowLeft } from 'lucide-react';`
  },
  {
    file: 'sales/Purchases.tsx',
    find: `handleCreatePurchase: (e: any) => void; setSelectedLedgerEntity: (v: any) => void; setActiveTab: (v: string) => void; }`,
    replace: `handleCreatePurchase: (e: any) => void; setSelectedLedgerEntity: (v: any) => void; setActiveTab: (v: string) => void; addItemToPurchase?: () => void; updatePurchaseItem?: (i: number, f: string, v: any) => void; removeItemFromPurchase?: (i: number) => void; }`
  },
  {
    file: 'sales/Purchases.tsx',
    find: `import { ShoppingBag, Plus, Search, Calendar, Edit, Trash2, X } from 'lucide-react';`,
    replace: `import { ShoppingBag, Plus, Search, Calendar, Edit, Trash2, X, Ticket } from 'lucide-react';`
  },
  {
    file: 'sales/SaleReturn.tsx',
    find: `import { RotateCcw, Plus, Download, Printer } from 'lucide-react';`,
    replace: `import { RotateCcw, Plus, Download, Printer, CheckSquare } from 'lucide-react';`
  },
  {
    file: 'services/Services.tsx',
    find: `import BulkEditForm from '../../../../components/BulkEditForm';`,
    replace: `// import BulkEditForm from '../../../../components/BulkEditForm';`
  },
  {
    file: 'services/Services.tsx',
    find: `import { ShieldCheck, Search, Filter, Wrench, Printer, RefreshCw, X, Plus } from 'lucide-react';`,
    replace: `import { ShieldCheck, Search, Filter, Wrench, Printer, RefreshCw, X, Plus, Settings, FileText, Download, Edit2 } from 'lucide-react';`
  }
];

replacements.forEach(rep => {
  const filePath = path.join(tabsDir, rep.file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(rep.find)) {
      content = content.replace(rep.find, rep.replace);
      fs.writeFileSync(filePath, content);
      console.log('Updated ' + rep.file);
    } else {
      console.log('Could not find match in ' + rep.file);
    }
  } else {
    console.log('File not found: ' + filePath);
  }
});
