import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'
import { hash, verify } from '@node-rs/argon2'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
    try {
        const userSession = await getServerUser()

        if (!userSession?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 10 profile update attempts per hour per user
        const rateLimitResponse = checkRateLimit(`user-update:${userSession.id}`, 10, 60 * 60 * 1000)
        if (rateLimitResponse) return rateLimitResponse

        const body = await request.json()
        const { name, email, currentPassword, newPassword } = body

        const user = await prisma.user.findUnique({
            where: { userId: userSession.id }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const updateData: { name?: string; email?: string; hash?: string; emailVerified?: null } = {}

        if (name) updateData.name = name
        if (email && email !== user.email) {
            updateData.email = email
            updateData.emailVerified = null
        }

        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json({ error: 'Current password is required to set a new password' }, { status: 400 })
            }

            const isValid = await verify(user.hash, currentPassword)

            if (!isValid) {
                return NextResponse.json({ error: 'Invalid current password' }, { status: 400 })
            }

            const newHash = await hash(newPassword)
            updateData.hash = newHash
        }

        const updatedUser = await prisma.user.update({
            where: { userId: userSession.id },
            data: updateData,
            select: {
                id: true,
                userId: true,
                name: true,
                email: true
            }
        })

        return NextResponse.json({ user: updatedUser })
    } catch (error) {
        console.error('Profile update error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
