const fs = require('fs');
let c = fs.readFileSync('src/pages/ContactUs.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

if (c.includes('export const ContactUs = () => {')) {
  c = c.replace('export const ContactUs = () => {', 'export default function ContactUs() {');
  // Also keep the named export just in case
  c = c.replace('export default function ContactUs() {', 'export const ContactUs = () => {\n  return <ContactUsDefault />;\n};\n\nexport default function ContactUsDefault() {');
  fs.writeFileSync('src/pages/ContactUs.tsx', c.replace(/\n/g, nl));
  console.log('Fixed ContactUs.tsx exports');
} else {
  console.log('Could not find export const ContactUs');
}