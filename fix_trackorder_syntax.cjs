const fs = require('fs');
let track = fs.readFileSync('src/pages/shop/TrackOrder.tsx', 'utf8');

// Find the last return (...) block
const parts = track.split('return (');
if (parts.length > 1) {
    let returnBlock = parts[parts.length - 1];
    
    // Check if it already has <Layout>
    if (!returnBlock.includes('<Layout>')) {
        returnBlock = '\n    <Layout>' + returnBlock;
    }
    
    // Replace the trailing part
    returnBlock = returnBlock.replace(/\s*<\/div>\s*<\/div>\s*\);\s*\}/g, '\n      </div>\n    </Layout>\n  );\n}');
    
    track = parts.slice(0, parts.length - 1).join('return (') + 'return (' + returnBlock;
    fs.writeFileSync('src/pages/shop/TrackOrder.tsx', track, 'utf8');
    console.log('Fixed syntax error!');
}