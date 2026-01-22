import React from 'react';
import { FormData, FormErrors, ParentOccupation } from '../../types';
import Input from '../Input';
import Select from '../Select';

interface Props {
    formData: FormData;
    errors: FormErrors;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    handleBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

const ParentDataSection: React.FC<Props> = ({ formData, errors, handleChange, handleBlur }) => {
    return (
        <div className="space-y-8">
            <div className="border-l-4 border-primary-500 pl-4 py-1">
                <h3 className="text-xl font-bold text-slate-800">Data Orang Tua / Wali</h3>
                <p className="text-sm text-slate-500">Informasi wali murid untuk keperluan komunikasi sekolah.</p>
            </div>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-6">
                <div className="sm:col-span-3">
                    <Input label="Nama Lengkap Ayah" id="fatherName" name="fatherName" type="text" value={formData.fatherName} onChange={handleChange} onBlur={handleBlur} error={errors.fatherName} required />
                </div>
                
                <div className="sm:col-span-3">
                    <Select label="Pekerjaan Ayah" id="fatherOccupation" name="fatherOccupation" value={formData.fatherOccupation} onChange={handleChange} onBlur={handleBlur} error={errors.fatherOccupation} required>
                        {Object.values(ParentOccupation).map(job => <option key={job} value={job}>{job}</option>)}
                    </Select>
                </div>
                
                {formData.fatherOccupation === ParentOccupation.LAINNYA && (
                    <div className="sm:col-span-6">
                        <Input label="Detail Pekerjaan Ayah" id="fatherOccupationOther" name="fatherOccupationOther" type="text" value={formData.fatherOccupationOther} onChange={handleChange} onBlur={handleBlur} error={errors.fatherOccupationOther} required placeholder="Sebutkan pekerjaan ayah" />
                    </div>
                )}

                <div className="sm:col-span-3">
                    <Input label="Nama Lengkap Ibu" id="motherName" name="motherName" type="text" value={formData.motherName} onChange={handleChange} onBlur={handleBlur} error={errors.motherName} required />
                </div>
                
                <div className="sm:col-span-3">
                    <Select label="Pekerjaan Ibu" id="motherOccupation" name="motherOccupation" value={formData.motherOccupation} onChange={handleChange} onBlur={handleBlur} error={errors.motherOccupation} required>
                        {Object.values(ParentOccupation).map(job => <option key={job} value={job}>{job}</option>)}
                    </Select>
                </div>
                
                {formData.motherOccupation === ParentOccupation.LAINNYA && (
                    <div className="sm:col-span-6">
                        <Input label="Detail Pekerjaan Ibu" id="motherOccupationOther" name="motherOccupationOther" type="text" value={formData.motherOccupationOther} onChange={handleChange} onBlur={handleBlur} error={errors.motherOccupationOther} required placeholder="Sebutkan pekerjaan ibu" />
                    </div>
                )}

                 <div className="sm:col-span-6">
                    <div className="bg-primary-50 p-4 rounded-xl border border-primary-100">
                        <Input 
                            label="Nomor WhatsApp (Aktif)" 
                            id="parentWaNumber" 
                            name="parentWaNumber" 
                            type="tel" 
                            value={formData.parentWaNumber} 
                            onChange={handleChange} 
                            onBlur={handleBlur} 
                            error={errors.parentWaNumber} 
                            placeholder="Contoh: 081234567890" 
                            required 
                            inputMode="tel" 
                        />
                        <p className="mt-2 text-[10px] text-primary-600 font-medium">*Seluruh informasi kelulusan & administrasi akan dikirim melalui nomor ini.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ParentDataSection;