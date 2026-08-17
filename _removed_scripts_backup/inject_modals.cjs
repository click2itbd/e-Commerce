const fs = require('fs');

const path = './src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const anchor = '{/* PC Builder Modal for Sales */}';

const hrModals = `
      {/* Employee Modal */}
      {isAddingEmployee && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-lg overflow-hidden flex flex-col">
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
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Name</label>
                <input type="text" required className="w-full border-gray-300 rounded-md" value={employeeFormData.name || ''} onChange={e => setEmployeeFormData({...employeeFormData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                  <input type="email" required className="w-full border-gray-300 rounded-md" value={employeeFormData.email || ''} onChange={e => setEmployeeFormData({...employeeFormData, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Phone</label>
                  <input type="tel" required className="w-full border-gray-300 rounded-md" value={employeeFormData.phone || ''} onChange={e => setEmployeeFormData({...employeeFormData, phone: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Role</label>
                  <select className="w-full border-gray-300 rounded-md" value={employeeFormData.role || 'Staff'} onChange={e => setEmployeeFormData({...employeeFormData, role: e.target.value})}>
                    <option value="Staff">Staff</option>
                    <option value="Manager">Manager</option>
                    <option value="Technician">Technician</option>
                  </select>
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
              <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">Base Salary</label>
                 <input type="number" className="w-full border-gray-300 rounded-md" value={employeeFormData.baseSalary || 0} onChange={e => setEmployeeFormData({...employeeFormData, baseSalary: parseFloat(e.target.value) || 0})} />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsAddingEmployee(false)} className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-[#EF4444] rounded-md hover:bg-red-600">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Modal */}
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
                  <label className="block text-sm font-bold text-gray-700 mb-1">Start Date</label>
                  <input type="date" required className="w-full border-gray-300 rounded-md" value={leaveFormData.startDate || ''} onChange={e => setLeaveFormData({...leaveFormData, startDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">End Date</label>
                  <input type="date" required className="w-full border-gray-300 rounded-md" value={leaveFormData.endDate || ''} onChange={e => setLeaveFormData({...leaveFormData, endDate: e.target.value})} />
                </div>
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

      {/* Salary Modal */}
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
                  {formatCurrency((Number(salaryFormData.baseAmount) || 0) + (Number(salaryFormData.bonus) || 0) - (Number(salaryFormData.deductions) || 0))}
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

      {/* PC Builder Modal for Sales */}
`;

content = content.replace(anchor, hrModals);
fs.writeFileSync(path, content, 'utf8');
