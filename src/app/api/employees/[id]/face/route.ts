import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { embedding, photo } = body;

    if (!embedding || !Array.isArray(embedding) || embedding.length !== 128) {
      return NextResponse.json(
        {
          success: false,
          message: 'Vektor embedding wajah tidak valid. Wajah harus terdeteksi dengan tepat.',
        },
        { status: 400 }
      );
    }

    const updated = Database.updateFaceEmbedding(params.id, embedding, photo);

    return NextResponse.json({
      success: true,
      message: 'Wajah karyawan berhasil didaftarkan ke sistem biometric.',
      data: {
        id: updated.id,
        employee_code: updated.employee_code,
        name: updated.name,
        hasFaceRegistered: true,
        photo: updated.photo,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mendaftarkan wajah karyawan.' },
      { status: 400 }
    );
  }
}
