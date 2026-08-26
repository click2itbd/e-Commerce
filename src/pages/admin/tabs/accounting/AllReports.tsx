import React, { useState } from "react";
import {
  FileText,
  ShoppingBag,
  TrendingUp,
  Users,
  Package,
  Truck,
  DollarSign,
  BarChart2,
  ArrowRight,
  Search,
  AlertCircle,
  RotateCcw,
  CreditCard,
  Wallet,
  Briefcase,
  ChevronRight,
} from "lucide-react";
import { cn } from "../../../../lib/utils";

interface AllReportsProps {
  setActiveTab: (tab: string) => void;
}

interface ReportItem {
  name: string;
  description: string;
  icon: React.ReactNode;
  tab: string;
  badge?: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface ReportCategory {
  title: string;
  icon: React.ReactNode;
  reports: ReportItem[];
}

const AllReports: React.FC<AllReportsProps> = ({ setActiveTab }) => {
  const [search, setSearch] = useState("");

  const categories: ReportCategory[] = [
    {
      title: "Sales & Invoices",
      icon: <ShoppingBag size={16} className="text-blue-600" />,
      reports: [
        {
          name: "Sales Report",
          description:
            "All sales invoices, challans & quotations with filter by date, customer and status.",
          icon: <ShoppingBag size={20} />,
          tab: "reports",
          badge: "Live",
          color: "text-blue-700",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
        },
        {
          name: "Customer Receive Report",
          description:
            "Receivables collected from customers — paid, partial and outstanding.",
          icon: <Users size={20} />,
          tab: "customer_receive_report",
          badge: "Live",
          color: "text-green-700",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
        },
        {
          name: "Due Sale Report",
          description:
            "All sales invoices with outstanding/unpaid customer balances.",
          icon: <AlertCircle size={20} />,
          tab: "reports",
          color: "text-red-700",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
        },
        {
          name: "Sale Return Report",
          description:
            "Product returns from customers — restocked inventory and refunds.",
          icon: <RotateCcw size={20} />,
          tab: "sale_return",
          badge: "Live",
          color: "text-orange-700",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
        },
      ],
    },
    {
      title: "Purchase & Suppliers",
      icon: <Truck size={16} className="text-purple-600" />,
      reports: [
        {
          name: "Purchase Report",
          description:
            "All product purchases from suppliers with cost, quantity and payment status.",
          icon: <Truck size={20} />,
          tab: "purchases",
          badge: "Live",
          color: "text-purple-700",
          bgColor: "bg-purple-50",
          borderColor: "border-purple-200",
        },
        {
          name: "Purchase Return Report",
          description:
            "Products returned to suppliers — stock deducted and refund logged.",
          icon: <RotateCcw size={20} />,
          tab: "purchase_return",
          badge: "Live",
          color: "text-pink-700",
          bgColor: "bg-pink-50",
          borderColor: "border-pink-200",
        },
        {
          name: "Supplier Ledger Report",
          description:
            "Complete transaction ledger for each supplier — payables & payment history.",
          icon: <FileText size={20} />,
          tab: "ledger",
          badge: "Live",
          color: "text-indigo-700",
          bgColor: "bg-indigo-50",
          borderColor: "border-indigo-200",
        },
        {
          name: "Supplier Balance Report",
          description: "Outstanding balance owed to each supplier at a glance.",
          icon: <Briefcase size={20} />,
          tab: "ledger",
          color: "text-violet-700",
          bgColor: "bg-violet-50",
          borderColor: "border-violet-200",
        },
      ],
    },
    {
      title: "Inventory & Stock",
      icon: <Package size={16} className="text-amber-600" />,
      reports: [
        {
          name: "Stock Report",
          description:
            "Current stock levels for all products with restock thresholds.",
          icon: <Package size={20} />,
          tab: "inventory",
          badge: "Live",
          color: "text-amber-700",
          bgColor: "bg-amber-50",
          borderColor: "border-amber-200",
        },
        {
          name: "Low Stock Report",
          description:
            "Products running below minimum stock levels — requires restocking.",
          icon: <AlertCircle size={20} />,
          tab: "inventory",
          badge: "Alert",
          color: "text-red-700",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
        },
        {
          name: "Stock Accounting Report",
          description:
            "Live inventory valuation, COGS, gross profit and margin per product.",
          icon: <BarChart2 size={20} />,
          tab: "stock_accounting",
          badge: "Live",
          color: "text-teal-700",
          bgColor: "bg-teal-50",
          borderColor: "border-teal-200",
        },
        {
          name: "Product Profit Report",
          description:
            "Profitability analysis — cost vs selling price and gross margins.",
          icon: <TrendingUp size={20} />,
          tab: "stock_accounting",
          color: "text-emerald-700",
          bgColor: "bg-emerald-50",
          borderColor: "border-emerald-200",
        },
      ],
    },
    {
      title: "Customers & Ledger",
      icon: <Users size={16} className="text-cyan-600" />,
      reports: [
        {
          name: "Customer Ledger Report",
          description:
            "Full transaction ledger for each customer — sales, payments and dues.",
          icon: <FileText size={20} />,
          tab: "ledger",
          badge: "Live",
          color: "text-cyan-700",
          bgColor: "bg-cyan-50",
          borderColor: "border-cyan-200",
        },
        {
          name: "Customer Balance Report",
          description:
            "Outstanding customer receivables at a glance — who owes how much.",
          icon: <Users size={20} />,
          tab: "customers",
          color: "text-sky-700",
          bgColor: "bg-sky-50",
          borderColor: "border-sky-200",
        },
      ],
    },
    {
      title: "Accounting & Finance",
      icon: <DollarSign size={16} className="text-green-600" />,
      reports: [
        {
          name: "Income Report",
          description:
            "All recorded income entries — filtered by category, date and account.",
          icon: <TrendingUp size={20} />,
          tab: "manual_income",
          badge: "Live",
          color: "text-green-700",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
        },
        {
          name: "Expense Report",
          description:
            "All recorded expense entries — filtered by category, date and payment account.",
          icon: <DollarSign size={20} />,
          tab: "manual_expense",
          badge: "Live",
          color: "text-red-700",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
        },
        {
          name: "Cash Flow Report",
          description:
            "Inflow vs outflow of cash and bank accounts for the selected period.",
          icon: <Wallet size={20} />,
          tab: "account_statement",
          badge: "Live",
          color: "text-blue-700",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
        },
        {
          name: "Transaction History",
          description:
            "Unified journal of all transactions — sales, purchases, expenses, income.",
          icon: <BarChart2 size={20} />,
          tab: "transaction_history",
          badge: "Live",
          color: "text-violet-700",
          bgColor: "bg-violet-50",
          borderColor: "border-violet-200",
        },
        {
          name: "Balance Sheet",
          description:
            "Assets, liabilities and owner equity snapshot for the business.",
          icon: <FileText size={20} />,
          tab: "balance_sheet",
          badge: "Live",
          color: "text-indigo-700",
          bgColor: "bg-indigo-50",
          borderColor: "border-indigo-200",
        },
        {
          name: "Account Statement",
          description:
            "Running balance statement for a specific bank/cash/wallet account.",
          icon: <CreditCard size={20} />,
          tab: "account_statement",
          badge: "Live",
          color: "text-teal-700",
          bgColor: "bg-teal-50",
          borderColor: "border-teal-200",
        },
      ],
    },
    {
      title: "HR & Payroll",
      icon: <Briefcase size={16} className="text-gray-600" />,
      reports: [
        {
          name: "Salary Report",
          description: "Monthly salary disbursement records for all employees.",
          icon: <DollarSign size={20} />,
          tab: "salary",
          badge: "Live",
          color: "text-gray-700",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
        },
        {
          name: "Conveyance Report",
          description:
            "Employee travel/conveyance allowance entries and summary.",
          icon: <Truck size={20} />,
          tab: "conveyance",
          badge: "Live",
          color: "text-orange-700",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
        },
        {
          name: "Leave Report",
          description: "Employee leave applications and approval status.",
          icon: <Briefcase size={20} />,
          tab: "leave",
          badge: "Live",
          color: "text-rose-700",
          bgColor: "bg-rose-50",
          borderColor: "border-rose-200",
        },
      ],
    },
    {
      title: "Deposits & Transfers",
      icon: <CreditCard size={16} className="text-blue-600" />,
      reports: [
        {
          name: "Deposits & Withdrawals",
          description:
            "Bank deposits, withdrawals and inter-account fund transfers.",
          icon: <CreditCard size={20} />,
          tab: "deposits_withdrawals",
          badge: "Live",
          color: "text-blue-700",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
        },
        {
          name: "Payment Accounts",
          description:
            "Manage cash, bank and mobile banking accounts and their balances.",
          icon: <Wallet size={20} />,
          tab: "payment_accounts",
          badge: "Live",
          color: "text-purple-700",
          bgColor: "bg-purple-50",
          borderColor: "border-purple-200",
        },
      ],
    },
  ];

  // Filter by search
  const searchLower = search.toLowerCase().trim();
  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      reports: cat.reports.filter(
        (r) =>
          !searchLower ||
          r.name.toLowerCase().includes(searchLower) ||
          r.description.toLowerCase().includes(searchLower) ||
          cat.title.toLowerCase().includes(searchLower),
      ),
    }))
    .filter((cat) => cat.reports.length > 0);

  const totalReports = categories.reduce((sum, c) => sum + c.reports.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText className="text-[#EF4444]" /> All Reports
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {totalReports} reports available across {categories.length}{" "}
              categories — click any report to open it.
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search reports by name or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-100 transition-all"
            />
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={15}
            />
          </div>
        </div>
      </div>

      {/* No results */}
      {filteredCategories.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-16 text-center text-gray-400">
          <FileText size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-bold text-sm">
            No reports found matching "{search}"
          </p>
          <p className="text-xs mt-1">Try a different search keyword.</p>
        </div>
      )}

      {/* Report Categories */}
      {filteredCategories.map((category, catIdx) => (
        <div
          key={catIdx}
          className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
        >
          {/* Category Header */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60 flex items-center gap-2">
            {category.icon}
            <h3 className="font-bold text-sm text-gray-800 uppercase tracking-wide">
              {category.title}
            </h3>
            <span className="ml-auto text-[10px] text-gray-400 font-medium">
              {category.reports.length} Reports
            </span>
          </div>

          {/* Report Grid */}
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {category.reports.map((report, rIdx) => (
              <button
                key={rIdx}
                onClick={() => setActiveTab(report.tab)}
                className={cn(
                  "group text-left w-full border rounded-xl p-4 transition-all duration-150",
                  "hover:shadow-md hover:-translate-y-0.5",
                  report.borderColor,
                  report.bgColor,
                  "hover:border-[#EF4444]",
                )}
              >
                {/* Icon + Badge row */}
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={cn(
                      "p-2 rounded-lg bg-white border shadow-xs",
                      report.borderColor,
                      report.color,
                    )}
                  >
                    {report.icon}
                  </div>
                  <div className="flex items-center gap-1">
                    {report.badge && (
                      <span
                        className={cn(
                          "text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide",
                          report.badge === "Live"
                            ? "bg-green-100 text-green-700"
                            : report.badge === "Alert"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-500",
                        )}
                      >
                        {report.badge}
                      </span>
                    )}
                    <ChevronRight
                      size={14}
                      className="text-gray-300 group-hover:text-[#EF4444] transition-colors"
                    />
                  </div>
                </div>

                {/* Name */}
                <p
                  className={cn(
                    "font-bold text-xs leading-snug mb-1",
                    report.color,
                  )}
                >
                  {report.name}
                </p>

                {/* Description */}
                <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-2">
                  {report.description}
                </p>

                {/* Open link */}
                <div
                  className={cn(
                    "mt-3 flex items-center gap-1 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity",
                    report.color,
                  )}
                >
                  Open Report <ArrowRight size={10} />
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AllReports;
