import React, { useState, useMemo } from 'react';
import { 
  X, 
  CreditCard, 
  ExternalLink, 
  Info, 
  CheckCircle2, 
  ChevronDown,
  Search,
  Building2
} from 'lucide-react';
import { 
  BANK_EMI_PLANS, 
  MINIMUM_EMI_PURCHASE,
  getBankEMIOptions,
  EMITenureKey
} from '../../data/emiPlans';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';

interface EMIModalProps {
  isOpen: boolean;
  onClose: () => void;
  productPrice: number;
  productName?: string;
}

// Clean Bangladeshi currency formatter
const formatTk = (amount: number) => {
  return '৳ ' + Math.round(amount).toLocaleString('en-IN');
};

export const EMIModal: React.FC<EMIModalProps> = ({
  isOpen,
  onClose,
  productPrice,
  productName = 'Product'
}) => {
  const [selectedBankId, setSelectedBankId] = useState<string>(BANK_EMI_PLANS[0].id);
  const [activeTab, setActiveTab] = useState<'calculator' | 'all_banks'>('calculator');
  const [selectedTenureKey, setSelectedTenureKey] = useState<EMITenureKey>('12M');
  const [chartSearchQuery, setChartSearchQuery] = useState('');
  
  const isProductEligible = (productPrice || 0) >= MINIMUM_EMI_PURCHASE;
  const [customPrice, setCustomPrice] = useState<number>(
    isProductEligible ? productPrice : 15000
  );

  React.useEffect(() => {
    if ((productPrice || 0) >= MINIMUM_EMI_PURCHASE) {
      setCustomPrice(productPrice);
    }
  }, [productPrice]);

  const selectedBank = useMemo(() => {
    return BANK_EMI_PLANS.find(b => b.id === selectedBankId) || BANK_EMI_PLANS[0];
  }, [selectedBankId]);

  const emiOptions = useMemo(() => {
    return getBankEMIOptions(customPrice, selectedBank.id);
  }, [customPrice, selectedBank.id]);

  const activeOption = useMemo(() => {
    const found = emiOptions.find(o => o.tenureKey === selectedTenureKey);
    return found || emiOptions[0] || null;
  }, [emiOptions, selectedTenureKey]);

  const filteredBanksForChart = useMemo(() => {
    if (!chartSearchQuery.trim()) return BANK_EMI_PLANS;
    const q = chartSearchQuery.toLowerCase();
    return BANK_EMI_PLANS.filter(b => 
      b.name.toLowerCase().includes(q) || b.shortName.toLowerCase().includes(q)
    );
  }, [chartSearchQuery]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden border border-gray-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Unified Clean Header */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#081621] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white/10 text-[#F97316] flex items-center justify-center shrink-0">
              <CreditCard size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white truncate">
                  Credit Card EMI Plans
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-gray-300 shrink-0">
                  16 Banks
                </span>
              </div>
              <p className="text-[11px] text-gray-400 truncate mt-0.5">
                {productName} • <span className="text-gray-200 font-semibold">{formatTk(productPrice)}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* View Switcher Tabs & Policy Link Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-2 shrink-0">
          <div className="flex bg-gray-200/70 p-0.5 rounded-lg text-xs font-bold text-gray-600">
            <button
              type="button"
              onClick={() => setActiveTab('calculator')}
              className={cn(
                "px-3 py-1.5 rounded-md transition-all cursor-pointer",
                activeTab === 'calculator'
                  ? "bg-white text-gray-900 shadow-xs"
                  : "hover:text-gray-900 text-gray-600"
              )}
            >
              EMI Calculator
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('all_banks')}
              className={cn(
                "px-3 py-1.5 rounded-md transition-all cursor-pointer",
                activeTab === 'all_banks'
                  ? "bg-white text-gray-900 shadow-xs"
                  : "hover:text-gray-900 text-gray-600"
              )}
            >
              16 Banks Rate Chart
            </button>
          </div>

          <Link
            to="/emi-terms"
            target="_blank"
            className="text-[11px] font-bold text-[#3749bb] hover:underline flex items-center gap-1 shrink-0"
          >
            <span>Policy &amp; Terms</span>
            <ExternalLink size={11} />
          </Link>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {activeTab === 'calculator' ? (
            <>
              {/* Threshold warning if product is below 5,000 */}
              {!isProductEligible && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start gap-2">
                  <Info size={16} className="text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong>Notice:</strong> Credit Card EMI requires a minimum purchase of <strong>৳ 5,000</strong>. This product is <strong>{formatTk(productPrice)}</strong>. You can combine items to reach ৳5,000+ or adjust the amount below to calculate plans:
                  </div>
                </div>
              )}

              {/* Bank & Amount Selectors - Clean & Responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-3 sm:p-3.5 rounded-xl border border-gray-200">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Select Your Bank
                  </label>
                  <div className="relative">
                    <select
                      value={selectedBankId}
                      onChange={e => setSelectedBankId(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] appearance-none pr-8 cursor-pointer"
                    >
                      {BANK_EMI_PLANS.map(bank => (
                        <option key={bank.id} value={bank.id}>
                          {bank.shortName} ({bank.name})
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Order / Purchase Amount (৳)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">৳</span>
                    <input
                      type="number"
                      min={MINIMUM_EMI_PURCHASE}
                      value={customPrice}
                      onChange={e => setCustomPrice(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-900 focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]"
                    />
                  </div>
                </div>
              </div>

              {/* Balanced Responsive Tenure Grid (NO ORPHANED BUTTONS) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                    Select Tenure:
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Min. Purchase: ৳5,000
                  </span>
                </div>

                {/* 
                  Responsive grid:
                  - Mobile: 4 cols on line 1, 3 cols centered/balanced on line 2
                  - Tablet/Desktop: 7 equal cols in a single clean row
                */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {emiOptions.map(opt => {
                    const isSelected = activeOption?.tenureKey === opt.tenureKey;
                    return (
                      <button
                        key={opt.tenureKey}
                        type="button"
                        onClick={() => setSelectedTenureKey(opt.tenureKey)}
                        className={cn(
                          "py-2 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer border text-center flex flex-col items-center justify-center",
                          isSelected
                            ? "bg-[#081621] text-white border-[#081621] shadow-xs ring-1 ring-[#081621]"
                            : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        )}
                      >
                        <span className="leading-tight">{opt.months}M</span>
                        <span className={cn(
                          "text-[9px] font-normal leading-none mt-0.5",
                          isSelected ? "text-gray-300" : "text-gray-400"
                        )}>
                          {opt.rate}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Selected Plan Breakdown Card */}
              {activeOption && (
                <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-orange-50/70 via-amber-50/40 to-white border border-orange-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold text-gray-600">
                        Monthly Installment for <strong className="text-gray-900">{activeOption.months} Months</strong>
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-[#F97316] tracking-tight mt-0.5">
                        {formatTk(activeOption.monthlyInstallment)}
                        <span className="text-xs font-medium text-gray-500 ml-1">/ month</span>
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        Bank: <strong className="text-gray-800">{selectedBank.shortName}</strong>
                      </div>
                    </div>

                    <div className="bg-white/90 p-2.5 sm:p-3 rounded-lg border border-gray-200 text-xs space-y-1 sm:min-w-[210px]">
                      <div className="flex justify-between text-gray-600">
                        <span>Product Base:</span>
                        <span className="font-semibold text-gray-900">{formatTk(customPrice)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>EMI Charge ({activeOption.rate}%):</span>
                        <span className="font-semibold text-gray-700">+{formatTk(activeOption.chargeAmount)}</span>
                      </div>
                      <div className="flex justify-between text-gray-900 pt-1 border-t border-gray-100 font-bold">
                        <span>Total Payable:</span>
                        <span className="text-[#081621]">{formatTk(activeOption.totalPayable)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Comparison Table for All Tenures */}
              <div>
                <div className="text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  All Tenure Options for {selectedBank.shortName}:
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                        <th className="py-2 px-3">Tenure</th>
                        <th className="py-2 px-3 text-right">Monthly EMI</th>
                        <th className="py-2 px-3 text-right">Bank Charge</th>
                        <th className="py-2 px-3 text-right">Total Payable</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {emiOptions.map((opt) => {
                        const isSelected = activeOption?.tenureKey === opt.tenureKey;
                        return (
                          <tr 
                            key={opt.tenureKey}
                            onClick={() => setSelectedTenureKey(opt.tenureKey)}
                            className={cn(
                              "cursor-pointer transition-colors",
                              isSelected 
                                ? "bg-orange-50/80 font-bold" 
                                : "hover:bg-gray-50 bg-white"
                            )}
                          >
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "w-2 h-2 rounded-full shrink-0",
                                  isSelected ? "bg-[#F97316]" : "bg-gray-300"
                                )} />
                                <span className="font-semibold text-gray-900">{opt.months} Months</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-[#F97316]">
                              {formatTk(opt.monthlyInstallment)}<span className="text-[10px] font-normal text-gray-500">/mo</span>
                            </td>
                            <td className="py-2.5 px-3 text-right text-gray-600">
                              {opt.rate}% <span className="text-[10px] text-gray-500">(+{formatTk(opt.chargeAmount)})</span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                              {formatTk(opt.totalPayable)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Brief Avail Notice */}
              <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-[11px] leading-relaxed">
                <strong>How to avail:</strong> Select &quot;Pay Now&quot; with credit card during checkout or swipe at our showroom POS. Transaction will be converted into monthly installments by your bank.
              </div>
            </>
          ) : (
            /* 16 Banks Tariff Chart */
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <h4 className="font-bold text-gray-900 text-xs">
                    EMI Charges (Interest + Processing Fee)
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Applicable for all 16 partner banks (Minimum Purchase: BDT 5,000)
                  </p>
                </div>

                <div className="relative w-full sm:w-52">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search bank..."
                    value={chartSearchQuery}
                    onChange={e => setChartSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#081621] text-white">
                    <tr className="font-bold">
                      <th className="py-2.5 px-3 whitespace-nowrap">Bank Name</th>
                      <th className="py-2 px-2 text-center">3M</th>
                      <th className="py-2 px-2 text-center">6M</th>
                      <th className="py-2 px-2 text-center">9M</th>
                      <th className="py-2 px-2 text-center bg-blue-900/60">12M</th>
                      <th className="py-2 px-2 text-center">18M</th>
                      <th className="py-2 px-2 text-center">24M</th>
                      <th className="py-2 px-2 text-center">36M</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredBanksForChart.map((bank, idx) => (
                      <tr 
                        key={bank.id}
                        className={idx % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50/70 hover:bg-gray-50"}
                      >
                        <td className="py-2 px-3 font-semibold text-gray-900 whitespace-nowrap">
                          {bank.shortName}
                        </td>
                        <td className="py-2 px-2 text-center text-gray-700">
                          {bank.rates['3M'] !== null ? `${bank.rates['3M']}%` : '—'}
                        </td>
                        <td className="py-2 px-2 text-center text-gray-700">
                          {bank.rates['6M'] !== null ? `${bank.rates['6M']}%` : '—'}
                        </td>
                        <td className="py-2 px-2 text-center text-gray-700">
                          {bank.rates['9M'] !== null ? `${bank.rates['9M']}%` : '—'}
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-[#3749bb] bg-blue-50/40">
                          {bank.rates['12M'] !== null ? `${bank.rates['12M']}%` : '—'}
                        </td>
                        <td className="py-2 px-2 text-center text-gray-700">
                          {bank.rates['18M'] !== null ? `${bank.rates['18M']}%` : '—'}
                        </td>
                        <td className="py-2 px-2 text-center text-gray-700">
                          {bank.rates['24M'] !== null ? `${bank.rates['24M']}%` : '—'}
                        </td>
                        <td className="py-2 px-2 text-center font-semibold text-gray-900">
                          {bank.rates['36M'] !== null ? `${bank.rates['36M']}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-gray-500">
            Helpline: <a href="tel:+8809640887777" className="font-bold text-gray-800 hover:underline">+8809640887777</a>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 rounded-lg bg-[#081621] hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
