import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'
import { RATE_LIMIT_USER_DELETE } from '@/lib/constants'
import { checkRateLimit } from '@/lib/rate-limit'

export async function DELETE() {
  try {
    const userSession = await getServerUser()

    if (!userSession?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimitResponse = checkRateLimit(`user-delete:${userSession.id}`, RATE_LIMIT_USER_DELETE.max, RATE_LIMIT_USER_DELETE.window)
    if (rateLimitResponse) return rateLimitResponse

    await prisma.user.delete({
      where: { id: userSession.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
