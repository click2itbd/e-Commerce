const fs = require('fs');
let c = fs.readFileSync('src/pages/shop/ProductDetails.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

// 1. Inject the grouping logic before ProductDetails
const groupingLogic = `
const SPEC_GROUPS = [
  {
    title: 'General',
    keywords: ['brand', 'model', 'type', 'form factor', 'color', 'material', 'design']
  },
  {
    title: 'Display & Video',
    keywords: ['display', 'screen', 'resolution', 'panel', 'refresh rate', 'response time', 'graphics', 'gpu', 'video']
  },
  {
    title: 'Performance & Core',
    keywords: ['processor', 'cpu', 'architecture', 'core', 'thread', 'clock', 'motherboard', 'chipset', 'socket']
  },
  {
    title: 'Memory & Storage',
    keywords: ['memory', 'ram', 'storage', 'capacity', 'ssd', 'hdd']
  },
  {
    title: 'Camera & Audio',
    keywords: ['camera', 'lens', 'sensor', 'night vision', 'audio', 'speaker', 'microphone', 'sound']
  },
  {
    title: 'Connectivity & Ports',
    keywords: ['connectivity', 'network', 'wi-fi', 'wifi', 'bluetooth', 'port', 'interface', 'usb', 'connection']
  },
  {
    title: 'Power & Battery',
    keywords: ['power', 'battery', 'charging', 'voltage', 'wattage']
  },
  {
    title: 'Physical Specifications',
    keywords: ['weight', 'dimension', 'size']
  },
  {
    title: 'Warranty',
    keywords: ['warranty']
  }
];

const groupSpecs = (specsObj: Record<string, any>) => {
  if (!specsObj) return [];
  const entries = sortSpecs(Object.entries(specsObj));
  const groups = SPEC_GROUPS.map(g => ({ title: g.title, items: [] as [string, any][] }));
  const otherGroup = { title: 'Main Features', items: [] as [string, any][] };

  entries.forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();
    const matchedGroup = groups.find(g => SPEC_GROUPS.find(sg => sg.title === g.title)?.keywords.some(k => lowerKey.includes(k)));
    if (matchedGroup) {
      matchedGroup.items.push([key, value]);
    } else {
      otherGroup.items.push([key, value]);
    }
  });

  return [otherGroup, ...groups].filter(g => g.items.length > 0);
};
`;

if (!c.includes('const groupSpecs')) {
  c = c.replace('export const ProductDetails: React.FC = () => {', groupingLogic + '\nexport const ProductDetails: React.FC = () => {');
}

// 2. Replace the UI
const oldUIStart = `{product.specs && Object.keys(product.specs).length > 0 ? (`;
const oldUIEndRegex = /<div className="border border-gray-200 rounded-lg overflow-hidden">[\s\S]*?<\/div>\s*\)\s*:\s*\(/;

const newUI = `{product.specs && Object.keys(product.specs).length > 0 ? (
                      <div className="space-y-6">
                        {groupSpecs(product.specs).map((group, gIdx) => (
                          <div key={gIdx}>
                            <div className="bg-[#F5F6FB] text-[#3749BB] font-bold px-4 py-2.5 rounded-md text-[15px] mb-2">
                              {group.title}
                            </div>
                            <div className="flex flex-col">
                              {group.items.map(([key, value], i) => (
                                <div key={key} className="flex border-b border-gray-100 hover:bg-gray-50 transition-colors py-3 px-2 text-[14px]">
                                  <div className="w-1/3 text-gray-500 font-medium pr-4">{key}</div>
                                  <div className="w-2/3 text-gray-900">{value}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (`;

if (c.match(oldUIEndRegex)) {
  c = c.replace(oldUIEndRegex, newUI);
  fs.writeFileSync('src/pages/shop/ProductDetails.tsx', c.replace(/\n/g, nl));
  console.log('Successfully updated Spec UI');
} else {
  console.log('Failed to match UI regex');
}