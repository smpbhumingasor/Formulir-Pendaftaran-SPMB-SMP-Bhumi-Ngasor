
import React, { useState, useCallback, useEffect } from 'react';
import { FormData, formSchema, baseFormSchema, FormErrors, Gender, ParentOccupation } from './types';
import { validateStep } from './utils/validation';
import StudentDataSection from './components/sections/StudentDataSection';
import ParentDataSection from './components/sections/ParentDataSection';
import DocumentUploadSection from './components/sections/DocumentUploadSection';
import ReviewSection from './components/sections/ReviewSection';
import SurveySection from './components/sections/SurveySection';
import Stepper from './components/Stepper';
import Toast, { ToastMessage, ToastType } from './components/Toast';

const STEPS = ['Survey', 'Siswa', 'Orang Tua', 'Berkas', 'Selesai'];

// URL Web App Google Apps Script
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbwxd6qWf6a9tpRn2gGCxwRzqCoJMtKx-nKRB4KpgV5BgMKgLpkNTbF8zZaTpXsotZis/exec'; 
const LOGO_URL = 'https://github.com/smpbhumingasor/Formulir-Pendaftaran-SPMB-SMP-Bhumi-Ngasor/blob/161a2c73e9454d9f0046bae80d5f4dddc1553776/IMG-20260122-WA0025-removebg-preview.png?raw=true';
// Nomor WA Admin untuk konfirmasi
const ADMIN_WA_NUMBER = '6285731438560'; 
const STORAGE_KEY = 'spmb_form_draft_v1';

const App: React.FC = () => {
    const [showWelcome, setShowWelcome] = useState(true);
    const initialFormData: FormData = {
        botField: '',
        infoSource: [],
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
    const [isSaving, setIsSaving] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    // --- TOAST MANAGER ---
    const addToast = (type: ToastType, title: string, message: string) => {
        const id = Math.random().toString(36).substring(7);
        setToasts(prev => [...prev, { id, type, title, message }]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    // --- NETWORK STATUS MONITOR ---
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            addToast('success', 'Kembali Online', 'Koneksi internet Anda telah pulih.');
        };
        const handleOffline = () => {
            setIsOnline(false);
            addToast('error', 'Koneksi Terputus', 'Mohon periksa sambungan internet Anda.');
        };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // --- AUTO SAVE & LOAD LOGIC ---
    useEffect(() => {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                setFormData(prev => ({
                    ...prev,
                    ...parsed,
                    kartuKeluarga: null,
                    aktaKelahiran: null,
                    ktpWalimurid: null,
                    pasFoto: null,
                    termsAgreed: false
                }));
                setIsDraftLoaded(true);
            } catch (e) {
                console.error("Gagal load draft", e);
            }
        }
    }, []);

    useEffect(() => {
        if (submissionStatus === 'idle') {
            setIsSaving(true);
            const timer = setTimeout(() => {
                const dataToSave = { ...formData };
                delete (dataToSave as any).kartuKeluarga;
                delete (dataToSave as any).aktaKelahiran;
                delete (dataToSave as any).ktpWalimurid;
                delete (dataToSave as any).pasFoto;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
                setIsSaving(false);
            }, 1000); // Debounce save
            return () => clearTimeout(timer);
        }
    }, [formData, submissionStatus]);

    useEffect(() => {
        if (isDraftLoaded) {
            const timer = setTimeout(() => setIsDraftLoaded(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [isDraftLoaded]);

    // KOMPRESI GAMBAR
    const compressImage = (file: File, maxWidth = 800, quality = 0.6): Promise<string> => {
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
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, width, height);
                        resolve(canvas.toDataURL('image/jpeg', quality));
                    } else {
                        reject(new Error("Canvas context error"));
                    }
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

    // --- INPUT HANDLER WITH FORMATTING ---
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        if (name === 'nisn') {
            const numericValue = value.replace(/\D/g, '').slice(0, 10);
            setFormData(prev => ({ ...prev, [name]: numericValue }));
            return;
        }

        if (name === 'parentWaNumber') {
            const cleanValue = value.replace(/[^0-9+]/g, '');
            setFormData(prev => ({ ...prev, [name]: cleanValue }));
            return;
        }

        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    }, []);

    const handleSurveyChange = useCallback((selected: string[]) => {
        setFormData(prev => ({ ...prev, infoSource: selected }));
    }, []);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files } = e.target;
        if (files?.[0]) {
            if (files[0].size > 2 * 1024 * 1024) {
                addToast('warning', 'Ukuran File Terlalu Besar', 'Maksimal ukuran file adalah 2MB. Mohon kompres file Anda terlebih dahulu.');
                e.target.value = '';
                return;
            }
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        }
    }, []);

    const handleFileClear = useCallback((fieldName: keyof FormData) => {
        setFormData(prev => ({ ...prev, [fieldName]: null }));
    }, []);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (typeof value === 'string') {
             setFormData(prev => ({ ...prev, [name]: value.trim() }));
        }
        
        if ((name === 'fatherOccupationOther' || name === 'motherOccupationOther') && !value) return;

        const fieldSchema = (baseFormSchema.shape as any)[name];
        if (fieldSchema) {
            const result = fieldSchema.safeParse(formData[name as keyof FormData]);
            if (!result.success) setErrors(prev => ({ ...prev, [name]: result.error.errors[0].message }));
            else setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name as keyof FormErrors];
                return newErrors;
            });
        }
    }, [formData]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!isOnline) {
            addToast('error', 'Gagal Mengirim', 'Koneksi internet terputus. Mohon cek koneksi Anda.');
            return;
        }

        if (formData.botField) {
            setSubmissionStatus('success');
            return;
        }

        if (currentStep !== STEPS.length) { handleNext(); return; }

        const result = formSchema.safeParse(formData);
        if (!result.success) {
            setErrors(result.error.flatten().fieldErrors as FormErrors);
            const firstError = Object.keys(result.error.flatten().fieldErrors)[0];
            const errorElement = document.getElementById(firstError);
            if (errorElement) errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            addToast('warning', 'Data Belum Lengkap', 'Mohon lengkapi semua data yang ditandai merah.');
            return;
        }

        setIsSubmitting(true);
        try {
            const id = `AR-RIDHO-${Date.now().toString().slice(-6)}`;
            
            const finalFatherJob = formData.fatherOccupation === ParentOccupation.LAINNYA 
                ? formData.fatherOccupationOther 
                : formData.fatherOccupation;

            const finalMotherJob = formData.motherOccupation === ParentOccupation.LAINNYA 
                ? formData.motherOccupationOther 
                : formData.motherOccupation;

            const payload: any = {
                regId: id,
                infoSource: formData.infoSource.join(', '),
                fullName: formData.fullName.trim(),
                nisn: formData.nisn.trim(),
                gender: formData.gender,
                birthPlace: formData.birthPlace.trim(),
                birthDate: formData.birthDate,
                previousSchool: formData.previousSchool.trim(),
                fatherName: formData.fatherName.trim(),
                fatherOccupation: finalFatherJob, 
                motherName: formData.motherName.trim(),
                motherOccupation: finalMotherJob, 
                parentWaNumber: formData.parentWaNumber.trim(),
                address: formData.address.trim(),
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

            // Proses upload paralel
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

            await new Promise(r => setTimeout(r, 5000));

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
             const firstError = Object.keys(validationErrors)[0];
             const errorElement = document.getElementById(firstError);
             if (errorElement) errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
             if (currentStep === 1 && !formData.infoSource.length) {
                window.scrollTo({ top: 0, behavior: 'smooth' }); 
             }
             addToast('warning', 'Mohon Periksa Kembali', 'Terdapat isian yang belum lengkap atau salah.');
        }
    };

    const handlePrev = () => {
        setCurrentStep(prev => Math.max(1, prev - 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const jumpToStep = (step: number) => {
        setCurrentStep(step);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getWhatsAppLink = () => {
        const message = `Assalamu'alaikum Admin, saya sudah mendaftar Online di SMP Bhumi Ngasor Ar-Ridho.\n\nNama Siswa: *${formData.fullName}*\nID Pendaftaran: *${registrationId}*\n\nMohon dicek. Terima kasih.`;
        return `https://wa.me/${ADMIN_WA_NUMBER}?text=${encodeURIComponent(message)}`;
    };

    const Logo = () => (
        <div className="flex flex-col items-center">
            <div className="bg-white p-2 rounded-3xl shadow-xl mb-4 border border-emerald-100">
                <img src={LOGO_URL} alt="Logo" className="h-16 w-16 sm:h-20 sm:w-20 object-contain" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight text-center">SPMB 2026/2027</h1>
            <p className="text-emerald-700 font-bold uppercase tracking-widest text-[10px] mt-2 bg-emerald-50 px-3 py-1 rounded-full text-center">SMP Bhumi Ngasor Ar-Ridho</p>
        </div>
    );

    if (showWelcome) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
                <div className="max-w-2xl w-full bg-white rounded-3xl sm:rounded-[3rem] shadow-2xl p-6 sm:p-10 border border-slate-100 text-center">
                    <Logo />
                    <div className="mt-8 sm:mt-12 space-y-6 sm:space-y-8">
                        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                            <h2 className="text-lg sm:text-xl font-black text-emerald-900 mb-4">Alur Pendaftaran Online</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-left text-xs font-bold">
                                <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100 flex items-center gap-3 sm:block sm:text-center">
                                    <span className="bg-emerald-100 text-emerald-800 w-6 h-6 rounded-full flex items-center justify-center shrink-0 sm:mx-auto sm:mb-2">1</span>
                                    <span>Isi Survey Singkat</span>
                                </div>
                                <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100 flex items-center gap-3 sm:block sm:text-center">
                                    <span className="bg-emerald-100 text-emerald-800 w-6 h-6 rounded-full flex items-center justify-center shrink-0 sm:mx-auto sm:mb-2">2</span>
                                    <span>Data Diri & Berkas</span>
                                </div>
                                <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100 flex items-center gap-3 sm:block sm:text-center">
                                    <span className="bg-emerald-100 text-emerald-800 w-6 h-6 rounded-full flex items-center justify-center shrink-0 sm:mx-auto sm:mb-2">3</span>
                                    <span>Simpan Bukti</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setShowWelcome(false)} className="w-full py-4 sm:py-5 bg-emerald-600 text-white rounded-2xl font-black shadow-xl hover:bg-emerald-700 transition-all text-sm sm:text-base">MULAI PENDAFTARAN</button>
                    </div>
                </div>
            </div>
        );
    }

    if (submissionStatus === 'success') {
        return (
            <div className="min-h-screen bg-emerald-50/30 flex flex-col justify-center items-center p-4 sm:p-6 animate-in zoom-in duration-300">
                 <div className="bg-white p-6 sm:p-10 rounded-3xl sm:rounded-[2.5rem] shadow-2xl w-full max-w-xl border border-emerald-100 text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-emerald-900 mb-4">Pendaftaran Berhasil!</h2>
                    <p className="text-slate-600 mb-6 leading-relaxed italic text-sm sm:text-base">Data <span className="font-bold uppercase">{formData.fullName}</span> telah diterima sistem.</p>
                    
                    <div className="bg-slate-50 rounded-2xl sm:rounded-3xl p-6 mb-8 text-left border border-slate-200">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">ID Pendaftaran</p>
                        <p className="text-2xl sm:text-3xl font-mono font-black text-emerald-700 break-all">{registrationId}</p>
                    </div>

                    <div className="flex flex-col gap-3 no-print">
                         <a 
                            href={getWhatsAppLink()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-4 rounded-2xl text-white bg-green-500 font-bold shadow-lg shadow-green-200 hover:bg-green-600 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                            Konfirmasi ke Admin
                        </a>
                        <button onClick={() => window.print()} className="w-full py-4 rounded-2xl text-emerald-700 bg-white border-2 border-emerald-100 font-bold hover:bg-emerald-50 text-sm sm:text-base">Cetak Bukti</button>
                        <button onClick={() => window.location.reload()} className="w-full py-4 rounded-2xl text-slate-500 bg-slate-100 font-bold hover:bg-slate-200 text-sm sm:text-base">Daftar Baru</button>
                    </div>
                 </div>
            </div>
        );
    }

    if (submissionStatus === 'server_error') {
        return (
             <div className="min-h-screen bg-red-50/50 flex flex-col justify-center items-center p-4 sm:p-6">
                 <div className="bg-white p-6 sm:p-10 rounded-3xl sm:rounded-[2.5rem] shadow-2xl w-full max-w-xl border border-red-100 text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-red-900 mb-4">Kendala Sistem</h2>
                    <p className="text-slate-600 mb-8 leading-relaxed text-sm sm:text-base">
                        Mohon maaf, server sedang mengalami gangguan komunikasi.
                        <br/><br/>
                        Silakan <strong>Screenshot layar ini</strong> dan kirimkan ke Panitia PPDB (WhatsApp).
                    </p>
                    <button onClick={() => setSubmissionStatus('idle')} className="w-full py-4 rounded-2xl text-white bg-red-600 font-bold hover:bg-red-700 transition-colors">
                        Coba Kirim Ulang
                    </button>
                 </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-6 sm:py-12 px-3 sm:px-4 relative">
            <Toast toasts={toasts} removeToast={removeToast} />
            
             {/* Notifikasi Draft Loaded */}
            {isDraftLoaded && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white px-4 sm:px-6 py-3 rounded-full shadow-lg text-xs sm:text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-4 duration-500 w-[90%] sm:w-auto justify-center">
                    <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    <span className="truncate">Data tersimpan dimuat otomatis.</span>
                </div>
            )}

            {/* Indikator Saving Real-time */}
            <div className={`fixed top-4 right-4 z-40 transition-opacity duration-300 ${isSaving ? 'opacity-100' : 'opacity-0'}`}>
                <div className="bg-white/80 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-slate-300 border-t-emerald-500 rounded-full animate-spin"></div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Menyimpan...</span>
                </div>
            </div>

            {isSubmitting && (
                <div className="fixed inset-0 bg-white/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-slate-100 rounded-full"></div>
                        <div className="w-20 h-20 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                    </div>
                    <p className="text-emerald-800 font-black uppercase tracking-widest text-sm text-center mt-6">
                        Sedang Mengirim Data...
                    </p>
                    <p className="text-xs text-slate-500 mt-2 text-center max-w-xs animate-pulse">
                        Proses ini mungkin memakan waktu hingga 30 detik tergantung koneksi dan ukuran file.
                    </p>
                </div>
            )}
            
            <div className="max-w-4xl mx-auto">
                <Logo />
                <div className="mt-6 sm:mt-12 bg-white py-6 px-4 sm:py-12 sm:px-8 shadow-2xl rounded-2xl sm:rounded-[3rem] border border-slate-100">
                    <Stepper steps={STEPS} currentStep={currentStep} />
                    <form className="mt-8 sm:mt-14 space-y-8 sm:space-y-12" onSubmit={handleSubmit}>
                        
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

                        <div className="min-h-[300px] sm:min-h-[400px]">
                            {currentStep === 1 && <SurveySection formData={formData} errors={errors} onSelectionChange={handleSurveyChange} />}
                            {currentStep === 2 && <StudentDataSection formData={formData} errors={errors} handleChange={handleChange} handleBlur={handleBlur} />}
                            {currentStep === 3 && <ParentDataSection formData={formData} errors={errors} handleChange={handleChange} handleBlur={handleBlur} />}
                            {currentStep === 4 && <DocumentUploadSection formData={formData} errors={errors} handleFileChange={handleFileChange} handleFileClear={handleFileClear} />}
                            {currentStep === 5 && <ReviewSection formData={formData} errors={errors} handleChange={handleChange} onEditStep={jumpToStep} />}
                        </div>
                        
                        <div className="pt-8 sm:pt-10 border-t flex flex-col-reverse sm:flex-row justify-between gap-4 sm:gap-6">
                            {currentStep > 1 && (
                                <button type="button" onClick={handlePrev} className="w-full sm:w-auto bg-slate-100 py-3 sm:py-4 px-8 sm:px-10 rounded-xl sm:rounded-2xl font-bold text-slate-600 hover:bg-slate-200 transition-colors text-sm sm:text-base">
                                    Kembali
                                </button>
                            )}
                            <div className="hidden sm:flex-1"></div>
                            <button type="submit" disabled={isSubmitting || (currentStep === 5 && !formData.termsAgreed)} className="w-full sm:w-auto py-3 sm:py-4 px-8 sm:px-12 rounded-xl sm:rounded-2xl text-white bg-emerald-600 font-bold shadow-lg disabled:opacity-50 hover:bg-emerald-700 transition-all text-sm sm:text-base">
                                {currentStep < 5 ? 'Langkah Selanjutnya' : 'Kirim Pendaftaran'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default App;
