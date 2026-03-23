import { NextResponse } from 'next/server';
import { extractWorshipSongAI } from '@/actions/worship';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || '6b7fc51c-ddec-4518-af28-2a25d19c7c34';
  
  try {
    const result = await extractWorshipSongAI(id);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
