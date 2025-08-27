import { ScheduleEvent, Language } from '../types';

function formatToICSDate(dateStr: string, timeStr: string): string {
  // Combine date and time to create a valid date object in local time
  const localDate = new Date(`${dateStr}T${timeStr}:00`);
  if (isNaN(localDate.getTime())) {
    return '';
  }
  // Convert to UTC and format as YYYYMMDDTHHMMSSZ
  return localDate.toISOString().replace(/[-:]|\.\d{3}/g, '');
}

export function downloadIcsFile(event: ScheduleEvent, lang: Language) {
  const startDate = formatToICSDate(event.date, event.startTime);
  const endDate = formatToICSDate(event.date, event.endTime);
  const now = new Date().toISOString().replace(/[-:]|\.\d{3}/g, '');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ICCDC//Website Event//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@iccdc.com`,
    `DTSTAMP:${now}`,
    `DTSTART:${startDate}`,
    `DTEND:${endDate}`,
    `SUMMARY:${event.title[lang]}`,
    `DESCRIPTION:${event.description[lang]}`,
    `LOCATION:${event.location}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${event.title.en.replace(/\s/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
