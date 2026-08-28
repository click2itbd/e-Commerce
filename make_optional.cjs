const fs = require('fs');

const files = [
  'src/pages/admin/tabs/purchase/Vendors.tsx',
  'src/pages/admin/tabs/sales/Customers.tsx',
  'src/pages/admin/tabs/sales/SalesForm.tsx',
  'src/pages/admin/POS/components/POSModals.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Remove required for phone/email fields
    // This is a bit tricky with regex, so let's target the exact blocks or use a simpler approach.
    // Let's replace `required` where it's near `value={customerFormData.phone}` or similar.
    
    // Instead of complex regex, let's just globally remove `required` from input type="tel" or type="email" or input for phone in these files.
    // In these files, we don't want name/phone/email/address to be STRICTLY required, except maybe Name?
    // User said "Number er khetre o eta kore dew", meaning make Number optional.
    
    // Let's remove ALL `required` attributes from the inputs in these files except Name if we can. Or just remove all `required` and let them submit.
    // Wait, name should be required.
    // Let's replace `required\s*\n` and `required ` and `\s+required`
    
    // Pattern 1: type="tel" required
    content = content.replace(/type="tel"\s+required/g, 'type="tel"');
    content = content.replace(/type="tel"\r?\n\s+required/g, 'type="tel"');
    
    // Pattern 2: type="text" for phone
    // We can just remove `required` from anywhere near `phone` or `email`
    
    // Let's just remove `\n                  required` from Vendors.tsx entirely (except Name)
    if (file.includes('Vendors.tsx')) {
      content = content.replace(/<label[^>]*>Phone Number<\/label>\s*<input[^>]*required/g, (match) => match.replace(/required/, ''));
      content = content.replace(/<label[^>]*>Email<\/label>\s*<input[^>]*required/g, (match) => match.replace(/required/, ''));
    }
    
    if (file.includes('Customers.tsx')) {
      content = content.replace(/<label[^>]*>Phone Number<\/label>\s*<input[^>]*required/g, (match) => match.replace(/required/, ''));
      content = content.replace(/<label[^>]*>Email Address<\/label>\s*<input[^>]*required/g, (match) => match.replace(/required/, ''));
    }

    if (file.includes('SalesForm.tsx')) {
      content = content.replace(/<label[^>]*>Phone Number<\/label>\s*<input[^>]*required/g, (match) => match.replace(/required/, ''));
      content = content.replace(/<label[^>]*>Email Address<\/label>\s*<input[^>]*required/g, (match) => match.replace(/required/, ''));
    }
    
    if (file.includes('POSModals.tsx')) {
      content = content.replace(/<label[^>]*>Phone<\/label>\s*<input[^>]*required/g, (match) => match.replace(/required/, ''));
      content = content.replace(/<label[^>]*>Email<\/label>\s*<input[^>]*required/g, (match) => match.replace(/required/, ''));
    }

    fs.writeFileSync(file, content, 'utf8');
    console.log(`Processed ${file}`);
  } else {
    console.log(`${file} not found`);
  }
});
