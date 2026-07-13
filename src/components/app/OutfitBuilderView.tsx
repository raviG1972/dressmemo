'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Shirt, Check, CalendarDays, Tag, ArrowLeft, ArrowRight } from 'lucide-react'
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
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { useStore, type ClothingItem, type ClothingCategory, getDateKey } from '@/lib/store'
import { format } from 'date-fns'
import { toast } from 'sonner'

type BuilderStep = 1 | 2
type SuitMode = 'separate' | 'full'

export default function OutfitBuilderView() {
  const { clothingItems, fetchClothingItems, selectedDate, setSelectedDate } = useStore()
  const [step, setStep] = useState<BuilderStep>(1)
  const [suitMode, setSuitMode] = useState<SuitMode>('separate')
  const [selectedTopId, setSelectedTopId] = useState<string | null>(null)
  const [selectedBottomId, setSelectedBottomId] = useState<string | null>(null)
  const [selectedFullSuitId, setSelectedFullSuitId] = useState<string | null>(null)
  const [selectedShoesId, setSelectedShoesId] = useState<string | null>(null)
  const [selectedAccessoryIds, setSelectedAccessoryIds] = useState<string[]>([])
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

  const toggleAccessory = (id: string) => {
    setSelectedAccessoryIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  const canProceedToStep2 = suitMode === 'full'
    ? !!selectedFullSuitId
    : !!selectedTopId || !!selectedBottomId

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/outfits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: getDateKey(saveDate),
          name: outfitName || 'Outfit',
          topId: suitMode === 'separate' ? selectedTopId : null,
          bottomId: suitMode === 'separate' ? selectedBottomId : null,
          fullSuitId: suitMode === 'full' ? selectedFullSuitId : null,
          shoesId: selectedShoesId,
          accessoryIds: selectedAccessoryIds,
        }),
      })
      if (res.ok) {
        toast.success('Outfit saved! 👗✨')
        setIsSaveDialogOpen(false)
        resetBuilder()
      } else {
        toast.error('Failed to save outfit')
      }
    } catch {
      toast.error('Failed to save outfit')
    }
    setIsSaving(false)
  }

  const resetBuilder = () => {
    setStep(1)
    setSuitMode('separate')
    setSelectedTopId(null)
    setSelectedBottomId(null)
    setSelectedFullSuitId(null)
    setSelectedShoesId(null)
    setSelectedAccessoryIds([])
    setOutfitName('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        {step === 2 && (
          <button onClick={() => setStep(1)} className="text-rose-500 hover:text-rose-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex-1">
          <h1 className="text-xl font-bold text-rose-900">Outfit Builder</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Step {step} of 2 — {step === 1 ? 'Pick top & bottom' : 'Add shoes & accessories'}
          </p>
        </div>
        {/* Step indicators */}
        <div className="flex gap-1.5">
          <div className={`w-8 h-1.5 rounded-full ${step >= 1 ? 'bg-rose-500' : 'bg-rose-100'}`} />
          <div className={`w-8 h-1.5 rounded-full ${step >= 2 ? 'bg-rose-500' : 'bg-rose-100'}`} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <Step1Content
              suitMode={suitMode}
              setSuitMode={setSuitMode}
              tops={tops}
              bottoms={bottoms}
              fullSuits={fullSuits}
              selectedTopId={selectedTopId}
              selectedBottomId={selectedBottomId}
              selectedFullSuitId={selectedFullSuitId}
              setSelectedTopId={setSelectedTopId}
              setSelectedBottomId={setSelectedBottomId}
              setSelectedFullSuitId={setSelectedFullSuitId}
            />
          ) : (
            <Step2Content
              shoes={shoes}
              accessories={accessories}
              selectedShoesId={selectedShoesId}
              selectedAccessoryIds={selectedAccessoryIds}
              setSelectedShoesId={setSelectedShoesId}
              toggleAccessory={toggleAccessory}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Bottom actions */}
      <div className="px-4 py-3 border-t border-rose-100 bg-white/80 backdrop-blur-sm">
        {step === 1 ? (
          <Button
            onClick={() => setStep(2)}
            disabled={!canProceedToStep2}
            className="w-full h-12 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold"
          >
            Next: Shoes & Accessories
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="flex-1 h-12 rounded-xl border-rose-200 text-rose-700"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <Button
              onClick={() => { setSaveDate(selectedDate); setIsSaveDialogOpen(true) }}
              className="flex-[2] h-12 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold"
            >
              <Check className="w-4 h-4 mr-1" />
              Save Outfit
            </Button>
          </div>
        )}
      </div>

      {/* Save Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-rose-900">Save Outfit</DialogTitle>
            <DialogDescription>Choose a date and name for this outfit</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Date */}
            <div>
              <Calendar
                mode="single"
                selected={saveDate}
                onSelect={(d) => d && setSaveDate(d)}
                className="rounded-xl border border-rose-100 mx-auto"
              />
            </div>

            {/* Name */}
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Outfit name (e.g., Office Meeting)"
                value={outfitName}
                onChange={(e) => setOutfitName(e.target.value)}
                className="pl-10 h-11 rounded-xl border-rose-200 focus:border-rose-400"
              />
            </div>

            {/* Summary */}
            <div className="bg-rose-50 rounded-xl p-3 space-y-1">
              <p className="text-xs font-semibold text-rose-900">Outfit Summary</p>
              <div className="flex flex-wrap gap-1.5">
                {suitMode === 'full' && selectedFullSuitId && (
                  <Badge className="bg-rose-500 text-white text-[10px]">
                    {clothingItems.find((i) => i.id === selectedFullSuitId)?.subType || 'Full Suit'}
                  </Badge>
                )}
                {suitMode === 'separate' && selectedTopId && (
                  <Badge className="bg-rose-500 text-white text-[10px]">
                    {clothingItems.find((i) => i.id === selectedTopId)?.subType || 'Top'}
                  </Badge>
                )}
                {suitMode === 'separate' && selectedBottomId && (
                  <Badge className="bg-rose-500 text-white text-[10px]">
                    {clothingItems.find((i) => i.id === selectedBottomId)?.subType || 'Bottom'}
                  </Badge>
                )}
                {selectedShoesId && (
                  <Badge className="bg-rose-500 text-white text-[10px]">
                    {clothingItems.find((i) => i.id === selectedShoesId)?.subType || 'Shoes'}
                  </Badge>
                )}
                {selectedAccessoryIds.map((id) => (
                  <Badge key={id} className="bg-rose-500 text-white text-[10px]">
                    {clothingItems.find((i) => i.id === id)?.subType || 'Accessory'}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-rose-600">
                📅 {format(saveDate, 'EEEE, MMM d, yyyy')}
              </p>
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

// Step 1: Top & Bottom / Full Suit
function Step1Content({
  suitMode,
  setSuitMode,
  tops,
  bottoms,
  fullSuits,
  selectedTopId,
  selectedBottomId,
  selectedFullSuitId,
  setSelectedTopId,
  setSelectedBottomId,
  setSelectedFullSuitId,
}: {
  suitMode: SuitMode
  setSuitMode: (m: SuitMode) => void
  tops: ClothingItem[]
  bottoms: ClothingItem[]
  fullSuits: ClothingItem[]
  selectedTopId: string | null
  selectedBottomId: string | null
  selectedFullSuitId: string | null
  setSelectedTopId: (id: string | null) => void
  setSelectedBottomId: (id: string | null) => void
  setSelectedFullSuitId: (id: string | null) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="px-4 pb-4"
    >
      {/* Mode switcher */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <button
          onClick={() => setSuitMode('separate')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            suitMode === 'separate'
              ? 'bg-rose-500 text-white shadow-sm'
              : 'bg-rose-50 text-rose-700'
          }`}
        >
          👕 Top + 👖 Bottom
        </button>
        <button
          onClick={() => setSuitMode('full')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            suitMode === 'full'
              ? 'bg-rose-500 text-white shadow-sm'
              : 'bg-rose-50 text-rose-700'
          }`}
        >
          👗 Full Suit
        </button>
      </div>

      {suitMode === 'separate' ? (
        /* Split screen: top carousel + bottom carousel */
        <div className="flex flex-col gap-3">
          {/* Top half */}
          <div className="border border-rose-100 rounded-xl p-3 bg-rose-50/50">
            <p className="text-xs font-semibold text-rose-700 mb-2 flex items-center gap-1">
              👕 Top
            </p>
            <ItemCarousel
              items={tops}
              selectedId={selectedTopId}
              onSelect={setSelectedTopId}
              emptyMessage="Add tops in Wardrobe"
            />
          </div>

          {/* OR divider */}
          <div className="flex items-center justify-center">
            <span className="bg-white text-rose-400 text-xs font-bold px-3 py-1 rounded-full border border-rose-100">
              +
            </span>
          </div>

          {/* Bottom half */}
          <div className="border border-rose-100 rounded-xl p-3 bg-rose-50/50">
            <p className="text-xs font-semibold text-rose-700 mb-2 flex items-center gap-1">
              👖 Bottom
            </p>
            <ItemCarousel
              items={bottoms}
              selectedId={selectedBottomId}
              onSelect={setSelectedBottomId}
              emptyMessage="Add bottoms in Wardrobe"
            />
          </div>
        </div>
      ) : (
        /* Full suit carousel */
        <div className="border border-rose-100 rounded-xl p-3 bg-rose-50/50">
          <p className="text-xs font-semibold text-rose-700 mb-2 flex items-center gap-1">
            👗 Full Suit / Dress
          </p>
          <ItemCarousel
            items={fullSuits}
            selectedId={selectedFullSuitId}
            onSelect={setSelectedFullSuitId}
            emptyMessage="Add full suits in Wardrobe"
          />
        </div>
      )}
    </motion.div>
  )
}

// Step 2: Shoes & Accessories
function Step2Content({
  shoes,
  accessories,
  selectedShoesId,
  selectedAccessoryIds,
  setSelectedShoesId,
  toggleAccessory,
}: {
  shoes: ClothingItem[]
  accessories: ClothingItem[]
  selectedShoesId: string | null
  selectedAccessoryIds: string[]
  setSelectedShoesId: (id: string | null) => void
  toggleAccessory: (id: string) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="px-4 pb-4 space-y-4"
    >
      {/* Shoes */}
      <div className="border border-rose-100 rounded-xl p-3 bg-rose-50/50">
        <p className="text-xs font-semibold text-rose-700 mb-2 flex items-center gap-1">
          👟 Shoes
          <span className="text-[10px] text-rose-400 font-normal">(optional)</span>
        </p>
        <ItemCarousel
          items={shoes}
          selectedId={selectedShoesId}
          onSelect={(id) => setSelectedShoesId(selectedShoesId === id ? null : id)}
          emptyMessage="Add shoes in Wardrobe"
        />
      </div>

      {/* Accessories */}
      <div className="border border-rose-100 rounded-xl p-3 bg-rose-50/50">
        <p className="text-xs font-semibold text-rose-700 mb-2 flex items-center gap-1">
          💍 Accessories
          <span className="text-[10px] text-rose-400 font-normal">(tap to select multiple)</span>
        </p>
        {accessories.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {accessories.map((item) => {
              const isSelected = selectedAccessoryIds.includes(item.id)
              return (
                <button
                  key={item.id}
                  onClick={() => toggleAccessory(item.id)}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all aspect-square ${
                    isSelected
                      ? 'border-rose-500 ring-2 ring-rose-200'
                      : 'border-rose-100 hover:border-rose-300'
                  }`}
                >
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.subType} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-rose-50 flex items-center justify-center">
                      <Shirt className="w-5 h-5 text-rose-200" />
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent p-1">
                    <p className="text-[9px] text-white font-medium truncate">{item.subType}</p>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <EmptyMessage message="Add accessories in Wardrobe" />
        )}
      </div>
    </motion.div>
  )
}

// Shared carousel component for browsing items
function ItemCarousel({
  items,
  selectedId,
  onSelect,
  emptyMessage,
}: {
  items: ClothingItem[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  emptyMessage: string
}) {
  if (items.length === 0) {
    return <EmptyMessage message={emptyMessage} />
  }

  return (
    <Carousel
      opts={{ align: 'center', loop: true }}
      className="w-full"
    >
      <CarouselContent className="-ml-2">
        {items.map((item) => {
          const isSelected = selectedId === item.id
          return (
            <CarouselItem key={item.id} className="pl-2 basis-1/3 sm:basis-1/4 lg:basis-1/5">
              <button
                onClick={() => onSelect(isSelected ? null : item.id)}
                className={`relative w-full aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${
                  isSelected
                    ? 'border-rose-500 ring-2 ring-rose-200'
                    : 'border-rose-100 hover:border-rose-300'
                }`}
              >
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.subType} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white flex items-center justify-center">
                    <Shirt className="w-6 h-6 text-rose-200" />
                  </div>
                )}
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent p-1.5">
                  <p className="text-[10px] text-white font-medium truncate">{item.subType}</p>
                  {item.color && (
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full border border-white/50 mt-0.5"
                      style={{ backgroundColor: item.color }}
                    />
                  )}
                </div>
              </button>
            </CarouselItem>
          )
        })}
      </CarouselContent>
      <CarouselPrevious className="left-0 size-7 bg-white/80 border-rose-200 text-rose-600 hover:bg-rose-50" />
      <CarouselNext className="right-0 size-7 bg-white/80 border-rose-200 text-rose-600 hover:bg-rose-50" />
    </Carousel>
  )
}

function EmptyMessage({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Shirt className="w-8 h-8 text-rose-200 mb-2" />
      <p className="text-xs text-rose-400">{message}</p>
    </div>
  )
}
