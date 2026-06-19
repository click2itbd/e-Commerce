const fs = require('fs');
const path = './src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const employeeModalStart = content.indexOf('{/* Employee Modal */}');
const leaveModalStart = content.indexOf('{/* Leave Modal */}');

if (employeeModalStart !== -1 && leaveModalStart !== -1) {
    const oldModals = content.substring(employeeModalStart, leaveModalStart);

    const newModals = `{/* Add User Modal */}
      {isAddingUser && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#081621] text-white">
              <h2 className="text-xl font-bold">New Portal User</h2>
              <button onClick={() => setIsAddingUser(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddPortalUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Display Name</label>
                <input type="text" required className="w-full border-gray-300 rounded-md" value={userFormData.name} onChange={e => setUserFormData({...userFormData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                <input type="email" required className="w-full border-gray-300 rounded-md" value={userFormData.email} onChange={e => setUserFormData({...userFormData, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                <input type="password" required minLength={6} className="w-full border-gray-300 rounded-md" value={userFormData.password} onChange={e => setUserFormData({...userFormData, password: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Role</label>
                <select className="w-full border-gray-300 rounded-md" value={userFormData.role} onChange={e => setUserFormData({...userFormData, role: e.target.value})}>
                  <option value="user">User</option>
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsAddingUser(false)} className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-[#EF4444] rounded-md hover:bg-red-600">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Modal */}
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

      `;
    content = content.replace(oldModals, newModals);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Phase 2 injection complete.');
} else {
    console.log('Markers not found!');
}
