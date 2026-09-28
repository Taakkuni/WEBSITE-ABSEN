import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { ShiftType } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      mode, // 'NEW_EMPLOYEE' | 'EXISTING_EMPLOYEE'
      employee_id,
      employee_code,
      name,
      email,
      phone,
      position,
      department,
      default_shift,
      face_embedding,
      photo,
    } = body;

    if (!face_embedding || !Array.isArray(face_embedding) || face_embedding.length !== 128) {
      return NextResponse.json(
        {
          success: false,
          message: 'Vektor biometrik wajah (128-vektor) tidak terdeteksi. Posisikan wajah tepat di depan kamera.',
        },
        { status: 400 }
      );
    }

    // CASE 1: Link face to an existing employee profile
    if (mode === 'EXISTING_EMPLOYEE' && employee_id) {
      const existing = Database.getEmployeeById(employee_id);
      if (!existing) {
        return NextResponse.json(
          { success: false, message: 'Karyawan yang dipilih tidak ditemukan.' },
          { status: 404 }
        );
      }

      const updated = Database.updateFaceEmbedding(employee_id, face_embedding, photo);

      return NextResponse.json({
        success: true,
        message: `Biometrik wajah berhasil didaftarkan untuk ${updated.name} (${updated.employee_code})!`,
        employee: updated,
      });
    }

    // CASE 2: Create a brand new employee with face attached
    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: 'Nama lengkap karyawan wajib diisi.' },
        { status: 400 }
      );
    }

    // Generate code if not provided
    const allEmployees = Database.getEmployees();
    const finalCode = (employee_code && employee_code.trim())
      ? employee_code.trim().toUpperCase()
      : `EMP${String(allEmployees.length + 1).padStart(3, '0')}`;

    const newEmp = Database.createEmployee({
      employee_code: finalCode,
      name: name.trim(),
      email: email ? email.trim() : `${name.toLowerCase().replace(/\s+/g, '.')}@perusahaan.co.id`,
      phone: phone ? phone.trim() : '08123456789',
      position: position && position.trim() ? position.trim() : 'Staff Operasional',
      department: department && department.trim() ? department.trim() : 'General',
      photo: photo || null,
      face_embedding: face_embedding,
      is_active: true,
      default_shift: (default_shift as ShiftType) || 'SHIFT_1',
    });

    return NextResponse.json({
      success: true,
      message: `Selamat, akun karyawan baru "${newEmp.name}" (${newEmp.employee_code}) berhasil dibuat dengan biometrik wajah!`,
      employee: newEmp,
    });
  } catch (error: any) {
    console.error('Register face error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mendaftarkan data wajah karyawan.' },
      { status: 500 }
    );
  }
}
