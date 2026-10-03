const fs = require('fs');
let code = fs.readFileSync('src/components/QuotationManager.tsx', 'utf8');

const oldSave = `      try {
        const subtotal = formData.items.reduce((sum, item) => sum + ((item.price * item.quantity) - (item.discount || 0)), 0);
        const finalTotal = Math.max(0, subtotal - formData.discountAmount);
        
        let docRefId = editingId;`;

const newSave = `      try {
        const subtotal = formData.items.reduce((sum, item) => sum + ((item.price * item.quantity) - (item.discount || 0)), 0);
        const finalTotal = Math.max(0, subtotal - formData.discountAmount);
        
        // Auto-save new customer
        const existingCustomer = customers.find(c => c.name.toLowerCase() === formData.customerName.toLowerCase());
        if (!existingCustomer && formData.customerName.trim() !== '') {
           await addDoc(collection(db, 'customers'), {
             name: formData.customerName,
             phone: formData.customerPhone || '',
             email: formData.customerEmail || '',
             address: formData.shippingAddress || '',
             type: 'retail',
             createdAt: new Date().toISOString()
           });
        }
        
        let docRefId = editingId;`;

code = code.replace(oldSave, newSave);
fs.writeFileSync('src/components/QuotationManager.tsx', code);
console.log('Patched QuotationManager.tsx auto-save');
