import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getStoreFromRequest } from '@/lib/auth'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const store = await getStoreFromRequest(request)
    if (!store) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existing = await db.storeOffer.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }
    if (existing.storeId !== store.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      description,
      imageUrl,
      category,
      tags,
      discountPct,
      couponCode,
      originalPrice,
      discountedPrice,
      validFrom,
      validUntil,
      city,
      isActive,
      maxCoupons,
    } = body

    const data: Record<string, unknown> = {}
    if (title !== undefined) data.title = title
    if (description !== undefined) data.description = description
    if (imageUrl !== undefined) data.imageUrl = imageUrl
    if (category !== undefined) {
      const validCategories = ['TOP', 'BOTTOM', 'FULL_SUIT', 'SHOES', 'ACCESSORY']
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
          { status: 400 }
        )
      }
      data.category = category
    }
    if (tags !== undefined) data.tags = JSON.stringify(tags)
    if (discountPct !== undefined) data.discountPct = discountPct
    if (couponCode !== undefined) data.couponCode = couponCode
    if (originalPrice !== undefined) data.originalPrice = originalPrice
    if (discountedPrice !== undefined) data.discountedPrice = discountedPrice
    if (validFrom !== undefined) data.validFrom = new Date(validFrom)
    if (validUntil !== undefined) data.validUntil = new Date(validUntil)
    if (city !== undefined) data.city = city
    if (isActive !== undefined) data.isActive = isActive
    if (maxCoupons !== undefined) data.maxCoupons = maxCoupons

    const updated = await db.storeOffer.update({
      where: { id },
      data,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Store offer PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const store = await getStoreFromRequest(request)
    if (!store) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existing = await db.storeOffer.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }
    if (existing.storeId !== store.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await db.storeOffer.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Store offer DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
