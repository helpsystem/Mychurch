// frontend/src/components/Admin/TranslateButton.tsx
// Simple translate button for inline translation

import React, { useState } from 'react';
import { Languages, Loader2, Check, X } from 'lucide-react';
import axios from 'axios';

interface TranslateButtonProps {
    sourceText: string;
    sourceLang: 'fa' | 'en';
    targetLang: 'fa' | 'en';
    onTranslated: (text: string) => void;
    context?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const TranslateButton: React.FC<TranslateButtonProps> = ({
    sourceText,
    sourceLang,
    targetLang,
    onTranslated,
    context = 'general',
    size = 'sm',
    className = ''
}) => {
    const [isTranslating, setIsTranslating] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleTranslate = async () => {
        if (!sourceText || sourceText.trim().length === 0) {
            setError('متنی برای ترجمه وجود ندارد');
            return;
        }

        setIsTranslating(true);
        setError(null);

        try {
            const response = await axios.post('/api/ai/translate/smart', {
                text: sourceText,
                sourceLang,
                targetLang,
                context,
                quality: 'professional'
            }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data.success) {
                onTranslated(response.data.translation);
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 2000);
            } else {
                throw new Error(response.data.message || 'Translation failed');
            }
        } catch (err: any) {
            console.error('Translation error:', err);
            setError(err.response?.data?.message || 'خطا در ترجمه');
        } finally {
            setIsTranslating(false);
        }
    };

    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6'
    };

    const iconSize = sizeClasses[size];

    return (
        <div className="relative inline-block">
            <button
                type="button"
                onClick={handleTranslate}
                disabled={isTranslating || !sourceText}
                className={`
          inline-flex items-center gap-1 px-2 py-1 rounded
          text-secondary hover:text-white
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
          ${isTranslating ? 'animate-pulse' : ''}
          ${className}
        `}
                title={`Translate to ${targetLang === 'fa' ? 'Persian' : 'English'}`}
            >
                {isTranslating ? (
                    <Loader2 className={`${iconSize} animate-spin`} />
                ) : showSuccess ? (
                    <Check className={`${iconSize} text-green-400`} />
                ) : (
                    <Languages className={iconSize} />
                )}
                {size !== 'sm' && (
                    <span className="text-xs">
                        {isTranslating ? 'ترجمه...' : 'ترجمه'}
                    </span>
                )}
            </button>

            {error && (
                <div className="absolute top-full left-0 mt-1 z-50">
                    <div className="bg-red-500 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap flex items-center gap-1">
                        <X className="w-3 h-3" />
                        {error}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TranslateButton;
