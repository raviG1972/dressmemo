/**
 * Cloudinary upload utility using direct HTTP API.
 * No SDK dependency — just fetch calls to Cloudinary REST API.
 * This keeps the bundle small and avoids compilation memory issues.
 */

/**
 * Check if Cloudinary is properly configured
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  )
}

/**
 * Upload an image buffer to Cloudinary using the REST API.
 * Auto-optimization: resize to max 600x800, auto quality, auto format.
 * Returns the Cloudinary secure URL and public ID.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  options?: {
    folder?: string
    publicId?: string
  }
): Promise<{ url: string; publicId: string }> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!
  const apiKey = process.env.CLOUDINARY_API_KEY!
  const apiSecret = process.env.CLOUDINARY_API_SECRET!
  const folder = options?.folder || 'dressmemo'
  const publicId = options?.publicId || `item_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  // Build the unsigned upload using the upload endpoint with signature
  const timestamp = Math.floor(Date.now() / 1000).toString()

  // Generate signature string
  const crypto = await import('crypto')
  const signatureStr = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}&transformation=w_600,h_800,c_limit,q_auto:good,f_auto${apiSecret}`
  const signature = crypto.createHash('sha1').update(signatureStr).digest('hex')

  // Build multipart form data
  const boundary = '----CloudinaryUpload' + Date.now()
  const parts: Buffer[] = []

  const addField = (name: string, value: string) => {
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`))
  }

  addField('folder', folder)
  addField('public_id', publicId)
  addField('timestamp', timestamp)
  addField('api_key', apiKey)
  addField('signature', signature)
  addField('transformation', 'w_600,h_800,c_limit,q_auto:good,f_auto')

  // Add file
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="photo.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`))
  parts.push(buffer)
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`))

  const body = Buffer.concat(parts)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: new Uint8Array(body),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Cloudinary upload failed: ${response.status} ${errorText}`)
  }

  const result = await response.json() as {
    secure_url: string
    public_id: string
  }

  return {
    url: result.secure_url,
    publicId: result.public_id,
  }
}

/**
 * Delete an image from Cloudinary by its URL or public ID.
 */
export async function deleteFromCloudinary(imagePath: string): Promise<void> {
  try {
    const publicId = extractPublicId(imagePath)
    if (!publicId) return

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME!
    const apiKey = process.env.CLOUDINARY_API_KEY!
    const apiSecret = process.env.CLOUDINARY_API_SECRET!

    const timestamp = Math.floor(Date.now() / 1000).toString()
    const crypto = await import('crypto')
    const signatureStr = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`
    const signature = crypto.createHash('sha1').update(signatureStr).digest('hex')

    const formData = new FormData()
    formData.append('public_id', publicId)
    formData.append('timestamp', timestamp)
    formData.append('api_key', apiKey)
    formData.append('signature', signature)

    await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      {
        method: 'POST',
        body: formData,
      }
    )
  } catch (error) {
    console.error('Failed to delete image from Cloudinary:', error)
    // Don't throw - we still want to delete the DB record
  }
}

/**
 * Extract Cloudinary public ID from a URL.
 * e.g., "https://res.cloudinary.com/demo/image/upload/v123/dressmemo/item_abc"
 *   → "dressmemo/item_abc"
 */
function extractPublicId(imagePath: string): string | null {
  if (!imagePath || !imagePath.includes('cloudinary.com')) return null

  try {
    const url = new URL(imagePath)
    const pathParts = url.pathname.split('/')
    const uploadIndex = pathParts.indexOf('upload')
    if (uploadIndex === -1) return null

    // Skip "upload" and optional version "v123456"
    let startIndex = uploadIndex + 1
    if (pathParts[startIndex]?.startsWith('v')) {
      startIndex++
    }

    // Rejoin the remaining parts and remove the file extension
    const publicIdWithExt = pathParts.slice(startIndex).join('/')
    const lastDot = publicIdWithExt.lastIndexOf('.')
    if (lastDot > 0) {
      return publicIdWithExt.slice(0, lastDot)
    }
    return publicIdWithExt || null
  } catch {
    return null
  }
}
