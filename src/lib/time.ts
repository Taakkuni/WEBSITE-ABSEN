import { ShiftType, AttendanceStatus, SystemSettings } from '@/types';

/**
 * Returns the current server date and time according to Asia/Jakarta (WIB) timezone,
 * or simulated time if configured in system settings.
 */
export function getServerTime(settings?: SystemSettings | null) {
  let targetDate: Date;

  if (settings?.simulated_time) {
    targetDate = new Date(settings.simulated_time);
  } else {
    targetDate = new Date();
  }

  // Format to Asia/Jakarta timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(targetDate);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '00';

  const year = parseInt(getPart('year'), 10);
  const month = parseInt(getPart('month'), 10);
  const day = parseInt(getPart('day'), 10);
  const hour = parseInt(getPart('hour'), 10);
  const minute = parseInt(getPart('minute'), 10);
  const second = parseInt(getPart('second'), 10);

  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
  const shortTimeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  const monthNamesId = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];
  const dayNamesId = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  
  // Calculate day of week
  const jsDate = new Date(year, month - 1, day);
  const dayName = dayNamesId[jsDate.getDay()];
  const formattedDateId = `${day} ${monthNamesId[month - 1]} ${year}`;

  return {
    rawDate: targetDate,
    year,
    month,
    day,
    hour,
    minute,
    second,
    dateStr, // YYYY-MM-DD
    timeStr, // HH:mm:ss
    shortTimeStr, // HH:mm
    formattedTimeWib: `${shortTimeStr} WIB`,
    dayName,
    formattedDateId, // e.g. "28 Sep 2026"
  };
}

/**
 * Parses "HH:mm" into total minutes from midnight
 */
export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10));
  return h * 60 + (m || 0);
}

/**
 * Determine shift automatically based on current WIB time
 */
export function determineShift(
  hour: number,
  minute: number,
  defaultShift?: ShiftType | 'AUTO'
): ShiftType {
  if (defaultShift && defaultShift !== 'AUTO') {
    return defaultShift;
  }

  const currentMinutes = hour * 60 + minute;
  // Shift 1 window begins early, cutoff for auto shift 2 is 11:30 WIB
  if (currentMinutes < 11 * 60 + 30) {
    return 'SHIFT_1';
  } else {
    return 'SHIFT_2';
  }
}

/**
 * Determine attendance check-in status (TEPAT_WAKTU vs TERLAMBAT)
 */
export function evaluateCheckInStatus(
  shift: ShiftType,
  hour: number,
  minute: number,
  settings?: SystemSettings | null
): { status: AttendanceStatus; description: string } {
  const currentMinutes = hour * 60 + minute;

  const s1Start = timeToMinutes(settings?.shift1_start || '08:00');
  const s1OnTimeEnd = timeToMinutes(settings?.shift1_on_time_end || '09:00');

  const s2Start = timeToMinutes(settings?.shift2_start || '12:00');
  const s2OnTimeEnd = timeToMinutes(settings?.shift2_on_time_end || '13:00');

  if (shift === 'SHIFT_1') {
    // If check-in is <= 09:00 (on-time window is 08:00 - 09:00)
    // If someone checks in before 08:00, that is also considered on-time / early
    if (currentMinutes <= s1OnTimeEnd) {
      return {
        status: 'TEPAT_WAKTU',
        description: 'Hadir — Tepat Waktu (Jadwal 08:00 - 09:00)',
      };
    } else {
      return {
        status: 'TERLAMBAT',
        description: 'Hadir — Terlambat (Masuk setelah 09:00 WIB)',
      };
    }
  } else {
    // Shift 2: on-time window 12:00 - 13:00
    // Check-in <= 13:00 is on-time
    if (currentMinutes <= s2OnTimeEnd) {
      return {
        status: 'TEPAT_WAKTU',
        description: 'Hadir — Tepat Waktu (Jadwal 12:00 - 13:00)',
      };
    } else {
      return {
        status: 'TERLAMBAT',
        description: 'Hadir — Terlambat (Masuk setelah 13:00 WIB)',
      };
    }
  }
}
