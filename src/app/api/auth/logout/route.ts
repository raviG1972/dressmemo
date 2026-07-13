import { NextResponse } from 'next/server'
import { deleteSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const token = request.headers
      .get('cookie')
      ?.split(';')
      .find((c) => c.trim().startsWith('session_token='))
      ?.split('=')[1]

    if (token) {
      await deleteSession(token)
    }

    const response = NextResponse.json({ ok: true })

    response.cookies.set('session_token', '', {
      httpOnly: true,
      path: '/',
      maxAge: 0,
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
