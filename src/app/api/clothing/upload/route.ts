import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { writeFile } from 'fs/promises'
import path from 'path'

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

    // Save image to public/uploads
    const bytes = await imageFile.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const ext = imageFile.name.split('.').pop() || 'png'
    const uniqueName = `${crypto.randomUUID()}.${ext}`
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    const filePath = path.join(uploadsDir, uniqueName)

    await writeFile(filePath, buffer)

    const imagePath = `/uploads/${uniqueName}`

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
    console.error('Clothing upload POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
