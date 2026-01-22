
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string | string[];
}

const Input: React.FC<InputProps> = ({ label, id, error, ...props }) => {
    const errorMsg = Array.isArray(error) ? error[0] : error;
    const errorClass = 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50';
    const defaultClass = 'border-slate-200 focus:ring-primary-500 focus:border-primary-500 bg-white';
    
    return (
        <div className="w-full">
            <label htmlFor={id} className="block text-sm font-bold text-slate-700 mb-2">
                {label} {props.required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                <input
                    id={id}
                    {...props}
                    // text-base pada mobile mencegah zoom otomatis di iOS, sm:text-sm mengembalikan ke ukuran kecil di desktop
                    className={`block w-full px-4 py-3 border rounded-xl shadow-sm placeholder-slate-400 focus:outline-none text-base sm:text-sm transition-all ${errorMsg ? errorClass : defaultClass}`}
                    aria-invalid={!!errorMsg}
                    aria-describedby={errorMsg ? `${id}-error` : undefined}
                />
            </div>
            {errorMsg && <p className="mt-2 text-xs font-semibold text-red-600" id={`${id}-error`}>{errorMsg}</p>}
        </div>
    );
};

export default Input;
