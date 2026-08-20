const fs = require('fs');
let fn = fs.readFileSync('functions/index.js', 'utf8');

fn = fn.replace(
`  const { command } = data;
  
  if (command !== 'search' && !context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to use this service.');
  }

  const { command, domain, extraParams } = data;`,
`  const { command, domain, extraParams } = data;
  
  if (command !== 'search' && !context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to use this service.');
  }`
);

fs.writeFileSync('functions/index.js', fn);
console.log('Fixed syntax error');
