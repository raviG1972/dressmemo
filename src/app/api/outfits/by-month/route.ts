import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || '')
    const month = parseInt(searchParams.get('month') || '') // 0-indexed

    if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
      return NextResponse.json(
        { error: 'Valid year and month (0-11) are required' },
        { status: 400 }
      )
    }

    // Get first and last day of the month
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999)

    const outfits = await db.outfit.findMany({
      where: {
        userId: user.id,
        date: { gte: startDate, lte: endDate },
      },
      include: { items: true },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    })

    // Also get unprocessed count
    const unprocessedCount = await db.outfit.count({
      where: {
        userId: user.id,
        processed: false,
      },
    })

    return NextResponse.json({ outfits, unprocessedCount })
  } catch (error) {
    console.error('Outfits by-month error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
