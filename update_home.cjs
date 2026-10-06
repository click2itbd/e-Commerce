const fs = require('fs');
let c = fs.readFileSync('src/pages/shop/Home.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

// 1. Add State
const stateInjection = `const [categories, setCategories] = useState<any[]>([]);
  const [pcBuilderBanner, setPcBuilderBanner] = useState<any>(null);`;
if (!c.includes('pcBuilderBanner')) {
  c = c.replace('const [categories, setCategories] = useState<any[]>([]);', stateInjection);
}

// 2. Add Fetch logic
const fetchInjection = `useEffect(() => {
    const q = query(collection(db, 'store_banners'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeBanners = snapshot.docs.map(doc => doc.data()).filter(b => b.isActive);
      const pb = activeBanners.find(b => b.position === 'pc_builder');
      if (pb) setPcBuilderBanner(pb);
    });
    return () => unsubscribe();
  }, []);`;
  
if (!c.includes('pcBuilderBanner')) {
  // It won't be here since I just checked in step 1, but I can replace the first useEffect
  c = c.replace('useEffect(() => {', fetchInjection + '\n\n  useEffect(() => {');
} else if (!c.includes('pc_builder')) {
  c = c.replace('useEffect(() => {', fetchInjection + '\n\n  useEffect(() => {');
}

// 3. Replace the PC Builder section rendering
const oldSectionRegex = /<section className="mt-16 mb-8 relative overflow-hidden rounded-3xl shadow-2xl group">[\s\S]*?<\/section>/;

const newSection = `{/* New Beautiful PC Builder Banner */}
      <section className="mt-16 mb-8">
        <Link to={pcBuilderBanner?.targetUrl || "/pc-builder"} className="block relative overflow-hidden rounded-3xl shadow-2xl group w-full h-[250px] md:h-[400px]">
          <img 
            src={pcBuilderBanner?.imageUrl || "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?q=80&w=1200&auto=format&fit=crop"} 
            alt="PC Builder" 
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" 
          />
        </Link>
      </section>`;

c = c.replace(oldSectionRegex, newSection);

fs.writeFileSync('src/pages/shop/Home.tsx', c.replace(/\n/g, nl));
console.log('Home.tsx updated with dynamic PC Builder banner');