
import React from 'react';
import { FormData, FormErrors } from '../../types';

interface Props {
    formData: FormData;
    errors: FormErrors;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onEditStep: (step: number) => void;
}

const ReviewSection: React.FC<Props> = ({ formData, errors, handleChange, onEditStep }) => {
    const DataRow = ({ label, value }: { label: string, value: string }) => (
        <div className="flex flex-col sm:flex-row sm:justify-between py-3 border-b border-slate-50 last:border-0 gap-1 sm:gap-0">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
            <span className="text-sm font-semibold text-slate-800 break-words">{value}</span>
        </div>
    );

    const SectionHeader = ({ title, step }: { title: string, step: number }) => (
        <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest">{title}</h4>
            <button 
                type="button" 
                onClick={() => onEditStep(step)} 
                className="text-[10px] font-bold text-emerald-500 hover:text-emerald-700 uppercase bg-emerald-50 px-2 py-1 rounded-lg transition-colors"
            >
                Ubah
            </button>
        </div>
    );

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="border-l-4 border-emerald-500 pl-4 py-1">
                <h3 className="text-lg sm:text-xl font-bold text-slate-800">Pratinjau & Konfirmasi</h3>
                <p className="text-sm text-slate-500">Periksa kembali data Anda sebelum menekan tombol kirim.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Kolom Kiri: Ringkasan Data */}
                <div className="space-y-4 sm:space-y-6">
                    <div className="bg-slate-50 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-100">
                        <SectionHeader title="Sumber Informasi" step={1} />
                        <div className="flex flex-wrap gap-2">
                            {formData.infoSource && formData.infoSource.map((src, i) => (
                                <span key={i} className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] sm:text-xs font-bold rounded-full">
                                    {src}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-100">
                        <SectionHeader title="Biodata Siswa" step={2} />
                        <DataRow label="Nama Lengkap" value={formData.fullName} />
                        <DataRow label="NISN" value={formData.nisn} />
                        <DataRow label="TTL" value={`${formData.birthPlace}, ${formData.birthDate}`} />
                        <DataRow label="Asal Sekolah" value={formData.previousSchool} />
                    </div>

                    <div className="bg-slate-50 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-100">
                        <SectionHeader title="Orang Tua & Kontak" step={3} />
                        <DataRow label="Ayah" value={formData.fatherName} />
                        <DataRow label="Ibu" value={formData.motherName} />
                        <DataRow label="No. WhatsApp" value={formData.parentWaNumber} />
                    </div>
                </div>

                {/* Kolom Kanan: Dokumen & Persetujuan */}
                <div className="space-y-4 sm:space-y-6">
                    <div className="bg-emerald-50/50 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-emerald-100">
                        <SectionHeader title="Dokumen Terlampir" step={4} />
                        <ul className="space-y-2">
                            {[
                                { name: 'Kartu Keluarga', file: formData.kartuKeluarga },
                                { name: 'Akta Kelahiran', file: formData.aktaKelahiran },
                                { name: 'KTP Wali', file: formData.ktpWalimurid },
                                { name: 'Pas Foto', file: formData.pasFoto },
                            ].map((doc, idx) => (
                                <li key={idx} className="flex items-center gap-3 text-sm text-emerald-800 font-medium">
                                    {doc.file ? (
                                        <>
                                            <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
                                            <div className="flex-1 min-w-0">
                                                <span>{doc.name}:</span> <span className="text-[10px] opacity-70 italic truncate ml-1 block sm:inline">{doc.file.name}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            <div className="flex-1 min-w-0">
                                                <span>{doc.name}:</span> <span className="text-xs font-bold text-red-600 ml-1 uppercase">Belum diunggah / Hilang</span>
                                            </div>
                                        </>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 transition-all ${formData.termsAgreed ? 'bg-white border-emerald-500 shadow-lg shadow-emerald-50' : 'bg-red-50/50 border-red-200'}`}>
                        <label className="flex items-start gap-3 sm:gap-4 cursor-pointer">
                            <input 
                                type="checkbox" 
                                name="termsAgreed"
                                checked={formData.termsAgreed}
                                onChange={(e) => handleChange(e as any)}
                                className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer shrink-0"
                            />
                            <div className="flex-1">
                                <span className="block text-sm font-bold text-slate-800 mb-1">Pernyataan Kebenaran Data</span>
                                <p className="text-xs text-slate-500 leading-relaxed text-justify">
                                    Saya menyatakan dengan sebenar-benarnya bahwa seluruh data dan dokumen yang saya unggah adalah sah dan asli. Apabila di kemudian hari ditemukan ketidaksesuaian, saya bersedia menerima sanksi sesuai ketentuan sekolah.
                                </p>
                                {errors.termsAgreed && <p className="mt-2 text-[10px] font-bold text-red-600 uppercase tracking-wider">{errors.termsAgreed}</p>}
                            </div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewSection;
