import React, { useState, useMemo } from 'react';
import { 
  X, 
  CreditCard, 
  ExternalLink,
  Info,
  CheckCircle2,
  ChevronDown,
  Building2,
  Search,
  Check
} from 'lucide-react';
import { 
  BANK_EMI_PLANS, 
  EMI_TENURES, 
  MINIMUM_EMI_PURCHASE,
  getBankEMIOptions,
  EMICalculationResult,
  EMITenureKey
} from '../../data/emiPlans';
import { cn } from '../../lib/utils';
import { useSettings } from '../../context/SettingsContext';
import { Link } from 'react-router-dom';

interface EMIModalProps {
  isOpen: boolean;
  onClose: () => void;
  productPrice: number;
  productName?: string;
}

// Clean Bangladeshi currency formatter without messy '.00' decimals
const formatTk = (amount: number) => {
  return '৳ ' + Math.round(amount).toLocaleString('en-IN');
};

export const EMIModal: React.FC<EMIModalProps> = ({
  isOpen,
  onClose,
  productPrice,
  productName = 'Product'
}) => {
  const { settings } = useSettings();
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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header - Star Tech / Tech Retail Style */}
        <div className="px-5 py-4 bg-[#081621] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-500/10 text-[#F97316] flex items-center justify-center border border-orange-500/20">
              <CreditCard size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white tracking-tight">
                  Credit Card EMI Plans
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-gray-300">
                  16 Banks
                </span>
              </div>
              <p className="text-[11px] text-gray-400 truncate max-w-xs sm:max-w-md mt-0.5">
                {productName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Product Price & Status Bar */}
        <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-500">Price:</span>
            <span className="font-bold text-gray-900 text-sm">
              {formatTk(productPrice)}
            </span>
            {isProductEligible ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 size={11} /> Eligible for EMI
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <Info size={11} /> Min. Order ৳5,000 for EMI
              </span>
            )}
          </div>

          <Link
            to="/emi-terms"
            target="_blank"
            className="text-[11px] font-bold text-[#3749bb] hover:text-[#283688] hover:underline flex items-center gap-1"
          >
            <span>Full Policy &amp; Terms</span>
            <ExternalLink size={11} />
          </Link>
        </div>

        {/* Segmented Tab Control */}
        <div className="px-5 pt-3 pb-2 bg-white border-b border-gray-200 shrink-0">
          <div className="flex bg-gray-100 p-1 rounded-lg w-fit text-xs font-bold text-gray-600">
            <button
              type="button"
              onClick={() => setActiveTab('calculator')}
              className={cn(
                "px-3.5 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5",
                activeTab === 'calculator'
                  ? "bg-white text-gray-900 shadow-xs"
                  : "hover:text-gray-900 text-gray-500"
              )}
            >
              <span>Installment Calculator</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('all_banks')}
              className={cn(
                "px-3.5 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5",
                activeTab === 'all_banks'
                  ? "bg-white text-gray-900 shadow-xs"
                  : "hover:text-gray-900 text-gray-500"
              )}
            >
              <span>All 16 Banks Rate Chart</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {activeTab === 'calculator' ? (
            <>
              {/* Product Below 5,000 Clean Notice */}
              {!isProductEligible && (
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start gap-2.5">
                  <Info size={15} className="text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong>Order Threshold Notice:</strong> Bank Credit Card EMI is applicable on single items or combined cart purchases of <strong>৳ 5,000 or above</strong>. You can adjust the order amount below to simulate EMI for your complete order.
                  </div>
                </div>
              )}

              {/* Form Controls: Bank Selector & Price Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
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

              {/* Quick Tenure Filter Pills */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                  Select Tenure:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {emiOptions.map(opt => {
                    const isSelected = activeOption?.tenureKey === opt.tenureKey;
                    return (
                      <button
                        key={opt.tenureKey}
                        type="button"
                        onClick={() => setSelectedTenureKey(opt.tenureKey)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border",
                          isSelected
                            ? "bg-[#081621] text-white border-[#081621] shadow-xs"
                            : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        )}
                      >
                        {opt.months} Months
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Featured Selected Plan Card */}
              {activeOption && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-gray-50 to-orange-50/30 border border-orange-200/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        Monthly Installment ({activeOption.months} Months)
                      </div>
                      <div className="text-2xl font-black text-[#F97316] tracking-tight mt-0.5">
                        {formatTk(activeOption.monthlyInstallment)}
                        <span className="text-xs font-normal text-gray-500 ml-1">/ month</span>
                      </div>
                      <div className="text-[11px] text-gray-600 mt-1">
                        Bank: <strong className="text-gray-900">{selectedBank.name}</strong>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-gray-200/80 text-xs space-y-1.5 min-w-[200px]">
                      <div className="flex justify-between text-gray-600">
                        <span>Base Amount:</span>
                        <span className="font-semibold text-gray-900">{formatTk(customPrice)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Bank Charge ({activeOption.rate}%):</span>
                        <span className="font-semibold text-gray-700">+{formatTk(activeOption.chargeAmount)}</span>
                      </div>
                      <div className="flex justify-between text-gray-900 pt-1.5 border-t border-gray-100 font-bold">
                        <span>Total Payable:</span>
                        <span className="text-[#081621]">{formatTk(activeOption.totalPayable)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Comparison Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-gray-900 text-xs">
                    All Tenures for {selectedBank.shortName}
                  </h4>
                  <span className="text-[11px] text-gray-500">
                    Min. Purchase: ৳ 5,000
                  </span>
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                        <th className="py-2.5 px-3">Tenure</th>
                        <th className="py-2.5 px-3 text-right">Monthly Installment</th>
                        <th className="py-2.5 px-3 text-right">Bank Charge</th>
                        <th className="py-2.5 px-3 text-right">Total Payable</th>
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
                                ? "bg-orange-50/70 font-semibold" 
                                : "hover:bg-gray-50/80 bg-white"
                            )}
                          >
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1.5">
                                <span className={cn(
                                  "w-2 h-2 rounded-full",
                                  isSelected ? "bg-[#F97316]" : "bg-gray-300"
                                )} />
                                <span className="font-semibold text-gray-900">{opt.months} Months</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-[#F97316]">
                              {formatTk(opt.monthlyInstallment)}<span className="text-[10px] font-normal text-gray-500">/mo</span>
                            </td>
                            <td className="py-2.5 px-3 text-right text-gray-600">
                              {opt.rate}% <span className="text-[11px] text-gray-500">(+{formatTk(opt.chargeAmount)})</span>
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

              {/* Clean bullet guidelines */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-[11px] space-y-1">
                <div className="font-bold text-gray-800">How to avail EMI:</div>
                <div>• <strong>Online:</strong> Select &quot;Pay Now&quot; at checkout with your credit card and select desired EMI tenure.</div>
                <div>• <strong>Showroom:</strong> Visit our store and ask for POS Credit Card EMI swipe.</div>
                <div>• Credit card must have available limit equal to or higher than invoice value.</div>
              </div>
            </>
          ) : (
            /* All 16 Banks Tariff Chart */
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                <div>
                  <h4 className="font-bold text-gray-900 text-xs">
                    EMI Charges (EMI Interest + Processing Fee)
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Official rates across all 16 partner banks in Bangladesh (Min. Purchase ৳5,000)
                  </p>
                </div>

                <div className="relative w-full sm:w-56">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search bank name..."
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
                      <th className="py-2.5 px-2 text-center">3M</th>
                      <th className="py-2.5 px-2 text-center">6M</th>
                      <th className="py-2.5 px-2 text-center">9M</th>
                      <th className="py-2.5 px-2 text-center bg-blue-900/60">12M</th>
                      <th className="py-2.5 px-2 text-center">18M</th>
                      <th className="py-2.5 px-2 text-center">24M</th>
                      <th className="py-2.5 px-2 text-center">36M</th>
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
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0">
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
