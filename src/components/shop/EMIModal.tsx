import React, { useState, useMemo } from 'react';
import { 
  X, 
  CreditCard, 
  ExternalLink,
  Info,
  Building2,
  Table,
  CheckCircle2,
  Store,
  Globe
} from 'lucide-react';
import { 
  BANK_EMI_PLANS, 
  EMI_TENURES, 
  MINIMUM_EMI_PURCHASE,
  getBankEMIOptions 
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
  
  // If product is below 5,000, default simulation to 10,000 so customer can test
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

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Clean Header matching website brand */}
        <div className="px-5 py-3.5 bg-[#081621] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <CreditCard size={18} className="text-[#F97316]" />
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                Credit Card EMI Plans
              </h3>
              <p className="text-[11px] text-gray-300 truncate max-w-sm sm:max-w-md">
                {productName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Product Price & Notice Bar */}
        <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Product Price:</span>
            <span className="font-bold text-gray-900 text-sm">{formatCurrency(productPrice, settings)}</span>
            {isProductEligible ? (
              <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded">
                Eligible for EMI
              </span>
            ) : (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                Below ৳5,000 (Min. EMI Limit)
              </span>
            )}
          </div>

          <Link
            to="/emi-terms"
            onClick={onClose}
            className="text-[11px] font-semibold text-[#3749bb] hover:underline flex items-center gap-1"
          >
            <span>Full EMI Policy</span>
            <ExternalLink size={11} />
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-white px-5 pt-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('calculator')}
            className={cn(
              "pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer",
              activeTab === 'calculator'
                ? "border-[#F97316] text-[#F97316]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            )}
          >
            Bank EMI Calculator
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all_banks')}
            className={cn(
              "pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer",
              activeTab === 'all_banks'
                ? "border-[#F97316] text-[#F97316]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            )}
          >
            All 16 Banks Rate Chart
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {activeTab === 'calculator' ? (
            <>
              {/* If product itself is below 5,000, explain cleanly */}
              {!isProductEligible && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs">
                  <div className="flex items-start gap-2">
                    <Info size={15} className="text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <strong>Note:</strong> Credit Card EMI requires a minimum purchase of <strong>৳ 5,000</strong>.
                      This specific product alone is <strong>{formatCurrency(productPrice, settings)}</strong>. You can combine it with other items in your cart to reach ৳5,000+ or simulate EMI below:
                    </div>
                  </div>
                </div>
              )}

              {/* Bank & Amount Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Select Your Bank
                  </label>
                  <select
                    value={selectedBankId}
                    onChange={e => setSelectedBankId(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#F97316]"
                  >
                    {BANK_EMI_PLANS.map(bank => (
                      <option key={bank.id} value={bank.id}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Order / Purchase Amount (৳)
                  </label>
                  <input
                    type="number"
                    min={MINIMUM_EMI_PURCHASE}
                    value={customPrice}
                    onChange={e => setCustomPrice(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>

              {/* Professional Real-Store EMI Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-gray-900 text-xs">
                    Installment Plans for <span className="text-[#3749bb]">{selectedBank.shortName}</span>
                  </h4>
                  <span className="text-[11px] text-gray-500">
                    Min. Purchase: ৳5,000
                  </span>
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                        <th className="py-2.5 px-3">Tenure</th>
                        <th className="py-2.5 px-3 text-right">Monthly EMI</th>
                        <th className="py-2.5 px-3 text-right">Bank Charge</th>
                        <th className="py-2.5 px-3 text-right">Total Payable</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {emiOptions.map((opt, idx) => (
                        <tr 
                          key={opt.tenureKey}
                          className={idx % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50/60 hover:bg-gray-50"}
                        >
                          <td className="py-2.5 px-3 font-semibold text-gray-900">
                            {opt.months} Months
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-[#F97316]">
                            {formatCurrency(opt.monthlyInstallment, settings)}/mo
                          </td>
                          <td className="py-2.5 px-3 text-right text-gray-600">
                            {opt.rate}% (৳{opt.chargeAmount.toLocaleString()})
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-gray-900">
                            {formatCurrency(opt.totalPayable, settings)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Brief Guidelines */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-[11px] space-y-1">
                <div className="font-bold text-gray-800">How to avail Bank EMI:</div>
                <div>• <strong>Online:</strong> Choose &quot;Pay Now&quot; during checkout with your partner bank credit card and choose your tenure.</div>
                <div>• <strong>Showroom:</strong> Visit our retail outlet and request EMI swipe on our POS machine.</div>
                <div>• Credit card must have an available limit equal to or higher than the total product value.</div>
              </div>
            </>
          ) : (
            /* All 16 Banks Rate Chart (Exact Match to User's Document) */
            <div>
              <div className="mb-2">
                <h4 className="font-bold text-gray-900 text-xs">
                  EMI Charges (EMI Interest + Processing Fee)
                </h4>
                <p className="text-[11px] text-gray-500">
                  Minimum Purchase: BDT 5,000 for all partner banks
                </p>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-96">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-[#081621] text-white">
                    <tr className="font-bold">
                      <th className="py-2 px-3">Bank Name</th>
                      <th className="py-2 px-2 text-center">3M</th>
                      <th className="py-2 px-2 text-center">6M</th>
                      <th className="py-2 px-2 text-center">9M</th>
                      <th className="py-2 px-2 text-center">12M</th>
                      <th className="py-2 px-2 text-center">18M</th>
                      <th className="py-2 px-2 text-center">24M</th>
                      <th className="py-2 px-2 text-center">36M</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {BANK_EMI_PLANS.map((bank, idx) => (
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
                        <td className="py-2 px-2 text-center font-bold text-[#3749bb]">
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
            className="px-4 py-1.5 rounded bg-[#081621] hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
