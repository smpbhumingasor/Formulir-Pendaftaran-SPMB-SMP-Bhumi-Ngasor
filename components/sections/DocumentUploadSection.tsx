
import React from 'react';
import { FormData, FormErrors } from '../../types';
import FileInput from '../FileInput';

interface Props {
    formData: FormData;
    errors: FormErrors;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleFileClear: (name: keyof FormData) => void;
}

const DocumentUploadSection: React.FC<Props> = ({ formData, errors, handleFileChange, handleFileClear }) => {
    return (
        <div className="space-y-8">
            <div className="border-l-4 border-emerald-500 pl-4 py-1">
                <h3 className="text-xl font-bold text-slate-800">Unggah Dokumen Pendukung</h3>
                <p className="text-sm text-slate-500">Silakan unggah pindaian dokumen asli dalam format gambar atau PDF.</p>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                <div className="group">
                    <FileInput 
                        label="Kartu Keluarga" 
                        id="kartuKeluarga" 
                        name="kartuKeluarga" 
                        onChange={handleFileChange} 
                        onClear={() => handleFileClear('kartuKeluarga')}
                        error={errors.kartuKeluarga} 
                        required 
                        accept="image/*,.pdf" 
                        file={formData.kartuKeluarga} 
                    />
                </div>
                <div className="group">
                    <FileInput 
                        label="Akta Kelahiran" 
                        id="aktaKelahiran" 
                        name="aktaKelahiran" 
                        onChange={handleFileChange} 
                        onClear={() => handleFileClear('aktaKelahiran')}
                        error={errors.aktaKelahiran} 
                        required 
                        accept="image/*,.pdf" 
                        file={formData.aktaKelahiran} 
                    />
                </div>
                <div className="group">
                    <FileInput 
                        label="KTP Orang Tua / Wali" 
                        id="ktpWalimurid" 
                        name="ktpWalimurid" 
                        onChange={handleFileChange} 
                        onClear={() => handleFileClear('ktpWalimurid')}
                        error={errors.ktpWalimurid} 
                        required 
                        accept="image/*,.pdf" 
                        file={formData.ktpWalimurid} 
                    />
                </div>
                <div className="group">
                    <FileInput 
                        label="Pas Foto Siswa (3x4)" 
                        id="pasFoto" 
                        name="pasFoto" 
                        onChange={handleFileChange} 
                        onClear={() => handleFileClear('pasFoto')}
                        error={errors.pasFoto} 
                        required 
                        accept="image/*" 
                        file={formData.pasFoto} 
                        showPreview 
                    />
                </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-4 items-start">
                <div className="bg-amber-100 p-2 rounded-lg text-amber-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                    Pastikan file terlihat jelas dan tidak buram. Ukuran maksimal setiap file adalah <strong>2 Megabyte (MB)</strong>. Gunakan format JPG/PNG untuk hasil terbaik.
                </p>
            </div>
        </div>
    );
};

export default DocumentUploadSection;
