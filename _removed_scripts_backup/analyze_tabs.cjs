const fs = require('fs');
const path = 'C:/Users/User/OneDrive/Desktop/e-Commerce/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Split the main ternary chain by tab markers
// Pattern: ) : activeTab === 'xxx' ? (
const tabPattern = /\) : activeTab === '([^']+)' \? \(/g;

const tabs = [];
let lastIndex = 0;
let match;

while ((match = tabPattern.exec(content)) !== null) {
  const tabName = match[1];
  const startIdx = match.index + match[0].length;
  // Find the next tab marker
  tabPattern.lastIndex = startIdx;
  const nextMatch = tabPattern.exec(content);
  const endIdx = nextMatch ? nextMatch.index : content.length;
  
  tabs.push({
    name: tabName,
    startIdx: startIdx,
    endIdx: endIdx,
    content: content.slice(startIdx, endIdx)
  });
  
  tabPattern.lastIndex = match.index + 1;
}

console.log('Found tabs:', tabs.map(t => t.name));

// Now we can see which tabs have inline JSX and which have component references
for (const tab of tabs) {
  const isComponent = tab.content.trim().startsWith('<') && 
                      (tab.content.includes('Tab') || tab.content.includes('Manager') || tab.content.includes('Dashboard') || tab.content.includes('Page'));
  console.log(`${tab.name}: ${isComponent ? 'component' : 'inline JSX'} (${tab.content.length} chars)`);
}
