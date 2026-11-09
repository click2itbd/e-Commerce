import React, { useState, useEffect, useMemo } from 'react';
import { db, storage } from '../../../../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ChequeRecord, PaymentAccount, Vendor, Transaction } from '../../../../types';
import { 
  issueCheque, 
  updateCheque,
  deleteCheque,
  markChequeAsCleared, 
  markChequeAsBounced, 
  cancelCheque,
  getChequeDaysRemaining 
} from '../../../../services/chequeService';
import { calculateAccountBalance } from '../../../../lib/accountBalance';
import { useSettings } from '../../../../context/SettingsContext';
import { useAuth } from '../../../../context/AuthContext';
import { formatCurrency, cn } from '../../../../lib/utils';
import { numberToWords } from '../../../../lib/pdf';
import { toast } from 'react-hot-toast';
import { 
  CreditCard, 
  Search, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Building2, 
  RefreshCw, 
  FileText, 
  DollarSign, 
  AlertCircle,
  Ban,
  Eye,
  Printer,
  Download,
  Edit2,
  Trash2,
  Paperclip,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  Filter,
  Check,
  ChevronDown
} from 'lucide-react';

export default function ChequeTracker() {
  const { settings } = useSettings();
  const { user } = useAuth();
  
  const [cheques, setCheques] = useState<ChequeRecord[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'due_soon' | 'cleared' | 'bounced' | 'cancelled'>('all');
  const [bankFilter, setBankFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'overdue' | 'today' | 'this_week' | 'this_month'>('all');

  // Modals
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showBounceModal, setShowBounceModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewingCheque, setViewingCheque] = useState<ChequeRecord | null>(null);
  const [activeCheque, setActiveCheque] = useState<ChequeRecord | null>(null);

  // Modal form states
  const [issueForm, setIssueForm] = useState({
    chequeNumber: '',
    vendorId: '',
    vendorName: '',
    payeeName: '',
    amount: '',
    bankAccountId: '',
    purchaseId: '',
    purchaseNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    clearingDate: new Date().toISOString().split('T')[0],
    notes: '',
    attachmentUrl: '',
  });

  const [editForm, setEditForm] = useState({
    id: '',
    chequeNumber: '',
    vendorId: '',
    vendorName: '',
    payeeName: '',
    amount: '',
    bankAccountId: '',
    issueDate: '',
    clearingDate: '',
    notes: '',
    attachmentUrl: '',
  });

  const [clearDate, setClearDate] = useState(new Date().toISOString().split('T')[0]);
  const [clearNote, setClearNote] = useState('');
  const [bounceReason, setBounceReason] = useState('Insufficient Funds');
  const [customBounceReason, setCustomBounceReason] = useState('');
  const [bounceFee, setBounceFee] = useState<string>('0');
  const [cancelReason, setCancelReason] = useState('');
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Real-time Firestore Listeners
  useEffect(() => {
    setLoading(true);
    const unsubCheques = onSnapshot(
      query(collection(db, 'cheques'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const list: ChequeRecord[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChequeRecord));
        setCheques(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching cheques:', err);
        setLoading(false);
      }
    );

    const unsubAccounts = onSnapshot(collection(db, 'payment_accounts'), (snapshot) => {
      setPaymentAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentAccount)));
    });

    const unsubVendors = onSnapshot(collection(db, 'vendors'), (snapshot) => {
      setVendors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vendor)));
    });

    const unsubTx = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    });

    const unsubPurchases = onSnapshot(collection(db, 'purchases'), (snapshot) => {
      setPurchases(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubCheques();
      unsubAccounts();
      unsubVendors();
      unsubTx();
      unsubPurchases();
    };
  }, []);

  // Bank accounts with graceful fallback
  const bankAccounts = useMemo(() => {
    const banks = paymentAccounts.filter(a => a.type === 'bank' || a.name.toLowerCase().includes('bank'));
    return banks.length > 0 ? banks : paymentAccounts;
  }, [paymentAccounts]);

  // Purchases for selected vendor in Issue modal
  const vendorPendingPurchases = useMemo(() => {
    if (!issueForm.vendorId) return [];
    return purchases.filter(p => {
      if (p.vendorId !== issueForm.vendorId) return false;
      const total = Number(p.total) || 0;
      const paid = Number(p.paidAmount) || 0;
      return paid < total || p.paymentStatus === 'due' || p.paymentStatus === 'partial';
    });
  }, [purchases, issueForm.vendorId]);

  // Filtered Cheques
  const filteredCheques = useMemo(() => {
    return cheques.filter(ch => {
      // Search
      const search = searchQuery.toLowerCase().trim();
      const matchSearch = !search || 
        (ch.chequeNumber || '').toLowerCase().includes(search) ||
        (ch.vendorName || '').toLowerCase().includes(search) ||
        (ch.payeeName || '').toLowerCase().includes(search) ||
        (ch.bankAccountName || '').toLowerCase().includes(search) ||
        (ch.purchaseNumber || '').toLowerCase().includes(search) ||
        (ch.notes || '').toLowerCase().includes(search);

      if (!matchSearch) return false;

      // Bank Filter
      if (bankFilter !== 'all' && ch.bankAccountId !== bankFilter) {
        return false;
      }

      // Date timeframe filter
      if (dateFilter !== 'all') {
        const days = getChequeDaysRemaining(ch.clearingDate);
        if (dateFilter === 'overdue' && (days >= 0 || ch.status !== 'pending')) return false;
        if (dateFilter === 'today' && days !== 0) return false;
        if (dateFilter === 'this_week' && (days < 0 || days > 7)) return false;
        if (dateFilter === 'this_month' && (days < 0 || days > 30)) return false;
      }

      // Status Filter
      if (statusFilter === 'all') return true;
      if (statusFilter === 'due_soon') {
        if (ch.status !== 'pending') return false;
        const days = getChequeDaysRemaining(ch.clearingDate);
        return days <= 3; // today, overdue or within next 3 days
      }
      return ch.status === statusFilter;
    });
  }, [cheques, searchQuery, statusFilter, bankFilter, dateFilter]);

  // Metrics
  const metrics = useMemo(() => {
    let pendingCount = 0;
    let pendingTotal = 0;
    let dueSoonCount = 0;
    let dueSoonTotal = 0;
    let clearedCount = 0;
    let clearedTotal = 0;
    let bouncedCount = 0;
    let bouncedTotal = 0;
    let shortfallAlerts = 0;

    cheques.forEach(ch => {
      const amt = Number(ch.amount) || 0;
      if (ch.status === 'pending') {
        pendingCount++;
        pendingTotal += amt;
        const days = getChequeDaysRemaining(ch.clearingDate);
        if (days <= 3) {
          dueSoonCount++;
          dueSoonTotal += amt;
        }

        // Check if bank balance is insufficient
        const acc = paymentAccounts.find(a => a.id === ch.bankAccountId);
        if (acc) {
          const bal = calculateAccountBalance(acc, transactions);
          if (bal < amt && days <= 3) {
            shortfallAlerts++;
          }
        }
      } else if (ch.status === 'cleared') {
        clearedCount++;
        clearedTotal += amt;
      } else if (ch.status === 'bounced') {
        bouncedCount++;
        bouncedTotal += amt;
      }
    });

    return {
      pendingCount,
      pendingTotal,
      dueSoonCount,
      dueSoonTotal,
      clearedCount,
      clearedTotal,
      bouncedCount,
      bouncedTotal,
      shortfallAlerts
    };
  }, [cheques, paymentAccounts, transactions]);

  // Cheque Leaf photo upload
  const handleChequeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB!');
      return;
    }
    try {
      setUploadingAttachment(true);
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storageRef = ref(storage, `cheques/${Date.now()}_${safeName}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      if (isEdit) {
        setEditForm(prev => ({ ...prev, attachmentUrl: downloadUrl }));
      } else {
        setIssueForm(prev => ({ ...prev, attachmentUrl: downloadUrl }));
      }
      toast.success('Cheque leaf photo uploaded!');
    } catch (err) {
      console.error('Cheque upload failed:', err);
      toast.error('Failed to upload image!');
    } finally {
      setUploadingAttachment(false);
      e.target.value = '';
    }
  };

  // Handle Issue Cheque
  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueForm.chequeNumber.trim()) {
      toast.error('Please enter the cheque number.');
      return;
    }
    const amt = Number(issueForm.amount);
    if (!amt || amt <= 0) {
      toast.error('Please enter a valid cheque amount.');
      return;
    }
    if (!issueForm.bankAccountId) {
      toast.error('Please select the issuing bank account.');
      return;
    }

    const selAcc = paymentAccounts.find(a => a.id === issueForm.bankAccountId);
    setSubmitting(true);
    try {
      await issueCheque({
        chequeNumber: issueForm.chequeNumber,
        amount: amt,
        bankAccountId: issueForm.bankAccountId,
        bankAccountName: selAcc?.name || 'Bank',
        bankName: (selAcc as any)?.bankName || selAcc?.name || 'Bank',
        vendorId: issueForm.vendorId || '',
        vendorName: issueForm.vendorName || issueForm.payeeName || 'Vendor',
        payeeName: issueForm.payeeName || issueForm.vendorName || '',
        purchaseId: issueForm.purchaseId || '',
        purchaseNumber: issueForm.purchaseNumber || '',
        issueDate: issueForm.issueDate,
        clearingDate: issueForm.clearingDate,
        notes: issueForm.notes,
        attachmentUrl: issueForm.attachmentUrl || '',
        user: user?.displayName || user?.email || 'Admin',
      });

      toast.success(`Cheque #${issueForm.chequeNumber.toUpperCase()} issued successfully!`);
      setShowIssueModal(false);
      setIssueForm({
        chequeNumber: '',
        vendorId: '',
        vendorName: '',
        payeeName: '',
        amount: '',
        bankAccountId: '',
        purchaseId: '',
        purchaseNumber: '',
        issueDate: new Date().toISOString().split('T')[0],
        clearingDate: new Date().toISOString().split('T')[0],
        notes: '',
        attachmentUrl: '',
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Failed to issue cheque');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Edit Cheque
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.id) return;
    if (!editForm.chequeNumber.trim()) {
      toast.error('Please enter cheque number.');
      return;
    }
    const amt = Number(editForm.amount);
    if (!amt || amt <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }
    const selAcc = paymentAccounts.find(a => a.id === editForm.bankAccountId);
    setSubmitting(true);
    try {
      await updateCheque({
        id: editForm.id,
        chequeNumber: editForm.chequeNumber,
        amount: amt,
        bankAccountId: editForm.bankAccountId,
        bankAccountName: selAcc?.name || 'Bank',
        bankName: (selAcc as any)?.bankName || selAcc?.name || 'Bank',
        vendorId: editForm.vendorId || '',
        vendorName: editForm.vendorName || editForm.payeeName || '',
        payeeName: editForm.payeeName || editForm.vendorName || '',
        issueDate: editForm.issueDate,
        clearingDate: editForm.clearingDate,
        notes: editForm.notes,
        attachmentUrl: editForm.attachmentUrl,
        user: user?.displayName || user?.email || 'Admin',
      });
      toast.success(`Cheque #${editForm.chequeNumber} updated successfully!`);
      setShowEditModal(false);
      if (viewingCheque && viewingCheque.id === editForm.id) {
        setViewingCheque(prev => prev ? ({ ...prev, ...editForm, amount: amt } as any) : null);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Failed to update cheque');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Cheque
  const handleDeleteCheque = async (ch: ChequeRecord) => {
    if (!window.confirm(`Are you sure you want to delete Cheque #${ch.chequeNumber}? This cannot be undone.`)) return;
    try {
      await deleteCheque(ch.id, user?.displayName || user?.email || 'Admin', ch.chequeNumber);
      toast.success(`Cheque #${ch.chequeNumber} deleted.`);
      if (viewingCheque?.id === ch.id) setViewingCheque(null);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to delete cheque');
    }
  };

  // Handle Mark Cleared
  const handleClearSubmit = async () => {
    if (!activeCheque) return;
    setSubmitting(true);
    try {
      await markChequeAsCleared({
        cheque: activeCheque,
        clearingDate: clearDate,
        user: user?.displayName || user?.email || 'Admin',
        note: clearNote,
      });
      toast.success(`Cheque #${activeCheque.chequeNumber} marked as Cleared / Paid!`);
      setShowClearModal(false);
      if (viewingCheque?.id === activeCheque.id) {
        setViewingCheque(prev => prev ? ({ ...prev, status: 'cleared', clearedAt: new Date().toISOString() }) : null);
      }
      setActiveCheque(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Failed to mark cheque as cleared');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Mark Bounced
  const handleBounceSubmit = async () => {
    if (!activeCheque) return;
    const reason = bounceReason === 'Other / Custom' ? customBounceReason.trim() : bounceReason;
    if (!reason) {
      toast.error('Please specify the bounce reason.');
      return;
    }
    setSubmitting(true);
    try {
      await markChequeAsBounced({
        cheque: activeCheque,
        bounceReason: reason,
        bounceFee: Number(bounceFee) || 0,
        user: user?.displayName || user?.email || 'Admin',
      });
      toast.error(`Cheque #${activeCheque.chequeNumber} marked as Bounced. Vendor due restored!`);
      setShowBounceModal(false);
      if (viewingCheque?.id === activeCheque.id) {
        setViewingCheque(prev => prev ? ({ ...prev, status: 'bounced', bounceReason: reason }) : null);
      }
      setActiveCheque(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Failed to record bounce');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Cancel Cheque
  const handleCancelSubmit = async () => {
    if (!activeCheque) return;
    if (!cancelReason.trim()) {
      toast.error('Please enter a cancellation reason.');
      return;
    }
    setSubmitting(true);
    try {
      await cancelCheque({
        cheque: activeCheque,
        reason: cancelReason,
        user: user?.displayName || user?.email || 'Admin',
      });
      toast.success(`Cheque #${activeCheque.chequeNumber} has been cancelled.`);
      setShowCancelModal(false);
      if (viewingCheque?.id === activeCheque.id) {
        setViewingCheque(prev => prev ? ({ ...prev, status: 'cancelled', cancelReason }) : null);
      }
      setActiveCheque(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Failed to cancel cheque');
    } finally {
      setSubmitting(false);
    }
  };

  // Print Cheque Payment Voucher
  const printChequeVoucher = (cheque: ChequeRecord) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocked! Please allow pop-ups to print cheque voucher.');
      return;
    }
    const amountWords = numberToWords(Number(cheque.amount) || 0) + ' Taka Only';
    const companyName = settings?.storeName || settings?.siteName || 'CLICK 2 IT';
    const companyAddress = settings?.address || 'Dhaka, Bangladesh';
    const companyPhone = settings?.phone || '';
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cheque Voucher - #${cheque.chequeNumber}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 25px; color: #1e293b; font-size: 13px; line-height: 1.4; }
            .voucher-container { max-width: 800px; margin: 0 auto; border: 2px solid #0f172a; padding: 25px; border-radius: 8px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #cbd5e1; padding-bottom: 15px; margin-bottom: 20px; }
            .company-title { font-size: 22px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
            .voucher-badge { background: #0f172a; color: #fff; padding: 6px 14px; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; border-radius: 4px; display: inline-block; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
            .field-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; }
            .label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 3px; }
            .value { font-size: 13px; font-weight: 700; color: #0f172a; }
            .amount-box { background: #ecfdf5; border: 2px solid #10b981; border-radius: 8px; padding: 15px; margin: 20px 0; display: flex; justify-content: space-between; align-items: center; }
            .amount-number { font-size: 24px; font-weight: 900; color: #065f46; font-family: monospace; }
            .amount-words { font-size: 13px; font-weight: 700; color: #047857; margin-top: 4px; text-transform: capitalize; }
            .status-stamp { display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: 800; font-size: 11px; text-transform: uppercase; }
            .signatures { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-top: 60px; padding-top: 15px; }
            .sig-line { border-top: 1px solid #475569; text-align: center; font-size: 11px; font-weight: 700; color: #475569; padding-top: 6px; }
            @media print { body { padding: 0; } .voucher-container { border: 1px solid #000; } }
          </style>
        </head>
        <body>
          <div class="voucher-container">
            <div class="header">
              <div>
                <div class="company-title">${companyName}</div>
                <div style="color: #64748b; font-size: 11px; margin-top: 3px;">${companyAddress} ${companyPhone ? `• Phone: ${companyPhone}` : ''}</div>
              </div>
              <div style="text-align: right;">
                <div class="voucher-badge">Bank Cheque Voucher</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 5px;">Voucher Date: ${new Date().toLocaleDateString()}</div>
              </div>
            </div>

            <div class="grid">
              <div class="field-box">
                <div class="label">Cheque Number</div>
                <div class="value" style="font-family: monospace; font-size: 16px; color: #2563eb;">#${cheque.chequeNumber}</div>
              </div>
              <div class="field-box">
                <div class="label">Issuing Bank & Account</div>
                <div class="value">${cheque.bankAccountName || cheque.bankName || 'Bank Account'}</div>
              </div>
              <div class="field-box">
                <div class="label">Issue Date</div>
                <div class="value">${cheque.issueDate}</div>
              </div>
              <div class="field-box">
                <div class="label">Clearing / Maturity Date (PDC)</div>
                <div class="value" style="color: #b91c1c;">${cheque.clearingDate}</div>
              </div>
              <div class="field-box">
                <div class="label">Payee / Beneficiary Name</div>
                <div class="value">${cheque.payeeName || cheque.vendorName || '—'}</div>
              </div>
              <div class="field-box">
                <div class="label">Linked Purchase Bill / Ref</div>
                <div class="value">${cheque.purchaseNumber ? `Purchase #${cheque.purchaseNumber}` : (cheque.notes || 'Direct Payment')}</div>
              </div>
            </div>

            <div class="amount-box">
              <div>
                <div class="label" style="color: #065f46;">Payment Amount (BDT)</div>
                <div class="amount-number">BDT ${Number(cheque.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                <div class="amount-words">In Words: ${amountWords}</div>
              </div>
              <div style="text-align: right;">
                <span class="status-stamp" style="background: ${cheque.status === 'cleared' ? '#d1fae5; color: #065f46;' : cheque.status === 'bounced' ? '#fee2e2; color: #991b1b;' : '#fef3c7; color: #92400e;'}">
                  ${cheque.status.toUpperCase()}
                </span>
              </div>
            </div>

            ${cheque.notes ? `
            <div style="background: #f1f5f9; padding: 10px 14px; border-radius: 6px; font-size: 12px; margin-bottom: 20px;">
              <strong>Particulars / Purpose:</strong> ${cheque.notes}
            </div>` : ''}

            <div class="signatures">
              <div class="sig-line">Prepared By</div>
              <div class="sig-line">Checked By</div>
              <div class="sig-line">Manager / Director</div>
              <div class="sig-line">Receiver's Signature</div>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  // Print filtered register
  const printRegister = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocked! Please allow pop-ups to print register.');
      return;
    }
    const rows = filteredCheques.map((ch, idx) => `
      <tr>
        <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">${idx + 1}</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold;">${ch.chequeNumber}</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">${ch.payeeName || ch.vendorName || '—'}</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1;">${ch.bankAccountName || 'Bank'}</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1;">${ch.issueDate}</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">${ch.clearingDate}</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold;">৳${Number(ch.amount).toLocaleString()}</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center; text-transform: uppercase; font-weight: bold;">${ch.status}</td>
      </tr>
    `).join('');

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cheque Register Report - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: sans-serif; font-size: 11px; margin: 20px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px; text-transform: uppercase; font-size: 10px; }
            h2 { margin: 0 0 4px 0; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <h2>${settings?.storeName || 'CLICK 2 IT'} — Cheque Clearance Register</h2>
          <p style="margin: 0; color: #64748b;">Generated on: ${new Date().toLocaleString()} • Total Records: ${filteredCheques.length}</p>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Cheque No</th>
                <th>Payee / Supplier</th>
                <th>Bank Account</th>
                <th>Issue Date</th>
                <th>Clearing Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(content);
    printWindow.document.close();
  };

  // Export CSV
  const exportCSV = () => {
    if (filteredCheques.length === 0) {
      toast.error('No cheque records to export!');
      return;
    }
    const headers = ['Cheque Number', 'Status', 'Payee / Vendor', 'Bank Account', 'Issue Date', 'Clearing Date', 'Amount (BDT)', 'Purchase Bill #', 'Notes'];
    const rows = filteredCheques.map(ch => [
      `"${ch.chequeNumber}"`,
      `"${ch.status}"`,
      `"${ch.payeeName || ch.vendorName || ''}"`,
      `"${ch.bankAccountName || ''}"`,
      `"${ch.issueDate}"`,
      `"${ch.clearingDate}"`,
      ch.amount,
      `"${ch.purchaseNumber || ''}"`,
      `"${(ch.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cheque_register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Cheque register exported to CSV!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <CreditCard size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Cheque Tracker & Clearance Register
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Track vendor and purchase cheque clearance, maturity dates, bounce reconciliation, and bank liquidity alerts
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={printRegister}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all cursor-pointer"
            title="Print Cheque Register"
          >
            <Printer size={15} />
            <span>Print Register</span>
          </button>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all cursor-pointer"
            title="Export CSV"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              setIssueForm({
                chequeNumber: '',
                vendorId: '',
                vendorName: '',
                payeeName: '',
                amount: '',
                bankAccountId: bankAccounts[0]?.id || '',
                purchaseId: '',
                purchaseNumber: '',
                issueDate: new Date().toISOString().split('T')[0],
                clearingDate: new Date().toISOString().split('T')[0],
                notes: '',
                attachmentUrl: '',
              });
              setShowIssueModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Issue New Cheque</span>
          </button>
        </div>
      </div>

      {/* Insufficient Balance Critical Banner */}
      {metrics.shortfallAlerts > 0 && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-start gap-3 text-red-900 animate-pulse">
          <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-extrabold text-sm text-red-800">
              ⚠️ Insufficient Bank Balance Alert ({metrics.shortfallAlerts} cheque(s) at risk!)
            </h4>
            <p className="text-xs text-red-700 mt-0.5">
              One or more cheques maturing within the next 3 days exceed current bank account balances. Please deposit or transfer funds immediately to prevent cheque bounces.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Card */}
        <div 
          onClick={() => setStatusFilter('pending')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'pending'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/20'
              : 'bg-white border-slate-200/80 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              Pending Clearance
            </span>
            <span className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <Clock size={16} />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {formatCurrency(metrics.pendingTotal, settings)}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            {metrics.pendingCount} cheques awaiting clearance
          </div>
        </div>

        {/* Due Soon / Today Card */}
        <div 
          onClick={() => setStatusFilter('due_soon')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'due_soon'
              ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-400/20'
              : 'bg-white border-slate-200/80 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>Due in 3 Days</span>
              {metrics.dueSoonCount > 0 && (
                <span className="px-1.5 py-0.5 bg-rose-600 text-white text-[10px] rounded-full font-black">
                  {metrics.dueSoonCount}
                </span>
              )}
            </span>
            <span className="p-2 bg-rose-100 text-rose-700 rounded-xl">
              <Calendar size={16} />
            </span>
          </div>
          <div className="text-2xl font-black text-rose-900">
            {formatCurrency(metrics.dueSoonTotal, settings)}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            Clearing today or within next 3 days
          </div>
        </div>

        {/* Cleared Card */}
        <div 
          onClick={() => setStatusFilter('cleared')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'cleared'
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400/20'
              : 'bg-white border-slate-200/80 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Cleared / Paid
            </span>
            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <CheckCircle2 size={16} />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-950">
            {formatCurrency(metrics.clearedTotal, settings)}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            {metrics.clearedCount} cheques successfully cleared
          </div>
        </div>

        {/* Bounced Card */}
        <div 
          onClick={() => setStatusFilter('bounced')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'bounced'
              ? 'bg-red-50/80 border-red-300 ring-2 ring-red-400/20'
              : 'bg-white border-slate-200/80 hover:border-red-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-red-800 uppercase tracking-wider">
              Bounced Cheques
            </span>
            <span className="p-2 bg-red-100 text-red-700 rounded-xl">
              <XCircle size={16} />
            </span>
          </div>
          <div className="text-2xl font-black text-red-900">
            {formatCurrency(metrics.bouncedTotal, settings)}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            {metrics.bouncedCount} bounced (vendor dues restored)
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full lg:w-auto p-1 bg-slate-100/80 rounded-xl text-xs font-bold text-slate-600">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              All ({cheques.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'pending' ? 'bg-white text-amber-700 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Pending ({metrics.pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('due_soon')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                statusFilter === 'due_soon' ? 'bg-white text-rose-700 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              <span>Due in 3 Days</span>
              {metrics.dueSoonCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              )}
            </button>
            <button
              onClick={() => setStatusFilter('cleared')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'cleared' ? 'bg-white text-emerald-700 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Cleared ({metrics.clearedCount})
            </button>
            <button
              onClick={() => setStatusFilter('bounced')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'bounced' ? 'bg-white text-red-700 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Bounced ({metrics.bouncedCount})
            </button>
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'cancelled' ? 'bg-white text-slate-700 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Cancelled
            </button>
          </div>

          {/* Bank & Date Range Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All Dates</option>
              <option value="overdue">Overdue Cheques</option>
              <option value="today">Due Today</option>
              <option value="this_week">Due in Next 7 Days</option>
              <option value="this_month">Due in Next 30 Days</option>
            </select>

            <select
              value={bankFilter}
              onChange={e => setBankFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All Bank Accounts</option>
              {bankAccounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Field */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by Cheque No, Supplier name, Purchase Bill #, or Bank..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Cheques Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Cheque No</th>
                <th className="py-3.5 px-4">Payee / Supplier</th>
                <th className="py-3.5 px-4">Bank Account</th>
                <th className="py-3.5 px-4">Issue Date</th>
                <th className="py-3.5 px-4">Clearing (PDC) Date</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="animate-spin inline mr-2" size={18} />
                    Loading cheques register...
                  </td>
                </tr>
              ) : filteredCheques.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <CreditCard className="inline-block mx-auto mb-2 text-slate-300" size={36} />
                    <p className="font-bold text-slate-600 text-sm">No Cheque Records Found</p>
                    <p className="text-xs text-slate-400 mt-1">Issue a new cheque or record a purchase using Cheque/PDC payment.</p>
                  </td>
                </tr>
              ) : (
                filteredCheques.map(ch => {
                  const days = getChequeDaysRemaining(ch.clearingDate);
                  const isPending = ch.status === 'pending';
                  const isCleared = ch.status === 'cleared';
                  const isBounced = ch.status === 'bounced';
                  const isCancelled = ch.status === 'cancelled';

                  // Account balance & sufficiency
                  const acc = paymentAccounts.find(a => a.id === ch.bankAccountId);
                  const currentBal = acc ? calculateAccountBalance(acc, transactions) : 0;
                  const isShortfall = isPending && currentBal < ch.amount;

                  return (
                    <tr 
                      key={ch.id} 
                      onClick={() => setViewingCheque(ch)}
                      className={`hover:bg-slate-50/70 transition-colors cursor-pointer ${
                        isShortfall && days <= 3 ? 'bg-red-50/30' : ''
                      }`}
                    >
                      {/* Cheque No */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <CreditCard size={14} className="text-indigo-600 shrink-0" />
                          <span className="hover:text-indigo-600 underline-offset-2">{ch.chequeNumber}</span>
                          {ch.attachmentUrl && (
                            <span title="Cheque photo attached" className="p-0.5 text-blue-500 bg-blue-50 rounded">
                              <Paperclip size={10} />
                            </span>
                          )}
                        </div>
                        {ch.purchaseNumber && (
                          <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                            Bill #{ch.purchaseNumber}
                          </div>
                        )}
                      </td>

                      {/* Payee / Supplier */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {ch.payeeName || ch.vendorName || '—'}
                        </div>
                        {ch.notes && (
                          <div className="text-[10px] text-slate-500 italic max-w-xs truncate">
                            {ch.notes}
                          </div>
                        )}
                      </td>

                      {/* Bank Account */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          <Building2 size={13} className="text-slate-400" />
                          <span>{ch.bankAccountName || ch.bankName || 'Bank Account'}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Bal: <span className="font-mono font-bold">{formatCurrency(currentBal, settings)}</span>
                        </div>
                      </td>

                      {/* Issue Date */}
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {ch.issueDate}
                      </td>

                      {/* Clearing (PDC) Date */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {ch.clearingDate}
                        </div>
                        {isPending && (
                          <div className="mt-0.5">
                            {days < 0 ? (
                              <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                                Overdue ({Math.abs(days)}d)
                              </span>
                            ) : days === 0 ? (
                              <span className="text-[10px] font-black text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded animate-pulse">
                                Due Today!
                              </span>
                            ) : days === 1 ? (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                Due Tomorrow
                              </span>
                            ) : days <= 3 ? (
                              <span className="text-[10px] font-semibold text-amber-700">
                                In {days} days
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">
                                In {days} days
                              </span>
                            )}
                          </div>
                        )}
                        {isCleared && ch.clearedAt && (
                          <div className="text-[10px] text-emerald-600 mt-0.5">
                            Cleared: {new Date(ch.clearedAt).toLocaleDateString()}
                          </div>
                        )}
                        {isBounced && ch.bouncedAt && (
                          <div className="text-[10px] text-red-600 mt-0.5">
                            Bounced: {new Date(ch.bouncedAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-mono font-extrabold text-slate-900 text-sm">
                          {formatCurrency(ch.amount, settings)}
                        </div>
                        {isShortfall && (
                          <div className="text-[10px] font-bold text-red-600 flex items-center justify-end gap-1 mt-0.5">
                            <AlertCircle size={10} />
                            <span>Shortfall: {formatCurrency(ch.amount - currentBal, settings)}</span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock size={11} /> Pending
                          </span>
                        )}
                        {isCleared && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 size={11} /> Cleared
                          </span>
                        )}
                        {isBounced && (
                          <span 
                            title={ch.bounceReason || 'Bounced'}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200 cursor-help"
                          >
                            <XCircle size={11} /> Bounced
                          </span>
                        )}
                        {isCancelled && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            <Ban size={11} /> Cancelled
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingCheque(ch)}
                            title="View Voucher"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => printChequeVoucher(ch)}
                            title="Print Cheque Voucher"
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-all"
                          >
                            <Printer size={14} />
                          </button>

                          {isPending && (
                            <>
                              <button
                                onClick={() => {
                                  setActiveCheque(ch);
                                  setClearDate(new Date().toISOString().split('T')[0]);
                                  setShowClearModal(true);
                                }}
                                title="Mark Cleared"
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <CheckCircle2 size={12} />
                                <span>Clear</span>
                              </button>
                              <button
                                onClick={() => {
                                  setActiveCheque(ch);
                                  setBounceReason('Insufficient Funds');
                                  setBounceFee('0');
                                  setShowBounceModal(true);
                                }}
                                title="Mark Bounced"
                                className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <XCircle size={12} />
                                <span>Bounce</span>
                              </button>
                              <button
                                onClick={() => {
                                  setEditForm({
                                    id: ch.id,
                                    chequeNumber: ch.chequeNumber,
                                    vendorId: ch.vendorId || '',
                                    vendorName: ch.vendorName || '',
                                    payeeName: ch.payeeName || '',
                                    amount: String(ch.amount),
                                    bankAccountId: ch.bankAccountId,
                                    issueDate: ch.issueDate,
                                    clearingDate: ch.clearingDate,
                                    notes: ch.notes || '',
                                    attachmentUrl: ch.attachmentUrl || '',
                                  });
                                  setShowEditModal(true);
                                }}
                                title="Edit Cheque"
                                className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  setActiveCheque(ch);
                                  setCancelReason('');
                                  setShowCancelModal(true);
                                }}
                                title="Cancel Cheque"
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all"
                              >
                                <Ban size={14} />
                              </button>
                            </>
                          )}

                          {(isCancelled || isPending) && (
                            <button
                              onClick={() => handleDeleteCheque(ch)}
                              title="Delete Cheque"
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* -------------------- MODAL: VIEW CHEQUE VOUCHER / SLIP -------------------- */}
      {viewingCheque && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-indigo-700 font-black text-base">
                <CreditCard size={20} />
                <span>Cheque Voucher Details</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => printChequeVoucher(viewingCheque)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Printer size={14} /> Print Voucher
                </button>
                <button 
                  onClick={() => setViewingCheque(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg text-lg"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Stylized Realistic Bank Cheque UI Preview */}
            <div className="relative p-6 rounded-2xl bg-gradient-to-br from-amber-50/90 via-emerald-50/40 to-slate-50 border-2 border-slate-300 shadow-md space-y-4">
              {/* Status Stamp */}
              <div className="absolute right-6 top-6">
                <span className={cn(
                  "px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider border-2 shadow-xs",
                  viewingCheque.status === 'cleared' ? "border-emerald-600 text-emerald-800 bg-emerald-100/90 rotate-[-4deg]" :
                  viewingCheque.status === 'bounced' ? "border-red-600 text-red-800 bg-red-100/90 rotate-[-4deg]" :
                  viewingCheque.status === 'cancelled' ? "border-slate-500 text-slate-700 bg-slate-200 rotate-[-4deg]" :
                  "border-amber-500 text-amber-800 bg-amber-100/90 rotate-[-4deg]"
                )}>
                  {viewingCheque.status.toUpperCase()}
                </span>
              </div>

              {/* Bank Name & Cheque Number */}
              <div className="flex items-start justify-between pr-28">
                <div>
                  <div className="font-extrabold text-slate-900 text-base uppercase tracking-wider flex items-center gap-2">
                    <Building2 size={18} className="text-indigo-600" />
                    <span>{viewingCheque.bankAccountName || viewingCheque.bankName || 'Bank Account'}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Cheque No: <strong>{viewingCheque.chequeNumber}</strong>
                  </div>
                </div>
              </div>

              {/* Payee & Dates */}
              <div className="space-y-3 pt-2">
                <div className="border-b border-dashed border-slate-300 pb-1 flex items-baseline justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pay To:</span>
                  <span className="text-base font-black text-slate-900">{viewingCheque.payeeName || viewingCheque.vendorName || 'Self / Cash'}</span>
                </div>

                <div className="border-b border-dashed border-slate-300 pb-1 flex items-baseline justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Amount in Words:</span>
                  <span className="text-xs font-bold text-emerald-800 italic">
                    {numberToWords(Number(viewingCheque.amount))} Taka Only
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Issue Date</span>
                    <span className="font-bold text-slate-800 text-xs">{viewingCheque.issueDate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Clearing / Maturity (PDC)</span>
                    <span className="font-black text-rose-700 text-xs">{viewingCheque.clearingDate}</span>
                  </div>
                </div>
              </div>

              {/* Amount Box */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-300">
                <div className="text-[10px] text-slate-400 font-mono tracking-widest">
                  ⑈ {viewingCheque.chequeNumber} ⑈ 001293849 ⑈
                </div>
                <div className="bg-white px-4 py-2 rounded-xl border-2 border-slate-400 font-mono font-black text-lg text-slate-900 shadow-inner">
                  {formatCurrency(viewingCheque.amount, settings)}
                </div>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Linked Purchase</span>
                <span className="font-bold text-slate-800">
                  {viewingCheque.purchaseNumber ? `Purchase Bill #${viewingCheque.purchaseNumber}` : 'Direct Cheque (No Purchase)'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Issued By</span>
                <span className="font-bold text-slate-800">{viewingCheque.createdBy || 'Admin'}</span>
              </div>
              {viewingCheque.clearedAt && (
                <div>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase block">Cleared Date & Time</span>
                  <span className="font-bold text-emerald-800">{new Date(viewingCheque.clearedAt).toLocaleString()}</span>
                </div>
              )}
              {viewingCheque.bouncedAt && (
                <div>
                  <span className="text-[10px] font-bold text-red-600 uppercase block">Bounced Date & Reason</span>
                  <span className="font-bold text-red-800">{new Date(viewingCheque.bouncedAt).toLocaleString()} ({viewingCheque.bounceReason})</span>
                </div>
              )}
              {viewingCheque.cancelReason && (
                <div className="col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Cancellation Reason</span>
                  <span className="font-medium text-slate-700">{viewingCheque.cancelReason}</span>
                </div>
              )}
              {viewingCheque.notes && (
                <div className="col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Notes / Purpose</span>
                  <span className="font-medium text-slate-700">{viewingCheque.notes}</span>
                </div>
              )}
            </div>

            {/* Cheque Attachment Preview */}
            {viewingCheque.attachmentUrl && (
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Paperclip size={14} className="text-blue-600" />
                    <span>Cheque Leaf Photo</span>
                  </span>
                  <a
                    href={viewingCheque.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    View Original <ExternalLink size={12} />
                  </a>
                </div>
                <div className="max-h-48 overflow-hidden rounded-xl bg-white border border-slate-200 flex items-center justify-center p-2">
                  <img
                    src={viewingCheque.attachmentUrl}
                    alt="Cheque Leaf"
                    className="max-h-44 object-contain rounded"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons in View Modal */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {viewingCheque.status === 'pending' ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveCheque(viewingCheque);
                      setClearDate(new Date().toISOString().split('T')[0]);
                      setShowClearModal(true);
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 size={14} /> Clear Cheque
                  </button>
                  <button
                    onClick={() => {
                      setActiveCheque(viewingCheque);
                      setBounceReason('Insufficient Funds');
                      setBounceFee('0');
                      setShowBounceModal(true);
                    }}
                    className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <XCircle size={14} /> Bounce Cheque
                  </button>
                  <button
                    onClick={() => {
                      setEditForm({
                        id: viewingCheque.id,
                        chequeNumber: viewingCheque.chequeNumber,
                        vendorId: viewingCheque.vendorId || '',
                        vendorName: viewingCheque.vendorName || '',
                        payeeName: viewingCheque.payeeName || '',
                        amount: String(viewingCheque.amount),
                        bankAccountId: viewingCheque.bankAccountId,
                        issueDate: viewingCheque.issueDate,
                        clearingDate: viewingCheque.clearingDate,
                        notes: viewingCheque.notes || '',
                        attachmentUrl: viewingCheque.attachmentUrl || '',
                      });
                      setShowEditModal(true);
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5"
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                </div>
              ) : (
                <div />
              )}
              <button
                onClick={() => setViewingCheque(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- MODAL 1: ISSUE CHEQUE -------------------- */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-indigo-600 font-black text-base">
                <CreditCard size={20} />
                <span>Issue New Bank Cheque</span>
              </div>
              <button 
                onClick={() => setShowIssueModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleIssueSubmit} className="space-y-3.5 text-xs">
              {/* Cheque Number & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Cheque Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CK-890214"
                    value={issueForm.chequeNumber}
                    onChange={e => setIssueForm({ ...issueForm, chequeNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Amount (BDT) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="0.00"
                    value={issueForm.amount}
                    onChange={e => setIssueForm({ ...issueForm, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 font-mono font-extrabold text-sm"
                  />
                  {Number(issueForm.amount) > 0 && (
                    <span className="text-[10px] text-emerald-700 font-bold block mt-1">
                      {numberToWords(Number(issueForm.amount))} Taka Only
                    </span>
                  )}
                </div>
              </div>

              {/* Bank Account Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Issuing Bank Account *
                </label>
                <select
                  required
                  value={issueForm.bankAccountId}
                  onChange={e => setIssueForm({ ...issueForm, bankAccountId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 font-medium text-slate-800"
                >
                  <option value="">-- Select Bank Account --</option>
                  {bankAccounts.map(a => {
                    const bal = calculateAccountBalance(a, transactions);
                    return (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.type}) — Balance: {formatCurrency(bal, settings)}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Vendor / Payee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Vendor / Supplier (Optional)
                  </label>
                  <select
                    value={issueForm.vendorId}
                    onChange={e => {
                      const v = vendors.find(x => x.id === e.target.value);
                      setIssueForm({
                        ...issueForm,
                        vendorId: e.target.value,
                        vendorName: v?.name || '',
                        payeeName: v?.name || issueForm.payeeName,
                        purchaseId: '',
                        purchaseNumber: '',
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium"
                  >
                    <option value="">-- Select Vendor --</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Payee Name (As on cheque) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Star Tech Ltd"
                    value={issueForm.payeeName}
                    onChange={e => setIssueForm({ ...issueForm, payeeName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium"
                  />
                </div>
              </div>

              {/* Quick Link to Vendor's Pending Purchases */}
              {vendorPendingPurchases.length > 0 && (
                <div className="bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-200/80 space-y-1.5">
                  <span className="text-[10px] font-bold text-indigo-950 uppercase tracking-wider block">
                    Select Vendor Bill to Pay (Optional):
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {vendorPendingPurchases.map(p => {
                      const dueAmt = Math.max(0, (Number(p.total) || 0) - (Number(p.paidAmount) || 0));
                      const isSelected = issueForm.purchaseId === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setIssueForm({ ...issueForm, purchaseId: '', purchaseNumber: '' });
                            } else {
                              setIssueForm({
                                ...issueForm,
                                purchaseId: p.id,
                                purchaseNumber: p.documentNumber || '',
                                amount: String(dueAmt),
                              });
                            }
                          }}
                          className={cn(
                            "px-2 py-1 rounded-lg text-[10px] font-bold transition-all border",
                            isSelected
                              ? "bg-indigo-600 text-white border-indigo-700 shadow-2xs"
                              : "bg-white text-indigo-900 border-indigo-200 hover:bg-indigo-100"
                          )}
                        >
                          Bill #{p.documentNumber || p.id.slice(-6)} (Due: ৳{dueAmt.toLocaleString()})
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Issue Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={issueForm.issueDate}
                    onChange={e => setIssueForm({ ...issueForm, issueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Clearing Date (PDC) *</span>
                    <span className="text-[10px] text-indigo-600 font-bold">Maturity Date</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={issueForm.clearingDate}
                    onChange={e => setIssueForm({ ...issueForm, clearingDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium text-indigo-900 font-bold"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Notes / Particulars
                </label>
                <input
                  type="text"
                  placeholder="e.g. Payment for GPU shipment"
                  value={issueForm.notes}
                  onChange={e => setIssueForm({ ...issueForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium"
                />
              </div>

              {/* Cheque Leaf Photo Upload */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Cheque Leaf Photo / Scan (Optional)
                </label>
                {issueForm.attachmentUrl ? (
                  <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <span className="text-xs text-emerald-700 font-bold flex items-center gap-1.5">
                      <Check size={14} /> Photo Attached
                    </span>
                    <button
                      type="button"
                      onClick={() => setIssueForm({ ...issueForm, attachmentUrl: '' })}
                      className="text-xs text-red-600 hover:text-red-800 font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 border border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/30 p-2.5 rounded-xl cursor-pointer text-slate-600 hover:text-indigo-600 font-bold transition-all">
                    <Upload size={14} />
                    <span>{uploadingAttachment ? 'Uploading...' : 'Upload cheque image (up to 10MB)'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingAttachment}
                      onChange={e => handleChequeFileUpload(e, false)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingAttachment}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Confirm & Issue Cheque'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- MODAL: EDIT CHEQUE -------------------- */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-blue-600 font-black text-base">
                <Edit2 size={18} />
                <span>Edit Cheque Details</span>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cheque Number *</label>
                  <input
                    type="text"
                    required
                    value={editForm.chequeNumber}
                    onChange={e => setEditForm({ ...editForm, chequeNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount (BDT) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editForm.amount}
                    onChange={e => setEditForm({ ...editForm, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Issuing Bank Account *</label>
                <select
                  required
                  value={editForm.bankAccountId}
                  onChange={e => setEditForm({ ...editForm, bankAccountId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  {bankAccounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payee / Beneficiary Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.payeeName}
                    onChange={e => setEditForm({ ...editForm, payeeName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Clearing Date (PDC) *</label>
                  <input
                    type="date"
                    required
                    value={editForm.clearingDate}
                    onChange={e => setEditForm({ ...editForm, clearingDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-indigo-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes / Particulars</label>
                <input
                  type="text"
                  value={editForm.notes}
                  onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Cheque Leaf Photo</label>
                {editForm.attachmentUrl ? (
                  <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <span className="text-xs text-emerald-700 font-bold flex items-center gap-1.5">
                      <Check size={14} /> Photo Attached
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, attachmentUrl: '' })}
                      className="text-xs text-red-600 hover:text-red-800 font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 border border-dashed border-slate-300 hover:border-blue-400 bg-slate-50/50 p-2.5 rounded-xl cursor-pointer text-slate-600 font-bold">
                    <Upload size={14} />
                    <span>Upload cheque image</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingAttachment}
                      onChange={e => handleChequeFileUpload(e, true)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- MODAL 2: MARK AS CLEARED -------------------- */}
      {showClearModal && activeCheque && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900">
                  Confirm Cheque Clearance
                </h3>
                <p className="text-xs text-slate-500">
                  Bank balance will be debited and payment recorded against vendor account.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Cheque No:</span>
                <span className="font-mono font-bold text-slate-900">{activeCheque.chequeNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Payee:</span>
                <span className="font-bold text-slate-900">{activeCheque.payeeName || activeCheque.vendorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Bank Account:</span>
                <span className="font-semibold text-slate-900">{activeCheque.bankAccountName}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-700 font-bold">Amount:</span>
                <span className="font-mono font-black text-sm text-emerald-600">
                  {formatCurrency(activeCheque.amount, settings)}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Actual Clearing Date *
                </label>
                <input
                  type="date"
                  required
                  value={clearDate}
                  onChange={e => setClearDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Bank Reference / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cleared via City Bank statement"
                  value={clearNote}
                  onChange={e => setClearNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => {
                  setShowClearModal(false);
                  setActiveCheque(null);
                }}
                className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleClearSubmit}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-sm disabled:opacity-50"
              >
                {submitting ? 'Processing...' : '✓ Confirm Cleared'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- MODAL 3: MARK AS BOUNCED -------------------- */}
      {showBounceModal && activeCheque && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-red-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-black text-base text-red-900">
                  Record Cheque Bounce
                </h3>
                <p className="text-xs text-red-600">
                  Vendor due will be restored, and bank expense debited if penalty applies.
                </p>
              </div>
            </div>

            <div className="bg-red-50/50 p-4 rounded-2xl border border-red-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600 font-semibold">Cheque No:</span>
                <span className="font-mono font-bold text-slate-900">{activeCheque.chequeNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-semibold">Supplier:</span>
                <span className="font-bold text-slate-900">{activeCheque.payeeName || activeCheque.vendorName}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-red-200/60">
                <span className="text-red-900 font-bold">Restored Due:</span>
                <span className="font-mono font-black text-sm text-red-600">
                  {formatCurrency(activeCheque.amount, settings)}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Bounce Reason *
                </label>
                <select
                  value={bounceReason}
                  onChange={e => setBounceReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium"
                >
                  <option value="Insufficient Funds">Insufficient Funds</option>
                  <option value="Signature Mismatch">Signature Mismatch</option>
                  <option value="Date Expired / Stale Cheque">Date Expired / Stale Cheque</option>
                  <option value="Payment Stopped by Issuer">Payment Stopped by Issuer</option>
                  <option value="Account Blocked / Frozen">Account Blocked / Frozen</option>
                  <option value="Other / Custom">Other / Custom Reason...</option>
                </select>
              </div>

              {bounceReason === 'Other / Custom' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Specify Custom Reason *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Specify bounce reason..."
                    value={customBounceReason}
                    onChange={e => setCustomBounceReason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Bank Bounce / Penalty Fee (BDT - Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0.00"
                  value={bounceFee}
                  onChange={e => setBounceFee(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  If the bank charged a penalty fee, it will be automatically recorded as a bank expense.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => {
                  setShowBounceModal(false);
                  setActiveCheque(null);
                }}
                className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleBounceSubmit}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-sm disabled:opacity-50"
              >
                {submitting ? 'Processing...' : '✕ Confirm Bounce'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- MODAL 4: CANCEL CHEQUE -------------------- */}
      {showCancelModal && activeCheque && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-black text-sm text-slate-900">
              Cancel Cheque #{activeCheque.chequeNumber}?
            </h3>
            <p className="text-xs text-slate-500">
              Once cancelled, this cheque cannot be cleared or processed.
            </p>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-xs">
                Cancellation Reason *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Replaced with cash payment"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setShowCancelModal(false);
                  setActiveCheque(null);
                }}
                className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleCancelSubmit}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold disabled:opacity-50"
              >
                {submitting ? 'Cancelling...' : 'Yes, Cancel Cheque'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
