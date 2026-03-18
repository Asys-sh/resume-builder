import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'

export async function DELETE() {
    try {
        const userSession = await getServerUser()

        if (!userSession?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 3 deletion attempts per hour — destructive action, strict limit
        const rateLimitResponse = checkRateLimit(`user-delete:${userSession.id}`, 3, 60 * 60 * 1000)
        if (rateLimitResponse) return rateLimitResponse

        await prisma.user.delete({
            where: { id: userSession.id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Account deletion error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
