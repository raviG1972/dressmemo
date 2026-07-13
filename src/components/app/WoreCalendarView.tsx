'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, History, Shirt } from 'lucide-react'
import { useStore } from '@/lib/store'
import { format } from 'date-fns'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import { Badge } from '@/components/ui/badge'

export default function WoreCalendarView() {
  const { setView, outfits, fetchOutfitsByMonth, clothingItems } = useStore()
  const [month, setMonth] = useState(new Date())

  useEffect(() => {
    fetchOutfitsByMonth(month.getFullYear(), month.getMonth())
  }, [month, fetchOutfitsByMonth])

  // Days with outfits
  const outfitDays = Object.keys(outfits).filter(k => outfits[k]?.length > 0)
  const outfitDateSet = new Set(outfitDays)

  // Get today's date string
  const today = format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button onClick={() => setView('home')} className="text-rose-500 hover:text-rose-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-rose-900">What I Wore</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            See past outfits on your calendar
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
            hasOutfit: (date) => outfitDateSet.has(format(date, 'yyyy-MM-dd')),
          }}
          modifiersClassNames={{
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
      </div>

      {/* Outfit list for days */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto custom-scrollbar">
        {outfitDays.sort().reverse().slice(0, 10).map((dateStr) => {
          const dayOutfits = outfits[dateStr] || []
          if (dayOutfits.length === 0) return null
          return (
            <div key={dateStr} className="mb-4">
              <h3 className="text-sm font-semibold text-rose-800 mb-2">
                {format(new Date(dateStr), 'EEEE, MMM d')}
                {dateStr === today && (
                  <Badge className="ml-2 bg-rose-500 text-white text-[9px]">Today</Badge>
                )}
              </h3>
              <div className="space-y-2">
                {dayOutfits.map((outfit) => (
                  <div
                    key={outfit.id}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-rose-100"
                  >
                    {outfit.items?.map((item, idx) => {
                      const topItem = item.topId ? clothingItems.find(c => c.id === item.topId) : null
                      const bottomItem = item.bottomId ? clothingItems.find(c => c.id === item.bottomId) : null
                      const fullItem = item.fullSuitId ? clothingItems.find(c => c.id === item.fullSuitId) : null
                      const clothingItem = topItem || bottomItem || fullItem
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
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-rose-900 truncate">{outfit.name}</p>
                      {outfit.eventNote && (
                        <p className="text-[10px] text-muted-foreground truncate">{outfit.eventNote}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        {outfitDays.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <History className="w-10 h-10 text-rose-200 mb-3" />
            <p className="text-sm text-muted-foreground">No past outfits recorded yet</p>
            <p className="text-xs text-muted-foreground mt-1">Save outfits to see them here</p>
          </div>
        )}
      </div>
    </div>
  )
}
