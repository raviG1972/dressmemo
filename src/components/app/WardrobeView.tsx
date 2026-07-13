'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Heart, Shirt, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useStore, type ClothingCategory, type ClothingItem } from '@/lib/store'
import AddClothingDialog from './AddClothingDialog'

const categories: { key: ClothingCategory | 'ALL'; label: string; icon: string }[] = [
  { key: 'ALL', label: 'All', icon: '👗' },
  { key: 'TOP', label: 'Tops', icon: '👕' },
  { key: 'BOTTOM', label: 'Bottoms', icon: '👖' },
  { key: 'FULL_SUIT', label: 'Full', icon: '👗' },
  { key: 'SHOES', label: 'Shoes', icon: '👟' },
  { key: 'ACCESSORY', label: 'Acc.', icon: '💍' },
]

export default function WardrobeView() {
  const { clothingItems, fetchClothingItems, toggleFavorite } = useStore()
  const [activeCategory, setActiveCategory] = useState<ClothingCategory | 'ALL'>('ALL')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    fetchClothingItems()
  }, [fetchClothingItems])

  const filteredItems = activeCategory === 'ALL'
    ? clothingItems
    : clothingItems.filter((item) => item.category === activeCategory)

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await fetchClothingItems(activeCategory === 'ALL' ? undefined : activeCategory)
    setIsRefreshing(false)
  }, [fetchClothingItems, activeCategory])

  const handleToggleFavorite = async (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await toggleFavorite(itemId)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-rose-900">Wardrobe</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {clothingItems.length} item{clothingItems.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-rose-400 hover:text-rose-500"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Category tabs */}
      <div className="px-4 pb-3">
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
          {categories.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeCategory === key
                  ? 'bg-rose-500 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {filteredItems.length > 0 ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
            >
              {filteredItems.map((item) => (
                <ClothingCard
                  key={item.id}
                  item={item}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mb-4">
                <Shirt className="w-10 h-10 text-rose-300" />
              </div>
              <p className="text-muted-foreground text-sm mb-2">
                {activeCategory === 'ALL' ? 'Add your first item' : `No ${categories.find(c => c.key === activeCategory)?.label.toLowerCase()} yet`}
              </p>
              <p className="text-muted-foreground text-xs mb-4">Tap + to start building your wardrobe</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating add button */}
      <button
        onClick={() => setIsAddDialogOpen(true)}
        className="fixed bottom-24 right-6 z-30 w-14 h-14 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        aria-label="Add clothing item"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add clothing dialog */}
      <AddClothingDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
    </div>
  )
}

function ClothingCard({
  item,
  onToggleFavorite,
}: {
  item: ClothingItem
  onToggleFavorite: (itemId: string, e: React.MouseEvent) => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative rounded-xl overflow-hidden border border-rose-100 bg-white"
    >
      {/* Image */}
      <div className="aspect-square bg-rose-50 relative">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.subType}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Shirt className="w-8 h-8 text-rose-200" />
          </div>
        )}
        {/* Favorite button */}
        <button
          onClick={(e) => onToggleFavorite(item.id, e)}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center transition-colors hover:bg-white"
          aria-label={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={`w-3.5 h-3.5 ${
              item.isFavorite ? 'fill-rose-500 text-rose-500' : 'text-muted-foreground'
            }`}
          />
        </button>
      </div>

      {/* Info */}
      <div className="p-2">
        <p className="text-xs font-medium text-rose-900 truncate">{item.subType || item.category}</p>
        <div className="flex flex-wrap gap-0.5 mt-1">
          {item.tags.slice(0, 2).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-[9px] h-4 px-1 bg-rose-50 text-rose-600 border-0"
            >
              {tag}
            </Badge>
          ))}
          {item.color && (
            <span className="inline-flex items-center">
              <span
                className="w-3 h-3 rounded-full border border-rose-200 ml-0.5"
                style={{ backgroundColor: item.color }}
              />
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
