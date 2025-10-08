import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Image generation
export default async function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 18,
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#1a28c2',
          fontWeight: 700,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            fontSize: 16,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '-2px',
          }}
        >
          <span>L</span>
          <span style={{ marginLeft: '-4px' }}>L</span>
        </div>
        {/* Simple washing machine icon */}
        <div
          style={{
            position: 'absolute',
            top: '4px',
            left: '4px',
            width: '8px',
            height: '8px',
            border: '1px solid #1a28c2',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              border: '1px solid #1a28c2',
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
