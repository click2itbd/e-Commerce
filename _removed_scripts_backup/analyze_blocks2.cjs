const fs = require('fs');
const path = 'C:/Users/User/OneDrive/Desktop/e-Commerce/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Split the content by tab markers
const lines = content.split('\n');

const tabBlocks = [];
let blockStart = -1;
let blockName = '';

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const match = line.match(/\) : activeTab === '([^']+)'/);
  if (match) {
    if (blockStart !== -1) {
      tabBlocks.push({
        name: blockName,
        startLine: blockStart,
        endLine: i - 1,
        content: lines.slice(blockStart, i).join('\n')
      });
    }
    blockName = match[1];
    blockStart = i;
  }
}

if (blockStart !== -1) {
  tabBlocks.push({
    name: blockName,
    startLine: blockStart,
    endLine: lines.length - 1,
    content: lines.slice(blockStart).join('\n')
  });
}

console.log(`Found ${tabBlocks.length} tab blocks`);

// Show which ones are inline JSX vs components
for (const block of tabBlocks) {
  // Get the first non-empty, non-marker line
  const blockLines = block.content.split('\n');
  let firstContentLine = '';
  for (const l of blockLines) {
    const trimmed = l.trim();
    if (trimmed && !trimmed.startsWith(') : activeTab')) {
      firstContentLine = trimmed;
      break;
    }
  }
  
  const isComponent = firstContentLine.startsWith('<') && 
                      (firstContentLine.includes('/>') || 
                       firstContentLine.includes('Tab') ||
                       firstContentLine.includes('Manager') ||
                       firstContentLine.includes('Dashboard') ||
                       firstContentLine.includes('Page'));
  
  console.log(`${block.name}: ${isComponent ? 'component' : 'inline JSX'} (${block.content.length} chars) - first: ${firstContentLine.slice(0, 60)}`);
}
