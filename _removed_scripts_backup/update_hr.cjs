const fs = require('fs');

const path = './src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const employeesTabStart = content.indexOf(`        ) : activeTab === 'employees' ? (`);
const salaryTabEnd = content.indexOf(`        ) : (`, employeesTabStart);

if (employeesTabStart !== -1 && salaryTabEnd !== -1) {
    const oldCode = content.substring(employeesTabStart, salaryTabEnd);
    
    const newCode = `        ) : activeTab === 'employees' ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Briefcase className="text-[#EF4444]" /> Employee Directory
              </h2>
              <button onClick={() => {
                setEditingEmployee(null);
                setEmployeeFormData({ name: '', email: '', phone: '', role: 'Staff', baseSalary: 0, status: 'active' });
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
          </div>
        ) : activeTab === 'leave' ? (
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
                           <button onClick={() => {updateDoc(doc(db, 'employee_leaves', leave.id), { status: 'approved' }).then(() => fetchData())}} className="text-green-600 font-bold hover:underline text-xs">Approve</button>
                           <button onClick={() => {updateDoc(doc(db, 'employee_leaves', leave.id), { status: 'rejected' }).then(() => fetchData())}} className="text-red-500 font-bold hover:underline text-xs">Reject</button>
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
          </div>
        ) : activeTab === 'salary' ? (
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
                      <td className="px-6 py-4 font-bold text-gray-900">{formatCurrency(sal.netPay || 0)}</td>
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
          </div>
`;

    content = content.replace(oldCode, newCode);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Successfully updated HR tabs UI');
} else {
    console.error('Markers not found');
}
