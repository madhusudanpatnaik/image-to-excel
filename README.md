# Image to Excel Converter 📊✨

A high-fidelity, production-grade full-stack web application designed to convert screenshots of data tables, grids, list logs, catalogs, and financial reports into fully structured, editable, and downloadable Excel spreadsheets.

Powered by **React 18**, **Tailwind CSS**, and **Express**, the application leverages the multimodal vision capabilities of the **Gemini 3.5 Flash** model via the official `@google/genai` SDK to perform robust, structure-aware OCR and data schema extraction.

---

## 🎨 Interactive Preview & Core Architecture

The workspace contains a comprehensive full-stack setup:
- **Client (Single Page App)**: React + Tailwind CSS with fluid layout transitions using `motion`. Includes an interactive spreadsheet grid sandbox and real-time visual alignment tools.
- **Server (Secure Proxy)**: An Express backend that acts as a secure intermediary for Gemini API calls, keeping your credentials invisible to browser inspection.

---

## 🚀 Key Features

### 1. Advanced Multimodal Vision OCR
- **Screenshot Drag-and-Drop**: Supports instant uploading of PNG, JPEG, and WEBP image files up to 15MB.
- **Smart Schema Inference**: Gemini detects table columns, rows, cell data types, alignment, empty cells, and invents appropriate column headers if they are missing or unclear in the image.

### 2. Dual-Pane Side-by-Side Visual Verification
- **Compare Table against Image**: Inspect the parsed data table directly next to the original screenshot file to catch and correct OCR anomalies.
- **Interactive Zoom & Reset**: Easily pan, zoom in (up to 300%), or zoom out of complex screenshots to verify tiny cell text.
- **Color Inversion Filter**: Toggle a dynamic image color inversion filter, optimizing dark-themed screenshots or low-contrast scans for comfortable reading.

### 3. Comprehensive Excel-Like Interactive Grid
- **In-Place Cell Editing**: Double-click any cell or header to instantly correct, rename, or update text values.
- **Contextual Row & Column Modifiers**:
  - Insert rows above or below active cells.
  - Duplicate entire rows.
  - Insert columns left or right.
  - Remove empty or redundant rows/columns instantly.
- **Data Filtering**: Quick in-memory search across all cell values to narrow down records.

### 4. Multi-Image Sheet Consolidation (Merge Tool)
- **Batch Processing**: Upload separate screenshots of continuous long reports.
- **Column Aligning Consolidation**: Select two or more active tables, and merge them with one click. The merger automatically aligns shared columns and maintains standard tabular structure, saving hours of manual consolidation.

### 5. Multi-Format High-Fidelity Exports
- **Direct Excel Download (.xlsx)**: Utilizes `SheetJS` (`xlsx`) to download actual multi-column binary Excel workbooks client-side.
- **Direct CSV Download**: Export standard UTF-8 encoded files safely handling special character escaping, commas, quotes, and carriage returns.
- **Direct TSV Clipboard Copy**: One-click "Copy TSV" copies data formatted as Tab-Separated Values, ready to be immediately pasted into Microsoft Excel or Google Sheets.

---

## 📂 Project Structure

```text
├── package.json          # Production scripts, Express dependencies, Vite & SheetJS configuration
├── server.ts             # Secure Express API entry point, Vite development middleware, & Gemini SDK integration
├── .env.example          # Environment variable template for secrets
├── metadata.json         # Platform metadata and iframe frame permission configurations
├── src/
│   ├── App.tsx           # Main application shell, state management, file handlers
│   ├── main.tsx          # React application mounting point
│   ├── types.ts          # Strongly typed models (TableData, CellSelection)
│   ├── utils.ts          # Core spreadsheet engines (SheetJS exporters, merge/consolidation math, converters)
│   ├── data.ts           # Rich sample mock datasets with auto-generated verification screenshots
│   ├── index.css         # Global tailwind configurations and display fonts (Inter, JetBrains Mono)
│   └── components/
│       ├── ImageDropzone.tsx  # Drag-and-drop file uploader with type/size validation limits
│       ├── SidebarList.tsx    # List panel of sheets with batch merge controls and guide cards
│       └── TableGrid.tsx      # Dual-pane comparison workspace and interactive spreadsheet sandbox
```

---

## 🛠️ Installation & Local Development

### 1. Requirements
Ensure you have **Node.js 18+** installed on your system.

### 2. Environment Variables
To use the live Gemini OCR extractor, configure your Gemini API Key.
1. Create a `.env` file in the project root:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```
2. For local testing, ensure the key is placed in your environment variables. In the Google AI Studio builder interface, add `GEMINI_API_KEY` to the **Secrets panel** within Settings.

### 3. Install Dependencies
Run the following command at the root directory:
```bash
npm install
```

### 4. Boot Dev Server
Start the development server (runs full-stack Express with on-demand Vite hot bundling):
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 📦 Production Builds & Deployment

The build pipeline compiles the front-end SPA and bundles the backend Express router into a single self-contained executable format:

### Build command
```bash
npm run build
```
This command performs two steps:
1. Builds the static client-side single-page app via `vite build` to the `/dist` directory.
2. Bundles the Express TypeScript backend via `esbuild` into `/dist/server.cjs` targeting Node.js, compiling out relative ES module imports.

### Start Production Server
```bash
npm run start
```
Binds the production bundle to port `3000` at host `0.0.0.0`, fully optimized for container architectures like **Cloud Run**.

---

## 🔒 Security Principles

- **Zero Client-Side Keys**: The browser never makes direct network calls to Google's API servers. All prompt engineering and SDK clients remain isolated behind Express API routers.
- **Large Payload Support**: Express middleware limits are pre-configured to `50mb` to support high-resolution multi-megabyte document photography payloads safely.
