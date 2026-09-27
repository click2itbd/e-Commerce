const fs = require('fs');

let types = fs.readFileSync('src/types.ts', 'utf8');

if (!types.includes('steadfastApiKey')) {
    types = types.replace(
        '  address: string;',
        '  address: string;\n  steadfastApiKey?: string;\n  steadfastSecretKey?: string;'
    );
    fs.writeFileSync('src/types.ts', types, 'utf8');
    console.log('Added Steadfast API fields to types.ts');
}