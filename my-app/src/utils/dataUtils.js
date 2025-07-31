import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export const parseDataFile = (file) => {
  return new Promise((resolve, reject) => {
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('CSV parsing warnings:', results.errors);
          }
          resolve({
            data: results.data,
            headers: results.meta.fields || []
          });
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        }
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const arrayBuffer = new Uint8Array(e.target.result);
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length === 0) {
            reject(new Error('Excel file is empty'));
            return;
          }
          
          const headers = jsonData[0];
          const dataRows = jsonData.slice(1);
          
          const parsedData = dataRows.map(row => {
            const obj = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || '';
            });
            return obj;
          });
          
          resolve({
            data: parsedData,
            headers: headers
          });
        } catch (error) {
          reject(new Error(`Excel parsing error: ${error.message}`));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read Excel file'));
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error('Unsupported file format. Please upload CSV or Excel files.'));
    }
  });
};

export const parseCodebook = (file) => {
  return new Promise((resolve, reject) => {
    parseDataFile(file)
      .then(({ data }) => {
        const mapping = {};
        const reverseCoding = {};
        
        data.forEach(row => {
          const variable = row.variable;
          const question = row.question;
          const coding = row.coding;
          
          if (variable && question) {
            mapping[variable] = {
              label: question,
              module: row.module || '',
              coding: {}
            };
            
            if (coding) {
              const codeMatches = coding.match(/(\d+)\s+"([^"]+)"/g);
              if (codeMatches) {
                codeMatches.forEach(match => {
                  const [, code, label] = match.match(/(\d+)\s+"([^"]+)"/);
                  mapping[variable].coding[code] = label;
                  
                  if (!reverseCoding[variable]) {
                    reverseCoding[variable] = {};
                  }
                  reverseCoding[variable][code] = label;
                });
              }
            }
          }
        });
        
        resolve({ mapping, reverseCoding });
      })
      .catch(reject);
  });
};

export const applyCodebook = (data, headers, codebook) => {
  if (!codebook || !data.length) return { data, headers };
  
  const headerMapping = {};
  const newHeaders = [];
  
  headers.forEach(oldHeader => {
    if (codebook.mapping[oldHeader]) {
      const newHeader = codebook.mapping[oldHeader].label;
      headerMapping[oldHeader] = newHeader;
      newHeaders.push(newHeader);
    } else {
      headerMapping[oldHeader] = oldHeader;
      newHeaders.push(oldHeader);
    }
  });
  
  const transformedData = data.map(row => {
    const newRow = {};
    
    Object.keys(row).forEach(oldKey => {
      const newKey = headerMapping[oldKey];
      let value = row[oldKey];
      
      if (codebook.mapping[oldKey] && codebook.mapping[oldKey].coding && value) {
        const decodedValue = codebook.mapping[oldKey].coding[value];
        if (decodedValue) {
          value = decodedValue;
        }
      }
      
      newRow[newKey] = value;
    });
    
    return newRow;
  });
  
  return { data: transformedData, headers: newHeaders };
};

export const getColumnHeaders = (headers) => {
  return headers.map(header => ({ key: header, label: header }));
};

export const filterData = (data, searchTerm, columnFilters) => {
  let filteredData = data;
  
  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    filteredData = filteredData.filter(row =>
      Object.values(row).some(value =>
        String(value).toLowerCase().includes(searchLower)
      )
    );
  }
  
  Object.keys(columnFilters).forEach(column => {
    const filter = columnFilters[column];
    if (filter.value) {
      filteredData = filteredData.filter(row => {
        const cellValue = String(row[column]).toLowerCase();
        const filterValue = String(filter.value).toLowerCase();
        
        switch (filter.type) {
          case 'contains':
            return cellValue.includes(filterValue);
          case 'equals':
            return cellValue === filterValue;
          case 'greater':
            return parseFloat(row[column]) > parseFloat(filter.value);
          case 'less':
            return parseFloat(row[column]) < parseFloat(filter.value);
          default:
            return cellValue.includes(filterValue);
        }
      });
    }
  });
  
  return filteredData;
};

export const sortData = (data, sortColumn, sortDirection) => {
  if (!sortColumn) return data;
  
  return [...data].sort((a, b) => {
    let aVal = a[sortColumn];
    let bVal = b[sortColumn];
    
    const aNum = parseFloat(aVal);
    const bNum = parseFloat(bVal);
    
    if (!isNaN(aNum) && !isNaN(bNum)) {
      aVal = aNum;
      bVal = bNum;
    } else {
      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();
    }
    
    if (sortDirection === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    }
  });
};