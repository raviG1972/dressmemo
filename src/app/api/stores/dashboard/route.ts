import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getStoreFromRequest } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const store = await getStoreFromRequest(request)
    if (!store) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get store offers
    const offers = await db.storeOffer.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate total coupons claimed across all offers
    const totalCouponsClaimed = offers.reduce((sum, o) => sum + o.couponsClaimed, 0)

    // Get subscription
    const subscription = await db.storeSubscription.findUnique({
      where: { storeId: store.id },
    })

    // Calculate total revenue based on subscription plan
    let totalRevenue = 0
    if (subscription && subscription.plan === 'per_coupon') {
      totalRevenue = totalCouponsClaimed * subscription.perCouponFee
    } else if (subscription && subscription.plan === 'monthly') {
      totalRevenue = subscription.monthlyFee
    }

    const { password: _, ...storeWithoutPassword } = store

    return NextResponse.json({
      store: storeWithoutPassword,
      offers,
      totalCouponsClaimed,
      totalRevenue,
      subscription,
    })
  } catch (error) {
    console.error('Store dashboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
