const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/pages/AdminDashboard.tsx');
let code = fs.readFileSync(filePath, 'utf8');

const blocks = [
  {
    startToken: '{/* Service Record Modal */}',
    endToken: '{/* Add User Modal */}',
    replacement: '{/* Service Record Modal */}\n      <ServiceRecordModal isAddingService={isAddingService} setIsAddingService={setIsAddingService} editingService={editingService} setEditingService={setEditingService} serviceFormData={serviceFormData} setServiceFormData={setServiceFormData} printServiceReceipt={printServiceReceipt} fetchData={fetchData} />\n\n      '
  },
  {
    startToken: '{/* PC Builder Modal for Sales */}',
    endToken: '{/* Ledger Modal */}',
    replacement: '{/* PC Builder Modal for Sales */}\n      <PCBuilderModal showPCBuilderModal={showPCBuilderModal} setShowPCBuilderModal={setShowPCBuilderModal} products={products} addItemToSale={addItemToSale} />\n\n      '
  },
  {
    startToken: '{/* Ledger Modal */}',
    endToken: '{/* Serial Selection Modal */}',
    replacement: '{/* Ledger Modal */}\n      <LedgerModal selectedLedgerEntity={selectedLedgerEntity} setSelectedLedgerEntity={setSelectedLedgerEntity} ledgerView={ledgerView} setLedgerView={setLedgerView} ledgerStartDate={ledgerStartDate} setLedgerStartDate={setLedgerStartDate} ledgerEndDate={ledgerEndDate} setLedgerEndDate={setLedgerEndDate} ledgerSearchQuery={ledgerSearchQuery} setLedgerSearchQuery={setLedgerSearchQuery} handleDownloadLedgerCSV={handleDownloadLedgerCSV} handleDownloadLedgerPDF={handleDownloadLedgerPDF} transactions={transactions} paymentAmount={paymentAmount} setPaymentAmount={setPaymentAmount} ledgerPaymentMethod={ledgerPaymentMethod} setLedgerPaymentMethod={setLedgerPaymentMethod} paymentDescription={paymentDescription} setPaymentDescription={setPaymentDescription} handleRecordPayment={handleRecordPayment} products={products} addItemToPurchase={addItemToPurchase} />\n\n      '
  },
  {
    startToken: '{/* Serial Selection Modal */}',
    endToken: '{/* Confirm Modal */}',
    replacement: '{/* Serial Selection Modal */}\n      <SerialSelectionModal serialSelectionModal={serialSelectionModal} setSerialSelectionModal={setSerialSelectionModal} handleConfirmSerialSelection={handleConfirmSerialSelection} />\n\n      '
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
  
  const endIdx = code.indexOf(block.endToken, startIdx + 1);
  if (endIdx === -1) {
    console.error(`Could not find endToken: ${block.endToken}`);
    break;
  }

  newCode += code.substring(currentIndex, startIdx);
  newCode += block.replacement;
  currentIndex = endIdx;
}

if (currentIndex > 0) {
    newCode += code.substring(currentIndex);
    fs.writeFileSync(filePath, newCode);
    console.log("Successfully replaced blocks.");
} else {
    console.log("No replacements made due to errors.");
}
