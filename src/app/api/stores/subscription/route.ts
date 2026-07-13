import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getStoreFromRequest } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const store = await getStoreFromRequest(request)
    if (!store) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { plan, monthlyFee, perCouponFee } = body

    if (!plan) {
      return NextResponse.json({ error: 'Plan is required' }, { status: 400 })
    }

    const validPlans = ['free', 'monthly', 'per_coupon']
    if (!validPlans.includes(plan)) {
      return NextResponse.json(
        { error: `Invalid plan. Must be one of: ${validPlans.join(', ')}` },
        { status: 400 }
      )
    }

    // Check if subscription already exists
    const existing = await db.storeSubscription.findUnique({
      where: { storeId: store.id },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Subscription already exists. Use PATCH to update.' },
        { status: 409 }
      )
    }

    const subscription = await db.storeSubscription.create({
      data: {
        storeId: store.id,
        plan,
        monthlyFee: monthlyFee ?? 0,
        perCouponFee: perCouponFee ?? 50,
        isActive: true,
      },
    })

    return NextResponse.json(subscription, { status: 201 })
  } catch (error) {
    console.error('Store subscription POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const store = await getStoreFromRequest(request)
    if (!store) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await db.storeSubscription.findUnique({
      where: { storeId: store.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'No subscription found. Use POST to create one.' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { plan, monthlyFee, perCouponFee, isActive, endDate } = body

    const data: Record<string, unknown> = {}
    if (plan !== undefined) {
      const validPlans = ['free', 'monthly', 'per_coupon']
      if (!validPlans.includes(plan)) {
        return NextResponse.json(
          { error: `Invalid plan. Must be one of: ${validPlans.join(', ')}` },
          { status: 400 }
        )
      }
      data.plan = plan
    }
    if (monthlyFee !== undefined) data.monthlyFee = monthlyFee
    if (perCouponFee !== undefined) data.perCouponFee = perCouponFee
    if (isActive !== undefined) data.isActive = isActive
    if (endDate !== undefined) data.endDate = new Date(endDate)

    const updated = await db.storeSubscription.update({
      where: { id: existing.id },
      data,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Store subscription PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
