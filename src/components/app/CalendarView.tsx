'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar as CalendarIcon, Plus, Trash2, Shirt } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useStore, getDateKey, getOutfitItemIds, type Outfit, type ClothingItem } from '@/lib/store'
import { format } from 'date-fns'

export default function CalendarView() {
  const { selectedDate, setSelectedDate, outfits, fetchOutfitsByMonth, fetchOutfitsByDate, setView, clothingItems, deleteOutfit } = useStore()
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Load outfits for the visible month
  useEffect(() => {
    fetchOutfitsByMonth(currentMonth.getFullYear(), currentMonth.getMonth())
  }, [currentMonth, fetchOutfitsByMonth])

  // Load outfits for the selected date
  const selectedDateKey = getDateKey(selectedDate)
  useEffect(() => {
    fetchOutfitsByDate(selectedDateKey)
  }, [selectedDateKey, fetchOutfitsByDate])

  // Determine which days have outfits for the dot indicators
  const outfitDays = useMemo(() => {
    const days = new Set<string>()
    Object.keys(outfits).forEach((dateStr) => {
      if (outfits[dateStr] && outfits[dateStr].length > 0) {
        days.add(dateStr)
      }
    })
    return days
  }, [outfits])

  const dayOutfits = outfits[selectedDateKey] || []

  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month)
  }

  const handleSelectDate = (date: Date | undefined) => {
    if (date) setSelectedDate(date)
  }

  // Resolve an item from clothingItems cache by id
  const resolveItem = (id: string | null | undefined): ClothingItem | undefined => {
    if (!id) return undefined
    return clothingItems.find((item) => item.id === id)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-rose-500" />
          <h1 className="text-xl font-bold text-rose-900">Calendar</h1>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">See what you wore & plan outfits</p>
      </div>

      {/* Calendar */}
      <div className="px-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelectDate}
          onMonthChange={handleMonthChange}
          className="rounded-xl border border-rose-100 p-3 mx-auto"
          components={{
            DayButton: ({ day, modifiers, ...props }: { day: { date: Date }; modifiers: { selected?: boolean; today?: boolean; outside?: boolean; disabled?: boolean; focused?: boolean }; } & React.ComponentProps<'button'>) => {
              const dateKey = format(day.date, 'yyyy-MM-dd')
              const hasOutfit = outfitDays.has(dateKey)
              return (
                <button
                  {...props}
                  className={`
                    relative flex flex-col items-center justify-center w-full h-full rounded-md text-sm
                    transition-colors hover:bg-rose-50
                    ${modifiers.selected ? 'bg-rose-500 text-white hover:bg-rose-600' : ''}
                    ${modifiers.today && !modifiers.selected ? 'bg-rose-100 text-rose-900 font-semibold' : ''}
                    ${modifiers.outside ? 'text-muted-foreground opacity-50' : ''}
                  `}
                >
                  <span>{format(day.date, 'd')}</span>
                  {hasOutfit && !modifiers.outside && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        modifiers.selected ? 'bg-white' : 'bg-rose-400'
                      }`}
                    />
                  )}
                </button>
              )
            },
          }}
        />
      </div>

      {/* Selected day outfits */}
      <div className="flex-1 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-rose-900">
            {format(selectedDate, 'EEEE, MMM d')}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-rose-500 hover:text-rose-600 h-8"
            onClick={() => setView('outfit-builder')}
          >
            <Plus className="w-4 h-4 mr-1" />
            Plan
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {dayOutfits.length > 0 ? (
            <motion.div
              key="outfits"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar"
            >
              {dayOutfits.map((outfit) => (
                <OutfitCard
                  key={outfit.id}
                  outfit={outfit}
                  resolveItem={resolveItem}
                  onDelete={() => deleteOutfit(outfit.id, selectedDateKey)}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mb-4">
                <Shirt className="w-8 h-8 text-rose-300" />
              </div>
              <p className="text-muted-foreground text-sm mb-4">No outfits saved for this day</p>
              <Button
                onClick={() => setView('outfit-builder')}
                className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl"
              >
                <Plus className="w-4 h-4 mr-1" />
                Plan an Outfit
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function OutfitCard({
  outfit,
  resolveItem,
  onDelete,
}: {
  outfit: Outfit
  resolveItem: (id: string | null | undefined) => ClothingItem | undefined
  onDelete: () => void
}) {
  const { topId, bottomId, fullSuitId, shoesId, accessoryIds } = getOutfitItemIds(outfit)

  const items = [
    resolveItem(topId),
    resolveItem(bottomId),
    resolveItem(fullSuitId),
    resolveItem(shoesId),
    ...accessoryIds.map(resolveItem),
  ].filter(Boolean) as ClothingItem[]

  return (
    <Card className="border-rose-100 overflow-hidden">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Thumbnails */}
          <div className="flex -space-x-2">
            {items.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="w-10 h-10 rounded-lg overflow-hidden border-2 border-white bg-rose-50 shrink-0"
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.subType}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Shirt className="w-4 h-4 text-rose-300" />
                  </div>
                )}
              </div>
            ))}
            {items.length > 4 && (
              <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center border-2 border-white shrink-0">
                <span className="text-xs font-semibold text-rose-600">+{items.length - 4}</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-rose-900 truncate">
              {outfit.name || 'Outfit'}
            </p>
            <div className="flex flex-wrap gap-1 mt-1">
              {items.slice(0, 3).map((item) => (
                <Badge key={item.id} variant="secondary" className="text-[10px] h-5 bg-rose-50 text-rose-700">
                  {item.subType}
                </Badge>
              ))}
            </div>
          </div>

          {/* Delete */}
          <button
            onClick={onDelete}
            className="text-muted-foreground hover:text-destructive transition-colors p-1"
            aria-label="Delete outfit"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
