const fs = require('fs');
let checkout = fs.readFileSync('src/pages/shop/Checkout.tsx', 'utf8');

const target = `        // Update docRef for payment initiation logic below
        const docRef = newOrderRef;
        // Only clear cart and show success if not redirecting to a payment gateway
        if (formData.paymentMethod === 'bkash') {`;

const newCode = `        // Update docRef for payment initiation logic below
        const docRef = newOrderRef;
        
        const selectedPayment = paymentType === 'cod' ? 'cod' : formData.paymentMethod;
        
        // Only clear cart and show success if not redirecting to a payment gateway
        if (selectedPayment === 'bkash') {`;

if (checkout.includes(target)) {
    checkout = checkout.replace(target, newCode);
    console.log('Fixed payment selection logic!');
} else {
    console.log('Target not found!');
}

fs.writeFileSync('src/pages/shop/Checkout.tsx', checkout, 'utf8');