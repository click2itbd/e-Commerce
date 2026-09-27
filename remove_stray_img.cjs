const fs = require('fs');
let track = fs.readFileSync('src/pages/shop/TrackOrder.tsx', 'utf8');

// Remove the stray image tag completely
const strayImgRegex = /<img\s*src="https:\/\/cdn-icons-png\.flaticon\.com\/512\/10465\/10465801\.png"[\s\S]*?\/>/;
track = track.replace(strayImgRegex, '');

fs.writeFileSync('src/pages/shop/TrackOrder.tsx', track, 'utf8');