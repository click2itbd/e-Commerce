import React, { useState } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { useSettings } from '../../../context/SettingsContext';
import { formatCurrency, cn } from '../../../lib/utils';
import { logAudit } from '../../../lib/audit';
import { PaymentAccount } from '../../../types';
import { 
  X, 
  FileText, 
  User, 
  Building2, 
  Calendar, 
  CreditCard, 
  Package, 
  CheckCircle2, 
  Plus, 
  DollarSign,
  AlertCircle
} from 'lucide-react';

interface LegacyDueModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'customer' | 'vendor';
  entities?: { id: string; name: string; phone?: string; address?: string }[];
  customerEntities?: { id: string; name: string; phone?: string; address?: string }[];
  vendorEntities?: { id: string; name: string; phone?: string; address?: string }[];
  initialEntityId?: string;
  paymentAccounts: PaymentAccount[];
  onSuccess: () => void;
}

export const LegacyDueModal: React.FC<LegacyDueModalProps> = ({
  isOpen,
  onClose,
  type,
  entities = [],
  customerEntities,
  vendorEntities,
  initialEntityId,
  paymentAccounts,
  onSuccess,
}) => {
  const { profile, user } = useAuth();
  const { settings } = useSettings();

  const [activeType, setActiveType] = useState<'customer' | 'vendor'>(type);

  // Form states
  const [isNewParty, setIsNewParty] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState(initialEntityId || '');
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyPhone, setNewPartyPhone] = useState('');
  const [newPartyAddress, setNewPartyAddress] = useState('');

  const [billDate, setBillDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [workOrderNumber, setWorkOrderNumber] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [itemsSummary, setItemsSummary] = useState('');
  const [totalAmount, setTotalAmount] = useState<number | ''>('');
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sync state when modal opens or props change
  React.useEffect(() => {
    if (isOpen) {
      setActiveType(type);
      if (initialEntityId) {
        setSelectedEntityId(initialEntityId);
        setIsNewParty(false);
      } else {
        setSelectedEntityId('');
      }
    }
  }, [isOpen, type, initialEntityId]);

  if (!isOpen) return null;

  const isCustomer = activeType === 'customer';
  const partyLabel = isCustomer ? 'Customer' : 'Supplier';

  const effectiveEntities = (customerEntities && vendorEntities)
    ? (isCustomer ? customerEntities : vendorEntities)
    : (entities.length > 0 ? entities : (isCustomer ? customerEntities || [] : vendorEntities || []));

  const totalNum = Number(totalAmount) || 0;
  const paidNum = Number(paidAmount) || 0;
  const netDue = Math.max(0, totalNum - paidNum);

  const resetForm = () => {
    setIsNewParty(false);
    setSelectedEntityId('');
    setNewPartyName('');
    setNewPartyPhone('');
    setNewPartyAddress('');
    setBillDate(new Date().toISOString().split('T')[0]);
    setWorkOrderNumber('');
    setInvoiceNumber('');
    setItemsSummary('');
    setTotalAmount('');
    setPaidAmount('');
    setPaymentAccountId('');
    setNotes('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!totalNum || totalNum <= 0) {
      toast.error('Please enter a valid total bill amount');
      return;
    }

    if (paidNum > totalNum) {
      toast.error('Paid amount cannot exceed total bill amount');
      return;
    }

    if (paidNum > 0 && !paymentAccountId) {
      toast.error('Please select the payment account for the partial payment');
      return;
    }

    let finalEntityId = selectedEntityId;
    let finalEntityName = '';

    if (isNewParty) {
      if (!newPartyName.trim()) {
        toast.error(`Please enter the ${partyLabel.toLowerCase()} name`);
        return;
      }
      finalEntityName = newPartyName.trim();
    } else {
      if (!selectedEntityId) {
        toast.error(`Please select a ${partyLabel.toLowerCase()}`);
        return;
      }
      const existing = effectiveEntities.find(e => e.id === selectedEntityId);
      finalEntityName = existing?.name || partyLabel;
    }

    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      const currentUser = profile?.displayName || user?.displayName || user?.email || 'Admin';

      // 1. If brand new entity, create in Firestore
      if (isNewParty) {
        const collectionName = isCustomer ? 'customers' : 'vendors';
        const partyDoc = await addDoc(collection(db, collectionName), {
          name: finalEntityName,
          phone: newPartyPhone.trim(),
          address: newPartyAddress.trim(),
          createdAt: now,
          createdBy: currentUser,
        });
        finalEntityId = partyDoc.id;
      }

      const formattedBillDate = billDate ? new Date(billDate).toISOString() : now;
      const docNum = (invoiceNumber || workOrderNumber || '').trim();

      // 2. Add Opening Balance (Debit) Transaction
      const descriptionParts: string[] = [];
      if (itemsSummary.trim()) descriptionParts.push(itemsSummary.trim());
      if (workOrderNumber.trim()) descriptionParts.push(`WO: ${workOrderNumber.trim()}`);
      if (invoiceNumber.trim()) descriptionParts.push(`Bill: ${invoiceNumber.trim()}`);
      if (notes.trim()) descriptionParts.push(notes.trim());

      const fullDescription = descriptionParts.length > 0 
        ? descriptionParts.join(' | ') 
        : `Previous outstanding ${partyLabel.toLowerCase()} bill`;

      const openingTxData = {
        type: 'opening_balance',
        entityId: finalEntityId,
        entityName: finalEntityName,
        entityType: isCustomer ? 'customer' : 'vendor',
        amount: totalNum,
        date: formattedBillDate,
        documentNumber: docNum,
        workOrderNumber: workOrderNumber.trim(),
        invoiceNumber: invoiceNumber.trim(),
        itemsSummary: itemsSummary.trim(),
        description: fullDescription,
        notes: notes.trim(),
        isLegacyDue: true,
        createdAt: now,
        createdBy: currentUser,
      };

      await addDoc(collection(db, 'transactions'), openingTxData);

      // 3. If partial payment was made, add Credit Payment Transaction
      if (paidNum > 0) {
        const selAcc = paymentAccounts.find(a => a.id === paymentAccountId);
        const paymentType = isCustomer ? 'payment_received' : 'payment_made';

        const paymentTxData = {
          type: paymentType,
          entityId: finalEntityId,
          entityName: finalEntityName,
          entityType: isCustomer ? 'customer' : 'vendor',
          amount: paidNum,
          date: formattedBillDate,
          paymentAccountId: paymentAccountId,
          paymentMethod: selAcc?.type || selAcc?.name || 'cash',
          documentNumber: docNum,
          description: `Partial payment on legacy bill #${docNum || 'Opening'} (${finalEntityName})`,
          isLegacyDue: true,
          createdAt: now,
          createdBy: currentUser,
        };

        await addDoc(collection(db, 'transactions'), paymentTxData);
      }

      // 4. Log Audit
      await logAudit(
        'CREATE',
        isCustomer ? 'sales' : 'purchases',
        `Recorded legacy ${partyLabel.toLowerCase()} due for "${finalEntityName}": Total ৳${totalNum.toLocaleString()}, Paid ৳${paidNum.toLocaleString()}, Net Due ৳${netDue.toLocaleString()} (Bill #${docNum || 'N/A'}, Date: ${billDate})`,
        openingTxData,
        currentUser
      );

      toast.success(`Legacy due of ${formatCurrency(netDue, settings)} recorded for ${finalEntityName}!`);
      handleClose();
      onSuccess();
    } catch (err: any) {
      console.error('Failed to save legacy due:', err);
      toast.error(err?.message || 'Failed to save legacy due record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-auto flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#081621] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center shadow-md text-white",
              isCustomer ? "bg-indigo-600" : "bg-emerald-600"
            )}>
              <FileText size={18} />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-wide text-white flex items-center gap-2">
                Add Legacy {partyLabel} Due Record
                <span className="text-[10px] font-bold bg-white/10 text-slate-300 border border-white/10 px-2 py-0.5 rounded-full">
                  Previous Outstanding
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Directly record previous bills, work orders, delivered products and due balance without altering inventory stock
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Type Switcher (if both customer and vendor entities provided) */}
        {customerEntities && vendorEntities && (
          <div className="px-6 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
              Party Category:
            </span>
            <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setActiveType('customer');
                  setSelectedEntityId('');
                }}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                  activeType === 'customer'
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <User size={12} /> Customer Due
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveType('vendor');
                  setSelectedEntityId('');
                }}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                  activeType === 'vendor'
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <Building2 size={12} /> Supplier Due
              </button>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto bg-slate-50/50">
          
          {/* Party Selection Section */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                {isCustomer ? <User size={13} className="text-indigo-600" /> : <Building2 size={13} className="text-emerald-600" />}
                {partyLabel} Information
              </span>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setIsNewParty(false)}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all cursor-pointer",
                    !isNewParty ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  Existing {partyLabel}
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewParty(true)}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all cursor-pointer",
                    isNewParty ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  + New {partyLabel}
                </button>
              </div>
            </div>

            {!isNewParty ? (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Select {partyLabel} <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={selectedEntityId}
                  onChange={e => setSelectedEntityId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                >
                  <option value="">-- Choose {partyLabel} --</option>
                  {effectiveEntities.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name} {e.phone ? `(${e.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    {partyLabel} Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={`e.g. ${isCustomer ? 'Rahim Enterprise' : 'Star Tech Ltd'}`}
                    value={newPartyName}
                    onChange={e => setNewPartyName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="01XXXXXXXXX"
                    value={newPartyPhone}
                    onChange={e => setNewPartyPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Address / Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Motijheel, Dhaka"
                    value={newPartyAddress}
                    onChange={e => setNewPartyAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bill & Work Order References */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Calendar size={13} className="text-slate-500" />
              Bill & Work Order Information
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Delivery / Bill Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={billDate}
                  onChange={e => setBillDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Work Order / PO Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. WO-2024-1049"
                  value={workOrderNumber}
                  onChange={e => setWorkOrderNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Invoice / Memo Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. INV-8821 / Memo #55"
                  value={invoiceNumber}
                  onChange={e => setInvoiceNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Delivered Items Details ("কী কী দিলো") */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Package size={13} className="text-slate-500" />
                Delivered Products / Items Details ("কী কী পণ্য দিয়েছিল")
              </span>
              <span className="text-[10px] font-normal text-slate-400">Summarize old items list</span>
            </label>
            <textarea
              rows={2}
              value={itemsSummary}
              onChange={e => setItemsSummary(e.target.value)}
              placeholder="e.g. 5x Dell 24-inch Monitors, 2x APC 650VA UPS, 10x Cat6 Network Cables, Installation & Setup"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
            />
          </div>

          {/* Financials: Total, Paid & Net Due */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <DollarSign size={13} className="text-slate-500" />
              Bill Amount & Outstanding Balance
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Total Bill Amount (৳) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="0.00"
                  value={totalAmount}
                  onChange={e => setTotalAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-mono font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Paid Amount (৳ - Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={paidAmount}
                  onChange={e => setPaidAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="p-3 bg-red-50/80 rounded-xl border border-red-200 flex flex-col justify-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-red-700">
                  Recorded Net Due Balance
                </span>
                <span className="text-lg font-mono font-black text-red-600">
                  {formatCurrency(netDue, settings)}
                </span>
              </div>
            </div>

            {/* Payment Method - Only visible if Paid Amount > 0 */}
            {paidNum > 0 && (
              <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-150">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    {isCustomer ? 'Received Into Account' : 'Paid From Account'} <span className="text-red-500">*</span>
                  </label>
                  <select
                    required={paidNum > 0}
                    value={paymentAccountId}
                    onChange={e => setPaymentAccountId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  >
                    <option value="">-- Select Payment Account --</option>
                    {paymentAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.type || 'account'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Partial Payment Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Paid in cash at delivery"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:bg-white outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all font-bold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !totalNum}
              className={cn(
                "px-6 py-2.5 text-white rounded-xl font-bold text-xs transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50",
                isCustomer ? "bg-indigo-600 hover:bg-indigo-700" : "bg-emerald-600 hover:bg-emerald-700"
              )}
            >
              <CheckCircle2 size={16} />
              {submitting ? 'Recording Due...' : `Record Legacy ${partyLabel} Due`}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default LegacyDueModal;
