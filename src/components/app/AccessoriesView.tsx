'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Gem, Heart, Shirt, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useStore, type ClothingItem } from '@/lib/store'
import AddClothingDialog from './AddClothingDialog'

export default function AccessoriesView() {
  const { clothingItems, fetchClothingItems, toggleFavorite, setView } = useStore()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [activeSubType, setActiveSubType] = useState<string>('ALL')

  useEffect(() => {
    fetchClothingItems('ACCESSORY')
  }, [fetchClothingItems])

  const accessories = clothingItems.filter((i) => i.category === 'ACCESSORY')

  // Get unique subtypes
  const subTypes = ['ALL', ...Array.from(new Set(accessories.map(a => a.subType).filter(Boolean)))]

  const filteredAccessories = activeSubType === 'ALL'
    ? accessories
    : accessories.filter(a => a.subType === activeSubType)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button onClick={() => setView('home')} className="text-rose-500 hover:text-rose-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-rose-900">My Accessories</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {accessories.length} item{accessories.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          size="sm"
          className="rounded-xl bg-violet-500 hover:bg-violet-600 text-white"
        >
          + Add
        </Button>
      </div>

      {/* Sub-type filter */}
      {subTypes.length > 1 && (
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
            {subTypes.map((type) => (
              <button
                key={type}
                onClick={() => setActiveSubType(type)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  activeSubType === type
                    ? 'bg-violet-500 text-white'
                    : 'bg-violet-50 text-violet-700 hover:bg-violet-100'
                }`}
              >
                {type === 'ALL' ? '💍 All' : type}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto custom-scrollbar">
        {filteredAccessories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredAccessories.map((item) => (
              <AccessoryCard key={item.id} item={item} onToggleFavorite={toggleFavorite} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-violet-50 flex items-center justify-center mb-4">
              <Gem className="w-10 h-10 text-violet-300" />
            </div>
            <p className="text-muted-foreground text-sm mb-2">No accessories yet</p>
            <p className="text-muted-foreground text-xs mb-4">Add jewelry, bags, watches & more</p>
          </div>
        )}
      </div>

      <AddClothingDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        defaultCategory="ACCESSORY"
      />
    </div>
  )
}

function AccessoryCard({
  item,
  onToggleFavorite,
}: {
  item: ClothingItem
  onToggleFavorite: (id: string) => Promise<void>
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative rounded-xl overflow-hidden border border-violet-100 bg-white"
    >
      <div className="aspect-square bg-violet-50 relative">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.subType} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Gem className="w-8 h-8 text-violet-200" />
          </div>
        )}
        <button
          onClick={() => onToggleFavorite(item.id)}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center"
        >
          <Heart
            className={`w-3.5 h-3.5 ${
              item.isFavorite ? 'fill-violet-500 text-violet-500' : 'text-muted-foreground'
            }`}
          />
        </button>
      </div>
      <div className="p-2">
        <p className="text-xs font-medium text-violet-900 truncate">{item.subType || 'Accessory'}</p>
        <div className="flex flex-wrap gap-0.5 mt-1">
          {item.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[9px] h-4 px-1 bg-violet-50 text-violet-600 border-0">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
