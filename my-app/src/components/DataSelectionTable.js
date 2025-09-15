import React, { useState, useMemo, useCallback, useRef } from 'react';
import { getColumnHeaders, filterData, sortData } from '../utils/dataUtils';
import '../VadeStyles.css';

const DataSelectionTable = ({ data, headers, codebook, selected, setSelected }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState({});
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  const searchTimeoutRef = useRef(null);
  const filterTimeoutsRef = useRef({});

  const columnHeaders = useMemo(() => 
    getColumnHeaders(headers), 
    [headers]
  );

  const filteredAndSortedData = useMemo(() => {
    let processedData = filterData(data, searchTerm, columnFilters);
    return sortData(processedData, sortColumn, sortDirection);
  }, [data, searchTerm, columnFilters, sortColumn, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + rowsPerPage);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm(value);
      setCurrentPage(1);
    }, 300);
  }, []);

  const handleColumnFilterChange = useCallback((column, filterType, value) => {
    if (filterTimeoutsRef.current[column]) {
      clearTimeout(filterTimeoutsRef.current[column]);
    }
    
    filterTimeoutsRef.current[column] = setTimeout(() => {
      setColumnFilters(prev => ({
        ...prev,
        [column]: { type: filterType, value }
      }));
      setCurrentPage(1);
    }, 300);
  }, []);

  const handleColumnFilter = (column, filterType, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: { type: filterType, value }
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setColumnFilters({});
    setCurrentPage(1);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    Object.values(filterTimeoutsRef.current).forEach(timeout => {
      if (timeout) clearTimeout(timeout);
    });
    filterTimeoutsRef.current = {};
  };

  const handleSelectRow = (row) => {
    const rowString = convertRowToString(row);
    
    setSelected(prev => {
      if (prev.includes(rowString)) {
        return prev.filter(item => item !== rowString);
      } else {
        return [...prev, rowString];
      }
    });
  }

  const convertRowToString = (row) => {
    return Object.entries(row)
      .map(([key, value]) => `${key}: ${value ?? 'No data'}`)
      .join('; ');
  };

  const removeSelected = () => {
    if (selected.length > 0) {
      setSelected([]);
    }
  }

  if (!data || data.length === 0) {
    return (
      <div className="stat-panel">
        <h3>No Data Available</h3>
        <p style={{color: '#d0d0d0'}}>Please upload a data file to view records.</p>
      </div>
    );
  }

  return (
    <div className="data-table-container">
      {/* Search and Filter Controls */}
      <div className="table-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search all columns..."
            onChange={handleSearchChange}
            className="search-input"
          />
          <button onClick={clearFilters} className="clear-filters-btn">
            Clear All Filters
          </button>
        </div>
        
        <div className="table-info">
          <span>Showing {paginatedData.length} of {filteredAndSortedData.length} records</span>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columnHeaders.map((header) => (
                <th key={header.key}>
                  <div className="column-header">
                    <button
                      className="sort-button"
                      onClick={() => handleSort(header.key)}
                      title={`Sort by ${header.label}`}
                    >
                      {header.label}
                      {sortColumn === header.key && (
                        <span className="sort-indicator">
                          {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                        </span>
                      )}
                    </button>
                  </div>
                  
                  <div className="column-filter">
                    <select
                      onChange={(e) => {
                        const [type, value] = e.target.value.split(':');
                        handleColumnFilter(header.key, type, value);
                      }}
                      className="filter-select"
                    >
                      <option value="">Filter...</option>
                      <option value="contains:">Contains</option>
                      <option value="equals:">Equals</option>
                      <option value="greater:">Greater than</option>
                      <option value="less:">Less than</option>
                    </select>
                    
                    {columnFilters[header.key] && (
                      <input
                        type="text"
                        placeholder="Filter value"
                        onChange={(e) => 
                          handleColumnFilterChange(
                            header.key, 
                            columnFilters[header.key].type, 
                            e.target.value
                          )
                        }
                        className="filter-input"
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
          {paginatedData.map((row, index) => {
            const rowString = convertRowToString(row); // only needed for selection check
            const isSelected = selected.includes(rowString);

            return (
              <tr
                key={startIndex + index}
                onClick={() => handleSelectRow(row)}
                className={`data-row ${isSelected ? 'selected-row' : ''}`} // apply a class when selected
              >
                {columnHeaders.map((header) => (
                  <td key={header.key} title={String(row[header.key] || '')}>
                    {String(row[header.key] || '').length > 50
                      ? String(row[header.key] || '').substring(0, 50) + '...'
                      : String(row[header.key] || '')}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            First
          </button>
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Last
          </button>

          <button
          onClick={()=> removeSelected()}
          className='pagination-btn'
          >Remove {selected.length} cases</button>
        </div>
      )}
    </div>
  );
};

export default DataSelectionTable;