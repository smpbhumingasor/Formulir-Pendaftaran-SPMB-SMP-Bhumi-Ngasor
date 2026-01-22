import React, { useState, useCallback, useEffect } from 'react';
import { FormData, formSchema, baseFormSchema, FormErrors, Gender, ParentOccupation } from './types';
import { validateStep } from './utils/validation';
import StudentDataSection from './components/sections/StudentDataSection';
import ParentDataSection from './components/sections/ParentDataSection';
import DocumentUploadSection from './components/sections/DocumentUploadSection';
import ReviewSection from './components/sections/ReviewSection';
import Stepper from './components/Stepper';

const STEPS = ['Siswa', 'Orang Tua', 'Berkas', 'Selesai'];

const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbx735fxNxtpWrxZVVXqYqkyPTmKA8CIpSUnserp_nxvLcvCOW-5Yj55mGFRID9Ttxg5/exec'; 
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

    useEffect(() => {
        const savedData = localStorage.getItem('spmb_2026_data');
        if (savedData && showWelcome) {
            try {
                const parsed = JSON.parse(savedData);
                setFormData(prev => ({ ...prev, ...parsed, kartuKeluarga: null, aktaKelahiran: null, ktpWalimurid: null, pasFoto: null, termsAgreed: false }));
            } catch (e) { console.error(e); }
        }
    }, [showWelcome]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        // Input Masking: Prevent non-numeric on certain fields
        if ((name === 'nisn' || name === 'parentWaNumber') && value !== '' && !/^\d+$/.test(value)) {
            return;
        }

        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));
        
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
        if (errors[name as keyof FormErrors]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name as keyof FormErrors];
                return newErrors;
            });
        }
    }, [errors]);

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

    const handlePrint = () => {
        window.print();
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (currentStep !== STEPS.length) {
            handleNext();
            return;
        }

        const result = formSchema.safeParse(formData);
        if (!result.success) {
            setErrors(result.error.flatten().fieldErrors as FormErrors);
            setSubmissionStatus('error');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setIsSubmitting(true);
        setSubmissionStatus('idle');

        try {
            const payload: any = { ...formData };
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

            delete payload.kartuKeluarga;
            delete payload.aktaKelahiran;
            delete payload.ktpWalimurid;
            delete payload.pasFoto;

            await fetch(GOOGLE_SHEET_URL, {
                method: 'POST',
                mode: 'no-cors', 
                cache: 'no-cache',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
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
            <div className="bg-white p-2 rounded-3xl shadow-xl mb-4 transform hover:scale-105 transition-transform overflow-hidden border border-emerald-100">
                <img src={LOGO_URL} alt="Logo SMP Bhumi Ngasor Ar-Ridho" className="h-20 w-20 object-contain" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight text-center">SPMB 2026/2027</h1>
            <p className="text-emerald-700 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 bg-emerald-50 px-3 py-1 rounded-full">SMP Bhumi Ngasor Ar-Ridho</p>
        </div>
    );

    if (showWelcome) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 animate-in fade-in duration-700">
                <div className="max-w-2xl w-full bg-white rounded-[3rem] shadow-2xl p-10 sm:p-16 border border-slate-100 text-center">
                    <Logo />
                    <div className="mt-12 space-y-8">
                        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                            <h2 className="text-xl font-black text-emerald-900 mb-4">Alur Pendaftaran Online</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                                {[
                                    { step: '1', title: 'Isi Data', desc: 'Lengkapi biodata & berkas' },
                                    { step: '2', title: 'Verifikasi', desc: 'Tim kami akan memproses' },
                                    { step: '3', title: 'Selesai', desc: 'Dapatkan bukti daftar' }
                                ].map((item) => (
                                    <div key={item.step} className="bg-white p-4 rounded-2xl border border-emerald-100/50 shadow-sm">
                                        <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-black mb-2">{item.step}</div>
                                        <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">{item.title}</div>
                                        <div className="text-[10px] text-slate-500 leading-tight">{item.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col gap-4">
                            <button 
                                onClick={() => setShowWelcome(false)}
                                className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 text-lg"
                            >
                                Mulai Pendaftaran
                            </button>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Pendaftaran dibuka Januari - Juli 2026</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (submissionStatus === 'success') {
        return (
            <div className="min-h-screen bg-emerald-50/30 flex flex-col justify-center items-center p-6 animate-in fade-in zoom-in duration-700">
                 <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-2xl w-full max-w-xl border border-emerald-100 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500 no-print"></div>
                    <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-emerald-100 mb-8 overflow-hidden no-print">
                        <img src={LOGO_URL} alt="Logo Sukses" className="h-20 w-20 object-contain" />
                    </div>
                    
                    <div className="print-only mb-8">
                        <div className="flex items-center justify-center gap-4 mb-6">
                             <img src={LOGO_URL} className="h-16 w-16" />
                             <div className="text-left">
                                <h1 className="text-xl font-black">SMP BHUMI NGASOR AR-RIDHO</h1>
                                <p className="text-xs font-bold text-slate-500 uppercase">Bukti Pendaftaran Siswa Baru 2026/2027</p>
                             </div>
                        </div>
                        <hr className="border-t-2 border-slate-100 mb-6" />
                    </div>

                    <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight no-print">Alhamdulillah, Berhasil!</h2>
                    <p className="text-slate-600 mb-8 leading-relaxed">
                        Data pendaftaran <span className="font-bold text-slate-900">{formData.fullName}</span> telah diterima. Silakan simpan ID Pendaftaran Anda.
                    </p>
                    
                    <div className="bg-slate-50 rounded-3xl p-6 mb-8 text-left border border-slate-200 shadow-inner">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ID Pendaftaran</p>
                        <p className="text-3xl font-mono font-black text-emerald-700">{registrationId}</p>
                    </div>

                    <div className="flex flex-col gap-3 no-print">
                        <button onClick={handlePrint} className="w-full py-4 px-6 rounded-2xl text-emerald-700 bg-white border-2 border-emerald-100 hover:bg-emerald-50 font-bold transition-all active:scale-95 flex items-center justify-center gap-2">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                             Cetak Bukti Pendaftaran
                        </button>
                        <button onClick={() => window.location.reload()} className="w-full py-4 px-6 rounded-2xl text-white bg-emerald-600 hover:bg-emerald-700 font-bold shadow-lg transition-all active:scale-95">Daftarkan Siswa Lain</button>
                    </div>
                    
                    <div className="print-only mt-12 text-xs text-slate-400 italic">
                        Dicetak pada: {new Date().toLocaleString('id-ID')} - Portal SPMB Online
                    </div>
                 </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-start py-12 px-4 sm:px-6 lg:px-8 relative">
            {isSubmitting && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
                    <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-emerald-800 font-black animate-pulse uppercase tracking-widest text-xs">Sedang Mengirim Data...</p>
                </div>
            )}

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
                            {currentStep === 4 && <ReviewSection formData={formData} errors={errors} handleChange={handleChange} />}
                        </div>
                        
                        <div className="pt-10 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
                            <div className="w-full sm:w-auto order-2 sm:order-1">
                                {currentStep > 1 && (
                                    <button type="button" onClick={handlePrev} className="w-full sm:w-auto bg-slate-100 py-4 px-10 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all active:scale-95">Kembali</button>
                                )}
                            </div>
                            <div className="w-full sm:w-auto order-1 sm:order-2 flex flex-col items-center gap-4">
                                {submissionStatus === 'error' && <p className="text-xs font-bold text-red-500 bg-red-50 px-4 py-2 rounded-full">Mohon periksa kembali kolom yang bertanda merah!</p>}
                                
                                {currentStep < STEPS.length ? (
                                    <button type="button" onClick={handleNext} className="w-full sm:w-auto py-4 px-12 rounded-2xl text-white bg-emerald-600 hover:bg-emerald-700 font-bold shadow-lg transition-all active:scale-95">Langkah Selanjutnya</button>
                                ) : (
                                    <button type="submit" disabled={isSubmitting || !formData.termsAgreed} className="w-full sm:w-auto py-4 px-12 rounded-2xl text-white bg-emerald-600 hover:bg-emerald-700 font-bold shadow-lg disabled:opacity-50 transition-all active:scale-95">
                                        Kirim Pendaftaran Sekarang
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
                
                <footer className="mt-12 text-center no-print">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
                        SMP Bhumi Ngasor Ar-Ridho &copy; 2026<br/>
                        Jl. Pendopo Kamulyan Bakalan Rt.01 Rw.02 Bakalan-Bululawang • Panitia SPMB Online
                    </p>
                </footer>
            </div>

            {/* Tombol WhatsApp Melayang */}
            <a 
                href="https://wa.me/6285731438560" 
                target="_blank" 
                rel="noreferrer"
                className="fixed bottom-6 right-6 bg-emerald-500 text-white p-4 rounded-full shadow-2xl shadow-emerald-200 hover:scale-110 active:scale-90 transition-all z-50 group no-print"
            >
                <div className="absolute right-full mr-3 bg-white text-emerald-800 text-[10px] font-black py-2 px-4 rounded-xl shadow-lg border border-emerald-50 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">Butuh Bantuan?</div>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.63 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </a>
        </div>
    );
};

export default App;