import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    <div
      style={{
        width: 1200,
        height: 630,
        background: '#fdf8f0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif',
        padding: 80,
      }}
    >
      {/* Logo badge */}
      <div
        style={{
          width: 80,
          height: 80,
          background: '#d4a373',
          borderRadius: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 48,
          fontWeight: 900,
          color: '#1e293b',
          marginBottom: 32,
        }}
      >
        R
      </div>

      <div
        style={{
          fontSize: 64,
          fontWeight: 900,
          color: '#1e293b',
          marginBottom: 20,
          letterSpacing: '-2px',
        }}
      >
        RoboResume
      </div>

      <div
        style={{
          fontSize: 28,
          color: '#475569',
          textAlign: 'center',
          maxWidth: 700,
          lineHeight: 1.4,
        }}
      >
        AI-powered resume builder. Land your next job in minutes.
      </div>

      {/* Bottom tag */}
      <div
        style={{
          marginTop: 48,
          background: '#d4a373',
          borderRadius: 100,
          padding: '12px 32px',
          fontSize: 22,
          fontWeight: 700,
          color: '#1e293b',
        }}
      >
        Free to get started
      </div>
    </div>,
    { ...size },
  )
}
