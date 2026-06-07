// src/types/church-programs.ts
// Church Program Schedule Management — Type Definitions

export interface ChurchProgramCategory {
    id: string;
    name_fa: string;
    name_en: string;
    icon: string;       // Emoji e.g. "🕍" or "📖"
    color: string;      // Hex e.g. "#6366f1"
    sort_order: number;
    created_at?: string;
}

export interface ChurchProgram {
    id: string;
    category_id: string;
    title_fa: string;
    title_en: string;
    organizer_fa: string;
    organizer_en: string;
    description_fa?: string;
    description_en?: string;
    event_date: string;      // ISO date string "YYYY-MM-DD"
    start_time: string;      // "HH:MM"
    end_time?: string;       // "HH:MM" optional
    location_fa?: string;
    location_en?: string;
    presentation_id?: string | null;  // FK → presentations.id
    is_public: boolean;
    created_at?: string;
    // Joined fields (populated from category join)
    category?: ChurchProgramCategory;
}
