const fs = require('fs');
let track = fs.readFileSync('src/pages/shop/TrackOrder.tsx', 'utf8');

track = track.replace(
    '{ icon: <div className="text-6xl animate-[slide_2s_ease-in-out_infinite] translate-x-10">🚚</div>, text: "On the way..." }', 
    '{ icon: <div className="text-6xl animate-[slide_2s_ease-in-out_infinite] flex justify-center"><div className="-scale-x-100">🚚</div></div>, text: "On the way..." }'
);

fs.writeFileSync('src/pages/shop/TrackOrder.tsx', track, 'utf8');