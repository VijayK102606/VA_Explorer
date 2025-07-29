const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const fs = require('fs');

let brows;

function start() {
    brows = new BrowserWindow({
        width:1000, 
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
    });
}

app.whenReady().then(start);

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

app.on('window-all-closed', ()=> {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});