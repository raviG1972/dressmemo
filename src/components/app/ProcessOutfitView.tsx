'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Camera, ImagePlus, Scissors, Check, RotateCcw, Shirt,
  Crop, MousePointer2, Trash2, Plus, X, Tag, SkipForward
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore, type ClothingCategory, type Outfit, getDateKey } from '@/lib/store'
import { optimizeDataURL, dataURLToFile, cropImageRegion } from '@/lib/image-utils'
import { toast } from 'sonner'

// ─── Step & tool types ───
type Step = 'list' | 'edit' | 'save'
type EditTool = 'crop' | 'cut' | 'marquee'

// ─── Rect for crop/marquee ───
interface DrawRect {
  id: string
  x: number
  y: number
  w: number
  h: number
}

interface MarqueeSection extends DrawRect {
  category: ClothingCategory | null
  type: string
  detail: string
  tags: string[]
  color: string
}

// ─── Cascading type trees (same as before) ───
const topTypes: Record<string, Record<string, string[]>> = {
  'T-Shirt': { 'Short Sleeves': ['Round Neck', 'V Neck', 'Graphic'], 'Long Sleeves': ['Round Neck', 'V Neck', 'Turtle Neck'], 'Sleeveless': ['Tank Top', 'Muscle Tee'] },
  'Shirt': { 'Short Sleeves': ['Casual', 'Formal', 'Linen'], 'Long Sleeves': ['Casual', 'Formal', 'Denim', 'Flannel'] },
  'Blouse': { 'Short Sleeves': ['Round Neck', 'V Neck', 'Ruffle'], 'Long Sleeves': ['Button-up', 'Wrap', 'Pleated'], 'Sleeveless': ['Camisole', 'Tank', 'Halter'] },
  'Jacket': { 'Casual': ['Denim', 'Bomber', 'Varsity'], 'Formal': ['Blazer', 'Sport Coat'], 'Winter': ['Puffer', 'Parka', 'Leather'] },
  'Sweater': { 'Pullover': ['Crew Neck', 'V Neck', 'Turtle Neck'], 'Cardigan': ['Button-up', 'Open Front'] },
  'Hoodie': { 'Pullover': ['Kangaroo Pocket', 'Cropped'], 'Zip-up': ['Full Zip', 'Half Zip'] },
  'Coat': { 'Overcoat': ['Wool', 'Cashmere', 'Trench'], 'Raincoat': ['Hooded', 'Classic'] },
}

const bottomTypes: Record<string, Record<string, string[]>> = {
  'Jeans': { 'Slim Fit': ['Dark Wash', 'Light Wash', 'Black'], 'Regular Fit': ['Straight Leg', 'Bootcut'], 'Skinny': ['High Rise', 'Mid Rise'] },
  'Trousers': { 'Formal': ['Pleated', 'Flat Front'], 'Casual': ['Chinos', 'Cargos', 'Corduroy'] },
  'Shorts': { 'Casual': ['Denim', 'Chino', 'Athletic'], 'Formal': ['Bermuda', 'Tailored'] },
  'Skirt': { 'Mini': ['A-Line', 'Pleated', 'Wrap'], 'Midi': ['A-Line', 'Pencil', 'Wrap'], 'Maxi': ['Flowy', 'Slit', 'Tiered'] },
  'Leggings': { 'Casual': ['Cotton', 'High Waist'], 'Athletic': ['Compression', 'Yoga'] },
  'Joggers': { 'Casual': ['Cotton', 'Fleece', 'Cuffed'], 'Athletic': ['Slim Fit', 'Tapered'] },
}

const fullSuitTypes: Record<string, Record<string, string[]>> = {
  'Saree': { 'Silk': ['Banarasi', 'Kanchipuram'], 'Cotton': ['Handloom', 'Printed'], 'Synthetic': ['Georgette', 'Chiffon', 'Crepe'] },
  'Dress': { 'Casual': ['T-Shirt', 'Wrap', 'Shift'], 'Formal': ['Cocktail', 'Evening Gown', 'Sheath'], 'Summer': ['Sundress', 'Maxi', 'Floral'] },
  'Jumpsuit': { 'Casual': ['Wide Leg', 'Slim Fit'], 'Formal': ['Black Tie', 'Structured'] },
  'Salwar Kameez': { 'Traditional': ['Anarkali', 'Straight Cut', 'A-Line'], 'Modern': ['Palazzo', 'Dhoti', 'Cape Style'] },
}

const shoesTypes: Record<string, Record<string, string[]>> = {
  'Sneakers': { 'Casual': ['Canvas', 'Leather', 'Platform'], 'Sport': ['Running', 'Training', 'Walking'] },
  'Heels': { 'Low': ['Kitten', 'Block', 'Wedge'], 'High': ['Stiletto', 'Platform'] },
  'Flats': { 'Casual': ['Ballet', 'Loafer', 'Espadrille'], 'Formal': ['Pointed', 'Round Toe'] },
  'Boots': { 'Ankle': ['Chelsea', 'Combat', 'Chukka'], 'Knee-High': ['Riding', 'Lace-up'] },
  'Sandals': { 'Casual': ['Flip Flop', 'Slider', 'Strappy'], 'Formal': ['Block Heel', 'Wedge'] },
}

const accessoryTypes: Record<string, Record<string, string[]>> = {
  'Watch': { 'Casual': ['Leather Strap', 'Metal Band', 'Digital'], 'Formal': ['Gold', 'Silver', 'Rose Gold'] },
  'Necklace': { 'Casual': ['Pendant', 'Chain', 'Choker'], 'Formal': ['Pearl', 'Diamond', 'Statement'] },
  'Earrings': { 'Casual': ['Studs', 'Hoops', 'Drop'], 'Formal': ['Chandelier', 'Pearl'] },
  'Belt': { 'Casual': ['Canvas', 'Braided'], 'Formal': ['Leather', 'Reversible'] },
  'Bag': { 'Casual': ['Tote', 'Backpack', 'Crossbody'], 'Formal': ['Clutch', 'Satchel', 'Briefcase'] },
  'Sunglasses': { 'Casual': ['Aviator', 'Wayfarer', 'Round'], 'Sport': ['Wraparound', 'Polarized'] },
  'Hat': { 'Casual': ['Baseball Cap', 'Beanie', 'Bucket'], 'Formal': ['Fedora', 'Wide Brim'] },
}

const categoryOptions: { key: ClothingCategory; label: string; icon: string }[] = [
  { key: 'TOP', label: 'Top', icon: '👕' },
  { key: 'BOTTOM', label: 'Bottom', icon: '👖' },
  { key: 'FULL_SUIT', label: 'Full Suit', icon: '👗' },
  { key: 'SHOES', label: 'Shoes', icon: '👟' },
  { key: 'ACCESSORY', label: 'Accessory', icon: '💍' },
]

function getTypeTreeForCategory(cat: ClothingCategory): Record<string, Record<string, string[]>> {
  switch (cat) {
    case 'TOP': return topTypes
    case 'BOTTOM': return bottomTypes
    case 'FULL_SUIT': return fullSuitTypes
    case 'SHOES': return shoesTypes
    case 'ACCESSORY': return accessoryTypes
    default: return {}
  }
}

const colorPalette = [
  { key: 'black', label: 'Black', hex: '#1a1a1a' }, { key: 'white', label: 'White', hex: '#FFFFFF' },
  { key: 'red', label: 'Red', hex: '#DC2626' }, { key: 'maroon', label: 'Maroon', hex: '#800000' },
  { key: 'pink', label: 'Pink', hex: '#EC4899' }, { key: 'rose', label: 'Rose', hex: '#F43F5E' },
  { key: 'orange', label: 'Orange', hex: '#F97316' }, { key: 'peach', label: 'Peach', hex: '#FBBF8C' },
  { key: 'yellow', label: 'Yellow', hex: '#EAB308' }, { key: 'beige', label: 'Beige', hex: '#D4A574' },
  { key: 'cream', label: 'Cream', hex: '#FFFDD0' }, { key: 'green', label: 'Green', hex: '#22C55E' },
  { key: 'olive', label: 'Olive', hex: '#808000' }, { key: 'teal', label: 'Teal', hex: '#14B8A6' },
  { key: 'blue', label: 'Blue', hex: '#3B82F6' }, { key: 'navy', label: 'Navy', hex: '#1E3A5F' },
  { key: 'purple', label: 'Purple', hex: '#8B5CF6' }, { key: 'lavender', label: 'Lavender', hex: '#A78BFA' },
  { key: 'brown', label: 'Brown', hex: '#92400E' }, { key: 'grey', label: 'Grey', hex: '#6B7280' },
  { key: 'silver', label: 'Silver', hex: '#C0C0C0' }, { key: 'gold', label: 'Gold', hex: '#DAA520' },
  { key: 'multi', label: 'Multi', hex: 'linear-gradient(135deg,#f00,#ff0,#0f0,#0ff,#00f)' },
]

const seasonOccasionTags = ['Casual', 'Formal', 'Semi-Formal', 'Summer', 'Winter', 'All Season']

const sectionColors = ['border-rose-400 bg-rose-400/20', 'border-sky-400 bg-sky-400/20', 'border-emerald-400 bg-emerald-400/20', 'border-amber-400 bg-amber-400/20', 'border-purple-400 bg-purple-400/20', 'border-pink-400 bg-pink-400/20', 'border-teal-400 bg-teal-400/20', 'border-orange-400 bg-orange-400/20']
const sectionBadgeColors = ['bg-rose-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500', 'bg-teal-500', 'bg-orange-500']

export default function ProcessOutfitView() {
  const { outfits, setView, markOutfitProcessed, addClothingItem } = useStore()

  // Get all unprocessed outfits
  const unprocessedOutfits = Object.values(outfits).flat().filter((o) => !o.processed)
  const [currentIndex, setCurrentIndex] = useState(0)
  const currentOutfit = unprocessedOutfits[currentIndex]

  // Edit state
  const [step, setStep] = useState<Step>('list')
  const [tool, setTool] = useState<EditTool>('cut')
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [cutPosition, setCutPosition] = useState(50)
  const [isDraggingCut, setIsDraggingCut] = useState(false)
  const [cropRect, setCropRect] = useState<DrawRect | null>(null)
  const [isDrawingCrop, setIsDrawingCrop] = useState(false)
  const [cropDrawStart, setCropDrawStart] = useState<{ x: number; y: number } | null>(null)
  const [marqueeSections, setMarqueeSections] = useState<MarqueeSection[]>([])
  const [isDrawingMarquee, setIsDrawingMarquee] = useState(false)
  const [marqueeDrawStart, setMarqueeDrawStart] = useState<{ x: number; y: number } | null>(null)
  const [currentMarqueeRect, setCurrentMarqueeRect] = useState<DrawRect | null>(null)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [showTagPanel, setShowTagPanel] = useState(false)
  const [mode, setMode] = useState<'split' | 'full'>('split')
  const [isSaving, setIsSaving] = useState(false)
  const [topImageSrc, setTopImageSrc] = useState<string | null>(null)
  const [bottomImageSrc, setBottomImageSrc] = useState<string | null>(null)
  const [topType, setTopType] = useState(''); const [topDetail, setTopDetail] = useState(''); const [topTags, setTopTags] = useState<string[]>([]); const [topColor, setTopColor] = useState('')
  const [bottomType, setBottomType] = useState(''); const [bottomDetail, setBottomDetail] = useState(''); const [bottomTags, setBottomTags] = useState<string[]>([]); const [bottomColor, setBottomColor] = useState('')
  const [fullType, setFullType] = useState(''); const [fullDetail, setFullDetail] = useState(''); const [fullTags, setFullTags] = useState<string[]>([]); const [fullColor, setFullColor] = useState('')

  const imageContainerRef = useRef<HTMLDivElement>(null)

  const startProcessing = (outfit: Outfit) => {
    setImageSrc(outfit.imageUrl)
    setStep('edit')
    setTool('cut')
    setCutPosition(50)
    setCropRect(null)
    setMarqueeSections([])
    setCurrentMarqueeRect(null)
    setSelectedSectionId(null)
    setShowTagPanel(false)
    setMode('split')
    setTopImageSrc(null); setBottomImageSrc(null)
    setTopType(''); setTopDetail(''); setTopTags([]); setTopColor('')
    setBottomType(''); setBottomDetail(''); setBottomTags([]); setBottomColor('')
    setFullType(''); setFullDetail(''); setFullTags([]); setFullColor('')
  }

  const handleSkip = () => {
    if (currentOutfit) {
      markOutfitProcessed(currentOutfit.id)
    }
    if (currentIndex < unprocessedOutfits.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      toast.success('All outfits processed!')
      setView('home')
    }
  }

  const handleDone = () => {
    if (currentOutfit) {
      markOutfitProcessed(currentOutfit.id)
    }
    if (currentIndex < unprocessedOutfits.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setStep('list')
    } else {
      toast.success('All outfits processed!')
      setView('home')
    }
  }

  // ─── Pointer handlers (same as previous SaveOutfitView) ───
  const handleCropPointerDown = useCallback((e: React.PointerEvent) => {
    if (tool !== 'crop') return
    e.preventDefault()
    const container = imageContainerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setCropDrawStart({ x, y })
    setIsDrawingCrop(true)
    setCropRect({ id: 'crop', x, y, w: 0, h: 0 })
  }, [tool])

  const handleCropPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawingCrop || !cropDrawStart || tool !== 'crop') return
    e.preventDefault()
    const container = imageContainerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const cx = ((e.clientX - rect.left) / rect.width) * 100
    const cy = ((e.clientY - rect.top) / rect.height) * 100
    setCropRect({ id: 'crop', x: Math.min(cropDrawStart.x, cx), y: Math.min(cropDrawStart.y, cy), w: Math.abs(cx - cropDrawStart.x), h: Math.abs(cy - cropDrawStart.y) })
  }, [isDrawingCrop, cropDrawStart, tool])

  const handleCropPointerUp = useCallback(() => {
    if (isDrawingCrop) { setIsDrawingCrop(false); setCropDrawStart(null) }
  }, [isDrawingCrop])

  const handleMarqueePointerDown = useCallback((e: React.PointerEvent) => {
    if (tool !== 'marquee') return
    e.preventDefault()
    const container = imageContainerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setMarqueeDrawStart({ x, y })
    setIsDrawingMarquee(true)
    setCurrentMarqueeRect({ id: `s-${Date.now()}`, x, y, w: 0, h: 0 })
  }, [tool])

  const handleMarqueePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawingMarquee || !marqueeDrawStart || tool !== 'marquee') return
    e.preventDefault()
    const container = imageContainerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const cx = ((e.clientX - rect.left) / rect.width) * 100
    const cy = ((e.clientY - rect.top) / rect.height) * 100
    if (currentMarqueeRect) {
      setCurrentMarqueeRect({ ...currentMarqueeRect, x: Math.min(marqueeDrawStart.x, cx), y: Math.min(marqueeDrawStart.y, cy), w: Math.abs(cx - marqueeDrawStart.x), h: Math.abs(cy - marqueeDrawStart.y) })
    }
  }, [isDrawingMarquee, marqueeDrawStart, tool, currentMarqueeRect])

  const handleMarqueePointerUp = useCallback(() => {
    if (isDrawingMarquee && currentMarqueeRect && currentMarqueeRect.w > 3 && currentMarqueeRect.h > 3) {
      setMarqueeSections((prev) => [...prev, { ...currentMarqueeRect, category: null, type: '', detail: '', tags: [], color: '' }])
    }
    setIsDrawingMarquee(false); setMarqueeDrawStart(null); setCurrentMarqueeRect(null)
  }, [isDrawingMarquee, currentMarqueeRect])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (tool === 'crop') handleCropPointerDown(e)
    else if (tool === 'marquee') handleMarqueePointerDown(e)
  }, [tool, handleCropPointerDown, handleMarqueePointerDown])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (tool === 'crop') handleCropPointerMove(e)
    else if (tool === 'marquee') handleMarqueePointerMove(e)
  }, [tool, handleCropPointerMove, handleMarqueePointerMove])

  const handlePointerUp = useCallback(() => {
    if (tool === 'crop') handleCropPointerUp()
    else if (tool === 'marquee') handleMarqueePointerUp()
  }, [tool, handleCropPointerUp, handleMarqueePointerUp])

  const handleCropConfirm = useCallback(async () => {
    if (!imageSrc || !cropRect || cropRect.w < 3 || cropRect.h < 3) { toast.error('Draw a crop area first'); return }
    try {
      const cropped = await cropImageRegion(imageSrc, { x: cropRect.x, y: cropRect.y, w: cropRect.w, h: cropRect.h })
      const optimized = await optimizeDataURL(cropped)
      setImageSrc(optimized); setCropRect(null); toast.success('Cropped!')
    } catch { toast.error('Crop failed') }
  }, [imageSrc, cropRect])

  const handleCutConfirm = useCallback(async () => {
    if (!imageSrc) return
    const img = new Image()
    img.onload = async () => {
      const cutY = Math.round((cutPosition / 100) * img.height)
      const topCanvas = document.createElement('canvas'); topCanvas.width = img.width; topCanvas.height = cutY
      topCanvas.getContext('2d')!.drawImage(img, 0, 0, img.width, cutY, 0, 0, img.width, cutY)
      const bottomCanvas = document.createElement('canvas'); bottomCanvas.width = img.width; bottomCanvas.height = img.height - cutY
      bottomCanvas.getContext('2d')!.drawImage(img, 0, cutY, img.width, img.height - cutY, 0, 0, img.width, img.height - cutY)
      const [t, b] = await Promise.all([optimizeDataURL(topCanvas.toDataURL('image/png')), optimizeDataURL(bottomCanvas.toDataURL('image/png'))])
      setTopImageSrc(t); setBottomImageSrc(b); setMode('split'); setStep('save')
    }
    img.src = imageSrc
  }, [imageSrc, cutPosition])

  const handleSaveMarqueeSections = useCallback(async () => {
    if (!imageSrc || marqueeSections.length === 0) return
    const untagged = marqueeSections.filter((s) => !s.category)
    if (untagged.length > 0) { toast.error('Please assign a category to all sections'); return }
    setIsSaving(true)
    try {
      let saved = 0
      for (const section of marqueeSections) {
        const cropped = await cropImageRegion(imageSrc, { x: section.x, y: section.y, w: section.w, h: section.h })
        const optimized = await optimizeDataURL(cropped)
        const file = dataURLToFile(optimized, `section-${saved}.jpg`)
        const allTags = [section.detail, ...section.tags].filter(Boolean)
        const success = await addClothingItem({ category: section.category!, subType: section.type || section.category!.toLowerCase(), color: section.color, size: '', tags: allTags, isFavorite: false, imageUrl: '' }, file)
        if (success) saved++
      }
      if (saved > 0) { toast.success(`${saved} item${saved > 1 ? 's' : ''} added to wardrobe!`); handleDone() }
      else toast.error('Failed to save')
    } catch { toast.error('Failed to save') }
    setIsSaving(false)
  }, [imageSrc, marqueeSections, addClothingItem, handleDone])

  const handleSaveSplit = async () => {
    if (!topImageSrc || !bottomImageSrc) return
    setIsSaving(true)
    try {
      const topFile = dataURLToFile(topImageSrc, 'top.jpg')
      const topSuccess = await addClothingItem({ category: 'TOP', subType: topType || 'Top', color: topColor, size: '', tags: [topDetail, ...topTags].filter(Boolean), isFavorite: false, imageUrl: '' }, topFile)
      const bottomFile = dataURLToFile(bottomImageSrc, 'bottom.jpg')
      const bottomSuccess = await addClothingItem({ category: 'BOTTOM', subType: bottomType || 'Bottom', color: bottomColor, size: '', tags: [bottomDetail, ...bottomTags].filter(Boolean), isFavorite: false, imageUrl: '' }, bottomFile)
      if (topSuccess && bottomSuccess) { toast.success('Top & bottom saved!'); handleDone() }
      else toast.error('Failed to save some items')
    } catch { toast.error('Failed to save') }
    setIsSaving(false)
  }

  const handleSaveFull = async () => {
    if (!imageSrc) return
    setIsSaving(true)
    try {
      const optimized = await optimizeDataURL(imageSrc)
      const file = dataURLToFile(optimized, 'outfit.jpg')
      const success = await addClothingItem({ category: 'FULL_SUIT', subType: fullType || 'Full Outfit', color: fullColor, size: '', tags: [fullDetail, ...fullTags].filter(Boolean), isFavorite: false, imageUrl: '' }, file)
      if (success) { toast.success('Added to wardrobe!'); handleDone() }
      else toast.error('Failed to save')
    } catch { toast.error('Failed to save') }
    setIsSaving(false)
  }

  // ─── Render helpers ───
  const renderCascadingTags = (typeTree: Record<string, Record<string, string[]>>, selType: string, setSelType: (v: string) => void, selDetail: string, setSelDetail: (v: string) => void, selTags: string[], toggleTag: (t: string) => void, accent = 'rose') => {
    const types = Object.keys(typeTree)
    const details = selType ? Object.keys(typeTree[selType] || {}) : []
    const tags = selType && selDetail ? (typeTree[selType][selDetail] || []) : []
    const bgA = accent === 'sky' ? 'bg-sky-500' : accent === 'emerald' ? 'bg-emerald-500' : 'bg-rose-500'
    const bgI = accent === 'sky' ? 'bg-sky-50 text-sky-700 hover:bg-sky-100' : accent === 'emerald' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
    return (
      <div className="space-y-2">
        <div><p className="text-[11px] font-semibold mb-1">Type</p><div className="flex flex-wrap gap-1.5">{types.map((t) => <button key={t} onClick={() => { setSelType(t); setSelDetail('') }} className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${selType === t ? `${bgA} text-white shadow-sm` : bgI}`}>{t}</button>)}</div></div>
        {selType && details.length > 0 && <div><p className="text-[11px] font-semibold mb-1">{selType} Style</p><div className="flex flex-wrap gap-1.5">{details.map((d) => <button key={d} onClick={() => setSelDetail(d)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${selDetail === d ? `${bgA} text-white shadow-sm` : bgI}`}>{d}</button>)}</div></div>}
        {selDetail && tags.length > 0 && <div><p className="text-[11px] font-semibold mb-1">Details</p><div className="flex flex-wrap gap-1.5">{tags.map((tag) => <button key={tag} onClick={() => toggleTag(tag)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${selTags.includes(tag) ? `${bgA} text-white shadow-sm` : bgI}`}>{tag}</button>)}</div></div>}
        {selType && <div><p className="text-[11px] font-semibold mb-1">Season</p><div className="flex flex-wrap gap-1.5">{seasonOccasionTags.map((tag) => <button key={tag} onClick={() => toggleTag(tag)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${selTags.includes(tag) ? `${bgA} text-white shadow-sm` : bgI}`}>{tag}</button>)}</div></div>}
      </div>
    )
  }

  const renderColorPicker = (selColor: string, setSelColor: (v: string) => void) => (
    <div>
      <p className="text-[11px] font-semibold mb-1">Color</p>
      <div className="flex flex-wrap gap-2">
        {colorPalette.map(({ key, label, hex }) => (
          <button key={key} onClick={() => setSelColor(selColor === key ? '' : key)} className={`w-8 h-8 rounded-full border-2 transition-all relative ${selColor === key ? 'border-rose-500 scale-125 ring-2 ring-rose-200' : 'border-gray-200'}`} style={key === 'multi' ? { background: hex } : { backgroundColor: hex }} title={label}>
            {selColor === key && <Check className={`w-3.5 h-3.5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${['white', 'cream', 'yellow', 'beige', 'peach', 'lavender', 'silver'].includes(key) ? 'text-gray-700' : 'text-white'}`} />}
          </button>
        ))}
      </div>
    </div>
  )

  const selectedSection = marqueeSections.find((s) => s.id === selectedSectionId)

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button onClick={() => step === 'list' ? setView('home') : step === 'edit' ? setStep('list') : setStep('edit')} className="text-rose-500 hover:text-rose-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-rose-900">Add to Wardrobe</h1>
          <p className="text-xs text-muted-foreground">
            {unprocessedOutfits.length} unprocessed outfit{unprocessedOutfits.length !== 1 ? 's' : ''} remaining
          </p>
        </div>
        <span className="text-xs font-medium text-rose-500">{currentIndex + 1}/{unprocessedOutfits.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* ─── List of unprocessed outfits ─── */}
        {step === 'list' && (
          <div className="px-4 py-4 space-y-3">
            {unprocessedOutfits.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No unprocessed outfits!</p>
                <Button onClick={() => setView('home')} className="mt-4 rounded-xl bg-rose-500 text-white">Back to Calendar</Button>
              </div>
            ) : (
              unprocessedOutfits.map((outfit, idx) => (
                <div key={outfit.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-rose-100 shadow-sm">
                  <div className="w-16 h-20 rounded-lg overflow-hidden border border-rose-100 shrink-0">
                    {outfit.imageUrl && <img src={outfit.imageUrl} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-rose-900 truncate">{outfit.caption || outfit.name || `Outfit for ${outfit.date}`}</p>
                    <p className="text-xs text-muted-foreground">{outfit.date}{outfit.time ? ` at ${outfit.time}` : ''}</p>
                    {outfit.reasonTag && <span className="inline-block mt-1 px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-medium rounded-full">{outfit.reasonTag}</span>}
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Button size="sm" onClick={() => { setCurrentIndex(idx); startProcessing(outfit) }} className="rounded-lg bg-rose-500 text-white text-xs h-8 px-3">Process</Button>
                    <Button size="sm" variant="outline" onClick={() => { markOutfitProcessed(outfit.id) }} className="rounded-lg text-xs h-8 px-3">Skip</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── Edit step (crop/cut/marquee) ─── */}
        {step === 'edit' && imageSrc && (
          <div className="px-4 py-4">
            {/* Tool selector */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <button onClick={() => setTool('crop')} className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${tool === 'crop' ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-700'}`}><Crop className="w-3.5 h-3.5" />Crop</button>
              <button onClick={() => setTool('cut')} className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${tool === 'cut' ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-700'}`}><Scissors className="w-3.5 h-3.5" />Cut</button>
              <button onClick={() => setTool('marquee')} className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${tool === 'marquee' ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-700'}`}><MousePointer2 className="w-3.5 h-3.5" />Marquee</button>
            </div>
            <p className="text-[10px] text-center text-muted-foreground mb-2">
              {tool === 'crop' && '↔ Draw a rectangle to crop'}{tool === 'cut' && '↕ Drag the line to split'}{tool === 'marquee' && '↔ Draw areas to tag & save separately'}
            </p>

            <div ref={imageContainerRef} className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border-2 border-rose-200 bg-rose-50 select-none" style={{ touchAction: 'none' }} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp} onMouseMove={tool === 'cut' ? (e) => { if (isDraggingCut && imageContainerRef.current) { const rect = imageContainerRef.current.getBoundingClientRect(); setCutPosition(Math.max(10, Math.min(90, ((e.clientY - rect.top) / rect.height) * 100))) } } : undefined} onMouseUp={() => setIsDraggingCut(false)} onMouseLeave={() => setIsDraggingCut(false)} onTouchMove={tool === 'cut' ? (e) => { if (isDraggingCut && imageContainerRef.current) { const rect = imageContainerRef.current.getBoundingClientRect(); setCutPosition(Math.max(10, Math.min(90, ((e.touches[0].clientY - rect.top) / rect.height) * 100))) } } : undefined} onTouchEnd={() => setIsDraggingCut(false)}>
              <img src={imageSrc} alt="" className="w-full h-full object-cover" draggable={false} />
              {tool === 'cut' && (<><div className="absolute top-0 left-0 right-0 bg-rose-500/10 pointer-events-none" style={{ height: `${cutPosition}%` }} /><div className="absolute bottom-0 left-0 right-0 bg-sky-500/10 pointer-events-none" style={{ height: `${100 - cutPosition}%` }} /><div className="absolute top-2 left-2 px-1.5 py-0.5 bg-rose-500 text-white text-[9px] font-bold rounded">TOP</div><div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-sky-500 text-white text-[9px] font-bold rounded">BOTTOM</div><div className="absolute left-0 right-0 flex items-center justify-center cursor-row-resize z-10" style={{ top: `${cutPosition}%`, transform: 'translateY(-50%)' }} onMouseDown={() => setIsDraggingCut(true)} onTouchStart={() => setIsDraggingCut(true)}><div className="w-full h-0.5 bg-rose-500 shadow-lg" /><div className="absolute w-8 h-8 rounded-full bg-rose-500 border-3 border-white shadow-lg flex items-center justify-center"><Scissors className="w-3.5 h-3.5 text-white" /></div></div></>)}
              {tool === 'crop' && cropRect && cropRect.w > 0 && cropRect.h > 0 && (<><div className="absolute pointer-events-none" style={{ left: `${cropRect.x}%`, top: `${cropRect.y}%`, width: `${cropRect.w}%`, height: `${cropRect.h}%`, boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)', borderRadius: '0.375rem' }} /><div className="absolute border-2 border-white border-dashed rounded-lg pointer-events-none" style={{ left: `${cropRect.x}%`, top: `${cropRect.y}%`, width: `${cropRect.w}%`, height: `${cropRect.h}%` }} /></>)}
              {tool === 'marquee' && (<>{marqueeSections.map((s, i) => <div key={s.id} className={`absolute border-2 rounded-lg cursor-pointer ${sectionColors[i % sectionColors.length]} ${selectedSectionId === s.id ? 'ring-2 ring-white' : ''}`} style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%`, height: `${s.h}%` }} onPointerDown={(e) => { e.stopPropagation(); setSelectedSectionId(s.id); setShowTagPanel(true) }}><span className={`absolute -top-2 -left-1 w-5 h-5 ${sectionBadgeColors[i % sectionBadgeColors.length]} text-white text-[8px] font-bold rounded-full flex items-center justify-center`}>{i + 1}</span></div>)}{currentMarqueeRect && currentMarqueeRect.w > 0 && <div className="absolute border-2 border-rose-400 border-dashed bg-rose-400/20 rounded-lg pointer-events-none" style={{ left: `${currentMarqueeRect.x}%`, top: `${currentMarqueeRect.y}%`, width: `${currentMarqueeRect.w}%`, height: `${currentMarqueeRect.h}%` }} />}</>)}
            </div>

            {/* Marquee section tag panel */}
            {tool === 'marquee' && showTagPanel && selectedSection && (
              <div className="mt-2 p-2.5 rounded-xl border border-rose-200 bg-rose-50/80 space-y-2">
                <div className="flex items-center justify-between"><p className="text-xs font-semibold text-rose-700"><Tag className="inline w-3.5 h-3.5 mr-1" />Tag Section</p><button onClick={() => { setShowTagPanel(false); setSelectedSectionId(null) }} className="p-0.5 text-rose-400"><X className="w-4 h-4" /></button></div>
                <div><p className="text-[10px] font-semibold mb-1">Category</p><div className="flex flex-wrap gap-1">{categoryOptions.map(({ key, label, icon }) => <button key={key} onClick={() => { setMarqueeSections((prev) => prev.map((s) => s.id === selectedSection.id ? { ...s, category: key, type: '', detail: '', tags: [] } : s)) }} className={`flex items-center gap-0.5 px-2 py-1.5 rounded-lg text-[10px] font-medium ${selectedSection.category === key ? 'bg-rose-500 text-white' : 'bg-white text-rose-700'}`}><span>{icon}</span>{label}</button>)}</div></div>
                {selectedSection.category && renderCascadingTags(getTypeTreeForCategory(selectedSection.category), selectedSection.type, (v) => { setMarqueeSections((prev) => prev.map((s) => s.id === selectedSection.id ? { ...s, type: v, detail: '', tags: [] } : s)) }, selectedSection.detail, (v) => { setMarqueeSections((prev) => prev.map((s) => s.id === selectedSection.id ? { ...s, detail: v, tags: [] } : s)) }, selectedSection.tags, (tag) => { setMarqueeSections((prev) => prev.map((s) => s.id === selectedSection.id ? { ...s, tags: s.tags.includes(tag) ? s.tags.filter((t) => t !== tag) : [...s.tags, tag] } : s)) }, selectedSection.category === 'BOTTOM' ? 'sky' : 'rose')}
                {selectedSection.category && renderColorPicker(selectedSection.color, (v) => { setMarqueeSections((prev) => prev.map((s) => s.id === selectedSection.id ? { ...s, color: v } : s)) })}
                <Button onClick={() => { setShowTagPanel(false); setSelectedSectionId(null) }} className="w-full h-9 rounded-lg bg-rose-500 text-white text-xs font-semibold"><Check className="w-3.5 h-3.5 mr-1" />Done</Button>
              </div>
            )}
          </div>
        )}

        {/* ─── Save step ─── */}
        {step === 'save' && (
          <div className="px-4 py-4 space-y-3">
            <div className="flex gap-2">
              {mode === 'split' ? (<><div className="flex-1 rounded-lg overflow-hidden border border-rose-200 aspect-[3/4]">{topImageSrc && <img src={topImageSrc} alt="Top" className="w-full h-full object-cover" />}</div><div className="flex-1 rounded-lg overflow-hidden border border-sky-200 aspect-[3/4]">{bottomImageSrc && <img src={bottomImageSrc} alt="Bottom" className="w-full h-full object-cover" />}</div></>) : (<div className="flex-1 rounded-lg overflow-hidden border border-rose-200 aspect-[3/4] max-w-[160px] mx-auto">{imageSrc && <img src={imageSrc} alt="Full" className="w-full h-full object-cover" />}</div>)}
            </div>
            {mode === 'split' ? (<div className="space-y-3"><div className="p-2.5 rounded-xl border border-rose-200 bg-rose-50/50 space-y-2"><p className="text-xs font-semibold text-rose-700">👕 Top</p>{renderCascadingTags(topTypes, topType, setTopType, topDetail, setTopDetail, topTags, (t) => setTopTags((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t]))}{renderColorPicker(topColor, setTopColor)}</div><div className="p-2.5 rounded-xl border border-sky-200 bg-sky-50/50 space-y-2"><p className="text-xs font-semibold text-sky-700">👖 Bottom</p>{renderCascadingTags(bottomTypes, bottomType, setBottomType, bottomDetail, setBottomDetail, bottomTags, (t) => setBottomTags((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t]), 'sky')}{renderColorPicker(bottomColor, setBottomColor)}</div></div>) : (<div className="p-2.5 rounded-xl border border-rose-200 bg-rose-50/50 space-y-2"><p className="text-xs font-semibold text-rose-700">👗 Full Suit</p>{renderCascadingTags(fullSuitTypes, fullType, setFullType, fullDetail, setFullDetail, fullTags, (t) => setFullTags((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t]))}{renderColorPicker(fullColor, setFullColor)}</div>)}
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="px-4 py-3 border-t border-rose-100 bg-white/80 backdrop-blur-sm">
        {step === 'edit' && (
          <div className="space-y-2">
            {tool === 'crop' && <div className="flex gap-2"><Button variant="outline" onClick={() => setCropRect(null)} className="flex-1 h-10 rounded-xl border-rose-200 text-rose-700 text-xs"><RotateCcw className="w-3.5 h-3.5 mr-1" />Reset</Button><Button onClick={handleCropConfirm} disabled={!cropRect || cropRect.w < 3} className="flex-[2] h-10 rounded-xl bg-rose-500 text-white text-xs font-semibold"><Crop className="w-3.5 h-3.5 mr-1" />Crop</Button></div>}
            {tool === 'cut' && <div className="flex gap-2"><Button onClick={handleCutConfirm} className="flex-1 h-10 rounded-xl bg-rose-500 text-white text-xs font-semibold"><Scissors className="w-3.5 h-3.5 mr-1" />Confirm Cut</Button><Button onClick={() => { setMode('full'); setStep('save') }} variant="outline" className="h-10 rounded-xl border-rose-200 text-rose-700 text-xs"><Shirt className="w-3.5 h-3.5 mr-1" />Full Suit</Button></div>}
            {tool === 'marquee' && <div className="flex gap-2"><Button variant="outline" onClick={() => setMarqueeSections([])} className="flex-1 h-10 rounded-xl border-rose-200 text-rose-700 text-xs"><RotateCcw className="w-3.5 h-3.5 mr-1" />Reset</Button><Button onClick={handleSaveMarqueeSections} disabled={isSaving || marqueeSections.length === 0} className="flex-[2] h-10 rounded-xl bg-rose-500 text-white text-xs font-semibold">{isSaving ? 'Saving...' : `Save All (${marqueeSections.length})`}</Button></div>}
            <Button variant="ghost" onClick={handleSkip} className="w-full h-9 text-rose-400 text-xs"><SkipForward className="w-3.5 h-3.5 mr-1" />Skip this outfit</Button>
          </div>
        )}
        {step === 'save' && <Button onClick={mode === 'split' ? handleSaveSplit : handleSaveFull} disabled={isSaving} className="w-full h-11 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold">{isSaving ? 'Saving...' : 'Add to Wardrobe ✨'}</Button>}
      </div>
    </div>
  )
}
