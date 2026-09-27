const fs = require('fs');
let track = fs.readFileSync('src/pages/shop/TrackOrder.tsx', 'utf8');

// Add import
if (!track.includes("import { Player } from '@lottiefiles/react-lottie-player';")) {
    track = track.replace(
        "import { Layout } from '../../components/Layout';", 
        "import { Layout } from '../../components/Layout';\nimport { Player } from '@lottiefiles/react-lottie-player';"
    );
}

// Replace the old img block
const imgBlockRegex = /<div className="relative w-64 h-64 mx-auto mb-8 flex items-center justify-center animate-in zoom-in duration-700">[\s\S]*?<\/div>/;

const newAnimationBlock = `<div className="relative w-72 h-72 mx-auto mb-4 flex items-center justify-center animate-in zoom-in duration-700">
              <div className="absolute inset-0 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
              <Player
                autoplay
                loop
                src="https://lottie.host/8c06ce1d-720a-4a25-a4db-233bb33396f7/D4T358mPOn.json"
                style={{ height: '100%', width: '100%', position: 'relative', zIndex: 10 }}
              />
            </div>`;

if (imgBlockRegex.test(track)) {
    track = track.replace(imgBlockRegex, newAnimationBlock);
    fs.writeFileSync('src/pages/shop/TrackOrder.tsx', track, 'utf8');
    console.log('Replaced with Lottie animation!');
} else {
    console.log('Regex did not match for Lottie replacement');
}