
import { formSchema, FormData, FormErrors } from '../types';
import { z } from 'zod';

// Fix: Use Extract to ensure field keys are strictly strings for safe indexing.
const STEP_FIELDS: Record<number, Extract<keyof FormData, string>[]> = {
    1: ['fullName', 'birthPlace', 'birthDate', 'address', 'previousSchool', 'nisn', 'gender'],
    2: ['fatherName', 'fatherOccupation', 'fatherOccupationOther', 'motherName', 'motherOccupation', 'motherOccupationOther', 'parentWaNumber'],
    3: ['kartuKeluarga', 'aktaKelahiran', 'ktpWalimurid', 'pasFoto'],
};


// FIX: Refactored the entire function to simplify logic and resolve a complex type error.
// The previous implementation used a combination of partial and full schema validation,
// which led to a "Type 'symbol' cannot be used as an index type" error when merging errors from superRefine.
// This new implementation performs a single full validation and filters the errors for the current step,
// which is cleaner, more robust, and avoids the typing issue.
export const validateStep = (step: number, formData: FormData): { success: boolean, errors: FormErrors } => {
    const fieldsToValidate = STEP_FIELDS[step];
    if (!fieldsToValidate) {
        return { success: true, errors: {} };
    }

    // We perform a full validation to catch all errors, including those from `superRefine`.
    const result = formSchema.safeParse(formData);

    // If the whole form is valid, this step is also valid.
    if (result.success) {
        return { success: true, errors: {} };
    }

    // If validation fails, we filter the errors to only show those relevant to the current step.
    const allFieldErrors = result.error.flatten().fieldErrors as FormErrors;
    const stepErrors: FormErrors = {};
    let hasStepErrors = false;

    // Fix: Explicitly loop through string-guaranteed field names to avoid "Type 'symbol' cannot be used as an index type".
    for (const field of fieldsToValidate) {
        const error = allFieldErrors[field];
        if (error) {
            stepErrors[field] = error;
            hasStepErrors = true;
        }
    }
    
    // If there are errors in the current step's fields, report failure.
    if (hasStepErrors) {
        return { success: false, errors: stepErrors };
    }

    // If there are no errors for the current step, it means the errors are in other steps.
    // For the purpose of step-by-step validation, this step is considered successful.
    return { success: true, errors: {} };
};
