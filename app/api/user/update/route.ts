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
            where: { id: userSession.id },
            include: { password: true }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const userUpdateData: { name?: string; email?: string; emailVerified?: null } = {}

        if (name) userUpdateData.name = name
        if (email && email !== user.email) {
            const taken = await prisma.user.findUnique({ where: { email }, select: { id: true } })
            if (taken) {
                return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
            }
            userUpdateData.email = email
            userUpdateData.emailVerified = null
        }

        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json({ error: 'Current password is required to set a new password' }, { status: 400 })
            }

            if (!user.password) {
                return NextResponse.json({ error: 'No password set for this account' }, { status: 400 })
            }

            const isValid = await verify(user.password.hash, currentPassword)

            if (!isValid) {
                return NextResponse.json({ error: 'Invalid current password' }, { status: 400 })
            }

            const newHash = await hash(newPassword)
            await prisma.password.update({
                where: { userId: userSession.id },
                data: { hash: newHash }
            })
        }

        const updatedUser = await prisma.user.update({
            where: { id: userSession.id },
            data: userUpdateData,
            select: {
                id: true,
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
