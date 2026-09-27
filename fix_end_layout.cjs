const fs = require('fs');
let track = fs.readFileSync('src/pages/shop/TrackOrder.tsx', 'utf8');

// The issue is an extra `</div>` before `</Layout>`
track = track.replace('      </div>\n      </Layout>\n  );\n}', '    </Layout>\n  );\n}');

fs.writeFileSync('src/pages/shop/TrackOrder.tsx', track, 'utf8');