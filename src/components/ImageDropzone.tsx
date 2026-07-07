import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface ImageDropzoneProps {
  onImagesSelected: (files: File[]) => void;
}

export default function ImageDropzone({ onImagesSelected }: ImageDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processFiles = (files: FileList | null) => {
    if (!files) return;
    const selectedFiles: File[] = [];
    setError(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        setError('Only image files (PNG, JPEG, WEBP) are supported.');
        continue;
      }
      if (file.size > 15 * 1024 * 1024) {
        setError('Images must be smaller than 15 MB.');
        continue;
      }
      selectedFiles.push(file);
    }

    if (selectedFiles.length > 0) {
      onImagesSelected(selectedFiles);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    processFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    processFiles(e.target.files);
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <motion.div
        id="dropzone-container"
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`w-full border-2 border-dashed rounded-xl p-8 transition-colors cursor-pointer flex flex-col items-center justify-center text-center relative ${
          isDragActive
            ? "border-emerald-500 bg-emerald-500/5"
            : "border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept="image/*"
          onChange={handleChange}
        />
        
        <div className={`p-4 rounded-full mb-4 ${
          isDragActive ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
        }`}>
          <Upload className="h-8 w-8" />
        </div>

        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">
          {isDragActive ? "Drop your images here" : "Upload data screenshots"}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4">
          Drag and drop images, or <span className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">browse files</span>. PNG, JPEG, and WEBP supported.
        </p>

        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <ImageIcon className="h-4.5 w-4.5" />
          <span>Multimodal AI OCR (Max 15MB per file)</span>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-sm border border-rose-100 dark:border-rose-950/50"
        >
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </motion.div>
      )}
    </div>
  );
}
