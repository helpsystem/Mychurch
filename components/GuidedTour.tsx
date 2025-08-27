
import React, { useEffect, useState, useRef } from 'react';
import { useTour } from '../hooks/useTour';
import { useLanguage } from '../hooks/useLanguage';
import { X, ArrowLeft, ArrowRight } from 'lucide-react';

const GuidedTour: React.FC = () => {
    const { isActive, steps, currentStep, nextStep, prevStep, stopTour } = useTour();
    const { t, lang } = useLanguage();
    const [highlightedElement, setHighlightedElement] = useState<DOMRect | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isActive) return;

        const step = steps[currentStep];
        if (!step.selector) {
            setHighlightedElement(null); // Center screen for steps without a selector
            return;
        }

        const element = document.querySelector(step.selector) as HTMLElement;
        
        const updatePosition = () => {
            if (element) {
                setHighlightedElement(element.getBoundingClientRect());
            } else {
                setHighlightedElement(null);
            }
        };

        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            
            // Wait for scroll to finish before getting rect
            const timer = setTimeout(updatePosition, 300);
            
            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition);
            return () => {
                clearTimeout(timer);
                window.removeEventListener('resize', updatePosition);
                window.removeEventListener('scroll', updatePosition);
            }
        } else {
            console.warn(`Tour selector not found: ${step.selector}`);
            setHighlightedElement(null);
        }
    }, [isActive, currentStep, steps]);

    if (!isActive) return null;

    const step = steps[currentStep];
    const { title, content, position = 'bottom' } = step;

    const tooltipStyle: React.CSSProperties = {
        position: 'fixed',
        zIndex: 10001,
        transition: 'top 0.3s ease, left 0.3s ease',
    };

    if (highlightedElement) {
        const { top, left, width, height } = highlightedElement;
        const tooltipHeight = tooltipRef.current?.offsetHeight || 150;
        const tooltipWidth = tooltipRef.current?.offsetWidth || 300;
        const margin = 15;

        switch (position) {
            case 'top':
                tooltipStyle.top = top - tooltipHeight - margin;
                tooltipStyle.left = left + width / 2 - tooltipWidth / 2;
                break;
            case 'left':
                 tooltipStyle.top = top + height / 2 - tooltipHeight / 2;
                 tooltipStyle.left = left - tooltipWidth - margin;
                break;
            case 'right':
                 tooltipStyle.top = top + height / 2 - tooltipHeight / 2;
                 tooltipStyle.left = left + width + margin;
                break;
            case 'center':
                tooltipStyle.top = '50%';
                tooltipStyle.left = '50%';
                tooltipStyle.transform = 'translate(-50%, -50%)';
                break;
            default: // bottom
                tooltipStyle.top = top + height + margin;
                tooltipStyle.left = left + width / 2 - tooltipWidth / 2;
        }
        
        // Boundary checks to keep tooltip on screen
        if (tooltipStyle.left && (tooltipStyle.left as number) < margin) tooltipStyle.left = margin;
        if (tooltipStyle.top && (tooltipStyle.top as number) < margin) tooltipStyle.top = margin;
        if (tooltipRef.current && tooltipStyle.left && (tooltipStyle.left as number) + tooltipWidth > window.innerWidth) {
            tooltipStyle.left = window.innerWidth - tooltipWidth - margin;
        }
        if (tooltipRef.current && tooltipStyle.top && (tooltipStyle.top as number) + tooltipHeight > window.innerHeight) {
            tooltipStyle.top = window.innerHeight - tooltipHeight - margin;
        }


    } else { // Center on screen
        tooltipStyle.top = '50%';
        tooltipStyle.left = '50%';
        tooltipStyle.transform = 'translate(-50%, -50%)';
    }
    
    const highlightStyle: React.CSSProperties = highlightedElement ? {
        position: 'fixed',
        top: highlightedElement.top - 5,
        left: highlightedElement.left - 5,
        width: highlightedElement.width + 10,
        height: highlightedElement.height + 10,
        boxShadow: '0 0 0 9999px rgba(0,0,0,0.7)',
        borderRadius: '8px',
        zIndex: 10000,
        transition: 'all 0.3s ease-out',
        pointerEvents: 'none',
    } : {};


    return (
        <div className="fixed inset-0 z-[9999]">
            {/* The overlay is now created by the highlight's box-shadow */}
            {highlightedElement && <div style={highlightStyle} />}
            {/* If no element is highlighted, we still need an overlay */}
            {!highlightedElement && <div className="fixed inset-0 bg-black/70 z-10000"></div>}
            
            <div ref={tooltipRef} style={tooltipStyle} className="bg-black-gradient border border-gray-700 rounded-lg shadow-2xl w-80 p-5 text-white">
                <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-gradient mb-2">{title}</h3>
                    <button onClick={stopTour} className="text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>
                <p className="text-dimWhite text-sm mb-4">{content}</p>

                <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{`${currentStep + 1} / ${steps.length}`}</span>
                    <div className="flex gap-2">
                        {currentStep > 0 && (
                            <button onClick={prevStep} className="py-2 px-3 bg-gray-600 text-white rounded-md hover:bg-gray-500 flex items-center gap-1 text-sm">
                                {lang === 'fa' ? <ArrowRight size={16} /> : <ArrowLeft size={16} />} {t('tourPrev')}
                            </button>
                        )}
                        <button onClick={nextStep} className="py-2 px-4 bg-blue-gradient text-primary font-bold rounded-md flex items-center gap-1 text-sm">
                            {t(currentStep === steps.length - 1 ? 'tourFinish' : 'tourNext')} {lang === 'fa' ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuidedTour;
