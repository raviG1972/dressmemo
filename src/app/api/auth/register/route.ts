import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, createSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone, password, name, agreeOffers } = body

    if (!phone || !password) {
      return NextResponse.json(
        { error: 'Phone and password are required' },
        { status: 400 }
      )
    }

    // Check if phone already exists
    const existingUser = await db.user.findUnique({ where: { phone } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Phone number already registered' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await db.user.create({
      data: {
        phone,
        password: hashedPassword,
        name: name || null,
        agreeOffers: agreeOffers ?? false,
      },
    })

    // Create session (DB-backed)
    const token = await createSession(user.id)

    // Build response with cookie
    const response = NextResponse.json({
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        agreeOffers: user.agreeOffers,
      },
    })

    response.cookies.set('session_token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      sameSite: 'lax',
      secure: false,
    })

    return response
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
