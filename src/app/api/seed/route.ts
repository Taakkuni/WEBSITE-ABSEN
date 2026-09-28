import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    const dbFile = path.join(process.cwd(), 'data', 'database.json');
    if (fs.existsSync(dbFile)) {
      fs.unlinkSync(dbFile);
    }
    return NextResponse.json({
      success: true,
      message: 'Database berhasil di-reset ke data bawaan (seed data).',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mereset data.' },
      { status: 500 }
    );
  }
}
