const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const fs = require('fs');

let brows;
let detailWindows = new Map(); // Track detail windows

function start() {
    brows = new BrowserWindow({
        width:1400, 
        height:800,
        autoHideMenuBar: true, // Hide the menu bar (File, View, Help, etc.)
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });


    brows.loadURL('http://localhost:3000');

    brows.on('closed', () => {
        brows=null;
        // Close all detail windows when main window closes
        detailWindows.forEach(window => {
            if (!window.isDestroyed()) {
                window.close();
            }
        });
        detailWindows.clear();
    });
}

app.whenReady().then(start);

// Handle file saving (existing functionality)
ipcMain.on('saveFile', (event, { name, buffer }) => {
  const userDownloads = app.getPath('downloads');
  const filePath = path.join(userDownloads, name);

  fs.writeFile(filePath, Buffer.from(buffer), (err) => {
    if (err) {
      console.error('Failed to save file:', err);
      event.reply('fileSaved', { success: false, error: err.message });
    } else {
      console.log('File saved to:', filePath);
      event.reply('fileSaved', { success: true });
    }
  });
});

// Handle opening detail window for individual records
ipcMain.on('openDetailWindow', (event, { record, index, headers, codebook }) => {
  // Create a unique ID for this detail window
  const windowId = `detail-${index}`;
  
  // Check if window for this record is already open
  if (detailWindows.has(windowId) && !detailWindows.get(windowId).isDestroyed()) {
    // Focus existing window
    detailWindows.get(windowId).focus();
    return;
  }

  // Create new detail window
  const detailWindow = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    parent: brows,
    modal: false,
    webPreferences: {
      preload: path.join(__dirname, 'detail-preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: `Record Details - ${index + 1}`
  });

  // Generate HTML content for the detail view
  const htmlContent = generateDetailHTML(record, index, headers, codebook);
  
  // Load the HTML content directly
  detailWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

  // Store reference to the window
  detailWindows.set(windowId, detailWindow);

  // Clean up when window is closed
  detailWindow.on('closed', () => {
    detailWindows.delete(windowId);
  });

  event.reply('detailWindowOpened', { success: true, recordIndex: index });
});

function generateDetailHTML(record, index, headers, codebook) {
  const getFieldLabel = (key) => {
    if (codebook && codebook.mapping && codebook.mapping[key]) {
      return codebook.mapping[key].label;
    }
    return key;
  };

  const formatValue = (key, value) => {
    if (!value || value === '') return '<em>No data</em>';
    
    // If we have a codebook with coding for this field
    if (codebook && codebook.mapping && codebook.mapping[key] && codebook.mapping[key].coding) {
      const coding = codebook.mapping[key].coding;
      if (coding[value]) {
        return `${coding[value]} <small>(${value})</small>`;
      }
    }
    
    return String(value);
  };

  const recordFields = headers.map(header => {
    const label = getFieldLabel(header);
    const value = formatValue(header, record[header]);
    return `
      <div class="field-row">
        <div class="field-label">${label}</div>
        <div class="field-value">${value}</div>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Record Details - ${index + 1}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
          color: #e0e0e0;
          padding: 1.5rem;
          line-height: 1.6;
        }
        
        .header {
          background: rgba(50, 50, 50, 0.8);
          padding: 1.5rem;
          margin-bottom: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .header h1 {
          color: #ffffff;
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }
        
        .header .subtitle {
          color: #b0b0b0;
          font-size: 0.95rem;
        }
        
        .record-container {
          background: rgba(50, 50, 50, 0.6);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 1.5rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        
        .field-row {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 1rem;
          padding: 0.75rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .field-row:last-child {
          border-bottom: none;
        }
        
        .field-label {
          font-weight: 600;
          color: #4a9eff;
          font-size: 0.9rem;
        }
        
        .field-value {
          color: #e0e0e0;
          font-size: 0.9rem;
          word-break: break-word;
        }
        
        .field-value em {
          color: #888;
          font-style: italic;
        }
        
        .field-value small {
          color: #888;
          font-size: 0.8rem;
        }
        
        .no-data {
          color: #666;
          font-style: italic;
        }
        
        /* Scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Verbal Autopsy Record Details</h1>
        <div class="subtitle">Record #${index + 1} of dataset</div>
      </div>
      
      <div class="record-container">
        ${recordFields}
      </div>
    </body>
    </html>
  `;
}

app.on('window-all-closed', ()=> {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});