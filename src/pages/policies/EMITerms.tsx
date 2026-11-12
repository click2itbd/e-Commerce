import React, { useState, useMemo } from 'react';
import { Layout } from '../../components/Layout';
import { SEO } from '../../components/SEO';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Building2,
  Calculator,
  Search,
  CheckCircle2,
  Phone,
  Mail,
  ShieldCheck,
  Store,
  Globe,
  ChevronRight
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { DynamicPolicyPage } from '../../components/DynamicPolicyPage';
import { 
  BANK_EMI_PLANS, 
  EMI_TENURES, 
  MINIMUM_EMI_PURCHASE,
  getBankEMIOptions 
} from '../../data/emiPlans';
import { formatCurrency, cn } from '../../lib/utils';

const EMITerms = () => {
  const { settings } = useSettings();
  const brandName = settings?.brandName || 'Click2IT BD';
  const contactPhone = settings?.contactPhone || '+8809640887777';
  const contactEmail = settings?.contactEmail || 'info@click2itbd.com';

  const [calculatorAmount, setCalculatorAmount] = useState<number>(30000);
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

  const emiFaqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'What is the minimum purchase amount for Credit Card EMI at Click2IT?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'The minimum order value to avail of Credit Card EMI facility across our 16 partner banks is ৳ 5,000 (BDT).'
        }
      },
      {
        '@type': 'Question',
        'name': 'Which banks are supported for EMI payment at Click2IT?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'We partner with 16 leading commercial banks in Bangladesh including Eastern Bank PLC (EBL), City Bank, Dutch-Bangla Bank (DBBL), BRAC Bank, Standard Chartered Bank (SCB), Mutual Trust Bank (MTB), Prime Bank, Dhaka Bank, Jamuna Bank, and more.'
        }
      },
      {
        '@type': 'Question',
        'name': 'What tenure options are available for EMI?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'You can choose installment tenures of 3, 6, 9, 12, 18, 24, and up to 36 months depending on your bank and credit card plan.'
        }
      },
      {
        '@type': 'Question',
        'name': 'How do I purchase online with Credit Card EMI?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'At checkout, select "Credit Card EMI", choose your bank and tenure to preview your monthly installment, then place your order and complete the transaction using your eligible credit card on the secure payment gateway.'
        }
      }
    ]
  };

  const emiBreadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': 'https://click2itbd.com'
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'EMI Terms & Bank Plans',
        'item': 'https://click2itbd.com/emi-terms'
      }
    ]
  };

  return (
    <DynamicPolicyPage pageId="emi-terms" defaultTitle="EMI Terms & Conditions">
      <Layout fullWidth>
        <SEO
          title={`Credit Card EMI Terms & 16 Partner Bank Plans - ${brandName}`}
          description={`Comprehensive Credit Card EMI plans, monthly installment calculations, and bank fee charts for 16 commercial banks in Bangladesh at ${brandName}.`}
          canonical="https://click2itbd.com/emi-terms"
          schema={[emiFaqSchema, emiBreadcrumbSchema]}
        />

        <div className="bg-[#f2f4f8] py-6 sm:py-10 min-h-screen">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
              <Link to="/" className="hover:text-[#F97316]">Home</Link>
              <ChevronRight size={12} />
              <span className="text-gray-800 font-medium">EMI Terms</span>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-lg shadow-xs border border-gray-200 overflow-hidden mb-6">
              
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-2 text-[#F97316] font-bold text-xs uppercase tracking-wider mb-1">
                  <CreditCard size={16} />
                  <span>Credit Card Facility</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#081621]">
                  EMI Terms &amp; Conditions
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                  Purchase desktops, laptops, components, and gadgets with flexible 3 to 36 months monthly installments through 16 major commercial banks in Bangladesh.
                </p>

                {/* Key Summary Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100 text-xs">
                  <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                    <div className="text-gray-500 text-[11px]">Partner Banks</div>
                    <div className="font-bold text-[#081621] text-sm">16 Commercial Banks</div>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                    <div className="text-gray-500 text-[11px]">Installment Tenures</div>
                    <div className="font-bold text-[#081621] text-sm">3, 6, 9, 12, 18, 24, 36 M</div>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                    <div className="text-gray-500 text-[11px]">Minimum Purchase</div>
                    <div className="font-bold text-[#081621] text-sm">BDT 5,000</div>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                    <div className="text-gray-500 text-[11px]">Availability</div>
                    <div className="font-bold text-[#081621] text-sm">Online &amp; Showroom POS</div>
                  </div>
                </div>
              </div>

              {/* Official 16 Banks Rate Chart (Matches User Uploaded Document) */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-[#081621]">
                      EMI Charges (EMI Interest + Processing Fee)
                    </h2>
                    <p className="text-xs text-gray-500">
                      Standard bank charges applicable on product purchase price (Min. Order BDT 5,000).
                    </p>
                  </div>

                  <div className="relative w-full sm:w-60">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search bank name..."
                      value={searchBankQuery}
                      onChange={(e) => setSearchBankQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded border border-gray-300 text-xs focus:outline-none focus:border-[#F97316]"
                    />
                  </div>
                </div>

                {/* The Rate Table styled matching Bangladesh Tech Stores */}
                <div className="overflow-x-auto border border-gray-200 rounded">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#0e3845] text-white font-bold text-xs">
                        <th className="py-2.5 px-3">Bank Name</th>
                        <th className="py-2.5 px-3 text-center whitespace-nowrap">Minimum Purchase</th>
                        <th className="py-2.5 px-2 text-center">3M</th>
                        <th className="py-2.5 px-2 text-center">6M</th>
                        <th className="py-2.5 px-2 text-center">9M</th>
                        <th className="py-2.5 px-2 text-center">12M</th>
                        <th className="py-2.5 px-2 text-center">18M</th>
                        <th className="py-2.5 px-2 text-center">24M</th>
                        <th className="py-2.5 px-2 text-center">36M</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredBanks.map((bank, idx) => (
                        <tr 
                          key={bank.id}
                          className={idx % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-[#f8fafc] hover:bg-gray-50"}
                        >
                          <td className="py-2.5 px-3 font-semibold text-gray-900 whitespace-nowrap">
                            {bank.shortName}
                          </td>
                          <td className="py-2.5 px-3 text-center text-gray-700 whitespace-nowrap">
                            BDT 5,000
                          </td>
                          <td className="py-2.5 px-2 text-center text-gray-700">
                            {bank.rates['3M'] !== null ? `${bank.rates['3M'].toFixed(2)}%` : '—'}
                          </td>
                          <td className="py-2.5 px-2 text-center text-gray-700">
                            {bank.rates['6M'] !== null ? `${bank.rates['6M'].toFixed(2)}%` : '—'}
                          </td>
                          <td className="py-2.5 px-2 text-center text-gray-700">
                            {bank.rates['9M'] !== null ? `${bank.rates['9M'].toFixed(2)}%` : '—'}
                          </td>
                          <td className="py-2.5 px-2 text-center font-bold text-[#3749bb] bg-blue-50/40">
                            {bank.rates['12M'] !== null ? `${bank.rates['12M'].toFixed(2)}%` : '—'}
                          </td>
                          <td className="py-2.5 px-2 text-center text-gray-700">
                            {bank.rates['18M'] !== null ? `${bank.rates['18M'].toFixed(2)}%` : '—'}
                          </td>
                          <td className="py-2.5 px-2 text-center text-gray-700">
                            {bank.rates['24M'] !== null ? `${bank.rates['24M'].toFixed(2)}%` : '—'}
                          </td>
                          <td className="py-2.5 px-2 text-center text-gray-700">
                            {bank.rates['36M'] !== null ? (
                              <span className="font-semibold text-gray-900">{bank.rates['36M'].toFixed(2)}%</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-[11px] text-gray-500 mt-2">
                  * Note: Bank charges include applicable EMI interest and bank transaction processing fees.
                </p>
              </div>

              {/* Clean EMI Calculator */}
              <div className="p-6 border-b border-gray-200 bg-gray-50/50">
                <div className="flex items-center gap-2 text-gray-900 font-bold text-base mb-3">
                  <Calculator size={18} className="text-[#F97316]" />
                  <h2>Interactive EMI Calculator</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Select Bank
                    </label>
                    <select
                      value={selectedBankId}
                      onChange={e => setSelectedBankId(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#F97316]"
                    >
                      {BANK_EMI_PLANS.map(bank => (
                        <option key={bank.id} value={bank.id}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Purchase Amount (BDT)
                    </label>
                    <input
                      type="number"
                      min={MINIMUM_EMI_PURCHASE}
                      step={1000}
                      value={calculatorAmount}
                      onChange={e => setCalculatorAmount(Number(e.target.value) || 0)}
                      className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#F97316]"
                    />
                  </div>
                </div>

                {/* Calculator Results Table */}
                <div className="overflow-x-auto border border-gray-200 rounded bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                        <th className="py-2 px-3">Tenure</th>
                        <th className="py-2 px-3 text-right">Monthly EMI</th>
                        <th className="py-2 px-3 text-right">Charge Rate (%)</th>
                        <th className="py-2 px-3 text-right">Charge Amount</th>
                        <th className="py-2 px-3 text-right">Total Payable</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {emiCalculations.map((opt, idx) => (
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
                            {opt.rate}%
                          </td>
                          <td className="py-2.5 px-3 text-right text-gray-600">
                            ৳ {opt.chargeAmount.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                            {formatCurrency(opt.totalPayable, settings)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* How to Avail Guide */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-base font-bold text-[#081621] mb-3">
                  How to Avail Credit Card EMI
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-700">
                  <div className="p-4 bg-gray-50 rounded border border-gray-200">
                    <div className="flex items-center gap-2 font-bold text-sm text-[#081621] mb-2">
                      <Globe size={16} className="text-[#3749bb]" />
                      <span>Online Website Order</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1.5 text-gray-600">
                      <li>Add products worth <strong>BDT 5,000 or more</strong> to cart.</li>
                      <li>Proceed to Checkout and choose <strong>Pay Now (Credit Card)</strong>.</li>
                      <li>Select your bank and preferred installment tenure (3 - 36 Months).</li>
                      <li>Complete transaction with OTP. The bank converts the purchase into monthly installments within 3 to 7 working days.</li>
                    </ol>
                  </div>

                  <div className="p-4 bg-gray-50 rounded border border-gray-200">
                    <div className="flex items-center gap-2 font-bold text-sm text-[#081621] mb-2">
                      <Store size={16} className="text-[#F97316]" />
                      <span>Showroom Purchase (POS)</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1.5 text-gray-600">
                      <li>Visit our showroom and finalize your product or PC configuration.</li>
                      <li>Inform our sales desk that you wish to avail <strong>Credit Card EMI</strong>.</li>
                      <li>Present your partner bank credit card and choose your tenure.</li>
                      <li>The POS machine prints your EMI slip and receipt immediately.</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Key Terms & Eligibility */}
              <div className="p-6 text-xs text-gray-700 space-y-2.5">
                <h3 className="text-base font-bold text-[#081621] mb-2">
                  Important Terms &amp; Policies
                </h3>
                <ul className="list-disc list-inside space-y-1.5 text-gray-600">
                  <li><strong>Credit Cards Only:</strong> EMI facility is strictly available on credit cards issued by the 16 partner banks. Debit and prepaid cards are not eligible.</li>
                  <li><strong>Credit Limit:</strong> The cardholder must have an available credit balance equal to or greater than the total purchase price.</li>
                  <li><strong>Minimum Order:</strong> BDT 5,000 minimum order value applies to all partner banks.</li>
                  <li><strong>Bank Processing:</strong> The conversion of transaction into EMI is handled by your issuing bank and usually reflects within 3-7 business days.</li>
                  <li><strong>Refund &amp; Cancellation:</strong> Bank processing and EMI charges are governed by the respective bank policy.</li>
                </ul>
              </div>

              {/* Help & Contact Bar */}
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="text-gray-600 text-center sm:text-left">
                  Have questions about Credit Card EMI? Contact our support team:
                </div>
                <div className="flex items-center gap-3">
                  <a href={`tel:${contactPhone}`} className="font-bold text-[#081621] hover:text-[#F97316] flex items-center gap-1">
                    <Phone size={13} /> {contactPhone}
                  </a>
                  <span className="text-gray-300">|</span>
                  <a href={`mailto:${contactEmail}`} className="font-bold text-[#081621] hover:text-[#F97316] flex items-center gap-1">
                    <Mail size={13} /> {contactEmail}
                  </a>
                </div>
              </div>

            </div>

          </div>
        </div>
      </Layout>
    </DynamicPolicyPage>
  );
};

export default EMITerms;
