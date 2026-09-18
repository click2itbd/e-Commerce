const fs = require('fs');

let checkoutUi = fs.readFileSync('src/pages/Checkout.tsx', 'utf8');
let hostingLogic = fs.readFileSync('temp_HostingCheckout.tsx', 'utf8');

// I will just use the entire `Checkout.tsx` and inject the hosting logic blocks where needed.
let finalCode = checkoutUi.replace(
  'export const Checkout: React.FC = () => {',
  `export const HostingCheckout: React.FC = () => {`
).replace(
  'import { generateDocumentNumber } from \'../lib/numbering\';',
  `import { generateDocumentNumber } from '../lib/numbering';\nimport { Server, Key } from 'lucide-react';`
);

// Inject hosting config states
finalCode = finalCode.replace(
  'const [isProcessing, setIsProcessing] = useState(false);',
  `const [isProcessing, setIsProcessing] = useState(false);
  const [domainConfig, setDomainConfig] = useState({ ns1: 'ns1.click2itbd.com', ns2: 'ns2.click2itbd.com', useCustomNs: false });
  const [hostingConfig, setHostingConfig] = useState({ domain: '' });
  const [transferAuthCodes, setTransferAuthCodes] = useState<Record<string, string>>({});
  
  const hasDomain = items.some(i => i.itemType === 'domain');
  const hasHosting = items.some(i => i.itemType === 'hosting');
  const hasTransfer = items.some(i => i.itemType === 'domain_transfer');
  `
);

// Inject logic into handleSubmit
finalCode = finalCode.replace(
  `const newOrderRef = doc(collection(db, 'orders'));`,
  `const newOrderRef = doc(collection(db, 'orders'));
      
      const domainItems = items.filter(i => i.itemType === 'domain' || i.itemType === 'domain_transfer');
      const hostingItems = items.filter(i => i.itemType === 'hosting');

      for (const domainItem of domainItems) {
        const dOrderRef = doc(collection(db, 'domainOrders'));
        batch.set(dOrderRef, {
          userId: currentUserId,
          orderId: newOrderRef.id,
          domain: domainItem.name.replace('Domain Registration - ', '').replace('Domain Transfer - ', ''),
          status: 'pending',
          years: domainItem.termYears || 1,
          autoRenew: false,
          nameservers: domainConfig.useCustomNs ? [domainConfig.ns1, domainConfig.ns2] : ['ns1.click2itbd.com', 'ns2.click2itbd.com'],
          price: domainItem.price,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...(domainItem.itemType === 'domain_transfer' ? { authCode: transferAuthCodes[domainItem.id] || '' } : {})
        });
      }

      for (const hostingItem of hostingItems) {
        const hAccountRef = doc(collection(db, 'hostingAccounts'));
        batch.set(hAccountRef, {
          userId: currentUserId,
          orderId: newOrderRef.id,
          planId: hostingItem.id.replace('hosting_', ''),
          domain: hostingConfig.domain || '',
          provider: 'dummy',
          status: 'pending',
          billingCycle: hostingItem.billingCycle || 'monthly',
          autoRenew: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
`
);

// Inject UI blocks
const hostingConfigUI = `
          {(hasDomain || hasHosting) && (
            <div className="mb-12 relative border-t border-slate-200 pt-8">
              <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-6 py-1 rounded-full text-slate-800 text-sm font-semibold border border-slate-100 shadow-sm flex items-center gap-1"><Server size={14} /> Product Configuration</span>
              <div className="space-y-6">
                {hasHosting && !hasDomain && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Hosting Domain</label>
                    <input type="text" value={hostingConfig.domain} onChange={e => setHostingConfig({...hostingConfig, domain: e.target.value})} placeholder="e.g. example.com" className="border border-slate-200 bg-slate-50/50 p-3.5 rounded-xl text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all" />
                  </div>
                )}
                {hasDomain && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">Nameservers</label>
                    <div className="flex flex-col gap-3">
                      <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                        <input type="radio" checked={!domainConfig.useCustomNs} onChange={() => setDomainConfig({...domainConfig, useCustomNs: false})} className="w-4 h-4 text-[#0E2A47] focus:ring-[#0E2A47]" />
                        <div>
                          <p className="text-sm font-medium text-slate-800">Use Default Nameservers</p>
                          <p className="text-xs text-slate-500">ns1.click2itbd.com, ns2.click2itbd.com (Recommended)</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                        <input type="radio" checked={domainConfig.useCustomNs} onChange={() => setDomainConfig({...domainConfig, useCustomNs: true})} className="w-4 h-4 text-[#0E2A47] focus:ring-[#0E2A47]" />
                        <div>
                          <p className="text-sm font-medium text-slate-800">Use Custom Nameservers</p>
                          <p className="text-xs text-slate-500">Enter your own nameservers</p>
                        </div>
                      </label>
                    </div>
                    {domainConfig.useCustomNs && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <input type="text" value={domainConfig.ns1} onChange={e => setDomainConfig({...domainConfig, ns1: e.target.value})} placeholder="ns1.example.com" className="border border-slate-200 bg-slate-50/50 p-3.5 rounded-xl text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all" />
                        <input type="text" value={domainConfig.ns2} onChange={e => setDomainConfig({...domainConfig, ns2: e.target.value})} placeholder="ns2.example.com" className="border border-slate-200 bg-slate-50/50 p-3.5 rounded-xl text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          {hasTransfer && (
            <div className="mb-12 relative border-t border-slate-200 pt-8">
              <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-6 py-1 rounded-full text-slate-800 text-sm font-semibold border border-slate-100 shadow-sm flex items-center gap-1"><Key size={14} /> Domain Transfer Codes</span>
              <div className="space-y-4">
                {items.filter(i => i.itemType === 'domain_transfer').map(item => (
                  <div key={item.id}>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{item.name}</label>
                    <input type="text" value={transferAuthCodes[item.id] || ''} onChange={e => setTransferAuthCodes({...transferAuthCodes, [item.id]: e.target.value})} placeholder="Auth/EPP Code *" required className="border border-slate-200 bg-slate-50/50 p-3.5 rounded-xl text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}
`;

finalCode = finalCode.replace(
  '{/* Additional Notes */}',
  hostingConfigUI + '\n          {/* Additional Notes */}'
);

// bKash manual instruction injected near Payment Method
const bkashManualUI = `
          {formData.paymentMethod === 'bkash' && (
            <div className="mt-6 bg-pink-50 border border-pink-100 rounded-xl p-5">
              <h4 className="font-bold text-pink-900 mb-2">bKash Manual Payment</h4>
              <p className="text-sm text-pink-800 mb-4">Please send <strong>?{grandTotal.toFixed(2)}</strong> to our bKash Personal Number: <strong className="text-lg bg-pink-100 px-2 py-1 rounded">{(settings as any)?.manualBkashNumber || settings?.bkashNumber || '01700000000'}</strong></p>
              <div className="space-y-3">
                <input type="text" name="transactionId" placeholder="bKash TrxID *" required className="border border-pink-200 bg-white p-3.5 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all font-mono uppercase" />
                <p className="text-xs text-pink-700">Make sure to enter the exact Transaction ID (TrxID) received via SMS.</p>
              </div>
            </div>
          )}
`;

finalCode = finalCode.replace(
  '              {/* Payment Method */}\n              <div className="mb-10">',
  '              {/* Payment Method */}\n              <div className="mb-10">'
);
finalCode = finalCode.replace(
  '              </div>\n            </div>\n\n            {/* Additional Notes */}',
  '              </div>\n              ' + bkashManualUI + '\n            </div>\n\n            {/* Additional Notes */}'
);

fs.writeFileSync('src/pages/hosting/HostingCheckout.tsx', finalCode);
console.log('HostingCheckout.tsx written successfully!');
