import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, getDocs, orderBy } from 'firebase/firestore';
import { db, storage } from '../../../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Employee } from '../../../../types';
import { formatCurrency, cn } from '../../../../lib/utils';
import { toast } from 'react-hot-toast';
import { 
  Briefcase, User, X, Upload, FileText, Plus, Search, 
  Edit2, Trash2, Mail, Phone, Calendar, CreditCard, Shield,
  RefreshCw, TrendingUp, AlertCircle, DollarSign, History
} from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { useSettings } from '../../../../context/SettingsContext';
import { syncAppAccessStaff } from '../../../../lib/employeeSync';
import { logAudit } from '../../../../lib/audit';

const EmployeesTab: React.FC = () => {
  const { profile, user, isAdmin, hasPermission } = useAuth();
  const { settings } = useSettings();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [employeeFormData, setEmployeeFormData] = useState<any>({ 
    name: '', email: '', phone: '', role: 'Staff', baseSalary: 0, 
    status: 'active', joinDate: '', confirmDate: '', dateOfBirth: '', 
    nidNumber: '', certificateUrl: '', nidUrl: '', cvUrl: '' 
  });
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Salary Edit Modal State
  const [salaryModalEmployee, setSalaryModalEmployee] = useState<Employee | null>(null);
  const [newSalaryAmount, setNewSalaryAmount] = useState<number | ''>('');
  const [salaryHikeNote, setSalaryHikeNote] = useState('');
  const [savingSalary, setSavingSalary] = useState(false);

  // History Popover / Modal State
  const [historyEmployee, setHistoryEmployee] = useState<Employee | null>(null);

  const handleFileUpload = async (file: File | null) => {
    if (!file) return null;
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `hr/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setIsUploading(false);
      return url;
    } catch (err) {
      setIsUploading(false);
      toast.error('File upload failed');
      return null;
    }
  };

  const fetchData = async (showToast = false) => {
    try {
      setIsSyncing(true);
      const syncedList = await syncAppAccessStaff();
      syncedList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setEmployees(syncedList);
      if (showToast) {
        toast.success('Synced employees with App Access users!');
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (!isAdmin && !hasPermission('manage_hr')) {
    return null;
  }

  const getInitials = (name: string) => {
    return (name || 'Staff').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const formatJoinDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? 'N/A' : parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">Active</span>;
      case 'on_leave':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20">On Leave</span>;
      case 'terminated':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20">Terminated</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20">{status || 'Active'}</span>;
    }
  };

  const handleSaveQuickSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salaryModalEmployee) return;

    const currentBase = Number(salaryModalEmployee.baseSalary) || 0;
    const newBase = Number(newSalaryAmount) || 0;

    if (newBase <= 0) {
      toast.error('Please enter a valid salary amount');
      return;
    }

    setSavingSalary(true);
    try {
      const hike = newBase - currentBase;
      const now = new Date().toISOString();
      const currentUser = profile?.displayName || user?.displayName || user?.email || 'Admin';

      const historyEntry = {
        date: now,
        oldSalary: currentBase,
        newSalary: newBase,
        hikeAmount: hike,
        note: salaryHikeNote.trim() || 'Salary adjustment',
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
        `Updated salary for ${salaryModalEmployee.name}: ${formatCurrency(currentBase, settings)} → ${formatCurrency(newBase, settings)} (Hike: ${hike >= 0 ? '+' : ''}${formatCurrency(hike, settings)})`,
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
      setSavingSalary(false);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    (emp.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (emp.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (emp.role || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Briefcase className="text-indigo-600" size={26} />
            Team Members
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage your staff members, App Access staff, employment profiles, salaries and increments.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search members..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-full sm:w-60 bg-white transition-all shadow-2xs"
            />
          </div>

          {/* Sync with App Access Button */}
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-60"
            title="Auto-sync and import staff and admin users from App Access"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin text-indigo-600")} />
            {isSyncing ? 'Syncing...' : 'Sync App Access'}
          </button>

          <button 
            onClick={() => {
              setEditingEmployee(null);
              setEmployeeFormData({ 
                name: '', email: '', phone: '', role: 'Staff', baseSalary: 0, 
                status: 'active', joinDate: new Date().toISOString().split('T')[0], 
                confirmDate: '', dateOfBirth: '', nidNumber: '', certificateUrl: '', nidUrl: '', cvUrl: '' 
              });
              setIsAddingEmployee(true);
            }} 
            className="inline-flex items-center justify-center gap-1.5 bg-[#081621] text-white px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors text-xs font-bold whitespace-nowrap shadow-sm cursor-pointer"
          >
             <Plus className="w-4 h-4" /> Add Member
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-gray-50/70 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Role & App Access</th>
                <th className="px-6 py-4">Monthly Salary & Increments</th>
                <th className="px-6 py-4">Advance Taken</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEmployees.map(emp => {
                const hike = Number(emp.salaryHike) || 0;
                const advance = Number(emp.advanceBalance) || 0;
                const hasHike = hike !== 0 && emp.previousSalary !== undefined;

                return (
                  <tr key={emp.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 flex items-center justify-center font-bold text-sm ring-1 ring-black/5 shrink-0">
                          {getInitials(emp.name)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-sm">{emp.name}</div>
                          <div className="text-gray-500 text-[11px] mt-0.5">Joined: {formatJoinDate(emp.joinDate)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 font-medium">{emp.email || '-'}</div>
                      <div className="text-gray-500 text-[11px] mt-0.5">{emp.phone || 'No phone'}</div>
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
                      <div className="space-y-1">
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
                            title="Edit salary / increment"
                          >
                            Set / Edit
                          </button>
                        </div>
                        {hasHike && (
                          <div className="flex items-center gap-1">
                            <span className={cn(
                              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold",
                              hike > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                            )}>
                              <TrendingUp size={10} />
                              {hike > 0 ? `+${formatCurrency(hike, settings)}` : formatCurrency(hike, settings)}
                            </span>
                            {emp.salaryHistory && emp.salaryHistory.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setHistoryEmployee(emp)}
                                className="text-gray-400 hover:text-indigo-600 p-0.5 cursor-pointer"
                                title="View increment history"
                              >
                                <History size={12} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {advance > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <AlertCircle size={12} className="text-amber-600" />
                          {formatCurrency(advance, settings)}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs font-medium">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(emp.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { setEditingEmployee(emp); setEmployeeFormData(emp); setIsAddingEmployee(true); }} 
                          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit member details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => { 
                            if(window.confirm(`Are you sure you want to remove team member "${emp.name}"?`)) {
                              deleteDoc(doc(db, 'employees', emp.id)).then(() => {
                                toast.success('Member removed');
                                fetchData();
                              });
                            }
                          }} 
                          className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Briefcase className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-base font-bold text-gray-800">No team members found</p>
                      <p className="text-xs text-gray-400 mt-1">Try clicking "Sync App Access" or add a new team member.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Salary Edit Modal */}
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
                  placeholder="e.g. Annual performance increment / Role promotion"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSalaryModalEmployee(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSalary || newSalaryAmount === ''}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {savingSalary ? 'Saving...' : 'Save Salary'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Increment History Modal */}
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

      {/* Add/Edit Full Profile Modal */}
      {isAddingEmployee && (
        <div className="fixed inset-0 z-[100] bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col my-auto max-h-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingEmployee ? 'Edit Team Member' : 'Add New Member'}
                </h2>
                <p className="text-xs text-gray-500 mt-1">Fill in the information below to {editingEmployee ? 'update' : 'create'} the employee profile.</p>
              </div>
              <button 
                onClick={() => setIsAddingEmployee(false)} 
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                if (editingEmployee) {
                  const oldBase = Number(editingEmployee.baseSalary) || 0;
                  const newBase = Number(employeeFormData.baseSalary) || 0;
                  let updatePayload = { ...employeeFormData };

                  if (newBase !== oldBase && newBase > 0) {
                    const hike = newBase - oldBase;
                    const historyItem = {
                      date: new Date().toISOString(),
                      oldSalary: oldBase,
                      newSalary: newBase,
                      hikeAmount: hike,
                      note: 'Updated from profile edit',
                    };
                    updatePayload = {
                      ...updatePayload,
                      previousSalary: oldBase,
                      salaryHike: hike,
                      lastHikeDate: new Date().toISOString(),
                      salaryHistory: [...(editingEmployee.salaryHistory || []), historyItem],
                    };
                  }
                  await updateDoc(doc(db, 'employees', editingEmployee.id), updatePayload);
                } else {
                  await addDoc(collection(db, 'employees'), { 
                    ...employeeFormData, 
                    advanceBalance: 0,
                    createdAt: new Date().toISOString() 
                  });
                }
                setIsAddingEmployee(false);
                fetchData();
                toast.success(`Employee successfully ${editingEmployee ? 'updated' : 'added'}`);
              } catch (err: any) {
                console.error(err);
                toast.error('Failed to save employee');
              }
            }} className="overflow-y-auto">
              
              <div className="p-6 space-y-8">
                
                {/* Basic Info Section */}
                <div>
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-500" /> Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Full Name <span className="text-rose-500">*</span></label>
                      <input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs" value={employeeFormData.name || ''} onChange={e => setEmployeeFormData({...employeeFormData, name: e.target.value})} placeholder="e.g. Jane Doe" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Email Address <span className="text-rose-500">*</span></label>
                      <input type="email" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs" value={employeeFormData.email || ''} onChange={e => setEmployeeFormData({...employeeFormData, email: e.target.value})} placeholder="jane@example.com" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number <span className="text-rose-500">*</span></label>
                      <input type="tel" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs" value={employeeFormData.phone || ''} onChange={e => setEmployeeFormData({...employeeFormData, phone: e.target.value})} placeholder="01XXXXXXXXX" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Date of Birth</label>
                      <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-700" value={employeeFormData.dateOfBirth || ''} onChange={e => setEmployeeFormData({...employeeFormData, dateOfBirth: e.target.value})} />
                    </div>
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Employment Section */}
                <div>
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-indigo-500" /> Employment Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Job Role</label>
                      <input list="roles_list" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs" value={employeeFormData.role || 'Staff'} onChange={e => setEmployeeFormData({...employeeFormData, role: e.target.value})} />
                      <datalist id="roles_list">
                        <option value="Admin" />
                        <option value="Manager" />
                        <option value="Staff" />
                        <option value="Technician" />
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Employment Status</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white" value={employeeFormData.status || 'active'} onChange={e => setEmployeeFormData({...employeeFormData, status: e.target.value})}>
                        <option value="active">Active</option>
                        <option value="on_leave">On Leave</option>
                        <option value="terminated">Terminated</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Join Date <span className="text-rose-500">*</span></label>
                      <input type="date" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-700" value={employeeFormData.joinDate || ''} onChange={e => setEmployeeFormData({...employeeFormData, joinDate: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Confirmation Date</label>
                      <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-700" value={employeeFormData.confirmDate || ''} onChange={e => setEmployeeFormData({...employeeFormData, confirmDate: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Monthly Base Salary (BDT)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">৳</span>
                        <input type="number" min="0" step="100" className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-800" value={employeeFormData.baseSalary || ''} onChange={e => setEmployeeFormData({...employeeFormData, baseSalary: parseFloat(e.target.value) || 0})} placeholder="0" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">NID Number</label>
                      <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs" value={employeeFormData.nidNumber || ''} onChange={e => setEmployeeFormData({...employeeFormData, nidNumber: e.target.value})} placeholder="National ID" />
                    </div>
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Documents Section */}
                <div>
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-500" /> Documents & Attachments
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* Certificate */}
                    <div className="border border-dashed border-gray-300 rounded-xl p-3 flex flex-col items-center justify-center text-center bg-gray-50/50">
                      <p className="text-xs font-bold text-gray-800 mb-1">Certificate</p>
                      <input type="file" id="cert-upload" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={async (e) => {
                        const url = await handleFileUpload(e.target.files?.[0] || null);
                        if (url) setEmployeeFormData({...employeeFormData, certificateUrl: url});
                      }} />
                      <div className="flex w-full gap-2 mt-2">
                        <label htmlFor="cert-upload" className="cursor-pointer bg-white px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-center flex-1 hover:border-gray-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-1 font-bold">
                          <Upload className="w-3.5 h-3.5" /> Upload
                        </label>
                        {employeeFormData.certificateUrl && (
                          <a href={employeeFormData.certificateUrl} target="_blank" rel="noopener noreferrer" className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg hover:bg-indigo-100 transition-colors" title="View Document">
                            <FileText className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* NID */}
                    <div className="border border-dashed border-gray-300 rounded-xl p-3 flex flex-col items-center justify-center text-center bg-gray-50/50">
                      <p className="text-xs font-bold text-gray-800 mb-1">NID Card</p>
                      <input type="file" id="nid-upload" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={async (e) => {
                        const url = await handleFileUpload(e.target.files?.[0] || null);
                        if (url) setEmployeeFormData({...employeeFormData, nidUrl: url});
                      }} />
                      <div className="flex w-full gap-2 mt-2">
                        <label htmlFor="nid-upload" className="cursor-pointer bg-white px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-center flex-1 hover:border-gray-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-1 font-bold">
                          <Upload className="w-3.5 h-3.5" /> Upload
                        </label>
                        {employeeFormData.nidUrl && (
                          <a href={employeeFormData.nidUrl} target="_blank" rel="noopener noreferrer" className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg hover:bg-indigo-100 transition-colors" title="View Document">
                            <FileText className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Resume / CV */}
                    <div className="border border-dashed border-gray-300 rounded-xl p-3 flex flex-col items-center justify-center text-center bg-gray-50/50">
                      <p className="text-xs font-bold text-gray-800 mb-1">Resume / CV</p>
                      <input type="file" id="cv-upload" className="hidden" accept=".pdf,.doc,.docx" onChange={async (e) => {
                        const url = await handleFileUpload(e.target.files?.[0] || null);
                        if (url) setEmployeeFormData({...employeeFormData, cvUrl: url});
                      }} />
                      <div className="flex w-full gap-2 mt-2">
                        <label htmlFor="cv-upload" className="cursor-pointer bg-white px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-center flex-1 hover:border-gray-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-1 font-bold">
                          <Upload className="w-3.5 h-3.5" /> Upload
                        </label>
                        {employeeFormData.cvUrl && (
                          <a href={employeeFormData.cvUrl} target="_blank" rel="noopener noreferrer" className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg hover:bg-indigo-100 transition-colors" title="View Document">
                            <FileText className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3 sticky bottom-0 z-10 rounded-b-2xl">
                <button 
                  type="button" 
                  onClick={() => setIsAddingEmployee(false)} 
                  className="px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 shadow-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isUploading} 
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isUploading ? 'Uploading...' : (editingEmployee ? 'Save Changes' : 'Add Member')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesTab;
