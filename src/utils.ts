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
  
  // Gather all unique headers across all selected tables, keeping ordering consistent
  const uniqueHeadersSet = new Set<string>();
  tables.forEach(table => {
    table.headers.forEach(hdr => uniqueHeadersSet.add(hdr.trim()));
  });
  const masterHeaders = Array.from(uniqueHeadersSet);
  
  const mergedRows: string[][] = [];
  
  for (const table of tables) {
    for (const row of table.rows) {
      const newRow = Array(masterHeaders.length).fill('');
      table.headers.forEach((hdr, colIdx) => {
        const masterColIdx = masterHeaders.indexOf(hdr.trim());
        if (masterColIdx !== -1) {
          newRow[masterColIdx] = row[colIdx] || '';
        }
      });
      mergedRows.push(newRow);
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
