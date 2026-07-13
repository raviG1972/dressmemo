/**
 * Client-side image optimization utilities.
 * Compresses and resizes images before upload to reduce storage size
 * while keeping enough quality for viewing on mobile/desktop screens.
 */

const MAX_WIDTH = 600
const MAX_HEIGHT = 800
const JPEG_QUALITY = 0.6 // 60% quality - enough for viewing, tiny file size

/**
 * Compress an image File/Blob to a smaller JPEG.
 * Resizes to max 600x800 and compresses to ~60% quality.
 * A typical 5MB phone photo becomes ~30-80KB.
 */
export async function optimizeImage(
  file: File | Blob,
  options?: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
  }
): Promise<File> {
  const maxWidth = options?.maxWidth ?? MAX_WIDTH
  const maxHeight = options?.maxHeight ?? MAX_HEIGHT
  const quality = options?.quality ?? JPEG_QUALITY

  const bitmap = await createImageBitmap(file)

  // Calculate scaled dimensions maintaining aspect ratio
  let width = bitmap.width
  let height = bitmap.height

  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width)
    width = maxWidth
  }
  if (height > maxHeight) {
    width = Math.round((width * maxHeight) / height)
    height = maxHeight
  }

  // Draw to canvas at reduced size
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  // Convert to JPEG blob
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (b) => resolve(b!),
      'image/jpeg',
      quality
    )
  })

  return new File([blob], 'photo.jpg', { type: 'image/jpeg' })
}

/**
 * Compress a base64 data URL image (e.g., from canvas split).
 * Returns an optimized JPEG data URL.
 */
export async function optimizeDataURL(
  dataURL: string,
  options?: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
  }
): Promise<string> {
  const maxWidth = options?.maxWidth ?? MAX_WIDTH
  const maxHeight = options?.maxHeight ?? MAX_HEIGHT
  const quality = options?.quality ?? JPEG_QUALITY

  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      let width = img.width
      let height = img.height

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height)
        height = maxHeight
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)

      const optimized = canvas.toDataURL('image/jpeg', quality)
      resolve(optimized)
    }
    img.src = dataURL
  })
}

/**
 * Convert a data URL to a File object.
 */
export function dataURLToFile(dataURL: string, filename: string = 'photo.jpg'): File {
  const [header, base64] = dataURL.split(',')
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new File([bytes], filename, { type: mime })
}
