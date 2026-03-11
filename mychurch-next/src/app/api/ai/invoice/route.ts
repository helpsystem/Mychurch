import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

export async function POST(req: Request) {
  try {
    const { input } = await req.json();

    if (!input || !input.trim()) {
      return NextResponse.json({ error: 'Input is required' }, { status: 400 });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "",
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: `Parse the following text into invoice items. The text might be in Persian or English. Extract the description of the work (e.g., "vid", "report", "photo") and the total price for that item. If a quantity and unit price are mentioned, calculate the total.
      
      Text: "${input}"`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              description: {
                type: Type.STRING,
                description: "The description of the work, e.g., 'vid', 'report', 'photo', 'video editing', etc.",
              },
              total: {
                type: Type.NUMBER,
                description: "The total price for this item.",
              },
            },
            required: ["description", "total"],
          },
        },
      },
    });

    const jsonStr = response.text?.trim() || "[]";
    const parsedItems = JSON.parse(jsonStr);
    
    return NextResponse.json({ items: parsedItems });
  } catch (error: any) {
    console.error('Invoice AI Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to parse invoice' }, { status: 500 });
  }
}
