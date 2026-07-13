import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

function generateCouponCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'DL'
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { storeOfferId } = body

    if (!storeOfferId) {
      return NextResponse.json(
        { error: 'storeOfferId is required' },
        { status: 400 }
      )
    }

    const offer = await db.storeOffer.findUnique({
      where: { id: storeOfferId },
      include: { store: true },
    })

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    if (!offer.isActive) {
      return NextResponse.json({ error: 'Offer is not active' }, { status: 400 })
    }

    const now = new Date()
    if (offer.validFrom > now || offer.validUntil < now) {
      return NextResponse.json({ error: 'Offer has expired or is not yet valid' }, { status: 400 })
    }

    if (offer.couponsClaimed >= offer.maxCoupons) {
      return NextResponse.json({ error: 'All coupons have been claimed' }, { status: 400 })
    }

    // Check if user already claimed a coupon for this offer
    const existingCoupon = await db.coupon.findFirst({
      where: { userId: user.id, storeOfferId: offer.id, status: 'active' },
    })
    if (existingCoupon) {
      return NextResponse.json(
        { error: 'You already have an active coupon for this offer', coupon: existingCoupon },
        { status: 409 })
    }

    // Generate unique coupon code
    let code = generateCouponCode()
    let attempts = 0
    while (attempts < 10) {
      const existing = await db.coupon.findUnique({ where: { code } })
      if (!existing) break
      code = generateCouponCode()
      attempts++
    }

    const qrData = `dresslog:coupon:${code}:${storeOfferId}`

    const coupon = await db.coupon.create({
      data: {
        userId: user.id,
        storeOfferId: offer.id,
        code,
        qrData,
        status: 'active',
      },
    })

    // Increment couponsClaimed
    await db.storeOffer.update({
      where: { id: offer.id },
      data: { couponsClaimed: offer.couponsClaimed + 1 },
    })

    // Return with offer and store info
    const { password: _, ...storeWithoutPassword } = offer.store

    return NextResponse.json({
      coupon: {
        ...coupon,
        storeOffer: {
          ...offer,
          store: storeWithoutPassword,
        },
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Coupon claim error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
