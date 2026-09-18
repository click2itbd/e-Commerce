const fs = require('fs');
let code = fs.readFileSync('src/pages/hosting/HostingCheckout.tsx', 'utf8');

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

// I should also make sure transactionId is saved in the order!
const targetOrderCreate = `      const newOrderRef = doc(collection(db, 'orders'));
      batch.set(newOrderRef, {
        userId: currentUserId,
        items,
        total,
        shippingCost,
        grandTotal,
        discountCode,
        discountAmount,
        customerInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          address1: formData.address1,
          address2: formData.address2,
          city: formData.city,
          state: formData.state,
          postcode: formData.postcode,
          country: formData.country,
        },
        paymentMethod: formData.paymentMethod,
        source: formData.source,
        domainContact: formData.domainContact,
        notes: formData.notes,
        status: 'pending',
        paymentStatus: 'pending',
        createdAt: new Date().toISOString()
      });`;

const newOrderCreate = `      const newOrderRef = doc(collection(db, 'orders'));
      batch.set(newOrderRef, {
        userId: currentUserId,
        items,
        total,
        shippingCost,
        grandTotal,
        discountCode,
        discountAmount,
        customerInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          address1: formData.address1,
          address2: formData.address2,
          city: formData.city,
          state: formData.state,
          postcode: formData.postcode,
          country: formData.country,
        },
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
        paymentMethod: formData.paymentMethod,
        transactionId: formData.transactionId,
        source: formData.source,
        domainContact: formData.domainContact,
        notes: formData.notes,
        status: 'pending',
        paymentStatus: formData.paymentMethod === 'bkash' && formData.transactionId ? 'processing' : 'pending',
        createdAt: new Date().toISOString()
      });`;

if (code.includes(targetOrderCreate)) {
  code = code.replace(targetOrderCreate, newOrderCreate);
} else {
  console.log("Could not find order creation target block!");
}

// Ensure transactionId check on submit
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
console.log('Fixed bKash API redirection, TrxID validation, and payload.');
