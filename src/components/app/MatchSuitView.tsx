'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Check, Shirt, Tag, SlidersHorizontal, X,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useStore, type ClothingItem, getDateKey } from '@/lib/store'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface PanelFilter {
  colors: string[]
  tags: string[]
  subTypes: string[]
}

const emptyFilter: PanelFilter = { colors: [], tags: [], subTypes: [] }

export default function MatchSuitView() {
  const { clothingItems, fetchClothingItems, selectedDate, setSelectedDate, setView } = useStore()
  const [selectedTopId, setSelectedTopId] = useState<string | null>(null)
  const [selectedBottomId, setSelectedBottomId] = useState<string | null>(null)
  const [topFilter, setTopFilter] = useState<PanelFilter>(emptyFilter)
  const [bottomFilter, setBottomFilter] = useState<PanelFilter>(emptyFilter)
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [saveDate, setSaveDate] = useState<Date>(selectedDate)
  const [outfitName, setOutfitName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchClothingItems()
  }, [fetchClothingItems])

  const allTops = clothingItems.filter((i) => i.category === 'TOP')
  const allBottoms = clothingItems.filter((i) => i.category === 'BOTTOM')

  // Extract filter options from actual data
  const topFilterOptions = useMemo(() => ({
    colors: [...new Set(allTops.map(i => i.color).filter(Boolean))],
    tags: [...new Set(allTops.flatMap(i => i.tags))],
    subTypes: [...new Set(allTops.map(i => i.subType).filter(Boolean))],
  }), [allTops])

  const bottomFilterOptions = useMemo(() => ({
    colors: [...new Set(allBottoms.map(i => i.color).filter(Boolean))],
    tags: [...new Set(allBottoms.flatMap(i => i.tags))],
    subTypes: [...new Set(allBottoms.map(i => i.subType).filter(Boolean))],
  }), [allBottoms])

  // Apply filters
  const filteredTops = useMemo(() => {
    return allTops.filter(item => {
      if (topFilter.colors.length > 0 && !topFilter.colors.includes(item.color)) return false
      if (topFilter.tags.length > 0 && !topFilter.tags.some(t => item.tags.includes(t))) return false
      if (topFilter.subTypes.length > 0 && !topFilter.subTypes.includes(item.subType)) return false
      return true
    })
  }, [allTops, topFilter])

  const filteredBottoms = useMemo(() => {
    return allBottoms.filter(item => {
      if (bottomFilter.colors.length > 0 && !bottomFilter.colors.includes(item.color)) return false
      if (bottomFilter.tags.length > 0 && !bottomFilter.tags.some(t => item.tags.includes(t))) return false
      if (bottomFilter.subTypes.length > 0 && !bottomFilter.subTypes.includes(item.subType)) return false
      return true
    })
  }, [allBottoms, bottomFilter])

  const selectedTop = allTops.find((i) => i.id === selectedTopId)
  const selectedBottom = allBottoms.find((i) => i.id === selectedBottomId)

  const topFilterCount = topFilter.colors.length + topFilter.tags.length + topFilter.subTypes.length
  const bottomFilterCount = bottomFilter.colors.length + bottomFilter.tags.length + bottomFilter.subTypes.length

  const toggleFilterValue = (filter: PanelFilter, setFilter: (f: PanelFilter) => void, key: keyof PanelFilter, value: string) => {
    const current = filter[key]
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    setFilter({ ...filter, [key]: updated })
  }

  const clearFilter = (setFilter: (f: PanelFilter) => void) => {
    setFilter(emptyFilter)
  }

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
        {/* ====== Top Panel ====== */}
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
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-rose-400">
                {filteredTops.length}/{allTops.length}
              </span>
              <FilterButton
                filterOptions={topFilterOptions}
                activeFilter={topFilter}
                filterCount={topFilterCount}
                onToggle={(key, value) => toggleFilterValue(topFilter, setTopFilter, key, value)}
                onClear={() => clearFilter(setTopFilter)}
                accentColor="rose"
              />
            </div>
          </div>

          {/* Active filter chips */}
          {topFilterCount > 0 && (
            <div className="px-4 pb-1 flex flex-wrap gap-1">
              {topFilter.subTypes.map(v => (
                <FilterChip key={`st-${v}`} label={v} onRemove={() => toggleFilterValue(topFilter, setTopFilter, 'subTypes', v)} color="rose" />
              ))}
              {topFilter.colors.map(v => (
                <FilterChip key={`c-${v}`} label={v} onRemove={() => toggleFilterValue(topFilter, setTopFilter, 'colors', v)} color="rose" icon={<span className="w-2.5 h-2.5 rounded-full mr-1" style={{ backgroundColor: v }} />} />
              ))}
              {topFilter.tags.map(v => (
                <FilterChip key={`t-${v}`} label={v} onRemove={() => toggleFilterValue(topFilter, setTopFilter, 'tags', v)} color="rose" />
              ))}
            </div>
          )}

          <div className="flex-1 min-h-0">
            {filteredTops.length > 0 ? (
              <SwipePanel
                items={filteredTops}
                selectedId={selectedTopId}
                onSelect={(id) => setSelectedTopId(selectedTopId === id ? null : id)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-6">
                <Shirt className="w-8 h-8 text-rose-200 mb-2" />
                <p className="text-xs text-rose-400">
                  {allTops.length === 0 ? 'Save tops first' : 'No tops match filters'}
                </p>
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

        {/* ====== Bottom Panel ====== */}
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
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-sky-400">
                {filteredBottoms.length}/{allBottoms.length}
              </span>
              <FilterButton
                filterOptions={bottomFilterOptions}
                activeFilter={bottomFilter}
                filterCount={bottomFilterCount}
                onToggle={(key, value) => toggleFilterValue(bottomFilter, setBottomFilter, key, value)}
                onClear={() => clearFilter(setBottomFilter)}
                accentColor="sky"
              />
            </div>
          </div>

          {/* Active filter chips */}
          {bottomFilterCount > 0 && (
            <div className="px-4 pb-1 flex flex-wrap gap-1">
              {bottomFilter.subTypes.map(v => (
                <FilterChip key={`st-${v}`} label={v} onRemove={() => toggleFilterValue(bottomFilter, setBottomFilter, 'subTypes', v)} color="sky" />
              ))}
              {bottomFilter.colors.map(v => (
                <FilterChip key={`c-${v}`} label={v} onRemove={() => toggleFilterValue(bottomFilter, setBottomFilter, 'colors', v)} color="sky" icon={<span className="w-2.5 h-2.5 rounded-full mr-1" style={{ backgroundColor: v }} />} />
              ))}
              {bottomFilter.tags.map(v => (
                <FilterChip key={`t-${v}`} label={v} onRemove={() => toggleFilterValue(bottomFilter, setBottomFilter, 'tags', v)} color="sky" />
              ))}
            </div>
          )}

          <div className="flex-1 min-h-0">
            {filteredBottoms.length > 0 ? (
              <SwipePanel
                items={filteredBottoms}
                selectedId={selectedBottomId}
                onSelect={(id) => setSelectedBottomId(selectedBottomId === id ? null : id)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-6">
                <Shirt className="w-8 h-8 text-sky-200 mb-2" />
                <p className="text-xs text-sky-400">
                  {allBottoms.length === 0 ? 'Save bottoms first' : 'No bottoms match filters'}
                </p>
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
            <div className="flex gap-2 bg-rose-50 rounded-xl p-3">
              <div className="flex-1 aspect-[3/4] rounded-lg overflow-hidden border border-rose-200">
                {selectedTop?.imageUrl ? (
                  <img src={selectedTop.imageUrl} alt="Top" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-rose-200">👕</div>
                )}
              </div>
              <div className="flex-1 aspect-[3/4] rounded-lg overflow-hidden border border-sky-200">
                {selectedBottom?.imageUrl ? (
                  <img src={selectedBottom.imageUrl} alt="Bottom" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sky-200">👖</div>
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

// ─── Filter Button with Popover ───────────────────────────────────────

function FilterButton({
  filterOptions,
  activeFilter,
  filterCount,
  onToggle,
  onClear,
  accentColor,
}: {
  filterOptions: { colors: string[]; tags: string[]; subTypes: string[] }
  activeFilter: PanelFilter
  filterCount: number
  onToggle: (key: keyof PanelFilter, value: string) => void
  onClear: () => void
  accentColor: 'rose' | 'sky'
}) {
  const colorStyles = accentColor === 'rose'
    ? { active: 'bg-rose-500 text-white', hover: 'hover:bg-rose-50', badge: 'bg-rose-500', border: 'border-rose-200' }
    : { active: 'bg-sky-500 text-white', hover: 'hover:bg-sky-50', badge: 'bg-sky-500', border: 'border-sky-200' }

  const hasOptions = filterOptions.colors.length > 0 || filterOptions.tags.length > 0 || filterOptions.subTypes.length > 0

  if (!hasOptions) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`relative flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
            filterCount > 0
              ? `${colorStyles.active} border-transparent`
              : `bg-white ${colorStyles.border} text-muted-foreground ${colorStyles.hover}`
          }`}
        >
          <SlidersHorizontal className="w-3 h-3" />
          Filter
          {filterCount > 0 && (
            <span className="ml-0.5 w-4 h-4 rounded-full bg-white/30 text-[9px] flex items-center justify-center font-bold">
              {filterCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 rounded-xl p-3" align="end">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">Filter</p>
          {filterCount > 0 && (
            <button onClick={onClear} className="text-xs text-rose-500 hover:underline flex items-center gap-1">
              <X className="w-3 h-3" /> Clear all
            </button>
          )}
        </div>

        {/* Sub-types */}
        {filterOptions.subTypes.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Type</p>
            <div className="flex flex-wrap gap-1">
              {filterOptions.subTypes.map(v => (
                <FilterToggle
                  key={v}
                  label={v}
                  active={activeFilter.subTypes.includes(v)}
                  onClick={() => onToggle('subTypes', v)}
                  colorStyles={colorStyles}
                />
              ))}
            </div>
          </div>
        )}

        {/* Colors */}
        {filterOptions.colors.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Color</p>
            <div className="flex flex-wrap gap-1">
              {filterOptions.colors.map(v => (
                <FilterToggle
                  key={v}
                  label={v}
                  active={activeFilter.colors.includes(v)}
                  onClick={() => onToggle('colors', v)}
                  colorStyles={colorStyles}
                  icon={<span className="w-2.5 h-2.5 rounded-full mr-1 border border-black/10" style={{ backgroundColor: v }} />}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {filterOptions.tags.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Tags</p>
            <div className="flex flex-wrap gap-1">
              {filterOptions.tags.map(v => (
                <FilterToggle
                  key={v}
                  label={v}
                  active={activeFilter.tags.includes(v)}
                  onClick={() => onToggle('tags', v)}
                  colorStyles={colorStyles}
                />
              ))}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// ─── Filter Toggle Chip ───────────────────────────────────────────────

function FilterToggle({
  label,
  active,
  onClick,
  colorStyles,
  icon,
}: {
  label: string
  active: boolean
  onClick: () => void
  colorStyles: { active: string; hover: string; badge: string; border: string }
  icon?: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
        active
          ? colorStyles.active
          : `bg-gray-50 text-gray-600 border border-gray-200 ${colorStyles.hover}`
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

// ─── Active Filter Chip (shown below panel header) ────────────────────

function FilterChip({
  label,
  onRemove,
  color,
  icon,
}: {
  label: string
  onRemove: () => void
  color: 'rose' | 'sky'
  icon?: React.ReactNode
}) {
  const styles = color === 'rose'
    ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
    : 'bg-sky-100 text-sky-700 hover:bg-sky-200'

  return (
    <button
      onClick={onRemove}
      className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${styles}`}
    >
      {icon}
      {label}
      <X className="w-2.5 h-2.5 ml-0.5 opacity-60" />
    </button>
  )
}

// ─── Swipeable Panel ──────────────────────────────────────────────────

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
