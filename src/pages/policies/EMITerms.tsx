import React, { useState, useMemo } from 'react';
import { Layout } from '../../components/Layout';
import { SEO } from '../../components/SEO';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Building2,
  Calculator,
  CheckCircle2,
  HelpCircle,
  Phone,
  Mail,
  ShieldCheck,
  Search,
  Sparkles,
  ArrowRight,
  Info,
  BadgeCheck,
  Store,
  Globe,
  Layers,
  Clock
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { DynamicPolicyPage } from '../../components/DynamicPolicyPage';
import { 
  BANK_EMI_PLANS, 
  EMI_TENURES, 
  MINIMUM_EMI_PURCHASE,
  calculateEMI,
  getBankEMIOptions 
} from '../../data/emiPlans';
import { formatCurrency, cn } from '../../lib/utils';

const EMITerms = () => {
  const { settings } = useSettings();
  const brandName = settings?.brandName || 'Click2IT BD';
  const contactPhone = settings?.contactPhone || '+8809640887777';
  const contactEmail = settings?.contactEmail || 'info@click2itbd.com';

  // Calculator states
  const [calculatorAmount, setCalculatorAmount] = useState<number>(35000);
  const [selectedBankId, setSelectedBankId] = useState<string>(BANK_EMI_PLANS[0].id);
  const [searchBankQuery, setSearchBankQuery] = useState('');

  const selectedBank = useMemo(() => {
    return BANK_EMI_PLANS.find(b => b.id === selectedBankId) || BANK_EMI_PLANS[0];
  }, [selectedBankId]);

  const emiCalculations = useMemo(() => {
    const amt = Math.max(MINIMUM_EMI_PURCHASE, calculatorAmount || 0);
    return getBankEMIOptions(amt, selectedBank.id);
  }, [calculatorAmount, selectedBank.id]);

  const filteredBanks = useMemo(() => {
    if (!searchBankQuery.trim()) return BANK_EMI_PLANS;
    const q = searchBankQuery.toLowerCase();
    return BANK_EMI_PLANS.filter(b => 
      b.name.toLowerCase().includes(q) || b.shortName.toLowerCase().includes(q)
    );
  }, [searchBankQuery]);

  return (
    <DynamicPolicyPage pageId="emi-terms" defaultTitle="Credit Card EMI Policy & Plans">
      <Layout fullWidth>
        <SEO
          title={`Credit Card EMI Policy & Partner Bank Plans - ${brandName}`}
          description={`Comprehensive Credit Card EMI plans, interest and processing fee chart for 16 major commercial banks across Bangladesh at ${brandName}.`}
        />

        <div className="bg-slate-50/70 py-10 md:py-14 min-h-screen">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            
            {/* Hero Header */}
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 rounded-3xl p-8 md:p-12 text-white shadow-xl mb-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black tracking-wide uppercase mb-5">
                  <CreditCard className="w-3.5 h-3.5" />
                  Official Credit Card EMI Facility
                </div>

                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight mb-4">
                  Flexible Monthly EMI on <span className="text-emerald-400">16 Major Banks</span>
                </h1>

                <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-8">
                  Get your desired PC components, laptops, desktops, monitors, and gadgets without paying full upfront. Enjoy <strong>3 to 36 months</strong> flexible EMI installments across Bangladesh’s top commercial banks.
                </p>

                {/* Key Benefits Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-xs">
                    <div className="text-emerald-400 text-xl font-black mb-0.5">16 Banks</div>
                    <div className="text-slate-300 text-xs font-medium">Partner Commercial Banks</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-xs">
                    <div className="text-emerald-400 text-xl font-black mb-0.5">3 - 36 M</div>
                    <div className="text-slate-300 text-xs font-medium">Flexible Tenure Range</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-xs">
                    <div className="text-emerald-400 text-xl font-black mb-0.5">৳ 5,000</div>
                    <div className="text-slate-300 text-xs font-medium">Minimum Order Value</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-xs">
                    <div className="text-emerald-400 text-xl font-black mb-0.5">Online & POS</div>
                    <div className="text-slate-300 text-xs font-medium">Web & Showroom Available</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Live EMI Calculator */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/90 mb-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold mb-2">
                    <Calculator size={14} /> Live Interactive Tool
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    EMI Installment Calculator
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Input your cart or product price to calculate monthly installment across different banks.
                  </p>
                </div>

                {/* Bank Selector */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Select Bank
                    </label>
                    <select
                      value={selectedBankId}
                      onChange={(e) => setSelectedBankId(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs cursor-pointer"
                    >
                      {BANK_EMI_PLANS.map(bank => (
                        <option key={bank.id} value={bank.id}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Purchase Amount (BDT)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">৳</span>
                      <input
                        type="number"
                        min={MINIMUM_EMI_PURCHASE}
                        step={1000}
                        value={calculatorAmount}
                        onChange={(e) => setCalculatorAmount(Number(e.target.value))}
                        className="pl-7 pr-3 py-2.5 rounded-xl border border-slate-300 font-black text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs w-36"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Calculated Tenure Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {emiCalculations.map((opt) => (
                  <div
                    key={opt.tenureKey}
                    className="p-4 rounded-2xl border border-slate-200/90 hover:border-emerald-500 hover:shadow-md transition-all bg-gradient-to-b from-white to-slate-50/50 group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-slate-900 text-white group-hover:bg-emerald-600 transition-colors">
                        {opt.months} Months
                      </span>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        {opt.rate}% Charge
                      </span>
                    </div>

                    <div className="mt-3">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Monthly Pay</div>
                      <div className="text-xl font-black text-emerald-600 tracking-tight mt-0.5">
                        {formatCurrency(opt.monthlyInstallment, settings)}
                        <span className="text-xs font-normal text-slate-500">/mo</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-[11px] text-slate-600">
                      <div className="flex justify-between">
                        <span>Total Payable:</span>
                        <strong className="text-slate-800">{formatCurrency(opt.totalPayable, settings)}</strong>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Charge Amount:</span>
                        <span>৳ {opt.chargeAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Info size={16} className="text-blue-600 shrink-0" />
                  <span>
                    Calculations are based on <strong>{selectedBank.name}</strong> charges (EMI Interest + Processing Fee).
                  </span>
                </div>
                <span className="font-bold text-slate-800 shrink-0">Min Order: ৳ 5,000</span>
              </div>
            </div>

            {/* Official 16 Bank EMI Charges Table */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/90 mb-10 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold mb-2">
                    <Building2 size={14} /> Full Partner Bank Matrix
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    EMI Charges (EMI Interest + Processing Fee)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Official tenure rates for all 16 supported commercial banks in Bangladesh.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search bank name..."
                    value={searchBankQuery}
                    onChange={(e) => setSearchBankQuery(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Responsive Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold text-xs uppercase tracking-wider">
                      <th className="py-3.5 px-4 sticky left-0 bg-slate-900 z-10">Bank Name</th>
                      <th className="py-3.5 px-3 whitespace-nowrap text-center">Minimum Purchase</th>
                      <th className="py-3.5 px-3 text-center">3M</th>
                      <th className="py-3.5 px-3 text-center">6M</th>
                      <th className="py-3.5 px-3 text-center">9M</th>
                      <th className="py-3.5 px-3 text-center">12M</th>
                      <th className="py-3.5 px-3 text-center">18M</th>
                      <th className="py-3.5 px-3 text-center">24M</th>
                      <th className="py-3.5 px-3 text-center">36M</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBanks.map((bank, idx) => (
                      <tr 
                        key={bank.id}
                        className={cn(
                          "transition-colors hover:bg-emerald-50/50",
                          idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                        )}
                      >
                        <td className="py-3.5 px-4 font-bold text-slate-900 sticky left-0 bg-inherit z-10 whitespace-nowrap border-r border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-black shrink-0">
                              {idx + 1}
                            </span>
                            <span>{bank.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-center font-bold text-emerald-700 whitespace-nowrap">
                          BDT 5,000
                        </td>
                        <td className="py-3.5 px-3 text-center font-semibold text-slate-700">
                          {bank.rates['3M'] !== null ? `${bank.rates['3M'].toFixed(2)}%` : '—'}
                        </td>
                        <td className="py-3.5 px-3 text-center font-semibold text-slate-700">
                          {bank.rates['6M'] !== null ? `${bank.rates['6M'].toFixed(2)}%` : '—'}
                        </td>
                        <td className="py-3.5 px-3 text-center font-semibold text-slate-700">
                          {bank.rates['9M'] !== null ? `${bank.rates['9M'].toFixed(2)}%` : '—'}
                        </td>
                        <td className="py-3.5 px-3 text-center font-bold text-indigo-700 bg-indigo-50/40">
                          {bank.rates['12M'] !== null ? `${bank.rates['12M'].toFixed(2)}%` : '—'}
                        </td>
                        <td className="py-3.5 px-3 text-center font-semibold text-slate-700">
                          {bank.rates['18M'] !== null ? `${bank.rates['18M'].toFixed(2)}%` : '—'}
                        </td>
                        <td className="py-3.5 px-3 text-center font-semibold text-slate-700">
                          {bank.rates['24M'] !== null ? `${bank.rates['24M'].toFixed(2)}%` : '—'}
                        </td>
                        <td className="py-3.5 px-3 text-center font-semibold text-slate-700">
                          {bank.rates['36M'] !== null ? (
                            <span className="font-bold text-emerald-700">{bank.rates['36M'].toFixed(2)}%</span>
                          ) : (
                            <span className="text-slate-400 font-bold">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-[11px] text-slate-500 flex items-center justify-between">
                <span>* Rates are subject to periodic regulatory updates by respective partner banks.</span>
                <span>Minimum purchase threshold: BDT 5,000 for all banks.</span>
              </div>
            </div>

            {/* How to Avail EMI Guide */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {/* Method A: Online Checkout */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/90">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <Globe size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">
                  Option 1: Online Website Order
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mb-5 leading-relaxed">
                  Conveniently order from home with your credit card through our secure payment gateway.
                </p>

                <ol className="space-y-3.5 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">1</span>
                    <span>Add product(s) with minimum order value of <strong>BDT 5,000</strong> to cart.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">2</span>
                    <span>Proceed to checkout and select <strong>Pay Now (Credit Card)</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">3</span>
                    <span>On payment gateway page, select your <strong>Bank and desired EMI Tenure (3-36M)</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">4</span>
                    <span>Complete transaction with OTP. Your bank will convert the transaction to monthly installments within 3-7 working days.</span>
                  </li>
                </ol>
              </div>

              {/* Method B: Showroom POS Swipe */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/90">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <Store size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">
                  Option 2: Physical Showroom POS
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mb-5 leading-relaxed">
                  Visit our physical store to test components and complete instant EMI on POS terminal.
                </p>

                <ol className="space-y-3.5 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">1</span>
                    <span>Select products or build your customized PC at our showroom counter.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">2</span>
                    <span>Inform sales executive that you want to avail <strong>Credit Card EMI</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">3</span>
                    <span>Hand over your eligible credit card and select tenure (3 to 36 months).</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">4</span>
                    <span>Sign the POS slip and receive original invoice + instant warranty confirmation.</span>
                  </li>
                </ol>
              </div>
            </div>

            {/* Terms, Conditions & Eligibility */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/90 mb-10">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <ShieldCheck className="text-emerald-600" size={24} />
                Important Terms & Eligibility Criteria
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-slate-600">
                <div className="space-y-3">
                  <div className="flex gap-2.5">
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Valid Credit Card Requirement:</strong> EMI is strictly available on credit cards issued by our 16 partner banks. Debit cards and prepaid cards do not support bank EMI.
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Available Credit Limit:</strong> The cardholder must have an available credit limit equal to or higher than the total invoice value at the time of purchase.
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Minimum Order Amount:</strong> The minimum purchase requirement for EMI processing is <strong>BDT 5,000</strong> across all partner banks.
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-2.5">
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Conversion Timeline:</strong> Online EMI transactions are usually converted to equated monthly installments by your card issuer bank within <strong>3 to 7 working days</strong>.
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Charges & Interest:</strong> The rate table reflects the combined EMI interest and bank processing fee. No hidden extra charges are billed by {brandName}.
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Cancellation & Refunds:</strong> In the rare event of order cancellation, bank processing fees are non-refundable according to commercial bank regulatory policies.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Need Assistance Contact Box */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
              <div>
                <h4 className="text-xl font-black mb-1">Have Questions About Bank EMI?</h4>
                <p className="text-emerald-100 text-xs sm:text-sm">
                  Our customer care and sales executives are available 7 days a week to guide you with EMI approval.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <a
                  href={`tel:${contactPhone}`}
                  className="px-4 py-2.5 rounded-xl bg-white text-emerald-800 font-bold text-xs flex items-center gap-2 hover:bg-emerald-50 transition-all shadow-xs"
                >
                  <Phone size={14} /> Call Helpline
                </a>
                <Link
                  to="/contact-us"
                  className="px-4 py-2.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-2 transition-all border border-emerald-400/30"
                >
                  <Mail size={14} /> Contact Us
                </Link>
              </div>
            </div>

          </div>
        </div>
      </Layout>
    </DynamicPolicyPage>
  );
};

export default EMITerms;
