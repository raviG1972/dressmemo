'use client'

import { create } from 'zustand'
import { format } from 'date-fns'

// Types
export type ClothingCategory = 'TOP' | 'BOTTOM' | 'FULL_SUIT' | 'SHOES' | 'ACCESSORY'

export interface ClothingItem {
  id: string
  userId: string
  category: ClothingCategory
  subType: string
  color: string
  imageUrl: string // mapped from imagePath in backend
  size: string
  tags: string[]
  isFavorite: boolean
  createdAt: string
}

export interface OutfitItem {
  id: string
  topId: string | null
  bottomId: string | null
  fullSuitId: string | null
  shoeId: string | null
  accessoryId: string | null
}

export interface Outfit {
  id: string
  userId: string
  date: string
  name: string
  eventNote: string | null
  items: OutfitItem[]
  createdAt: string
}

export interface User {
  id: string
  phone: string
  name: string
  agreeOffers: boolean
}

export type AppView = 'calendar' | 'wardrobe' | 'outfit-builder' | 'profile' | 'login' | 'register'

// Helper: map backend clothing item to frontend format
function mapClothingItem(raw: Record<string, unknown>): ClothingItem {
  let tags: string[] = []
  if (raw.tags) {
    try {
      tags = typeof raw.tags === 'string' ? JSON.parse(raw.tags) : Array.isArray(raw.tags) ? raw.tags : []
    } catch {
      tags = []
    }
  }
  return {
    id: raw.id as string,
    userId: raw.userId as string,
    category: raw.category as ClothingCategory,
    subType: (raw.subType as string) || '',
    color: (raw.color as string) || '',
    imageUrl: (raw.imagePath as string) || '',
    size: (raw.size as string) || '',
    tags,
    isFavorite: (raw.isFavorite as boolean) || false,
    createdAt: raw.createdAt as string,
  }
}

// Helper: map backend outfit to frontend format
function mapOutfit(raw: Record<string, unknown>): Outfit {
  return {
    id: raw.id as string,
    userId: raw.userId as string,
    date: raw.date ? format(new Date(raw.date as string), 'yyyy-MM-dd') : '',
    name: (raw.name as string) || 'Outfit',
    eventNote: (raw.eventNote as string) || null,
    items: (raw.items as OutfitItem[]) || [],
    createdAt: raw.createdAt as string,
  }
}

interface AppState {
  user: User | null
  isAuthenticated: boolean
  currentView: AppView
  selectedDate: Date
  clothingItems: ClothingItem[]
  outfits: Record<string, Outfit[]>
  isLoading: boolean

  // Actions
  setUser: (user: User | null) => void
  logout: () => void
  setView: (view: AppView) => void
  setSelectedDate: (date: Date) => void
  fetchClothingItems: (category?: string) => Promise<void>
  fetchOutfitsByDate: (dateStr: string) => Promise<void>
  fetchOutfitsByMonth: (year: number, month: number) => Promise<void>
  login: (phone: string, password: string) => Promise<boolean>
  register: (phone: string, password: string, name: string, agreeOffers: boolean) => Promise<boolean>
  checkAuth: () => Promise<void>
  addClothingItem: (item: Omit<ClothingItem, 'id' | 'userId' | 'createdAt'>, imageFile: File) => Promise<boolean>
  deleteOutfit: (outfitId: string, dateStr: string) => Promise<void>
  toggleFavorite: (itemId: string) => Promise<void>
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  currentView: 'calendar',
  selectedDate: new Date(),
  clothingItems: [],
  outfits: {},
  isLoading: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  logout: () => {
    set({ user: null, isAuthenticated: false, currentView: 'login', clothingItems: [], outfits: {} })
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
  },

  setView: (view) => set({ currentView: view }),

  setSelectedDate: (date) => set({ selectedDate: date }),

  fetchClothingItems: async (category?: string) => {
    const params = category ? `?category=${category}` : ''
    try {
      const res = await fetch(`/api/clothing${params}`)
      if (res.ok) {
        const data = await res.json()
        const rawItems = data.items || data || []
        const items = rawItems.map(mapClothingItem)
        set({ clothingItems: items })
      }
    } catch {
      // silently fail
    }
  },

  fetchOutfitsByDate: async (dateStr: string) => {
    try {
      const res = await fetch(`/api/outfits/by-date?date=${dateStr}`)
      if (res.ok) {
        const data = await res.json()
        const rawOutfits = data.outfits || []
        const mapped = rawOutfits.map(mapOutfit)
        set((state) => ({
          outfits: { ...state.outfits, [dateStr]: mapped }
        }))
      }
    } catch {
      // silently fail
    }
  },

  fetchOutfitsByMonth: async (year: number, month: number) => {
    // Fetch all outfits for the month by querying each day
    // Since the backend only supports by-date queries, we query a range
    try {
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const promises = []
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        promises.push(
          fetch(`/api/outfits/by-date?date=${dateStr}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (data?.outfits?.length) {
                const mapped = data.outfits.map(mapOutfit)
                return { dateStr, outfits: mapped }
              }
              return null
            })
            .catch(() => null)
        )
      }
      const results = await Promise.all(promises)
      const outfitsMap: Record<string, Outfit[]> = {}
      results.forEach((r) => {
        if (r && r.outfits.length > 0) {
          outfitsMap[r.dateStr] = r.outfits
        }
      })
      set((state) => ({
        outfits: { ...state.outfits, ...outfitsMap }
      }))
    } catch {
      // silently fail
    }
  },

  login: async (phone: string, password: string) => {
    set({ isLoading: true })
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      })
      const data = await res.json()
      if (res.ok && data.user) {
        set({ user: data.user, isAuthenticated: true, currentView: 'calendar', isLoading: false })
        return true
      }
      set({ isLoading: false })
      return false
    } catch {
      set({ isLoading: false })
      return false
    }
  },

  register: async (phone: string, password: string, name: string, agreeOffers: boolean) => {
    set({ isLoading: true })
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password, name, agreeOffers }),
      })
      const data = await res.json()
      if (res.ok && data.user) {
        set({ user: data.user, isAuthenticated: true, currentView: 'calendar', isLoading: false })
        return true
      }
      set({ isLoading: false })
      return false
    } catch {
      set({ isLoading: false })
      return false
    }
  },

  checkAuth: async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        if (data.user) {
          set({ user: data.user, isAuthenticated: true, currentView: 'calendar' })
          return
        }
      }
      set({ isAuthenticated: false, currentView: 'login' })
    } catch {
      set({ isAuthenticated: false, currentView: 'login' })
    }
  },

  addClothingItem: async (item, imageFile) => {
    const formData = new FormData()
    formData.append('image', imageFile)
    formData.append('category', item.category)
    formData.append('subType', item.subType)
    formData.append('color', item.color)
    formData.append('size', item.size)
    formData.append('tags', JSON.stringify(item.tags))
    formData.append('isFavorite', String(item.isFavorite))

    try {
      const res = await fetch('/api/clothing', {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        await get().fetchClothingItems()
        return true
      }
      return false
    } catch {
      return false
    }
  },

  deleteOutfit: async (outfitId: string, dateStr: string) => {
    try {
      const res = await fetch(`/api/outfits/${outfitId}`, { method: 'DELETE' })
      if (res.ok) {
        set((state) => {
          const dayOutfits = state.outfits[dateStr]?.filter((o) => o.id !== outfitId) || []
          return {
            outfits: { ...state.outfits, [dateStr]: dayOutfits }
          }
        })
      }
    } catch {
      // silently fail
    }
  },

  toggleFavorite: async (itemId: string) => {
    const item = get().clothingItems.find((i) => i.id === itemId)
    if (!item) return
    const newFav = !item.isFavorite
    try {
      const res = await fetch(`/api/clothing/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: newFav }),
      })
      if (res.ok) {
        set((state) => ({
          clothingItems: state.clothingItems.map((i) =>
            i.id === itemId ? { ...i, isFavorite: newFav } : i
          )
        }))
      }
    } catch {
      // silently fail
    }
  },
}))

// Helper to get date string key
export function getDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

// Helper to resolve clothing items from outfit items
export function getOutfitItemIds(outfit: Outfit): {
  topId: string | null
  bottomId: string | null
  fullSuitId: string | null
  shoesId: string | null
  accessoryIds: string[]
} {
  let topId: string | null = null
  let bottomId: string | null = null
  let fullSuitId: string | null = null
  let shoesId: string | null = null
  const accessoryIds: string[] = []

  if (outfit.items) {
    for (const item of outfit.items) {
      if (item.topId) topId = item.topId
      if (item.bottomId) bottomId = item.bottomId
      if (item.fullSuitId) fullSuitId = item.fullSuitId
      if (item.shoeId) shoesId = item.shoeId
      if (item.accessoryId) accessoryIds.push(item.accessoryId)
    }
  }

  return { topId, bottomId, fullSuitId, shoesId, accessoryIds }
}
