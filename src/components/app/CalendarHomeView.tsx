'use client'

import { useState, useEffect, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isToday, isFuture, isPast } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, User, AlertCircle } from 'lucide-react'
import { useStore, getDateKey } from '@/lib/store'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarHomeView() {
  const { user, outfits, unprocessedCount, setView, setSelectedDate, fetchOutfitsByMonth } = useStore()
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

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    setView('day-gallery')
  }

  const handleAddOutfit = (date: Date) => {
    setSelectedDate(date)
    setView('save-outfit')
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 bg-gradient-to-b from-rose-50/80 to-transparent">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xl font-bold text-rose-900">Hey, {firstName}! 👋</h1>
          </div>
          <button
            onClick={() => setView('profile')}
            className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 hover:bg-rose-200 transition-colors"
          >
            <User className="w-4 h-4" />
          </button>
        </div>

        {/* Unprocessed outfits banner */}
        {unprocessedCount > 0 && (
          <button
            onClick={() => setView('process-outfit')}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium mb-2 hover:bg-amber-100 transition-colors active:scale-[0.98]"
          >
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>You have {unprocessedCount} unprocessed outfit{unprocessedCount > 1 ? 's' : ''} — add them to wardrobe now.</span>
          </button>
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
          {format(currentMonth, 'MMMM yyyy')}
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

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-[2px] px-2 pb-4">
        {calendarDays.map((day, idx) => {
          if (!day) {
            return <div key={`empty-${idx}`} className="aspect-square" />
          }

          const dateKey = getDateKey(day)
          const dayOutfits = outfits[dateKey] || []
          const firstOutfit = dayOutfits[0]
          const hasOutfits = dayOutfits.length > 0
          const today = isToday(day)
          const future = isFuture(day)
          const past = isPast(day) && !today

          return (
            <motion.button
              key={dateKey}
              onClick={() => handleDayClick(day)}
              className={`relative aspect-square rounded-lg overflow-hidden transition-all active:scale-95 ${
                today
                  ? 'ring-2 ring-rose-500 ring-offset-1'
                  : 'hover:bg-rose-50/50'
              } ${hasOutfits ? 'bg-white border border-rose-100 shadow-sm' : 'bg-rose-50/30 border border-transparent'}`}
              whileTap={{ scale: 0.95 }}
            >
              {/* Date number in top-right corner */}
              <span className={`absolute top-0.5 right-1 text-[10px] font-bold z-10 ${
                today ? 'text-rose-600' : hasOutfits ? 'text-rose-800' : 'text-rose-300'
              }`}>
                {format(day, 'd')}
              </span>

              {/* Outfit thumbnail */}
              {firstOutfit?.imageUrl && (
                <img
                  src={firstOutfit.imageUrl}
                  alt={`Outfit for ${dateKey}`}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}

              {/* Overlay for multiple outfits indicator */}
              {hasOutfits && dayOutfits.length > 1 && (
                <span className="absolute top-0.5 left-0.5 bg-rose-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center z-10">
                  {dayOutfits.length}
                </span>
              )}

              {/* Reason tag indicator */}
              {firstOutfit?.reasonTag && (
                <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[7px] font-medium px-0.5 py-[1px] text-center truncate z-10">
                  {firstOutfit.reasonTag}
                </span>
              )}

              {/* Plus icon for future dates or empty past dates */}
              {!hasOutfits && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Plus className={`w-5 h-5 ${future ? 'text-rose-400' : 'text-rose-200'}`} />
                </div>
              )}

              {/* Today indicator dot */}
              {today && !hasOutfits && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-rose-500 rounded-full z-10" />
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
