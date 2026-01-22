
import React from 'react';
import { FormData, FormErrors, Gender } from '../../types';
import Input from '../Input';
import Select from '../Select';
import TextArea from '../TextArea';

interface Props {
    formData: FormData;
    errors: FormErrors;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    handleBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

const StudentDataSection: React.FC<Props> = ({ formData, errors, handleChange, handleBlur }) => {
    // Hitung tahun maksimal (misal: minimal umur 10 tahun untuk masuk SMP)
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() - 9);
    const maxDateString = maxDate.toISOString().split('T')[0];

    return (
        <div className="space-y-8">
            <div className="border-l-4 border-primary-500 pl-4 py-1">
                <h3 className="text-xl font-bold text-slate-800">Biodata Calon Siswa</h3>
                <p className="text-sm text-slate-500">Isi data pribadi calon siswa sesuai dengan akta kelahiran.</p>
            </div>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-6">
                <div className="sm:col-span-6">
                    <Input label="Nama Lengkap" id="fullName" name="fullName" type="text" value={formData.fullName} onChange={handleChange} onBlur={handleBlur} error={errors.fullName} required autoComplete="name" placeholder="Masukkan nama sesuai ijazah/akta" />
                </div>
                
                <div className="sm:col-span-3">
                    <Input label="Tempat Lahir" id="birthPlace" name="birthPlace" type="text" value={formData.birthPlace} onChange={handleChange} onBlur={handleBlur} error={errors.birthPlace} required placeholder="Contoh: Jakarta" />
                </div>
                
                <div className="sm:col-span-3">
                    <Input 
                        label="Tanggal Lahir" 
                        id="birthDate" 
                        name="birthDate" 
                        type="date" 
                        max={maxDateString}
                        value={formData.birthDate} 
                        onChange={handleChange} 
                        onBlur={handleBlur} 
                        error={errors.birthDate} 
                        required 
                    />
                </div>

                <div className="sm:col-span-3">
                    <Select label="Jenis Kelamin" id="gender" name="gender" value={formData.gender} onChange={handleChange} onBlur={handleBlur} error={errors.gender} required>
                        {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
                    </Select>
                </div>

                <div className="sm:col-span-3">
                    <Input label="NISN" id="nisn" name="nisn" type="text" pattern="\d{10}" maxLength={10} value={formData.nisn} onChange={handleChange} onBlur={handleBlur} error={errors.nisn} required inputMode="numeric" placeholder="10 digit angka" />
                </div>

                <div className="sm:col-span-6">
                    <Input label="Asal Sekolah (SD/MI)" id="previousSchool" name="previousSchool" type="text" value={formData.previousSchool} onChange={handleChange} onBlur={handleBlur} error={errors.previousSchool} required placeholder="Nama sekolah dasar sebelumnya" />
                </div>
                
                <div className="sm:col-span-6">
                    <TextArea label="Alamat Tinggal Sekarang" id="address" name="address" value={formData.address} onChange={handleChange} onBlur={handleBlur} error={errors.address} required placeholder="Alamat lengkap beserta RT/RW, Kelurahan, Kecamatan" />
                </div>
            </div>
        </div>
    );
};

export default StudentDataSection;
