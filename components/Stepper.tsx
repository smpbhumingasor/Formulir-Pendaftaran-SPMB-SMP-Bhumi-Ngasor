
import React from 'react';

interface StepperProps {
    steps: string[];
    currentStep: number;
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStep }) => {
    return (
        <nav aria-label="Progress">
            <ol role="list" className="flex items-center justify-between w-full">
                {steps.map((step, index) => {
                    const stepIndex = index + 1;
                    const isCompleted = currentStep > stepIndex;
                    const isCurrent = currentStep === stepIndex;

                    return (
                        <li key={step} className={`relative ${index !== steps.length - 1 ? 'flex-1' : ''}`}>
                            <div className="flex items-center">
                                {/* Step Circle */}
                                <div 
                                    className={`relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 transition-all duration-300 z-10 shrink-0 ${
                                        isCompleted 
                                        ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200' 
                                        : isCurrent 
                                        ? 'bg-white border-primary-600 text-primary-600 shadow-md ring-2 sm:ring-4 ring-primary-50' 
                                        : 'bg-white border-slate-200 text-slate-400'
                                    }`}
                                >
                                    {isCompleted ? (
                                        <svg className="h-4 w-4 sm:h-6 sm:w-6" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <span className="text-xs sm:text-sm font-bold">{stepIndex}</span>
                                    )}
                                </div>

                                {/* Step Label (Desktop) */}
                                <div className="hidden sm:block ml-4">
                                    <p className={`text-xs font-bold uppercase tracking-wider ${isCurrent ? 'text-primary-700' : 'text-slate-400'}`}>
                                        {step}
                                    </p>
                                </div>

                                {/* Connector Line */}
                                {index !== steps.length - 1 && (
                                    <div className="flex-1 h-0.5 mx-2 sm:mx-4 bg-slate-200">
                                        <div 
                                            className="h-full bg-primary-600 transition-all duration-500" 
                                            style={{ width: isCompleted ? '100%' : '0%' }}
                                        ></div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Step Label (Mobile - Only Active) */}
                            <div className={`sm:hidden absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap transition-opacity duration-300 ${isCurrent ? 'opacity-100' : 'opacity-0'}`}>
                                <p className="text-[10px] font-bold uppercase tracking-tight text-primary-700">
                                    {step}
                                </p>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Stepper;
