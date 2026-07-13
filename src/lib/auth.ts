import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// Store session store (simple in-memory for now - stores have fewer sessions)
const storeSessions = new Map<string, { storeId: string; expires: number }>()

export function createStoreSession(storeId: string): string {
  const token = crypto.randomUUID()
  storeSessions.set(token, { storeId, expires: Date.now() + 7 * 24 * 60 * 60 * 1000 })
  return token
}

export function getStoreSession(token: string): { storeId: string } | null {
  const session = storeSessions.get(token)
  if (!session) return null
  if (session.expires < Date.now()) {
    storeSessions.delete(token)
    return null
  }
  return { storeId: session.storeId }
}

export function deleteStoreSession(token: string) {
  storeSessions.delete(token)
}

// User sessions - database backed
export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  await db.session.create({
    data: { token, userId, expiresAt },
  })
  return token
}

export async function getSession(token: string): Promise<{ userId: string } | null> {
  const session = await db.session.findUnique({ where: { token } })
  if (!session) return null
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { token } }).catch(() => {})
    return null
  }
  return { userId: session.userId }
}

export async function deleteSession(token: string) {
  await db.session.delete({ where: { token } }).catch(() => {})
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function getUserFromRequest(request: Request) {
  const cookieHeader = request.headers.get('cookie') || ''
  const token = cookieHeader.split(';').find(c => c.trim().startsWith('session_token='))?.split('=')[1]?.trim()
  if (!token) return null
  const session = await getSession(token)
  if (!session) return null
  const user = await db.user.findUnique({ where: { id: session.userId } })
  return user
}

export async function getStoreFromRequest(request: Request) {
  const cookieHeader = request.headers.get('cookie') || ''
  const token = cookieHeader.split(';').find(c => c.trim().startsWith('store_token='))?.split('=')[1]?.trim()
  if (!token) return null
  const session = getStoreSession(token)
  if (!session) return null
  const store = await db.store.findUnique({ where: { id: session.storeId } })
  return store
}
