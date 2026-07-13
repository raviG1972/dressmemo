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
    const dateFilter = searchParams.get('date') // YYYY-MM-DD
    const monthFilter = searchParams.get('month') // YYYY-MM

    const where: Record<string, unknown> = { userId: user.id }

    if (dateFilter) {
      const start = new Date(dateFilter)
      const end = new Date(dateFilter)
      end.setDate(end.getDate() + 1)
      where.date = { gte: start, lt: end }
    } else if (monthFilter) {
      const [year, month] = monthFilter.split('-').map(Number)
      const start = new Date(year, month - 1, 1)
      const end = new Date(year, month, 1)
      where.date = { gte: start, lt: end }
    }

    const events = await db.event.findMany({
      where,
      orderBy: { date: 'asc' },
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Events GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, date, time, location, eventType, tags, notes } = body

    if (!title || !date || !eventType) {
      return NextResponse.json(
        { error: 'Title, date, and eventType are required' },
        { status: 400 }
      )
    }

    const validEventTypes = ['formal', 'casual', 'party', 'business', 'wedding', 'outdoor', 'religious', 'date']
    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json(
        { error: `Invalid eventType. Must be one of: ${validEventTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const event = await db.event.create({
      data: {
        userId: user.id,
        title,
        date: new Date(date),
        time: time || null,
        location: location || null,
        eventType,
        tags: JSON.stringify(tags || []),
        notes: notes || null,
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Events POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
