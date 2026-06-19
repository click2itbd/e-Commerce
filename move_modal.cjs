const fs = require('fs');

const path = './src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const startMarker = '{/* Service Record Modal */}';
const endMarker = '          </div>\n        ) : activeTab === \'employees\' ? (';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const modalCode = content.substring(startIndex, endIndex);
  
  // Remove the modal code from its original position
  content = content.replace(modalCode, '');
  
  // Find where to inject
  const injectMarker = '{/* PC Builder Modal for Sales */}';
  const injectIndex = content.indexOf(injectMarker);
  
  if (injectIndex !== -1) {
    content = content.substring(0, injectIndex) + modalCode + '\n      ' + content.substring(injectIndex);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Successfully moved the modal!');
  } else {
    console.error('Inject marker not found');
  }
} else {
  console.error('Start or end marker not found', startIndex, endIndex);
}
