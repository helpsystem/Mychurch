// frontend/src/utils/jalaliUtils.ts
// Persian Calendar Utilities with moment-jalaali

import moment from 'moment-jalaali';

moment.loadPersian({ usePersianDigits: false });

export interface JalaliDate {
  year: number;
  month: number;
  day: number;
  monthName: string;
  dayName: string;
}

export function gregorianToJalali(date: Date): JalaliDate {
  const m = moment(date);

  return {
    year: m.jYear(),
    month: m.jMonth() + 1, // jMonth is 0-based
    day: m.jDate(),
    monthName: m.format('jMMMM'),
    dayName: m.format('dddd')
  };
}

export function jalaliToGregorian(year: number, month: number, day: number): Date {
  return moment(`${year}/${month}/${day}`, 'jYYYY/jM/jD').toDate();
}

export function getFirstDayOfJalaliMonth(year: number, month: number): Date {
  return jalaliToGregorian(year, month, 1);
}

export function getDaysInJalaliMonth(year: number, month: number): number {
  return moment.jDaysInMonth(year, month - 1);
}

export function getSeason(month: number): 'spring' | 'summer' | 'fall' | 'winter' {
  if (month >= 1 && month <= 3) return 'spring';
  if (month >= 4 && month <= 6) return 'summer';
  if (month >= 7 && month <= 9) return 'fall';
  return 'winter';
}

export function isLeapYear(year: number): boolean {
  return moment.jIsLeapYear(year);
}

export const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

export const PERSIAN_WEEKDAYS = [
  { fa: 'شنبه', en: 'Saturday' },
  { fa: 'یکشنبه', en: 'Sunday' },
  { fa: 'دوشنبه', en: 'Monday' },
  { fa: 'سه‌شنبه', en: 'Tuesday' },
  { fa: 'چهارشنبه', en: 'Wednesday' },
  { fa: 'پنجشنبه', en: 'Thursday' },
  { fa: 'جمعه', en: 'Friday' }
];

// Format Persian date for display
export function formatPersianDate(date: Date, format: string = 'jYYYY/jM/jD'): string {
  return moment(date).format(format);
}

// Get today in Jalali
export function getTodayJalali(): JalaliDate {
  return gregorianToJalali(new Date());
}
