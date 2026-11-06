import React, { useState, useEffect, useMemo } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, getDocs, orderBy, where } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { Employee, EmployeeSalary, SalaryAdvance, PaymentAccount, Transaction } from '../../../../types';
import { formatCurrency, cn } from '../../../../lib/utils';
import { toast } from 'react-hot-toast';
import { 
  CreditCard, X, Plus, Edit2, Trash2, CheckCircle, Calendar, 
  DollarSign, User, FileText, AlertCircle, TrendingUp, History,
  Shield, Check, Search, Filter, RefreshCw, Wallet, ArrowDownRight,
  Clock, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { useSettings } from '../../../../context/SettingsContext';
import { syncAppAccessStaff } from '../../../../lib/employeeSync';
import { calculateAccountBalance, validateSufficientBalance } from '../../../../lib/accountBalance';
import { logAudit } from '../../../../lib/audit';

const SalaryTab: React.FC = () => {
  const { profile, user, isAdmin, hasPermission } = useAuth();
  const { settings } = useSettings();

  // Active Sub-Tab
  const [activeSubTab, setActiveSubTab] = useState<'payroll' | 'profiles' | 'advances'>('payroll');

  // Main Data States
  const [employeeSalaries, setEmployeeSalaries] = useState<EmployeeSalary[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaryAdvances, setSalaryAdvances] = useState<SalaryAdvance[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>(new Date().toISOString().slice(0, 7));

  // Modal 1: Process / Edit Salary Modal
  const [isAddingSalary, setIsAddingSalary] = useState(false);
  const [editingSalary, setEditingSalary] = useState<EmployeeSalary | null>(null);
  const [salaryFormData, setSalaryFormData] = useState<{
    employeeId: string;
    employeeName: string;
    month: string;
    baseAmount: number;
    bonus: number;
    deductions: number;
    advanceDeduction: number;
    netPay: number;
    status: 'pending' | 'paid';
    paymentAccountId: string;
    paymentMethod: string;
    paymentDate: string;
    notes: string;
  }>({
    employeeId: '',
    employeeName: '',
    month: new Date().toISOString().slice(0, 7),
    baseAmount: 0,
    bonus: 0,
    deductions: 0,
    advanceDeduction: 0,
    netPay: 0,
    status: 'pending',
    paymentAccountId: '',
    paymentMethod: 'cash',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Modal 2: Disburse Advance Salary Modal
  const [isAddingAdvance, setIsAddingAdvance] = useState(false);
  const [advanceFormData, setAdvanceFormData] = useState<{
    employeeId: string;
    employeeName: string;
    amount: number | '';
    date: string;
    paymentAccountId: string;
    paymentMethod: string;
    notes: string;
  }>({
    employeeId: '',
    employeeName: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentAccountId: '',
    paymentMethod: 'cash',
    notes: ''
  });

  // Modal 3: Quick Payout Dialog for Pending Salaries
  const [payoutSalaryRecord, setPayoutSalaryRecord] = useState<EmployeeSalary | null>(null);
  const [payoutAccountId, setPayoutAccountId] = useState('');
  const [isPayingOut, setIsPayingOut] = useState(false);

  // Modal 4: Edit Employee Base Salary / Increment Modal
  const [salaryModalEmployee, setSalaryModalEmployee] = useState<Employee | null>(null);
  const [newSalaryAmount, setNewSalaryAmount] = useState<number | ''>('');
  const [salaryHikeNote, setSalaryHikeNote] = useState('');
  const [savingSalaryHike, setSavingSalaryHike] = useState(false);

  // Modal 5: Increment History Modal
  const [historyEmployee, setHistoryEmployee] = useState<Employee | null>(null);

  const fetchData = async (showToast = false) => {
    setIsLoading(true);
    try {
      // 1. Sync & fetch employees
      try {
        const syncedEmployees = await syncAppAccessStaff();
        syncedEmployees.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setEmployees(syncedEmployees);
      } catch (empErr) {
        console.error('Error syncing employees:', empErr);
      }

      // 2. Fetch salaries
      try {
        const salariesSnapshot = await getDocs(collection(db, 'employee_salaries'));
        const salariesData = salariesSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as EmployeeSalary));
        salariesData.sort((a, b) => (b.month || '').localeCompare(a.month || ''));
        setEmployeeSalaries(salariesData);
      } catch (salErr) {
        console.error('Error fetching salaries:', salErr);
      }

      // 3. Fetch advances (resilient fallback)
      try {
        const advSnapshot = await getDocs(collection(db, 'salary_advances'));
        const advData = advSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as SalaryAdvance));
        advData.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        setSalaryAdvances(advData);
      } catch (advErr) {
        console.warn('Could not load salary_advances (will populate once advances are saved):', advErr);
        setSalaryAdvances([]);
      }

      // 4. Fetch payment accounts
      try {
        const accSnap = await getDocs(collection(db, 'payment_accounts'));
        const accs = accSnap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentAccount));
        accs.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setPaymentAccounts(accs);
      } catch (accErr) {
        console.error('Error fetching payment accounts:', accErr);
      }

      // 5. Fetch transactions for live balance checks
      try {
        const txSnap = await getDocs(collection(db, 'transactions'));
        const txs = txSnap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
        setTransactions(txs);
      } catch (txErr) {
        console.error('Error fetching transactions:', txErr);
      }

      if (showToast) {
        toast.success('Synced and refreshed all HR & Payroll data!');
      }
    } catch (error) {
      console.error('Error fetching payroll data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (!isAdmin && !hasPermission('manage_hr')) {
    return null;
  }

  // Account Balance Helpers
  const getAccountLiveBalance = (accId: string) => {
    if (!accId) return 0;
    const acc = paymentAccounts.find(a => a.id === accId);
    return calculateAccountBalance(acc, transactions);
  };

  // ── 1. Handle Save / Process Monthly Salary ──
  const handleSaveSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedEmp = employees.find(emp => emp.id === salaryFormData.employeeId || emp.name === salaryFormData.employeeName);
      if (!selectedEmp) {
        toast.error('Please select an employee');
        return;
      }

      const base = Number(salaryFormData.baseAmount) || 0;
      const bonus = Number(salaryFormData.bonus) || 0;
      const deductions = Number(salaryFormData.deductions) || 0;
      const advanceDeduction = Number(salaryFormData.advanceDeduction) || 0;

      // Net Pay formula: (Base + Bonus) - Deductions - Advance Deduction
      const netPay = Math.max(0, (base + bonus) - deductions - advanceDeduction);

      const currentUser = profile?.displayName || user?.displayName || user?.email || 'Admin';
      const now = new Date().toISOString();

      // If paying immediately, validate payment account & balance!
      if (salaryFormData.status === 'paid' && netPay > 0) {
        if (!salaryFormData.paymentAccountId) {
          toast.error('Please select a payment account to disburse salary!');
          return;
        }

        const selectedAcc = paymentAccounts.find(a => a.id === salaryFormData.paymentAccountId);
        const check = validateSufficientBalance(selectedAcc, transactions, netPay);
        if (!check.valid) {
          toast.error(check.error || 'Insufficient balance in selected account!');
          return;
        }

        // Record Transaction in Firestore
        const txDoc = await addDoc(collection(db, 'transactions'), {
          type: 'salary',
          category: 'Payroll & Salaries',
          amount: netPay,
          date: salaryFormData.paymentDate || now,
          paymentAccountId: selectedAcc?.id,
          paymentMethod: selectedAcc?.type || selectedAcc?.name || 'cash',
          description: `Salary disbursement for ${selectedEmp.name} (${salaryFormData.month})`,
          entityId: selectedEmp.id,
          entityName: selectedEmp.name,
          entityType: 'employee',
          createdAt: now,
          createdBy: currentUser,
        });

        // If advance deduction was applied, reduce employee's advance balance!
        if (advanceDeduction > 0) {
          const newAdvanceBal = Math.max(0, (selectedEmp.advanceBalance || 0) - advanceDeduction);
          await updateDoc(doc(db, 'employees', selectedEmp.id), {
            advanceBalance: newAdvanceBal
          });
        }

        const dataToSave: Omit<EmployeeSalary, 'id'> = {
          employeeId: selectedEmp.id,
          employeeName: selectedEmp.name,
          month: salaryFormData.month,
          baseAmount: base,
          bonus: bonus,
          deductions: deductions,
          advanceDeduction: advanceDeduction,
          netPay: netPay,
          status: 'paid',
          paymentAccountId: selectedAcc?.id,
          paymentMethod: selectedAcc?.type || 'cash',
          paymentDate: salaryFormData.paymentDate || now,
          transactionId: txDoc.id,
          notes: salaryFormData.notes,
          createdAt: now,
        };

        if (editingSalary) {
          await updateDoc(doc(db, 'employee_salaries', editingSalary.id), dataToSave);
        } else {
          await addDoc(collection(db, 'employee_salaries'), dataToSave);
        }

        await logAudit(
          'CREATE',
          'HR',
          `Disbursed salary of ${formatCurrency(netPay, settings)} to ${selectedEmp.name} for ${salaryFormData.month} via ${selectedAcc?.name}`,
          currentUser,
          dataToSave
        );

        toast.success(`Salary of ${formatCurrency(netPay, settings)} disbursed to ${selectedEmp.name}!`);
      } else {
        // Pending status
        const dataToSave: Omit<EmployeeSalary, 'id'> = {
          employeeId: selectedEmp.id,
          employeeName: selectedEmp.name,
          month: salaryFormData.month,
          baseAmount: base,
          bonus: bonus,
          deductions: deductions,
          advanceDeduction: advanceDeduction,
          netPay: netPay,
          status: 'pending',
          paymentAccountId: '',
          paymentMethod: '',
          paymentDate: salaryFormData.paymentDate || now,
          notes: salaryFormData.notes,
          createdAt: now,
        };

        if (editingSalary) {
          await updateDoc(doc(db, 'employee_salaries', editingSalary.id), dataToSave);
          toast.success('Salary record updated');
        } else {
          await addDoc(collection(db, 'employee_salaries'), dataToSave);
          toast.success('Salary voucher created as Pending');
        }
      }

      setIsAddingSalary(false);
      setEditingSalary(null);
      fetchData();
    } catch (error: any) {
      console.error('Error saving salary:', error);
      toast.error(error?.message || 'Failed to save salary');
    }
  };

  // ── 2. Handle Disburse Advance Salary ──
  const handleDisburseAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(advanceFormData.amount) || 0;
    if (amount <= 0) {
      toast.error('Please enter a valid advance amount');
      return;
    }

    const selectedEmp = employees.find(emp => emp.id === advanceFormData.employeeId);
    if (!selectedEmp) {
      toast.error('Please select an employee');
      return;
    }

    if (!advanceFormData.paymentAccountId) {
      toast.error('Please select the payment account from which to disburse advance!');
      return;
    }

    const selectedAcc = paymentAccounts.find(a => a.id === advanceFormData.paymentAccountId);
    const balanceCheck = validateSufficientBalance(selectedAcc, transactions, amount);
    if (!balanceCheck.valid) {
      toast.error(balanceCheck.error || 'Insufficient balance in selected account!');
      return;
    }

    try {
      const currentUser = profile?.displayName || user?.displayName || user?.email || 'Admin';
      const now = new Date().toISOString();

      // 1. Create Transaction (Cash/Bank Outflow)
      const txDoc = await addDoc(collection(db, 'transactions'), {
        type: 'advance_salary',
        category: 'Advance Salary & Loans',
        amount: amount,
        date: advanceFormData.date ? new Date(advanceFormData.date).toISOString() : now,
        paymentAccountId: selectedAcc?.id,
        paymentMethod: selectedAcc?.type || selectedAcc?.name || 'cash',
        description: `Advance salary given to ${selectedEmp.name} (Amount: ${formatCurrency(amount, settings)})`,
        entityId: selectedEmp.id,
        entityName: selectedEmp.name,
        entityType: 'employee',
        isAdvanceSalary: true,
        createdAt: now,
        createdBy: currentUser,
      });

      // 2. Add Salary Advance Record
      const advanceRecord: Omit<SalaryAdvance, 'id'> = {
        employeeId: selectedEmp.id,
        employeeName: selectedEmp.name,
        amount: amount,
        remainingAmount: amount,
        date: advanceFormData.date || now.split('T')[0],
        paymentAccountId: selectedAcc?.id || '',
        paymentAccountName: selectedAcc?.name || 'Cash',
        paymentMethod: selectedAcc?.type || 'cash',
        notes: advanceFormData.notes || '',
        status: 'active',
        transactionId: txDoc.id,
        createdAt: now,
        createdBy: currentUser,
      };

      await addDoc(collection(db, 'salary_advances'), advanceRecord);

      // 3. Update Employee Advance Balance
      const newBalance = (selectedEmp.advanceBalance || 0) + amount;
      await updateDoc(doc(db, 'employees', selectedEmp.id), {
        advanceBalance: newBalance
      });

      // 4. Audit Log
      await logAudit(
        'CREATE',
        'HR',
        `Disbursed advance salary of ${formatCurrency(amount, settings)} to ${selectedEmp.name} from account "${selectedAcc?.name}". New advance balance: ${formatCurrency(newBalance, settings)}`,
        currentUser,
        advanceRecord
      );

      toast.success(`Advance of ${formatCurrency(amount, settings)} given to ${selectedEmp.name}!`);
      setIsAddingAdvance(false);
      setAdvanceFormData({
        employeeId: '',
        employeeName: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        paymentAccountId: '',
        paymentMethod: 'cash',
        notes: ''
      });
      fetchData();
    } catch (err: any) {
      console.error('Failed to disburse advance:', err);
      toast.error(err?.message || 'Failed to disburse advance');
    }
  };

  // ── 3. Quick Payout for Pending Salary ──
  const handleExecutePendingPayout = async () => {
    if (!payoutSalaryRecord) return;
    const netPay = payoutSalaryRecord.netPay || 0;

    if (netPay > 0 && !payoutAccountId) {
      toast.error('Please select a payment account to disburse salary!');
      return;
    }

    const selectedAcc = paymentAccounts.find(a => a.id === payoutAccountId);
    const balanceCheck = validateSufficientBalance(selectedAcc, transactions, netPay);
    if (!balanceCheck.valid) {
      toast.error(balanceCheck.error || 'Insufficient balance in selected account!');
      return;
    }

    setIsPayingOut(true);
    try {
      const now = new Date().toISOString();
      const currentUser = profile?.displayName || user?.displayName || user?.email || 'Admin';

      // 1. Transaction Outflow
      const txDoc = await addDoc(collection(db, 'transactions'), {
        type: 'salary',
        category: 'Payroll & Salaries',
        amount: netPay,
        date: now,
        paymentAccountId: selectedAcc?.id,
        paymentMethod: selectedAcc?.type || selectedAcc?.name || 'cash',
        description: `Salary payout for ${payoutSalaryRecord.employeeName} (${payoutSalaryRecord.month})`,
        entityId: payoutSalaryRecord.employeeId,
        entityName: payoutSalaryRecord.employeeName,
        entityType: 'employee',
        createdAt: now,
        createdBy: currentUser,
      });

      // 2. Deduct advance balance if recovered in this slip
      const advDeduction = Number(payoutSalaryRecord.advanceDeduction) || 0;
      if (advDeduction > 0 && payoutSalaryRecord.employeeId) {
        const emp = employees.find(e => e.id === payoutSalaryRecord.employeeId);
        if (emp) {
          const newAdv = Math.max(0, (emp.advanceBalance || 0) - advDeduction);
          await updateDoc(doc(db, 'employees', emp.id), { advanceBalance: newAdv });
        }
      }

      // 3. Update salary slip status
      await updateDoc(doc(db, 'employee_salaries', payoutSalaryRecord.id), {
        status: 'paid',
        paymentAccountId: selectedAcc?.id,
        paymentMethod: selectedAcc?.type || 'cash',
        paymentDate: now,
        transactionId: txDoc.id
      });

      toast.success(`Disbursed ${formatCurrency(netPay, settings)} to ${payoutSalaryRecord.employeeName}!`);
      setPayoutSalaryRecord(null);
      setPayoutAccountId('');
      fetchData();
    } catch (err: any) {
      console.error('Error executing payout:', err);
      toast.error(err?.message || 'Failed to disburse salary');
    } finally {
      setIsPayingOut(false);
    }
  };

  // ── 4. Quick Salary Edit / Increment ──
  const handleSaveQuickSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salaryModalEmployee) return;

    const currentBase = Number(salaryModalEmployee.baseSalary) || 0;
    const newBase = Number(newSalaryAmount) || 0;

    if (newBase <= 0) {
      toast.error('Please enter a valid salary amount');
      return;
    }

    setSavingSalaryHike(true);
    try {
      const hike = newBase - currentBase;
      const now = new Date().toISOString();
      const currentUser = profile?.displayName || user?.displayName || user?.email || 'Admin';

      const historyEntry = {
        date: now,
        oldSalary: currentBase,
        newSalary: newBase,
        hikeAmount: hike,
        note: salaryHikeNote.trim() || 'Salary adjustment from overview',
      };

      const updateData: Partial<Employee> = {
        baseSalary: newBase,
        previousSalary: currentBase,
        salaryHike: hike,
        lastHikeDate: now,
        salaryHistory: [...(salaryModalEmployee.salaryHistory || []), historyEntry],
      };

      await updateDoc(doc(db, 'employees', salaryModalEmployee.id), updateData);

      await logAudit(
        'UPDATE',
        'HR',
        `Adjusted salary for ${salaryModalEmployee.name}: ${formatCurrency(currentBase, settings)} → ${formatCurrency(newBase, settings)} (Hike: ${hike >= 0 ? '+' : ''}${formatCurrency(hike, settings)})`,
        currentUser,
        { employeeId: salaryModalEmployee.id, oldSalary: currentBase, newSalary: newBase, hike }
      );

      toast.success(`Salary updated for ${salaryModalEmployee.name}!`);
      setSalaryModalEmployee(null);
      setNewSalaryAmount('');
      setSalaryHikeNote('');
      fetchData();
    } catch (err: any) {
      console.error('Failed to update salary:', err);
      toast.error(err?.message || 'Failed to update salary');
    } finally {
      setSavingSalaryHike(false);
    }
  };

  // KPIs
  const totalMonthlyPayroll = useMemo(() => {
    return employeeSalaries
      .filter(s => !selectedMonthFilter || s.month === selectedMonthFilter)
      .reduce((sum, s) => sum + (Number(s.netPay) || 0), 0);
  }, [employeeSalaries, selectedMonthFilter]);

  const totalPaidThisMonth = useMemo(() => {
    return employeeSalaries
      .filter(s => s.status === 'paid' && (!selectedMonthFilter || s.month === selectedMonthFilter))
      .reduce((sum, s) => sum + (Number(s.netPay) || 0), 0);
  }, [employeeSalaries, selectedMonthFilter]);

  const totalPendingThisMonth = useMemo(() => {
    return employeeSalaries
      .filter(s => s.status === 'pending' && (!selectedMonthFilter || s.month === selectedMonthFilter))
      .reduce((sum, s) => sum + (Number(s.netPay) || 0), 0);
  }, [employeeSalaries, selectedMonthFilter]);

  // Clean Unique Employees (Deduplicated by normalized name)
  const uniqueEmployees = useMemo(() => {
    const map = new Map<string, Employee>();
    for (const emp of employees) {
      const key = (emp.name || '').trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, emp);
      } else {
        const existing = map.get(key)!;
        if ((!existing.baseSalary && emp.baseSalary) || (!existing.userId && emp.userId)) {
          map.set(key, { ...existing, ...emp });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [employees]);

  const getEmployeeOptionLabel = (emp: Employee, includeSalary = false) => {
    const name = emp.name || 'Staff';
    const role = emp.role || 'Staff';
    const lowerName = name.toLowerCase();
    const lowerRole = role.toLowerCase();

    // Do not append duplicate role if the name already contains it
    const showRole = !lowerName.includes(lowerRole) && 
                     !lowerName.includes('admin') && 
                     !lowerName.includes('staff') && 
                     !lowerName.includes('manager');

    const roleText = showRole ? ` (${role})` : '';
    const advText = emp.advanceBalance && emp.advanceBalance > 0 ? ` • Advance Due: ৳${emp.advanceBalance.toLocaleString()}` : '';
    const salText = includeSalary && emp.baseSalary ? ` • Salary: ৳${emp.baseSalary.toLocaleString()}` : '';
    return `${name}${roleText}${salText}${advText}`;
  };

  const totalOutstandingAdvances = useMemo(() => {
    return uniqueEmployees.reduce((sum, e) => sum + (Number(e.advanceBalance) || 0), 0);
  }, [uniqueEmployees]);

  // Filtered Salaries
  const filteredSalaries = useMemo(() => {
    return employeeSalaries.filter(sal => {
      const matchMonth = !selectedMonthFilter || sal.month === selectedMonthFilter;
      const matchSearch = !searchQuery || 
        (sal.employeeName || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchMonth && matchSearch;
    });
  }, [employeeSalaries, selectedMonthFilter, searchQuery]);

  // Selected Employee for Salary Process Modal
  const activeProcessEmp = useMemo(() => {
    return employees.find(e => e.id === salaryFormData.employeeId || e.name === salaryFormData.employeeName);
  }, [employees, salaryFormData.employeeId, salaryFormData.employeeName]);

  // Selected Employee for Advance Disbursal Modal
  const activeAdvanceEmp = useMemo(() => {
    return employees.find(e => e.id === advanceFormData.employeeId);
  }, [employees, advanceFormData.employeeId]);

  return (
    <div className="space-y-6">
      
      {/* ── Top Header ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <CreditCard size={24} />
            </div>
            Salary & Payroll Overview
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Manage App Access staff salaries, pay hikes, advance loans, and monthly payroll disbursements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={isLoading}
            className="px-3 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            title="Refresh and sync App Access staff"
          >
            <RefreshCw size={13} className={cn(isLoading && "animate-spin text-indigo-600")} />
            Sync & Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              setIsAddingAdvance(true);
            }}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            title="Disburse salary advance or loan to staff"
          >
            <Wallet size={14} />
            Disburse Advance
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingSalary(null);
              setSalaryFormData({
                employeeId: '',
                employeeName: '',
                month: new Date().toISOString().slice(0, 7),
                baseAmount: 0,
                bonus: 0,
                deductions: 0,
                advanceDeduction: 0,
                netPay: 0,
                status: 'pending',
                paymentAccountId: '',
                paymentMethod: 'cash',
                paymentDate: new Date().toISOString().split('T')[0],
                notes: ''
              });
              setIsAddingSalary(true);
            }}
            className="px-4 py-2 bg-[#081621] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            Process Salary
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Total Payroll ({selectedMonthFilter || 'All'})</span>
          <div className="text-xl font-black text-gray-900 mt-1">{formatCurrency(totalMonthlyPayroll, settings)}</div>
          <span className="text-[11px] text-gray-400 mt-0.5 block">{filteredSalaries.length} salary vouchers</span>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Disbursed (Paid)</span>
          <div className="text-xl font-black text-emerald-800 mt-1">{formatCurrency(totalPaidThisMonth, settings)}</div>
          <span className="text-[11px] text-emerald-600 mt-0.5 block">Cleared payouts</span>
        </div>

        <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Pending Payout</span>
          <div className="text-xl font-black text-amber-800 mt-1">{formatCurrency(totalPendingThisMonth, settings)}</div>
          <span className="text-[11px] text-amber-600 mt-0.5 block">Awaiting disbursement</span>
        </div>

        <div className="bg-rose-50/70 border border-rose-100 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">Total Advance Outstanding</span>
          <div className="text-xl font-black text-rose-800 mt-1">{formatCurrency(totalOutstandingAdvances, settings)}</div>
          <span className="text-[11px] text-rose-600 mt-0.5 block">Staff loan / advance balance</span>
        </div>
      </div>

      {/* ── Sub-Tab Navigation Bar ── */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveSubTab('payroll')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              activeSubTab === 'payroll'
                ? "bg-white text-gray-900 shadow-2xs"
                : "text-gray-500 hover:text-gray-900"
            )}
          >
            Monthly Payroll ({filteredSalaries.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('profiles')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              activeSubTab === 'profiles'
                ? "bg-white text-gray-900 shadow-2xs"
                : "text-gray-500 hover:text-gray-900"
            )}
          >
            Staff Salary Profiles ({uniqueEmployees.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('advances')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              activeSubTab === 'advances'
                ? "bg-white text-gray-900 shadow-2xs"
                : "text-gray-500 hover:text-gray-900"
            )}
          >
            Advance Register ({salaryAdvances.length})
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex items-center gap-2">
          {activeSubTab === 'payroll' && (
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-xl text-xs">
              <Calendar size={13} className="text-gray-400" />
              <input
                type="month"
                value={selectedMonthFilter}
                onChange={e => setSelectedMonthFilter(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-gray-800 p-0 focus:ring-0 outline-none"
              />
              {selectedMonthFilter && (
                <button
                  type="button"
                  onClick={() => setSelectedMonthFilter('')}
                  className="text-gray-400 hover:text-gray-600 text-[10px] ml-1 font-bold"
                  title="Show all months"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search staff..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-44 sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/* ── SUB-VIEW 1: Monthly Payroll & Payslips ── */}
      {/* ══════════════════════════════════════════════════ */}
      {activeSubTab === 'payroll' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-gray-50/70 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Month</th>
                  <th className="px-6 py-4 text-right">Base Amount</th>
                  <th className="px-6 py-4 text-right">Bonus</th>
                  <th className="px-6 py-4 text-right">Deductions</th>
                  <th className="px-6 py-4 text-right">Advance Recovered</th>
                  <th className="px-6 py-4 text-right font-black">Net Pay</th>
                  <th className="px-6 py-4">Payment Account</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredSalaries.map(sal => {
                  const payAcc = paymentAccounts.find(a => a.id === sal.paymentAccountId);

                  return (
                    <tr key={sal.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{sal.employeeName}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-600">{sal.month}</td>
                      <td className="px-6 py-4 text-right tabular-nums text-gray-800">
                        {formatCurrency(sal.baseAmount || 0, settings)}
                      </td>
                      <td className="px-6 py-4 text-right tabular-nums text-emerald-600 font-medium">
                        {sal.bonus ? `+${formatCurrency(sal.bonus, settings)}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right tabular-nums text-rose-600 font-medium">
                        {sal.deductions ? `-${formatCurrency(sal.deductions, settings)}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right tabular-nums font-bold text-amber-700">
                        {sal.advanceDeduction ? `-${formatCurrency(sal.advanceDeduction, settings)}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right tabular-nums font-black text-gray-900 text-sm">
                        {formatCurrency(sal.netPay || 0, settings)}
                      </td>
                      <td className="px-6 py-4">
                        {sal.status === 'paid' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            <Wallet size={10} className="text-slate-500" />
                            {payAcc?.name || sal.paymentMethod || 'Cash'}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Unpaid</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-1 text-[11px] font-bold rounded-full border shadow-2xs inline-flex items-center gap-1.5",
                          sal.status === 'paid' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        )}>
                          {sal.status === 'paid' ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Clock size={12} />}
                          {sal.status === 'paid' ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {sal.status !== 'paid' && (
                            <button
                              type="button"
                              onClick={() => {
                                setPayoutSalaryRecord(sal);
                                setPayoutAccountId('');
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                              title="Disburse salary and mark as paid"
                            >
                              <DollarSign size={12} /> Pay Now
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSalary(sal);
                              setSalaryFormData({
                                employeeId: sal.employeeId || '',
                                employeeName: sal.employeeName,
                                month: sal.month,
                                baseAmount: sal.baseAmount,
                                bonus: sal.bonus || 0,
                                deductions: sal.deductions || 0,
                                advanceDeduction: sal.advanceDeduction || 0,
                                netPay: sal.netPay,
                                status: sal.status,
                                paymentAccountId: sal.paymentAccountId || '',
                                paymentMethod: sal.paymentMethod || 'cash',
                                paymentDate: sal.paymentDate || new Date().toISOString().split('T')[0],
                                notes: sal.notes || ''
                              });
                              setIsAddingSalary(true);
                            }}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete salary slip for ${sal.employeeName} (${sal.month})?`)) {
                                deleteDoc(doc(db, 'employee_salaries', sal.id)).then(() => {
                                  toast.success('Deleted salary record');
                                  fetchData();
                                });
                              }
                            }}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredSalaries.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-gray-400 italic font-medium">
                      No payroll records found for the selected period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* ── SUB-VIEW 2: Staff Salary Profiles ── */}
      {/* ══════════════════════════════════════════════════ */}
      {activeSubTab === 'profiles' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-gray-50/70 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Role & App Access</th>
                  <th className="px-6 py-4">Monthly Base Salary</th>
                  <th className="px-6 py-4">Salary Hike / Increment</th>
                  <th className="px-6 py-4">Advance Taken Balance</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {uniqueEmployees
                  .filter(e => !searchQuery || (e.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(emp => {
                    const hike = Number(emp.salaryHike) || 0;
                    const advance = Number(emp.advanceBalance) || 0;
                    const hasHike = hike !== 0 && emp.previousSalary !== undefined;

                    return (
                      <tr key={emp.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900 text-sm">{emp.name}</div>
                          <div className="text-gray-400 text-[11px] mt-0.5">{emp.email || emp.phone || 'No contact'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-gray-800">{emp.role || 'Staff'}</span>
                            {emp.userId && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                <Shield size={10} /> App User
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-gray-900 text-sm tabular-nums">
                              {emp.baseSalary ? formatCurrency(emp.baseSalary, settings) : <span className="text-gray-400 font-normal italic">Not Set</span>}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setSalaryModalEmployee(emp);
                                setNewSalaryAmount(emp.baseSalary || '');
                                setSalaryHikeNote('');
                              }}
                              className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
                              title="Edit base salary"
                            >
                              Set / Edit
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {hasHike ? (
                            <div className="flex items-center gap-1.5">
                              <span className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold",
                                hike > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                              )}>
                                <TrendingUp size={11} />
                                {hike > 0 ? `+${formatCurrency(hike, settings)}` : formatCurrency(hike, settings)}
                              </span>
                              <span className="text-[11px] text-gray-400">
                                (Prev: {formatCurrency(emp.previousSalary || 0, settings)})
                              </span>
                              {emp.salaryHistory && emp.salaryHistory.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setHistoryEmployee(emp)}
                                  className="text-gray-400 hover:text-indigo-600 p-0.5 cursor-pointer"
                                  title="View increment timeline"
                                >
                                  <History size={13} />
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">No hike recorded</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {advance > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <AlertCircle size={12} className="text-amber-600" />
                              {formatCurrency(advance, settings)}
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-bold text-xs inline-flex items-center gap-1">
                              <Check size={12} /> Clear (৳0)
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setAdvanceFormData({
                                  employeeId: emp.id,
                                  employeeName: emp.name,
                                  amount: '',
                                  date: new Date().toISOString().split('T')[0],
                                  paymentAccountId: '',
                                  paymentMethod: 'cash',
                                  notes: ''
                                });
                                setIsAddingAdvance(true);
                              }}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                              title="Give advance to this employee"
                            >
                              <Wallet size={12} /> Give Advance
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSalary(null);
                                setSalaryFormData({
                                  employeeId: emp.id,
                                  employeeName: emp.name,
                                  month: new Date().toISOString().slice(0, 7),
                                  baseAmount: emp.baseSalary || 0,
                                  bonus: 0,
                                  deductions: 0,
                                  advanceDeduction: emp.advanceBalance ? Math.min(emp.advanceBalance, emp.baseSalary || 0) : 0,
                                  netPay: 0,
                                  status: 'pending',
                                  paymentAccountId: '',
                                  paymentMethod: 'cash',
                                  paymentDate: new Date().toISOString().split('T')[0],
                                  notes: ''
                                });
                                setIsAddingSalary(true);
                              }}
                              className="px-2.5 py-1 bg-[#081621] hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                              title="Process salary for this employee"
                            >
                              <Plus size={12} /> Process Salary
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* ── SUB-VIEW 3: Advance Salary Register ── */}
      {/* ══════════════════════════════════════════════════ */}
      {activeSubTab === 'advances' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-gray-50/70 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Disbursed Date</th>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4 text-right">Advance Amount</th>
                  <th className="px-6 py-4">Disbursed From Account</th>
                  <th className="px-6 py-4">Purpose / Notes</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {salaryAdvances
                  .filter(adv => !searchQuery || (adv.employeeName || '').toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(adv => (
                    <tr key={adv.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-800">
                        {adv.date ? new Date(adv.date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">{adv.employeeName}</td>
                      <td className="px-6 py-4 text-right tabular-nums font-black text-amber-700 text-sm">
                        {formatCurrency(adv.amount || 0, settings)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          <Wallet size={11} className="text-slate-500" />
                          {adv.paymentAccountName || adv.paymentMethod || 'Cash'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                        {adv.notes || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Active Advance
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete advance record of ${formatCurrency(adv.amount, settings)} for ${adv.employeeName}?`)) {
                              deleteDoc(doc(db, 'salary_advances', adv.id)).then(() => {
                                toast.success('Advance record deleted');
                                fetchData();
                              });
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete record"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                {salaryAdvances.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400 italic font-medium">
                      No advance salary records found. Click "+ Disburse Advance" to record an advance loan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* ── MODAL 1: Process / Edit Salary ── */}
      {/* ══════════════════════════════════════════════════ */}
      {isAddingSalary && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div className="px-6 py-4 bg-[#081621] text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <CreditCard size={18} className="text-indigo-400" />
                  {editingSalary ? 'Edit Salary Voucher' : 'Process Monthly Salary'}
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Calculate base salary, bonuses, advance deduction, and disburse
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingSalary(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSalary} className="p-6 space-y-4 text-xs overflow-y-auto max-h-[82vh]">
              
              {/* Employee & Month Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Select Staff Member <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={salaryFormData.employeeId}
                    onChange={e => {
                      const empId = e.target.value;
                      const emp = employees.find(x => x.id === empId);
                      if (emp) {
                        const base = emp.baseSalary || 0;
                        const advBal = emp.advanceBalance || 0;
                        const advDed = advBal > 0 ? Math.min(advBal, base) : 0;
                        setSalaryFormData({
                          ...salaryFormData,
                          employeeId: emp.id,
                          employeeName: emp.name,
                          baseAmount: base,
                          advanceDeduction: advDed,
                        });
                      } else {
                        setSalaryFormData({
                          ...salaryFormData,
                          employeeId: '',
                          employeeName: '',
                          baseAmount: 0,
                          advanceDeduction: 0,
                        });
                      }
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer"
                  >
                    <option value="">-- Choose Employee --</option>
                    {uniqueEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {getEmployeeOptionLabel(emp, false)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Salary Month <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="month"
                    required
                    value={salaryFormData.month}
                    onChange={e => setSalaryFormData({...salaryFormData, month: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Active Advance Warning & Recovery Box */}
              {activeProcessEmp && Number(activeProcessEmp.advanceBalance) > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                      <AlertCircle size={14} className="text-amber-600" />
                      Active Advance Loan Balance:
                    </span>
                    <span className="font-black text-amber-900 text-sm">
                      {formatCurrency(activeProcessEmp.advanceBalance || 0, settings)}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    {Number(salaryFormData.advanceDeduction) < Number(activeProcessEmp.advanceBalance) ? (
                      <span>
                        Deducting <strong>{formatCurrency(Number(salaryFormData.advanceDeduction) || 0, settings)}</strong> this month. Remaining <strong>{formatCurrency((activeProcessEmp.advanceBalance || 0) - (Number(salaryFormData.advanceDeduction) || 0), settings)}</strong> will automatically carry over to the next month(s).
                      </span>
                    ) : (
                      <span>
                        Full advance of <strong>{formatCurrency(activeProcessEmp.advanceBalance || 0, settings)}</strong> will be recovered in full this month.
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Financial Calculations Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                  Earnings & Deductions Breakdown
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Base Salary (BDT) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={salaryFormData.baseAmount || ''}
                      onChange={e => setSalaryFormData({...salaryFormData, baseAmount: Number(e.target.value) || 0})}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-black text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-emerald-700 uppercase mb-1">
                      Bonus (BDT)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={salaryFormData.bonus || ''}
                      onChange={e => setSalaryFormData({...salaryFormData, bonus: Number(e.target.value) || 0})}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-black text-xs text-emerald-700"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-rose-700 uppercase mb-1">
                      Deductions (BDT)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={salaryFormData.deductions || ''}
                      onChange={e => setSalaryFormData({...salaryFormData, deductions: Number(e.target.value) || 0})}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-black text-xs text-rose-700"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-amber-700 uppercase mb-1">
                      Advance Deduction
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={activeProcessEmp?.advanceBalance || undefined}
                      value={salaryFormData.advanceDeduction || ''}
                      onChange={e => setSalaryFormData({...salaryFormData, advanceDeduction: Number(e.target.value) || 0})}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-black text-xs text-amber-700"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Net Pay Result Banner */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-slate-600 text-xs">Calculated Net Pay Payout:</span>
                  <span className="font-black text-lg text-slate-900 tabular-nums">
                    {formatCurrency(
                      Math.max(0, 
                        ((Number(salaryFormData.baseAmount) || 0) + (Number(salaryFormData.bonus) || 0)) -
                        (Number(salaryFormData.deductions) || 0) -
                        (Number(salaryFormData.advanceDeduction) || 0)
                      ),
                      settings
                    )}
                  </span>
                </div>
              </div>

              {/* Payout Status & Payment Account (With Live Balance Check) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Payment Status
                  </label>
                  <select
                    value={salaryFormData.status}
                    onChange={e => setSalaryFormData({...salaryFormData, status: e.target.value as 'pending' | 'paid'})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:bg-white outline-none cursor-pointer"
                  >
                    <option value="pending">Pending (Voucher / To Pay Later)</option>
                    <option value="paid">Paid (Disburse Payout Now)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={salaryFormData.paymentDate}
                    onChange={e => setSalaryFormData({...salaryFormData, paymentDate: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* Payment Account Selection (Only required if Paid) */}
              {salaryFormData.status === 'paid' && (
                <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3.5 space-y-2">
                  <label className="block text-[11px] font-bold text-indigo-900 uppercase">
                    Disburse From Payment Account <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={salaryFormData.paymentAccountId}
                    onChange={e => setSalaryFormData({...salaryFormData, paymentAccountId: e.target.value})}
                    className="w-full p-2.5 bg-white border border-indigo-200 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer"
                  >
                    <option value="">-- Select Payment Account --</option>
                    {paymentAccounts.map(acc => {
                      const avail = getAccountLiveBalance(acc.id);
                      return (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.type}) — Available: {formatCurrency(avail, settings)}
                        </option>
                      );
                    })}
                  </select>

                  {/* Live Account Balance Indicator */}
                  {salaryFormData.paymentAccountId && (() => {
                    const avail = getAccountLiveBalance(salaryFormData.paymentAccountId);
                    const net = Math.max(0, 
                      ((Number(salaryFormData.baseAmount) || 0) + (Number(salaryFormData.bonus) || 0)) -
                      (Number(salaryFormData.deductions) || 0) -
                      (Number(salaryFormData.advanceDeduction) || 0)
                    );
                    const isInsufficient = avail < net;

                    return (
                      <div className={cn(
                        "p-2 rounded-lg text-xs font-bold flex items-center justify-between",
                        isInsufficient ? "bg-rose-100 text-rose-900 border border-rose-300" : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                      )}>
                        <span>Available Balance: {formatCurrency(avail, settings)}</span>
                        {isInsufficient && (
                          <span className="text-rose-700">⚠️ Insufficient funds for payout!</span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Notes / Reference (Optional)
                </label>
                <input
                  type="text"
                  value={salaryFormData.notes}
                  onChange={e => setSalaryFormData({...salaryFormData, notes: e.target.value})}
                  placeholder="e.g. Overtime included, regular monthly salary"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingSalary(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#081621] hover:bg-slate-800 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  {editingSalary ? 'Update Voucher' : 'Process Salary'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* ── MODAL 2: Disburse Advance Salary ── */}
      {/* ══════════════════════════════════════════════════ */}
      {isAddingAdvance && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div className="px-6 py-4 bg-amber-600 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Wallet size={18} />
                  Disburse Advance Salary (অগ্রিম বেতন)
                </h3>
                <p className="text-[11px] text-amber-100 mt-0.5">
                  Give advance loan to staff with automatic monthly recovery
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingAdvance(false)}
                className="text-amber-200 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleDisburseAdvance} className="p-6 space-y-4 text-xs">
              
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Select Staff Member <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={advanceFormData.employeeId}
                  onChange={e => {
                    const emp = employees.find(x => x.id === e.target.value);
                    setAdvanceFormData({
                      ...advanceFormData,
                      employeeId: e.target.value,
                      employeeName: emp ? emp.name : ''
                    });
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:bg-white focus:ring-2 focus:ring-amber-500/20 outline-none cursor-pointer"
                >
                  <option value="">-- Choose Employee --</option>
                  {uniqueEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {getEmployeeOptionLabel(emp, true)}
                    </option>
                  ))}
                </select>
              </div>

              {activeAdvanceEmp && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Monthly Base Salary</span>
                    <span className="font-black text-slate-800">
                      {activeAdvanceEmp.baseSalary ? formatCurrency(activeAdvanceEmp.baseSalary, settings) : 'Not Set'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Current Advance Due</span>
                    <span className="font-black text-amber-700">
                      {formatCurrency(activeAdvanceEmp.advanceBalance || 0, settings)}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Advance Amount (BDT) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                  <input
                    type="number"
                    min="1"
                    step="50"
                    required
                    value={advanceFormData.amount}
                    onChange={e => setAdvanceFormData({...advanceFormData, amount: e.target.value === '' ? '' : Number(e.target.value)})}
                    placeholder="e.g. 10000"
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500/20 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Disburse From Payment Account <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={advanceFormData.paymentAccountId}
                  onChange={e => setAdvanceFormData({...advanceFormData, paymentAccountId: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:bg-white focus:ring-2 focus:ring-amber-500/20 outline-none cursor-pointer"
                >
                  <option value="">-- Choose Account --</option>
                  {paymentAccounts.map(acc => {
                    const avail = getAccountLiveBalance(acc.id);
                    return (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.type}) — Available: {formatCurrency(avail, settings)}
                      </option>
                    );
                  })}
                </select>

                {/* Live Account Balance Warning */}
                {advanceFormData.paymentAccountId && (() => {
                  const avail = getAccountLiveBalance(advanceFormData.paymentAccountId);
                  const req = Number(advanceFormData.amount) || 0;
                  const isInsufficient = req > 0 && avail < req;

                  return (
                    <div className={cn(
                      "mt-2 p-2.5 rounded-xl text-xs font-bold flex items-center justify-between",
                      isInsufficient ? "bg-rose-100 text-rose-900 border border-rose-300" : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    )}>
                      <span>Available Balance: {formatCurrency(avail, settings)}</span>
                      {isInsufficient && (
                        <span className="text-rose-700">⚠️ Insufficient funds!</span>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Disbursed Date
                </label>
                <input
                  type="date"
                  value={advanceFormData.date}
                  onChange={e => setAdvanceFormData({...advanceFormData, date: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Purpose / Notes (Optional)
                </label>
                <input
                  type="text"
                  value={advanceFormData.notes}
                  onChange={e => setAdvanceFormData({...advanceFormData, notes: e.target.value})}
                  placeholder="e.g. Family emergency, advance for eid"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingAdvance(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    advanceFormData.amount === '' || 
                    Number(advanceFormData.amount) <= 0 || 
                    (advanceFormData.paymentAccountId ? getAccountLiveBalance(advanceFormData.paymentAccountId) < Number(advanceFormData.amount) : false)
                  }
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Disburse Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* ── MODAL 3: Quick Payout for Pending Salary ── */}
      {/* ══════════════════════════════════════════════════ */}
      {payoutSalaryRecord && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div className="px-6 py-4 bg-emerald-700 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <DollarSign size={18} />
                  Disburse Salary Payout
                </h3>
                <p className="text-[11px] text-emerald-100 mt-0.5">
                  Confirm account and disburse pending salary
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPayoutSalaryRecord(null)}
                className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Employee:</span>
                  <span className="font-bold text-gray-900">{payoutSalaryRecord.employeeName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Salary Month:</span>
                  <span className="font-bold text-gray-900">{payoutSalaryRecord.month}</span>
                </div>
                {payoutSalaryRecord.advanceDeduction ? (
                  <div className="flex justify-between items-center text-amber-700">
                    <span>Advance Recovered:</span>
                    <span className="font-bold">-{formatCurrency(payoutSalaryRecord.advanceDeduction, settings)}</span>
                  </div>
                ) : null}
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-gray-700 text-sm">Net Pay To Disburse:</span>
                  <span className="font-black text-emerald-700 text-lg tabular-nums">
                    {formatCurrency(payoutSalaryRecord.netPay || 0, settings)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Select Payment Account <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={payoutAccountId}
                  onChange={e => setPayoutAccountId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:bg-white outline-none cursor-pointer"
                >
                  <option value="">-- Choose Account --</option>
                  {paymentAccounts.map(acc => {
                    const avail = getAccountLiveBalance(acc.id);
                    return (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.type}) — Available: {formatCurrency(avail, settings)}
                      </option>
                    );
                  })}
                </select>

                {/* Balance validation indicator */}
                {payoutAccountId && (() => {
                  const avail = getAccountLiveBalance(payoutAccountId);
                  const net = payoutSalaryRecord.netPay || 0;
                  const isInsufficient = avail < net;

                  return (
                    <div className={cn(
                      "mt-2 p-2 rounded-lg text-xs font-bold flex items-center justify-between",
                      isInsufficient ? "bg-rose-100 text-rose-900 border border-rose-300" : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    )}>
                      <span>Available Balance: {formatCurrency(avail, settings)}</span>
                      {isInsufficient && (
                        <span className="text-rose-700">⚠️ Insufficient funds!</span>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayoutSalaryRecord(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isPayingOut || !payoutAccountId || (getAccountLiveBalance(payoutAccountId) < (payoutSalaryRecord.netPay || 0))}
                  onClick={handleExecutePendingPayout}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  {isPayingOut ? 'Processing...' : 'Confirm & Disburse'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* ── MODAL 4: Quick Edit Base Salary / Increment ── */}
      {/* ══════════════════════════════════════════════════ */}
      {salaryModalEmployee && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#081621] text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <CreditCard size={18} className="text-indigo-400" />
                  Update Salary: {salaryModalEmployee.name}
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5">Set monthly base salary and track pay increments</p>
              </div>
              <button
                type="button"
                onClick={() => setSalaryModalEmployee(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveQuickSalary} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Current Base Salary</span>
                  <span className="text-base font-black text-slate-800">
                    {salaryModalEmployee.baseSalary ? formatCurrency(salaryModalEmployee.baseSalary, settings) : '৳0'}
                  </span>
                </div>
                {salaryModalEmployee.salaryHike ? (
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Last Hike</span>
                    <span className="text-xs font-bold text-emerald-600">
                      +{formatCurrency(salaryModalEmployee.salaryHike, settings)}
                    </span>
                  </div>
                ) : null}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  New Monthly Base Salary (BDT) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={newSalaryAmount}
                    onChange={e => setNewSalaryAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 25000"
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Live Hike Preview */}
                {newSalaryAmount !== '' && Number(newSalaryAmount) !== (salaryModalEmployee.baseSalary || 0) && (
                  <div className={cn(
                    "mt-2 p-2.5 rounded-xl border text-[11px] font-bold flex items-center justify-between",
                    Number(newSalaryAmount) > (salaryModalEmployee.baseSalary || 0)
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-rose-50 border-rose-200 text-rose-800"
                  )}>
                    <span>Salary Increment / Adjustment:</span>
                    <span className="font-black text-xs">
                      {Number(newSalaryAmount) > (salaryModalEmployee.baseSalary || 0) ? '+' : ''}
                      {formatCurrency(Number(newSalaryAmount) - (salaryModalEmployee.baseSalary || 0), settings)}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Increment Note / Reason (Optional)
                </label>
                <input
                  type="text"
                  value={salaryHikeNote}
                  onChange={e => setSalaryHikeNote(e.target.value)}
                  placeholder="e.g. Annual increment / Role promotion"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSalaryModalEmployee(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSalaryHike || newSalaryAmount === ''}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {savingSalaryHike ? 'Saving...' : 'Save Salary'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* ── MODAL 5: Increment History ── */}
      {/* ══════════════════════════════════════════════════ */}
      {historyEmployee && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#081621] text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <History size={18} className="text-indigo-400" />
                  Salary History: {historyEmployee.name}
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5">Timeline of salary hikes and adjustments</p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryEmployee(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3 text-xs">
              {historyEmployee.salaryHistory && historyEmployee.salaryHistory.length > 0 ? (
                historyEmployee.salaryHistory.map((h, i) => (
                  <div key={i} className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-slate-800 text-sm">{formatCurrency(h.newSalary, settings)}</span>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                        h.hikeAmount >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      )}>
                        {h.hikeAmount >= 0 ? '+' : ''}{formatCurrency(h.hikeAmount, settings)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Previous: {formatCurrency(h.oldSalary, settings)} • Date: {new Date(h.date).toLocaleDateString()}
                    </div>
                    {h.note && (
                      <div className="text-[11px] text-slate-600 italic">"{h.note}"</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 italic">No history records available</div>
              )}
            </div>
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setHistoryEmployee(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SalaryTab;
