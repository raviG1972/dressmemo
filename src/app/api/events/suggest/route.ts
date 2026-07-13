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
    const tagsParam = searchParams.get('tags') // comma-separated
    if (!tagsParam) {
      return NextResponse.json(
        { error: 'tags query parameter is required' },
        { status: 400 }
      )
    }

    const eventTags = tagsParam.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)

    // Get all user's clothing items
    const clothingItems = await db.clothingItem.findMany({
      where: { userId: user.id },
    })

    // Match wardrobe items: ANY event tag matches ANY item tag, color, category, or subType
    const wardrobeItems = clothingItems.filter(item => {
      let itemTags: string[] = []
      try {
        itemTags = JSON.parse(item.tags).map((t: string) => t.toLowerCase())
      } catch {
        itemTags = []
      }

      const itemFields = [
        ...itemTags,
        item.color?.toLowerCase() || '',
        item.category.toLowerCase(),
        item.subType?.toLowerCase() || '',
      ].filter(Boolean)

      return eventTags.some(et => itemFields.some(ifield => ifield.includes(et) || et.includes(ifield)))
    })

    // Get active store offers whose tags overlap with event tags
    const now = new Date()
    const storeOffers = await db.storeOffer.findMany({
      where: {
        isActive: true,
        validFrom: { lte: now },
        validUntil: { gte: now },
      },
      include: { store: true },
    })

    const filteredOffers = storeOffers.filter(offer => {
      let offerTags: string[] = []
      try {
        offerTags = JSON.parse(offer.tags).map((t: string) => t.toLowerCase())
      } catch {
        offerTags = []
      }

      return eventTags.some(et => offerTags.some(ot => ot.includes(et) || et.includes(ot)))
    })

    const matchedStoreOffers = filteredOffers.map(offer => {
      const { password: _, ...safeStore } = offer.store as Record<string, unknown>
      return { ...offer, store: safeStore }
    })

    return NextResponse.json({
      wardrobeItems,
      storeOffers: matchedStoreOffers,
    })
  } catch (error) {
    console.error('Events suggest GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
