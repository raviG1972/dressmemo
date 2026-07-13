'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar as CalendarIcon, Plus, Trash2, Shirt, Clock, MapPin, Briefcase, Coffee, PartyPopper, Building2, Heart, Trees, Church } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useStore, getDateKey, getOutfitItemIds, type Outfit, type ClothingItem, type CalendarEvent } from '@/lib/store'
import { format } from 'date-fns'
import AddEventDialog from './AddEventDialog'
import SuggestionsPanel from './SuggestionsPanel'

const EVENT_TYPE_ICONS: Record<string, typeof Briefcase> = {
  formal: Briefcase,
  casual: Coffee,
  party: PartyPopper,
  business: Building2,
  wedding: Heart,
  outdoor: Trees,
  religious: Church,
  date: Heart,
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  formal: 'bg-emerald-500',
  casual: 'bg-teal-400',
  party: 'bg-purple-500',
  business: 'bg-slate-500',
  wedding: 'bg-pink-500',
  outdoor: 'bg-green-500',
  religious: 'bg-amber-500',
  date: 'bg-rose-500',
}

export default function CalendarView() {
  const { selectedDate, setSelectedDate, outfits, events, fetchOutfitsByMonth, fetchOutfitsByDate, fetchEventsByMonth, fetchEventsByDate, setView, clothingItems, deleteOutfit, suggestedItems, fetchSuggestions, deleteEvent } = useStore()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [addEventOpen, setAddEventOpen] = useState(false)

  // Load outfits for the visible month
  useEffect(() => {
    fetchOutfitsByMonth(currentMonth.getFullYear(), currentMonth.getMonth())
  }, [currentMonth, fetchOutfitsByMonth])

  // Load events for the visible month
  useEffect(() => {
    fetchEventsByMonth(currentMonth.getFullYear(), currentMonth.getMonth())
  }, [currentMonth, fetchEventsByMonth])

  // Load outfits for the selected date
  const selectedDateKey = getDateKey(selectedDate)
  useEffect(() => {
    fetchOutfitsByDate(selectedDateKey)
  }, [selectedDateKey, fetchOutfitsByDate])

  // Load events for the selected date
  useEffect(() => {
    fetchEventsByDate(selectedDateKey)
  }, [selectedDateKey, fetchEventsByDate])

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

  // Determine which days have events for the dot indicators
  const eventDays = useMemo(() => {
    const days = new Set<string>()
    Object.keys(events).forEach((dateStr) => {
      if (events[dateStr] && events[dateStr].length > 0) {
        days.add(dateStr)
      }
    })
    return days
  }, [events])

  const dayOutfits = outfits[selectedDateKey] || []
  const dayEvents = events[selectedDateKey] || []

  // Fetch suggestions when selecting an event
  const [selectedEventTags, setSelectedEventTags] = useState<string[]>([])
  const [selectedEventType, setSelectedEventType] = useState<string>('')

  const handleEventClick = (event: CalendarEvent) => {
    if (event.tags && event.tags.length > 0) {
      setSelectedEventTags(event.tags)
      setSelectedEventType(event.eventType)
      fetchSuggestions(event.tags)
    }
  }

  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month)
  }

  const handleSelectDate = (date: Date | undefined) => {
    if (date) setSelectedDate(date)
    // Clear suggestions when date changes
    setSelectedEventTags([])
    setSelectedEventType('')
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
              const hasEvent = eventDays.has(dateKey)
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
                  {(hasOutfit || hasEvent) && !modifiers.outside && (
                    <span className="flex items-center gap-0.5">
                      {hasOutfit && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            modifiers.selected ? 'bg-white' : 'bg-rose-400'
                          }`}
                        />
                      )}
                      {hasEvent && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            modifiers.selected ? 'bg-white' : 'bg-emerald-400'
                          }`}
                        />
                      )}
                    </span>
                  )}
                </button>
              )
            },
          }}
        />
      </div>

      {/* Selected day content */}
      <div className="flex-1 px-4 pt-4 pb-2 overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-rose-900">
            {format(selectedDate, 'EEEE, MMM d')}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-emerald-500 hover:text-emerald-600 h-8"
              onClick={() => setAddEventOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Event
            </Button>
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
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDateKey}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Events section */}
            {dayEvents.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <h3 className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Events</h3>
                </div>
                <div className="space-y-2">
                  {dayEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onDelete={() => deleteEvent(event.id, selectedDateKey)}
                      onClick={() => handleEventClick(event)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Outfits section */}
            {dayOutfits.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-rose-400" />
                  <h3 className="text-xs font-semibold text-rose-700 uppercase tracking-wide">Outfits</h3>
                </div>
                <div className="space-y-2">
                  {dayOutfits.map((outfit) => (
                    <OutfitCard
                      key={outfit.id}
                      outfit={outfit}
                      resolveItem={resolveItem}
                      onDelete={() => deleteOutfit(outfit.id, selectedDateKey)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions panel (shown when event with tags is clicked) */}
            {selectedEventTags.length > 0 && (
              <SuggestionsPanel eventType={selectedEventType} tags={selectedEventTags} />
            )}

            {/* Empty state */}
            {dayEvents.length === 0 && dayOutfits.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mb-4">
                  <Shirt className="w-8 h-8 text-rose-300" />
                </div>
                <p className="text-muted-foreground text-sm mb-4">Nothing planned for this day</p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setAddEventOpen(true)}
                    variant="outline"
                    className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Event
                  </Button>
                  <Button
                    onClick={() => setView('outfit-builder')}
                    className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Plan Outfit
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Add Event Dialog */}
      <AddEventDialog open={addEventOpen} onOpenChange={setAddEventOpen} />
    </div>
  )
}

function EventCard({
  event,
  onDelete,
  onClick,
}: {
  event: CalendarEvent
  onDelete: () => void
  onClick: () => void
}) {
  const EventIcon = EVENT_TYPE_ICONS[event.eventType] || Coffee
  const dotColor = EVENT_TYPE_COLORS[event.eventType] || 'bg-emerald-500'

  return (
    <Card
      className="border-emerald-100 overflow-hidden cursor-pointer hover:border-emerald-300 transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2.5">
          {/* Event type icon */}
          <div className={`w-9 h-9 rounded-lg ${dotColor} bg-opacity-15 flex items-center justify-center shrink-0`}>
            <EventIcon className="w-4 h-4 text-emerald-600" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-emerald-900 truncate">{event.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {event.time && (
                <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {event.time}
                </span>
              )}
              {event.location && (
                <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground truncate">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {event.location}
                </span>
              )}
            </div>
            {event.tags && event.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {event.tags.slice(0, 4).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-[9px] h-4 bg-emerald-50 text-emerald-700">
                    {tag}
                  </Badge>
                ))}
                {event.tags.length > 4 && (
                  <Badge variant="secondary" className="text-[9px] h-4 bg-emerald-50 text-emerald-700">
                    +{event.tags.length - 4}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Delete */}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="text-muted-foreground hover:text-destructive transition-colors p-1"
            aria-label="Delete event"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </CardContent>
    </Card>
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
