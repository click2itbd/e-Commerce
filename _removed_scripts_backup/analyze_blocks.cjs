const fs = require('fs');
const path = 'C:/Users/User/OneDrive/Desktop/e-Commerce/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Split the content by tab markers
// Each tab block starts with `) : activeTab === 'xxx' ? (` or `) : activeTab === 'xxx' && ... ? (`
const lines = content.split('\n');

const tabBlocks = [];
let blockStart = -1;
let blockName = '';

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Check if this line contains a tab marker
  const match = line.match(/\) : activeTab === '([^']+)'/);
  if (match) {
    // If we were tracking a previous block, save it
    if (blockStart !== -1) {
      tabBlocks.push({
        name: blockName,
        startLine: blockStart,
        endLine: i - 1,
        content: lines.slice(blockStart, i).join('\n')
      });
    }
    
    // Start new block
    blockName = match[1];
    blockStart = i;
  }
}

// Don't forget the last block
if (blockStart !== -1) {
  tabBlocks.push({
    name: blockName,
    startLine: blockStart,
    endLine: lines.length - 1,
    content: lines.slice(blockStart).join('\n')
  });
}

console.log(`Found ${tabBlocks.length} tab blocks`);

// Show which ones are inline JSX
for (const block of tabBlocks) {
  const trimmed = block.content.trim();
  const isComponent = trimmed.startsWith('<') && !trimmed.startsWith('<div');
  console.log(`${block.name}: ${isComponent ? 'component' : 'inline JSX'} (${block.content.length} chars)`);
}
