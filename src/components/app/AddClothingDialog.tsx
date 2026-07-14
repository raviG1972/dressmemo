'use client'

import { useState, useRef } from 'react'
import { Camera, X, Check, ImagePlus } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useStore, type ClothingCategory } from '@/lib/store'
import { optimizeImage } from '@/lib/image-utils'
import { toast } from 'sonner'

// ─── Category options ───
const categoryOptions: { key: ClothingCategory; label: string; icon: string }[] = [
  { key: 'TOP', label: 'Top', icon: '👕' },
  { key: 'BOTTOM', label: 'Bottom', icon: '👖' },
  { key: 'FULL_SUIT', label: 'Full Suit', icon: '👗' },
  { key: 'SHOES', label: 'Shoes', icon: '👟' },
  { key: 'ACCESSORY', label: 'Accessory', icon: '💍' },
]

// ─── Cascading type → sub-type → detail tags ───
const clothingTree: Record<ClothingCategory, Record<string, Record<string, string[]>>> = {
  TOP: {
    'T-Shirt': {
      'Short Sleeves': ['Round Neck', 'V Neck', 'Collared', 'Graphic', 'Plain'],
      'Long Sleeves': ['Round Neck', 'V Neck', 'Turtle Neck', 'Henley', 'Plain'],
      'Sleeveless': ['Tank Top', 'Muscle Tee', 'Racerback'],
    },
    'Shirt': {
      'Short Sleeves': ['Casual', 'Formal', 'Linen', 'Printed'],
      'Long Sleeves': ['Casual', 'Formal', 'Denim', 'Flannel', 'Oxford'],
    },
    'Blouse': {
      'Short Sleeves': ['Round Neck', 'V Neck', 'Bow', 'Ruffle'],
      'Long Sleeves': ['Button-up', 'Wrap', 'Pleated'],
      'Sleeveless': ['Camisole', 'Tank', 'Halter'],
    },
    'Jacket': {
      'Casual': ['Denim', 'Bomber', 'Harrington', 'Varsity'],
      'Formal': ['Blazer', 'Sport Coat', 'Suit Jacket'],
      'Winter': ['Puffer', 'Parka', 'Wool', 'Leather'],
    },
    'Sweater': {
      'Pullover': ['Crew Neck', 'V Neck', 'Turtle Neck', 'Chunky Knit'],
      'Cardigan': ['Button-up', 'Open Front', 'Belted'],
    },
    'Coat': {
      'Overcoat': ['Wool', 'Cashmere', 'Trench'],
      'Raincoat': ['Hooded', 'Classic', 'Packable'],
    },
    'Hoodie': {
      'Pullover': ['Kangaroo Pocket', 'Zipper', 'Cropped'],
      'Zip-up': ['Full Zip', 'Half Zip', 'With Hood'],
    },
    'Tank Top': {
      'Casual': ['Ribbed', 'Cropped', 'Loose Fit'],
      'Athletic': ['Compression', 'Mesh', 'Quick-Dry'],
    },
  },
  BOTTOM: {
    'Jeans': {
      'Slim Fit': ['Dark Wash', 'Light Wash', 'Black', 'Distressed'],
      'Regular Fit': ['Straight Leg', 'Bootcut', 'Relaxed'],
      'Skinny': ['High Rise', 'Mid Rise', 'Low Rise'],
    },
    'Trousers': {
      'Formal': ['Pleated', 'Flat Front', 'Cuffed'],
      'Casual': ['Chinos', 'Cargos', 'Corduroy'],
    },
    'Shorts': {
      'Casual': ['Denim', 'Chino', 'Athletic', 'Board'],
      'Formal': ['Bermuda', 'Tailored'],
    },
    'Skirt': {
      'Mini': ['A-Line', 'Pleated', 'Wrap'],
      'Midi': ['A-Line', 'Pencil', 'Pleated', 'Wrap'],
      'Maxi': ['Flowy', 'Slit', 'Tiered'],
    },
    'Leggings': {
      'Casual': ['Cotton', 'Fleece-Lined', 'High Waist'],
      'Athletic': ['Compression', 'Capri', 'Yoga'],
    },
    'Joggers': {
      'Casual': ['Cotton', 'Fleece', 'Cuffed'],
      'Athletic': ['Slim Fit', 'Tapered', 'Windproof'],
    },
  },
  FULL_SUIT: {
    'Saree': {
      'Silk': ['Banarasi', 'Kanchipuram', 'Mysore'],
      'Cotton': ['Handloom', 'Printed', 'Embroidered'],
      'Synthetic': ['Georgette', 'Chiffon', 'Crepe'],
    },
    'Dress': {
      'Casual': ['T-Shirt', 'Shirt Dress', 'Wrap', 'Shift'],
      'Formal': ['Cocktail', 'Evening Gown', 'Sheath'],
      'Summer': ['Sundress', 'Maxi', 'Midi', 'Floral'],
    },
    'Jumpsuit': {
      'Casual': ['Wide Leg', 'Slim Fit', 'Cropped'],
      'Formal': ['Black Tie', 'Structured', 'Wrap'],
    },
    'Salwar Kameez': {
      'Traditional': ['Anarkali', 'Straight Cut', 'A-Line'],
      'Modern': ['Palazzo', 'Dhoti', 'Cape Style'],
    },
    'Abaya': {
      'Classic': ['Open', 'Closed', 'Butterfly'],
      'Modern': ['Kimono', 'Wrap', 'Embellished'],
    },
    'Romper': {
      'Casual': ['Cotton', 'Denim', 'Printed'],
      'Dressy': ['Lace', 'Satin', 'Velvet'],
    },
  },
  SHOES: {
    'Sneakers': {
      'Casual': ['Canvas', 'Leather', 'Running', 'Platform'],
      'Sport': ['Running', 'Training', 'Basketball', 'Walking'],
    },
    'Heels': {
      'Low': ['Kitten', 'Block', 'Wedge'],
      'High': ['Stiletto', 'Platform', 'Cone'],
    },
    'Flats': {
      'Casual': ['Ballet', 'Loafer', 'Espadrille'],
      'Formal': ['Pointed', 'Round Toe', 'Embellished'],
    },
    'Boots': {
      'Ankle': ['Chelsea', 'Combat', 'Chukka'],
      'Knee-High': ['Riding', 'Over-the-Knee', 'Lace-up'],
    },
    'Sandals': {
      'Casual': ['Flip Flop', 'Slider', 'Strappy'],
      'Formal': ['Block Heel', 'Wedge', 'Gladiator'],
    },
    'Loafers': {
      'Casual': ['Penny', 'Tassel', 'Suede'],
      'Formal': ['Leather', 'Patent', 'Horsebit'],
    },
    'Formal': {
      'Oxford': ['Cap Toe', 'Whole Cut', 'Wingtip'],
      'Derby': ['Brogue', 'Plain', 'Suede'],
    },
  },
  ACCESSORY: {
    'Watch': {
      'Casual': ['Leather Strap', 'Metal Band', 'Digital'],
      'Formal': ['Gold', 'Silver', 'Rose Gold'],
      'Sport': ['Smartwatch', 'Chronograph', 'Diver'],
    },
    'Necklace': {
      'Casual': ['Pendant', 'Chain', 'Choker'],
      'Formal': ['Pearl', 'Diamond', 'Statement'],
    },
    'Earrings': {
      'Casual': ['Studs', 'Hoops', 'Drop'],
      'Formal': ['Chandelier', 'Pearl', 'Diamond'],
    },
    'Bracelet': {
      'Casual': ['Beaded', 'Cuff', 'Charm'],
      'Formal': ['Gold', 'Silver', 'Diamond'],
    },
    'Ring': {
      'Casual': ['Band', 'Signet', 'Stackable'],
      'Formal': ['Diamond', 'Gemstone', 'Engagement'],
    },
    'Scarf': {
      'Casual': ['Cotton', 'Silk', 'Wool'],
      'Winter': ['Knit', 'Cashmere', 'Fleece'],
    },
    'Belt': {
      'Casual': ['Canvas', 'Braided', 'Elastic'],
      'Formal': ['Leather', 'Reversible', 'Crocodile'],
    },
    'Hat': {
      'Casual': ['Baseball Cap', 'Beanie', 'Bucket'],
      'Formal': ['Fedora', 'Wide Brim', 'Panama'],
    },
    'Bag': {
      'Casual': ['Tote', 'Backpack', 'Crossbody'],
      'Formal': ['Clutch', 'Satchel', 'Briefcase'],
    },
    'Sunglasses': {
      'Casual': ['Aviator', 'Wayfarer', 'Round'],
      'Sport': ['Wraparound', 'Polarized', 'Mirrored'],
    },
  },
}

// ─── Color palette for picker ───
const colorPalette = [
  { key: 'black', label: 'Black', hex: '#1a1a1a' },
  { key: 'white', label: 'White', hex: '#FFFFFF' },
  { key: 'red', label: 'Red', hex: '#DC2626' },
  { key: 'maroon', label: 'Maroon', hex: '#800000' },
  { key: 'pink', label: 'Pink', hex: '#EC4899' },
  { key: 'rose', label: 'Rose', hex: '#F43F5E' },
  { key: 'orange', label: 'Orange', hex: '#F97316' },
  { key: 'peach', label: 'Peach', hex: '#FBBF8C' },
  { key: 'yellow', label: 'Yellow', hex: '#EAB308' },
  { key: 'beige', label: 'Beige', hex: '#D4A574' },
  { key: 'cream', label: 'Cream', hex: '#FFFDD0' },
  { key: 'green', label: 'Green', hex: '#22C55E' },
  { key: 'olive', label: 'Olive', hex: '#808000' },
  { key: 'teal', label: 'Teal', hex: '#14B8A6' },
  { key: 'blue', label: 'Blue', hex: '#3B82F6' },
  { key: 'navy', label: 'Navy', hex: '#1E3A5F' },
  { key: 'purple', label: 'Purple', hex: '#8B5CF6' },
  { key: 'lavender', label: 'Lavender', hex: '#A78BFA' },
  { key: 'brown', label: 'Brown', hex: '#92400E' },
  { key: 'grey', label: 'Grey', hex: '#6B7280' },
  { key: 'silver', label: 'Silver', hex: '#C0C0C0' },
  { key: 'gold', label: 'Gold', hex: '#DAA520' },
  { key: 'multi', label: 'Multi', hex: 'linear-gradient(135deg,#f00,#ff0,#0f0,#0ff,#00f)' },
]

// ─── Season & occasion tags (final row) ───
const seasonOccasionTags = ['Casual', 'Formal', 'Semi-Formal', 'Summer', 'Winter', 'All Season']

interface AddClothingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultCategory?: ClothingCategory
}

export default function AddClothingDialog({ open, onOpenChange, defaultCategory }: AddClothingDialogProps) {
  const { addClothingItem } = useStore()
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [category, setCategory] = useState<ClothingCategory | null>(defaultCategory || null)
  const [clothType, setClothType] = useState<string>('')       // Row 1: Type
  const [clothDetail, setClothDetail] = useState<string>('')    // Row 2: Sub-type
  const [selectedTags, setSelectedTags] = useState<string[]>([]) // Row 3: Detail tags
  const [color, setColor] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)

  // Get available options for current selections
  const typeOptions = category ? Object.keys(clothingTree[category]) : []
  const detailOptions = category && clothType ? Object.keys(clothingTree[category][clothType] || {}) : []
  const tagOptions = category && clothType && clothDetail ? (clothingTree[category][clothType][clothDetail] || []) : []

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
    // Reset input so same file can be selected again
    e.target.value = ''
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

    setIsSaving(true)
    try {
      const optimizedFile = await optimizeImage(imageFile)

      // Combine clothDetail + selectedTags as the full tags list
      const allTags = [clothDetail, ...selectedTags].filter(Boolean)

      const success = await addClothingItem(
        {
          category,
          subType: clothType || category.toLowerCase(),
          color,
          size: '',
          tags: allTags,
          imageUrl: '',
          isFavorite: false,
        },
        optimizedFile
      )
      setIsSaving(false)

      if (success) {
        toast.success('Item added to wardrobe! 👗')
        resetForm()
        onOpenChange(false)
      } else {
        toast.error('Failed to add item. Please try again.')
      }
    } catch {
      setIsSaving(false)
      toast.error('Failed to process image. Please try again.')
    }
  }

  const resetForm = () => {
    setImageFile(null)
    setImagePreview(null)
    setCategory(null)
    setClothType('')
    setClothDetail('')
    setSelectedTags([])
    setColor('')
  }

  const handleCategoryChange = (cat: ClothingCategory) => {
    setCategory(cat)
    setClothType('')
    setClothDetail('')
    setSelectedTags([])
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm()
      onOpenChange(isOpen)
    }}>
      <SheetContent side="bottom" className="h-[92vh] rounded-t-2xl overflow-y-auto custom-scrollbar">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-rose-900">Add to Wardrobe</SheetTitle>
          <SheetDescription>Snap a photo and categorize your item</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-1 pb-6">
          {/* ─── Image Section ─── */}
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
              <div className="flex gap-3 w-full max-w-xs">
                {/* Camera button */}
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 aspect-[3/4] rounded-xl border-2 border-dashed border-rose-200 bg-rose-50 flex flex-col items-center justify-center gap-2 hover:border-rose-400 transition-colors"
                >
                  <Camera className="w-8 h-8 text-rose-400" />
                  <span className="text-xs text-rose-400 font-medium">Take Photo</span>
                </button>
                {/* Gallery button */}
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex-1 aspect-[3/4] rounded-xl border-2 border-dashed border-rose-200 bg-rose-50 flex flex-col items-center justify-center gap-2 hover:border-rose-400 transition-colors"
                >
                  <ImagePlus className="w-8 h-8 text-rose-400" />
                  <span className="text-xs text-rose-400 font-medium">Gallery</span>
                </button>
              </div>
            )}
            {/* Hidden inputs — camera has capture, gallery does NOT */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImageChange}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          {/* ─── Category ─── */}
          <div>
            <p className="text-xs font-semibold text-rose-900 mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => handleCategoryChange(key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
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

          {/* ─── Row 1: Type ─── */}
          {category && typeOptions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-rose-900 mb-2">Type</p>
              <div className="flex flex-wrap gap-2">
                {typeOptions.map((type) => (
                  <button
                    key={type}
                    onClick={() => { setClothType(type); setClothDetail(''); setSelectedTags([]) }}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      clothType === type
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── Row 2: Detail ─── */}
          {clothType && detailOptions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-rose-900 mb-2">{clothType} Style</p>
              <div className="flex flex-wrap gap-2">
                {detailOptions.map((detail) => (
                  <button
                    key={detail}
                    onClick={() => { setClothDetail(detail); setSelectedTags([]) }}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      clothDetail === detail
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    {detail}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── Row 3: Specific Tags ─── */}
          {clothDetail && tagOptions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-rose-900 mb-2">Details <span className="text-muted-foreground font-normal">(tap to select)</span></p>
              <div className="flex flex-wrap gap-2">
                {tagOptions.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      selectedTags.includes(tag)
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── Season / Occasion ─── */}
          {clothType && (
            <div>
              <p className="text-xs font-semibold text-rose-900 mb-2">Season & Occasion <span className="text-muted-foreground font-normal">(optional)</span></p>
              <div className="flex flex-wrap gap-2">
                {seasonOccasionTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      selectedTags.includes(tag)
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── Color Picker ─── */}
          {category && (
            <div>
              <p className="text-xs font-semibold text-rose-900 mb-2">Color <span className="text-muted-foreground font-normal">(tap to pick)</span></p>
              <div className="flex flex-wrap gap-2.5">
                {colorPalette.map(({ key, label, hex }) => (
                  <button
                    key={key}
                    onClick={() => setColor(color === key ? '' : key)}
                    className={`w-9 h-9 rounded-full border-2 transition-all relative ${
                      color === key
                        ? 'border-rose-500 scale-125 ring-2 ring-rose-200'
                        : 'border-gray-200 hover:border-rose-300 hover:scale-110'
                    }`}
                    style={key === 'multi'
                      ? { background: 'linear-gradient(135deg,#f00,#ff0,#0f0,#0ff,#00f)' }
                      : { backgroundColor: hex }
                    }
                    title={label}
                  >
                    {color === key && (
                      <Check className={`w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
                        ['white', 'cream', 'yellow', 'beige', 'peach', 'lavender', 'silver'].includes(key) ? 'text-gray-700' : 'text-white'
                      }`} />
                    )}
                  </button>
                ))}
              </div>
              {color && (
                <p className="text-xs text-muted-foreground mt-1.5">Selected: {colorPalette.find(c => c.key === color)?.label}</p>
              )}
            </div>
          )}

          {/* ─── Save ─── */}
          <Button
            onClick={handleSave}
            disabled={isSaving || !imageFile || !category}
            className="w-full h-12 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-base"
          >
            {isSaving ? 'Saving...' : 'Save to Wardrobe'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
