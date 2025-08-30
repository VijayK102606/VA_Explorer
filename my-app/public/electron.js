// Wrapper so electron-builder (react-cra preset) finds an electron entry in public/
// It forwards to the real electron entry at project root.
const path = require('path');

// require the actual electron entry (my-app/electron.js)
require(path.join(__dirname, '..', 'electron.js'));
