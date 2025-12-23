// frontend/src/pages/PersianCalendarPage.tsx
// Professional Persian/Gregorian Calendar with Church Events Integration

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, MapPin, Clock, Users, Share2, Download, Plus, Sparkles, Heart, Navigation, Info, ExternalLink } from 'lucide-react';
import axios from 'axios';

// Jalali/Persian date utilities
const PERSIAN_MONTHS = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

const PERSIAN_MONTH_DAYS = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

const WEEKDAYS = [
    { fa: 'شنبه', en: 'Saturday' },
    { fa: 'یکشنبه', en: 'Sunday' },
    { fa: 'دوشنبه', en: 'Monday' },
    { fa: 'سه‌شنبه', en: 'Tuesday' },
    { fa: 'چهارشنبه', en: 'Wednesday' },
    { fa: 'پنجشنبه', en: 'Thursday' },
    { fa: 'جمعه', en: 'Friday' }
];

// Simplified Jalali conversion (you should use a proper library like moment-jalaali)
function gregorianToJalali(gDate: Date): { year: number; month: number; day: number } {
    // This is a simplified version - use moment-jalaali in production
    const year = gDate.getFullYear();
    const month = gDate.getMonth() + 1;
    const day = gDate.getDate();

    // Rough conversion (replace with actual algorithm)
    const jYear = year - 621;
    const jMonth = month <= 3 ? month + 9 : month - 3;
    const jDay = day;

    return { year: jYear, month: jMonth, day: jDay };
}

function jalaliToGregorian(jYear: number, jMonth: number, jDay: number): Date {
    // Simplified - use proper library
    const gYear = jYear + 621;
    const gMonth = jMonth > 9 ? jMonth - 9 : jMonth + 3;
    return new Date(gYear, gMonth - 1, jDay);
}

interface ChurchEvent {
    id: number;
    title: { en: string; fa: string };
    description: { en: string; fa: string };
    event_date: string;
    start_time?: string;
    end_time?: string;
    location?: string;
    image_url?: string;
    category: string;
    max_attendees?: number;
    is_recurring?: boolean;
}

interface DayInfo {
    gregorian: Date;
    jalali: { year: number; month: number; day: number };
    events: ChurchEvent[];
    isToday: boolean;
    isCurrentMonth: boolean;
    isWeekend: boolean;
}

const PersianCalendarPage: React.FC = () => {
    const today = useMemo(() => new Date(), []);
    const todayJalali = useMemo(() => gregorianToJalali(today), [today]);

    const [currentYear, setCurrentYear] = useState(todayJalali.year);
    const [currentMonth, setCurrentMonth] = useState(todayJalali.month);
    const [selectedDay, setSelectedDay] = useState<DayInfo | null>(null);
    const [churchEvents, setChurchEvents] = useState<ChurchEvent[]>([]);
    const [aiInsight, setAiInsight] = useState<{ fa: string; en: string } | null>(null);
    const [isLoadingInsight, setIsLoadingInsight] = useState(false);
    const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

    // Fetch church events
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await axios.get('/api/events');
                setChurchEvents(response.data.events || []);
            } catch (error) {
                console.error('Failed to fetch events:', error);
            }
        };
        fetchEvents();
    }, []);

    // Generate calendar days
    const calendarDays = useMemo(() => {
        const days: DayInfo[] = [];
        const firstDayOfMonth = jalaliToGregorian(currentYear, currentMonth, 1);
        const dayOfWeek = (firstDayOfMonth.getDay() + 1) % 7; // Saturday = 0

        // Previous month days
        const prevMonthDays = currentMonth === 1 ? 29 : PERSIAN_MONTH_DAYS[currentMonth - 2];
        for (let i = dayOfWeek - 1; i >= 0; i--) {
            const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
            const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
            const day = prevMonthDays - i;
            const gDate = jalaliToGregorian(prevYear, prevMonth, day);

            days.push({
                gregorian: gDate,
                jalali: { year: prevYear, month: prevMonth, day },
                events: [],
                isToday: false,
                isCurrentMonth: false,
                isWeekend: gDate.getDay() === 5 || gDate.getDay() === 6
            });
        }

        // Current month days
        const daysInMonth = PERSIAN_MONTH_DAYS[currentMonth - 1];
        for (let day = 1; day <= daysInMonth; day++) {
            const gDate = jalaliToGregorian(currentYear, currentMonth, day);
            const dateStr = gDate.toISOString().split('T')[0];
            const dayEvents = churchEvents.filter(e => e.event_date === dateStr);

            days.push({
                gregorian: gDate,
                jalali: { year: currentYear, month: currentMonth, day },
                events: dayEvents,
                isToday: gDate.toDateString() === today.toDateString(),
                isCurrentMonth: true,
                isWeekend: gDate.getDay() === 5 || gDate.getDay() === 6
            });
        }

        // Next month days
        const remainingDays = 42 - days.length;
        for (let day = 1; day <= remainingDays; day++) {
            const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
            const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
            const gDate = jalaliToGregorian(nextYear, nextMonth, day);

            days.push({
                gregorian: gDate,
                jalali: { year: nextYear, month: nextMonth, day },
                events: [],
                isToday: false,
                isCurrentMonth: false,
                isWeekend: gDate.getDay() === 5 || gDate.getDay() === 6
            });
        }

        return days;
    }, [currentYear, currentMonth, churchEvents, today]);

    const handleDayClick = async (day: DayInfo) => {
        setSelectedDay(day);
        setAiInsight(null);
        setIsLoadingInsight(true);

        try {
            // Get AI insight for the day
            const response = await axios.post('/api/ai-chat/chat', {
                message: `Generate a brief spiritual insight and prayer for ${PERSIAN_MONTHS[day.jalali.month - 1]} ${day.jalali.day}, ${day.jalali.year} (${day.gregorian.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}). Make it encouraging and relevant to church community. Respond in both Persian and English.`
            });

            const text = response.data.response;
            // Parse response (assuming format: "FA: ... EN: ...")
            const faMatch = text.match(/FA:(.*?)(?:EN:|$)/s);
            const enMatch = text.match(/EN:(.*?)$/s);

            setAiInsight({
                fa: faMatch ? faMatch[1].trim() : 'بینشی برای این روز در دسترس نیست.',
                en: enMatch ? enMatch[1].trim() : 'No insight available for this day.'
            });
        } catch (error) {
            console.error('AI insight error:', error);
            setAiInsight({
                fa: 'خدایا، این روز را با رحمت خود پر کن و ما را در راه خدمت به تو هدایت فرما.',
                en: 'Lord, fill this day with Your mercy and guide us in serving You.'
            });
        } finally {
            setIsLoadingInsight(false);
        }
    };

    const goToNextMonth = () => {
        if (currentMonth === 12) {
            setCurrentMonth(1);
            setCurrentYear(y => y + 1);
        } else {
            setCurrentMonth(m => m + 1);
        }
    };

    const goToPrevMonth = () => {
        if (currentMonth === 1) {
            setCurrentMonth(12);
            setCurrentYear(y => y - 1);
        } else {
            setCurrentMonth(m => m - 1);
        }
    };

    const goToToday = () => {
        setCurrentYear(todayJalali.year);
        setCurrentMonth(todayJalali.month);
    };

    const exportToGoogleCalendar = (event: ChurchEvent) => {
        const startDate = new Date(event.event_date);
        const endDate = new Date(startDate);

        if (event.start_time) {
            const [hours, minutes] = event.start_time.split(':');
            startDate.setHours(parseInt(hours), parseInt(minutes));
        }

        if (event.end_time) {
            const [hours, minutes] = event.end_time.split(':');
            endDate.setHours(parseInt(hours), parseInt(minutes));
        } else {
            endDate.setHours(startDate.getHours() + 2);
        }

        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: event.title.en,
            details: event.description.en,
            location: event.location || 'Iranian Christian Church of D.C.',
            dates: `${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`
        });

        window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank');
    };

    const downloadICS = (event: ChurchEvent) => {
        const startDate = new Date(event.event_date);
        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Iranian Christian Church//Calendar//EN
BEGIN:VEVENT
UID:${event.id}@iranianchurchdc.org
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${event.title.en}
DESCRIPTION:${event.description.en}
LOCATION:${event.location || 'Iranian Christian Church of D.C.'}
END:VEVENT
END:VCALENDAR`;

        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${event.title.en.replace(/\s+/g, '_')}.ics`;
        a.click();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50" dir="rtl">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/50 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Calendar className="w-10 h-10 text-secondary" />
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">
                                    تقویم کلیسا
                                </h1>
                                <p className="text-sm text-gray-500">Church Calendar</p>
                            </div>
                        </div>

                        {/* View Mode Toggle */}
                        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('month')}
                                className={`px-4 py-2 rounded text-sm font-medium transition ${viewMode === 'month' ? 'bg-white shadow text-secondary' : 'text-gray-600'
                                    }`}
                            >
                                ماه
                            </button>
                            <button
                                onClick={() => setViewMode('week')}
                                className={`px-4 py-2 rounded text-sm font-medium transition ${viewMode === 'week' ? 'bg-white shadow text-secondary' : 'text-gray-600'
                                    }`}
                            >
                                هفته
                            </button>
                            <button
                                onClick={() => setViewMode('day')}
                                className={`px-4 py-2 rounded text-sm font-medium transition ${viewMode === 'day' ? 'bg-white shadow text-secondary' : 'text-gray-600'
                                    }`}
                            >
                                روز
                            </button>
                        </div>
                    </div>

                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mt-6">
                        <button
                            onClick={goToPrevMonth}
                            className="p-3 hover:bg-gray-100 rounded-full transition"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>

                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-800">
                                {PERSIAN_MONTHS[currentMonth - 1]} {currentYear}
                            </h2>
                            <p className="text-sm text-gray-500">
                                {jalaliToGregorian(currentYear, currentMonth, 15).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </p>
                        </div>

                        <button
                            onClick={goToNextMonth}
                            className="p-3 hover:bg-gray-100 rounded-full transition"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex justify-center mt-4">
                        <button
                            onClick={goToToday}
                            className="px-6 py-2 bg-secondary text-white rounded-full text-sm font-medium hover:bg-secondary/90 transition"
                        >
                            امروز
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="container mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Calendar */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-3xl shadow-xl p-6">
                            {/* Weekday Headers */}
                            <div className="grid grid-cols-7 gap-2 mb-4">
                                {WEEKDAYS.map(day => (
                                    <div key={day.en} className="text-center py-3">
                                        <div className="text-sm font-bold text-gray-700">{day.fa}</div>
                                        <div className="text-xs text-gray-400">{day.en}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Days Grid */}
                            <div className="grid grid-cols-7 gap-2">
                                {calendarDays.map((day, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => day.isCurrentMonth && handleDayClick(day)}
                                        className={`
                      relative aspect-square p-2 rounded-xl border-2 transition-all cursor-pointer
                      ${!day.isCurrentMonth ? 'opacity-30 pointer-events-none' : ''}
                      ${day.isToday ? 'border-secondary bg-secondary/10' : 'border-gray-100'}
                      ${day.isWeekend ? 'bg-red-50/30' : 'bg-white'}
                      ${day.events.length > 0 ? 'border-purple-300' : ''}
                      hover:shadow-lg hover:scale-105
                    `}
                                    >
                                        <div className="flex flex-col h-full">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`
                          text-lg font-bold
                          ${day.isToday ? 'text-secondary' : day.isWeekend ? 'text-red-500' : 'text-gray-700'}
                        `}>
                                                    {day.jalali.day}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {day.gregorian.getDate()}
                                                </span>
                                            </div>

                                            {/* Event Indicators */}
                                            <div className="flex-1 overflow-hidden">
                                                {day.events.slice(0, 2).map((event, i) => (
                                                    <div
                                                        key={i}
                                                        className="text-xs truncate mb-1 px-1 py-0.5 bg-purple-100 text-purple-700 rounded"
                                                    >
                                                        {event.title.fa}
                                                    </div>
                                                ))}
                                                {day.events.length > 2 && (
                                                    <div className="text-xs text-gray-500">
                                                        +{day.events.length - 2} بیشتر
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - Selected Day Info */}
                    <div className="lg:col-span-1">
                        {selectedDay ? (
                            <div className="bg-white rounded-3xl shadow-xl p-6 sticky top-32">
                                <div className="mb-6">
                                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                                        {selectedDay.jalali.day} {PERSIAN_MONTHS[selectedDay.jalali.month - 1]}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {selectedDay.gregorian.toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>

                                {/* AI Insight */}
                                <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Sparkles className="w-5 h-5 text-purple-600" />
                                        <h4 className="font-bold text-purple-900">بینش روز</h4>
                                    </div>
                                    {isLoadingInsight ? (
                                        <div className="space-y-2 animate-pulse">
                                            <div className="h-3 bg-purple-200 rounded w-full"></div>
                                            <div className="h-3 bg-purple-200 rounded w-4/5"></div>
                                        </div>
                                    ) : aiInsight ? (
                                        <div className="space-y-3">
                                            <p className="text-sm text-gray-700 leading-relaxed">
                                                {aiInsight.fa}
                                            </p>
                                            <p className="text-xs text-gray-500 leading-relaxed" dir="ltr">
                                                {aiInsight.en}
                                            </p>
                                        </div>
                                    ) : null}
                                </div>

                                {/* Events */}
                                <div>
                                    <h4 className="font-bold text-gray-800 mb-4">
                                        رویدادها ({selectedDay.events.length})
                                    </h4>

                                    {selectedDay.events.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400">
                                            <Info className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">رویدادی برای این روز وجود ندارد</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {selectedDay.events.map(event => (
                                                <div key={event.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                                    <h5 className="font-bold text-gray-800 mb-2">
                                                        {event.title.fa}
                                                    </h5>
                                                    <p className="text-sm text-gray-600 mb-3">
                                                        {event.description.fa}
                                                    </p>

                                                    {event.start_time && (
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                                            <Clock className="w-4 h-4" />
                                                            {event.start_time} {event.end_time && `- ${event.end_time}`}
                                                        </div>
                                                    )}

                                                    {event.location && (
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                                            <MapPin className="w-4 h-4" />
                                                            {event.location}
                                                        </div>
                                                    )}

                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => exportToGoogleCalendar(event)}
                                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition"
                                                        >
                                                            <Calendar className="w-4 h-4" />
                                                            Google
                                                        </button>
                                                        <button
                                                            onClick={() => downloadICS(event)}
                                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 text-white rounded-lg text-xs hover:bg-gray-800 transition"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                            Download
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
                                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <p className="text-gray-500">
                                    روزی را از تقویم انتخاب کنید
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PersianCalendarPage;
