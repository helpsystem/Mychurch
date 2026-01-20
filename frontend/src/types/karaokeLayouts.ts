/**
 * Layout Mode Types for Karaoke Player
 */

export type KaraokeLayoutMode =
    | 'custom-dual'      // Our custom dual-column (Finglish LEFT | Persian RIGHT)
    | 'custom-single'    // Our custom single-column (Persian only)
    | 'amll-standard'    // AMLL Apple Music-like (centered with romanization below)
    | 'amll-dual';       // AMLL with custom dual-language configuration

export interface LayoutModeOption {
    value: KaraokeLayoutMode;
    label: {
        en: string;
        fa: string;
    };
    description: {
        en: string;
        fa: string;
    };
    icon: string;
}

export const LAYOUT_MODES: LayoutModeOption[] = [
    {
        value: 'custom-dual',
        label: {
            en: 'Side-by-Side',
            fa: 'دو ستونی'
        },
        description: {
            en: 'Finglish left, Persian right',
            fa: 'فینگلیش چپ، فارسی راست'
        },
        icon: '◫'
    },
    {
        value: 'custom-single',
        label: {
            en: 'Persian Only',
            fa: 'فقط فارسی'
        },
        description: {
            en: 'Single centered column',
            fa: 'تک ستون وسط'
        },
        icon: '▮'
    },
    {
        value: 'amll-standard',
        label: {
            en: 'Apple Music Style',
            fa: 'سبک اپل موزیک'
        },
        description: {
            en: 'AMLL centered with smooth animations',
            fa: 'AMLL با انیمیشن‌های زیبا'
        },
        icon: '◉'
    },
];

/**
 * Get layout mode from localStorage or default
 */
export function getStoredLayoutMode(): KaraokeLayoutMode {
    const stored = localStorage.getItem('karaoke_layout_mode');
    if (stored && ['custom-dual', 'custom-single', 'amll-standard', 'amll-dual'].includes(stored)) {
        return stored as KaraokeLayoutMode;
    }
    return 'custom-dual'; // Default
}

/**
 * Save layout mode to localStorage
 */
export function saveLayoutMode(mode: KaraokeLayoutMode): void {
    localStorage.setItem('karaoke_layout_mode', mode);
}
