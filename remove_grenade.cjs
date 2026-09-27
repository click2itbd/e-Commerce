const fs = require('fs');
let track = fs.readFileSync('src/pages/shop/TrackOrder.tsx', 'utf8');

const regex = /\s*\{\/\*\s*3D Illustration \/ Graphic\s*\*\/\}\s*<img\s*src="https:\/\/cdn-icons-png\.flaticon\.com\/512\/8206\/8206253\.png"[^>]+>\s*<\/div>/;

if (regex.test(track)) {
    track = track.replace(regex, '');
    fs.writeFileSync('src/pages/shop/TrackOrder.tsx', track, 'utf8');
    console.log('Removed grenade image!');
} else {
    console.log('Regex did not match!');
}