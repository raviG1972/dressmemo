'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, CalendarPlus, Clock, MapPin, Tag, Sparkles, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useStore, type CalendarEvent, getDateKey } from '@/lib/store'
import { format } from 'date-fns'
import { toast } from 'sonner'
import AddEventDialog from './AddEventDialog'
import SuggestionsPanel from './SuggestionsPanel'

const eventTypes = [
  { key: 'formal', label: 'Formal', emoji: '👔' },
  { key: 'casual', label: 'Casual', emoji: '👕' },
  { key: 'party', label: 'Party', emoji: '🎉' },
  { key: 'business', label: 'Business', emoji: '💼' },
  { key: 'wedding', label: 'Wedding', emoji: '💒' },
  { key: 'outdoor', label: 'Outdoor', emoji: '🌿' },
  { key: 'religious', label: 'Religious', emoji: '🛕' },
  { key: 'date', label: 'Date Night', emoji: '❤️' },
]

export default function EventMemoView() {
  const {
    setView, events, selectedDate, setSelectedDate,
    fetchEventsByMonth, deleteEvent, suggestedItems, suggestedOffers,
  } = useStore()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  useEffect(() => {
    const now = new Date()
    fetchEventsByMonth(now.getFullYear(), now.getMonth())
  }, [fetchEventsByMonth])

  // Get all upcoming events (today and future)
  const today = format(new Date(), 'yyyy-MM-dd')
  const allEvents = Object.entries(events)
    .flatMap(([date, evts]) => evts.map(e => ({ ...e, date })))
    .filter(e => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''))

  const selectedEvent = allEvents.find(e => e.id === selectedEventId)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button onClick={() => setView('home')} className="text-rose-500 hover:text-rose-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-rose-900">Event Memos</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Plan outfits for upcoming events
          </p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          size="sm"
          className="rounded-xl bg-rose-500 hover:bg-rose-600 text-white"
        >
          <CalendarPlus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4">
        {allEvents.length > 0 ? (
          <div className="space-y-3 mt-2">
            {allEvents.map((event) => {
              const typeInfo = eventTypes.find(t => t.key === event.eventType)
              const isSelected = selectedEventId === event.id
              return (
                <motion.button
                  key={event.id}
                  layout
                  onClick={() => setSelectedEventId(isSelected ? null : event.id)}
                  className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                    isSelected
                      ? 'border-rose-400 bg-rose-50'
                      : 'border-rose-100 bg-white hover:border-rose-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{typeInfo?.emoji || '📅'}</span>
                        <h3 className="font-semibold text-rose-900 text-sm">{event.title}</h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          📅 {format(new Date(event.date), 'MMM d, EEE')}
                        </span>
                        {event.time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {event.time}
                          </span>
                        )}
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {event.location}
                          </span>
                        )}
                      </div>
                      {event.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {event.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[9px] h-5 bg-rose-50 text-rose-600">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        await deleteEvent(event.id, event.date)
                        if (isSelected) setSelectedEventId(null)
                        toast.success('Event deleted')
                      }}
                      className="text-rose-300 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Expanded: Show suggestions */}
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 pt-3 border-t border-rose-200"
                    >
                      <div className="flex items-center gap-1 mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-xs font-semibold text-rose-700">Suggested for this event</span>
                      </div>
                      <SuggestionsPanel
                        tags={event.tags}
                        items={suggestedItems}
                        offers={suggestedOffers}
                      />
                    </motion.div>
                  )}
                </motion.button>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mb-4">
              <CalendarPlus className="w-10 h-10 text-rose-300" />
            </div>
            <p className="text-muted-foreground text-sm mb-2">No upcoming events</p>
            <p className="text-muted-foreground text-xs mb-4">Create an event memo to get outfit suggestions</p>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="rounded-xl bg-rose-500 hover:bg-rose-600 text-white"
            >
              <CalendarPlus className="w-4 h-4 mr-1" />
              Create Event Memo
            </Button>
          </div>
        )}
      </div>

      <AddEventDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
    </div>
  )
}
