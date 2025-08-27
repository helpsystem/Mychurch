import React from 'react';

interface Props {
    dateStr: string; // Expects "YYYY-MM-DD"
    timeRange?: string; // Optional "HH:MM - HH:MM"
}

const BilingualDateDisplay: React.FC<Props> = ({ dateStr, timeRange }) => {
    try {
        // Date object needs to be created carefully to avoid timezone issues.
        // Using UTC to be consistent.
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));

        if (isNaN(date.getTime())) {
            throw new Error("Invalid date string provided");
        }
        
        // English (Gregorian) parts
        const dayOfMonth = date.getUTCDate();
        const monthNameEn = date.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' }).toUpperCase();

        // Farsi (Jalali) part
        const dateFa = new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'UTC'
        }).format(date);

        return (
            <div className="text-center font-semibold text-white">
                {timeRange && <div className="text-sm text-dimWhite tracking-wider mb-1">{timeRange}</div>}
                <div className="text-4xl font-bold leading-none">{dayOfMonth}</div>
                <div className="text-lg tracking-widest">{monthNameEn}</div>
                <div className="w-10 h-px bg-gray-600 my-1.5 mx-auto"></div>
                <div className="text-sm text-secondary">{dateFa}</div>
            </div>
        );
    } catch (error) {
        console.error("Error formatting date:", dateStr, error);
        return <div className="text-red-500 text-xs">Invalid Date</div>;
    }
};

export default BilingualDateDisplay;