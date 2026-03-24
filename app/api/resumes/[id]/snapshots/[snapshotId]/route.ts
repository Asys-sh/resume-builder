import { type NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

async function getOwnedSnapshot(snapshotId: string, resumeId: string, userId: string) {
  const snapshot = await prisma.resumeSnapshot.findUnique({
    where: { id: snapshotId },
    include: { resume: { select: { userId: true } } },
  })

  if (!snapshot || snapshot.resumeId !== resumeId || snapshot.resume.userId !== userId) {
    return { snapshot: null, error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  }

  return { snapshot, error: null }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; snapshotId: string }> },
) {
  try {
    const user = await getServerUser()
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, snapshotId } = await params
    const { snapshot, error } = await getOwnedSnapshot(snapshotId, id, user.id)
    if (error) return error

    return NextResponse.json({
      id: snapshot!.id,
      label: snapshot!.label,
      createdAt: snapshot!.createdAt,
      data: snapshot!.data,
    })
  } catch (error) {
    console.error('Error fetching snapshot:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; snapshotId: string }> },
) {
  try {
    const user = await getServerUser()
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, snapshotId } = await params
    const { error } = await getOwnedSnapshot(snapshotId, id, user.id)
    if (error) return error

    await prisma.resumeSnapshot.delete({ where: { id: snapshotId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting snapshot:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
