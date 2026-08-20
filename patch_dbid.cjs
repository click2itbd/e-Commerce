const fs = require('fs');
let content = fs.readFileSync('functions/index.js', 'utf8');

// Add getFirestore import
if (!content.includes('const { getFirestore }')) {
  content = content.replace('const admin = require("firebase-admin");', 'const admin = require("firebase-admin");\nconst { getFirestore } = require("firebase-admin/firestore");');
}

// Replace admin.firestore() with getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277')
content = content.replace(/admin\.firestore\(\)/g, "getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277')");

// Wait! admin.firestore.FieldValue.serverTimestamp() should NOT be replaced by getFirestore(...).FieldValue!
// Let's revert admin.firestore.FieldValue to just admin.firestore.FieldValue BEFORE we replace admin.firestore()
// Actually, admin.firestore.FieldValue.serverTimestamp() doesn't have parens after firestore!
// Ah, the regex `admin\.firestore\(\)` ONLY matches `admin.firestore()`.
// `admin.firestore.FieldValue` does NOT have parens, so it won't be matched by `admin.firestore()`.

fs.writeFileSync('functions/index.js', content, 'utf8');
console.log('Fixed DB IDs');
