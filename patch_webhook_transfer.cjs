const fs = require('fs');
let content = fs.readFileSync('functions/index.js', 'utf8');

const regex = /const renewalItems = orderData\.items\.filter\(item => item\.itemType === 'domain_renewal'\);/;

if (content.match(regex) && !content.includes("itemType === 'domain_transfer'")) {
    const transferFilter = `
          const renewalItems = orderData.items.filter(item => item.itemType === 'domain_renewal');
          const transferItems = orderData.items.filter(item => item.itemType === 'domain_transfer');
`;
    content = content.replace(regex, transferFilter);
    
    // Add the transfer logic
    const transferLogic = `
            if (apiKey) {
              for (const item of transferItems) {
                const domain = item.domain || item.id.replace('domain_transfer_', '');
                const authCode = item.authCode || '';
                
                // Call Dynadot Transfer Command
                const dynadotUrl = \`\${baseUrl}?key=\${apiKey}&command=transfer&domain0=\${domain}&authcode0=\${encodeURIComponent(authCode)}\`;
                try {
                  const regResponse = await fetch(dynadotUrl);
                  const regData = await regResponse.json();
                  
                  // Log Transfer
                  await admin.firestore().collection('apiLogs').add({
                    action: 'dynadot_transfer',
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
                    const isSuccess = regData?.TransferResponse?.TransferResults?.[0]?.Status?.toLowerCase() === 'success';
                    
                    await dOrderRef.update({
                      status: isSuccess ? 'active' : 'failed',
                      transferResponse: JSON.stringify(regData),
                      updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                  }
                  
                } catch (e) {
                  console.error('Auto-transfer failed for', domain, e);
                }
              }
            }
`;
    
    // We inject it right after the renewLogic loop inside if (apiKey) {
    // Actually, let's inject it before the closing brace of if (apiKey) block.
    // wait, we can just replace 'if (apiKey) {' with 'if (apiKey) {' + transferLogic
    const searchString = `if (apiKey) {`;
    content = content.replace(searchString, searchString + "\n" + transferLogic.replace('if (apiKey) {', ''));
    
    fs.writeFileSync('functions/index.js', content, 'utf8');
    console.log('Patched functions/index.js for domain transfers');
}
