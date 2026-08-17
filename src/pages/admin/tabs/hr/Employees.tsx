import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, getDocs, orderBy } from 'firebase/firestore';
import { db, storage } from '../../../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Employee } from '../../../../types';
import { formatCurrency, cn } from '../../../../lib/utils';
import { toast } from 'react-hot-toast';
import { Briefcase, X, Upload, FileText } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';

const EmployeesTab: React.FC = () => {
  const { isAdmin, hasPermission } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [employeeFormData, setEmployeeFormData] = useState<any>({ name: '', email: '', phone: '', role: 'Staff', baseSalary: 0, status: 'active', joinDate: '', confirmDate: '', dateOfBirth: '', nidNumber: '', certificateUrl: '', nidUrl: '', cvUrl: '' });
  const [isUploading, setIsUploading] = useState(false);

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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const q = query(collection(db, 'employees'), orderBy('name'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Briefcase className="text-[#EF4444]" /> Employee Directory
        </h2>
        <button onClick={() => {
          setEditingEmployee(null);
          setEmployeeFormData({ name: '', email: '', phone: '', role: 'Staff', baseSalary: 0, status: 'active', joinDate: '', confirmDate: '', dateOfBirth: '', nidNumber: '', certificateUrl: '', nidUrl: '', cvUrl: '' });
          setIsAddingEmployee(true);
        }} className="bg-[#081621] text-white px-4 py-2 rounded-md hover:bg-[#EF4444] transition-all font-bold text-sm">
           + Add Employee
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
            <tr><th className="px-6 py-4">Name</th><th className="px-6 py-4">Contact</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {employees.map(emp => (
              <tr key={emp.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-bold">{emp.name}</td>
                <td className="px-6 py-4 text-gray-500 text-xs"><div className="truncate w-32">{emp.email}</div>{emp.phone}</td>
                <td className="px-6 py-4">{emp.role}</td>
                <td className="px-6 py-4"><span className={cn("px-2 py-1 uppercase text-[10px] font-bold rounded", emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>{emp.status || 'active'}</span></td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => { setEditingEmployee(emp); setEmployeeFormData(emp); setIsAddingEmployee(true); }} className="text-blue-600 font-bold hover:underline text-xs">Edit</button>
                  <button onClick={() => { if(window.confirm('Are you sure?')) deleteDoc(doc(db, 'employees', emp.id)).then(() => fetchData())}} className="text-red-500 font-bold hover:underline text-xs">Delete</button>
                </td>
              </tr>
            ))}
            {employees.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-500">No employees found.</td></tr>}
          </tbody>
        </table>
      </div>

      {isAddingEmployee && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl overflow-y-auto max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#081621] text-white">
              <h2 className="text-xl font-bold">{editingEmployee ? 'Edit Employee' : 'New Employee'}</h2>
              <button onClick={() => setIsAddingEmployee(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (editingEmployee) {
                await updateDoc(doc(db, 'employees', editingEmployee.id), employeeFormData);
              } else {
                await addDoc(collection(db, 'employees'), { ...employeeFormData, createdAt: new Date().toISOString() });
              }
              setIsAddingEmployee(false);
              fetchData();
            }} className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <h3 className="font-bold text-gray-800 border-b pb-2">Basic Info</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Name</label>
                    <input type="text" required className="w-full border-gray-300 rounded-md" value={employeeFormData.name || ''} onChange={e => setEmployeeFormData({...employeeFormData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                    <input type="email" required className="w-full border-gray-300 rounded-md" value={employeeFormData.email || ''} onChange={e => setEmployeeFormData({...employeeFormData, email: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Phone</label>
                    <input type="tel" required className="w-full border-gray-300 rounded-md" value={employeeFormData.phone || ''} onChange={e => setEmployeeFormData({...employeeFormData, phone: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Date of Birth</label>
                    <input type="date" required className="w-full border-gray-300 rounded-md" value={employeeFormData.dateOfBirth || ''} onChange={e => setEmployeeFormData({...employeeFormData, dateOfBirth: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">NID Number</label>
                     <input type="text" required className="w-full border-gray-300 rounded-md" value={employeeFormData.nidNumber || ''} onChange={e => setEmployeeFormData({...employeeFormData, nidNumber: e.target.value})} />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">Role</label>
                     <select className="w-full border-gray-300 rounded-md" value={employeeFormData.role || 'Staff'} onChange={e => setEmployeeFormData({...employeeFormData, role: e.target.value})}>
                       <option value="Staff">Staff</option>
                       <option value="Manager">Manager</option>
                       <option value="Technician">Technician</option>
                     </select>
                   </div>
                 </div>
               </div>

               <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                 <h3 className="font-bold text-gray-800 border-b pb-2">Employment Details</h3>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">Join Date</label>
                     <input type="date" required className="w-full border-gray-300 rounded-md" value={employeeFormData.joinDate || ''} onChange={e => setEmployeeFormData({...employeeFormData, joinDate: e.target.value})} />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">Confirm Date</label>
                     <input type="date" className="w-full border-gray-300 rounded-md" value={employeeFormData.confirmDate || ''} onChange={e => setEmployeeFormData({...employeeFormData, confirmDate: e.target.value})} />
                   </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Base Salary</label>
                      <input type="number" className="w-full border-gray-300 rounded-md" value={employeeFormData.baseSalary || 0} onChange={e => setEmployeeFormData({...employeeFormData, baseSalary: parseFloat(e.target.value) || 0})} />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                     <select className="w-full border-gray-300 rounded-md" value={employeeFormData.status || 'active'} onChange={e => setEmployeeFormData({...employeeFormData, status: e.target.value})}>
                       <option value="active">Active</option>
                       <option value="on_leave">On Leave</option>
                       <option value="terminated">Terminated</option>
                     </select>
                   </div>
                 </div>
               </div>

               <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                 <h3 className="font-bold text-gray-800 border-b pb-2">Attachments</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">Certificate</label>
                     <div className="flex items-center gap-2">
                        <input type="file" id="cert-upload" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={async (e) => {
                          const url = await handleFileUpload(e.target.files?.[0] || null);
                          if (url) setEmployeeFormData({...employeeFormData, certificateUrl: url});
                        }} />
                        <label htmlFor="cert-upload" className="cursor-pointer bg-white px-3 py-2 border border-gray-300 rounded-md text-sm text-center flex-1 hover:bg-gray-50 flex items-center justify-center gap-2">
                          <Upload size={14} /> Upload
                        </label>
                        {employeeFormData.certificateUrl && <a href={employeeFormData.certificateUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 bg-blue-50 p-2 rounded" title="View Certificate"><FileText size={16} /></a>}
                     </div>
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">NID Card</label>
                     <div className="flex items-center gap-2">
                        <input type="file" id="nid-upload" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={async (e) => {
                          const url = await handleFileUpload(e.target.files?.[0] || null);
                          if (url) setEmployeeFormData({...employeeFormData, nidUrl: url});
                        }} />
                        <label htmlFor="nid-upload" className="cursor-pointer bg-white px-3 py-2 border border-gray-300 rounded-md text-sm text-center flex-1 hover:bg-gray-50 flex items-center justify-center gap-2">
                          <Upload size={14} /> Upload
                        </label>
                        {employeeFormData.nidUrl && <a href={employeeFormData.nidUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 bg-blue-50 p-2 rounded" title="View NID"><FileText size={16} /></a>}
                     </div>
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">CV (Soft Copy)</label>
                     <div className="flex items-center gap-2">
                        <input type="file" id="cv-upload" className="hidden" accept=".pdf,.doc,.docx" onChange={async (e) => {
                          const url = await handleFileUpload(e.target.files?.[0] || null);
                          if (url) setEmployeeFormData({...employeeFormData, cvUrl: url});
                        }} />
                        <label htmlFor="cv-upload" className="cursor-pointer bg-white px-3 py-2 border border-gray-300 rounded-md text-sm text-center flex-1 hover:bg-gray-50 flex items-center justify-center gap-2">
                          <Upload size={14} /> Upload
                        </label>
                        {employeeFormData.cvUrl && <a href={employeeFormData.cvUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 bg-blue-50 p-2 rounded" title="View CV"><FileText size={16} /></a>}
                     </div>
                   </div>
                 </div>
               </div>

               <div className="flex justify-end gap-2 pt-4">
                 <button type="button" onClick={() => setIsAddingEmployee(false)} className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                 <button type="submit" disabled={isUploading} className="px-4 py-2 text-sm font-bold text-white bg-[#EF4444] rounded-md hover:bg-red-600 disabled:opacity-50">Save Employee</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesTab;
