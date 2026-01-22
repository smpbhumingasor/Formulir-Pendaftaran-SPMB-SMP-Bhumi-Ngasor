import React, { useState, useCallback, useEffect } from 'react';
import { FormData, formSchema, baseFormSchema, FormErrors, Gender, ParentOccupation } from './types';
import { validateStep } from './utils/validation';
import StudentDataSection from './components/sections/StudentDataSection';
import ParentDataSection from './components/sections/ParentDataSection';
import DocumentUploadSection from './components/sections/DocumentUploadSection';
import Stepper from './components/Stepper';

const STEPS = ['Data Siswa', 'Orang Tua', 'Dokumen'];

/**
 * PENTING: URL ini diambil dari screenshot deployment terakhir Anda.
 * Pastikan Anda melakukan "New Deployment" setiap kali ada perubahan pada kode Apps Script.
 */
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbx735fxNxtpWrxZVVXqYqkyPTmKA8CIpSUnserp_nxvLcvCOW-5Yj55mGFRID9Ttxg5/exec'; 

const App: React.FC = () => {
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
        kartuKeluarga: null,
        aktaKelahiran: null,
        ktpWalimurid: null,
        pasFoto: null,
    };

    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error' | 'server_error'>('idle');
    const [registrationId, setRegistrationId] = useState('');

    useEffect(() => {
        const savedData = localStorage.getItem('spmb_2026_data');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                setFormData(prev => ({ ...prev, ...parsed, kartuKeluarga: null, aktaKelahiran: null, ktpWalimurid: null, pasFoto: null }));
            } catch (e) { console.error(e); }
        }
    }, []);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof FormErrors]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name as keyof FormErrors];
                return newErrors;
            });
        }
    }, [errors]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files } = e.target;
        const file = files?.[0] || null;
        setFormData(prev => ({ ...prev, [name]: file }));
    }, []);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name } = e.target;
        const fieldSchema = (baseFormSchema.shape as any)[name];
        if (fieldSchema) {
            const result = fieldSchema.safeParse(formData[name as keyof FormData]);
            if (!result.success) {
                setErrors(prev => ({ ...prev, [name]: result.error.errors[0].message }));
            }
        }
    }, [formData]);

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleNext = () => {
        const { success, errors: validationErrors } = validateStep(currentStep, formData);
        setErrors(validationErrors);
        if (success) {
            setCurrentStep(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    
    const handlePrev = () => {
        setCurrentStep(prev => prev - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const result = formSchema.safeParse(formData);
        if (!result.success) {
            setErrors(result.error.flatten().fieldErrors as FormErrors);
            setSubmissionStatus('error');
            return;
        }

        setIsSubmitting(true);
        setSubmissionStatus('idle');

        try {
            const payload: any = { ...formData };

            // Konversi file ke base64 secara paralel
            const filePromises = [];
            
            if (formData.kartuKeluarga instanceof File) {
                filePromises.push(fileToBase64(formData.kartuKeluarga).then(base64 => {
                    payload.kartuKeluargaBase64 = base64;
                    payload.kartuKeluargaMime = (formData.kartuKeluarga as File).type;
                }));
            }
            if (formData.aktaKelahiran instanceof File) {
                filePromises.push(fileToBase64(formData.aktaKelahiran).then(base64 => {
                    payload.aktaKelahiranBase64 = base64;
                    payload.aktaKelahiranMime = (formData.aktaKelahiran as File).type;
                }));
            }
            if (formData.ktpWalimurid instanceof File) {
                filePromises.push(fileToBase64(formData.ktpWalimurid).then(base64 => {
                    payload.ktpWalimuridBase64 = base64;
                    payload.ktpWalimuridMime = (formData.ktpWalimurid as File).type;
                }));
            }
            if (formData.pasFoto instanceof File) {
                filePromises.push(fileToBase64(formData.pasFoto).then(base64 => {
                    payload.pasFotoBase64 = base64;
                    payload.pasFotoMime = (formData.pasFoto as File).type;
                }));
            }

            await Promise.all(filePromises);

            // Bersihkan objek File asli sebelum kirim JSON
            delete payload.kartuKeluarga;
            delete payload.aktaKelahiran;
            delete payload.ktpWalimurid;
            delete payload.pasFoto;

            // Kirim ke Google Apps Script menggunakan no-cors karena GAS sering redirect (302)
            await fetch(GOOGLE_SHEET_URL, {
                method: 'POST',
                mode: 'no-cors', 
                cache: 'no-cache',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            // Karena no-cors, kita tidak bisa baca response body, 
            // namun jika fetch tidak melempar error, kita anggap sukses.
            setRegistrationId(`AR-RIDHO-${Date.now().toString().slice(-6)}`);
            setSubmissionStatus('success');
            localStorage.removeItem('spmb_2026_data');
        } catch (err) {
            console.error("Submission Error:", err);
            setSubmissionStatus('server_error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const Logo = () => (
        <div className="flex flex-col items-center">
            <div className="bg-emerald-600 p-4 rounded-3xl shadow-xl mb-4 transform hover:rotate-3 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight text-center">SPMB 2026/2027</h1>
            <p className="text-emerald-700 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 bg-emerald-50 px-3 py-1 rounded-full">SMP Bhumi Ngasor Ar-Ridho</p>
        </div>
    );

    if (submissionStatus === 'success') {
        return (
            <div className="min-h-screen bg-emerald-50/30 flex flex-col justify-center items-center p-6 animate-in fade-in duration-700">
                 <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-2xl w-full max-w-xl border border-emerald-100 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
                    <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-emerald-100 mb-8">
                        <svg className="h-14 w-14 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Alhamdulillah, Berhasil!</h2>
                    <p className="text-slate-600 mb-8 leading-relaxed">
                        Data pendaftaran <span className="font-bold text-slate-900">{formData.fullName}</span> telah diterima oleh sistem kami.
                    </p>
                    
                    <div className="bg-slate-50 rounded-3xl p-6 mb-8 text-left border border-slate-200 shadow-inner">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID Pendaftaran</p>
                                <p className="text-2xl font-mono font-black text-emerald-700">{registrationId}</p>
                            </div>
                            <div className="bg-emerald-600 text-white p-2 rounded-xl">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Simpan ID ini atau screenshot halaman ini untuk konfirmasi melalui WhatsApp ke Panitia.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-4 px-6 rounded-2xl text-white bg-emerald-600 hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95"
                        >
                            Daftarkan Siswa Lain
                        </button>
                    </div>
                 </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-start py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-xl mb-12">
                <Logo />
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
                <div className="bg-white py-12 px-6 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[3rem] sm:px-16 border border-slate-100">
                    <Stepper steps={STEPS} currentStep={currentStep} />
                    
                    <form className="mt-14 space-y-12" onSubmit={handleSubmit} noValidate>
                        <div className="min-h-[400px]">
                            {currentStep === 1 && <StudentDataSection formData={formData} errors={errors} handleChange={handleChange} handleBlur={handleBlur} />}
                            {currentStep === 2 && <ParentDataSection formData={formData} errors={errors} handleChange={handleChange} handleBlur={handleBlur} />}
                            {currentStep === 3 && <DocumentUploadSection formData={formData} errors={errors} handleFileChange={handleFileChange} />}
                        </div>
                        
                        <div className="pt-10 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
                            <div className="w-full sm:w-auto order-2 sm:order-1">
                                {currentStep > 1 && (
                                    <button 
                                        type="button" 
                                        onClick={handlePrev} 
                                        className="w-full sm:w-auto bg-slate-100 py-4 px-10 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all active:scale-95"
                                    >
                                        Kembali
                                    </button>
                                )}
                            </div>
                            <div className="w-full sm:w-auto order-1 sm:order-2 flex flex-col items-center gap-4">
                                {submissionStatus === 'error' && <p className="text-xs font-bold text-red-500 bg-red-50 px-4 py-2 rounded-full animate-bounce">Mohon lengkapi kolom bertanda merah!</p>}
                                {submissionStatus === 'server_error' && (
                                    <div className="text-center">
                                        <p className="text-xs font-bold text-red-500">Gagal mengirim data.</p>
                                        <p className="text-[10px] text-slate-400">Pastikan URL Apps Script sudah benar & izin akses diset ke 'Anyone'.</p>
                                    </div>
                                )}
                                
                                {currentStep < STEPS.length ? (
                                    <button 
                                        type="button" 
                                        onClick={handleNext} 
                                        className="w-full sm:w-auto py-4 px-12 rounded-2xl text-white bg-emerald-600 hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-100 transition-all active:scale-95"
                                    >
                                        Langkah Selanjutnya
                                    </button>
                                ) : (
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting} 
                                        className="w-full sm:w-auto py-4 px-12 rounded-2xl text-white bg-emerald-600 hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-200 disabled:opacity-50 transition-all active:scale-95"
                                    >
                                        {isSubmitting ? 'Mengunggah Data...' : 'Kirim Pendaftaran'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
                
                <footer className="mt-12 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
                        SMP Bhumi Ngasor Ar-Ridho &copy; 2026<br/>
                        Jl. Pendopo Kamulyan Bakalan Rt.01 Rw.02 Bakalan-Bululawang • Panitia SPMB Online
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default App;