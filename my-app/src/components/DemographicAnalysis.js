import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const DemographicAnalysis = ({ data, headers, codebook }) => {
  const analysisData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const findColumn = (patterns) => {
      return headers.find(header => 
        patterns.some(pattern => 
          header.toLowerCase().includes(pattern.toLowerCase())
        )
      );
    };

    const siteColumn = findColumn(['site', 'location', 'region', 'area', 'place']);
    const sexColumn = findColumn(['sex', 'gender', 'g1_05', 'male', 'female']);
    const ageColumn = findColumn(['age', 'g1_04', 'years', 'old']);

    const siteDistribution = {};
    const sexDistribution = {};
    const ageDistribution = { '0-18': 0, '19-40': 0, '41-65': 0, '65+': 0 };

    data.forEach(record => {
      if (siteColumn) {
        const site = record[siteColumn] || 'Unknown';
        siteDistribution[site] = (siteDistribution[site] || 0) + 1;
      }

      if (sexColumn) {
        let sex = record[sexColumn] || 'Unknown';
        if (sex.toString() === '1' || sex.toString().toLowerCase().includes('male')) {
          sex = 'Male';
        } else if (sex.toString() === '2' || sex.toString().toLowerCase().includes('female')) {
          sex = 'Female';
        }
        sexDistribution[sex] = (sexDistribution[sex] || 0) + 1;
      }

      if (ageColumn) {
        const age = parseInt(record[ageColumn]);
        if (!isNaN(age)) {
          if (age <= 18) ageDistribution['0-18']++;
          else if (age <= 40) ageDistribution['19-40']++;
          else if (age <= 65) ageDistribution['41-65']++;
          else ageDistribution['65+']++;
        }
      }
    });

    return {
      siteDistribution,
      sexDistribution,
      ageDistribution,
      totalRecords: data.length,
      siteColumn,
      sexColumn,
      ageColumn
    };
  }, [data, headers, codebook]);

  if (!analysisData) {
    return (
      <div className="stat-panel">
        <h3>No Data Available</h3>
        <p style={{color: '#d0d0d0'}}>Please upload data to view demographic analysis.</p>
      </div>
    );
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#e0e0e0',
          font: { size: 12 },
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: 'rgba(50, 50, 50, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#e0e0e0',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1
      }
    },
    maintainAspectRatio: false,
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(50, 50, 50, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#e0e0e0',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#b0b0b0' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      x: {
        ticks: { color: '#b0b0b0' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    },
    maintainAspectRatio: false,
  };

  const sexChartData = {
    labels: Object.keys(analysisData.sexDistribution),
    datasets: [{
      data: Object.values(analysisData.sexDistribution),
      backgroundColor: ['#4a9eff', '#ff6b9d', '#ffd93d'],
      borderWidth: 0,
    }],
  };

  const ageChartData = {
    labels: Object.keys(analysisData.ageDistribution),
    datasets: [{
      data: Object.values(analysisData.ageDistribution),
      backgroundColor: ['#ffd93d', '#6bcf7f', '#4a9eff', '#a855f7'],
      borderWidth: 0,
    }],
  };

  const siteChartData = {
    labels: Object.keys(analysisData.siteDistribution),
    datasets: [{
      label: 'Number of Records',
      data: Object.values(analysisData.siteDistribution),
      backgroundColor: '#4a9eff',
      borderWidth: 0,
    }],
  };

  return (
    <div className="demographics-container">
      {/* Summary Statistics */}
      <div className="demographics-summary">
        <div className="stat-panel">
          <h3>Total Records Analyzed</h3>
          <div className="stat-value">{analysisData.totalRecords.toLocaleString()}</div>
          <div className="stat-detail">Verbal autopsy records with demographic data</div>
        </div>
        
        <div className="stat-panel">
          <h3>Geographic Sites</h3>
          <div className="stat-value">{Object.keys(analysisData.siteDistribution).length}</div>
          <div className="stat-detail">Distinct locations in the dataset</div>
        </div>

        <div className="stat-panel">
          <h3>Data Completeness</h3>
          <div className="demographic-fields">
            <div className="field-status">
              <span className="field-label">Site/Location:</span>
              <span className={`field-value ${analysisData.siteColumn ? 'available' : 'missing'}`}>
                {analysisData.siteColumn || 'Not Found'}
              </span>
            </div>
            <div className="field-status">
              <span className="field-label">Sex/Gender:</span>
              <span className={`field-value ${analysisData.sexColumn ? 'available' : 'missing'}`}>
                {analysisData.sexColumn || 'Not Found'}
              </span>
            </div>
            <div className="field-status">
              <span className="field-label">Age:</span>
              <span className={`field-value ${analysisData.ageColumn ? 'available' : 'missing'}`}>
                {analysisData.ageColumn || 'Not Found'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Sex Distribution */}
        {Object.keys(analysisData.sexDistribution).length > 0 && (
          <div className="chart-panel">
            <h3>Sex Distribution</h3>
            <div className="chart-container">
              <Pie data={sexChartData} options={chartOptions} height={300} />
            </div>
            <div className="chart-summary">
              {Object.entries(analysisData.sexDistribution).map(([sex, count]) => (
                <div key={sex} className="summary-item">
                  <span className="summary-label">{sex}:</span>
                  <span className="summary-value">{count} ({((count / analysisData.totalRecords) * 100).toFixed(1)}%)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Age Distribution */}
        {Object.values(analysisData.ageDistribution).some(val => val > 0) && (
          <div className="chart-panel">
            <h3>Age Distribution</h3>
            <div className="chart-container">
              <Pie data={ageChartData} options={chartOptions} height={300} />
            </div>
            <div className="chart-summary">
              {Object.entries(analysisData.ageDistribution).filter(([, count]) => count > 0).map(([ageGroup, count]) => (
                <div key={ageGroup} className="summary-item">
                  <span className="summary-label">{ageGroup} years:</span>
                  <span className="summary-value">{count} ({((count / analysisData.totalRecords) * 100).toFixed(1)}%)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Geographic Distribution */}
        {Object.keys(analysisData.siteDistribution).length > 0 && (
          <div className="chart-panel wide">
            <h3>Geographic Distribution by Site</h3>
            <div className="chart-container">
              <Bar data={siteChartData} options={barChartOptions} height={300} />
            </div>
            <div className="chart-summary">
              <div className="summary-stats">
                <span>Total Sites: {Object.keys(analysisData.siteDistribution).length}</span>
                <span>Largest Site: {Object.entries(analysisData.siteDistribution).sort((a, b) => b[1] - a[1])[0]?.[0]}</span>
                <span>Records: {Object.entries(analysisData.siteDistribution).sort((a, b) => b[1] - a[1])[0]?.[1]}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DemographicAnalysis;