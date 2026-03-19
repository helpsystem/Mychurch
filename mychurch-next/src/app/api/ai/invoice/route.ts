import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { input } = await req.json();

    if (!input || !input.trim()) {
      return NextResponse.json({ error: 'Input is required' }, { status: 400 });
    }

    // Temporary mock to prevent build crashing due to missing @google/genai SDK
    // Next.js build was crashing because this package isn't in package.json.
    console.log("Mock Invoice Request:", input);

    return NextResponse.json({ items: [{ description: "Mocked Item", total: 0 }] });
  } catch (error: any) {
    console.error('Invoice AI Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to parse invoice' }, { status: 500 });
  }
}
