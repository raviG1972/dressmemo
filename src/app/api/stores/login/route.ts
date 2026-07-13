import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { comparePassword, createStoreSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone, password } = body

    if (!phone || !password) {
      return NextResponse.json(
        { error: 'Phone and password are required' },
        { status: 400 }
      )
    }

    const store = await db.store.findUnique({ where: { phone } })
    if (!store) {
      return NextResponse.json(
        { error: 'Invalid phone or password' },
        { status: 401 }
      )
    }

    if (!store.isActive) {
      return NextResponse.json(
        { error: 'Store account is deactivated' },
        { status: 403 }
      )
    }

    const isValid = await comparePassword(password, store.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid phone or password' },
        { status: 401 }
      )
    }

    // Create a store session (in-memory, separate from user sessions)
    const token = createStoreSession(store.id)

    const { password: _, ...storeWithoutPassword } = store

    const response = NextResponse.json({ store: storeWithoutPassword })

    response.cookies.set('store_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Store login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
