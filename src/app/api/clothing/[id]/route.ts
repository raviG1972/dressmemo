import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { unlink } from 'fs/promises'
import path from 'path'

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

    // Find the item and verify ownership
    const item = await db.clothingItem.findUnique({ where: { id } })
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    if (item.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Try to delete the image file from filesystem
    try {
      const filePath = path.join(process.cwd(), 'public', item.imagePath)
      await unlink(filePath)
    } catch (fsError) {
      // Ignore filesystem errors - file may already be deleted
      console.warn('Could not delete image file:', fsError)
    }

    // Delete from database
    await db.clothingItem.delete({ where: { id } })

    return NextResponse.json({ ok: true, deleted: item })
  } catch (error) {
    console.error('Clothing DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    // Find the item and verify ownership
    const item = await db.clothingItem.findUnique({ where: { id } })
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    if (item.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { tags, isFavorite, color, size, subType } = body

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (tags !== undefined) {
      updateData.tags = Array.isArray(tags) ? JSON.stringify(tags) : tags
    }
    if (isFavorite !== undefined) {
      updateData.isFavorite = isFavorite
    }
    if (color !== undefined) {
      updateData.color = color
    }
    if (size !== undefined) {
      updateData.size = size
    }
    if (subType !== undefined) {
      updateData.subType = subType
    }

    const updated = await db.clothingItem.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Clothing PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
