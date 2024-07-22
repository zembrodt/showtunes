const fs = require('fs');
const path = require('path');

const buildDatePath = path.join(__dirname, 'build-date.json');

fs.writeFileSync(buildDatePath, JSON.stringify({
  timestamp: Date.now()
}, null, 2));
