const fs = require('fs');
let content = fs.readFileSync('functions/index.js', 'utf8');

const regex = /const domainItems = orderData\.items\.filter\(item => item\.itemType === 'domain'\);/;

if (content.match(regex)) {
    const renewalItemsFilter = `
          const domainItems = orderData.items.filter(item => item.itemType === 'domain');
          const renewalItems = orderData.items.filter(item => item.itemType === 'domain_renewal');
`;
    content = content.replace(regex, renewalItemsFilter);
    
    // Add the renew logic
    const renewLogic = `
            if (apiKey) {
              for (const item of renewalItems) {
                const domain = item.domain;
                const years = item.termYears || 1;
                
                // Call Dynadot Renew Command
                const dynadotUrl = \`\${baseUrl}?key=\${apiKey}&command=renew&domain0=\${domain}&duration0=\${years}\`;
                try {
                  const regResponse = await fetch(dynadotUrl);
                  const regData = await regResponse.json();
                  
                  // Log Registration
                  await admin.firestore().collection('apiLogs').add({
                    action: 'dynadot_renew',
                    domain,
                    orderId,
                    isSandbox,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    response: regData
                  });
                  
                  // Update domainOrders document if successful
                  const dOrdersSnap = await admin.firestore().collection('domainOrders')
                    .where('orderId', '==', orderId)
                    .where('domain', '==', domain)
                    .get();
                    
                  if (!dOrdersSnap.empty) {
                    const dOrderRef = dOrdersSnap.docs[0].ref;
                    const isSuccess = regData?.RenewResponse?.RenewResults?.[0]?.Status?.toLowerCase() === 'success';
                    
                    await dOrderRef.update({
                      status: isSuccess ? 'active' : 'failed',
                      renewalResponse: JSON.stringify(regData),
                      updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                  }
                  
                } catch (e) {
                  console.error('Auto-renewal failed for', domain, e);
                }
              }
            }
`;
    
    content = content.replace("const baseUrl = isSandbox ? 'https://api.sandbox.dynadot.com/api3.json' : 'https://api.dynadot.com/api3.json';", "const baseUrl = isSandbox ? 'https://api.sandbox.dynadot.com/api3.json' : 'https://api.dynadot.com/api3.json';\n" + renewLogic);
    
    fs.writeFileSync('functions/index.js', content, 'utf8');
    console.log('Patched functions/index.js for renewals');
}
