import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { Employee, EmployeeSalary, SiteSettings } from '../../../../types';
import { formatCurrency, cn } from '../../../../lib/utils';
import { toast } from 'react-hot-toast';
import { CreditCard, X } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { useSettings } from '../../../../context/SettingsContext';

const SalaryTab: React.FC = () => {
  const { isAdmin, hasPermission } = useAuth();
  const { settings } = useSettings();
  const [employeeSalaries, setEmployeeSalaries] = useState<EmployeeSalary[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isAddingSalary, setIsAddingSalary] = useState(false);
  const [editingSalary, setEditingSalary] = useState<any>(null);
  const [salaryFormData, setSalaryFormData] = useState<any>({ employeeName: '', employeeId: '', month: '', year: new Date().getFullYear().toString(), salary: 0, bonus: 0, deduction: 0, status: 'pending', paymentMethod: 'bank', notes: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const salariesQuery = query(collection(db, 'employee_salaries'), orderBy('createdAt', 'desc'));
      const salariesSnapshot = await getDocs(salariesQuery);
      const salariesData = salariesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmployeeSalary));
      setEmployeeSalaries(salariesData);

      const employeesQuery = query(collection(db, 'employees'), orderBy('name'));
      const employeesSnapshot = await getDocs(employeesQuery);
      const employeesData = employeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  if (!isAdmin) {
    return null;
  }

  const handleSaveSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSalary) {
        await updateDoc(doc(db, 'employee_salaries', editingSalary.id), salaryFormData);
        toast.success('Salary updated successfully');
      } else {
        await addDoc(collection(db, 'employee_salaries'), { ...salaryFormData, createdAt: new Date().toISOString() });
        toast.success('Salary recorded successfully');
      }
      setIsAddingSalary(false);
      setEditingSalary(null);
      setSalaryFormData({ employeeName: '', employeeId: '', month: '', year: new Date().getFullYear().toString(), salary: 0, bonus: 0, deduction: 0, status: 'pending', paymentMethod: 'bank', notes: '' });
      fetchData();
    } catch (error) {
      console.error('Error saving salary:', error);
      toast.error('Failed to save salary');
    }
  };

  const handleDeleteSalary = async (id: string) => {
    if (window.confirm('Delete this salary record?')) {
      await deleteDoc(doc(db, 'employee_salaries', id));
      toast.success('Salary record deleted successfully');
      fetchData();
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    await updateDoc(doc(db, 'employee_salaries', id), { status: 'paid' });
    toast.success('Salary marked as paid');
    fetchData();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
       <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CreditCard className="text-[#EF4444]" /> Salary & Payroll
        </h2>
        <button onClick={() => {
          setEditingSalary(null);
          setSalaryFormData({ employeeName: '', month: new Date().toISOString().slice(0, 7), baseAmount: 0, deductions: 0, bonus: 0, netPay: 0, status: 'pending', paymentDate: new Date().toISOString().split('T')[0] });
          setIsAddingSalary(true);
        }} className="bg-[#081621] text-white px-4 py-2 rounded-md hover:bg-[#EF4444] transition-all font-bold text-sm">
           + Process Salary
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
            <tr><th className="px-6 py-4">Employee</th><th className="px-6 py-4">Month</th><th className="px-6 py-4">Net Amount</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {employeeSalaries.map(sal => (
              <tr key={sal.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-bold">{sal.employeeName}</td>
                <td className="px-6 py-4">{sal.month}</td>
                <td className="px-6 py-4 font-bold text-gray-900">{formatCurrency(sal.netPay || 0, settings)}</td>
                <td className="px-6 py-4"><span className={cn("px-2 py-1 uppercase text-[10px] font-bold rounded", sal.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>{sal.status || 'pending'}</span></td>
                <td className="px-6 py-4 text-right space-x-2">
                  {sal.status !== 'paid' && (
                    <button onClick={() => {updateDoc(doc(db, 'employee_salaries', sal.id), { status: 'paid', paymentDate: new Date().toISOString() }).then(() => fetchData())}} className="text-green-600 font-bold hover:underline text-xs">Mark Paid</button>
                  )}
                  <button onClick={() => { setEditingSalary(sal); setSalaryFormData(sal); setIsAddingSalary(true); }} className="text-blue-600 font-bold hover:underline text-xs">Edit</button>
                  <button onClick={() => { if(window.confirm('Delete salary record?')) deleteDoc(doc(db, 'employee_salaries', sal.id)).then(() => fetchData())}} className="text-red-500 font-bold hover:underline text-xs">Del</button>
                </td>
              </tr>
            ))}
            {employeeSalaries.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-500">No salary records found.</td></tr>}
          </tbody>
        </table>
      </div>

      {isAddingSalary && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#081621] text-white">
              <h2 className="text-xl font-bold">{editingSalary ? 'Edit Salary Record' : 'Process Salary'}</h2>
              <button onClick={() => setIsAddingSalary(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const netPay = (Number(salaryFormData.baseAmount) || 0) + (Number(salaryFormData.bonus) || 0) - (Number(salaryFormData.deductions) || 0);
              const dataToSave = { ...salaryFormData, netPay };
              if (editingSalary) {
                await updateDoc(doc(db, 'employee_salaries', editingSalary.id), dataToSave);
              } else {
                await addDoc(collection(db, 'employee_salaries'), { ...dataToSave, createdAt: new Date().toISOString() });
              }
              setIsAddingSalary(false);
              fetchData();
            }} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Employee</label>
                  <select required className="w-full border-gray-300 rounded-md" value={salaryFormData.employeeName || ''} onChange={e => {
                    const empName = e.target.value;
                    const emp = employees.find(e => e.name === empName);
                    setSalaryFormData({...salaryFormData, employeeName: empName, baseAmount: emp ? emp.baseSalary || 0 : 0});
                  }}>
                    <option value="">Select Employee...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.name}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Month</label>
                  <input type="month" required className="w-full border-gray-300 rounded-md" value={salaryFormData.month || ''} onChange={e => setSalaryFormData({...salaryFormData, month: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Base Amount</label>
                  <input type="number" required className="w-full border-gray-300 rounded-md" value={salaryFormData.baseAmount || 0} onChange={e => setSalaryFormData({...salaryFormData, baseAmount: parseFloat(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Bonus</label>
                  <input type="number" className="w-full border-gray-300 rounded-md text-green-600" value={salaryFormData.bonus || 0} onChange={e => setSalaryFormData({...salaryFormData, bonus: parseFloat(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Deductions</label>
                  <input type="number" className="w-full border-gray-300 rounded-md text-red-600" value={salaryFormData.deductions || 0} onChange={e => setSalaryFormData({...salaryFormData, deductions: parseFloat(e.target.value) || 0})} />
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                <span className="font-bold text-gray-700">Calculated Net Pay:</span>
                <span className="text-xl font-bold text-[#EF4444]">
                  {formatCurrency((Number(salaryFormData.baseAmount) || 0) + (Number(salaryFormData.bonus) || 0) - (Number(salaryFormData.deductions) || 0), settings)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                 <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                  <select className="w-full border-gray-300 rounded-md" value={salaryFormData.status || 'pending'} onChange={e => setSalaryFormData({...salaryFormData, status: e.target.value})}>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                 <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Payment Date</label>
                  <input type="date" className="w-full border-gray-300 rounded-md" value={salaryFormData.paymentDate || ''} onChange={e => setSalaryFormData({...salaryFormData, paymentDate: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsAddingSalary(false)} className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-[#EF4444] rounded-md hover:bg-red-600">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryTab;
