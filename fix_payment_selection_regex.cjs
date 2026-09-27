const fs = require('fs');
let checkout = fs.readFileSync('src/pages/shop/Checkout.tsx', 'utf8');

const targetRegex = /\/\/\s*Only clear cart and show success if not redirecting to a payment gateway\s*if\s*\(formData\.paymentMethod === 'bkash'\)\s*\{/;

const newCode = `// Only clear cart and show success if not redirecting to a payment gateway
        const selectedPayment = paymentType === 'cod' ? 'cod' : formData.paymentMethod;
        if (selectedPayment === 'bkash') {`;

if (targetRegex.test(checkout)) {
    checkout = checkout.replace(targetRegex, newCode);
    console.log('Fixed payment selection logic!');
} else {
    console.log('Target not found!');
}

fs.writeFileSync('src/pages/shop/Checkout.tsx', checkout, 'utf8');