const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/pages/AdminDashboard.tsx');
let code = fs.readFileSync(filePath, 'utf8');

const replacements = [
  // Campaign Modal
  {
    start: '      {/* Campaign Modal */}',
    end: '      {/* Discount Code Modal */}',
    replacement: '      <CampaignModal isAddingCampaign={isAddingCampaign} setIsAddingCampaign={setIsAddingCampaign} editingCampaign={editingCampaign} setEditingCampaign={setEditingCampaign} campaignFormData={campaignFormData} setCampaignFormData={setCampaignFormData} handleSaveCampaign={handleSaveCampaign} users={users} />\n\n      {/* Discount Code Modal */}'
  },
  // Discount Code Modal
  {
    start: '      {/* Discount Code Modal */}',
    end: '\n\n      {isAddingHostingPlan',
    replacement: '      <DiscountCodeModal isAddingDiscountCode={isAddingDiscountCode} setIsAddingDiscountCode={setIsAddingDiscountCode} editingDiscountCode={editingDiscountCode} setEditingDiscountCode={setEditingDiscountCode} discountCodeFormData={discountCodeFormData} setDiscountCodeFormData={setDiscountCodeFormData} handleSaveDiscountCode={handleSaveDiscountCode} />\n\n      {isAddingHostingPlan'
  },
  // HostingPlan block (no comment marker) — find the entire {isAddingHostingPlan && ... block
  {
    start: '      {isAddingHostingPlan && (\n        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">\n          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">\n            <div className="p-6 border-b border-gray-100 flex items-center justify-between">\n              <h2 className="text-xl font-bold">{editingHostingPlan ? \'Edit\' : \'Create\'} Hosting Plan</h2>',
    end: '\n\n      {isAddingHostingService',
    replacement: '      <HostingPlanModal isAddingHostingPlan={isAddingHostingPlan} setIsAddingHostingPlan={setIsAddingHostingPlan} editingHostingPlan={editingHostingPlan} setEditingHostingPlan={setEditingHostingPlan} hostingPlanFormData={hostingPlanFormData} setHostingPlanFormData={setHostingPlanFormData} hostingServices={hostingServices} handleSaveHostingPlan={handleSaveHostingPlan} />\n\n      {isAddingHostingService'
  },
  // HostingService block
  {
    start: '      {isAddingHostingService && (\n        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">\n          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">\n            <div className="p-6 border-b border-gray-100 flex items-center justify-between">\n              <h2 className="text-xl font-bold">{editingHostingService ? \'Edit\' : \'Create\'} Hosting Service</h2>',
    end: '\n\n      {/* Service Record Modal */}',
    replacement: '      <HostingServiceModal isAddingHostingService={isAddingHostingService} setIsAddingHostingService={setIsAddingHostingService} editingHostingService={editingHostingService} setEditingHostingService={setEditingHostingService} hostingServiceFormData={hostingServiceFormData} setHostingServiceFormData={setHostingServiceFormData} handleSaveHostingService={handleSaveHostingService} />\n\n      {/* Service Record Modal */'
  },
  // Add User Modal
  {
    start: '      {/* Add User Modal */}',
    end: '\n\n      {/* Employee Modal */}',
    replacement: '      <AddUserModal isAddingUser={isAddingUser} setIsAddingUser={setIsAddingUser} userFormData={userFormData} setUserFormData={setUserFormData} handleAddPortalUser={handleAddPortalUser} />\n\n      {/* Employee Modal */'
  },
  // Employee Modal
  {
    start: '      {/* Employee Modal */}',
    end: '\n\n      {/* Leave Modal */}',
    replacement: '      <EmployeeModal isAddingEmployee={isAddingEmployee} setIsAddingEmployee={setIsAddingEmployee} editingEmployee={editingEmployee} employeeFormData={employeeFormData} setEmployeeFormData={setEmployeeFormData} isUploading={isUploading} handleFileUpload={handleFileUpload} fetchData={fetchData} />\n\n      {/* Leave Modal */'
  },
  // Leave Modal
  {
    start: '      {/* Leave Modal */}',
    end: '\n\n      {/* Salary Modal */}',
    replacement: '      <LeaveModal isAddingLeave={isAddingLeave} setIsAddingLeave={setIsAddingLeave} editingLeave={editingLeave} employees={employees} leaveFormData={leaveFormData} setLeaveFormData={setLeaveFormData} fetchData={fetchData} />\n\n      {/* Salary Modal */'
  },
  // Salary Modal
  {
    start: '      {/* Salary Modal */}',
    end: '\n\n      {/* PC Builder Modal for Sales */}',
    replacement: '      <SalaryModal isAddingSalary={isAddingSalary} setIsAddingSalary={setIsAddingSalary} editingSalary={editingSalary} employees={employees} salaryFormData={salaryFormData} setSalaryFormData={setSalaryFormData} fetchData={fetchData} />\n\n      {/* PC Builder Modal for Sales */'
  },
];

let changes = 0;
for (const r of replacements) {
  const startIdx = code.indexOf(r.start);
  if (startIdx === -1) {
    console.error(`Could not find start: "${r.start.substring(0, 60)}..."`);
    continue;
  }
  const endIdx = code.indexOf(r.end, startIdx + r.start.length);
  if (endIdx === -1) {
    console.error(`Could not find end: "${r.end.substring(0, 60)}..."`);
    continue;
  }
  code = code.substring(0, startIdx) + r.replacement + code.substring(endIdx + r.end.length);
  changes++;
  console.log(`Replaced: ${r.start.substring(0, 50)}...`);
}

fs.writeFileSync(filePath, code);
console.log(`Done. ${changes}/${replacements.length} replacements made.`);
