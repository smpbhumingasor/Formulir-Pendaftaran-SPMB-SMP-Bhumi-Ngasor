import { formSchema, FormData, FormErrors } from '../types';

// Mapping fields to steps for partial validation
const STEP_FIELDS: Record<number, Extract<keyof FormData, string>[]> = {
    1: ['fullName', 'birthPlace', 'birthDate', 'address', 'previousSchool', 'nisn', 'gender'],
    2: ['fatherName', 'fatherOccupation', 'fatherOccupationOther', 'motherName', 'motherOccupation', 'motherOccupationOther', 'parentWaNumber'],
    3: ['kartuKeluarga', 'aktaKelahiran', 'ktpWalimurid', 'pasFoto'],
    4: ['termsAgreed'],
};

export const validateStep = (step: number, formData: FormData): { success: boolean, errors: FormErrors } => {
    const fieldsToValidate = STEP_FIELDS[step];
    if (!fieldsToValidate) {
        return { success: true, errors: {} };
    }

    const result = formSchema.safeParse(formData);

    if (result.success) {
        return { success: true, errors: {} };
    }

    const allFieldErrors = result.error.flatten().fieldErrors as FormErrors;
    const stepErrors: FormErrors = {};
    let hasStepErrors = false;

    for (const field of fieldsToValidate) {
        const error = allFieldErrors[field];
        if (error) {
            stepErrors[field] = error;
            hasStepErrors = true;
        }
    }
    
    if (hasStepErrors) {
        return { success: false, errors: stepErrors };
    }

    return { success: true, errors: {} };
};