import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    error?: string | string[];
    children: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({ label, id, error, children, ...props }) => {
    const errorMsg = Array.isArray(error) ? error[0] : error;
    const errorClass = 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50';
    const defaultClass = 'border-slate-200 focus:ring-primary-500 focus:border-primary-500 bg-white';

    return (
        <div className="w-full">
            <label htmlFor={id} className="block text-sm font-bold text-slate-700 mb-2">
                {label} {props.required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                <select
                    id={id}
                    {...props}
                    className={`block w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none sm:text-sm transition-all appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_1rem_center] bg-no-repeat ${errorMsg ? errorClass : defaultClass}`}
                    aria-invalid={!!errorMsg}
                >
                    {children}
                </select>
            </div>
            {errorMsg && <p className="mt-2 text-xs font-semibold text-red-600">{errorMsg}</p>}
        </div>
    );
};

export default Select;