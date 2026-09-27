const fs = require('fs');

let types = fs.readFileSync('src/types.ts', 'utf8');

if (!types.includes('trackingTimeline')) {
    types = types.replace(
        '  courier?: string;',
        '  courier?: string;\n  trackingTimeline?: { status: string; location?: string; description?: string; timestamp: string; updatedBy?: string; deliveryMan?: { name: string; phone: string } }[];'
    );
    fs.writeFileSync('src/types.ts', types, 'utf8');
    console.log('Added trackingTimeline to types.ts');
}