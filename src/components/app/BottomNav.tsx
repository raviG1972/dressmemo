'use client'

import { Home, CalendarDays, Shirt, Layers, ShoppingBag, User } from 'lucide-react'
import { useStore, type AppView } from '@/lib/store'
import { cn } from '@/lib/utils'

const navItems: { view: AppView; icon: typeof Home; label: string }[] = [
  { view: 'home', icon: Home, label: 'Home' },
  { view: 'wardrobe', icon: Shirt, label: 'Wardrobe' },
  { view: 'match-suit', icon: Layers, label: 'Match' },
  { view: 'offers', icon: ShoppingBag, label: 'Offers' },
  { view: 'profile', icon: User, label: 'Profile' },
]

export default function BottomNav() {
  const { currentView, setView } = useStore()

  // Map sub-views to their parent nav item for highlighting
  const getActiveNav = (view: AppView): AppView => {
    if (['save-outfit', 'match-suit', 'outfit-builder'].includes(view)) return 'match-suit'
    if (['event-memo', 'events-calendar', 'wore-calendar'].includes(view)) return 'home'
    if (view === 'accessories') return 'wardrobe'
    if (['home', 'wardrobe', 'offers', 'profile'].includes(view)) return view
    return 'home'
  }

  const activeNav = getActiveNav(currentView)

  return (
    <nav className="sticky bottom-0 z-40 w-full bg-white/80 backdrop-blur-lg border-t border-rose-100 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ view, icon: Icon, label }) => {
          const isActive = activeNav === view
          return (
            <button
              key={view}
              onClick={() => setView(view)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors',
                isActive ? (view === 'offers' ? 'text-amber-500' : 'text-rose-500') : 'text-muted-foreground hover:text-rose-400'
              )}
              aria-label={label}
            >
              <Icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
              <span className={cn('text-[10px] font-medium', isActive && 'font-semibold')}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
