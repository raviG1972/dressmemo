import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, eventNote, date, items } = body

    if (!date || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Date and at least one item are required' },
        { status: 400 }
      )
    }

    const outfit = await db.outfit.create({
      data: {
        userId: user.id,
        name: name || null,
        eventNote: eventNote || null,
        date: new Date(date),
        items: {
          create: items.map((item: {
            topId?: string | null
            bottomId?: string | null
            fullSuitId?: string | null
            shoeId?: string | null
            accessoryId?: string | null
          }) => ({
            topId: item.topId || null,
            bottomId: item.bottomId || null,
            fullSuitId: item.fullSuitId || null,
            shoeId: item.shoeId || null,
            accessoryId: item.accessoryId || null,
          })),
        },
      },
      include: {
        items: true,
      },
    })

    return NextResponse.json(outfit, { status: 201 })
  } catch (error) {
    console.error('Outfit POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
