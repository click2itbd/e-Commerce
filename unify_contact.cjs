const fs = require('fs');
let c = fs.readFileSync('src/pages/ContactUs.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

// 1. Unified Subtitle
const subtitleRegex = /\{isHosting[\s\S]*?\}/;
c = c.replace(subtitleRegex, `'Have questions about custom PC builds, tech gadgets, or premium web hosting? Our dedicated specialists are here to assist you 24/7.'`);

// 2. Unified WhatsApp text
const whatsappRegex = /\{isHosting \? 'server\/hosting assistance\.' : 'order assistance\.'\}/;
c = c.replace(whatsappRegex, `'order assistance, or tech support.'`);

// 3. Unified Dropdown
const dropdownRegex = /\{isHosting \? \([\s\S]*?\) : \([\s\S]*?\)\}/;
const unifiedDropdown = `<>
                              <option>General Inquiry</option>
                              <option>Order Status & Sales</option>
                              <option>PC Build Quotation</option>
                              <option>Hosting & Technical Support</option>
                              <option>Warranty Claim / RMA</option>
                            </>`;
c = c.replace(dropdownRegex, unifiedDropdown);

// 4. Unified Email label
const emailLabelRegex = /\{isHosting \? 'Support Email' : 'Email Address'\}/;
c = c.replace(emailLabelRegex, `'Support Email'`);

fs.writeFileSync('src/pages/ContactUs.tsx', c.replace(/\n/g, nl));
console.log('Unified Contact Us page content');