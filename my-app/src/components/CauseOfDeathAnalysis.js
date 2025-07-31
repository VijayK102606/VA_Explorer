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
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const CauseOfDeathAnalysis = ({ data, headers, codebook }) => {
  const analysisData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const findColumn = (patterns) => {
      return headers.find(header => 
        patterns.some(pattern => 
          header.toLowerCase().includes(pattern.toLowerCase())
        )
      );
    };

    const causeColumn = findColumn(['cause', 'cod', 'death', 'diagnosis', 'disease', 'condition']);
    const immediateColumn = findColumn(['immediate', 'direct', 'primary']);
    const underlyingColumn = findColumn(['underlying', 'fundamental', 'basic']);

    const causeDistribution = {};
    let totalWithCause = 0;

    if (causeColumn) {
      data.forEach(record => {
        const cause = record[causeColumn];
        if (cause && cause.toString().trim() !== '') {
          const cleanCause = cause.toString().trim();
          causeDistribution[cleanCause] = (causeDistribution[cleanCause] || 0) + 1;
          totalWithCause++;
        }
      });
    }

    const sortedCauses = Object.entries(causeDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);

    return {
      causeDistribution,
      sortedCauses,
      totalRecords: data.length,
      totalWithCause,
      causeColumn,
      immediateColumn,
      underlyingColumn
    };
  }, [data, headers, codebook]);

  if (!analysisData) {
    return (
      <div className="stat-panel">
        <h3>No Data Available</h3>
        <p style={{color: '#d0d0d0'}}>Please upload data to view cause of death analysis.</p>
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
          font: { size: 10 },
          padding: 10,
          generateLabels: function(chart) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.slice(0, 8).map((label, i) => ({
                text: label.length > 25 ? label.substring(0, 25) + '...' : label,
                fillStyle: data.datasets[0].backgroundColor[i],
                strokeStyle: data.datasets[0].backgroundColor[i],
                lineWidth: 0,
                hidden: false,
                index: i
              }));
            }
            return [];
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(50, 50, 50, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#e0e0e0',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const percentage = ((context.parsed / analysisData.totalWithCause) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          }
        }
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
        ticks: { 
          color: '#b0b0b0',
          maxRotation: 45,
          callback: function(value, index) {
            const label = this.getLabelForValue(value);
            return label.length > 20 ? label.substring(0, 20) + '...' : label;
          }
        },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    },
    maintainAspectRatio: false,
  };

  const topCauses = analysisData.sortedCauses.slice(0, 10);
  const colors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', 
    '#dda0dd', '#98d8c8', '#f7dc6f', '#bb8fce', '#85c1e9'
  ];

  const doughnutData = {
    labels: topCauses.map(([cause]) => cause.length > 30 ? cause.substring(0, 30) + '...' : cause),
    datasets: [{
      data: topCauses.map(([, count]) => count),
      backgroundColor: colors.slice(0, topCauses.length),
      borderWidth: 0,
    }],
  };

  const barData = {
    labels: topCauses.map(([cause]) => cause.length > 25 ? cause.substring(0, 25) + '...' : cause),
    datasets: [{
      label: 'Number of Cases',
      data: topCauses.map(([, count]) => count),
      backgroundColor: '#4a9eff',
      borderWidth: 0,
    }],
  };

  return (
    <div className="cause-analysis-container">
      {/* Summary Statistics */}
      <div className="analysis-summary">
        <div className="stat-panel">
          <h3>Total Records</h3>
          <div className="stat-value">{analysisData.totalRecords.toLocaleString()}</div>
          <div className="stat-detail">Verbal autopsy records analyzed</div>
        </div>
        
        <div className="stat-panel">
          <h3>Records with Cause Data</h3>
          <div className="stat-value">{analysisData.totalWithCause.toLocaleString()}</div>
          <div className="stat-detail">
            {((analysisData.totalWithCause / analysisData.totalRecords) * 100).toFixed(1)}% data completeness
          </div>
        </div>

        <div className="stat-panel">
          <h3>Unique Causes</h3>
          <div className="stat-value">{Object.keys(analysisData.causeDistribution).length}</div>
          <div className="stat-detail">Distinct causes of death identified</div>
        </div>

        <div className="stat-panel">
          <h3>Data Fields</h3>
          <div className="analysis-fields">
            <div className="field-status">
              <span className="field-label">Cause of Death:</span>
              <span className={`field-value ${analysisData.causeColumn ? 'available' : 'missing'}`}>
                {analysisData.causeColumn || 'Not Found'}
              </span>
            </div>
            <div className="field-status">
              <span className="field-label">Immediate Cause:</span>
              <span className={`field-value ${analysisData.immediateColumn ? 'available' : 'missing'}`}>
                {analysisData.immediateColumn || 'Not Found'}
              </span>
            </div>
            <div className="field-status">
              <span className="field-label">Underlying Cause:</span>
              <span className={`field-value ${analysisData.underlyingColumn ? 'available' : 'missing'}`}>
                {analysisData.underlyingColumn || 'Not Found'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      {analysisData.sortedCauses.length > 0 && (
        <div className="charts-grid">
          {/* Top Causes Pie Chart */}
          <div className="chart-panel">
            <h3>Top 10 Causes of Death (Distribution)</h3>
            <div className="chart-container">
              <Doughnut data={doughnutData} options={chartOptions} height={350} />
            </div>
          </div>

          {/* Top Causes Bar Chart */}
          <div className="chart-panel">
            <h3>Top 10 Causes of Death (Count)</h3>
            <div className="chart-container">
              <Bar data={barData} options={barChartOptions} height={350} />
            </div>
          </div>

          {/* Detailed Breakdown Table */}
          <div className="chart-panel wide">
            <h3>Detailed Cause of Death Breakdown</h3>
            <div className="detailed-breakdown">
              <div className="breakdown-table">
                {analysisData.sortedCauses.slice(0, 15).map(([cause, count], index) => (
                  <div key={cause} className="breakdown-row">
                    <span className="rank">#{index + 1}</span>
                    <span className="cause-name" title={cause}>{cause}</span>
                    <span className="cause-count">{count}</span>
                    <span className="cause-percentage">
                      {((count / analysisData.totalWithCause) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CauseOfDeathAnalysis;