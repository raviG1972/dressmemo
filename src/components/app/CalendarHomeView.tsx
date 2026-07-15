'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isToday, isFuture, isPast, isSameDay } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, User, AlertCircle, Calendar, Download } from 'lucide-react'
import { useStore, getDateKey } from '@/lib/store'
import { usePWAInstall } from '@/hooks/usePWAInstall'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function CalendarHomeView() {
  const { user, outfits, unprocessedCount, setView, setSelectedDate, fetchOutfitsByMonth } = useStore()
  const { isInstallable, install } = usePWAInstall()
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  useEffect(() => {
    fetchOutfitsByMonth(year, month)
  }, [year, month, fetchOutfitsByMonth])

  const firstName = user?.name?.split(' ')[0] || 'There'

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    const daysInMonth = eachDayOfInterval({ start, end })
    const startDay = getDay(start) // 0=Sun
    const prefixDays = Array(startDay).fill(null)
    return [...prefixDays, ...daysInMonth]
  }, [currentMonth])

  const handlePrevMonth = useCallback(() => setCurrentMonth(subMonths(currentMonth, 1)), [currentMonth])
  const handleNextMonth = useCallback(() => setCurrentMonth(addMonths(currentMonth, 1)), [currentMonth])

  const handleDayClick = useCallback((date: Date) => {
    setSelectedDate(date)
    setView('day-gallery')
  }, [setSelectedDate, setView])

  const handlePlanOutfit = useCallback((date: Date, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setSelectedDate(date)
    setView('save-outfit')
  }, [setSelectedDate, setView])

  const today = new Date()

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 bg-gradient-to-b from-rose-50/80 to-transparent">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-rose-500" />
            <div>
              <h1 className="text-xl font-bold text-rose-900">Hey, {firstName}! 👋</h1>
              <p className="text-[11px] text-rose-400 font-medium">What are you wearing today?</p>
            </div>
          </div>
          <button
            onClick={() => setView('profile')}
            className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 hover:bg-rose-200 transition-colors"
          >
            <User className="w-4 h-4" />
          </button>
        </div>

        {/* Install app banner */}
        {isInstallable && (
          <motion.button
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={install}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-semibold mb-1 hover:from-rose-600 hover:to-pink-600 transition-all active:scale-[0.98] shadow-sm"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Install DressMemo on your phone</span>
          </motion.button>
        )}

        {/* Unprocessed outfits banner - subtle, not a prompt */}
        {unprocessedCount > 0 && (
          <motion.button
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setView('process-outfit')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50/80 border border-amber-200/60 text-amber-700 text-xs font-medium mb-1 hover:bg-amber-100/80 transition-colors active:scale-[0.98]"
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>You have {unprocessedCount} unprocessed outfit{unprocessedCount > 1 ? 's' : ''} — add them to wardrobe now.</span>
          </motion.button>
        )}
      </div>

      {/* Month navigator */}
      <div className="flex items-center justify-between px-4 py-2">
        <button
          onClick={handlePrevMonth}
          className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 hover:bg-rose-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-rose-900">
          {MONTHS[month]} {year}
        </h2>
        <button
          onClick={handleNextMonth}
          className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 hover:bg-rose-100 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 px-2">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center text-[10px] font-semibold text-rose-400 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid - prominent and full-width */}
      <div className="grid grid-cols-7 gap-[3px] px-2 pb-4">
        {calendarDays.map((day, idx) => {
          if (!day) {
            return <div key={`empty-${idx}`} className="aspect-square" />
          }

          const dateKey = getDateKey(day)
          const dayOutfits = outfits[dateKey] || []
          const firstOutfit = dayOutfits[0]
          const hasOutfits = dayOutfits.length > 0
          const isTodayDate = isToday(day)
          const isFutureDate = isFuture(day) && !isTodayDate
          const isPastDate = isPast(day) && !isTodayDate

          // Future dates with no outfits: show big plus button to plan
          if (isFutureDate && !hasOutfits) {
            return (
              <motion.button
                key={dateKey}
                onClick={() => handlePlanOutfit(day)}
                className="relative aspect-square rounded-lg overflow-hidden bg-rose-50/50 border border-rose-100/60 hover:bg-rose-100/60 hover:border-rose-200 transition-all active:scale-95"
                whileTap={{ scale: 0.93 }}
                whileHover={{ scale: 1.02 }}
              >
                {/* Date number in top-right corner */}
                <span className="absolute top-0.5 right-1 text-[10px] font-bold text-rose-300 z-10">
                  {format(day, 'd')}
                </span>

                {/* Big plus button for planning */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                  <div className="w-8 h-8 rounded-full bg-rose-100/80 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-rose-400" />
                  </div>
                  <span className="text-[8px] text-rose-300 font-medium">Plan</span>
                </div>
              </motion.button>
            )
          }

          // Today with no outfits: show plus button styled differently
          if (isTodayDate && !hasOutfits) {
            return (
              <motion.button
                key={dateKey}
                onClick={() => handlePlanOutfit(day)}
                className="relative aspect-square rounded-lg overflow-hidden bg-rose-100/60 border-2 border-rose-400 hover:bg-rose-100 transition-all active:scale-95"
                whileTap={{ scale: 0.93 }}
              >
                {/* Date number in top-right corner */}
                <span className="absolute top-0.5 right-1 text-[10px] font-bold text-rose-500 z-10">
                  {format(day, 'd')}
                </span>

                {/* Today's plus button */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                  <div className="w-9 h-9 rounded-full bg-rose-500/20 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-rose-500" />
                  </div>
                  <span className="text-[8px] text-rose-500 font-semibold">Today</span>
                </div>
              </motion.button>
            )
          }

          // Days with outfits: show thumbnail
          return (
            <motion.button
              key={dateKey}
              onClick={() => handleDayClick(day)}
              className={`relative aspect-square rounded-lg overflow-hidden transition-all active:scale-95 ${
                isTodayDate
                  ? 'ring-2 ring-rose-500 ring-offset-1'
                  : ''
              } ${hasOutfits ? 'bg-white border border-rose-100 shadow-sm hover:shadow-md' : 'bg-rose-50/30 border border-transparent hover:bg-rose-50/50'}`}
              whileTap={{ scale: 0.95 }}
            >
              {/* Date number in top-right corner */}
              <span className={`absolute top-0.5 right-1 text-[10px] font-bold z-10 drop-shadow-sm ${
                isTodayDate ? 'text-rose-600' : hasOutfits ? 'text-white' : 'text-rose-300'
              }`}>
                {format(day, 'd')}
              </span>

              {/* Outfit thumbnail - fills the whole square */}
              {firstOutfit?.imageUrl && (
                <img
                  src={firstOutfit.imageUrl}
                  alt={`Outfit for ${dateKey}`}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
              )}

              {/* Semi-transparent overlay at bottom for text readability */}
              {hasOutfits && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent h-1/3" />
              )}

              {/* Multiple outfits indicator badge */}
              {hasOutfits && dayOutfits.length > 1 && (
                <span className="absolute top-0.5 left-0.5 bg-rose-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center z-10 shadow-sm">
                  {dayOutfits.length}
                </span>
              )}

              {/* Reason tag indicator at bottom */}
              {firstOutfit?.reasonTag && (
                <span className="absolute bottom-0.5 left-0.5 right-0.5 text-white text-[7px] font-medium px-1 py-[1px] text-center truncate z-10">
                  {firstOutfit.reasonTag}
                </span>
              )}

              {/* Empty past dates: small plus */}
              {!hasOutfits && isPastDate && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-rose-200" />
                </div>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Quick add today's outfit button at bottom */}
      <div className="px-4 pb-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            setSelectedDate(new Date())
            setView('save-outfit')
          }}
          className="w-full h-12 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold flex items-center justify-center gap-2 shadow-md shadow-rose-200/50 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Today&apos;s Outfit
        </motion.button>
      </div>
    </div>
  )
}
