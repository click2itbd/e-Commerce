const fs = require('fs');
let c = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

c = c.replace(/const uploadPromises = Array\.from\(files\)\.map\(async \(file\) => \{\s*if \(CPANEL_UPLOAD_URL\) \{/, "const uploadPromises = Array.from(files).map(async (file) => {\n          const compressedFile = await compressImage(file);\n          if (CPANEL_UPLOAD_URL) {");

c = c.replace(/formDataToUpload\.append\("image", file\);/, 'formDataToUpload.append("image", compressedFile);');

// Remove the inner compressedFile declaration to avoid scope shadowing
c = c.replace(/\/\/ Fallback to Firebase\s*const compressedFile = await compressImage\(file\);/, "// Fallback to Firebase");

fs.writeFileSync('src/pages/AdminDashboard.tsx', c);
console.log('Fixed cPanel image compression');