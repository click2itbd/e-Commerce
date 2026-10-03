const fs = require('fs');
let code = fs.readFileSync('src/components/QuotationManager.tsx', 'utf8');

const triggerStr = '<span>Grand Total:</span>';
const lines = code.split('\n');
const idx = lines.findIndex(l => l.includes(triggerStr) && l.includes('text-gray-900'));

if (idx !== -1) {
    // We are at the Grand Total line. The summary block is just above.
    // Replace the block from idx-9 to idx+3
    // But it's easier to just replace the two formatCurrency calls
    
    // Line with Subtotal value:
    // <span className="font-mono">{formatCurrency(calculateSubtotal(), {})}</span>
    const subIdx = lines.findIndex((l, i) => i > idx - 10 && i < idx && l.includes('Subtotal:'));
    if (subIdx !== -1) {
        lines[subIdx + 1] = lines[subIdx + 1].replace(
            "formatCurrency(calculateSubtotal(), {})",
            "formatCurrency(formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0), {})"
        );
    }
    
    // Line with Discount value:
    // <span className="font-mono">{formatCurrency(formData.discountAmount || 0, {})}</span>
    const discIdx = lines.findIndex((l, i) => i > idx - 10 && i < idx && l.includes('Discount:'));
    if (discIdx !== -1) {
        lines[discIdx + 1] = lines[discIdx + 1].replace(
            "formatCurrency(formData.discountAmount || 0, {})",
            "formatCurrency((formData.discountAmount || 0) + formData.items.reduce((sum, item) => sum + (Number(item.discount) || 0), 0), {})"
        );
    }
    
    code = lines.join('\n');
    fs.writeFileSync('src/components/QuotationManager.tsx', code);
    console.log('Successfully replaced format functions');
} else {
    console.log('Grand Total not found');
}
