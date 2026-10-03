const fs = require('fs');
let code = fs.readFileSync('src/components/QuotationManager.tsx', 'utf8');

const lines = code.split('\n');

// Find all indices of '<span>Grand Total:</span>'
const indices = [];
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('<span>Grand Total:</span>')) {
        indices.push(i);
    }
}

indices.forEach(idx => {
    // The previous 10 lines should contain Subtotal and Discount
    for (let i = idx - 8; i < idx; i++) {
        if (lines[i].includes('<span>Subtotal:</span>')) {
            lines[i+1] = lines[i+1].replace(
                "formatCurrency(calculateSubtotal(), {})",
                "formatCurrency(formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0), {})"
            );
        }
        if (lines[i].includes('<span>Discount:</span>')) {
            lines[i+1] = lines[i+1].replace(
                "formatCurrency(formData.discountAmount || 0, {})",
                "formatCurrency((formData.discountAmount || 0) + formData.items.reduce((sum, item) => sum + (Number(item.discount) || 0), 0), {})"
            );
        }
    }
});

code = lines.join('\n');
fs.writeFileSync('src/components/QuotationManager.tsx', code);
console.log('Successfully updated summary formats');
