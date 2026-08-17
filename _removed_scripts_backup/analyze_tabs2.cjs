const fs = require('fs');
const path = 'C:/Users/User/OneDrive/Desktop/e-Commerce/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Split by tab markers more carefully
// The pattern in the file is: ) : activeTab === 'xxx' ? (
const lines = content.split('\n');

const tabs = [];
let currentTab = null;
let currentStart = -1;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const match = line.match(/\) : activeTab === '([^']+)' \? \(/);
  if (match) {
    if (currentTab) {
      tabs.push({
        name: currentTab,
        startLine: currentStart,
        endLine: i - 1,
        lines: i - currentStart
      });
    }
    currentTab = match[1];
    currentStart = i + 1;
  }
}

if (currentTab) {
  tabs.push({
    name: currentTab,
    startLine: currentStart,
    endLine: lines.length - 1,
    lines: lines.length - currentStart
  });
}

console.log('Found tabs:');
for (const tab of tabs) {
  const firstLine = lines[tab.startLine] ? lines[tab.startLine].trim() : '';
  const isComponent = firstLine.startsWith('<') && 
                      (firstLine.includes('Tab') || firstLine.includes('Manager') || firstLine.includes('Dashboard') || firstLine.includes('Page'));
  console.log(`${tab.name}: ${isComponent ? 'component' : 'inline JSX'} (${tab.lines} lines) - starts with: ${firstLine.slice(0, 60)}`);
}
