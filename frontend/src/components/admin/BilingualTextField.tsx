// frontend/src/components/Admin/BilingualTextField.tsx
// Bilingual text field with auto-translate functionality

import React from 'react';
import TranslateButton from './TranslateButton';

interface BilingualTextFieldProps {
    labelEn: string;
    labelFa: string;
    valueEn: string;
    valueFa: string;
    onChangeEn: (value: string) => void;
    onChangeFa: (value: string) => void;
    context?: string;
    multiline?: boolean;
    rows?: number;
    required?: boolean;
    placeholder?: { en: string; fa: string };
}

export const BilingualTextField: React.FC<BilingualTextFieldProps> = ({
    labelEn,
    labelFa,
    valueEn,
    valueFa,
    onChangeEn,
    onChangeFa,
    context = 'general',
    multiline = false,
    rows = 3,
    required = false,
    placeholder
}) => {
    const InputComponent = multiline ? 'textarea' : 'input';

    return (
        <div className="space-y-4">
            {/* English Field */}
            <div className="relative">
                <label className="block text-sm font-medium text-gray-200 mb-2">
                    {labelEn} {required && <span className="text-red-400">*</span>}
                </label>
                <div className="relative">
                    <InputComponent
                        value={valueEn}
                        onChange={(e) => onChangeEn(e.target.value)}
                        className="w-full px-4 py-2 pr-12 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-secondary focus:border-transparent"
                        placeholder={placeholder?.en}
                        required={required}
                        rows={multiline ? rows : undefined}
                        dir="ltr"
                    />
                    <div className="absolute right-2 top-2">
                        <TranslateButton
                            sourceText={valueEn}
                            sourceLang="en"
                            targetLang="fa"
                            onTranslated={onChangeFa}
                            context={context}
                            size="md"
                        />
                    </div>
                </div>
            </div>

            {/* Persian Field */}
            <div className="relative">
                <label className="block text-sm font-medium text-gray-200 mb-2 text-right">
                    {labelFa} {required && <span className="text-red-400">*</span>}
                </label>
                <div className="relative">
                    <InputComponent
                        value={valueFa}
                        onChange={(e) => onChangeFa(e.target.value)}
                        className="w-full px-4 py-2 pl-12 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-secondary focus:border-transparent text-right"
                        placeholder={placeholder?.fa}
                        required={required}
                        rows={multiline ? rows : undefined}
                        dir="rtl"
                    />
                    <div className="absolute left-2 top-2">
                        <TranslateButton
                            sourceText={valueFa}
                            sourceLang="fa"
                            targetLang="en"
                            onTranslated={onChangeEn}
                            context={context}
                            size="md"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BilingualTextField;
