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
  imageUrl: string // mapped from imagePath in backend
  name: string | null
  caption: string | null
  time: string | null
  reasonTag: string | null
  reasonText: string | null
  date: string
  processed: boolean
  items: OutfitItem[]
  createdAt: string
}

export interface User {
  id: string
  phone: string
  name: string
  agreeOffers: boolean
}

export interface CalendarEvent {
  id: string
  userId: string
  title: string
  date: string
  time: string | null
  location: string | null
  eventType: string // formal, casual, party, business, wedding, outdoor, religious, date
  tags: string[]
  notes: string | null
  createdAt: string
}

export interface StoreOffer {
  id: string
  storeId: string
  storeName: string
  storeCity: string
  title: string
  description: string | null
  imageUrl: string | null
  category: string
  tags: string[]
  discountPct: number
  couponCode: string | null
  originalPrice: number | null
  discountedPrice: number | null
  validFrom: string
  validUntil: string
  city: string | null
  maxCoupons: number
  couponsClaimed: number
}

export interface Coupon {
  id: string
  storeOfferId: string
  code: string
  qrData: string
  status: string
  claimedAt: string
  usedAt: string | null
  storeOffer: StoreOffer
}

export type AppView = 'home' | 'day-gallery' | 'save-outfit' | 'process-outfit' | 'match-suit' | 'event-memo' | 'events-calendar' | 'wardrobe' | 'wore-calendar' | 'offers' | 'accessories' | 'store-dashboard' | 'profile' | 'login' | 'register'

// Helper: map backend calendar event to frontend format
function mapCalendarEvent(raw: Record<string, unknown>): CalendarEvent {
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
    title: (raw.title as string) || '',
    date: raw.date ? format(new Date(raw.date as string), 'yyyy-MM-dd') : '',
    time: (raw.time as string) || null,
    location: (raw.location as string) || null,
    eventType: (raw.eventType as string) || 'casual',
    tags,
    notes: (raw.notes as string) || null,
    createdAt: raw.createdAt as string,
  }
}

// Helper: map backend store offer to frontend format
function mapStoreOffer(raw: Record<string, unknown>): StoreOffer {
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
    storeId: raw.storeId as string,
    storeName: (raw.storeName as string) || '',
    storeCity: (raw.storeCity as string) || '',
    title: (raw.title as string) || '',
    description: (raw.description as string) || null,
    imageUrl: (raw.imageUrl as string) || null,
    category: (raw.category as string) || '',
    tags,
    discountPct: (raw.discountPct as number) || 0,
    couponCode: (raw.couponCode as string) || null,
    originalPrice: raw.originalPrice != null ? (raw.originalPrice as number) : null,
    discountedPrice: raw.discountedPrice != null ? (raw.discountedPrice as number) : null,
    validFrom: (raw.validFrom as string) || '',
    validUntil: (raw.validUntil as string) || '',
    city: (raw.city as string) || null,
    maxCoupons: (raw.maxCoupons as number) || 0,
    couponsClaimed: (raw.couponsClaimed as number) || 0,
  }
}

// Helper: map backend coupon to frontend format
function mapCoupon(raw: Record<string, unknown>): Coupon {
  return {
    id: raw.id as string,
    storeOfferId: raw.storeOfferId as string,
    code: (raw.code as string) || '',
    qrData: (raw.qrData as string) || '',
    status: (raw.status as string) || 'active',
    claimedAt: (raw.claimedAt as string) || '',
    usedAt: (raw.usedAt as string) || null,
    storeOffer: raw.storeOffer ? mapStoreOffer(raw.storeOffer as Record<string, unknown>) : mapStoreOffer(raw),
  }
}

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
    imageUrl: (raw.imagePath as string) || '',
    name: (raw.name as string) || null,
    caption: (raw.caption as string) || null,
    time: (raw.time as string) || null,
    reasonTag: (raw.reasonTag as string) || null,
    reasonText: (raw.reasonText as string) || null,
    date: raw.date ? format(new Date(raw.date as string), 'yyyy-MM-dd') : '',
    processed: (raw.processed as boolean) || false,
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
  unprocessedCount: number
  events: Record<string, CalendarEvent[]>
  storeOffers: StoreOffer[]
  coupons: Coupon[]
  suggestedItems: ClothingItem[]
  suggestedOffers: StoreOffer[]
  isLoading: boolean

  // Actions
  setUser: (user: User | null) => void
  logout: () => void
  setView: (view: AppView) => void
  setSelectedDate: (date: Date) => void
  fetchClothingItems: (category?: string) => Promise<void>
  fetchOutfitsByDate: (dateStr: string) => Promise<void>
  fetchOutfitsByMonth: (year: number, month: number) => Promise<void>
  addOutfit: (data: { imageFile: File; date: string; name?: string; caption?: string; time?: string; reasonTag?: string; reasonText?: string }) => Promise<boolean>
  deleteOutfit: (outfitId: string, dateStr: string) => Promise<void>
  markOutfitProcessed: (outfitId: string) => Promise<void>
  fetchEventsByDate: (dateStr: string) => Promise<void>
  fetchEventsByMonth: (year: number, month: number) => Promise<void>
  addEvent: (event: Omit<CalendarEvent, 'id' | 'userId' | 'createdAt'>) => Promise<boolean>
  deleteEvent: (eventId: string, dateStr: string) => Promise<void>
  fetchSuggestions: (tags: string[]) => Promise<void>
  fetchStoreOffers: (tags?: string[], city?: string) => Promise<void>
  claimCoupon: (storeOfferId: string) => Promise<boolean>
  fetchCoupons: (status?: string) => Promise<void>
  login: (phone: string, password: string) => Promise<boolean>
  register: (phone: string, password: string, name: string, agreeOffers: boolean) => Promise<boolean>
  checkAuth: () => Promise<void>
  addClothingItem: (item: Omit<ClothingItem, 'id' | 'userId' | 'createdAt'>, imageFile: File) => Promise<boolean>
  toggleFavorite: (itemId: string) => Promise<void>
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  currentView: 'home',
  selectedDate: new Date(),
  clothingItems: [],
  outfits: {},
  unprocessedCount: 0,
  events: {},
  storeOffers: [],
  coupons: [],
  suggestedItems: [],
  suggestedOffers: [],
  isLoading: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  logout: () => {
    set({ user: null, isAuthenticated: false, currentView: 'login', clothingItems: [], outfits: {}, events: {}, storeOffers: [], coupons: [], suggestedItems: [], suggestedOffers: [] })
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
    try {
      const res = await fetch(`/api/outfits/by-month?year=${year}&month=${month}`)
      if (res.ok) {
        const data = await res.json()
        const rawOutfits = data.outfits || []
        const mapped = rawOutfits.map(mapOutfit)

        // Group by date
        const outfitsMap: Record<string, Outfit[]> = {}
        mapped.forEach((outfit: Outfit) => {
          if (!outfitsMap[outfit.date]) outfitsMap[outfit.date] = []
          outfitsMap[outfit.date].push(outfit)
        })

        set((state) => ({
          outfits: { ...state.outfits, ...outfitsMap },
          unprocessedCount: data.unprocessedCount || 0,
        }))
      }
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
        set({ user: data.user, isAuthenticated: true, isLoading: false })
        // Defer view change so browser processes Set-Cookie before next fetch
        await new Promise((r) => setTimeout(r, 100))
        set({ currentView: 'home' })
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
        set({ user: data.user, isAuthenticated: true, isLoading: false })
        // Defer view change so browser processes Set-Cookie before next fetch
        await new Promise((r) => setTimeout(r, 100))
        set({ currentView: 'home' })
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
          set({ user: data.user, isAuthenticated: true })
          await new Promise((r) => setTimeout(r, 100))
          set({ currentView: 'home' })
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
            outfits: { ...state.outfits, [dateStr]: dayOutfits },
            unprocessedCount: Math.max(0, state.unprocessedCount - 1),
          }
        })
      }
    } catch {
      // silently fail
    }
  },

  addOutfit: async (data) => {
    const formData = new FormData()
    formData.append('image', data.imageFile)
    formData.append('date', data.date)
    if (data.name) formData.append('name', data.name)
    if (data.caption) formData.append('caption', data.caption)
    if (data.time) formData.append('time', data.time)
    if (data.reasonTag) formData.append('reasonTag', data.reasonTag)
    if (data.reasonText) formData.append('reasonText', data.reasonText)

    try {
      const res = await fetch('/api/outfits', {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        const outfit = await res.json()
        const mapped = mapOutfit(outfit)
        set((state) => {
          const dayOutfits = state.outfits[mapped.date] || []
          return {
            outfits: { ...state.outfits, [mapped.date]: [...dayOutfits, mapped] },
            unprocessedCount: state.unprocessedCount + 1,
          }
        })
        return true
      }
      return false
    } catch {
      return false
    }
  },

  markOutfitProcessed: async (outfitId: string) => {
    try {
      const res = await fetch(`/api/outfits/${outfitId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processed: true }),
      })
      if (res.ok) {
        set((state) => ({
          unprocessedCount: Math.max(0, state.unprocessedCount - 1),
        }))
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

  fetchEventsByDate: async (dateStr: string) => {
    try {
      const res = await fetch(`/api/events?date=${dateStr}`)
      if (res.ok) {
        const data = await res.json()
        const rawEvents = data.events || []
        const mapped = rawEvents.map(mapCalendarEvent)
        set((state) => ({
          events: { ...state.events, [dateStr]: mapped }
        }))
      }
    } catch {
      // silently fail
    }
  },

  fetchEventsByMonth: async (year: number, month: number) => {
    try {
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const promises = []
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        promises.push(
          fetch(`/api/events?date=${dateStr}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (data?.events?.length) {
                const mapped = data.events.map(mapCalendarEvent)
                return { dateStr, events: mapped }
              }
              return null
            })
            .catch(() => null)
        )
      }
      const results = await Promise.all(promises)
      const eventsMap: Record<string, CalendarEvent[]> = {}
      results.forEach((r) => {
        if (r && r.events.length > 0) {
          eventsMap[r.dateStr] = r.events
        }
      })
      set((state) => ({
        events: { ...state.events, ...eventsMap }
      }))
    } catch {
      // silently fail
    }
  },

  addEvent: async (event) => {
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      })
      if (res.ok) {
        const data = await res.json()
        const newEvent = mapCalendarEvent(data.event || data)
        set((state) => {
          const dayEvents = state.events[event.date] || []
          return {
            events: { ...state.events, [event.date]: [...dayEvents, newEvent] }
          }
        })
        // Auto-fetch suggestions based on event tags
        if (event.tags && event.tags.length > 0) {
          get().fetchSuggestions(event.tags)
        }
        return true
      }
      return false
    } catch {
      return false
    }
  },

  deleteEvent: async (eventId: string, dateStr: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: 'DELETE' })
      if (res.ok) {
        set((state) => {
          const dayEvents = state.events[dateStr]?.filter((e) => e.id !== eventId) || []
          return {
            events: { ...state.events, [dateStr]: dayEvents }
          }
        })
      }
    } catch {
      // silently fail
    }
  },

  fetchSuggestions: async (tags: string[]) => {
    try {
      const tagsParam = tags.join(',')
      const res = await fetch(`/api/events/suggest?tags=${encodeURIComponent(tagsParam)}`)
      if (res.ok) {
        const data = await res.json()
        const rawItems = data.items || []
        const items = rawItems.map(mapClothingItem)
        const rawOffers = data.offers || []
        const offers = rawOffers.map(mapStoreOffer)
        set({ suggestedItems: items, suggestedOffers: offers })
      }
    } catch {
      // silently fail
    }
  },

  fetchStoreOffers: async (tags?: string[], city?: string) => {
    try {
      const params = new URLSearchParams()
      if (tags && tags.length > 0) params.set('tags', tags.join(','))
      if (city) params.set('city', city)
      const query = params.toString()
      const res = await fetch(`/api/stores/offers${query ? `?${query}` : ''}`)
      if (res.ok) {
        const data = await res.json()
        const rawOffers = data.offers || []
        const offers = rawOffers.map(mapStoreOffer)
        set({ storeOffers: offers })
      }
    } catch {
      // silently fail
    }
  },

  claimCoupon: async (storeOfferId: string) => {
    try {
      const res = await fetch('/api/coupons/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeOfferId }),
      })
      if (res.ok) {
        const data = await res.json()
        const coupon = mapCoupon(data.coupon || data)
        set((state) => ({
          coupons: [coupon, ...state.coupons]
        }))
        // Update the offer's claimed count locally
        set((state) => ({
          storeOffers: state.storeOffers.map(o =>
            o.id === storeOfferId ? { ...o, couponsClaimed: o.couponsClaimed + 1 } : o
          )
        }))
        return true
      }
      return false
    } catch {
      return false
    }
  },

  fetchCoupons: async (status?: string) => {
    try {
      const params = status ? `?status=${status}` : ''
      const res = await fetch(`/api/coupons${params}`)
      if (res.ok) {
        const data = await res.json()
        const rawCoupons = data.coupons || []
        const coupons = rawCoupons.map(mapCoupon)
        set({ coupons })
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
