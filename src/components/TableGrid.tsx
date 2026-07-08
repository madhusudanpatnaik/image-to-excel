import React, { useState, useMemo, useRef } from 'react';
import { 
  FileSpreadsheet, 
  FileCode, 
  Copy, 
  Plus, 
  Trash2, 
  Search, 
  Check, 
  Trash,
  HelpCircle,
  PlusCircle,
  Edit2,
  X,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RefreshCw
} from 'lucide-react';
import { TableData } from '../types';
import { exportToExcel, exportToCSV, copyToClipboardAsTSV } from '../utils';
import { motion, AnimatePresence } from 'motion/react';

interface TableGridProps {
  table: TableData;
  onUpdateTable: (updatedTable: TableData) => void;
}

export default function TableGrid({ table, onUpdateTable }: TableGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCell, setEditingCell] = useState<{ r: number; c: number } | null>(null);
  const [editingHeader, setEditingHeader] = useState<number | null>(null);
  const [cellValue, setCellValue] = useState('');
  const [headerValue, setHeaderValue] = useState('');
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [selectedCol, setSelectedCol] = useState<number | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Advanced Production States
  const [showSourceImage, setShowSourceImage] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [invertImageColors, setInvertImageColors] = useState(false);
  const [imageError, setImageError] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Reset image error on table change
  React.useEffect(() => {
    setImageError(false);
  }, [table.id]);

  // Filters rows based on query
  const filteredRowsWithIndices = useMemo(() => {
    return table.rows
      .map((row, originalIndex) => ({ row, originalIndex }))
      .filter(({ row }) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return row.some(cell => String(cell || '').toLowerCase().includes(query));
      });
  }, [table.rows, searchQuery]);

  // Edit cell value
  const startEditCell = (rowIndex: number, colIndex: number, currentVal: string) => {
    setEditingCell({ r: rowIndex, c: colIndex });
    setCellValue(currentVal);
  };

  const saveEditCell = () => {
    if (!editingCell) return;
    const { r, c } = editingCell;
    const updatedRows = [...table.rows];
    updatedRows[r] = [...updatedRows[r]];
    updatedRows[r][c] = cellValue;
    
    onUpdateTable({
      ...table,
      rows: updatedRows
    });
    setEditingCell(null);
  };

  // Edit header
  const startEditHeader = (colIndex: number, currentVal: string) => {
    setEditingHeader(colIndex);
    setHeaderValue(currentVal);
  };

  const saveEditHeader = () => {
    if (editingHeader === null) return;
    const updatedHeaders = [...table.headers];
    updatedHeaders[editingHeader] = headerValue || `Column ${editingHeader + 1}`;
    
    onUpdateTable({
      ...table,
      headers: updatedHeaders
    });
    setEditingHeader(null);
  };

  // Add row
  const handleAddRow = () => {
    const newRow = Array(table.headers.length).fill('');
    onUpdateTable({
      ...table,
      rows: [...table.rows, newRow]
    });
    setSelectedRow(table.rows.length); // Select new row
  };

  // Delete row
  const handleDeleteRow = (index: number) => {
    const updatedRows = table.rows.filter((_, i) => i !== index);
    onUpdateTable({
      ...table,
      rows: updatedRows
    });
    if (selectedRow === index) {
      setSelectedRow(null);
    } else if (selectedRow !== null && selectedRow > index) {
      setSelectedRow(selectedRow - 1);
    }
  };

  // Add column
  const handleAddColumn = () => {
    const newColName = `Column ${table.headers.length + 1}`;
    const updatedHeaders = [...table.headers, newColName];
    const updatedRows = table.rows.map(row => [...row, '']);
    
    onUpdateTable({
      ...table,
      headers: updatedHeaders,
      rows: updatedRows
    });
  };

  // Delete column
  const handleDeleteColumn = (colIndex: number) => {
    if (table.headers.length <= 1) return; // Prevent deleting the last column
    const updatedHeaders = table.headers.filter((_, i) => i !== colIndex);
    const updatedRows = table.rows.map(row => row.filter((_, i) => i !== colIndex));
    
    onUpdateTable({
      ...table,
      headers: updatedHeaders,
      rows: updatedRows
    });
    
    if (selectedCol === colIndex) {
      setSelectedCol(null);
    } else if (selectedCol !== null && selectedCol > colIndex) {
      setSelectedCol(selectedCol - 1);
    }
  };

  // Contextual Row Modifiers
  const handleInsertRowAbove = () => {
    if (selectedRow === null) return;
    const newRow = Array(table.headers.length).fill('');
    const updatedRows = [...table.rows];
    updatedRows.splice(selectedRow, 0, newRow);
    onUpdateTable({
      ...table,
      rows: updatedRows
    });
    // Maintain selection focus
  };

  const handleInsertRowBelow = () => {
    if (selectedRow === null) return;
    const newRow = Array(table.headers.length).fill('');
    const updatedRows = [...table.rows];
    updatedRows.splice(selectedRow + 1, 0, newRow);
    onUpdateTable({
      ...table,
      rows: updatedRows
    });
    setSelectedRow(selectedRow + 1);
  };

  const handleDuplicateRow = () => {
    if (selectedRow === null) return;
    const rowToDuplicate = [...table.rows[selectedRow]];
    const updatedRows = [...table.rows];
    updatedRows.splice(selectedRow + 1, 0, rowToDuplicate);
    onUpdateTable({
      ...table,
      rows: updatedRows
    });
    setSelectedRow(selectedRow + 1);
  };

  // Contextual Column Modifiers
  const handleInsertColumnLeft = () => {
    if (selectedCol === null) return;
    const newColName = `Column ${table.headers.length + 1}`;
    const updatedHeaders = [...table.headers];
    updatedHeaders.splice(selectedCol, 0, newColName);
    const updatedRows = table.rows.map(row => {
      const newRow = [...row];
      newRow.splice(selectedCol, 0, '');
      return newRow;
    });
    onUpdateTable({
      ...table,
      headers: updatedHeaders,
      rows: updatedRows
    });
  };

  const handleInsertColumnRight = () => {
    if (selectedCol === null) return;
    const newColName = `Column ${table.headers.length + 1}`;
    const updatedHeaders = [...table.headers];
    updatedHeaders.splice(selectedCol + 1, 0, newColName);
    const updatedRows = table.rows.map(row => {
      const newRow = [...row];
      newRow.splice(selectedCol + 1, 0, '');
      return newRow;
    });
    onUpdateTable({
      ...table,
      headers: updatedHeaders,
      rows: updatedRows
    });
    setSelectedCol(selectedCol + 1);
  };

  // Copy as TSV
  const handleCopy = () => {
    const success = copyToClipboardAsTSV(table);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Zoom helpers
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleZoomReset = () => setZoom(100);

  return (
    <div className="w-full flex flex-col h-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs grow">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center font-bold">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <input
              type="text"
              value={table.tableName}
              onChange={(e) => onUpdateTable({ ...table, tableName: e.target.value })}
              className="text-base font-semibold text-slate-800 dark:text-slate-100 bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-emerald-500 focus:outline-hidden py-0.5 px-1 max-w-xs md:max-w-md"
              placeholder="Table Name"
              title="Click to rename"
            />
            <p className="text-xs text-slate-400 dark:text-slate-500 ml-1">
              {table.rows.length} rows × {table.headers.length} columns
            </p>
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search data..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 w-36 sm:w-44 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Toggle Original Screenshot Pane */}
          {table.thumbnail && (
            <button
              onClick={() => setShowSourceImage(!showSourceImage)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border rounded-lg transition-colors ${
                showSourceImage 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800"
              }`}
              title="Toggle original screenshot reference"
            >
              {showSourceImage ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span>Verify Image</span>
            </button>
          )}

          {/* Copy TSV */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors"
            title="Copy as Tab-Separated Values, ready to paste into Excel or Google Sheets"
          >
            {copySuccess ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            <span className="hidden sm:inline">{copySuccess ? "Copied!" : "Copy TSV"}</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={() => exportToCSV(table)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors"
          >
            <FileCode className="h-4 w-4" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          {/* Export Excel */}
          <button
            onClick={() => exportToExcel(table)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-lg shadow-xs transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Dynamic Grid Controls (Contextual Row/Col Modification) */}
      <div className="px-4 py-2 bg-slate-100/50 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {selectedRow !== null ? (
            <div className="flex items-center gap-1.5 bg-emerald-500/10 dark:bg-emerald-500/5 px-2 py-0.5 rounded-md border border-emerald-500/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mr-1">Row {selectedRow + 1}:</span>
              <button
                onClick={handleInsertRowAbove}
                className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-sm transition-colors"
                title="Insert empty row above selected row"
              >
                <Plus className="h-3 w-3" />
                <span>Insert Above</span>
              </button>
              <button
                onClick={handleInsertRowBelow}
                className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-sm transition-colors"
                title="Insert empty row below selected row"
              >
                <Plus className="h-3 w-3" />
                <span>Insert Below</span>
              </button>
              <button
                onClick={handleDuplicateRow}
                className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-sm transition-colors"
                title="Duplicate selected row data"
              >
                <Copy className="h-3 w-3" />
                <span>Duplicate</span>
              </button>
              <button
                onClick={() => handleDeleteRow(selectedRow)}
                className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-sm transition-colors"
                title="Delete selected row"
              >
                <Trash2 className="h-3 w-3" />
                <span>Delete</span>
              </button>
              <button
                onClick={() => setSelectedRow(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5 ml-1"
                title="Clear row selection"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : selectedCol !== null ? (
            <div className="flex items-center gap-1.5 bg-indigo-500/10 dark:bg-indigo-500/5 px-2 py-0.5 rounded-md border border-indigo-500/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mr-1">Col {selectedCol + 1}:</span>
              <button
                onClick={handleInsertColumnLeft}
                className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-sm transition-colors"
                title="Insert column to the left"
              >
                <Plus className="h-3 w-3" />
                <span>Insert Left</span>
              </button>
              <button
                onClick={handleInsertColumnRight}
                className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-sm transition-colors"
                title="Insert column to the right"
              >
                <Plus className="h-3 w-3" />
                <span>Insert Right</span>
              </button>
              {table.headers.length > 1 && (
                <button
                  onClick={() => handleDeleteColumn(selectedCol)}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-sm transition-colors"
                  title="Delete selected column"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Delete</span>
                </button>
              )}
              <button
                onClick={() => setSelectedCol(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5 ml-1"
                title="Clear column selection"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddRow}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm transition-colors"
              >
                <Plus className="h-3 w-3 text-slate-500" />
                <span>Add Row</span>
              </button>
              
              <button
                onClick={handleAddColumn}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm transition-colors"
              >
                <Plus className="h-3 w-3 text-slate-500" />
                <span>Add Column</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <HelpCircle className="h-3.5 w-3.5 shrink-0" />
          <span>Double-click to edit. Select rows or headers for custom layout tools.</span>
        </div>
      </div>

      {/* Main Split Pane Layout */}
      <div className="grow flex overflow-hidden min-h-0 bg-slate-100/20 dark:bg-slate-950/40 relative">
        {/* Table Column Panel */}
        <div 
          ref={tableContainerRef}
          className="flex-1 overflow-auto min-h-0"
        >
          <table className="w-full border-collapse text-left text-sm table-auto">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900 z-10 border-b border-slate-200 dark:border-slate-800">
              <tr>
                {/* Row Index / Delete header */}
                <th className="w-12 px-3 py-2 text-center text-xs font-bold font-mono text-slate-400 dark:text-slate-500 border-r border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900">
                  #
                </th>
                
                {/* Active columns */}
                {table.headers.map((header, colIdx) => (
                  <th 
                    key={colIdx}
                    className={`px-4 py-2.5 font-sans font-medium text-slate-800 dark:text-slate-200 border-r border-b border-slate-200 dark:border-slate-800 group relative ${
                      selectedCol === colIdx ? 'bg-emerald-500/10' : ''
                    }`}
                    onClick={() => {
                      setSelectedCol(colIdx);
                      setSelectedRow(null);
                    }}
                  >
                    {editingHeader === colIdx ? (
                      <input
                        type="text"
                        value={headerValue}
                        onChange={(e) => setHeaderValue(e.target.value)}
                        onBlur={saveEditHeader}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEditHeader();
                          if (e.key === 'Escape') setEditingHeader(null);
                        }}
                        className="w-full bg-white dark:bg-slate-800 border border-emerald-500 rounded-sm px-1.5 py-0.5 text-sm focus:outline-hidden text-slate-900 dark:text-white"
                        autoFocus
                      />
                    ) : (
                      <div 
                        className="flex items-center justify-between gap-1 cursor-pointer"
                        onDoubleClick={() => startEditHeader(colIdx, header)}
                      >
                        <span className="truncate" title="Double click to edit column name">{header}</span>
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-slate-50 dark:bg-slate-900 px-1 rounded-sm border border-slate-200 dark:border-slate-800 shrink-0 shadow-xs transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditHeader(colIdx, header);
                            }}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5"
                            title="Rename column"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          {table.headers.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteColumn(colIdx);
                              }}
                              className="text-rose-400 hover:text-rose-600 p-0.5"
                              title="Delete column"
                            >
                              <Trash className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-950">
              {filteredRowsWithIndices.map(({ row, originalIndex }) => (
                <tr 
                  key={originalIndex}
                  className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors ${
                    selectedRow === originalIndex ? 'bg-emerald-500/5' : ''
                  }`}
                  onClick={() => {
                    setSelectedRow(originalIndex);
                    setSelectedCol(null);
                  }}
                >
                  {/* Index / Action column */}
                  <td className="px-3 py-2 text-center text-xs font-mono font-medium text-slate-400 dark:text-slate-500 border-r border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20 group">
                    <div className="flex items-center justify-center">
                      <span className="group-hover:hidden">{originalIndex + 1}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRow(originalIndex);
                        }}
                        className="hidden group-hover:block text-rose-500 hover:text-rose-700 p-0.5"
                        title="Delete row"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>

                  {/* Cells */}
                  {row.map((cell, colIdx) => (
                    <td
                      key={colIdx}
                      className={`px-4 py-2 border-r border-slate-100 dark:border-slate-800 min-w-[120px] max-w-[300px] overflow-hidden truncate ${
                        editingCell?.r === originalIndex && editingCell?.c === colIdx
                          ? 'p-1 bg-white dark:bg-slate-900'
                          : selectedCol === colIdx ? 'bg-emerald-500/5' : ''
                      }`}
                      onDoubleClick={() => startEditCell(originalIndex, colIdx, cell)}
                    >
                      {editingCell?.r === originalIndex && editingCell?.c === colIdx ? (
                        <input
                          type="text"
                          value={cellValue}
                          onChange={(e) => setCellValue(e.target.value)}
                          onBlur={saveEditCell}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditCell();
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          className="w-full bg-transparent border-0 focus:outline-hidden focus:ring-0 text-sm font-sans text-slate-900 dark:text-white"
                          autoFocus
                        />
                      ) : (
                        <span 
                          className="block w-full h-full cursor-pointer select-none"
                          title="Double-click to edit"
                        >
                          {cell === '' ? (
                            <span className="text-slate-300 dark:text-slate-700 italic">empty</span>
                          ) : (
                            cell
                          )}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}

              {filteredRowsWithIndices.length === 0 && (
                <tr>
                  <td 
                    colSpan={table.headers.length + 1} 
                    className="px-6 py-12 text-center text-slate-400 dark:text-slate-600 font-sans"
                  >
                    {searchQuery ? "No matching data found for your search." : "This table is empty. Click 'Add Row' to get started."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Side-by-Side Original Image Preview Section */}
        {showSourceImage && table.thumbnail && (
          <div className="w-80 lg:w-[420px] border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col min-h-0 shrink-0 select-none">
            {/* Header / Zoom Actions Panel */}
            <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-100 dark:bg-slate-800/60 shrink-0">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Eye className="h-3.5 w-3.5 text-emerald-500" />
                Original Screenshot
              </span>
              
              <div className="flex items-center gap-1.5">
                {/* Invert Filter Toggle */}
                <button
                  onClick={() => setInvertImageColors(!invertImageColors)}
                  className={`p-1 rounded-md text-xs font-semibold border ${
                    invertImageColors 
                      ? 'bg-indigo-500/10 text-indigo-600 border-indigo-200 dark:text-indigo-400' 
                      : 'text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                  title="Invert image colors (great for dark mode or low contrast files!)"
                >
                  Invert
                </button>
                
                {/* Zoom out */}
                <button
                  onClick={handleZoomOut}
                  className="p-1 rounded-md text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                
                <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 w-10 text-center">
                  {zoom}%
                </span>
                
                {/* Zoom in */}
                <button
                  onClick={handleZoomIn}
                  className="p-1 rounded-md text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  title="Zoom In"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                
                {/* Reset */}
                <button
                  onClick={handleZoomReset}
                  className="p-1 rounded-md text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  title="Reset to Actual Size (100%)"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>

                {/* Close Preview */}
                <button
                  onClick={() => setShowSourceImage(false)}
                  className="p-1 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-transparent ml-1"
                  title="Close original image preview pane"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Scrollable Image Area */}
            <div className="flex-1 overflow-auto bg-slate-200/50 dark:bg-slate-950/30 flex items-center justify-center p-4">
              {imageError ? (
                <div className="text-center p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg max-w-xs shadow-xs">
                  <EyeOff className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">Thumbnail Not Found</h4>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                    The source image for this sample dataset is not on disk, but you can upload any of your own screenshot files to view the split-screen verification tool!
                  </p>
                </div>
              ) : (
                <div 
                  className="transition-all duration-150 flex items-center justify-center"
                  style={{ 
                    width: `${zoom}%`, 
                    maxWidth: 'none', 
                    filter: invertImageColors ? 'invert(1) hue-rotate(180deg)' : 'none' 
                  }}
                >
                  <img
                    src={table.thumbnail}
                    alt="Original Document Grid Source"
                    className="shadow-lg border border-slate-300 dark:border-slate-800 rounded-md w-full h-auto object-contain select-none"
                    draggable={false}
                    onError={() => setImageError(true)}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Grid footer / summary info */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono shrink-0">
        <div>
          {table.fileName ? `Source: ${table.fileName}` : "Interactive Sandbox Grid"}
        </div>
        <div className="flex items-center gap-3">
          <span>{table.rows.length} rows</span>
          <span>•</span>
          <span>{table.headers.length} columns</span>
        </div>
      </div>
    </div>
  );
}

