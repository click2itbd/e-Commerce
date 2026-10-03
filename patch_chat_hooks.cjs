const fs = require('fs');
let code = fs.readFileSync('src/components/ChatWidget.tsx', 'utf8');

// The early return currently is:
//   // Hide widget on Admin Panel and POS routes
//   if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/pos')) {
//     return null;
//   }

const earlyReturnStr = `  // Hide widget on Admin Panel and POS routes
  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/pos')) {
    return null;
  }`;

if (code.includes(earlyReturnStr)) {
    // Remove the early return from its current position
    code = code.replace(earlyReturnStr, '');
    
    // Find the main return ( return ( )
    const mainReturnIdx = code.lastIndexOf('  return (');
    if (mainReturnIdx !== -1) {
        // Insert the early return right before the main return
        const newCode = code.substring(0, mainReturnIdx) + earlyReturnStr + '\n\n' + code.substring(mainReturnIdx);
        fs.writeFileSync('src/components/ChatWidget.tsx', newCode);
        console.log('Successfully fixed Rules of Hooks violation in ChatWidget');
    } else {
        console.log('Could not find main return');
    }
} else {
    console.log('Early return block not found');
}
