'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import LoginScreen from '@/components/auth/LoginScreen'
import RegisterScreen from '@/components/auth/RegisterScreen'
import CalendarView from '@/components/app/CalendarView'
import WardrobeView from '@/components/app/WardrobeView'
import OutfitBuilderView from '@/components/app/OutfitBuilderView'
import OffersView from '@/components/app/OffersView'
import ProfileView from '@/components/app/ProfileView'
import BottomNav from '@/components/app/BottomNav'

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

  // Authenticated: show app with bottom nav
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-rose-50/30 to-white">
      {/* Main content area */}
      <main className="flex-1 pb-0">
        <AnimatePresence mode="wait">
          {currentView === 'calendar' && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <CalendarView />
            </motion.div>
          )}
          {currentView === 'wardrobe' && (
            <motion.div
              key="wardrobe"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <WardrobeView />
            </motion.div>
          )}
          {currentView === 'outfit-builder' && (
            <motion.div
              key="outfit-builder"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <OutfitBuilderView />
            </motion.div>
          )}
          {currentView === 'offers' && (
            <motion.div
              key="offers"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <OffersView />
            </motion.div>
          )}
          {currentView === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ProfileView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Sticky bottom nav */}
      <BottomNav />
    </div>
  )
}
