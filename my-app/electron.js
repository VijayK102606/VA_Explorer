const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let brows;
let detailWindows = new Map();

function start() {
  brows = new BrowserWindow({
    width: 1400,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  brows.loadURL('http://localhost:3000');

  brows.on('closed', () => {
    brows = null;
    detailWindows.forEach(window => {
      if (!window.isDestroyed()) {
        window.close();
      }
    });
    detailWindows.clear();
  });
}

app.whenReady().then(start);

ipcMain.on('saveFile', (event, { name, buffer }) => {
  const userDownloads = app.getPath('desktop');
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

ipcMain.on('openDetailWindow', (event, { record, index, headers, codebook }) => {
  const windowId = `detail-${index}`;

  if (detailWindows.has(windowId) && !detailWindows.get(windowId).isDestroyed()) {
    detailWindows.get(windowId).focus();
    return;
  }

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

  const htmlContent = generateDetailHTML(record, index, headers, codebook);

  detailWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

  detailWindows.set(windowId, detailWindow);

  detailWindow.on('closed', () => {
    detailWindows.delete(windowId);
  });

  event.reply('detailWindowOpened', { success: true, recordIndex: index });
});

function generateDetailHTML(record, index, headers, codebook) {
  const getFieldLabel = (key) => {
    if (codebook?.mapping?.[key]?.label) {
      return codebook.mapping[key].label;
    }
    return key;
  };

  const formatValue = (key, value) => {
    if (!value || value === '') return '<em>No data</em>';
    const coding = codebook?.mapping?.[key]?.coding;
    if (coding?.[value]) {
      return `${coding[value]} <small>(${value})</small>`;
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

  const rawText = Object.values(record).join(' ');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Record Details - ${index + 1}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
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

        .wordcloud-header h2 {
          color: #4a9eff;
          font-size: 1.25rem;
          margin: 1rem 0;
        }

        #wordcloud {
          margin-bottom: 2rem;
          background: #1a1a1a;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 1rem;
          overflow: auto;
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

        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
      </style>
      <script src="https://d3js.org/d3.v7.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/d3-cloud/build/d3.layout.cloud.min.js"></script>
    </head>
    <body>
      <div class="header">
        <h1>Verbal Autopsy Record Details</h1>
        <div class="subtitle">Record #${index + 1} of dataset</div>
      </div>

      <div class="wordcloud-header">
        <h2>Word Cloud from Record Text</h2>
      </div>
      <div id="wordcloud"></div>

      <div class="record-container">
        ${recordFields}
      </div>

      <script>
        const rawText = ${JSON.stringify(rawText)};
        const stopWords = new Set([
          'the','and','a','of','to','in','is','that','on','for','it','with','as','was','at','by',
          'an','be','this','are','from','or','which',
          'yes', 'no', 'before', 'primary', 'average', 'doctor', 'level',
          'know', "don't"
        ]);

        function getWordFrequencies(text) {
          const words = text.toLowerCase().match(/\\b[\\w']+\\b/g) || [];
          const freqMap = new Map();
          words.forEach(word => {
            if (!stopWords.has(word)) {
              freqMap.set(word, (freqMap.get(word) || 0) + 1);
            }
          });
          return Array.from(freqMap, ([text, size]) => ({ text, size }));
        }

        const wordData = getWordFrequencies(rawText);

        d3.layout.cloud()
          .size([600, 300])
          .words(wordData)
          .padding(5)
          .rotate(() => ~~(Math.random() * 2) * 90)
          .font("Impact")
          .fontSize(d => 10 + d.size * 2)
          .on("end", draw)
          .start();

        function draw(words) {
          d3.select("#wordcloud")
            .append("svg")
            .attr("width", 600)
            .attr("height", 300)
            .append("g")
            .attr("transform", "translate(300,150)")
            .selectAll("text")
            .data(words)
            .enter().append("text")
            .style("font-size", d => d.size + "px")
            .style("font-family", "Impact")
            .style("fill", () => d3.schemeCategory10[Math.floor(Math.random() * 10)])
            .attr("text-anchor", "middle")
            .attr("transform", d => \`translate(\${d.x},\${d.y})rotate(\${d.rotate})\`)
            .text(d => d.text);
        }
      </script>
    </body>
    </html>
  `;
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
