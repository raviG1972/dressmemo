import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

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
 * Upload an image buffer to Cloudinary.
 * Automatically optimizes the image: resizes to max 600x800, converts to JPEG with auto quality.
 * Returns the Cloudinary secure URL.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  options?: {
    folder?: string
    publicId?: string
  }
): Promise<{ url: string; publicId: string }> {
  const folder = options?.folder || 'dressmemo'
  const publicId = options?.publicId || `item_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        transformation: [
          { width: 600, height: 800, crop: 'limit' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
        overwrite: true,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error)
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          })
        } else {
          reject(new Error('Cloudinary upload returned no result'))
        }
      }
    )
    uploadStream.end(buffer)
  })
}

/**
 * Delete an image from Cloudinary by its URL or public ID.
 */
export async function deleteFromCloudinary(imagePath: string): Promise<void> {
  try {
    const publicId = extractPublicId(imagePath)
    if (!publicId) return
    await cloudinary.uploader.destroy(publicId)
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
    // Path format: /{cloud_name}/image/upload/v{version}/{public_id}.{format}
    // or /{cloud_name}/image/upload/{public_id}.{format}
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

/**
 * Get an optimized URL for displaying an image.
 * Adds Cloudinary transformation parameters for optimized delivery.
 */
export function getOptimizedUrl(imageUrl: string, options?: { width?: number; height?: number }): string {
  if (!imageUrl || !imageUrl.includes('cloudinary.com')) return imageUrl

  try {
    const url = new URL(imageUrl)
    // Insert transformation after /upload/
    const uploadIndex = url.pathname.indexOf('/upload/')
    if (uploadIndex === -1) return imageUrl

    const width = options?.width || 400
    const height = options?.height || 600
    const transform = `w_${width},h_${height},c_limit,q_auto:good,f_auto`

    url.pathname = url.pathname.replace('/upload/', `/upload/${transform}/`)
    return url.toString()
  } catch {
    return imageUrl
  }
}
