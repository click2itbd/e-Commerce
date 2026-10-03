const fs = require('fs');
let code = fs.readFileSync('src/components/QuotationManager.tsx', 'utf8');

const targetSummary = `                     <div className="w-64 space-y-3">
                         <div className="flex justify-between text-sm text-gray-600">
                             <span>Subtotal:</span>
                             <span className="font-mono">{formatCurrency(calculateSubtotal(), {})}</span>
                         </div>
                         <div className="flex justify-between text-sm text-gray-600 border-b pb-3">
                             <span>Discount:</span>
                             <span className="font-mono">{formatCurrency(formData.discountAmount || 0, {})}</span>
                         </div>
                         <div className="flex justify-between font-bold text-lg text-gray-900">
                             <span>Grand Total:</span>
                             <span className="font-mono text-indigo-600">{formatCurrency(Math.max(0, calculateSubtotal() - formData.discountAmount), {})}</span>
                         </div>
                     </div>`;

const replacementSummary = `                     <div className="w-64 space-y-3">
                         <div className="flex justify-between text-sm text-gray-600">
                             <span>Subtotal:</span>
                             <span className="font-mono">{formatCurrency(formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0), {})}</span>
                         </div>
                         <div className="flex justify-between text-sm text-gray-600 border-b pb-3">
                             <span>Discount:</span>
                             <span className="font-mono">{formatCurrency((formData.discountAmount || 0) + formData.items.reduce((sum, item) => sum + (item.discount || 0), 0), {})}</span>
                         </div>
                         <div className="flex justify-between font-bold text-lg text-gray-900">
                             <span>Grand Total:</span>
                             <span className="font-mono text-indigo-600">{formatCurrency(Math.max(0, calculateSubtotal() - formData.discountAmount), {})}</span>
                         </div>
                     </div>`;

if (code.includes(targetSummary)) {
    code = code.replace(targetSummary, replacementSummary);
    fs.writeFileSync('src/components/QuotationManager.tsx', code);
    console.log('Successfully updated web view summary');
} else {
    console.log('Target summary not found');
}
