import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import sharp from 'sharp'

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const where: { userId: string; category?: string } = { userId: user.id }
    if (category) {
      where.category = category
    }

    const items = await db.clothingItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Clothing GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null
    const category = formData.get('category') as string
    const subType = (formData.get('subType') as string) || null
    const color = (formData.get('color') as string) || null
    const size = (formData.get('size') as string) || null
    const tagsRaw = formData.get('tags') as string | null

    if (!imageFile || !category) {
      return NextResponse.json(
        { error: 'Image and category are required' },
        { status: 400 }
      )
    }

    const validCategories = ['TOP', 'BOTTOM', 'FULL_SUIT', 'SHOES', 'ACCESSORY']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      )
    }

    // Convert image to base64 data URL for database storage (Vercel-compatible)
    const bytes = await imageFile.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Server-side optimization: resize to max 600x800 and compress as JPEG
    // This acts as a safety net even if client-side optimization fails
    let optimizedBuffer: Buffer
    try {
      optimizedBuffer = await sharp(buffer)
        .resize(600, 800, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 60 })
        .toBuffer()
    } catch {
      // If sharp fails (e.g., already a small JPEG), use original
      optimizedBuffer = buffer
    }

    const base64Data = optimizedBuffer.toString('base64')
    const imagePath = `data:image/jpeg;base64,${base64Data}`

    // Parse tags
    let tags: string[] = []
    if (tagsRaw) {
      try {
        tags = JSON.parse(tagsRaw)
      } catch {
        tags = []
      }
    }

    const item = await db.clothingItem.create({
      data: {
        userId: user.id,
        category,
        subType,
        imagePath,
        color,
        size,
        tags: JSON.stringify(tags),
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Clothing POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
