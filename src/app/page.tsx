'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import LoginScreen from '@/components/auth/LoginScreen'
import RegisterScreen from '@/components/auth/RegisterScreen'
import HomeDashboard from '@/components/app/HomeDashboard'
import SaveOutfitView from '@/components/app/SaveOutfitView'
import MatchSuitView from '@/components/app/MatchSuitView'
import EventMemoView from '@/components/app/EventMemoView'
import EventsCalendarView from '@/components/app/EventsCalendarView'
import WardrobeView from '@/components/app/WardrobeView'
import WoreCalendarView from '@/components/app/WoreCalendarView'
import OffersView from '@/components/app/OffersView'
import AccessoriesView from '@/components/app/AccessoriesView'
import OutfitBuilderView from '@/components/app/OutfitBuilderView'
import ProfileView from '@/components/app/ProfileView'
import BottomNav from '@/components/app/BottomNav'

const viewMap: Record<string, React.ComponentType> = {
  'home': HomeDashboard,
  'save-outfit': SaveOutfitView,
  'match-suit': MatchSuitView,
  'event-memo': EventMemoView,
  'events-calendar': EventsCalendarView,
  'wardrobe': WardrobeView,
  'wore-calendar': WoreCalendarView,
  'offers': OffersView,
  'accessories': AccessoriesView,
  'outfit-builder': OutfitBuilderView,
  'profile': ProfileView,
}

export default function Home() {
  const { isAuthenticated, currentView, checkAuth } = useStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Not authenticated: show auth screens
  if (!isAuthenticated) {
    return (
      <AnimatePresence mode="wait">
        {currentView === 'register' ? (
          <motion.div
            key="register"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <RegisterScreen />
          </motion.div>
        ) : (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.3 }}
          >
            <LoginScreen />
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  // Authenticated: show app
  const ViewComponent = viewMap[currentView] || HomeDashboard

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-rose-50/30 to-white">
      {/* Main content area */}
      <main className="flex-1 pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <ViewComponent />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Sticky bottom nav */}
      <BottomNav />
    </div>
  )
}
