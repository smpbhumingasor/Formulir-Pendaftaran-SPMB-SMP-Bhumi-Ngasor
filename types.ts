
import { z } from 'zod';

// --- Constants for Validation ---
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = [...ALLOWED_IMAGE_TYPES, 'application/pdf'];

// Helper function for file validation schema
const fileSchema = (message: string) => z.instanceof(File, { message })
    .refine(file => !file || file.size <= MAX_FILE_SIZE, `Ukuran file maksimal 2MB.`)
    .refine(file => !file || ALLOWED_DOCUMENT_TYPES.includes(file.type), '.pdf, .jpg, .png, or .webp files are accepted.');

const imageFileSchema = (message: string) => z.instanceof(File, { message })
    .refine(file => !file || file.size <= MAX_FILE_SIZE, `Ukuran file maksimal 2MB.`)
    .refine(file => !file || ALLOWED_IMAGE_TYPES.includes(file.type), '.jpg, .png, or .webp files are accepted.');


// --- Enums ---
export enum Gender {
    LakiLaki = 'Laki-laki',
    Perempuan = 'Perempuan',
}

export enum ParentOccupation {
    PNS = 'PNS',
    TNI_POLRI = 'TNI/POLRI',
    WIRASWASTA = 'Wiraswasta',
    KARYAWAN_SWASTA = 'Karyawan Swasta',
    PETANI = 'Petani',
    NELAYAN = 'Nelayan',
    IRT = 'Ibu Rumah Tangga',
    TIDAK_BEKERJA = 'Tidak Bekerja',
    LAINNYA = 'Lainnya...',
}

// --- Zod Schema ---
// Base schema without refinements to keep .shape accessible
export const baseFormSchema = z.object({
    // Step 1: Student Data
    fullName: z.string().min(1, 'Nama lengkap wajib diisi'),
    birthPlace: z.string().min(1, 'Tempat lahir wajib diisi'),
    birthDate: z.string().min(1, 'Tanggal lahir wajib diisi'),
    address: z.string().min(1, 'Alamat lengkap wajib diisi'),
    previousSchool: z.string().min(1, 'Asal sekolah wajib diisi'),
    nisn: z.string().regex(/^\d{10}$/, 'NISN harus terdiri dari 10 digit angka'),
    gender: z.nativeEnum(Gender),
    
    // Step 2: Parent Data
    fatherName: z.string().min(1, 'Nama ayah wajib diisi'),
    fatherOccupation: z.nativeEnum(ParentOccupation),
    fatherOccupationOther: z.string().optional(),
    motherName: z.string().min(1, 'Nama ibu wajib diisi'),
    motherOccupation: z.nativeEnum(ParentOccupation),
    motherOccupationOther: z.string().optional(),
    parentWaNumber: z.string().regex(/^(\+62|62|0)8[1-9][0-9]{7,11}$/, 'No. WA tidak valid, contoh: 08123456789'),

    // Step 3: Document Upload
    kartuKeluarga: z.any().optional(), // Handled manually or via refinement if needed
    aktaKelahiran: z.any().optional(),
    ktpWalimurid: z.any().optional(),
    pasFoto: z.any().optional(),
});

// Refined schema for full validation
export const formSchema = baseFormSchema.superRefine((data, ctx) => {
    if (data.fatherOccupation === ParentOccupation.LAINNYA && !data.fatherOccupationOther?.trim()) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['fatherOccupationOther'],
            message: 'Pekerjaan Ayah wajib diisi',
        });
    }
    if (data.motherOccupation === ParentOccupation.LAINNYA && !data.motherOccupationOther?.trim()) {
         ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['motherOccupationOther'],
            message: 'Pekerjaan Ibu wajib diisi',
        });
    }
});

// --- Inferred Types ---
export type FormData = z.infer<typeof formSchema>;

export type FormErrors = {
    [K in Extract<keyof FormData, string>]?: string | string[];
};
