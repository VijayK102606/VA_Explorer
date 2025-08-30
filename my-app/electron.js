const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let brows;
let detailWindows = new Map();
let serverProcess;

function startServer() {
  // Determine server folder depending on dev vs packaged
  let serverPath;
  if (app.isPackaged) {
    // when packaged extraResources are copied into resources path (extraResources in package.json)
    serverPath = path.join(process.resourcesPath, 'server');
  } else {
    serverPath = path.join(__dirname, '..', 'server');
  }

  const serverEntry = path.join(serverPath, 'index.js');

  if (!fs.existsSync(serverEntry)) {
    console.error('Server entry not found at', serverEntry);
    return;
  }

  // Spawn the server script directly using the current Node/Electron executable.
  // This avoids relying on npm/npm.cmd being available on the target machine.
  try {
    serverProcess = spawn(process.execPath, [serverEntry], {
      cwd: serverPath,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false
    });

    serverProcess.stdout.on('data', data => {
      console.log(`[server] ${data}`);
    });
    serverProcess.stderr.on('data', data => {
      console.error(`[server] ${data}`);
    });
    serverProcess.on('error', (err) => {
      console.error('Failed to start server process:', err);
    });
    serverProcess.on('close', (code) => {
      console.log(`Server exited with code ${code}`);
      serverProcess = null;
    });
  } catch (err) {
    console.error('Exception when starting server:', err);
  }
}

function start() {
  startServer();

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

  if (app.isPackaged) {
    // Load local build files in production (file://). CRA assets must be relative.
    brows.loadFile(path.join(__dirname, 'build', 'index.html'));
  } else {
    brows.loadURL('http://localhost:3000');
  }

  brows.on('closed', () => {
    brows = null;
    detailWindows.forEach(window => {
      if (!window.isDestroyed()) {
        window.close();
      }
    });
    detailWindows.clear();
    if (serverProcess) {
      serverProcess.kill();
    }
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
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@100;200;300;400;500;600;700;800;900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box;font-family: 'Montserrat', Arial, sans-serif; }
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
          border-radius: 0;
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
          border-radius: 0;
          padding: 1.5rem;
          overflow: hidden;
          height: 350px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .record-container {
          background: rgba(50, 50, 50, 0.6);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0;
          padding: 1.5rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .field-row {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0;
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
          border-radius: 0;
          padding: 1.5rem;
          overflow: hidden;
          height: 350px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .record-container {
          background: rgba(50, 50, 50, 0.6);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0;
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

        .chatbot-container {
          width: 100%;
          background: rgba(40, 40, 40, 0.85);
          border-bottom: 1px solid #222;
          box-shadow: 0 2px 8px rgba(0,0,0,0.10);
          margin-bottom: 1.5rem;
          padding: 1.5rem 2rem 1rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: stretch;
          min-height: 220px;
          max-height: 700px;
          height: auto;
        }
        .chatbot-title {
          font-size: 1.1rem;
          color: #4a9eff;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }
        .chatbot-chatbox {
          display: flex;
          flex-direction: column;
          width: 100%;
        }
        .chatbot-messages {
          min-height: 120px;
          max-height: 500px;
          overflow-y: auto;
          margin-bottom: 0.5rem;
          font-size: 0.98rem;
          color: #e0e0e0;
          padding: 0.5rem 0.2rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .chatbot-form {
          display: flex;
          gap: 0.5rem;
          width: 100%;
        }
        .chatbot-input {
          flex: 1;
          padding: 0.5rem 0.8rem;
          border: 1px solid #4a9eff;
          background: #181818;
          color: #e0e0e0;
          font-size: 1rem;
          transition: border 0.2s;
          border-radius: 0;
        }
        .chatbot-input:focus {
          outline: none;
          border-color: #93c5fd;
        }
        .chatbot-btn {
          padding: 0.5rem 1.2rem;
          background: linear-gradient(90deg, #4a9eff, #357abd);
          color: #fff;
          border: none;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
          border-radius: 0;
        }
        .chatbot-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .chatbot-btn:hover:not(:disabled) {
          background: linear-gradient(90deg, #357abd, #2563eb);
        }
        .chatbot-error {
          color: #ff4a4a;
          font-size: 0.95rem;
          margin-top: 0.5rem;
        }
        .chatbot-bubble-user {
          align-self: flex-end;
          background: #4a9eff;
          color: #fff;
          padding: 0.7rem 1.2rem;
          max-width: 70%;
          font-size: 1rem;
          border-radius: 0;
          margin-right: 0.5rem;
          margin-left: 2rem;
          box-shadow: 0 2px 8px rgba(74,158,255,0.10);
        }
        .chatbot-bubble-bot {
          align-self: flex-start;
          background: #222;
          color: #e0e0e0;
          padding: 0.7rem 1.2rem;
          max-width: 70%;
          font-size: 1rem;
          border-radius: 0;
          margin-left: 0.5rem;
          margin-right: 2rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.10);
        }
      </style>
    </head>
    <body>
      <div class="chatbot-container">
        <div class="chatbot-title">Ask about this entry</div>
        <div class="chatbot-chatbox">
          <div class="chatbot-messages" id="chatbot-messages"></div>
          <form class="chatbot-form" id="chatbot-form" autocomplete="off">
            <input type="text" id="chatbot-input" class="chatbot-input" placeholder="Type your question..." />
            <button id="chatbot-btn" class="chatbot-btn" type="submit">Ask</button>
          </form>
        </div>
        <div id="chatbot-error" class="chatbot-error" style="display:none;"></div>
        <div style="margin-top:1rem; font-size:0.85rem; color:#b0b0b0; text-align:center;">
          <em>Disclaimer: Answers are generated by a language model and may contain errors or inaccuracies. Please verify information before use.</em>
        </div>
      </div>
      <div class="header">
        <h1>Verbal Autopsy Record Details</h1>
        <div class="subtitle">Record #${index + 1} of dataset</div>
      </div>

      <div class="wordcloud-header">
        <h2>Word Cloud</h2>
      </div>
      <div id="wordcloud"></div>

      <div class="record-container">
        ${recordFields}
      </div>

      <script src="https://d3js.org/d3.v7.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/wordcloud@1.2.2/src/wordcloud2.min.js"></script>
      <script>
        const rawText = ${JSON.stringify(rawText)};
        
        console.log('Raw text for word cloud:', rawText);
        
        const stopWords = new Set([
          'the','and','a','of','to','in','is','that','on','for','it','with','as','was','at','by',
          'an','be','this','are','from','or','which','has','had','have','will','would','could',
          'should','may','might','can','do','does','did','get','got','go','went','come','came',
          'make','made','take','took','see','saw','know','knew','think','thought','say','said',
          'tell','told','give','gave','find','found','use','used','work','worked','call','called',
          'try','tried','ask','asked','need','needed','feel','felt','become','became','leave','left',
          'put','keep','kept','let','run','ran','move','moved','live','lived','believe','believed',
          'hold','held','bring','brought','happen','happened','write','wrote','provide','provided',
          'sit','sat','stand','stood','lose','lost','pay','paid','meet','met','include','included',
          'continue','continued','set','begin','began','seem','seemed','help','helped','talk','talked',
          'turn','turned','start','started','show','showed','hear','heard','play','played',
          'part','way','place','case','group','company','system','program','question','government',
          'yes', 'no', 'before', 'after', 'during', 'while', 'until', 'since', 'average', 
          "don't", 'not', 'also', 'just', 'only', 'first', 'last', 'next',
          'previous', 'current', 'new', 'old', 'good', 'bad', 'big', 'small', 'high', 'low', 'long',
          'short', 'early', 'late', 'right', 'left', 'up', 'down', 'here', 'there', 'where', 'when',
          'what', 'who', 'how', 'why', 'all', 'any', 'some', 'many', 'few', 'most', 'more', 'less',
          'other', 'another', 'same', 'different', 'each', 'every', 'both', 'either', 'neither'
        ]);

        // Blue-based color scheme for consistency
        const colorScheme = [
          '#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe',
          '#1e3a8a', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd',
          '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#bfdbfe',
          '#1e40af', '#2563eb', '#60a5fa', '#93c5fd', '#dbeafe'
        ];

        function getAllMeaningfulWords(text) {
          console.log('=== WORD PROCESSING DEBUG ===');
          console.log('Input text:', text.substring(0, 500));
          
          if (!text || text.length < 3) {
            console.log('Text too short');
            return [];
          }
          
          // Step 1: Simple word extraction
          const rawWords = text.toLowerCase().split(/\\s+/);
          console.log('Raw words (first 20):', rawWords.slice(0, 20));
          
          // Step 2: Basic filtering - just remove very short words and pure numbers
          const filteredWords = rawWords.filter(word => 
            word.length >= 3 && 
            !/^\\d+$/.test(word)
          );
          console.log('After basic filtering (first 20):', filteredWords.slice(0, 20));
          
          // Step 3: Remove only essential stop words
          const essentialStopWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'];
          
          const meaningfulWords = filteredWords.filter(word => 
            !essentialStopWords.includes(word)
          );
          console.log('After stop word removal (first 20):', meaningfulWords.slice(0, 20));
          
          // Step 4: Get unique words
          const uniqueWords = [...new Set(meaningfulWords)];
          console.log('Unique words count:', uniqueWords.length);
          console.log('Final unique words (first 20):', uniqueWords.slice(0, 20));
          
          // Step 5: Create word data
          if (uniqueWords.length === 0) {
            console.log('ERROR: No words survived filtering!');
            return [];
          }
          
          return uniqueWords.slice(0, 100);
        }

        const meaningfulWords = getAllMeaningfulWords(rawText);
        console.log('Final word count:', meaningfulWords.length);
        
        if (meaningfulWords.length === 0) {
          document.getElementById('wordcloud').innerHTML = 
            '<div style="color: #888; text-align: center; padding: 2rem; line-height: 1.6;">' +
            '<div style="margin-bottom: 1rem;">No significant words found for visualization</div>' +
            '<div style="font-size: 0.8rem; color: #666; background: rgba(40,40,40,0.5); padding: 1rem; border: 1px solid rgba(255,255,255,0.1); margin-top: 1rem;">' +
            '<strong>Debug Info:</strong><br>' +
            'Raw text length: ' + (rawText ? rawText.length : 0) + '<br>' +
            'Text preview: ' + (rawText ? (rawText.length > 150 ? rawText.substring(0, 150) + '...' : rawText) : 'No text') +
            '</div></div>';
        } else {
          // Use wordcloud2.js library for proper word cloud rendering
          console.log('Creating word cloud with wordcloud2.js library');
          
          // Prepare word list with weights
          const wordList = meaningfulWords.map((word, index) => {
            // Assign weights based on word length and position (longer words = higher weight)
            const weight = Math.max(8, Math.min(40, word.length * 3 + (meaningfulWords.length - index) * 0.5));
            return [word, weight];
          });
          
          console.log('Word list prepared:', wordList.slice(0, 10));
          
          // Configure wordcloud options
          const options = {
            list: wordList,
            gridSize: 12,
            weightFactor: 1.2,
            fontFamily: 'Arial, sans-serif',
            color: function(word, weight, fontSize, distance, theta) {
              // Use our blue color scheme
              const colorIndex = Math.floor(Math.random() * colorScheme.length);
              return colorScheme[colorIndex];
            },
            rotateRatio: 0.3,
            rotationSteps: 2,
            backgroundColor: 'transparent',
            drawOutOfBound: false,
            shrinkToFit: true,
            minSize: 8,
            ellipticity: 0.9
          };
          
          // Create the word cloud
          WordCloud(document.getElementById('wordcloud'), options);
          
          console.log('Word cloud created successfully with', meaningfulWords.length, 'words');
        }

        // Chatbot logic
        const chatbotForm = document.getElementById('chatbot-form');
        const chatbotBtn = document.getElementById('chatbot-btn');
        const chatbotInput = document.getElementById('chatbot-input');
        const chatbotMessages = document.getElementById('chatbot-messages');
        const chatbotError = document.getElementById('chatbot-error');
        const entryData = ${JSON.stringify(record)};
        let isLoading = false;
        function addMessage(text, sender) {
          const msgDiv = document.createElement('div');
          msgDiv.className = sender === 'user' ? 'chatbot-bubble-user' : 'chatbot-bubble-bot';
          if (sender === 'bot') {
            msgDiv.innerHTML = text;
          } else {
            msgDiv.textContent = text;
          }
          chatbotMessages.appendChild(msgDiv);
          chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        }
        function setLoading(loading) {
          isLoading = loading;
          chatbotBtn.disabled = loading;
          chatbotBtn.textContent = loading ? '...' : 'Ask';
        }
        chatbotForm.onsubmit = async function(e) {
          e.preventDefault();
          const question = chatbotInput.value.trim();
          chatbotError.style.display = 'none';
          if (!question || isLoading) return;
          addMessage(question, 'user');
          chatbotInput.value = '';
          setLoading(true);
          try {
            const res = await fetch('http://localhost:4000/api/chatbot', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ question, entry: entryData })
            });
            const data = await res.json();
            if (res.ok && data.answer) {
              addMessage(data.answer, 'bot');
            } else {
              chatbotError.textContent = data.error || 'No answer.';
              chatbotError.style.display = 'block';
            }
          } catch (err) {
            chatbotError.textContent = 'Error contacting chatbot.';
            chatbotError.style.display = 'block';
          }
          setLoading(false);
        };
      </script>
    </body>
    </html>
  `;
}

app.on('window-all-closed', () => {
  if (serverProcess && !serverProcess.killed) {
    try {
      serverProcess.kill();
    } catch (err) { /* ignore */ }
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
