const fs = require('fs');
let checkout = fs.readFileSync('src/pages/shop/Checkout.tsx', 'utf8');

checkout = checkout.replace(
    'advanceTrxId: paymentType === \'cod\' && settings?.requireAdvanceDeliveryCharge ? formData.advanceTrxId : undefined,',
    'advanceTrxId: (paymentType === \'cod\' && settings?.requireAdvanceDeliveryCharge) ? (formData.advanceTrxId || null) : null,'
);

fs.writeFileSync('src/pages/shop/Checkout.tsx', checkout, 'utf8');
console.log('Fixed undefined in Checkout.tsx');