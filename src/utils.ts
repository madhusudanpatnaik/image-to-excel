import * as XLSX from 'xlsx';
import { TableData } from './types';

export function formatBytes(bytes: number, decimals = 2) {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:image/...;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}

export function exportToExcel(table: TableData) {
  const sheetData = [table.headers, ...table.rows];
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, table.tableName.substring(0, 31) || "Sheet1");
  XLSX.writeFile(workbook, `${table.tableName || "extracted_data"}.xlsx`);
}

export function exportToCSV(table: TableData) {
  const sheetData = [table.headers, ...table.rows];
  const csvContent = sheetData
    .map(row => row.map(val => {
      const strVal = String(val ?? '');
      if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
        return `"${strVal.replace(/"/g, '""')}"`;
      }
      return strVal;
    }).join(','))
    .join('\r\n');
  
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${table.tableName || "extracted_data"}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function copyToClipboardAsTSV(table: TableData): boolean {
  const sheetData = [table.headers, ...table.rows];
  const tsvContent = sheetData
    .map(row => row.join('\t'))
    .join('\n');
  
  try {
    const textarea = document.createElement('textarea');
    textarea.value = tsvContent;
    textarea.style.position = 'fixed';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch (err) {
    console.error("Failed to copy TSV to clipboard:", err);
    return false;
  }
}

export function mergeTables(tables: TableData[], mergedName: string): TableData {
  if (tables.length === 0) {
    throw new Error("No tables selected to merge");
  }
  
  // Sort tables by filename or tablename if available to ensure correct page sequence order!
  const sortedTables = [...tables].sort((a, b) => {
    const nameA = a.fileName || a.tableName || '';
    const nameB = b.fileName || b.tableName || '';
    return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
  });

  // Check if they have meaningful header overlap
  let hasOverlap = false;
  const headerUsageCount: Record<string, number> = {};
  sortedTables.forEach(table => {
    table.headers.forEach(h => {
      const trimmed = h ? h.trim() : '';
      if (trimmed && !trimmed.toLowerCase().startsWith('column')) {
        headerUsageCount[trimmed] = (headerUsageCount[trimmed] || 0) + 1;
        if (headerUsageCount[trimmed] > 1) {
          hasOverlap = true;
        }
      }
    });
  });

  let masterHeaders: string[] = [];
  const mergedRows: string[][] = [];

  if (hasOverlap) {
    // Merge by aligning header names
    const uniqueHeadersSet = new Set<string>();
    sortedTables.forEach(table => {
      table.headers.forEach(hdr => {
        if (hdr && hdr.trim()) {
          uniqueHeadersSet.add(hdr.trim());
        }
      });
    });
    masterHeaders = Array.from(uniqueHeadersSet);
    if (masterHeaders.length === 0) {
      masterHeaders = ['Column 1'];
    }

    for (const table of sortedTables) {
      for (const row of table.rows) {
        const newRow = Array(masterHeaders.length).fill('');
        table.headers.forEach((hdr, colIdx) => {
          const trimmedHdr = hdr ? hdr.trim() : '';
          const masterColIdx = masterHeaders.indexOf(trimmedHdr);
          if (masterColIdx !== -1) {
            newRow[masterColIdx] = row[colIdx] || '';
          }
        });
        mergedRows.push(newRow);
      }
    }
  } else {
    // No overlapping headers (e.g. generic Column 1, Column 2) or completely different names.
    // Merge by column index! Use the maximum column count.
    const maxCols = Math.max(...sortedTables.map(t => Math.max(t.headers.length, t.rows[0]?.length || 0)));
    
    // We can use the headers of the first table, padded if necessary
    const firstTable = sortedTables[0];
    masterHeaders = [...firstTable.headers];
    while (masterHeaders.length < maxCols) {
      masterHeaders.push(`Column ${masterHeaders.length + 1}`);
    }

    for (const table of sortedTables) {
      for (const row of table.rows) {
        const newRow = Array(maxCols).fill('');
        for (let i = 0; i < maxCols; i++) {
          newRow[i] = row[i] || '';
        }
        mergedRows.push(newRow);
      }
    }
  }
  
  return {
    id: `merged_${Date.now()}`,
    tableName: mergedName || "Merged Table",
    headers: masterHeaders,
    rows: mergedRows,
    status: 'completed'
  };
}

// Simple IndexedDB wrapper for full persistence of TableData across page refreshes
const DB_NAME = 'ImageToExcelDB';
const STORE_NAME = 'tables';
const DB_VERSION = 1;

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveAllTablesToDB(tables: TableData[]): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => {
        if (tables.length === 0) {
          resolve();
          return;
        }
        let count = 0;
        let errored = false;
        
        for (const table of tables) {
          // Remove any non-serializable objects if they exist
          const serializedTable = {
            id: table.id,
            tableName: table.tableName,
            headers: table.headers,
            rows: table.rows,
            fileName: table.fileName,
            fileSize: table.fileSize,
            thumbnail: table.thumbnail,
            status: table.status,
            error: table.error,
            base64Data: table.base64Data,
            fileType: table.fileType
          };
          
          const request = store.put(serializedTable);
          request.onsuccess = () => {
            count++;
            if (count === tables.length && !errored) {
              resolve();
            }
          };
          request.onerror = () => {
            if (!errored) {
              errored = true;
              reject(request.error);
            }
          };
        }
      };
      
      clearRequest.onerror = () => reject(clearRequest.error);
    });
  } catch (err) {
    console.error("IndexedDB save all error:", err);
  }
}

export async function loadTablesFromDB(): Promise<TableData[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("IndexedDB load error:", err);
    return [];
  }
}

