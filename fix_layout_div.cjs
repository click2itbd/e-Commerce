const fs = require('fs');
let track = fs.readFileSync('src/pages/shop/TrackOrder.tsx', 'utf8');

track = track.replace('</Layout>', '  </div>\n    </Layout>');

fs.writeFileSync('src/pages/shop/TrackOrder.tsx', track, 'utf8');