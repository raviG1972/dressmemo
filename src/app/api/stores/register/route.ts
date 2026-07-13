import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, createStoreSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, phone, password, ownerName, city, address, category } = body

    if (!name || !phone || !password || !city) {
      return NextResponse.json(
        { error: 'Name, phone, password, and city are required' },
        { status: 400 }
      )
    }

    // Check if phone already exists
    const existing = await db.store.findUnique({ where: { phone } })
    if (existing) {
      return NextResponse.json(
        { error: 'A store with this phone number already exists' },
        { status: 409 }
      )
    }

    const hashedPassword = await hashPassword(password)

    const store = await db.store.create({
      data: {
        name,
        phone,
        password: hashedPassword,
        ownerName: ownerName || null,
        city,
        address: address || null,
        category: category || 'fashion',
        isVerified: false,
        isActive: true,
      },
    })

    // Create a store session (in-memory, separate from user sessions)
    const token = createStoreSession(store.id)

    const { password: _, ...storeWithoutPassword } = store

    const response = NextResponse.json(
      { store: storeWithoutPassword },
      { status: 201 }
    )

    response.cookies.set('store_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Store register error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
