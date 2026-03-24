import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerUser } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

const DaysSchema = z.enum(['30', '60', '90']).default('30')

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getServerUser()
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    // Validate ?days query param
    const rawDays = req.nextUrl.searchParams.get('days') ?? undefined
    const parsed = DaysSchema.safeParse(rawDays)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid range. Allowed values: 30, 60, 90' },
        { status: 400 },
      )
    }
    const days = parsed.data

    // Ownership check
    const resume = await prisma.resume.findUnique({ where: { id, userId: user.id } })
    if (!resume) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Date range
    const since = new Date()
    since.setDate(since.getDate() - Number(days))

    // We use findMany + JS bucketing because Prisma's groupBy cannot group by
    // date parts of a DateTime field. Only `viewedAt` is selected to minimise
    // memory usage (each row is just a Date object).
    const views = await prisma.resumeView.findMany({
      where: { resumeId: id, viewedAt: { gte: since } },
      select: { viewedAt: true },
      orderBy: { viewedAt: 'asc' },
    })

    // Build daily buckets — fill in zero days
    const buckets = new Map<string, number>()
    const numDays = Number(days)
    for (let i = 0; i <= numDays; i++) {
      const d = new Date()
      d.setDate(d.getDate() - (numDays - i))
      buckets.set(d.toISOString().slice(0, 10), 0)
    }
    for (const v of views) {
      const key = v.viewedAt.toISOString().slice(0, 10)
      buckets.set(key, (buckets.get(key) ?? 0) + 1)
    }

    const daily = Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }))

    // Totals
    const total = daily.reduce((sum, d) => sum + d.count, 0)

    // Peak
    let peak: { date: string; count: number } = { date: '', count: 0 }
    for (const d of daily) {
      if (d.count > peak.count) peak = { date: d.date, count: d.count }
    }

    // Trend: last 7 days vs prev 7 days
    const last7: string[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      last7.push(d.toISOString().slice(0, 10))
    }
    const prev7: string[] = []
    for (let i = 13; i >= 7; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      prev7.push(d.toISOString().slice(0, 10))
    }

    const bucketObj = Object.fromEntries(buckets)
    const last7Sum = last7.reduce((s, k) => s + (bucketObj[k] ?? 0), 0)
    const prev7Sum = prev7.reduce((s, k) => s + (bucketObj[k] ?? 0), 0)

    let trend: 'up' | 'down' | 'flat'
    if (last7Sum > prev7Sum) trend = 'up'
    else if (last7Sum < prev7Sum) trend = 'down'
    else trend = 'flat'

    return NextResponse.json({ total, peak, trend, daily })
  } catch (error) {
    console.error('Error fetching resume analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
