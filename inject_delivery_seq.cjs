const fs = require('fs');
let track = fs.readFileSync('src/pages/shop/TrackOrder.tsx', 'utf8');

const customAnimationCode = `
const DeliverySequence = () => {
  const [phase, setPhase] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setPhase(p => (p + 1) % 4);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const phases = [
    { icon: <div className="text-6xl animate-bounce">🛒</div>, text: "Shopping..." },
    { icon: <div className="text-6xl animate-pulse scale-125">✅</div>, text: "Order Confirmed!" },
    { icon: <div className="text-6xl animate-[slide_2s_ease-in-out_infinite] translate-x-10">🚚</div>, text: "On the way..." },
    { icon: <div className="text-6xl animate-bounce">🎁</div>, text: "Delivered!" }
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-blue-50/50 rounded-full border-4 border-white shadow-xl overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-white opacity-50"></div>
      <div className="relative z-10 flex flex-col items-center transition-all duration-500 transform scale-110">
        {phases[phase].icon}
        <p className="mt-4 font-bold text-blue-900 bg-white/80 px-3 py-1 rounded-full text-sm shadow-sm">{phases[phase].text}</p>
      </div>
      <style>{\`
        @keyframes slide {
          0% { transform: translateX(-40px); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateX(40px); opacity: 0; }
        }
      \`}</style>
    </div>
  );
};
`;

if (!track.includes('const DeliverySequence = () =>')) {
    track = track.replace('export default function TrackOrder() {', customAnimationCode + '\nexport default function TrackOrder() {');
    fs.writeFileSync('src/pages/shop/TrackOrder.tsx', track, 'utf8');
    console.log('Injected DeliverySequence definition!');
}