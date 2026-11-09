import React, { useState, useMemo } from 'react';
import { 
  X, 
  CreditCard, 
  Calculator, 
  CheckCircle2, 
  HelpCircle, 
  Building2, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { 
  BANK_EMI_PLANS, 
  EMI_TENURES, 
  MINIMUM_EMI_PURCHASE,
  calculateEMI,
  getBankEMIOptions,
  BankEMIPlan
} from '../../data/emiPlans';
import { formatCurrency, cn } from '../../lib/utils';
import { useSettings } from '../../context/SettingsContext';
import { Link } from 'react-router-dom';

interface EMIModalProps {
  isOpen: boolean;
  onClose: () => void;
  productPrice: number;
  productName?: string;
}

export const EMIModal: React.FC<EMIModalProps> = ({
  isOpen,
  onClose,
  productPrice,
  productName = 'Product'
}) => {
  const { settings } = useSettings();
  const [selectedBankId, setSelectedBankId] = useState<string>(BANK_EMI_PLANS[0].id);
  const [activeTab, setActiveTab] = useState<'calculator' | 'all_banks'>('calculator');
  const [customPrice, setCustomPrice] = useState<number>(Math.max(MINIMUM_EMI_PURCHASE, productPrice || 0));

  // Sync customPrice when productPrice changes
  React.useEffect(() => {
    if (productPrice > 0) {
      setCustomPrice(productPrice);
    }
  }, [productPrice]);

  const selectedBank = useMemo(() => {
    return BANK_EMI_PLANS.find(b => b.id === selectedBankId) || BANK_EMI_PLANS[0];
  }, [selectedBankId]);

  const emiOptions = useMemo(() => {
    return getBankEMIOptions(customPrice, selectedBank.id);
  }, [customPrice, selectedBank.id]);

  const isEligible = customPrice >= MINIMUM_EMI_PURCHASE;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 text-emerald-400 flex items-center justify-center border border-white/10 shadow-inner">
              <CreditCard size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base tracking-wide text-white">
                  Bank Credit Card EMI Plans
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  16 Banks
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate max-w-md">
                {productName} • Base Price: <strong>{formatCurrency(customPrice, settings)}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* View Switcher Tabs */}
        <div className="px-5 pt-3 pb-2 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl text-xs font-bold text-slate-600">
            <button
              onClick={() => setActiveTab('calculator')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
                activeTab === 'calculator' ? "bg-white text-indigo-950 shadow-xs" : "hover:text-slate-900"
              )}
            >
              <Calculator size={13} />
              <span>EMI Calculator &amp; Monthly Plans</span>
            </button>
            <button
              onClick={() => setActiveTab('all_banks')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
                activeTab === 'all_banks' ? "bg-white text-indigo-950 shadow-xs" : "hover:text-slate-900"
              )}
            >
              <Building2 size={13} />
              <span>All 16 Banks Rate Chart</span>
            </button>
          </div>

          <Link
            to="/emi-terms"
            onClick={onClose}
            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
          >
            <span>Full EMI Policy</span>
            <ExternalLink size={11} />
          </Link>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Eligibility Note */}
          {!isEligible && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-amber-900">
              <Info size={16} className="shrink-0 text-amber-600 mt-0.5" />
              <div>
                <strong className="block font-bold">Minimum Purchase Notice:</strong>
                <span>Bank EMI facility is available for product or cart purchases of <strong>BDT 5,000 or above</strong>. You can adjust the amount below to simulate EMI for your complete order.</span>
              </div>
            </div>
          )}

          {activeTab === 'calculator' ? (
            <div className="space-y-4">
              {/* Controls: Price Adjustment & Bank Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    Select Your Credit Card Bank
                  </label>
                  <select
                    value={selectedBankId}
                    onChange={e => setSelectedBankId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  >
                    {BANK_EMI_PLANS.map(bank => (
                      <option key={bank.id} value={bank.id}>
                        {bank.shortName} ({bank.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    Product / Order Price (BDT)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                    <input
                      type="number"
                      min={MINIMUM_EMI_PURCHASE}
                      value={customPrice}
                      onChange={e => setCustomPrice(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Installment Options Grid */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span>Available Tenures for</span>
                    <span className="text-indigo-600 font-black">{selectedBank.shortName}</span>
                  </h4>
                  <span className="text-[10px] text-slate-500">
                    Min Purchase: ৳{selectedBank.minPurchase.toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {emiOptions.map((opt) => {
                    const isPopular = opt.months === 6 || opt.months === 12;
                    return (
                      <div
                        key={opt.tenureKey}
                        className={cn(
                          "p-3 rounded-2xl border transition-all relative flex flex-col justify-between",
                          isPopular 
                            ? "bg-gradient-to-br from-indigo-50/60 to-white border-indigo-200 shadow-2xs ring-1 ring-indigo-300/40"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        )}
                      >
                        {isPopular && (
                          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700">
                            {opt.months === 12 ? 'Most Popular' : 'Recommended'}
                          </span>
                        )}

                        <div>
                          <div className="text-xs font-black text-slate-800 flex items-baseline gap-1">
                            <span className="text-base text-indigo-950 font-black">{opt.months}</span>
                            <span>Months Tenure</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                            Charge: <strong className="text-slate-700">{opt.rate}%</strong> (Interest + Fee)
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-end justify-between">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Monthly EMI</span>
                            <span className="text-base font-black text-[#EF4444] font-mono">
                              {formatCurrency(opt.monthlyInstallment, settings)}
                            </span>
                            <span className="text-[10px] text-slate-500">/mo</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Total Payable</span>
                            <span className="text-xs font-bold text-slate-700 font-mono">
                              {formatCurrency(opt.totalPayable, settings)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Informational Guidance Box */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <div className="font-extrabold text-slate-800 flex items-center gap-1.5 text-xs">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>How to Avail Credit Card EMI at CLICK2IT:</span>
                </div>
                <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-5 leading-relaxed">
                  <li>You must possess a valid Credit Card from any of the 16 partner commercial banks.</li>
                  <li>Your credit card limit must equal or exceed the total product price at the time of purchase.</li>
                  <li>Available both for <strong>Online checkout</strong> (select Credit Card EMI) and at our <strong>Retail Showrooms</strong> via POS terminal.</li>
                  <li>The total transaction charge (Interest + Bank Processing Fee) is amortized and billed monthly by your bank.</li>
                </ul>
              </div>
            </div>
          ) : (
            /* All 16 Banks Rate Chart */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    EMI Charges (EMI Interest + Processing Fee)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Official tenure rates across all 16 partner banks. Minimum purchase: <strong>BDT 5,000</strong>.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-extrabold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3.5 sticky left-0 bg-slate-900 z-10">Bank Name</th>
                      <th className="py-3 px-2 text-center">Min. Purchase</th>
                      {EMI_TENURES.map(t => (
                        <th key={t.key} className="py-3 px-2.5 text-center whitespace-nowrap">
                          {t.key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {BANK_EMI_PLANS.map((bank, idx) => (
                      <tr 
                        key={bank.id} 
                        className={cn(
                          "hover:bg-indigo-50/50 transition-colors",
                          idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                        )}
                      >
                        <td className="py-2.5 px-3.5 font-bold text-slate-900 sticky left-0 bg-inherit z-10 whitespace-nowrap shadow-xs">
                          {bank.shortName}
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-600 whitespace-nowrap font-mono text-[11px]">
                          BDT {bank.minPurchase}
                        </td>
                        {EMI_TENURES.map(t => {
                          const rate = bank.rates[t.key];
                          return (
                            <td 
                              key={t.key} 
                              className={cn(
                                "py-2.5 px-2.5 text-center font-mono font-bold whitespace-nowrap text-[11px]",
                                rate === null ? "text-slate-300" : "text-slate-800"
                              )}
                            >
                              {rate !== null ? `${rate.toFixed(2)}%` : '—'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-500" />
            <span>Need assistance? Call our helpline: <strong>{settings?.contactPhone || '+8809640887777'}</strong></span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
