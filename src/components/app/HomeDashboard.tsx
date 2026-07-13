'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Camera, Layers, CalendarPlus, CalendarDays, Shirt,
  History, ShoppingBag, Gem, Search, User, ArrowLeft,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useStore, type AppView } from '@/lib/store'

interface SectionCard {
  view: AppView
  title: string
  subtitle: string
  icon: typeof Camera
  emoji: string
  gradient: string
  iconBg: string
}

const sections: SectionCard[] = [
  {
    view: 'save-outfit',
    title: 'Save an Outfit',
    subtitle: 'Snap & save your look',
    icon: Camera,
    emoji: '📸',
    gradient: 'from-rose-500 to-pink-500',
    iconBg: 'bg-rose-100 text-rose-600',
  },
  {
    view: 'match-suit',
    title: 'Match a Suit',
    subtitle: 'Mix top + bottom sliders',
    icon: Layers,
    emoji: '👕',
    gradient: 'from-fuchsia-500 to-purple-500',
    iconBg: 'bg-fuchsia-100 text-fuchsia-600',
  },
  {
    view: 'event-memo',
    title: 'Create an Event Memo',
    subtitle: 'Plan what to wear',
    icon: CalendarPlus,
    emoji: '🗓️',
    gradient: 'from-amber-500 to-orange-500',
    iconBg: 'bg-amber-100 text-amber-600',
  },
  {
    view: 'events-calendar',
    title: 'Events & Suits Calendar',
    subtitle: 'Upcoming events & outfits',
    icon: CalendarDays,
    emoji: '📅',
    gradient: 'from-teal-500 to-emerald-500',
    iconBg: 'bg-teal-100 text-teal-600',
  },
  {
    view: 'wardrobe',
    title: 'My Wardrobe',
    subtitle: 'Browse all your clothes',
    icon: Shirt,
    emoji: '👗',
    gradient: 'from-rose-400 to-rose-600',
    iconBg: 'bg-rose-100 text-rose-600',
  },
  {
    view: 'wore-calendar',
    title: 'What I Wore Calendar',
    subtitle: 'See past outfits by day',
    icon: History,
    emoji: '📆',
    gradient: 'from-sky-500 to-blue-500',
    iconBg: 'bg-sky-100 text-sky-600',
  },
  {
    view: 'offers',
    title: 'Shop Offers',
    subtitle: 'Deals & coupons near you',
    icon: ShoppingBag,
    emoji: '🛍️',
    gradient: 'from-amber-500 to-yellow-500',
    iconBg: 'bg-amber-100 text-amber-600',
  },
  {
    view: 'accessories',
    title: 'My Accessories',
    subtitle: 'Jewelry, bags & more',
    icon: Gem,
    emoji: '💍',
    gradient: 'from-violet-500 to-purple-500',
    iconBg: 'bg-violet-100 text-violet-600',
  },
]

export default function HomeDashboard() {
  const { setView, user } = useStore()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredSections = searchQuery.trim()
    ? sections.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.emoji.includes(searchQuery)
      )
    : sections

  const firstName = user?.name?.split(' ')[0] || 'There'

  return (
    <div className="flex flex-col min-h-full">
      {/* Greeting + Search */}
      <div className="px-4 pt-4 pb-3 bg-gradient-to-b from-rose-50/80 to-transparent">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold text-rose-900">
              Hey, {firstName}! 👋
            </h1>
            <p className="text-xs text-rose-500 mt-0.5">
              What would you like to do today?
            </p>
          </div>
          <button
            onClick={() => setView('profile')}
            className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 hover:bg-rose-200 transition-colors"
          >
            <User className="w-5 h-5" />
          </button>
        </div>

        {/* Search Box */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400" />
          <Input
            type="text"
            placeholder="Search outfits, events, wardrobe..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-white border-rose-200 focus:border-rose-400 focus:ring-rose-400 text-sm shadow-sm"
          />
        </div>
      </div>

      {/* Section Cards Grid */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-2 gap-3 mt-1">
          {filteredSections.map((section, index) => {
            const Icon = section.icon
            return (
              <motion.button
                key={section.view}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                onClick={() => setView(section.view)}
                className="group relative flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-rose-100 shadow-sm hover:shadow-md transition-all active:scale-95 text-center min-h-[140px]"
              >
                {/* Gradient glow on hover */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${section.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />

                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl ${section.iconBg} flex items-center justify-center mb-3 transition-transform group-hover:scale-110`}>
                  <span className="text-2xl">{section.emoji}</span>
                </div>

                {/* Title */}
                <h3 className="text-sm font-semibold text-rose-900 leading-tight">
                  {section.title}
                </h3>

                {/* Subtitle */}
                <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                  {section.subtitle}
                </p>
              </motion.button>
            )
          })}
        </div>

        {/* No results */}
        {filteredSections.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="w-10 h-10 text-rose-200 mb-3" />
            <p className="text-sm text-muted-foreground">
              No sections match &quot;{searchQuery}&quot;
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
