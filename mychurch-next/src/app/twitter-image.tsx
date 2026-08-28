import { ImageResponse } from 'next/og';

export const alt = 'کلیسای مسیحی ایرانیان واشنگتن دی‌سی | Iranian Christian Church DC';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#050A0F',
          backgroundImage:
            'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(245, 166, 35, 0.18) 0%, transparent 70%), radial-gradient(circle at 10% 90%, rgba(96, 165, 250, 0.12) 0%, transparent 50%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          padding: '60px',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {/* Subtle decorative border */}
        <div
          style={{
            position: 'absolute',
            inset: '24px',
            border: '1px solid rgba(245, 166, 35, 0.25)',
            borderRadius: '28px',
            pointerEvents: 'none',
          }}
        />

        {/* Top badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 24px',
            borderRadius: '9999px',
            background: 'rgba(245, 166, 35, 0.1)',
            border: '1px solid rgba(245, 166, 35, 0.3)',
            color: '#F5A623',
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '28px',
          }}
        >
          <span>✦ EST. 1990 ✦</span>
        </div>

        {/* Persian Main Title */}
        <div
          style={{
            fontSize: '54px',
            fontWeight: 900,
            color: '#FFFFFF',
            textAlign: 'center',
            lineHeight: 1.2,
            marginBottom: '16px',
            letterSpacing: '-0.02em',
          }}
        >
          کلیسای انجیلی ایرانیان واشنگتن دی‌سی
        </div>

        {/* English Subtitle */}
        <div
          style={{
            fontSize: '28px',
            fontWeight: 600,
            color: '#F5A623',
            textAlign: 'center',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom: '32px',
          }}
        >
          Iranian Presbyterian Church of Washington D.C.
        </div>

        {/* Features bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            fontSize: '18px',
            color: '#94A3B8',
          }}
        >
          <span>پخش زنده یکشنبه‌ها</span>
          <span>•</span>
          <span>کتاب مقدس فارسی</span>
          <span>•</span>
          <span>سرودهای پرستشی</span>
          <span>•</span>
          <span>مواعظ و تعلیمات</span>
        </div>

        {/* URL tag */}
        <div
          style={{
            position: 'absolute',
            bottom: '44px',
            fontSize: '16px',
            color: 'rgba(255, 255, 255, 0.4)',
            letterSpacing: '0.08em',
          }}
        >
          iranianchurchdc.com
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
