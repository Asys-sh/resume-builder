import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 32,
        height: 32,
        background: '#d4a373',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        fontWeight: 900,
        color: '#1e293b',
        fontFamily: 'sans-serif',
        letterSpacing: '-1px',
      }}
    >
      R
    </div>,
    { ...size },
  )
}
