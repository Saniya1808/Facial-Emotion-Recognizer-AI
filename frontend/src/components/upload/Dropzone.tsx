import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, File, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface DropzoneProps {
  accept: string;
  allowedExtensions: string[];
  maxSizeMB?: number;
  isVideo?: boolean;
  onFileSelected: (file: File | null) => void;
  selectedFile: File | null;
  className?: string;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  accept,
  allowedExtensions,
  maxSizeMB = 25,
  isVideo = false,
  onFileSelected,
  selectedFile,
  className,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSet = (file: File) => {
    setValidationError(null);

    // Size validation
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setValidationError(`File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the maximum limit of ${maxSizeMB} MB.`);
      onFileSelected(null);
      setPreviewUrl(null);
      return;
    }

    // Extension validation
    const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (!allowedExtensions.includes(extension)) {
      setValidationError(`Unsupported file extension '${extension}'. Allowed: ${allowedExtensions.join(', ')}`);
      onFileSelected(null);
      setPreviewUrl(null);
      return;
    }

    onFileSelected(file);
    if (!isVideo && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSet(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSet(e.target.files[0]);
    }
  };

  const handleClear = () => {
    onFileSelected(null);
    setPreviewUrl(null);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
      />

      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group',
            isDragging
              ? 'border-brand-cyan bg-brand-cyan/10 scale-[1.01]'
              : 'border-white/15 hover:border-brand-cyan/50 hover:bg-white/[0.02] bg-brand-navy/30'
          )}
        >
          <div className="w-14 h-14 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center text-brand-cyan mb-3 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-7 h-7" />
          </div>

          <h4 className="text-sm font-semibold text-slate-100">
            Drag and drop your {isVideo ? 'video' : 'image'} here, or{' '}
            <span className="text-brand-cyan underline underline-offset-2">browse</span>
          </h4>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Supported formats: {allowedExtensions.join(', ').toUpperCase()} &bull; Max {maxSizeMB}MB
          </p>
          <p className="text-[11px] text-slate-400 mt-2">
            Privacy Guarantee: Uploads are verified locally and not retained permanently.
          </p>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-brand-cyan/30 bg-brand-navy/60 backdrop-blur-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Upload preview"
                className="w-14 h-14 rounded-lg object-cover border border-brand-cyan/30 flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center text-brand-cyan flex-shrink-0">
                <File className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-100 truncate">{selectedFile.name}</p>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB &bull; {selectedFile.type || 'Standard media'}
              </p>
            </div>
          </div>

          <button
            onClick={handleClear}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Remove selected file"
            aria-label="Remove selected file"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {validationError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
};
