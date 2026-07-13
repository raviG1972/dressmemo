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
    const status = searchParams.get('status') // active, used, expired

    const where: Record<string, unknown> = { userId: user.id }
    if (status) {
      where.status = status
    }

    const coupons = await db.coupon.findMany({
      where,
      include: {
        storeOffer: {
          include: {
            store: true,
          },
        },
      },
      orderBy: { claimedAt: 'desc' },
    })

    // Remove store passwords from results
    const cleanCoupons = coupons.map(coupon => {
      const { storeOffer, ...couponData } = coupon
      if (storeOffer?.store) {
        const { password: _, ...storeWithoutPassword } = storeOffer.store
        return {
          ...couponData,
          storeOffer: {
            ...storeOffer,
            store: storeWithoutPassword,
          },
        }
      }
      return couponData
    })

    return NextResponse.json({ coupons: cleanCoupons })
  } catch (error) {
    console.error('Coupons GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
