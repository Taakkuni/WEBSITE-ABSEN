import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { getServerTime, timeToMinutes } from '@/lib/time';
import { findBestMatch } from '@/lib/face';
import { evaluateAttendanceDecision } from '@/lib/decision';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employee_id, descriptor, snapshot, bypass_shift_lock } = body;

    const baseSettings = Database.getSettings();
    const settings = {
      ...baseSettings,
      testing_mode: bypass_shift_lock !== undefined ? Boolean(bypass_shift_lock) : Boolean(baseSettings.testing_mode),
    };
    const serverTime = getServerTime(settings);

    let targetEmployee = null;

    if (employee_id) {
      targetEmployee = Database.getEmployeeById(employee_id);
    } else if (descriptor && Array.isArray(descriptor)) {
      const employees = Database.getEmployees();
      const match = findBestMatch(descriptor, employees, settings.threshold);
      if (match.isMatch && match.employee) {
        targetEmployee = match.employee;
      }
    }

    if (!targetEmployee) {
      return NextResponse.json(
        { success: false, code: 'EMPLOYEE_NOT_FOUND', message: 'Identitas karyawan tidak ditemukan atau belum diverifikasi.' },
        { status: 404 }
      );
    }

    if (!targetEmployee.is_active) {
      return NextResponse.json(
        { success: false, code: 'EMPLOYEE_INACTIVE', message: 'Status karyawan tidak aktif. Hubungi bagian HR.' },
        { status: 403 }
      );
    }

    // 1. Get today's attendance
    const existing = Database.getTodayAttendanceForEmployee(targetEmployee.id, serverTime.dateStr);

    // 2. Validate using Attendance Decision Engine
    const decision = evaluateAttendanceDecision(targetEmployee, existing, serverTime, settings);

    // CRITICAL CHECK 1: Check-in required
    if (!existing || !existing.check_in) {
      return NextResponse.json(
        {
          success: false,
          code: 'CHECK_IN_REQUIRED',
          notCheckedIn: true,
          message: 'Anda belum melakukan absensi masuk hari ini.',
          employee: {
            id: targetEmployee.id,
            employee_code: targetEmployee.employee_code,
            name: targetEmployee.name,
            position: targetEmployee.position,
            department: targetEmployee.department,
            photo: targetEmployee.photo,
          },
          decision,
        },
        { status: 400 }
      );
    }

    // CRITICAL CHECK 2: Already checked out
    if (existing.check_out) {
      const formattedPrevTime = `${existing.check_out.substring(0, 5)} WIB`;
      return NextResponse.json(
        {
          success: false,
          code: 'ALREADY_CHECKED_OUT',
          alreadyCheckedOut: true,
          message: `Anda sudah melakukan absensi pulang hari ini pada ${formattedPrevTime}.`,
          attendance: existing,
          employee: {
            id: targetEmployee.id,
            employee_code: targetEmployee.employee_code,
            name: targetEmployee.name,
            position: targetEmployee.position,
            department: targetEmployee.department,
            photo: targetEmployee.photo,
          },
          decision,
        },
        { status: 400 }
      );
    }

    // CRITICAL CHECK 3: Must NOT check out before shift end time!
    if (!decision.canCheckOut || decision.allowedAction !== 'CHECK_OUT') {
      return NextResponse.json(
        {
          success: false,
          code: 'CHECKOUT_NOT_ALLOWED_YET',
          message: `Absensi pulang belum tersedia. Jam pulang shift Anda adalah ${decision.shiftEndTime} WIB (Waktu server saat ini: ${serverTime.formattedTimeWib}).`,
          shiftEndTime: decision.shiftEndTime,
          currentServerTime: serverTime.formattedTimeWib,
          employee: {
            id: targetEmployee.id,
            employee_code: targetEmployee.employee_code,
            name: targetEmployee.name,
            position: targetEmployee.position,
            department: targetEmployee.department,
            photo: targetEmployee.photo,
          },
          decision,
        },
        { status: 400 }
      );
    }

    // 4. Record Check-Out in Database (Only reached if serverTime >= shift.endTime)
    const updated = Database.recordCheckOut(
      targetEmployee.id,
      serverTime.dateStr,
      serverTime.timeStr,
      snapshot
    );

    return NextResponse.json({
      success: true,
      code: 'CHECKOUT_SUCCESS',
      message: 'Absensi Pulang Berhasil!',
      attendance: updated,
      employee: {
        id: targetEmployee.id,
        employee_code: targetEmployee.employee_code,
        name: targetEmployee.name,
        position: targetEmployee.position,
        department: targetEmployee.department,
        photo: targetEmployee.photo,
      },
      checkInTime: `${existing.check_in.substring(0, 5)} WIB`,
      checkOutTime: `${serverTime.shortTimeStr} WIB`,
      status: 'Hadir — Absen Lengkap',
      serverTime: {
        timeStr: serverTime.timeStr,
        formattedTimeWib: serverTime.formattedTimeWib,
        dateStr: serverTime.dateStr,
        formattedDateId: serverTime.formattedDateId,
      },
      decision: {
        ...decision,
        state: 'COMPLETED',
        allowedAction: 'NONE',
        canCheckOut: false,
      }
    });
  } catch (error: any) {
    console.error('Check-out error:', error);
    return NextResponse.json(
      { success: false, code: 'SERVER_ERROR', message: error.message || 'Gagal memproses absensi pulang.' },
      { status: 500 }
    );
  }
}
