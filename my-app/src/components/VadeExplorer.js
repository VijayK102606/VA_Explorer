import React, { useState, useEffect } from 'react';
import DataTable from './DataTable';
import DataSelectionTable from './DataSelectionTable';
import DemographicAnalysis from './DemographicAnalysis';
import CauseOfDeathAnalysis from './CauseOfDeathAnalysis';
import { parseDataFile, parseCodebook, applyCodebook } from '../utils/dataUtils';
import '../VadeStyles.css';

const VadeExplorer = () => {
  const [currentView, setCurrentView] = useState('overview');
  const [file, setFile] = useState(null);
  const [codebookFile, setCodebookFile] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [rawData, setRawData] = useState([]);
  const [processedData, setProcessedData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [codebook, setCodebook] = useState(null);
  const [recordCount, setRecordCount] = useState(0);

  const [selected, setSelected] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newMessages = [...messages, {role: "user", content: input}];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
        const res = await fetch("http://localhost:5000/api/chatbot-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
          question: input,
          entries: selected, // 👈 this is your hook array
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages([...newMessages, { role: "assistant", content: data.answer }]);
    } catch(err) {
      console.error(err);
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleCodebookChange = (e) => {
    setCodebookFile(e.target.files[0]);
  };

  const handleDataUpload = async () => {
    if (!file) {
      setMessage("Please select a data file first.");
      return;
    }

    setIsLoading(true);
    setMessage("Processing file...");

    try {
      const { data, headers: fileHeaders } = await parseDataFile(file);
      
      let processedCodebook = null;
      let finalData = data;
      let finalHeaders = fileHeaders;
      
      if (codebookFile) {
        setMessage("Processing codebook...");
        processedCodebook = await parseCodebook(codebookFile);
        setCodebook(processedCodebook);
        
        const transformed = applyCodebook(data, fileHeaders, processedCodebook);
        finalData = transformed.data;
        finalHeaders = transformed.headers;
      }

      setRawData(data);
      setProcessedData(finalData);
      setHeaders(finalHeaders);
      setRecordCount(finalData.length);
      
      setMessage(`Successfully loaded ${finalData.length} records!`);
      
      setCurrentView('records');
      
    } catch (error) {
      console.error('File processing error:', error);
      setMessage(`Error processing file: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRowClick = (row, index) => {
    if (window.electronAPI) {
      window.electronAPI.send('openDetailWindow', {
        record: row,
        index: index,
        headers: headers,
        codebook: codebook
      });
    }
  };

  const handleRowSelection = (row, index) => {
    if (window.electronAPI) {
      window.electronAPI.send('caseSelection', {
        record: row,
        index: index,
        headers: headers,
        codebook: codebook
      });
    }
  };

  const handleOpenSelectionModal = () => {
    setShowModal(true);
  }

  const handleCloseSelectionModal = () => {
    setShowModal(false);
  }

  const viewTitles = {
    'overview': 'Database Overview',
    'records': 'Record Browser',
    'upload': 'Data Upload',
    'cause': 'Cause of Death Analysis',
    'demographic': 'Demographic Analysis',
    'geographic': 'Geographic Distribution',
    'temporal': 'Temporal Trends',
    'insights': 'AI insights',
    'patterns': 'Pattern Analysis',
    'compare': 'Regional Comparison',
    'export': 'Data Export',
    'about': 'About VA Explorer'
  };

  const handleNavClick = (view) => {
    setCurrentView(view);
  };

  const removeSelected = () => {
    setSelected([]);
  }

  const renderContent = () => {
    switch(currentView) {
      case 'upload':
        return (
          <div>
            <div className="upload-form">
              <h3>Upload VA Data Files</h3>
              <p style={{color: '#b0b0b0', marginBottom: '1.5rem'}}>
                Upload your Verbal Autopsy data file and optionally a codebook for enhanced data interpretation.
              </p>
              
              <div className="upload-section">
                <div className="file-upload-row">
                  <div className="file-input-group">
                    <label htmlFor="data-file">Data File (CSV/Excel) *</label>
                    <input 
                      id="data-file"
                      type="file" 
                      onChange={handleFileChange} 
                      accept=".csv,.xlsx,.xls"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="file-input-group">
                    <label htmlFor="codebook-file">Codebook (CSV/Excel) - Optional</label>
                    <input 
                      id="codebook-file"
                      type="file" 
                      onChange={handleCodebookChange} 
                      accept=".csv,.xlsx,.xls"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="upload-actions">
                    <button 
                      className="upload-btn" 
                      onClick={handleDataUpload}
                      disabled={isLoading || !file}
                    >
                      {isLoading ? 'Processing...' : 'Upload & Process'}
                    </button>
                  </div>
                </div>
              </div>

              {message && (
                <div className="upload-message">
                  {message}
                </div>
              )}

              {codebookFile && (
                <div className="codebook-info">
                  <h4>Codebook Selected</h4>
                  <p>Your data will be processed with enhanced column labels and value mappings.</p>
                </div>
              )}
            </div>
            
            <div className="stat-panel" style={{marginTop: '2rem'}}>
              <h3>File Requirements</h3>
              <div style={{color: '#d0d0d0', lineHeight: '1.6'}}>
                <p><strong>Data File:</strong></p>
                <p>• CSV or Excel format (.csv, .xlsx, .xls)</p>
                <p>• First row should contain column headers</p>
                <p>• Maximum recommended size: 100MB</p>
                <br/>
                <p><strong>Codebook File (Optional):</strong></p>
                <p>• Should contain columns: variable, question, coding</p>
                <p>• Helps translate coded values to readable text</p>
                <p>• Example: "1" becomes "Male", "2" becomes "Female"</p>
              </div>
            </div>
          </div>
        );

      case 'records':
        return (
          <div>
            {processedData.length > 0 ? (
              <DataTable 
                data={processedData}
                headers={headers}
                codebook={codebook}
                onRowClick={handleRowClick}
              />
            ) : (
              <div className="stat-panel">
                <h3>No Records Available</h3>
                <p style={{color: '#d0d0d0', marginBottom: '1rem'}}>
                  Please upload a data file to view and browse records.
                </p>
                <button 
                  className="upload-btn"
                  onClick={() => setCurrentView('upload')}
                >
                  Upload Data File
                </button>
              </div>
            )}
          </div>
        );
      
      case 'demographic':
        return (
          <DemographicAnalysis 
            data={processedData}
            headers={headers}
            codebook={codebook}
          />
        );

      case 'cause':
        return (
          <CauseOfDeathAnalysis 
            data={processedData}
            headers={headers}
            codebook={codebook}
          />
        );

      case 'geographic':
        return (
          <div className="stat-panel">
            <h3>Geographic Distribution Analysis</h3>
            <p style={{color: '#d0d0d0'}}>
              This feature will analyze geographic patterns in your VA data, including regional distributions and mapping capabilities.
            </p>
            <p style={{color: '#888', marginTop: '1rem', fontSize: '0.9rem'}}>
              Coming soon - Geographic analysis with interactive maps and regional comparisons.
            </p>
          </div>
        );

      case 'temporal':
        return (
          <div className="stat-panel">
            <h3>Temporal Trends Analysis</h3>
            <p style={{color: '#d0d0d0'}}>
              This feature will analyze time-based patterns in your VA data, including seasonal trends and year-over-year comparisons.
            </p>
            <p style={{color: '#888', marginTop: '1rem', fontSize: '0.9rem'}}>
              Coming soon - Time series analysis with trend visualization and seasonal patterns.
            </p>
          </div>
        );

      case 'patterns':
        return (
          <div className="stat-panel">
            <h3>Pattern Analysis</h3>
            <p style={{color: '#d0d0d0'}}>
              This feature will identify patterns and correlations in your VA data using advanced analytics.
            </p>
            <p style={{color: '#888', marginTop: '1rem', fontSize: '0.9rem'}}>
              Coming soon - Machine learning-based pattern detection and correlation analysis.
            </p>
          </div>
        );

      case 'compare':
        return (
          <div className="stat-panel">
            <h3>Regional Comparison</h3>
            <p style={{color: '#d0d0d0'}}>
              This feature will enable detailed comparisons between different regions or sites in your VA data.
            </p>
            <p style={{color: '#888', marginTop: '1rem', fontSize: '0.9rem'}}>
              Coming soon - Side-by-side regional analysis and statistical comparisons.
            </p>
          </div>
        );

        case 'insights':
          return (
          <>
              {processedData.length > 0 ? (
              <>
                <h3>Click ‘Select’ to choose cases for AI analysis.</h3>
                <div className="buttons">
                  <button 
                    onClick={()=> handleOpenSelectionModal()}
                    className="insight-btn"
                  >Select</button>
                  <button
                    onClick={()=> removeSelected()}
                    className="insight-btn"
                  >Unselect</button>
                  <button 
                    onClick={()=> handleCloseSelectionModal()}
                    className="insight-btn"
                  >Close</button>   
                </div>
                <div className="num-selected">{selected.length} cases selected</div>

                {selected.length > 0 && (
                  <div className="chatbot-container">
                    <div className="chatbot-title">Ask about selected entry</div>
                    <div className="chatbot-chatbox">
                      <div className="chatbot-messages">
                        {messages.map((msg, idx)=> (
                          <div
                            key={idx}
                            className={`chatbot-message ${msg.role}`}
                            dangerouslySetInnerHTML={{ __html: msg.content }}
                          />
                        ))}
                        {loading && <div className="chatbot-message assistant">Thinking...</div>}  
                      </div>

                      <form className="chatbot-form" onSubmit={handleSubmit} autoComplete="off">
                        <input
                          type="text"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          className="chatbot-input"
                          placeholder="Type your question..."
                        />
                        <button className="chatbot-btn" type="submit" disabled={loading}>
                          Ask
                        </button>
                      </form>
                    </div>

                    {error && <div className="chatbot-error">{error}</div>}

                    <div style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#b0b0b0", textAlign: "center" }}>
                      <em>
                        Disclaimer: Answers are generated by a language model and may contain errors or inaccuracies.
                        Please verify information before use.
                      </em>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="stat-panel">
                <h3>No Records Available</h3>
                <p style={{ color: '#d0d0d0', marginBottom: '1rem' }}>
                  Please upload a data file to view and browse records.
                </p>
                <button 
                  className="upload-btn"
                  onClick={() => setCurrentView('upload')}
                >
                  Upload Data File
                </button>
              </div>
            )}


              {showModal && (
                  processedData.length > 0 ? (
              <>
                  <DataSelectionTable 
                    data={processedData}
                    headers={headers}
                    codebook={codebook}
                    selected={selected}
                    setSelected={setSelected}
                  />
              </>
                ) : (
                  <div className="stat-panel">
                    <h3>No Records Available</h3>
                    <p style={{color: '#d0d0d0', marginBottom: '1rem'}}>
                      Please upload a data file to view and browse records.
                    </p>
                    <button 
                      className="upload-btn"
                      onClick={() => setCurrentView('upload')}
                    >
                      Upload Data File
                    </button>
                  </div>
                )
              )}
            </>
          );

      case 'export':
        return (
          <div className="stat-panel">
            <h3>Data Export</h3>
            <p style={{color: '#d0d0d0'}}>
              This feature will allow you to export your processed data and analysis results in various formats.
            </p>
            <p style={{color: '#888', marginTop: '1rem', fontSize: '0.9rem'}}>
              Coming soon - Export to CSV, PDF reports, and visualization images.
            </p>
          </div>
        );
      
      case 'about':
        return (
          <div className="stat-panel">
            <h3>About VA Explorer</h3>
            <div style={{color: '#d0d0d0', lineHeight: '1.6'}}>
              <p>VA Explorer is a comprehensive data tool that allows users to easily upload 
              their VA data and receive insightful summaries and interactive visualizations.</p>
              <br/>
              <p>Whether you're looking to analyze trends or gain a deeper understanding of your data, 
              VA Explorer provides intuitive charts and reports to help you make sense of your 
              information quickly and effectively.</p>
              <br/>
              <p><strong>Features:</strong></p>
              <p>• CSV and Excel file support</p>
              <p>• Codebook integration for data interpretation</p>
              <p>• Advanced filtering and sorting</p>
              <p>• Detailed record view</p>
              <p>• Real-time data analysis</p>
              <p>• Demographic and cause-of-death analytics</p>
              <p>• Interactive charts and visualizations</p>
              <br/>
              <p><strong>Contributors:</strong> Add names, contributors, etc.</p>
            </div>
          </div>
        );
      
      default:
        return (
          <div id="dashboard-grid">
            <div className="stat-panel">
              <h3>Total Records</h3>
              <div className="stat-value">{recordCount.toLocaleString()}</div>
              <div className="stat-detail">
                {recordCount > 0 ? 'Uploaded VA records' : 'No data uploaded yet'}
              </div>
            </div>
            <div className="stat-panel">
              <h3>Data Status</h3>
              <div className="stat-value">
                {processedData.length > 0 ? 'Ready' : 'Empty'}
              </div>
              <div className="stat-detail">
                {processedData.length > 0 ? 'Data loaded and processed' : 'Upload data to begin analysis'}
              </div>
            </div>
            <div className="stat-panel">
              <h3>Codebook</h3>
              <div className="stat-value">
                {codebook ? 'Active' : 'None'}
              </div>
              <div className="stat-detail">
                {codebook ? 'Enhanced data interpretation enabled' : 'No codebook loaded'}
              </div>
            </div>
            <div className="stat-panel">
              <h3>Quick Actions</h3>
              <div style={{marginTop: '1rem'}}>
                <button 
                  className="upload-btn" 
                  onClick={() => setCurrentView('upload')}
                  style={{marginBottom: '0.5rem', width: '100%'}}
                >
                  Upload Data
                </button>
                {processedData.length > 0 && (
                  <>
                    <button 
                      className="upload-btn" 
                      onClick={() => setCurrentView('records')}
                      style={{background: 'rgba(76, 207, 127, 0.2)', borderColor: 'rgba(76, 207, 127, 0.3)', color: '#4caf50', width: '100%', marginBottom: '0.5rem'}}
                    >
                      Browse Records
                    </button>
                    <button 
                      className="upload-btn" 
                      onClick={() => setCurrentView('demographic')}
                      style={{background: 'rgba(255, 193, 61, 0.2)', borderColor: 'rgba(255, 193, 61, 0.3)', color: '#ffc107', width: '100%', marginBottom: '0.5rem'}}
                    >
                      View Demographics
                    </button>
                    <button 
                      className="upload-btn" 
                      onClick={() => setCurrentView('cause')}
                      style={{background: 'rgba(255, 107, 157, 0.2)', borderColor: 'rgba(255, 107, 157, 0.3)', color: '#ff6b9d', width: '100%'}}
                    >
                      Analyze Causes
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {processedData.length > 0 && (
              <>
                <div className="stat-panel large">
                  <h3>Data Summary</h3>
                  <div className="chart-container">
                    <div style={{color: '#d0d0d0', lineHeight: '1.6'}}>
                      <p>• <strong>{headers.length}</strong> columns detected</p>
                      <p>• <strong>{recordCount}</strong> total records</p>
                      <p>• File processed successfully</p>
                      {codebook && <p>• Codebook applied for enhanced readability</p>}
                      <p>• Analysis views available: Demographics, Cause of Death</p>
                    </div>
                  </div>
                </div>
                
                <div className="stat-panel large">
                  <h3>Recent Activity</h3>
                  <div className="activity-list">
                    <div className="activity-item">
                      <span className="time">Just now</span>
                      <span className="description">{recordCount} records loaded and processed</span>
                    </div>
                    {codebook && (
                      <div className="activity-item">
                        <span className="time">Just now</span>
                        <span className="description">Codebook applied for data interpretation</span>
                      </div>
                    )}
                    <div className="activity-item">
                      <span className="time">Session start</span>
                      <span className="description">VA Explorer launched with analysis capabilities</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        );
    }
  };

  return (
    <>
      <div id="backdrop"></div>
      <div id="backdrop-center-logo">
        <svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1640 664" width="100%" height="100%">
          <title>VADE Logo</title>
          <style>
            {`.s0 {
              paint-order: stroke fill markers;
              stroke: #ffffff;
              stroke-width: 6;
              stroke-linejoin: round;
              fill: #ffffff;
            }`}
          </style>
          <path id="VADE" className="s0 svg-elem-1" aria-label="VADE"
            d="m562.4 211.3l-94.5 171.6-33.7-171.6h-49.8l48.6 240.7h47.4l132.1-240.7zm177.2 240.7h48.3l-51.3-240.7h-47.7l-135.1 240.7h51.6l27.1-51.6h97.2zm-84.7-93.9l49.3-92.8 17.5 92.8zm154.8 93.9h102c77.3 0 130.1-55.4 130.1-140.3 0-61.5-38.5-100.4-102.9-100.4h-87.4zm56.3-45.7l26-149.3h41.4c39.4 0 59.4 22 59.4 57.8 0 52.3-29.5 91.5-79.6 91.5zm381.4-150.3l8.1-44.7h-157.8l-41.8 240.7h161.7l8-44.7h-113.9l9.6-55.7h97.2l7.4-43.4h-96.9l9-52.2z">
          </path>
        </svg>
      </div>

      <div id="main-interface">
        <div id="sidebar-container">
          <div id="sidebar">
            <div id="sidebar-header">
              <h2>VA Explorer</h2>
              <p>Verbal Autopsy Data Explorer</p>
            </div>
            <nav id="sidebar-nav">
              <div className="nav-section">
                <h3>Database Overview</h3>
                <ul>
                  <li><a onClick={() => handleNavClick('overview')} className={currentView === 'overview' ? 'active' : ''}>General Statistics</a></li>
                  <li><a onClick={() => handleNavClick('records')} className={currentView === 'records' ? 'active' : ''}>Record Browser</a></li> 
                  <li><a onClick={() => handleNavClick('upload')} className={currentView === 'upload' ? 'active' : ''}>Upload Data</a></li>
                </ul>
              </div>
              <div className="nav-section">
                <h3>Explore by Category</h3>
                <ul>
                  <li><a onClick={() => handleNavClick('cause')} className={currentView === 'cause' ? 'active' : ''}>Cause of Death</a></li>
                  <li><a onClick={() => handleNavClick('demographic')} className={currentView === 'demographic' ? 'active' : ''}>Demographics</a></li>
                  <li><a onClick={() => handleNavClick('geographic')} className={currentView === 'geographic' ? 'active' : ''}>Geographic</a></li>
                  <li><a onClick={() => handleNavClick('temporal')} className={currentView === 'temporal' ? 'active' : ''}>Temporal Trends</a></li>
                </ul>
              </div>
              <div className="nav-section">
                <h3>Analysis Tools</h3>
                <ul>
                  <li><a onClick={() => handleNavClick('patterns')} className={currentView === 'patterns' ? 'active' : ''}>Pattern Analysis</a></li>
                  <li><a onClick={() => handleNavClick('compare')} className={currentView === 'compare' ? 'active' : ''}>Compare Regions</a></li>
                  <li><a onClick={() => handleNavClick('export')} className={currentView === 'export' ? 'active' : ''}>Export Data</a></li>
                  <li><a onClick={() => handleNavClick('insights')} className={currentView === 'insights' ? 'active': ''}>AI Insights</a></li>
                </ul>
              </div>
              <div className="nav-section">
                <h3>Information</h3>
                <ul>
                  <li><a onClick={() => handleNavClick('about')} className={currentView === 'about' ? 'active' : ''}>About Us</a></li>
                </ul>
              </div>
            </nav>
          </div>
        </div>
        <div id="main-content">
          <div id="content-header">
            <h1>{viewTitles[currentView]}</h1>
            <div id="status-bar">
              <span>
                {processedData.length > 0 ? 'Data Loaded' : 'No Data Loaded'}
              </span>
              <span id="record-count">{recordCount.toLocaleString()} Records</span>
            </div>
          </div>
          {renderContent()}
        </div>
      </div>
    </>
  );
};

export default VadeExplorer;