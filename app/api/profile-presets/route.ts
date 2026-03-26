import { type NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'
import { ProfilePresetCreateSchema, parseBody } from '@/lib/schemas'
import { PROFILE_PRESETS_MAX } from '@/lib/constants'
import { sanitizePresetData } from '@/lib/sanitize'

export async function GET() {
  try {
    const user = await getServerUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const presets = await prisma.profilePreset.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ presets })
  } catch (error) {
    console.error('Error fetching profile presets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getServerUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const count = await prisma.profilePreset.count({ where: { userId: user.id } })
    if (count >= PROFILE_PRESETS_MAX) {
      return NextResponse.json({ error: `Maximum of ${PROFILE_PRESETS_MAX} saved profiles reached` }, { status: 400 })
    }

    const { data: body, error } = await parseBody(req, ProfilePresetCreateSchema)
    if (error) return error

    const clean = sanitizePresetData(body)

    const preset = await prisma.profilePreset.create({
      data: {
        userId:   user.id,
        label:    clean.label ?? body.label,
        fullName: clean.fullName,
        headline: clean.headline,
        email:    clean.email,
        phone:    clean.phone,
        address:  clean.address,
        links:    clean.links,
      },
    })

    return NextResponse.json({ preset }, { status: 201 })
  } catch (error) {
    console.error('Error creating profile preset:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
