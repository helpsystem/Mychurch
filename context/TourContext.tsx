
import React, { createContext, useState, ReactNode, useCallback } from 'react';

export interface TourStep {
    selector?: string;
    title: string;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
    action?: () => void | Promise<void>;
}

export interface TourContextType {
    isActive: boolean;
    steps: TourStep[];
    currentStep: number;
    startTour: (steps: TourStep[]) => void;
    stopTour: () => void;
    nextStep: () => void;
    prevStep: () => void;
}

export const TourContext = createContext<TourContextType | undefined>(undefined);

export const TourProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isActive, setIsActive] = useState(false);
    const [steps, setSteps] = useState<TourStep[]>([]);
    const [currentStep, setCurrentStep] = useState(0);

    const startTour = useCallback((tourSteps: TourStep[]) => {
        setSteps(tourSteps);
        setCurrentStep(0);
        setIsActive(true);
        // Run action for the first step immediately
        const firstStepAction = tourSteps[0]?.action;
        if (firstStepAction) {
            firstStepAction();
        }
    }, []);

    const stopTour = useCallback(() => {
        setIsActive(false);
        setSteps([]);
        setCurrentStep(0);
    }, []);

    const nextStep = useCallback(async () => {
        if (currentStep < steps.length - 1) {
            const nextStepIndex = currentStep + 1;
            const nextStepAction = steps[nextStepIndex]?.action;
            if (nextStepAction) {
                await nextStepAction();
            }
            setCurrentStep(nextStepIndex);
        } else {
            stopTour();
        }
    }, [currentStep, steps, stopTour]);

    const prevStep = useCallback(async () => {
        if (currentStep > 0) {
            const prevStepIndex = currentStep - 1;
            const prevStepAction = steps[prevStepIndex]?.action;
            if (prevStepAction) {
               await prevStepAction();
            }
            setCurrentStep(prevStepIndex);
        }
    }, [currentStep, steps]);

    const value = {
        isActive,
        steps,
        currentStep,
        startTour,
        stopTour,
        nextStep,
        prevStep
    };

    return (
        <TourContext.Provider value={value}>
            {children}
        </TourContext.Provider>
    );
};
