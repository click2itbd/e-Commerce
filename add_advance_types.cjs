const fs = require('fs');

let types = fs.readFileSync('src/types.ts', 'utf8');

if (!types.includes('requireAdvanceDeliveryCharge')) {
    types = types.replace(
        '  steadfastSecretKey?: string;',
        '  steadfastSecretKey?: string;\n  requireAdvanceDeliveryCharge?: boolean;\n  advancePaymentNumber?: string;'
    );
    fs.writeFileSync('src/types.ts', types, 'utf8');
    console.log('Added advance delivery settings to types.ts');
}