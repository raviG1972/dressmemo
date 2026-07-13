import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existing = await db.event.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, date, time, location, eventType, tags, notes } = body

    const data: Record<string, unknown> = {}
    if (title !== undefined) data.title = title
    if (date !== undefined) data.date = new Date(date)
    if (time !== undefined) data.time = time
    if (location !== undefined) data.location = location
    if (eventType !== undefined) {
      const validEventTypes = ['formal', 'casual', 'party', 'business', 'wedding', 'outdoor', 'religious', 'date']
      if (!validEventTypes.includes(eventType)) {
        return NextResponse.json(
          { error: `Invalid eventType. Must be one of: ${validEventTypes.join(', ')}` },
          { status: 400 }
        )
      }
      data.eventType = eventType
    }
    if (tags !== undefined) data.tags = JSON.stringify(tags)
    if (notes !== undefined) data.notes = notes

    const updated = await db.event.update({
      where: { id },
      data,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Event PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existing = await db.event.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await db.event.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Event DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
