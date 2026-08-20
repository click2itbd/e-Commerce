const fs = require('fs');
let content = fs.readFileSync('src/pages/PaymentCallback.tsx', 'utf8');

const failurePatch = `
          } else {
            // Call the secure webhook to process failure
            await fetch('https://us-central1-gen-lang-client-0990631330.cloudfunctions.net/paymentWebhook', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                orderId, 
                status: 'failed', 
                transactionId: '' 
              })
            });
            toast.error(\`Payment \${status === 'cancelled' ? 'was cancelled' : 'failed'}. Please try again.\`);
            navigate(-1);
          }
`;

content = content.replace(/\} else \{\s*await updateDoc\(targetRef, \{\s*paymentStatus: 'failed',\s*status: 'payment_failed'\s*\}\);\s*toast\.error[^;]+;\s*navigate\(-1\);\s*\}/, failurePatch.trim());

fs.writeFileSync('src/pages/PaymentCallback.tsx', content, 'utf8');
console.log('Patched PaymentCallback.tsx to use webhook for failures');
