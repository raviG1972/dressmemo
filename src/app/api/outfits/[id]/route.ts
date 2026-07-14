import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { deleteFromCloudinary } from '@/lib/cloudinary'

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

    // Delete image from Cloudinary
    if (outfit.imagePath && outfit.imagePath.includes('cloudinary.com')) {
      await deleteFromCloudinary(outfit.imagePath)
    }

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

    const outfit = await db.outfit.findUnique({ where: { id } })
    if (!outfit) {
      return NextResponse.json({ error: 'Outfit not found' }, { status: 404 })
    }
    if (outfit.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const updateData: Record<string, unknown> = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.caption !== undefined) updateData.caption = body.caption
    if (body.time !== undefined) updateData.time = body.time
    if (body.reasonTag !== undefined) updateData.reasonTag = body.reasonTag
    if (body.reasonText !== undefined) updateData.reasonText = body.reasonText
    if (body.processed !== undefined) updateData.processed = body.processed

    const updated = await db.outfit.update({
      where: { id },
      data: updateData,
      include: { items: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Outfit PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
