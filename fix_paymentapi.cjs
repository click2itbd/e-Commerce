const fs = require('fs');
let content = fs.readFileSync('src/services/paymentApi.ts', 'utf8');

content = content.replace(/export const initiateBkashPayment = async \(\):/g, 'export const initiateBkashPayment = async (...args: any[]):');
content = content.replace(/export const initiateSSLCommerzPayment = async \(\):/g, 'export const initiateSSLCommerzPayment = async (...args: any[]):');
content = content.replace(/export const initiateNagadPayment = async \(\):/g, 'export const initiateNagadPayment = async (...args: any[]):');

fs.writeFileSync('src/services/paymentApi.ts', content, 'utf8');
console.log("Fixed paymentApi.ts TS errors");
