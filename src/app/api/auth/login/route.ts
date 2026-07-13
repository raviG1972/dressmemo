import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

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

    // Find user by phone
    const user = await db.user.findUnique({ where: { phone } })
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid phone or password' },
        { status: 401 }
      )
    }

    // Compare password
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid phone or password' },
        { status: 401 }
      )
    }

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
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
