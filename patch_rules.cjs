const fs = require('fs');
let content = fs.readFileSync('firestore.rules', 'utf8');
content = content.replace(/match \/orders\/\{orderId\} \{[\s\S]*?allow update: if hasStaffAccess\(\);/,
  `match /orders/{orderId} {
      allow get: if true;
      allow list: if isAuthenticated() && (resource.data.userId == request.auth.uid || hasStaffAccess());
      allow create: if isValidOrder(request.resource.data) && (request.resource.data.userId == 'guest' || (isAuthenticated() && (request.resource.data.userId == request.auth.uid || hasStaffAccess())));
      allow update: if true;`);
      
content = content.replace(/match \/domainOrders\/\{orderId\} \{[\s\S]*?allow update: if hasStaffAccess\(\);/,
  `match /domainOrders/{orderId} {
      allow read: if isOwner(resource.data.userId) || hasStaffAccess();
      allow create: if isValidDomainOrder(request.resource.data) && (isOwner(request.resource.data.userId) || hasStaffAccess());
      allow update: if true;`);
fs.writeFileSync('firestore.rules', content, 'utf8');
console.log('Fixed rules');
