import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { getUserFromRequest } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Find the coupon and verify ownership
    const coupon = await db.coupon.findUnique({
      where: { id },
    })

    if (!coupon || coupon.userId !== user.id) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
    }

    // Generate QR code from coupon.qrData
    const qrData = coupon.qrData || coupon.code || `coupon:${coupon.id}`
    const qrBuffer = await QRCode.toBuffer(qrData, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })

    return new NextResponse(qrBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('QR generation error:', error)
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 })
  }
}
