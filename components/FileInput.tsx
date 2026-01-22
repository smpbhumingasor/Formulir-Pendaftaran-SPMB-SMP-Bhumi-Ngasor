
import React, { useState, useEffect } from 'react';

interface FileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string | string[];
    file: File | null;
    showPreview?: boolean;
    onClear?: () => void;
}

const FileInput: React.FC<FileInputProps> = ({ label, id, error, file, showPreview, onClear, ...props }) => {
    const [preview, setPreview] = useState<string | null>(null);
    const errorMsg = Array.isArray(error) ? error[0] : error;

    useEffect(() => {
        if (file && showPreview && file.type.startsWith('image/')) {
            const objectUrl = URL.createObjectURL(file);
            setPreview(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        }
        setPreview(null);
    }, [file, showPreview]);
    
    const errorClass = 'border-red-500 bg-red-50 ring-red-100';

    const isPdf = file?.type === 'application/pdf';

    return (
        <div className="w-full">
            <label htmlFor={id} className="block text-sm font-bold text-slate-700 mb-2">
                {label} {props.required && <span className="text-red-500">*</span>}
            </label>
            <div className={`mt-1 relative flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-2xl transition-all ${file ? 'border-primary-400 bg-primary-50' : errorMsg ? 'border-red-300 bg-red-50' : 'border-slate-200 hover:border-primary-300'}`}>
                
                {/* Remove Button */}
                {file && onClear && (
                    <button 
                        type="button" 
                        onClick={(e) => { e.preventDefault(); onClear(); }}
                        className="absolute top-2 right-2 p-1 bg-white text-red-500 rounded-full shadow-sm hover:bg-red-50 border border-slate-200 z-10 transition-colors"
                        title="Hapus File"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                )}

                {preview ? (
                    <div className="relative mb-3">
                        <img src={preview} alt="Preview" className="w-24 h-24 rounded-xl object-cover shadow-md border-2 border-white" />
                        <div className="absolute -top-2 -right-2 bg-primary-600 text-white rounded-full p-1 shadow-sm">
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                ) : isPdf ? (
                    <div className="relative mb-3 flex flex-col items-center">
                        <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center mb-2 shadow-sm">
                             <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        </div>
                    </div>
                ) : !file && (
                    <div className="mb-2 text-slate-400">
                        <svg className="mx-auto h-10 w-10" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                )}
                
                {file && !preview && (
                    <div className="mb-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 max-w-full">
                        {!isPdf && <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                        <div className="text-left overflow-hidden">
                            <p className="text-xs font-bold text-slate-700 truncate">{file.name}</p>
                            <p className="text-[10px] text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                    </div>
                )}
                
                <div className="text-center">
                    <label htmlFor={id} className="cursor-pointer">
                        {!file && <span className="text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors">
                             Klik untuk Unggah
                        </span>}
                        <input id={id} type="file" className="sr-only" {...props} />
                    </label>
                    {!file && <p className="mt-1 text-xs text-slate-500 truncate max-w-[200px] mx-auto">
                        Format PDF/JPG (Maks 2MB)
                    </p>}
                </div>
            </div>
            {errorMsg && <p className="mt-2 text-xs font-semibold text-red-600" id={`${id}-error`}>{errorMsg}</p>}
        </div>
    );
};

export default FileInput;
