/**
 * Scripture Presets - Apply beautiful preset styles with one click
 * فونت‌ های دیگر شامل: Nastaliq، Lalezar، Playfair Display، Merriweather
 */

import { ScripturePage, SCRIPTURE_PRESETS } from '@/types/broadcast';

export type PresetId = 'nastaliq-wavy' | 'professional-dark' | 'elegant-serif';

/**
 * Apply a preset style to scripture pages
 * یک preset را بر روی صفحات آیات اعمال کنید
 */
export function applyPresetToPage(page: ScripturePage, presetId: PresetId): ScripturePage {
    const preset = SCRIPTURE_PRESETS.find(p => p.id === presetId);
    if (!preset) return page;

    return {
        ...page,
        displayMode: preset.displayMode,
        fontFa: preset.fontFa,
        fontEn: preset.fontEn,
        // Note: background is applied separately to slides
    };
}

/**
 * Get font family value from preset font name
 */
export function getFontFamilyValue(fontName: string): string {
    const fontMap: Record<string, string> = {
        'Vazirmatn': 'var(--font-vazirmatn)',
        'Inter': 'var(--font-inter)',
        'Noto Nastaliq Urdu': 'var(--font-nastaliq)',
        'Lalezar': 'var(--font-lalezar)',
        'Playfair Display': 'var(--font-playfair)',
        'Merriweather': 'var(--font-merriweather)',
    };
    return fontMap[fontName] || 'var(--font-inter)';
}

/**
 * Get Tailwind class name for font
 */
export function getFontClassName(fontName: string): string {
    const classMap: Record<string, string> = {
        'Vazirmatn': 'font-[Vazirmatn]',
        'Inter': 'font-[Inter]',
        'Noto Nastaliq Urdu': 'font-nastaliq',
        'Lalezar': 'font-lalezar',
        'Playfair Display': 'font-playfair',
        'Merriweather': 'font-merriweather',
    };
    return classMap[fontName] || 'font-[Inter]';
}
