const fs = require('fs');
let track = fs.readFileSync('src/pages/shop/TrackOrder.tsx', 'utf8');

track = track.replace(
    'src="https://cdn3d.iconscout.com/3d/premium/thumb/delivery-scooter-5296811-4436531.png"', 
    'src="https://cdn-icons-png.flaticon.com/512/10465/10465801.png"'
);

fs.writeFileSync('src/pages/shop/TrackOrder.tsx', track, 'utf8');
console.log('Fixed broken image link');