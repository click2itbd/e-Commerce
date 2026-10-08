const fs = require('fs');

// 1. Create ConfirmContext
const contextCode = `import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  confirmColor?: string;
  isDestructive?: boolean;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const confirmAction = (opts: ConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  };

  const handleConfirm = async () => {
    setIsConfirming(true);
    if (resolver) resolver(true);
    setIsOpen(false);
    setIsConfirming(false);
  };

  const handleCancel = () => {
    if (resolver) resolver(false);
    setIsOpen(false);
  };

  const isRed = options?.isDestructive || options?.confirmColor?.includes('red');
  const isBlue = !isRed;

  return (
    <ConfirmContext.Provider value={{ confirm: confirmAction }}>
      {children}
      {isOpen && options && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center pt-8">
              <div className={\`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 \${isRed ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}\`}>
                {isRed ? <AlertTriangle size={32} strokeWidth={1.5} /> : <CheckCircle size={32} strokeWidth={1.5} />}
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{options.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">{options.message}</p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={handleCancel}
                  disabled={isConfirming}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isConfirming}
                  className={\`flex-1 py-2.5 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 \${options.confirmColor || (isRed ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700')}\`}
                >
                  {isConfirming ? <Loader2 size={18} className="animate-spin" /> : (options.confirmText || 'Confirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used within ConfirmProvider');
  return context;
};
`;
fs.writeFileSync('src/context/ConfirmContext.tsx', contextCode);

// 2. Wrap App.tsx
let appC = fs.readFileSync('src/App.tsx', 'utf8');
const nl = appC.includes('\r\n') ? '\r\n' : '\n';
if (!appC.includes('ConfirmProvider')) {
  appC = appC.replace(/import \{ SettingsProvider \} from '\.\/context\/SettingsContext';/, "import { SettingsProvider } from './context/SettingsContext';\nimport { ConfirmProvider } from './context/ConfirmContext';");
  appC = appC.replace(/<SettingsProvider>/, "<ConfirmProvider>\n      <SettingsProvider>");
  appC = appC.replace(/<\/SettingsProvider>/, "</SettingsProvider>\n      </ConfirmProvider>");
  fs.writeFileSync('src/App.tsx', appC);
}

// 3. Update Purchases.tsx
let p = fs.readFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', 'utf8');
if (!p.includes('useConfirm')) {
  p = p.replace(/import \{ db \} from/, "import { useConfirm } from '../../../../context/ConfirmContext';\nimport { db } from");
  p = p.replace(/const PurchasesTab = \(\) => \{/, "const PurchasesTab = () => {\n  const { confirm } = useConfirm();");
  
  // Replace window.confirm for clear draft
  const oldClear = `onClick={() => {
                        if(window.confirm('Clear all drafted data?')) {
                          localStorage.removeItem('draft_purchase_form');
                          setPurchaseForm({ vendorId: '', vendorName: '', date: new Date().toISOString().split('T')[0], reference: '', items: [], paymentAccountId: '', paymentMethod: 'cash', paidAmount: 0, shippingCost: 0, notes: '', createdBy: '' });
                        }
                      }}`;
  const newClear = `onClick={async () => {
                        const isConfirmed = await confirm({ title: 'Clear Draft', message: 'Are you sure you want to clear all drafted data?', isDestructive: true });
                        if(isConfirmed) {
                          localStorage.removeItem('draft_purchase_form');
                          setPurchaseForm({ vendorId: '', vendorName: '', date: new Date().toISOString().split('T')[0], reference: '', items: [], paymentAccountId: '', paymentMethod: 'cash', paidAmount: 0, shippingCost: 0, notes: '', createdBy: '' });
                        }
                      }}`;
  p = p.replace(oldClear, newClear);
  fs.writeFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', p);
}

// 4. Update Orders.tsx (Sales)
let o = fs.readFileSync('src/pages/admin/tabs/sales/Orders.tsx', 'utf8');
if (!o.includes('useConfirm')) {
  o = o.replace(/import \{ db \} from/, "import { useConfirm } from '../../../../context/ConfirmContext';\nimport { db } from");
  o = o.replace(/export const OrdersTab: React\.FC<OrdersTabProps> = \(\{.*?\}\) => \{/s, (match) => match + "\n  const { confirm } = useConfirm();");
  
  // Replace window.confirm for delete order
  const oldDel = `if(window.confirm('Are you sure you want to delete this order?')) handleDeleteOrder(order.id);`;
  const newDel = `confirm({title: 'Delete Order', message: 'Are you sure you want to delete this order?', isDestructive: true}).then(res => { if(res) handleDeleteOrder(order.id); })`;
  o = o.replace(oldDel, newDel);
  
  // Replace window.confirm for delete drafted cart (if it exists)
  // Actually, POS is where sales are drafted. Let's check POS.
  fs.writeFileSync('src/pages/admin/tabs/sales/Orders.tsx', o);
}

console.log('Successfully set up ConfirmContext and updated Purchases');