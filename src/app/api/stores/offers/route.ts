import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getStoreFromRequest } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tagsParam = searchParams.get('tags') // comma-separated
    const city = searchParams.get('city')

    const now = new Date()
    const where: Record<string, unknown> = {
      isActive: true,
      validFrom: { lte: now },
      validUntil: { gte: now },
    }

    if (city) {
      where.city = city
    }

    let offers = await db.storeOffer.findMany({
      where,
      include: { store: true },
      orderBy: { createdAt: 'desc' },
    })

    // Filter by tags if provided
    if (tagsParam) {
      const filterTags = tagsParam.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
      offers = offers.filter(offer => {
        let offerTags: string[] = []
        try {
          offerTags = JSON.parse(offer.tags).map((t: string) => t.toLowerCase())
        } catch {
          offerTags = []
        }
        return filterTags.some(ft => offerTags.some(ot => ot.includes(ft) || ft.includes(ot)))
      })
    }

    // Remove store password from results
    const cleanOffers = offers.map(offer => {
      const { store, ...offerData } = offer
      if (store) {
        const { password: _, ...storeWithoutPassword } = store
        return { ...offerData, store: storeWithoutPassword }
      }
      return offerData
    })

    return NextResponse.json({ offers: cleanOffers })
  } catch (error) {
    console.error('Store offers GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const store = await getStoreFromRequest(request)
    if (!store) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      maxCoupons,
    } = body

    if (!title || !category || !validFrom || !validUntil) {
      return NextResponse.json(
        { error: 'Title, category, validFrom, and validUntil are required' },
        { status: 400 }
      )
    }

    const validCategories = ['TOP', 'BOTTOM', 'FULL_SUIT', 'SHOES', 'ACCESSORY']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      )
    }

    const offer = await db.storeOffer.create({
      data: {
        storeId: store.id,
        title,
        description: description || null,
        imageUrl: imageUrl || null,
        category,
        tags: JSON.stringify(tags || []),
        discountPct: discountPct ?? 10,
        couponCode: couponCode || null,
        originalPrice: originalPrice ?? null,
        discountedPrice: discountedPrice ?? null,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        city: city || null,
        isActive: true,
        maxCoupons: maxCoupons ?? 100,
        couponsClaimed: 0,
      },
    })

    return NextResponse.json(offer, { status: 201 })
  } catch (error) {
    console.error('Store offers POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
