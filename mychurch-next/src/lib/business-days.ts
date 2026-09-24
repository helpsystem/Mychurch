/**
 * Adds N business days (Mon–Fri) to a date, skipping weekends.
 * Used to schedule the local-disk cleanup of published session recordings.
 */
export function addBusinessDays(date: Date, days: number): Date {
    const result = new Date(date.getTime());
    let remaining = days;
    while (remaining > 0) {
        result.setDate(result.getDate() + 1);
        const dayOfWeek = result.getDay(); // 0 = Sunday, 6 = Saturday
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            remaining -= 1;
        }
    }
    return result;
}
