const fs = require('fs');
let code = fs.readFileSync('src/pages/hosting/HostingCheckout.tsx', 'utf8');

const targetOrderData = `const orderData = {
        userId: currentUserId,
        items,
        total: grandTotal,
        shippingCost,
        status: 'pending',
        paymentStatus: 'pending',
        type: 'invoice',
        documentNumber: docNumber,
        customerName: \`\${formData.firstName} \${formData.lastName}\`.trim(),
        customerEmail: formData.email,
        customerPhone: formData.phone,
        shippingAddress: \`\${formData.address1}, \${formData.address2 ? formData.address2 + ', ' : ''}\${formData.city}, \${formData.state} - \${formData.postcode}, \${formData.country}\`,
        company: formData.company,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };`;

const newOrderData = `const orderData = {
        userId: currentUserId,
        items,
        total: grandTotal,
        shippingCost,
        status: 'pending',
        paymentStatus: formData.paymentMethod === 'bkash' && formData.transactionId ? 'processing' : 'pending',
        type: 'invoice',
        documentNumber: docNumber,
        customerName: \`\${formData.firstName} \${formData.lastName}\`.trim(),
        customerEmail: formData.email,
        customerPhone: formData.phone,
        shippingAddress: \`\${formData.address1}, \${formData.address2 ? formData.address2 + ', ' : ''}\${formData.city}, \${formData.state} - \${formData.postcode}, \${formData.country}\`,
        company: formData.company,
        paymentMethod: formData.paymentMethod,
        transactionId: formData.transactionId,
        domainContactDetails: formData.domainContact === 'custom' ? {
          firstName: formData.customFirstName,
          lastName: formData.customLastName,
          email: formData.customEmail,
          phone: formData.customPhone,
          address1: formData.customAddress1,
          city: formData.customCity,
          state: formData.customState,
          postcode: formData.customPostcode,
        } : null,
        notes: formData.notes,
        createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };`;

if (code.includes('const orderData = {')) {
  code = code.replace(targetOrderData, newOrderData);
}

// Now replace the bKash API initialization
const targetBkashApi = `if (formData.paymentMethod === 'bkash') {
        const res = await initiateBkashPayment(docRef.id, grandTotal, formData.email, \`\${formData.firstName} \${formData.lastName}\`, formData.phone);
        if (res.success && res.paymentUrl) {
          window.location.href = res.paymentUrl;
          return;
        } else {
          throw new Error(res.errorMessage || 'Failed to initiate bKash payment');
        }
      } else if (formData.paymentMethod === 'card') {`;

const newBkashApi = `if (formData.paymentMethod === 'card') {`;

if (code.includes(targetBkashApi)) {
  code = code.replace(targetBkashApi, newBkashApi);
}

const targetSubmitBegin = `const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.termsAccepted) {
      toast.error('You must agree to the Terms of Service.');
      return;
    }`;

const newSubmitBegin = `const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.termsAccepted) {
      toast.error('You must agree to the Terms of Service.');
      return;
    }
    
    if (formData.paymentMethod === 'bkash' && !formData.transactionId?.trim()) {
      toast.error('Please enter the bKash Transaction ID (TrxID)');
      return;
    }`;

if (code.includes(targetSubmitBegin)) {
    code = code.replace(targetSubmitBegin, newSubmitBegin);
}

fs.writeFileSync('src/pages/hosting/HostingCheckout.tsx', code);
console.log('Fixed bKash API redirection and orderData payload.');
