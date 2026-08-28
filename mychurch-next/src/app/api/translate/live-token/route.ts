import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Generates an Ephemeral Auth Token for Gemini Live Translation API (v1alpha).
 * This allows client-side browsers to establish direct, ultra-low latency WebSockets
 * with Google's Gemini Live API without exposing the server's GEMINI_API_KEY.
 */
export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured on the server.' },
        { status: 500 }
      );
    }

    const { targetLanguage = 'en', echoTargetLanguage = true } = await request.json().catch(() => ({}));

    // Target duration: 30 minutes
    const now = new Date();
    const expireTime = new Date(now.getTime() + 30 * 60 * 1000).toISOString();

    const payload = {
      uses: 10,
      expireTime: expireTime,
      liveConnectConstraints: {
        model: 'models/gemini-3.5-live-translate-preview',
        config: {
          responseModalities: ['AUDIO'],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          translationConfig: {
            targetLanguageCode: targetLanguage,
            echoTargetLanguage: echoTargetLanguage,
          },
        },
      },
    };

    // Google Generative Language v1alpha ephemeral tokens endpoint
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1alpha/authTokens?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.warn('[Gemini Live Token] API error:', response.status, errText);
      // Fallback: return direct connection info if ephemeral token is unavailable
      return NextResponse.json({
        success: true,
        useDirectWs: true,
        model: 'gemini-3.5-live-translate-preview',
        targetLanguage,
      });
    }

    const tokenData = await response.json();

    return NextResponse.json({
      success: true,
      token: tokenData.name || tokenData.token,
      expireTime,
      model: 'gemini-3.5-live-translate-preview',
      targetLanguage,
    });
  } catch (error: any) {
    console.error('[Gemini Live Token] Exception:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create ephemeral live token' },
      { status: 500 }
    );
  }
}
