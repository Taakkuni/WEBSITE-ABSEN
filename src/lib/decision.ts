import { Employee, Attendance, SystemSettings, AttendanceDecision, ShiftType } from '@/types';
import { timeToMinutes, determineShift } from './time';

/**
 * ATTENDANCE DECISION ENGINE
 * 
 * Fundamental Rule: FACE RECOGNITION != ATTENDANCE ACTION
 * 
 * This engine takes the verified employee, today's attendance record, employee shift,
 * and current server time to determine the strictly allowed attendance action.
 */
export function evaluateAttendanceDecision(
  employee: Employee,
  todayAttendance: Attendance | null,
  serverTime: { hour: number; minute: number; shortTimeStr: string; formattedTimeWib: string },
  settings?: SystemSettings | null
): AttendanceDecision {
  // Determine shift
  let shift: ShiftType;
  if (todayAttendance) {
    shift = todayAttendance.shift;
  } else {
    shift = determineShift(serverTime.hour, serverTime.minute, employee.default_shift);
  }

  // Get shift schedule
  const shiftStartTime = shift === 'SHIFT_1' 
    ? (settings?.shift1_start || '08:00') 
    : (settings?.shift2_start || '12:00');

  const shiftEndTime = shift === 'SHIFT_1' 
    ? (settings?.shift1_end || '16:00') 
    : (settings?.shift2_end || '20:00');

  const currentMinutes = serverTime.hour * 60 + serverTime.minute;
  const shiftEndMinutes = timeToMinutes(shiftEndTime);

  // CASE 1: No Attendance Today -> Allowed Action is CHECK_IN
  if (!todayAttendance) {
    return {
      state: 'NO_ATTENDANCE',
      allowedAction: 'CHECK_IN',
      canCheckIn: true,
      canCheckOut: false,
      reason: 'BELUM_ABSEN_MASUK',
      message: 'Karyawan belum melakukan absensi masuk hari ini. Silakan lakukan absensi masuk.',
      shift,
      shiftStartTime,
      shiftEndTime,
      currentServerTime: serverTime.formattedTimeWib,
      checkInTime: null,
      checkOutTime: null,
    };
  }

  // CASE 2: Checked In, but Not Yet Checked Out
  if (todayAttendance.check_in && !todayAttendance.check_out) {
    const formattedCheckIn = `${todayAttendance.check_in.substring(0, 5)} WIB`;
    const isTestingMode = settings?.testing_mode === true || settings?.bypass_shift_lock === true;

    // TESTING MODE: Allows instant check-out anytime without waiting for 16:00!
    if (isTestingMode) {
      return {
        state: 'CHECKOUT_ALLOWED',
        allowedAction: 'CHECK_OUT',
        canCheckIn: false,
        canCheckOut: true,
        reason: 'TESTING_MODE_CHECKOUT_ALLOWED',
        message: `[Mode Testing Aktif] Jam pulang dibebaskan (Bypass ${shiftEndTime} WIB). Anda dapat melakukan absensi pulang kapan saja.`,
        shift,
        shiftStartTime,
        shiftEndTime,
        currentServerTime: serverTime.formattedTimeWib,
        checkInTime: formattedCheckIn,
        checkOutTime: null,
      };
    }

    // Normal Production Rule: BEFORE SHIFT END TIME -> CHECK_OUT IS STRICTLY FORBIDDEN!
    if (currentMinutes < shiftEndMinutes) {
      return {
        state: 'WAITING_FOR_CHECKOUT',
        allowedAction: 'NONE', // MUST NOT CHECK-OUT!
        canCheckIn: false,
        canCheckOut: false,
        reason: 'WAITING_FOR_CHECKOUT',
        message: `Anda sudah melakukan absensi masuk pada ${formattedCheckIn}. Jam pulang shift adalah ${shiftEndTime} WIB (belum waktunya absensi pulang).`,
        shift,
        shiftStartTime,
        shiftEndTime,
        currentServerTime: serverTime.formattedTimeWib,
        checkInTime: formattedCheckIn,
        checkOutTime: null,
      };
    }

    // Rule: AT OR AFTER SHIFT END TIME -> CHECK_OUT IS ALLOWED
    return {
      state: 'CHECKOUT_ALLOWED',
      allowedAction: 'CHECK_OUT',
      canCheckIn: false,
      canCheckOut: true,
      reason: 'CHECKOUT_ALLOWED',
      message: `Jam pulang shift telah tiba (${shiftEndTime} WIB). Anda diperbolehkan melakukan absensi pulang.`,
      shift,
      shiftStartTime,
      shiftEndTime,
      currentServerTime: serverTime.formattedTimeWib,
      checkInTime: formattedCheckIn,
      checkOutTime: null,
    };
  }

  // CASE 3: Already Completed (Check-in and Check-out done) -> LOCKED
  const formattedCheckIn = `${todayAttendance.check_in.substring(0, 5)} WIB`;
  const formattedCheckOut = `${todayAttendance.check_out?.substring(0, 5)} WIB`;

  return {
    state: 'COMPLETED',
    allowedAction: 'NONE',
    canCheckIn: false,
    canCheckOut: false,
    reason: 'ALREADY_COMPLETED',
    message: `Absensi hari ini sudah lengkap (Masuk: ${formattedCheckIn}, Pulang: ${formattedCheckOut}). Terima kasih!`,
    shift,
    shiftStartTime,
    shiftEndTime,
    currentServerTime: serverTime.formattedTimeWib,
    checkInTime: formattedCheckIn,
    checkOutTime: formattedCheckOut,
  };
}
