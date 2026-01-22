
import React from 'react';
import { FormData, FormErrors } from '../../types';

interface Props {
    formData: FormData;
    errors: FormErrors;
    onSelectionChange: (selected: string[]) => void;
}

const SURVEY_OPTIONS = [
    { id: 'keluarga', label: 'Keluarga/Teman', icon: '👨‍👩‍👧‍👦' },
    { id: 'sosmed', label: 'Sosial Media', icon: '📱' },
    { id: 'brosur', label: 'Media Promosi Cetak', icon: '📰' },
    { id: 'alumni', label: 'Alumni Bhumi Ngasor', icon: '🎓' },
];

const SurveySection: React.FC<Props> = ({ formData, errors, onSelectionChange }) => {
    
    const handleToggle = (label: string) => {
        const current = formData.infoSource || [];
        if (current.includes(label)) {
            onSelectionChange(current.filter(item => item !== label));
        } else {
            onSelectionChange([...current, label]);
        }
    };

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
            <div className="text-center space-y-4 mb-8 sm:mb-10">
                <h3 className="text-xl sm:text-2xl font-black text-slate-800">Selamat Datang Calon Siswa! 👋</h3>
                <p className="text-sm sm:text-base text-slate-500 max-w-lg mx-auto">
                    Sebelum mengisi biodata, kami ingin tahu dari mana Anda mendapatkan informasi tentang SMP Bhumi Ngasor Ar-Ridho?
                </p>
                <p className="text-[10px] sm:text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 inline-block px-3 py-1 rounded-full">
                    Boleh pilih lebih dari satu
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SURVEY_OPTIONS.map((option) => {
                    const isSelected = formData.infoSource?.includes(option.label);
                    return (
                        <div 
                            key={option.id}
                            onClick={() => handleToggle(option.label)}
                            className={`
                                cursor-pointer group relative p-4 sm:p-6 rounded-2xl border-2 transition-all duration-300 flex items-center gap-4
                                ${isSelected 
                                    ? 'border-emerald-500 bg-emerald-50 shadow-md ring-1 ring-emerald-500' 
                                    : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm'
                                }
                            `}
                        >
                            <div className={`text-2xl sm:text-3xl transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`}>
                                {option.icon}
                            </div>
                            <div className="flex-1">
                                <h4 className={`font-bold text-sm sm:text-base ${isSelected ? 'text-emerald-900' : 'text-slate-700'}`}>
                                    {option.label}
                                </h4>
                            </div>
                            <div className={`
                                w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0
                                ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-slate-50'}
                            `}>
                                {isSelected && (
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {errors.infoSource && (
                <div className="text-center animate-pulse">
                    <p className="text-xs sm:text-sm font-bold text-red-500 bg-red-50 inline-block px-4 py-2 rounded-lg border border-red-100">
                        ⚠️ {errors.infoSource}
                    </p>
                </div>
            )}
        </div>
    );
};

export default SurveySection;
