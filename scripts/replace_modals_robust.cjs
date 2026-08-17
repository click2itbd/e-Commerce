const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/pages/AdminDashboard.tsx');
let code = fs.readFileSync(filePath, 'utf8');

const blocks = [
  {
    startToken: '{/* Discount Code Modal */}',
    endToken: '{isAddingHostingPlan && (',
    replacement: '      <DiscountCodeModal isAddingDiscountCode={isAddingDiscountCode} setIsAddingDiscountCode={setIsAddingDiscountCode} editingDiscountCode={editingDiscountCode} setEditingDiscountCode={setEditingDiscountCode} discountCodeFormData={discountCodeFormData} setDiscountCodeFormData={setDiscountCodeFormData} handleSaveDiscountCode={handleSaveDiscountCode} />\n\n      '
  },
  {
    startToken: '{isAddingHostingPlan && (',
    endToken: '{isAddingHostingService && (',
    replacement: '{isAddingHostingPlan && <HostingPlanModal isAddingHostingPlan={isAddingHostingPlan} setIsAddingHostingPlan={setIsAddingHostingPlan} editingHostingPlan={editingHostingPlan} setEditingHostingPlan={setEditingHostingPlan} hostingPlanFormData={hostingPlanFormData} setHostingPlanFormData={setHostingPlanFormData} hostingServices={hostingServices} handleSaveHostingPlan={handleSaveHostingPlan} />}\n\n      '
  },
  {
    startToken: '{isAddingHostingService && (',
    endToken: '{/* Service Record Modal */}',
    replacement: '{isAddingHostingService && <HostingServiceModal isAddingHostingService={isAddingHostingService} setIsAddingHostingService={setIsAddingHostingService} editingHostingService={editingHostingService} setEditingHostingService={setEditingHostingService} hostingServiceFormData={hostingServiceFormData} setHostingServiceFormData={setHostingServiceFormData} handleSaveHostingService={handleSaveHostingService} />}\n\n      '
  },
  {
    startToken: '{/* Add User Modal */}',
    endToken: '{/* Employee Modal */}',
    replacement: '{/* Add User Modal */}\n      <AddUserModal isAddingUser={isAddingUser} setIsAddingUser={setIsAddingUser} userFormData={userFormData} setUserFormData={setUserFormData} handleAddPortalUser={handleAddPortalUser} />\n\n      '
  },
  {
    startToken: '{/* Employee Modal */}',
    endToken: '{/* Leave Modal */}',
    replacement: '{/* Employee Modal */}\n      <EmployeeModal isAddingEmployee={isAddingEmployee} setIsAddingEmployee={setIsAddingEmployee} editingEmployee={editingEmployee} employeeFormData={employeeFormData} setEmployeeFormData={setEmployeeFormData} isUploading={isUploading} handleFileUpload={handleFileUpload} fetchData={fetchData} />\n\n      '
  },
  {
    startToken: '{/* Leave Modal */}',
    endToken: '{/* Salary Modal */}',
    replacement: '{/* Leave Modal */}\n      <LeaveModal isAddingLeave={isAddingLeave} setIsAddingLeave={setIsAddingLeave} editingLeave={editingLeave} employees={employees} leaveFormData={leaveFormData} setLeaveFormData={setLeaveFormData} fetchData={fetchData} />\n\n      '
  },
  {
    startToken: '{/* Salary Modal */}',
    endToken: '{/* PC Builder Modal for Sales */}',
    replacement: '{/* Salary Modal */}\n      <SalaryModal isAddingSalary={isAddingSalary} setIsAddingSalary={setIsAddingSalary} editingSalary={editingSalary} employees={employees} salaryFormData={salaryFormData} setSalaryFormData={setSalaryFormData} fetchData={fetchData} />\n\n      '
  }
];

let currentIndex = 0;
let newCode = '';

for (const block of blocks) {
  const startIdx = code.indexOf(block.startToken, currentIndex);
  if (startIdx === -1) {
    console.error(`Could not find startToken: ${block.startToken}`);
    break;
  }
  
  // Also look for the end block to know how much to slice
  const endIdx = code.indexOf(block.endToken, startIdx + 1);
  if (endIdx === -1) {
    console.error(`Could not find endToken: ${block.endToken}`);
    break;
  }

  // Append everything before this block
  newCode += code.substring(currentIndex, startIdx);
  
  // Append the replacement
  newCode += block.replacement;
  
  // Move current index to the start of the end token
  currentIndex = endIdx;
}

// Append the rest of the file
if (currentIndex > 0) {
    newCode += code.substring(currentIndex);
    fs.writeFileSync(filePath, newCode);
    console.log("Successfully replaced blocks.");
} else {
    console.log("No replacements made due to errors.");
}
