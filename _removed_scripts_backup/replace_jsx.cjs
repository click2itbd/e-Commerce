const fs = require('fs');
const path = 'C:/Users/User/OneDrive/Desktop/e-Commerce/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Strategy: Replace inline JSX blocks with component references
// We'll use very specific start/end markers for each tab

// Helper to replace a block between two markers
function replaceBlock(startMarker, endMarker, replacement) {
  const startIdx = content.indexOf(startMarker);
  const endIdx = content.indexOf(endMarker);
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const before = content.slice(0, startIdx);
    const after = content.slice(endIdx);
    content = before + replacement + after;
    return true;
  }
  return false;
}

// For tabs that already use components, skip them
// For tabs with inline JSX, replace with component references

// Inventory tab - replace the inline JSX starting from the div after `activeTab === 'inventory' ? (`
// We need to find the closing `) : activeTab === 'sales' ? (` or similar
const inventoryStart = '        ) : activeTab === \'inventory\' ? (\n          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">';
const inventoryEnd = '        ) : activeTab === \'sales\' ? (';

if (content.includes(inventoryStart)) {
  const startIdx = content.indexOf(inventoryStart);
  const endIdx = content.indexOf(inventoryEnd, startIdx);
  if (endIdx !== -1) {
    const before = content.slice(0, startIdx);
    const after = content.slice(endIdx);
    content = before + '        ) : activeTab === \'inventory\' ? (\n          <InventoryTab\n            products={products}\n            vendors={vendors}\n            menus={menus}\n            isAddingProduct={isAddingProduct}\n            setIsAddingProduct={setIsAddingProduct}\n            editingProduct={editingProduct}\n            setEditingProduct={setEditingProduct}\n            formData={formData}\n            setFormData={setFormData}\n            inventoryCategoryFilter={inventoryCategoryFilter}\n            setInventoryCategoryFilter={setInventoryCategoryFilter}\n            selectedProductIds={selectedProductIds}\n            setSelectedProductIds={setSelectedProductIds}\n            isBulkEditing={isBulkEditing}\n            setIsBulkEditing={setIsBulkEditing}\n            bulkEditData={bulkEditData}\n            setBulkEditData={setBulkEditData}\n            loading={loading}\n            handleSaveProduct={handleSaveProduct}\n            handleDeleteProduct={handleDeleteProduct}\n            handleImportProductsCSV={handleImportProductsCSV}\n            handleDownloadCSVTemplate={handleDownloadCSVTemplate}\n            handleExportAllProducts={handleExportAllProducts}\n            handleBulkExportProducts={handleBulkExportProducts}\n            handleBulkDeleteProducts={handleBulkDeleteProducts}\n            handleBulkUpdate={handleBulkUpdate}\n            addVariant={addVariant}\n            updateVariant={updateVariant}\n            removeVariant={removeVariant}\n            addSpec={addSpec}\n            updateSpec={updateSpec}\n            removeSpec={removeSpec}\n            setActiveTab={setActiveTab}\n            fetchData={fetchData}\n            fileInputRef={fileInputRef}\n          />' + after;
    console.log('Replaced inventory tab');
  }
}

// Sales tab
const salesStart = '        ) : activeTab === \'sales\' ? (\n          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">';
const salesEnd = '        ) : activeTab === \'quotations\' ? (';

if (content.includes(salesStart)) {
  const startIdx = content.indexOf(salesStart);
  const endIdx = content.indexOf(salesEnd, startIdx);
  if (endIdx !== -1) {
    const before = content.slice(0, startIdx);
    const after = content.slice(endIdx);
    content = before + '        ) : activeTab === \'sales\' ? (\n          <SalesForm\n            saleData={saleData}\n            setSaleData={setSaleData}\n            customers={customers}\n            products={products}\n            vendors={vendors}\n            discountCodes={discountCodes}\n            settings={settings}\n            setConfirmModal={setConfirmModal}\n            fetchData={fetchData}\n            hasPermission={hasPermission}\n            isAdmin={isAdmin}\n            handleApplySaleDiscountCode={handleApplySaleDiscountCode}\n            addItemToSale={addItemToSale}\n            formatCurrency={formatCurrency}\n          />' + after;
    console.log('Replaced sales tab');
  }
}

console.log('Final length:', content.length);
fs.writeFileSync(path, content);
