'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Clock, MapPin, Shirt } from 'lucide-react'
import { useStore } from '@/lib/store'
import { format } from 'date-fns'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import { Badge } from '@/components/ui/badge'

export default function EventsCalendarView() {
  const { setView, events, outfits, fetchEventsByMonth, fetchOutfitsByMonth, clothingItems } = useStore()
  const [month, setMonth] = useState(new Date())

  useEffect(() => {
    fetchEventsByMonth(month.getFullYear(), month.getMonth())
    fetchOutfitsByMonth(month.getFullYear(), month.getMonth())
  }, [month, fetchEventsByMonth, fetchOutfitsByMonth])

  const eventDays = new Set(Object.keys(events).filter(k => events[k]?.length > 0))
  const outfitDays = new Set(Object.keys(outfits).filter(k => outfits[k]?.length > 0))

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button onClick={() => setView('home')} className="text-rose-500 hover:text-rose-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-rose-900">Events & Suits</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Calendar view of events & planned outfits
          </p>
        </div>
      </div>

      {/* Calendar */}
      <div className="px-4 pb-4">
        <DayPicker
          month={month}
          onMonthChange={setMonth}
          navLayout="around"
          className="mx-auto rdp-root"
          modifiers={{
            hasEvent: (date) => eventDays.has(format(date, 'yyyy-MM-dd')),
            hasOutfit: (date) => outfitDays.has(format(date, 'yyyy-MM-dd')),
          }}
          modifiersClassNames={{
            hasEvent: 'bg-amber-100 font-bold text-amber-800 rounded-lg',
            hasOutfit: 'bg-rose-100 font-bold text-rose-700 rounded-lg',
          }}
          classNames={{
            months: 'flex flex-col',
            month: 'space-y-4',
            month_caption: 'flex justify-center pt-1 relative items-center h-8',
            caption_label: 'text-sm font-medium text-rose-900',
            nav: 'space-x-1 flex items-center',
            button_previous: 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md',
            button_next: 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md',
            month_grid: 'w-full border-collapse',
            weekdays: 'flex w-full',
            weekday: 'text-rose-400 rounded-md w-9 font-normal text-[10px] flex items-center justify-center',
            week: 'flex w-full mt-2',
            day: 'text-center text-sm p-0 relative h-9 w-9 flex items-center justify-center',
            day_button: 'h-9 w-9 p-0 font-normal rounded-lg hover:bg-rose-50 transition-colors inline-flex items-center justify-center text-sm',
            selected: 'bg-rose-500 text-white hover:bg-rose-600 rounded-lg',
            today: 'bg-rose-50 font-bold text-rose-900 rounded-lg',
            outside: 'text-muted-foreground opacity-40',
            disabled: 'text-muted-foreground opacity-40',
            hidden: 'invisible',
          }}
        />
        <div className="flex items-center gap-4 justify-center mt-2">
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="w-3 h-3 rounded bg-amber-100 border border-amber-200" /> Event
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="w-3 h-3 rounded bg-rose-100 border border-rose-200" /> Outfit
          </span>
        </div>
      </div>

      {/* Events list */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto custom-scrollbar">
        {Object.entries(events)
          .filter(([, evts]) => evts.length > 0)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([dateStr, dayEvents]) => (
            <div key={dateStr} className="mb-4">
              <h3 className="text-sm font-semibold text-rose-800 mb-2 flex items-center gap-2">
                {format(new Date(dateStr), 'EEEE, MMM d')}
              </h3>
              {dayEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-3 bg-white rounded-xl border border-amber-100 mb-2"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{event.eventType === 'wedding' ? '💒' : event.eventType === 'party' ? '🎉' : '📅'}</span>
                    <span className="text-sm font-medium text-amber-900">{event.title}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                    {event.time && <span><Clock className="w-3 h-3 inline mr-0.5" />{event.time}</span>}
                    {event.location && <span><MapPin className="w-3 h-3 inline mr-0.5" />{event.location}</span>}
                  </div>
                  {event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {event.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-[9px] h-4 bg-amber-50 text-amber-700">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Show outfits for same day */}
              {outfits[dateStr]?.map((outfit) => (
                <div
                  key={outfit.id}
                  className="p-3 bg-white rounded-xl border border-rose-100 mb-2 flex items-center gap-3"
                >
                  {outfit.items?.map((item, idx) => {
                    const clothingItem = item.topId
                      ? clothingItems.find(c => c.id === item.topId)
                      : item.bottomId
                        ? clothingItems.find(c => c.id === item.bottomId)
                        : item.fullSuitId
                          ? clothingItems.find(c => c.id === item.fullSuitId)
                          : null
                    return clothingItem ? (
                      <div key={idx} className="w-10 h-10 rounded-lg overflow-hidden border border-rose-100">
                        {clothingItem.imageUrl ? (
                          <img src={clothingItem.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-rose-50 flex items-center justify-center">
                            <Shirt className="w-4 h-4 text-rose-200" />
                          </div>
                        )}
                      </div>
                    ) : null
                  })}
                  <span className="text-xs text-rose-700">{outfit.name}</span>
                </div>
              ))}
            </div>
          ))}
      </div>
    </div>
  )
}
