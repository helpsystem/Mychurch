import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface TourStep {
    targetId: string;
    message: string;
    position: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
    {
        targetId: 'bible-settings-btn',
        message: 'برای تغییر ترجمه، تنظیمات نمایش و تم، اینجا کلیک کنید.',
        position: 'bottom'
    },
    {
        targetId: 'bible-player-container',
        message: 'اگر ترجمه دارای صدا باشد، این پخش‌کننده ظاهر می‌شود. (اگر صدا نباشد، مخفی می‌شود)',
        position: 'top'
    }
];

export const OnboardingTour: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState<{ top: number, left: number }>({ top: 0, left: 0 });

    useEffect(() => {
        const hasSeen = localStorage.getItem('bible_tour_seen');
        if (!hasSeen) {
            // Wait for elements to mount
            setTimeout(() => setIsVisible(true), 1500);
        }
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        const updatePosition = () => {
            const step = TOUR_STEPS[currentStep];
            const element = document.getElementById(step.targetId);

            if (element) {
                const rect = element.getBoundingClientRect();
                // Simple calculation - can be improved
                let top = rect.bottom + 10;
                let left = rect.left + (rect.width / 2) - 150; // Center horizontally (assuming 300px width bubble)

                if (step.position === 'top') {
                    top = rect.top - 140; // Approx height
                }

                // Constrain to viewport
                if (left < 10) left = 10;
                if (left + 300 > window.innerWidth) left = window.innerWidth - 310;

                setPosition({ top, left });
            } else {
                // Element not found (maybe dependent on state), skip or wait?
                // For now, if element missing, just auto-advance or close if last
                if (currentStep < TOUR_STEPS.length - 1) {
                    setCurrentStep(prev => prev + 1);
                } else {
                    setIsVisible(false);
                }
            }
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        return () => window.removeEventListener('resize', updatePosition);
    }, [currentStep, isVisible]);

    const handleNext = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleClose();
        }
    };

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem('bible_tour_seen', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[200] pointer-events-none">
            {/* Dark Overlay (optional, maybe too intrusive? User asked for "Bubble popup", likely modeless or semi-modal) */}
            {/* keeping it modeless for now, just the bubble */}

            <div
                className="absolute bg-white text-black p-4 rounded-xl shadow-2xl w-[300px] pointer-events-auto border border-yellow-500 animate-in fade-in zoom-in slide-in-from-bottom-4 duration-300"
                style={{ top: position.top, left: position.left }}
            >
                {/* Tail (CSS triangle) could be added here for extra polish */}

                <button onClick={handleClose} className="absolute top-2 right-2 text-gray-400 hover:text-black">
                    <X size={16} />
                </button>

                <p className="font-[B_Homa,system-ui] text-right text-sm leading-7 mb-4">
                    {TOUR_STEPS[currentStep].message}
                </p>

                <div className="flex justify-between items-center mt-2">
                    <button
                        onClick={handleClose}
                        className="text-xs text-gray-500 underline"
                    >
                        دیگر نمایش نده
                    </button>
                    <button
                        onClick={handleNext}
                        className="bg-yellow-500 text-black px-4 py-1.5 rounded-lg text-xs font-bold shadow-md hover:bg-yellow-400"
                    >
                        {currentStep === TOUR_STEPS.length - 1 ? 'متوجه شدم' : 'بعدی'}
                    </button>
                </div>
            </div>
        </div>
    );
};
