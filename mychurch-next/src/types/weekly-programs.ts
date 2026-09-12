export interface ChurchWeeklyProgram {
    id: string;
    day_of_week: string; // 'sunday' | 'tuesday' | 'wednesday' | 'thursday' | 'flexible' | string
    day_name_fa: string;
    day_name_en: string;
    title_fa: string;
    title_en: string;
    category_fa: string;
    category_en: string;
    main_teacher_fa: string;
    main_teacher_en: string;
    assistant_fa: string;
    assistant_en: string;
    time_fa: string;
    time_en: string;
    start_time?: string;
    end_time?: string;
    location_fa: string;
    location_en: string;
    description_fa: string;
    description_en: string;
    icon: string;
    color: string;
    badge_fa?: string;
    badge_en?: string;
    action_url?: string;
    action_text_fa?: string;
    action_text_en?: string;
    is_active: boolean;
    sort_order: number;
    created_at?: string;
    updated_at?: string;
}
