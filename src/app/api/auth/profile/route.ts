import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function PATCH(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, agreeOffers } = body

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (agreeOffers !== undefined) data.agreeOffers = agreeOffers

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data,
    })

    const { password: _, ...userWithoutPassword } = updated

    return NextResponse.json({ user: userWithoutPassword })
  } catch (error) {
    console.error('Profile PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
