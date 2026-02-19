"use client";
import { useState, useRef, useCallback } from "react";
import { MAX_FILE_SIZE } from "@/utils/vcfValidator";

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function FileUpload({ file, onFileSelect, error, onClear }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) onFileSelect(dropped);
    },
    [onFileSelect],
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragging(false);
  };
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) onFileSelect(selected);
    e.target.value = "";
  };

  const sizePct = file ? Math.min((file.size / MAX_FILE_SIZE) * 100, 100) : 0;

  return (
    <div className="bg-white border border-[#a9bb9d]/20 rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-[#a9bb9d]/10 border border-[#a9bb9d]/20 flex items-center justify-center text-[#5a7a52] text-sm font-bold">
          01
        </div>
        <div>
          <h3 className="text-[#0b1e40] font-semibold text-sm">
            Upload VCF File
          </h3>
          <p className="text-[#94a3b8] text-xs">Variant Call Format v4.2</p>
        </div>
      </div>

      {/* Drop zone / file info */}
      {!file ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer select-none
            transition-all duration-200
            ${dragging
              ? "border-[#a9bb9d] bg-[#a9bb9d]/10 scale-[1.01]"
              : "border-[#a9bb9d]/30 hover:border-[#a9bb9d]/50 hover:bg-[#a9bb9d]/5"
            }
          `}
        >
          <div
            className={`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-colors ${dragging ? "bg-[#a9bb9d]/20" : "bg-[#a9bb9d]/10"}`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className={`w-7 h-7 transition-colors ${dragging ? "text-[#5a7a52]" : "text-[#94a3b8]"}`}
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
              />
            </svg>
          </div>
          <p className="text-[#0b1e40] font-semibold text-sm mb-1">
            {dragging ? "Release to upload" : "Drag & drop your VCF file here"}
          </p>
          <p className="text-[#94a3b8] text-xs mb-4">
            or click to browse files
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs bg-[#a9bb9d]/10 border border-[#a9bb9d]/20 text-[#64748b] px-3 py-1 rounded-full">
              .vcf only
            </span>
            <span className="text-xs bg-[#a9bb9d]/10 border border-[#a9bb9d]/20 text-[#64748b] px-3 py-1 rounded-full">
              Max 5 MB
            </span>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".vcf"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="border border-emerald-200 bg-emerald-50/60 rounded-xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 shrink-0 bg-emerald-100 rounded-xl border border-emerald-200 flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-5 h-5 text-emerald-600"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p
                  className="text-[#0b1e40] text-sm font-semibold truncate"
                  title={file.name}
                >
                  {file.name}
                </p>
                <p className="text-[#64748b] text-xs">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>
            <button
              onClick={onClear}
              className="shrink-0 w-7 h-7 rounded-lg hover:bg-red-100 text-[#94a3b8] hover:text-red-500 transition-all flex items-center justify-center"
              title="Remove file"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-4 h-4"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div>
            <div className="flex justify-between text-[10px] text-[#94a3b8] mb-1">
              <span>File size</span>
              <span>{formatFileSize(file.size)} / 5 MB</span>
            </div>
            <div className="h-1 bg-emerald-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${sizePct}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path
                fillRule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                clipRule="evenodd"
              />
            </svg>
            VCF file validated successfully
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4 shrink-0 mt-0.5"
          >
            <path
              fillRule="evenodd"
              d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
