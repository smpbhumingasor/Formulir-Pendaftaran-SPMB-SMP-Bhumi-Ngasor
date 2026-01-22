import React, { useState, useCallback } from 'react';
import { FormData, formSchema, baseFormSchema, FormErrors, Gender, ParentOccupation } from './types';
import { validateStep } from './utils/validation';
import StudentDataSection from './components/sections/StudentDataSection';
import ParentDataSection from './components/sections/ParentDataSection';
import DocumentUploadSection from './components/sections/DocumentUploadSection';
import ReviewSection from './components/sections/ReviewSection';
import Stepper from './components/Stepper';

const STEPS = ['Siswa', 'Orang Tua', 'Berkas', 'Selesai'];

// URL Web App Google Apps Script Anda
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbz4LsO7HG6DrBdwWuKadU_lfsot5_9K2mlEu318LiOxpDafCgcOgoy7iTGlzZKsPErg/exec'; 
const LOGO_URL = 'https://github.com/smpbhumingasor/Formulir-Pendaftaran-SPMB-SMP-Bhumi-Ngasor/blob/161a2c73e9454d9f0046bae80d5f4dddc1553776/IMG-20260122-WA0025-removebg-preview.png?raw=true';

const App: React.FC = () => {
    const [showWelcome, setShowWelcome] = useState(true);
    const initialFormData: FormData = {
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

    // Kompresi Gambar ke ukuran yang sangat aman untuk Apps Script (~150KB per gambar)
    const compressImage = (file: File, maxWidth = 600, quality = 0.4): Promise<string> => {
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
        if ((name === 'nisn' || name === 'parentWaNumber') && value !== '' && !/^\d+$/.test(value)) return;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    }, []);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files } = e.target;
        if (files?.[0] && files[0].size > 5 * 1024 * 1024) {
            alert("Ukuran file terlalu besar! Gunakan file di bawah 5MB.");
            return;
        }
        setFormData(prev => ({ ...prev, [name]: files?.[0] || null }));
    }, []);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name } = e.target;
        const fieldSchema = (baseFormSchema.shape as any)[name];
        if (fieldSchema) {
            const result = fieldSchema.safeParse(formData[name as keyof FormData]);
            if (!result.success) setErrors(prev => ({ ...prev, [name]: result.error.errors[0].message }));
        }
    }, [formData]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (currentStep !== STEPS.length) { handleNext(); return; }

        const result = formSchema.safeParse(formData);
        if (!result.success) {
            setErrors(result.error.flatten().fieldErrors as FormErrors);
            setSubmissionStatus('error');
            return;
        }

        setIsSubmitting(true);
        try {
            const id = `AR-RIDHO-${Date.now().toString().slice(-6)}`;
            // Buat payload bersih
            const payload: any = {
                fullName: formData.fullName,
                nisn: formData.nisn,
                gender: formData.gender,
                birthPlace: formData.birthPlace,
                birthDate: formData.birthDate,
                previousSchool: formData.previousSchool,
                fatherName: formData.fatherName,
                motherName: formData.motherName,
                parentWaNumber: formData.parentWaNumber,
                address: formData.address,
                regId: id
            };

            const processFile = async (field: keyof FormData, base64Key: string, mimeKey: string) => {
                const file = formData[field] as File;
                if (file) {
                    if (file.type.startsWith('image/')) {
                        payload[base64Key] = await compressImage(file);
                    } else {
                        payload[base64Key] = await fileToBase64(file);
                    }
                    payload[mimeKey] = file.type;
                }
            };

            // Proses semua file secara paralel
            await Promise.all([
                processFile('kartuKeluarga', 'kartuKeluargaBase64', 'kartuKeluargaMime'),
                processFile('aktaKelahiran', 'aktaKelahiranBase64', 'aktaKelahiranMime'),
                processFile('ktpWalimurid', 'ktpWalimuridBase64', 'ktpWalimuridMime'),
                processFile('pasFoto', 'pasFotoBase64', 'pasFotoMime'),
            ]);

            console.log("Mengirim data ke server...");

            // Kirim ke Google Apps Script
            await fetch(GOOGLE_SHEET_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(payload)
            });

            // Tunggu 5 detik untuk memberi waktu Google memproses Drive
            await new Promise(r => setTimeout(r, 5000));

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
        if (success) { setCurrentStep(prev => prev + 1); window.scrollTo(0, 0); }
    };

    const handlePrev = () => {
        setCurrentStep(prev => Math.max(1, prev - 1));
        window.scrollTo(0, 0);
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
            <div className="min-h-screen bg-emerald-50/30 flex flex-col justify-center items-center p-6">
                 <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-xl border border-emerald-100 text-center">
                    <h2 className="text-3xl font-black text-emerald-900 mb-4">Pendaftaran Berhasil!</h2>
                    <p className="text-slate-600 mb-8 leading-relaxed italic">Data <span className="font-bold uppercase">{formData.fullName}</span> telah berhasil dikirim ke server panitia.</p>
                    <div className="bg-slate-50 rounded-3xl p-6 mb-8 text-left border border-slate-200">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">ID Pendaftaran</p>
                        <p className="text-3xl font-mono font-black text-emerald-700">{registrationId}</p>
                    </div>
                    <div className="flex flex-col gap-3 no-print">
                        <button onClick={() => window.print()} className="w-full py-4 rounded-2xl text-emerald-700 bg-white border-2 border-emerald-100 font-bold">Cetak Bukti</button>
                        <button onClick={() => window.location.reload()} className="w-full py-4 rounded-2xl text-white bg-emerald-600 font-bold">Daftarkan Siswa Lain</button>
                    </div>
                 </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 relative">
            {isSubmitting && (
                <div className="fixed inset-0 bg-white/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center">
                    <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-6"></div>
                    <p className="text-emerald-800 font-black uppercase tracking-widest text-sm text-center">
                        Sedang Mengirim & Menyimpan Data...<br/>
                        <span className="text-[10px] font-normal normal-case text-slate-500">Mohon jangan tutup atau pindah halaman (est. 10-20 detik).</span>
                    </p>
                </div>
            )}
            <div className="max-w-4xl mx-auto">
                <Logo />
                <div className="mt-12 bg-white py-12 px-6 shadow-2xl rounded-[3rem] border border-slate-100">
                    <Stepper steps={STEPS} currentStep={currentStep} />
                    <form className="mt-14 space-y-12" onSubmit={handleSubmit}>
                        <div className="min-h-[400px]">
                            {currentStep === 1 && <StudentDataSection formData={formData} errors={errors} handleChange={handleChange} handleBlur={handleBlur} />}
                            {currentStep === 2 && <ParentDataSection formData={formData} errors={errors} handleChange={handleChange} handleBlur={handleBlur} />}
                            {currentStep === 3 && <DocumentUploadSection formData={formData} errors={errors} handleFileChange={handleFileChange} />}
                            {currentStep === 4 && <ReviewSection formData={formData} errors={errors} handleChange={handleChange} />}
                        </div>
                        <div className="pt-10 border-t flex justify-between gap-6">
                            {currentStep > 1 && <button type="button" onClick={handlePrev} className="bg-slate-100 py-4 px-10 rounded-2xl font-bold text-slate-600">Kembali</button>}
                            <div className="flex-1"></div>
                            <button type="submit" disabled={isSubmitting || (currentStep === 4 && !formData.termsAgreed)} className="py-4 px-12 rounded-2xl text-white bg-emerald-600 font-bold shadow-lg disabled:opacity-50">
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