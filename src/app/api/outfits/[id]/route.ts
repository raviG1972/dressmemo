import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

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

    // Find the outfit and verify ownership
    const outfit = await db.outfit.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!outfit) {
      return NextResponse.json({ error: 'Outfit not found' }, { status: 404 })
    }

    if (outfit.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete the outfit (cascade will delete items)
    await db.outfit.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Outfit DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
