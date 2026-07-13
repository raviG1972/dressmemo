'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Check, ChevronLeft, ChevronRight,
  Shirt, Tag, CalendarDays,
} from 'lucide-react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { useStore, type ClothingItem, getDateKey } from '@/lib/store'
import { format } from 'date-fns'
import { toast } from 'sonner'

export default function MatchSuitView() {
  const { clothingItems, fetchClothingItems, selectedDate, setSelectedDate, setView } = useStore()
  const [selectedTopId, setSelectedTopId] = useState<string | null>(null)
  const [selectedBottomId, setSelectedBottomId] = useState<string | null>(null)
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [saveDate, setSaveDate] = useState<Date>(selectedDate)
  const [outfitName, setOutfitName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchClothingItems()
  }, [fetchClothingItems])

  const tops = clothingItems.filter((i) => i.category === 'TOP')
  const bottoms = clothingItems.filter((i) => i.category === 'BOTTOM')
  const fullSuits = clothingItems.filter((i) => i.category === 'FULL_SUIT')
  const shoes = clothingItems.filter((i) => i.category === 'SHOES')
  const accessories = clothingItems.filter((i) => i.category === 'ACCESSORY')

  const selectedTop = tops.find((i) => i.id === selectedTopId)
  const selectedBottom = bottoms.find((i) => i.id === selectedBottomId)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/outfits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: getDateKey(saveDate),
          name: outfitName || 'Matched Outfit',
          topId: selectedTopId,
          bottomId: selectedBottomId,
          fullSuitId: null,
          shoesId: null,
          accessoryIds: [],
        }),
      })
      if (res.ok) {
        toast.success('Outfit matched & saved! 👗✨')
        setIsSaveDialogOpen(false)
        setSelectedTopId(null)
        setSelectedBottomId(null)
        setOutfitName('')
      } else {
        toast.error('Failed to save outfit')
      }
    } catch {
      toast.error('Failed to save outfit')
    }
    setIsSaving(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button onClick={() => setView('home')} className="text-rose-500 hover:text-rose-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-rose-900">Match a Suit</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Slide to find your perfect match
          </p>
        </div>
        <Button
          onClick={() => { setSaveDate(selectedDate); setIsSaveDialogOpen(true) }}
          disabled={!selectedTopId && !selectedBottomId}
          size="sm"
          className="rounded-xl bg-rose-500 hover:bg-rose-600 text-white"
        >
          <Check className="w-4 h-4 mr-1" />
          Save
        </Button>
      </div>

      {/* Split-screen outfit matcher */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Panel */}
        <div className="flex-1 border-b-2 border-rose-200 bg-rose-50/30 flex flex-col min-h-0">
          <div className="px-4 py-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-rose-700 flex items-center gap-1.5">
              👕 Top
              {selectedTop && (
                <Badge className="bg-rose-500 text-white text-[10px] ml-1">
                  {selectedTop.subType || 'Top'}
                </Badge>
              )}
            </p>
            <p className="text-[10px] text-rose-400">{tops.length} items</p>
          </div>
          <div className="flex-1 min-h-0">
            {tops.length > 0 ? (
              <SwipePanel
                items={tops}
                selectedId={selectedTopId}
                onSelect={(id) => setSelectedTopId(selectedTopId === id ? null : id)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-6">
                <Shirt className="w-8 h-8 text-rose-200 mb-2" />
                <p className="text-xs text-rose-400">Save tops first</p>
              </div>
            )}
          </div>
        </div>

        {/* Match indicator */}
        <div className="flex items-center justify-center py-1.5 bg-white border-b border-rose-100">
          <span className="text-xs font-bold text-rose-500 flex items-center gap-1">
            {selectedTopId && selectedBottomId ? '✨ Perfect Match!' : '↕ Slide to match'}
          </span>
        </div>

        {/* Bottom Panel */}
        <div className="flex-1 bg-sky-50/30 flex flex-col min-h-0">
          <div className="px-4 py-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-sky-700 flex items-center gap-1.5">
              👖 Bottom
              {selectedBottom && (
                <Badge className="bg-sky-500 text-white text-[10px] ml-1">
                  {selectedBottom.subType || 'Bottom'}
                </Badge>
              )}
            </p>
            <p className="text-[10px] text-sky-400">{bottoms.length} items</p>
          </div>
          <div className="flex-1 min-h-0">
            {bottoms.length > 0 ? (
              <SwipePanel
                items={bottoms}
                selectedId={selectedBottomId}
                onSelect={(id) => setSelectedBottomId(selectedBottomId === id ? null : id)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-6">
                <Shirt className="w-8 h-8 text-sky-200 mb-2" />
                <p className="text-xs text-sky-400">Save bottoms first</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-rose-900">Save Matched Outfit</DialogTitle>
            <DialogDescription>Choose a date and name for this outfit</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Preview */}
            <div className="flex gap-2 bg-rose-50 rounded-xl p-3">
              <div className="flex-1 aspect-[3/4] rounded-lg overflow-hidden border border-rose-200">
                {selectedTop?.imageUrl ? (
                  <img src={selectedTop.imageUrl} alt="Top" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-rose-200">
                    👕
                  </div>
                )}
              </div>
              <div className="flex-1 aspect-[3/4] rounded-lg overflow-hidden border border-sky-200">
                {selectedBottom?.imageUrl ? (
                  <img src={selectedBottom.imageUrl} alt="Bottom" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sky-200">
                    👖
                  </div>
                )}
              </div>
            </div>

            <div>
              <Calendar
                mode="single"
                selected={saveDate}
                onSelect={(d) => d && setSaveDate(d)}
                className="rounded-xl border border-rose-100 mx-auto"
              />
            </div>

            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Outfit name (e.g., Office Meeting)"
                value={outfitName}
                onChange={(e) => setOutfitName(e.target.value)}
                className="pl-10 h-11 rounded-xl border-rose-200 focus:border-rose-400"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full h-12 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold"
            >
              {isSaving ? 'Saving...' : 'Save Outfit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Swipeable panel - one item at a time, swipe left/right
function SwipePanel({
  items,
  selectedId,
  onSelect,
}: {
  items: ClothingItem[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <Carousel
      opts={{ align: 'center', loop: true }}
      className="w-full h-full"
    >
      <CarouselContent className="-ml-0 h-full">
        {items.map((item) => {
          const isSelected = selectedId === item.id
          return (
            <CarouselItem key={item.id} className="pl-0 basis-full sm:basis-1/2 lg:basis-1/3 h-full">
              <button
                onClick={() => onSelect(item.id)}
                className={`relative w-full h-full rounded-xl overflow-hidden border-2 transition-all ${
                  isSelected
                    ? 'border-rose-500 ring-2 ring-rose-200'
                    : 'border-transparent hover:border-rose-200'
                }`}
              >
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.subType} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white flex items-center justify-center">
                    <Shirt className="w-10 h-10 text-rose-200" />
                  </div>
                )}
                {/* Label overlay */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <p className="text-sm text-white font-medium truncate">{item.subType || 'Item'}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {item.color && (
                      <span
                        className="w-3 h-3 rounded-full border border-white/50"
                        style={{ backgroundColor: item.color }}
                      />
                    )}
                    {item.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-[9px] text-white/80 bg-white/20 px-1.5 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </button>
            </CarouselItem>
          )
        })}
      </CarouselContent>
      <CarouselPrevious className="left-1 size-8 bg-white/80 border-rose-200 text-rose-600 hover:bg-rose-50" />
      <CarouselNext className="right-1 size-8 bg-white/80 border-rose-200 text-rose-600 hover:bg-rose-50" />
    </Carousel>
  )
}
