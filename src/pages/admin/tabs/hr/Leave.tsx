import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { EmployeeLeave, Employee } from '../../../../types';
import { formatCurrency, cn } from '../../../../lib/utils';
import { toast } from 'react-hot-toast';
import { CheckCircle, X } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';

const LeaveTab: React.FC = () => {
  const { isAdmin, hasPermission } = useAuth();
  const [employeeLeaves, setEmployeeLeaves] = useState<EmployeeLeave[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isAddingLeave, setIsAddingLeave] = useState(false);
  const [editingLeave, setEditingLeave] = useState<any>(null);
  const [leaveFormData, setLeaveFormData] = useState<any>({ employeeName: '', type: 'casual', startDate: '', endDate: '', reason: '', status: 'pending' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const leavesQuery = query(collection(db, 'employee_leaves'), orderBy('createdAt', 'desc'));
      const leavesSnapshot = await getDocs(leavesQuery);
      const leavesData = leavesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmployeeLeave));
      setEmployeeLeaves(leavesData);

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

  const handleSaveLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLeave) {
        await updateDoc(doc(db, 'employee_leaves', editingLeave.id), leaveFormData);
        toast.success('Leave updated successfully');
      } else {
        await addDoc(collection(db, 'employee_leaves'), { ...leaveFormData, createdAt: new Date().toISOString() });
        toast.success('Leave recorded successfully');
      }
      setIsAddingLeave(false);
      setEditingLeave(null);
      setLeaveFormData({ employeeName: '', type: 'casual', startDate: '', endDate: '', reason: '', status: 'pending' });
      fetchData();
    } catch (error) {
      console.error('Error saving leave:', error);
      toast.error('Failed to save leave');
    }
  };

  const handleDeleteLeave = async (id: string) => {
    if (window.confirm('Delete this leave?')) {
      await deleteDoc(doc(db, 'employee_leaves', id));
      toast.success('Leave deleted successfully');
      fetchData();
    }
  };

  const handleApproveLeave = async (id: string) => {
    await updateDoc(doc(db, 'employee_leaves', id), { status: 'approved' });
    toast.success('Leave approved successfully');
    fetchData();
  };

  const handleRejectLeave = async (id: string) => {
    await updateDoc(doc(db, 'employee_leaves', id), { status: 'rejected' });
    toast.success('Leave rejected successfully');
    fetchData();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
       <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CheckCircle className="text-[#EF4444]" /> Leave Management
        </h2>
        <button onClick={() => {
          setEditingLeave(null);
          setLeaveFormData({ employeeName: '', type: 'casual', startDate: '', endDate: '', reason: '', status: 'pending' });
          setIsAddingLeave(true);
        }} className="bg-[#081621] text-white px-4 py-2 rounded-md hover:bg-[#EF4444] transition-all font-bold text-sm">
           + Record Leave
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
            <tr><th className="px-6 py-4">Employee</th><th className="px-6 py-4">Type</th><th className="px-6 py-4">Reason</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {employeeLeaves.map(leave => (
              <tr key={leave.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-bold">{leave.employeeName}</td>
                <td className="px-6 py-4 capitalize">{leave.type || 'casual'}</td>
                <td className="px-6 py-4 text-gray-600 truncate max-w-xs">{leave.reason}</td>
                <td className="px-6 py-4"><span className={cn("px-2 py-1 uppercase text-[10px] font-bold rounded", leave.status === 'approved' ? 'bg-green-100 text-green-700' : leave.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700')}>{leave.status || 'pending'}</span></td>
                <td className="px-6 py-4 text-right space-x-2">
                   {leave.status === 'pending' && (
                     <>
                     <button onClick={() => {updateDoc(doc(db, 'employee_leaves', leave.id), { status: 'approved' }).then(() => { toast.success('Leave approved successfully'); fetchData(); })}} className="text-green-600 font-bold hover:underline text-xs">Approve</button>
                     <button onClick={() => {updateDoc(doc(db, 'employee_leaves', leave.id), { status: 'rejected' }).then(() => { toast.success('Leave rejected successfully'); fetchData(); })}} className="text-red-500 font-bold hover:underline text-xs">Reject</button>
                     </>
                   )}
                   <button onClick={() => { setEditingLeave(leave); setLeaveFormData(leave); setIsAddingLeave(true); }} className="text-blue-600 font-bold hover:underline text-xs">Edit</button>
                   <button onClick={() => { if(window.confirm('Delete this leave?')) deleteDoc(doc(db, 'employee_leaves', leave.id)).then(() => fetchData())}} className="text-gray-500 font-bold hover:underline text-xs">Del</button>
                </td>
              </tr>
            ))}
            {employeeLeaves.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-500">No leaves recorded.</td></tr>}
          </tbody>
        </table>
      </div>

      {isAddingLeave && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#081621] text-white">
              <h2 className="text-xl font-bold">{editingLeave ? 'Edit Leave Request' : 'New Leave Request'}</h2>
              <button onClick={() => setIsAddingLeave(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (editingLeave) {
                await updateDoc(doc(db, 'employee_leaves', editingLeave.id), leaveFormData);
              } else {
                await addDoc(collection(db, 'employee_leaves'), { ...leaveFormData, createdAt: new Date().toISOString() });
              }
              setIsAddingLeave(false);
              fetchData();
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Employee</label>
                <select required className="w-full border-gray-300 rounded-md" value={leaveFormData.employeeName || ''} onChange={e => setLeaveFormData({...leaveFormData, employeeName: e.target.value})}>
                  <option value="">Select Employee...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.name}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Type</label>
                  <select className="w-full border-gray-300 rounded-md" value={leaveFormData.type || 'casual'} onChange={e => setLeaveFormData({...leaveFormData, type: e.target.value})}>
                    <option value="casual">Casual</option>
                    <option value="sick">Sick</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                  <select className="w-full border-gray-300 rounded-md" value={leaveFormData.status || 'pending'} onChange={e => setLeaveFormData({...leaveFormData, status: e.target.value})}>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Reason</label>
                <textarea required rows={3} className="w-full border-gray-300 rounded-md" value={leaveFormData.reason || ''} onChange={e => setLeaveFormData({...leaveFormData, reason: e.target.value})}></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsAddingLeave(false)} className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-[#EF4444] rounded-md hover:bg-red-600">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveTab;
