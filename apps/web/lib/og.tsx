import { ImageResponse } from 'next/og';

export const OG_SIZE = { width: 1200, height: 630 };

/** Visuel Open Graph aux couleurs CLS Travel (aucune ressource externe : rendu fiable). */
export function ogImage({ eyebrow, title, footer, badge }: { eyebrow: string; title: string; footer?: string; badge?: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: 'linear-gradient(135deg, #0F2236 0%, #1C3A5E 55%, #B8872A 140%)',
          color: '#FFFFFF',
          fontFamily: 'serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 56, height: 56, borderRadius: 28, background: '#B8872A', display: 'flex' }} />
          <div style={{ fontSize: 36, fontWeight: 700, display: 'flex' }}>
            CLS <span style={{ color: '#D9A84A', marginLeft: 10 }}>Travel</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 28, color: '#D9A84A', textTransform: 'uppercase', letterSpacing: 3, display: 'flex' }}>{eyebrow}</div>
          <div style={{ fontSize: title.length > 60 ? 56 : 68, fontWeight: 700, lineHeight: 1.1, display: 'flex' }}>{title}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 30 }}>
          <div style={{ display: 'flex', opacity: 0.9 }}>{footer ?? 'carthagoloisirs.com'}</div>
          {badge && (
            <div style={{ display: 'flex', background: '#C85A2A', borderRadius: 12, padding: '12px 26px', fontWeight: 700 }}>{badge}</div>
          )}
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
