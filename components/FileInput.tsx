import React, { useState, useEffect } from 'react';

interface FileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string | string[];
    file: File | null;
    showPreview?: boolean;
}

const FileInput: React.FC<FileInputProps> = ({ label, id, error, file, showPreview, ...props }) => {
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
    const defaultClass = 'border-slate-200 bg-white ring-primary-50';

    return (
        <div className="w-full">
            <label htmlFor={id} className="block text-sm font-bold text-slate-700 mb-2">
                {label} {props.required && <span className="text-red-500">*</span>}
            </label>
            <div className={`mt-1 flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-2xl transition-all ${file ? 'border-primary-400 bg-primary-50' : errorMsg ? 'border-red-300 bg-red-50' : 'border-slate-200 hover:border-primary-300'}`}>
                {preview ? (
                    <div className="relative mb-3">
                        <img src={preview} alt="Preview" className="w-24 h-24 rounded-xl object-cover shadow-md border-2 border-white" />
                        <div className="absolute -top-2 -right-2 bg-primary-600 text-white rounded-full p-1 shadow-sm">
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                ) : !file && (
                    <div className="mb-2 text-slate-400">
                        <svg className="mx-auto h-10 w-10" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                )}
                
                <div className="text-center">
                    <label htmlFor={id} className="cursor-pointer">
                        <span className="text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors">
                            {file ? 'Ganti File' : 'Klik untuk Unggah'}
                        </span>
                        <input id={id} type="file" className="sr-only" {...props} />
                    </label>
                    <p className="mt-1 text-xs text-slate-500 truncate max-w-[200px] mx-auto">
                        {file ? file.name : 'Format PDF/JPG (Maks 2MB)'}
                    </p>
                </div>
            </div>
            {errorMsg && <p className="mt-2 text-xs font-semibold text-red-600" id={`${id}-error`}>{errorMsg}</p>}
        </div>
    );
};

export default FileInput;