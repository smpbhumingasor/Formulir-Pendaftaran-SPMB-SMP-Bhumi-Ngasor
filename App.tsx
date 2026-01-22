
import React, { useState, useCallback, useEffect } from 'react';
import { FormData, formSchema, baseFormSchema, FormErrors, Gender, ParentOccupation } from './types';
import { validateStep } from './utils/validation';
import StudentDataSection from './components/sections/StudentDataSection';
import ParentDataSection from './components/sections/ParentDataSection';
import DocumentUploadSection from './components/sections/DocumentUploadSection';
import ReviewSection from './components/sections/ReviewSection';
import Stepper from './components/Stepper';

const STEPS = ['Siswa', 'Orang Tua', 'Berkas', 'Selesai'];

// URL Web App Google Apps Script
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbzTqhWhPUCt35a4NG0Zi_6vfAQcF0i1O0IRacxFCU8uRMhYLBQmlt3G6Wj8cDSLClgP/exec'; 
const LOGO_URL = 'https://github.com/smpbhumingasor/Formulir-Pendaftaran-SPMB-SMP-Bhumi-Ngasor/blob/161a2c73e9454d9f0046bae80d5f4dddc1553776/IMG-20260122-WA0025-removebg-preview.png?raw=true';
// Nomor WA Admin untuk konfirmasi (Ganti dengan nomor asli)
const ADMIN_WA_NUMBER = '6285731438560'; 
const STORAGE_KEY = 'spmb_form_draft_v1';

const App: React.FC = () => {
    const [showWelcome, setShowWelcome] = useState(true);
    const initialFormData: FormData = {
        botField: '', // Honeypot
        fullName: '',
        birthPlace: '',
        birthDate: '',
        address: '',
        previousSchool: '',
        nisn: '',
        gender: Gender.LakiLaki,
        fatherName: '',
        fatherOccupation: ParentOccupation.WIRASWASTA,
        fatherOccupationOther: '',
        motherName: '',
        motherOccupation: ParentOccupation.IRT,
        motherOccupationOther: '',
        parentWaNumber: '',
        kartuKeluarga: null as any,
        aktaKelahiran: null as any,
        ktpWalimurid: null as any,
        pasFoto: null as any,
        termsAgreed: false,
    };

    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error' | 'server_error'>('idle');
    const [registrationId, setRegistrationId] = useState('');
    const [isDraftLoaded, setIsDraftLoaded] = useState(false);

    // --- AUTO SAVE & LOAD LOGIC ---
    useEffect(() => {
        // Load data on mount
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                // Kita tidak restore File object karena tidak bisa diserialisasi ke JSON
                setFormData(prev => ({
                    ...prev,
                    ...parsed,
                    // Reset file inputs karena browser security blocking
                    kartuKeluarga: null,
                    aktaKelahiran: null,
                    ktpWalimurid: null,
                    pasFoto: null,
                    termsAgreed: false // Reset agreement
                }));
                setIsDraftLoaded(true);
            } catch (e) {
                console.error("Gagal load draft", e);
            }
        }
    }, []);

    useEffect(() => {
        // Save text data only
        if (submissionStatus === 'idle') {
            const dataToSave = { ...formData };
            // Hapus file objects sebelum save
            delete (dataToSave as any).kartuKeluarga;
            delete (dataToSave as any).aktaKelahiran;
            delete (dataToSave as any).ktpWalimurid;
            delete (dataToSave as any).pasFoto;
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        }
    }, [formData, submissionStatus]);

    // Hilangkan notifikasi draft setelah 5 detik
    useEffect(() => {
        if (isDraftLoaded) {
            const timer = setTimeout(() => setIsDraftLoaded(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [isDraftLoaded]);


    // KOMPRESI SUPER RINGAN (Max 500px)
    const compressImage = (file: File, maxWidth = 500, quality = 0.5): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    if (width > maxWidth) {
                        height = (maxWidth / width) * height;
                        width = maxWidth;
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
        });
    };

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        // Strict Numeric Validation
        if (name === 'nisn' || name === 'parentWaNumber') {
            const numericValue = value.replace(/\D/g, ''); // Hapus semua karakter non-angka
            setFormData(prev => ({ ...prev, [name]: numericValue }));
            return;
        }

        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    }, []);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files } = e.target;
        // Limit ketat 2MB agar Apps Script tidak crash
        if (files?.[0] && files[0].size > 2 * 1024 * 1024) {
            alert("File terlalu besar! Maksimal 2MB agar data bisa masuk ke server.");
            e.target.value = '';
            return;
        }
        setFormData(prev => ({ ...prev, [name]: files?.[0] || null }));
    }, []);

    // New Function to Clear File
    const handleFileClear = useCallback((fieldName: keyof FormData) => {
        setFormData(prev => ({ ...prev, [fieldName]: null }));
    }, []);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        // Auto trim whitespace on blur
        if (typeof value === 'string') {
             setFormData(prev => ({ ...prev, [name]: value.trim() }));
        }

        const fieldSchema = (baseFormSchema.shape as any)[name];
        if (fieldSchema) {
            const result = fieldSchema.safeParse(formData[name as keyof FormData]);
            if (!result.success) setErrors(prev => ({ ...prev, [name]: result.error.errors[0].message }));
            else setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name as keyof FormErrors]; // Hapus error jika valid
                return newErrors;
            });
        }
    }, [formData]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        // HONEYPOT CHECK
        if (formData.botField) {
            // Jika bot mengisi kolom tersembunyi, pura-pura sukses tapi jangan kirim data
            console.log("Bot detected!");
            setSubmissionStatus('success');
            return;
        }

        if (currentStep !== STEPS.length) { handleNext(); return; }

        const result = formSchema.safeParse(formData);
        if (!result.success) {
            setErrors(result.error.flatten().fieldErrors as FormErrors);
            // Scroll to error
            const firstError = Object.keys(result.error.flatten().fieldErrors)[0];
            const errorElement = document.getElementById(firstError);
            if (errorElement) errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        setIsSubmitting(true);
        try {
            const id = `AR-RIDHO-${Date.now().toString().slice(-6)}`;
            
            const payload: any = {
                fullName: formData.fullName.trim(),
                nisn: formData.nisn.trim(),
                gender: formData.gender,
                birthPlace: formData.birthPlace.trim(),
                birthDate: formData.birthDate,
                previousSchool: formData.previousSchool.trim(),
                fatherName: formData.fatherName.trim(),
                motherName: formData.motherName.trim(),
                parentWaNumber: formData.parentWaNumber.trim(),
                address: formData.address.trim(),
                regId: id
            };

            const processFile = async (field: keyof FormData, base64Key: string, mimeKey: string) => {
                const file = formData[field] as File;
                if (file) {
                    let base64String = "";
                    if (file.type.startsWith('image/')) {
                        base64String = await compressImage(file);
                    } else {
                        base64String = await fileToBase64(file);
                    }
                    
                    const rawBase64 = base64String.includes('base64,') 
                        ? base64String.split('base64,')[1] 
                        : base64String;

                    payload[base64Key] = rawBase64;
                    payload[mimeKey] = file.type;
                } else {
                    payload[base64Key] = "";
                    payload[mimeKey] = "";
                }
            };

            await Promise.all([
                processFile('kartuKeluarga', 'kartuKeluargaBase64', 'kartuKeluargaMime'),
                processFile('aktaKelahiran', 'aktaKelahiranBase64', 'aktaKelahiranMime'),
                processFile('ktpWalimurid', 'ktpWalimuridBase64', 'ktpWalimuridMime'),
                processFile('pasFoto', 'pasFotoBase64', 'pasFotoMime'),
            ]);

            const noCacheUrl = `${GOOGLE_SHEET_URL}?t=${Date.now()}`;
            
            await fetch(noCacheUrl, {
                method: 'POST',
                mode: 'no-cors', 
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(payload)
            });

            await new Promise(r => setTimeout(r, 8000));

            // Clear storage on success
            localStorage.removeItem(STORAGE_KEY);
            setRegistrationId(id);
            setSubmissionStatus('success');
        } catch (err) {
            console.error("Critical Error:", err);
            setSubmissionStatus('server_error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNext = () => {
        const { success, errors: validationErrors } = validateStep(currentStep, formData);
        setErrors(validationErrors);
        if (success) { 
            setCurrentStep(prev => prev + 1); 
            window.scrollTo({ top: 0, behavior: 'smooth' }); 
        } else {
             // Scroll to first error
             const firstError = Object.keys(validationErrors)[0];
             const errorElement = document.getElementById(firstError);
             if (errorElement) errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const handlePrev = () => {
        setCurrentStep(prev => Math.max(1, prev - 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Fungsi untuk lompat step (Edit Mode)
    const jumpToStep = (step: number) => {
        setCurrentStep(step);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Helper untuk link WA
    const getWhatsAppLink = () => {
        const message = `Assalamu'alaikum Admin, saya sudah mendaftar Online di SMP Bhumi Ngasor Ar-Ridho.\n\nNama Siswa: *${formData.fullName}*\nID Pendaftaran: *${registrationId}*\n\nMohon dicek. Terima kasih.`;
        return `https://wa.me/${ADMIN_WA_NUMBER}?text=${encodeURIComponent(message)}`;
    };

    const Logo = () => (
        <div className="flex flex-col items-center">
            <div className="bg-white p-2 rounded-3xl shadow-xl mb-4 border border-emerald-100">
                <img src={LOGO_URL} alt="Logo" className="h-20 w-20 object-contain" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">SPMB 2026/2027</h1>
            <p className="text-emerald-700 font-bold uppercase tracking-widest text-[10px] mt-2 bg-emerald-50 px-3 py-1 rounded-full">SMP Bhumi Ngasor Ar-Ridho</p>
        </div>
    );

    if (showWelcome) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="max-w-2xl w-full bg-white rounded-[3rem] shadow-2xl p-10 border border-slate-100 text-center">
                    <Logo />
                    <div className="mt-12 space-y-8">
                        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                            <h2 className="text-xl font-black text-emerald-900 mb-4">Alur Pendaftaran Online</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left text-xs font-bold">
                                <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100">1. Isi Data Diri</div>
                                <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100">2. Unggah Berkas</div>
                                <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100">3. Simpan Bukti</div>
                            </div>
                        </div>
                        <button onClick={() => setShowWelcome(false)} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black shadow-xl hover:bg-emerald-700 transition-all">MULAI PENDAFTARAN</button>
                    </div>
                </div>
            </div>
        );
    }

    if (submissionStatus === 'success') {
        return (
            <div className="min-h-screen bg-emerald-50/30 flex flex-col justify-center items-center p-6 animate-in zoom-in duration-300">
                 <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-xl border border-emerald-100 text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h2 className="text-3xl font-black text-emerald-900 mb-4">Pendaftaran Berhasil!</h2>
                    <p className="text-slate-600 mb-6 leading-relaxed italic">Data <span className="font-bold uppercase">{formData.fullName}</span> telah diterima sistem.</p>
                    
                    <div className="bg-slate-50 rounded-3xl p-6 mb-8 text-left border border-slate-200">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">ID Pendaftaran</p>
                        <p className="text-3xl font-mono font-black text-emerald-700">{registrationId}</p>
                    </div>

                    <div className="flex flex-col gap-3 no-print">
                         <a 
                            href={getWhatsAppLink()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-4 rounded-2xl text-white bg-green-500 font-bold shadow-lg shadow-green-200 hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                            Konfirmasi ke Admin
                        </a>
                        <button onClick={() => window.print()} className="w-full py-4 rounded-2xl text-emerald-700 bg-white border-2 border-emerald-100 font-bold hover:bg-emerald-50">Cetak Bukti</button>
                        <button onClick={() => window.location.reload()} className="w-full py-4 rounded-2xl text-slate-500 bg-slate-100 font-bold hover:bg-slate-200">Daftar Baru</button>
                    </div>
                 </div>
            </div>
        );
    }

    if (submissionStatus === 'server_error') {
        return (
             <div className="min-h-screen bg-red-50/50 flex flex-col justify-center items-center p-6">
                 <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-xl border border-red-100 text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h2 className="text-2xl font-black text-red-900 mb-4">Kendala Sistem</h2>
                    <p className="text-slate-600 mb-8 leading-relaxed">
                        Mohon maaf, server sedang mengalami gangguan komunikasi atau memerlukan pembaruan izin akses.
                        <br/><br/>
                        Jika ini terus terjadi, silakan <strong>Screenshot layar ini</strong> dan kirimkan ke Panitia PPDB (WhatsApp) untuk pengecekan manual.
                    </p>
                    <button onClick={() => setSubmissionStatus('idle')} className="w-full py-4 rounded-2xl text-white bg-red-600 font-bold hover:bg-red-700 transition-colors">
                        Coba Kirim Ulang
                    </button>
                 </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 relative">
             {/* Notifikasi Draft Loaded */}
            {isDraftLoaded && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white px-6 py-3 rounded-full shadow-lg text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-4 duration-500">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    Data tersimpan dimuat otomatis. Mohon cek file unggahan kembali.
                </div>
            )}

            {isSubmitting && (
                <div className="fixed inset-0 bg-white/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center">
                    <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-6"></div>
                    <p className="text-emerald-800 font-black uppercase tracking-widest text-sm text-center">
                        Sedang Mengirim Data...<br/>
                        <span className="text-[10px] font-normal normal-case text-slate-500 italic">Mohon tunggu, jangan tutup halaman ini.</span>
                    </p>
                </div>
            )}
            <div className="max-w-4xl mx-auto">
                <Logo />
                <div className="mt-12 bg-white py-12 px-6 shadow-2xl rounded-[3rem] border border-slate-100">
                    <Stepper steps={STEPS} currentStep={currentStep} />
                    <form className="mt-14 space-y-12" onSubmit={handleSubmit}>
                        
                        {/* HONEYPOT FIELD (INVISIBLE) */}
                        <div className="opacity-0 absolute top-0 left-0 h-0 w-0 overflow-hidden -z-10">
                            <label htmlFor="botField">Dont fill this</label>
                            <input 
                                type="text" 
                                id="botField" 
                                name="botField" 
                                value={formData.botField} 
                                onChange={handleChange} 
                                tabIndex={-1} 
                                autoComplete="off"
                            />
                        </div>

                        <div className="min-h-[400px]">
                            {currentStep === 1 && <StudentDataSection formData={formData} errors={errors} handleChange={handleChange} handleBlur={handleBlur} />}
                            {currentStep === 2 && <ParentDataSection formData={formData} errors={errors} handleChange={handleChange} handleBlur={handleBlur} />}
                            {currentStep === 3 && <DocumentUploadSection formData={formData} errors={errors} handleFileChange={handleFileChange} handleFileClear={handleFileClear} />}
                            {currentStep === 4 && <ReviewSection formData={formData} errors={errors} handleChange={handleChange} onEditStep={jumpToStep} />}
                        </div>
                        <div className="pt-10 border-t flex justify-between gap-6">
                            {currentStep > 1 && <button type="button" onClick={handlePrev} className="bg-slate-100 py-4 px-10 rounded-2xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">Kembali</button>}
                            <div className="flex-1"></div>
                            <button type="submit" disabled={isSubmitting || (currentStep === 4 && !formData.termsAgreed)} className="py-4 px-12 rounded-2xl text-white bg-emerald-600 font-bold shadow-lg disabled:opacity-50 hover:bg-emerald-700 transition-all">
                                {currentStep < 4 ? 'Langkah Selanjutnya' : 'Kirim Pendaftaran'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default App;
