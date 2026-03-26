import crypto from 'node:crypto'
import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth-helper'
import { RATE_LIMIT_UPLOAD_SIGN } from '@/lib/constants'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST() {
  try {
    const user = await getServerUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limited = checkRateLimit('upload-sign:' + user.id, RATE_LIMIT_UPLOAD_SIGN.max, RATE_LIMIT_UPLOAD_SIGN.window)
    if (limited) return limited

    const apiSecret = process.env.CLOUDINARY_API_SECRET
    const apiKey = process.env.CLOUDINARY_API_KEY
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

    if (!apiSecret || !apiKey || !cloudName) {
      return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 503 })
    }

    const folder = user.id
    const timestamp = Math.round(Date.now() / 1000)

    // Build the string to sign — must be sorted alphabetically
    const params: Record<string, string | number> = {
      folder,
      signature_algorithm: 'sha256',
      timestamp,
    }

    const signatureString =
      Object.keys(params)
        .sort()
        .map((k) => `${k}=${params[k]}`)
        .join('&') + apiSecret

    const signature = crypto.createHash('sha256').update(signatureString).digest('hex')

    return NextResponse.json({ signature, timestamp, apiKey, cloudName, folder, signatureAlgorithm: 'sha256' })
  } catch (error) {
    console.error('Error signing upload:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
