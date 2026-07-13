'use client'

import { useState, useRef } from 'react'
import { Camera, X, ChevronRight, Check } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useStore, type ClothingCategory, type ClothingSubType, type ClothingColor, type ClothingSize } from '@/lib/store'
import { toast } from 'sonner'

const categoryOptions: { key: ClothingCategory; label: string; icon: string }[] = [
  { key: 'TOP', label: 'Top', icon: '👕' },
  { key: 'BOTTOM', label: 'Bottom', icon: '👖' },
  { key: 'FULL_SUIT', label: 'Full Suit', icon: '👗' },
  { key: 'SHOES', label: 'Shoes', icon: '👟' },
  { key: 'ACCESSORY', label: 'Accessory', icon: '💍' },
]

const subTypeMap: Record<ClothingCategory, string[]> = {
  TOP: ['Shirt', 'T-Shirt', 'Blouse', 'Jacket', 'Sweater', 'Coat', 'Hoodie', 'Tank Top', 'Cardigan'],
  BOTTOM: ['Jeans', 'Trousers', 'Shorts', 'Skirt', 'Leggings', 'Chinos', 'Joggers'],
  FULL_SUIT: ['Saree', 'Dress', 'Jumpsuit', 'Salwar Kameez', 'Abaya', 'Romper'],
  SHOES: ['Sneakers', 'Heels', 'Flats', 'Boots', 'Sandals', 'Loafers', 'Formal'],
  ACCESSORY: ['Watch', 'Necklace', 'Earrings', 'Bracelet', 'Ring', 'Scarf', 'Belt', 'Hat', 'Bag', 'Sunglasses'],
}

const colorOptions: { key: ClothingColor; label: string; hex: string }[] = [
  { key: 'white', label: 'White', hex: '#FFFFFF' },
  { key: 'black', label: 'Black', hex: '#1a1a1a' },
  { key: 'red', label: 'Red', hex: '#DC2626' },
  { key: 'blue', label: 'Blue', hex: '#3B82F6' },
  { key: 'green', label: 'Green', hex: '#22C55E' },
  { key: 'yellow', label: 'Yellow', hex: '#EAB308' },
  { key: 'pink', label: 'Pink', hex: '#EC4899' },
  { key: 'brown', label: 'Brown', hex: '#92400E' },
  { key: 'grey', label: 'Grey', hex: '#6B7280' },
  { key: 'orange', label: 'Orange', hex: '#F97316' },
  { key: 'purple', label: 'Purple', hex: '#8B5CF6' },
  { key: 'beige', label: 'Beige', hex: '#D4A574' },
]

const sizeOptions: ClothingSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

const tagOptions = [
  'Short Sleeves', 'Long Sleeves', 'Sleeveless',
  'V Neck', 'Round Neck', 'Collared',
  'Casual', 'Formal', 'Semi-Formal',
  'Summer', 'Winter', 'All Season',
  'Cotton', 'Silk', 'Denim', 'Leather', 'Linen',
  'Printed', 'Solid', 'Striped',
]

interface AddClothingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AddClothingDialog({ open, onOpenChange }: AddClothingDialogProps) {
  const { addClothingItem } = useStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [category, setCategory] = useState<ClothingCategory | null>(null)
  const [subType, setSubType] = useState<string>('')
  const [color, setColor] = useState<string>('')
  const [size, setSize] = useState<string>('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleSave = async () => {
    if (!imageFile) {
      toast.error('Please add a photo')
      return
    }
    if (!category) {
      toast.error('Please select a category')
      return
    }
    if (!subType) {
      toast.error('Please select a sub-type')
      return
    }

    setIsSaving(true)
    const success = await addClothingItem(
      {
        category,
        subType,
        color,
        size,
        tags: selectedTags,
        imageUrl: '',
        isFavorite: false,
      },
      imageFile
    )
    setIsSaving(false)

    if (success) {
      toast.success('Item added to wardrobe! 👗')
      resetForm()
      onOpenChange(false)
    } else {
      toast.error('Failed to add item. Please try again.')
    }
  }

  const resetForm = () => {
    setImageFile(null)
    setImagePreview(null)
    setCategory(null)
    setSubType('')
    setColor('')
    setSize('')
    setSelectedTags([])
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm()
      onOpenChange(isOpen)
    }}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl overflow-y-auto custom-scrollbar">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-rose-900">Add to Wardrobe</SheetTitle>
          <SheetDescription>Snap a photo and categorize your item</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-1 pb-6">
          {/* Image */}
          <div className="flex flex-col items-center gap-3">
            {imagePreview ? (
              <div className="relative w-full max-w-xs aspect-square rounded-xl overflow-hidden border-2 border-rose-200">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => { setImageFile(null); setImagePreview(null) }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-xs aspect-square rounded-xl border-2 border-dashed border-rose-200 bg-rose-50 flex flex-col items-center justify-center gap-2 hover:border-rose-400 transition-colors"
              >
                <Camera className="w-10 h-10 text-rose-300" />
                <span className="text-sm text-rose-400">Tap to add photo</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          {/* Category */}
          <div>
            <Label className="text-xs font-semibold text-rose-900 mb-2 block">Category</Label>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => { setCategory(key); setSubType('') }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    category === key
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  <span>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Sub-type */}
          {category && (
            <div>
              <Label className="text-xs font-semibold text-rose-900 mb-2 block">Type</Label>
              <div className="flex flex-wrap gap-1.5">
                {subTypeMap[category].map((st) => (
                  <button
                    key={st}
                    onClick={() => setSubType(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      subType === st
                        ? 'bg-rose-500 text-white'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color */}
          <div>
            <Label className="text-xs font-semibold text-rose-900 mb-2 block">Color</Label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map(({ key, label, hex }) => (
                <button
                  key={key}
                  onClick={() => setColor(color === key ? '' : key)}
                  className={`w-8 h-8 rounded-full border-2 transition-all relative ${
                    color === key
                      ? 'border-rose-500 scale-110 ring-2 ring-rose-200'
                      : 'border-rose-100 hover:border-rose-300'
                  }`}
                  style={{ backgroundColor: hex }}
                  title={label}
                >
                  {color === key && (
                    <Check className={`w-3.5 h-3.5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
                      key === 'white' || key === 'beige' || key === 'yellow' ? 'text-gray-700' : 'text-white'
                    }`} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div>
            <Label className="text-xs font-semibold text-rose-900 mb-2 block">Size</Label>
            <div className="flex flex-wrap gap-2">
              {sizeOptions.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(size === s ? '' : s)}
                  className={`w-10 h-10 rounded-lg text-xs font-semibold transition-all ${
                    size === s
                      ? 'bg-rose-500 text-white'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label className="text-xs font-semibold text-rose-900 mb-2 block">Tags</Label>
            <div className="flex flex-wrap gap-1.5">
              {tagOptions.map((tag) => (
                <Badge
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`cursor-pointer text-[10px] px-2 py-0.5 transition-all ${
                    selectedTags.includes(tag)
                      ? 'bg-rose-500 text-white border-rose-500 hover:bg-rose-600'
                      : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'
                  }`}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Save */}
          <Button
            onClick={handleSave}
            disabled={isSaving || !imageFile || !category || !subType}
            className="w-full h-12 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-base"
          >
            {isSaving ? 'Saving...' : 'Save to Wardrobe'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
