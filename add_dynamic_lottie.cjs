const fs = require('fs');
let track = fs.readFileSync('src/pages/shop/TrackOrder.tsx', 'utf8');

const dynamicLottieCode = `
  // Dynamic animation based on tracking step
  const getAnimationUrl = () => {
    if (!order) return "https://lottie.host/7905d4b8-2dc3-4a18-80f4-cf3d752f9547/d72sC3Wf7e.json"; // Shopping/Search
    if (step === -1) return "https://lottie.host/c83783a9-e0d0-4ad3-94c5-c2665e771c66/hYQ7Nq6f5i.json"; // Cancelled
    if (step === 0 || step === 1) return "https://lottie.host/66d039f9-bdbe-42af-ae7a-0fcda11cb93d/L0aR9a2PjO.json"; // Processing/Packing
    if (step === 2) return "https://lottie.host/8c06ce1d-720a-4a25-a4db-233bb33396f7/D4T358mPOn.json"; // On the way
    if (step === 3) return "https://lottie.host/b087091f-0e9b-4bd8-9d58-bb1237a28e5c/5YF5lU6mJz.json"; // Delivered
    return "https://lottie.host/8c06ce1d-720a-4a25-a4db-233bb33396f7/D4T358mPOn.json";
  };
`;

if (!track.includes('const getAnimationUrl = () => {')) {
    track = track.replace('const handleTrack = async', dynamicLottieCode + '\n  const handleTrack = async');
}

const oldPlayerRegex = /<Player[\s\S]*?src="[^"]+"[\s\S]*?\/>/;
const newPlayer = `<Player
                autoplay
                loop
                key={order ? step : 'default'}
                src={getAnimationUrl()}
                style={{ height: '100%', width: '100%', position: 'relative', zIndex: 10 }}
              />`;

track = track.replace(oldPlayerRegex, newPlayer);

fs.writeFileSync('src/pages/shop/TrackOrder.tsx', track, 'utf8');
console.log('Added dynamic lottie states!');