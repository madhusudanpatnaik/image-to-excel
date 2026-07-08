import React, { useState } from 'react';
import { TableData } from './types';
import { SAMPLE_TABLES } from './data';
import { fileToBase64, formatBytes, mergeTables } from './utils';
import ImageDropzone from './components/ImageDropzone';
import TableGrid from './components/TableGrid';
import SidebarList from './components/SidebarList';
import { 
  FileSpreadsheet, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  HelpCircle,
  X,
  PlusCircle,
  Combine,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [tables, setTables] = useState<TableData[]>(() => {
    // Start with the polished sample tables so the application has data immediately
    return [...SAMPLE_TABLES];
  });
  const [selectedTableId, setSelectedTableId] = useState<string>('sample_1');
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0); // Default open the first one!

  // Handle uploading and processing files via Express backend
  const handleImagesSelected = async (files: File[]) => {
    setGlobalError(null);

    // Create a processing placeholder for each file
    const newPlaceholders = files.map(file => {
      const id = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      return {
        id,
        tableName: file.name.split('.')[0] || "Importing Sheet...",
        headers: ['Column 1', 'Column 2'],
        rows: [['', '']],
        fileName: file.name,
        fileSize: formatBytes(file.size),
        status: 'processing' as const
      };
    });

    // Add placeholders to state and auto-select the first one
    setTables(prev => [...newPlaceholders, ...prev]);
    setSelectedTableId(newPlaceholders[0].id);

    // Process each file sequentially or in parallel
    for (const placeholder of newPlaceholders) {
      const file = files[newPlaceholders.indexOf(placeholder)];
      try {
        // Convert to base64
        const base64Image = await fileToBase64(file);
        const thumbUrl = `data:${file.type};base64,${base64Image}`;
        
        // Progressively set the thumbnail so it's visible in loading states
        setTables(prev => prev.map(item => {
          if (item.id === placeholder.id) {
            return {
              ...item,
              thumbnail: thumbUrl
            };
          }
          return item;
        }));
        
        // Call Express Server Endpoint
        const response = await fetch('/api/extract', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: base64Image,
            mimeType: file.type
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || `HTTP ${response.status} Error`);
        }

        const data = await response.json();

        // Update placeholder with parsed data
        setTables(prev => prev.map(item => {
          if (item.id === placeholder.id) {
            return {
              ...item,
              tableName: (item.tableName && item.tableName !== "Importing Sheet...") ? item.tableName : (data.tableName || item.tableName),
              headers: data.headers && data.headers.length > 0 ? data.headers : ['A', 'B'],
              rows: data.rows && data.rows.length > 0 ? data.rows : [['', '']],
              status: 'completed' as const
            };
          }
          return item;
        }));

      } catch (err: any) {
        console.error("Error processing image:", err);
        const errorMsg = err.message || "Failed to extract table data. Ensure the image is clear and contains a visible grid.";
        
        setTables(prev => prev.map(item => {
          if (item.id === placeholder.id) {
            return {
              ...item,
              status: 'failed' as const,
              error: errorMsg
            };
          }
          return item;
        }));

        setGlobalError(`Failed to process "${file.name}": ${errorMsg}`);
      }
    }
  };

  // Update a single table's configuration (edit headers, rows, name, etc.)
  const handleUpdateTable = (updatedTable: TableData) => {
    setTables(prev => prev.map(item => {
      if (item.id === updatedTable.id) {
        return updatedTable;
      }
      return item;
    }));
  };

  // Delete a table
  const handleDeleteTable = (id: string) => {
    setTables(prev => prev.filter(item => item.id !== id));
    
    // If the active table was deleted, select another one if available
    if (selectedTableId === id) {
      const remaining = tables.filter(item => item.id !== id);
      if (remaining.length > 0) {
        // Find the first completed one
        const firstCompleted = remaining.find(item => item.status === 'completed');
        setSelectedTableId(firstCompleted ? firstCompleted.id : remaining[0].id);
      } else {
        setSelectedTableId('');
      }
    }
  };

  // Merge selected sheets
  const handleMergeTables = (selectedIds: string[], mergedName: string) => {
    try {
      const selectedTables = tables.filter(t => selectedIds.includes(t.id));
      const mergedTable = mergeTables(selectedTables, mergedName);
      
      setTables(prev => [mergedTable, ...prev]);
      setSelectedTableId(mergedTable.id);
    } catch (err: any) {
      setGlobalError(`Merging Error: ${err.message || 'Could not consolidate sheets'}`);
    }
  };

  // Find the currently active table
  const activeTable = tables.find(t => t.id === selectedTableId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200 antialiased">
      {/* Sleek App Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-emerald-600 dark:bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-md shadow-emerald-500/10">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Image to Excel Converter
              </span>
              <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 rounded-sm">
                GEMINI 3.5 AI
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="hidden md:flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Sparkles className="h-4 w-4 text-emerald-500 animate-pulse" />
              <span>Full-Stack OCR OCR Engine Active</span>
            </div>
            <a
              href="https://ai.studio/build"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium transition-colors"
            >
              Powered by Google AI Studio
            </a>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Banner Explainer */}
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xs">
          <h1 className="text-xl md:text-2xl font-bold mb-1.5 flex items-center gap-2">
            Convert Data Screenshots to Excel Spreadsheets
          </h1>
          <p className="text-sm text-emerald-50/90 max-w-3xl leading-relaxed">
            Drag in screenshots of lists, server logs, catalogs, financial reports, or grids. 
            Our multimodal Gemini OCR system extracts everything into interactive grids. Edit headers, 
            add records, consolidate multiple parts, and export perfectly styled `.xlsx` or `.csv` sheets instantly.
          </p>
        </div>

        {/* Global Error Banner */}
        {globalError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-sm flex items-start justify-between gap-3"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
              <div>
                <p className="font-semibold">Operation Alert</p>
                <p>{globalError}</p>
              </div>
            </div>
            <button
              onClick={() => setGlobalError(null)}
              className="p-1 rounded-md hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {/* Main Work Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left panel (Upload & File Manager) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Upload Box */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Upload New Image
              </h3>
              <ImageDropzone onImagesSelected={handleImagesSelected} />
            </div>

            {/* Sidebar Manager */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs grow min-h-[300px]">
              <SidebarList
                tables={tables}
                selectedTableId={selectedTableId}
                onSelectTable={(id) => {
                  setGlobalError(null);
                  setSelectedTableId(id);
                }}
                onDeleteTable={handleDeleteTable}
                onMergeTables={handleMergeTables}
              />
            </div>
          </div>

          {/* Right panel (Interactive Data Grid View) */}
          <div className="lg:col-span-8 flex flex-col h-full min-h-[500px]">
            <AnimatePresence mode="wait">
              {activeTable ? (
                <motion.div
                  key={activeTable.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.15 }}
                  className="h-full flex flex-col"
                >
                  {activeTable.status === 'processing' ? (
                    /* High craftsmanship Loading Screen */
                    <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs text-center min-h-[500px]">
                      <div className="relative mb-6">
                        <div className="h-16 w-16 border-4 border-emerald-100 dark:border-emerald-950 rounded-full animate-pulse" />
                        <Loader2 className="absolute top-0 left-0 h-16 w-16 text-emerald-600 dark:text-emerald-500 animate-spin border-4 border-transparent border-t-emerald-600 dark:border-t-emerald-500 rounded-full" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                        Analyzing Screenshot with Multimodal Gemini
                      </h3>
                      <div className="space-y-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                        <p className="animate-pulse">Reading grid layout & table dividers...</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-2">
                          File: {activeTable.fileName} ({activeTable.fileSize})
                        </p>
                      </div>
                    </div>
                  ) : activeTable.status === 'failed' ? (
                    /* Error state for a particular table */
                    <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs text-center min-h-[500px]">
                      <div className="h-14 w-14 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-full flex items-center justify-center mb-4 border border-rose-100 dark:border-rose-900/50">
                        <AlertCircle className="h-7 w-7" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                        Extraction Failed
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
                        {activeTable.error || "Gemini was unable to structures table data from this screenshot. Please ensure it contains readable text organized in rows and columns."}
                      </p>
                      <button
                        onClick={() => handleDeleteTable(activeTable.id)}
                        className="px-4 py-2 text-sm font-semibold text-rose-600 hover:text-white border border-rose-200 dark:border-rose-900 hover:bg-rose-600 rounded-lg transition-colors"
                      >
                        Remove Failed Sheet
                      </button>
                    </div>
                  ) : (
                    /* Main Table Grid Workspace */
                    <TableGrid
                      table={activeTable}
                      onUpdateTable={handleUpdateTable}
                    />
                  )}
                </motion.div>
              ) : (
                /* Pure Greeting Empty State */
                <motion.div
                  key="empty-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs text-center min-h-[500px]"
                >
                  <div className="h-16 w-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 mb-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <FileSpreadsheet className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                    No Table Sheet Selected
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
                    Select one of our high-fidelity sample tables in the sidebar to try out editing and Excel export, or upload your own screenshots to begin.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* AI Enterprise Scaling & Consolidation FAQ / Consultation Section */}
        <div className="mt-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-xs">
          <div className="flex items-center gap-2.5 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
            <BookOpen className="h-5.5 w-5.5 text-emerald-600 animate-pulse" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Enterprise Scale & Table Consolidation Hub
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Technical guidance, pipeline blueprints, and scale insights for processing thousands of document screenshots.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Accordion Item 1 */}
            <div className="border border-slate-100 dark:border-slate-850 rounded-xl overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => setExpandedFaq(expandedFaq === 0 ? null : 0)}
                className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left font-semibold text-sm text-slate-800 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors focus:outline-hidden"
              >
                <span className="flex items-center gap-2.5">
                  <Combine className="h-4 w-4 text-purple-500 shrink-0" />
                  <span>How do I merge/consolidate multiple tables into a single master sheet?</span>
                </span>
                {expandedFaq === 0 ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
              </button>
              
              <AnimatePresence initial={false}>
                {expandedFaq === 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden bg-white dark:bg-slate-950/20"
                  >
                    <div className="p-5 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-850 leading-relaxed space-y-2.5">
                      <p>
                        Our interface includes a powerful schema-aware **Table Consolidation Engine**. You can stitch together sections of a single continuous long grid report that was split across several screenshot uploads:
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-xs">
                        <li>**Step 1:** Select the checkbox next to each complete sheet in the sidebar list (you must select at least two).</li>
                        <li>**Step 2:** Click the purple **"Consolidate (N)"** button that dynamically appears on the sidebar header.</li>
                        <li>**Step 3:** Enter a custom name for the consolidated output sheet (e.g., *"Q4 Master Ledger"*) and click **"Merge Sheets"**.</li>
                      </ul>
                      <p className="text-xs text-slate-500">
                        **Behind the scenes:** The merge engine maps all unique header names across every selected sheet, vertically concatenates the records, and automatically aligns cell values to matching headers while populating missing values with empty fields.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Accordion Item 2 */}
            <div className="border border-slate-100 dark:border-slate-850 rounded-xl overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => setExpandedFaq(expandedFaq === 1 ? null : 1)}
                className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left font-semibold text-sm text-slate-800 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors focus:outline-hidden"
              >
                <span className="flex items-center gap-2.5">
                  <Cpu className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Can we extract 250 screenshots at once and merge them into a single Excel file?</span>
                </span>
                {expandedFaq === 1 ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
              </button>
              
              <AnimatePresence initial={false}>
                {expandedFaq === 1 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden bg-white dark:bg-slate-950/20"
                  >
                    <div className="p-5 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-850 leading-relaxed space-y-3">
                      <p>
                        **Yes, absolutely!** However, attempting to process 250 images in a single monolithic API call or a single browser request is technically impossible and highly discouraged due to fundamental platform constraints:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-2 text-xs">
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Payload & Timeout Limits</span>
                          250 high-res screenshots sum to roughly **250MB–500MB**. Uploading this in one HTTP request would exceed web server body limits (often 50MB) and hit browser connection timeouts.
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Model Output Token Cap</span>
                          While Gemini can swallow millions of tokens, model *output* generation is capped (usually 8,192 tokens). Serializing thousands of rows of data into a single text output exceeds this cap.
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">API Rate Throttling</span>
                          Public LLM endpoints enforce Requests Per Minute (RPM) limits. Sending 250 simultaneous requests in parallel would trigger HTTP 429 Rate Limit errors immediately.
                        </div>
                      </div>
                      <p className="text-xs">
                        **How this Web App handles it:** To make multiple uploads reliable, our front-end already implements a **Sequential Queueing Mechanism**. When you select or drop multiple images, the system places placeholders in the sidebar and processes them orderly, one after another. This keeps browser memory stable, prevents rate-limit penalties, and lets you monitor progress in real-time before downloading!
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Accordion Item 3 */}
            <div className="border border-slate-100 dark:border-slate-850 rounded-xl overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => setExpandedFaq(expandedFaq === 2 ? null : 2)}
                className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left font-semibold text-sm text-slate-800 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors focus:outline-hidden"
              >
                <span className="flex items-center gap-2.5">
                  <Sparkles className="h-4 w-4 text-purple-500 shrink-0" />
                  <span>What is the recommended blueprint for large-scale enterprise automation?</span>
                </span>
                {expandedFaq === 2 ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
              </button>
              
              <AnimatePresence initial={false}>
                {expandedFaq === 2 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden bg-white dark:bg-slate-950/20"
                  >
                    <div className="p-5 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-850 leading-relaxed space-y-3">
                      <p>
                        For corporate environments that frequently ingest high volumes (e.g., 250 to 5,000 document screenshots daily), the gold standard is an **Asynchronous Batch Processing Pipeline**:
                      </p>
                      <div className="space-y-3 text-xs">
                        <div className="flex items-start gap-3">
                          <div className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</div>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">Asynchronous Ingestion Bucket:</span>
                            Images are uploaded to an object storage bucket (e.g. Google Cloud Storage). This fires a notification to initiate the process without making the user wait on an HTTP request.
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</div>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">Background Workers (Cloud Run Jobs / Celery):</span>
                            A decoupled job consumer processes the files. It handles rate-limits, implements exponential backoffs (on HTTP 429), and queries Gemini in structured JSON format to enforce precise data types.
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</div>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">Relational Database or Document Landing Store:</span>
                            Parsed row records are stored table-by-table or row-by-row in databases like Firestore or Cloud SQL (PostgreSQL), allowing partial results to be queried, edited, or checked in real-time.
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">4</div>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">Scheduled Consolidation & Binary Generator:</span>
                            A final aggregation task selects all processed records, merges their columns aligning identical names, and builds a massive workbook binary using `xlsx` (SheetJS) on the server, sending an email or webhook with a download link when complete.
                          </div>
                        </div>
                      </div>
                      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-xs text-purple-700 dark:text-purple-300 mt-2">
                        **Enterprise Benefit:** This asynchronous pattern isolates slow tasks, handles transient API failures gracefully, provides status polling endpoints, and delivers a robust, hands-free automation workspace.
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {/* Aesthetic Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 mt-12 border-t border-slate-200 dark:border-slate-800 text-center">
        <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
          © {new Date().getFullYear()} Image to Excel Converter • Client-Side SheetJS Excel Engine • Gemini Multimodal Vision Pro OCR
        </p>
      </footer>
    </div>
  );
}
