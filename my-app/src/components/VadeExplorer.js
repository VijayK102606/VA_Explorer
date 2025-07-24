import React, { useState, useEffect } from 'react';
import '../VadeStyles.css';

const VadeExplorer = () => {
  const [currentView, setCurrentView] = useState('overview');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [recordCount, setRecordCount] = useState(12847);


  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setMessage("Please select a file first.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
    const fileBuffer = reader.result;
    
    // Send file to main process
    window.electronAPI.send('saveFile', {
      name: file.name,
      buffer: fileBuffer,
    });
  };

  reader.onerror = () => {
    setMessage("Error reading file.");
  };

  reader.readAsArrayBuffer(file); // Read file as buffer
};
/*
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch('http://localhost:4000/api/upload', {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();

      if (res.ok) {
        setMessage("File uploaded successfully! File ID: " + data.fileID);
        // Simulate record count increase
        setRecordCount(prev => prev + 1);
      } else {
        setMessage("Upload failed: " + data.message);
      }
    } catch (error) {
      setMessage("Error uploading file: " + error.message);
    }
*/
useEffect(() => {
  if (window.electronAPI && typeof window.electronAPI.receive === 'function') {
    window.electronAPI.receive('fileSaved', (status) => {
      if (status.success) {
        setMessage("File saved locally via Electron!");
        setRecordCount(prev => prev + 1);
      } else {
        setMessage("Error saving file: " + status.error);
      }
    });
  }
}, []);

  const viewTitles = {
    'overview': 'Database Overview',
    'records': 'Record Browser',
    'upload': 'Data Upload',
    'cause': 'Cause of Death Analysis',
    'demographic': 'Demographic Analysis',
    'geographic': 'Geographic Distribution',
    'temporal': 'Temporal Trends',
    'patterns': 'Pattern Analysis',
    'compare': 'Regional Comparison',
    'export': 'Data Export',
    'about': 'About VA Explorer'
  };

  const handleNavClick = (view) => {
    setCurrentView(view);
  };

  const renderContent = () => {
    switch(currentView) {
      case 'upload':
        return (
          <div>
            <div className="upload-form">
              <h3>Upload VA Data File</h3>
              <p style={{color: '#b0b0b0', marginBottom: '1.5rem'}}>
                Please see our formatting rules below before uploading your data.
              </p>
              <form onSubmit={handleSubmit}>
                <input type="file" onChange={handleFileChange} accept=".csv,.xlsx,.json"/>
                <button type="submit">Upload File</button>
              </form>
              {message && <div className="upload-message">{message}</div>}
            </div>
            
            <div className="stat-panel" style={{marginTop: '2rem'}}>
              <h3>File Requirements</h3>
              <div style={{color: '#d0d0d0', lineHeight: '1.6'}}>
                <p>• Files must be in CSV, Excel, or JSON format</p>
                <p>• Maximum file size: 50MB</p>
                <p>• Required fields: ID, Age, Gender, Location</p>
                <p>• Date format: YYYY-MM-DD</p>
              </div>
            </div>
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
              <div className="stat-detail">Autopsy records in database</div>
            </div>
            <div className="stat-panel">
              <h3>Date Range</h3>
              <div className="stat-value">2018-2024</div>
              <div className="stat-detail">6 years of data collection</div>
            </div>
            <div className="stat-panel">
              <h3>Regions Covered</h3>
              <div className="stat-value">23</div>
              <div className="stat-detail">Geographic regions worldwide</div>
            </div>
            <div className="stat-panel">
              <h3>Top Cause Category</h3>
              <div className="stat-value">Malaria</div>
              <div className="stat-detail">34% of all cases</div>
            </div>
            <div className="stat-panel large">
              <h3>Gender Distribution</h3>
              <div className="chart-container">
                <div className="chart-bar">
                  <div className="bar male" style={{width: '52%'}}></div>
                  <span>Male: 52% (6,680)</span>
                </div>
                <div className="chart-bar">
                  <div className="bar female" style={{width: '48%'}}></div>
                  <span>Female: 48% (6,167)</span>
                </div>
              </div>
            </div>
            <div className="stat-panel large">
              <h3>Age Distribution</h3>
              <div className="chart-container">
                <div className="chart-bar">
                  <div className="bar age-0-18" style={{width: '15%'}}></div>
                  <span>0-18: 15%</span>
                </div>
                <div className="chart-bar">
                  <div className="bar age-19-40" style={{width: '25%'}}></div>
                  <span>19-40: 25%</span>
                </div>
                <div className="chart-bar">
                  <div className="bar age-41-65" style={{width: '35%'}}></div>
                  <span>41-65: 35%</span>
                </div>
                <div className="chart-bar">
                  <div className="bar age-65plus" style={{width: '25%'}}></div>
                  <span>65+: 25%</span>
                </div>
              </div>
            </div>
            <div className="stat-panel large">
              <h3>Recent Activity</h3>
              <div className="activity-list">
                <div className="activity-item">
                  <span className="time">2 hours ago</span>
                  <span className="description">147 new records added from Region 12</span>
                </div>
                <div className="activity-item">
                  <span className="time">6 hours ago</span>
                  <span className="description">Data validation completed for Q4 2024</span>
                </div>
                <div className="activity-item">
                  <span className="time">1 day ago</span>
                  <span className="description">Export generated: Cardiovascular cases 2023-2024</span>
                </div>
                <div className="activity-item">
                  <span className="time">2 days ago</span>
                  <span className="description">Region 8 data synchronization completed</span>
                </div>
              </div>
            </div>
            <div className="stat-panel">
              <h3>Data Quality</h3>
              <div className="stat-value">94.2%</div>
              <div className="stat-detail">Records with complete data</div>
            </div>
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
              <span>Connected to VA Database</span>
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