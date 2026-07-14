import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { uploadToCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary'

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null
    const date = formData.get('date') as string
    const name = (formData.get('name') as string) || null
    const caption = (formData.get('caption') as string) || null
    const time = (formData.get('time') as string) || null
    const reasonTag = (formData.get('reasonTag') as string) || null
    const reasonText = (formData.get('reasonText') as string) || null

    if (!imageFile || !date) {
      return NextResponse.json(
        { error: 'Image and date are required' },
        { status: 400 }
      )
    }

    // Upload image
    const bytes = await imageFile.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let imagePath: string
    if (isCloudinaryConfigured()) {
      const result = await uploadToCloudinary(buffer, { folder: 'dressmemo/outfits' })
      imagePath = result.url
    } else {
      const base64Data = buffer.toString('base64')
      imagePath = `data:image/jpeg;base64,${base64Data}`
    }

    const outfit = await db.outfit.create({
      data: {
        userId: user.id,
        imagePath,
        name,
        caption,
        time,
        reasonTag,
        reasonText,
        date: new Date(date),
        processed: false,
      },
      include: { items: true },
    })

    return NextResponse.json(outfit, { status: 201 })
  } catch (error) {
    console.error('Outfit POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
