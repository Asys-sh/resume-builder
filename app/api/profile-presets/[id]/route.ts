import { type NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'
import { ProfilePresetUpdateSchema, parseBody } from '@/lib/schemas'
import { sanitizePresetData } from '@/lib/sanitize'

async function getOwnedPreset(presetId: string, userId: string) {
  const preset = await prisma.profilePreset.findUnique({ where: { id: presetId } })
  if (!preset) return { preset: null, error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  if (preset.userId !== userId) return { preset: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { preset, error: null }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getServerUser()
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { preset, error } = await getOwnedPreset(id, user.id)
    if (error) return error

    return NextResponse.json({ preset })
  } catch (error) {
    console.error('Error fetching preset:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getServerUser()
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { preset, error } = await getOwnedPreset(id, user.id)
    if (error) return error

    const { data: body, error: parseError } = await parseBody(req, ProfilePresetUpdateSchema)
    if (parseError) return parseError

    const clean = sanitizePresetData(body as any)

    const updated = await prisma.profilePreset.update({
      where: { id: preset!.id },
      data: {
        ...(clean.label !== undefined   && { label:    clean.label }),
        ...(clean.fullName !== undefined && { fullName: clean.fullName || null }),
        ...(clean.headline !== undefined && { headline: clean.headline || null }),
        ...(clean.email !== undefined    && { email:    clean.email || null }),
        ...(clean.phone !== undefined    && { phone:    clean.phone || null }),
        ...(clean.address !== undefined  && { address:  clean.address || null }),
        ...(body.links !== undefined     && { links:    clean.links }),
      },
    })

    return NextResponse.json({ preset: updated })
  } catch (error) {
    console.error('Error updating preset:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getServerUser()
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { error } = await getOwnedPreset(id, user.id)
    if (error) return error

    await prisma.profilePreset.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting preset:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
