import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Trash2, 
  Combine, 
  Sparkles, 
  Layers, 
  ArrowRight,
  Loader2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { TableData } from '../types';
import { motion } from 'motion/react';

interface SidebarListProps {
  tables: TableData[];
  selectedTableId: string;
  onSelectTable: (id: string) => void;
  onDeleteTable: (id: string) => void;
  onMergeTables: (selectedIds: string[], mergedName: string) => void;
  onRetryTable?: (id: string) => void;
  onCancelExtraction?: (id: string) => void;
}

export default function SidebarList({
  tables,
  selectedTableId,
  onSelectTable,
  onDeleteTable,
  onMergeTables,
  onRetryTable,
  onCancelExtraction
}: SidebarListProps) {
  const [selectedForMerge, setSelectedForMerge] = useState<Record<string, boolean>>({});
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [mergedName, setMergedName] = useState('Master Consolidated Sheet');

  const completedTables = tables.filter(t => t.status === 'completed');
  const allCompletedIds = completedTables.map(t => t.id);
  const isAllSelected = allCompletedIds.length > 0 && allCompletedIds.every(id => !!selectedForMerge[id]);

  const handleToggleMergeSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid selecting the sheet for viewing
    setSelectedForMerge(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const selectedCount = Object.keys(selectedForMerge).filter(id => selectedForMerge[id]).length;

  const handleMergeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const idsToMerge = Object.keys(selectedForMerge).filter(id => selectedForMerge[id]);
    if (idsToMerge.length < 2) return;
    
    onMergeTables(idsToMerge, mergedName);
    setIsMergeModalOpen(false);
    
    // Clear selection
    setSelectedForMerge({});
  };

  // Group tables by source (Sample vs User Uploads vs Merged)
  const samples = tables.filter(t => t.id.startsWith('sample_'));
  const uploads = tables.filter(t => !t.id.startsWith('sample_') && !t.id.startsWith('merged_'));
  const merged = tables.filter(t => t.id.startsWith('merged_'));

  const renderTableItem = (table: TableData) => {
    const isSelected = selectedTableId === table.id;
    const isChecked = !!selectedForMerge[table.id];

    return (
      <motion.div
        key={table.id}
        whileHover={{ x: 2 }}
        className={`group p-3 rounded-xl border mb-2 cursor-pointer transition-all flex items-center justify-between gap-3 ${
          isSelected
            ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/10 shadow-xs"
            : "border-slate-100 dark:border-slate-900 hover:border-slate-200 dark:hover:border-slate-800 bg-white dark:bg-slate-950"
        }`}
        onClick={() => {
          onSelectTable(table.id);
        }}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Checkbox for merge */}
          {table.status === 'completed' && (
            <input
              type="checkbox"
              checked={isChecked}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                setSelectedForMerge(prev => ({
                  ...prev,
                  [table.id]: e.target.checked
                }));
              }}
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 rounded-sm shrink-0 cursor-pointer"
              title="Select for consolidation/merge"
            />
          )}

          {/* Status Icon */}
          <div className="shrink-0">
            {table.status === 'processing' ? (
              <Loader2 className="h-5 w-5 text-emerald-500 animate-spin" />
            ) : table.status === 'failed' ? (
              <XCircle className="h-5 w-5 text-rose-500" />
            ) : table.id.startsWith('merged_') ? (
              <Combine className="h-5 w-5 text-purple-500" />
            ) : (
              <FileSpreadsheet className={`h-5 w-5 ${table.id.startsWith('sample_') ? 'text-slate-400' : 'text-emerald-500'}`} />
            )}
          </div>

          {/* Table Details */}
          <div className="overflow-hidden">
            <h4 className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
              {table.tableName}
            </h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
              {table.status === 'processing' ? (
                "AI OCR working..."
              ) : table.status === 'failed' ? (
                "Failed to extract"
              ) : (
                `${table.rows.length} rows • ${table.headers.length} cols`
              )}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {table.status === 'processing' && onCancelExtraction && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCancelExtraction(table.id);
              }}
              className="text-rose-500 hover:text-rose-600 dark:text-rose-450 dark:hover:text-rose-400 p-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all shrink-0"
              title="Stop Extraction"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
          {table.status === 'failed' && onRetryTable && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRetryTable(table.id);
              }}
              className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-500 dark:hover:text-emerald-400 p-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all shrink-0"
              title="Retry Extraction"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
          {table.status !== 'processing' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteTable(table.id);
              }}
              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-all shrink-0"
              title="Delete table"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="w-full flex flex-col h-full">
      {/* List Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <Layers className="h-4.5 w-4.5 text-slate-500 dark:text-slate-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Sheets & Documents
          </h3>
        </div>

        {selectedCount >= 2 && (
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={() => setIsMergeModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-purple-600 hover:text-white bg-purple-50 dark:bg-purple-950/20 hover:bg-purple-600 dark:hover:bg-purple-600 border border-purple-200 dark:border-purple-900 rounded-lg transition-colors shadow-xs shrink-0"
          >
            <Combine className="h-3.5 w-3.5" />
            <span>Consolidate ({selectedCount})</span>
          </motion.button>
        )}
      </div>

      {/* Select All Toggle for Consolidation */}
      {completedTables.length > 0 && (
        <div className="flex items-center justify-between px-2.5 py-2 mb-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={(e) => {
                const checked = e.target.checked;
                const newSelection: Record<string, boolean> = {};
                if (checked) {
                  allCompletedIds.forEach(id => {
                    newSelection[id] = true;
                  });
                }
                setSelectedForMerge(newSelection);
              }}
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 rounded-sm shrink-0 cursor-pointer"
            />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {isAllSelected ? "Deselect All" : "Select All for Consolidation"}
            </span>
          </label>
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
            {selectedCount} / {completedTables.length} selected
          </span>
        </div>
      )}

      {/* Table categories list */}
      <div className="grow overflow-y-auto pr-1">
        {/* User Uploads */}
        {uploads.length > 0 && (
          <div className="mb-5">
            <h5 className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2 ml-1">
              Your Extracted Tables ({uploads.length})
            </h5>
            {uploads.map(renderTableItem)}
          </div>
        )}

        {/* Merged Sheets */}
        {merged.length > 0 && (
          <div className="mb-5">
            <h5 className="text-xs font-semibold text-purple-400 dark:text-purple-500 mb-2 ml-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Consolidated Sheets ({merged.length})
            </h5>
            {merged.map(renderTableItem)}
          </div>
        )}

        {/* Sample Templates */}
        {samples.length > 0 && (
          <div>
            <h5 className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2 ml-1">
              Sample Datasets ({samples.length})
            </h5>
            {samples.map(renderTableItem)}
          </div>
        )}

        {tables.length === 0 && (
          <div className="text-center py-8 text-slate-400 dark:text-slate-600 text-sm">
            No tables loaded. Upload an image to start!
          </div>
        )}
      </div>

      {/* Guide Card */}
      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/60 flex items-start gap-2.5">
        <HelpCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          <p className="font-medium text-slate-700 dark:text-slate-300 mb-0.5">Multi-Image Merge</p>
          Take screenshot sections of a long grid report, upload them, check their boxes here, and consolidate them into a single file instantly.
        </div>
      </div>

      {/* Merge Modal Dialog */}
      {isMergeModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
              <Combine className="h-5 w-5 text-purple-500" />
              Consolidate Selected Tables
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              We will merge the row entries of the {selectedCount} selected sheets. Column headers with the same names will be aligned automatically.
            </p>

            <form onSubmit={handleMergeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">
                  Consolidated Table Name
                </label>
                <input
                  type="text"
                  required
                  value={mergedName}
                  onChange={(e) => setMergedName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g. Q4 Master Ledger"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMergeModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors shadow-sm"
                >
                  Merge Sheets
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
