'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Camera, ImagePlus, Scissors, Check, RotateCcw, Shirt,
  Crop, MousePointer2, Trash2, Plus, X, Tag
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore, type ClothingCategory } from '@/lib/store'
import { optimizeDataURL, dataURLToFile, cropImageRegion } from '@/lib/image-utils'
import { toast } from 'sonner'

// ─── Step type ───
type SaveStep = 'capture' | 'edit' | 'save'
type EditTool = 'crop' | 'cut' | 'marquee'

// ─── Rect type for crop/marquee ───
interface DrawRect {
  id: string
  x: number  // percentage 0-100
  y: number  // percentage 0-100
  w: number  // percentage 0-100
  h: number  // percentage 0-100
}

// ─── Marquee section with tags ───
interface MarqueeSection extends DrawRect {
  category: ClothingCategory | null
  type: string
  detail: string
  tags: string[]
  color: string
}

// ─── Cascading type trees ───
const topTypes: Record<string, Record<string, string[]>> = {
  'T-Shirt': {
    'Short Sleeves': ['Round Neck', 'V Neck', 'Graphic', 'Plain'],
    'Long Sleeves': ['Round Neck', 'V Neck', 'Turtle Neck'],
    'Sleeveless': ['Tank Top', 'Muscle Tee'],
  },
  'Shirt': {
    'Short Sleeves': ['Casual', 'Formal', 'Linen'],
    'Long Sleeves': ['Casual', 'Formal', 'Denim', 'Flannel'],
  },
  'Blouse': {
    'Short Sleeves': ['Round Neck', 'V Neck', 'Ruffle'],
    'Long Sleeves': ['Button-up', 'Wrap', 'Pleated'],
    'Sleeveless': ['Camisole', 'Tank', 'Halter'],
  },
  'Jacket': {
    'Casual': ['Denim', 'Bomber', 'Varsity'],
    'Formal': ['Blazer', 'Sport Coat'],
    'Winter': ['Puffer', 'Parka', 'Leather'],
  },
  'Sweater': {
    'Pullover': ['Crew Neck', 'V Neck', 'Turtle Neck'],
    'Cardigan': ['Button-up', 'Open Front'],
  },
  'Hoodie': {
    'Pullover': ['Kangaroo Pocket', 'Cropped'],
    'Zip-up': ['Full Zip', 'Half Zip'],
  },
  'Coat': {
    'Overcoat': ['Wool', 'Cashmere', 'Trench'],
    'Raincoat': ['Hooded', 'Classic'],
  },
  'Tank Top': {
    'Casual': ['Ribbed', 'Cropped'],
    'Athletic': ['Compression', 'Mesh'],
  },
}

const bottomTypes: Record<string, Record<string, string[]>> = {
  'Jeans': {
    'Slim Fit': ['Dark Wash', 'Light Wash', 'Black'],
    'Regular Fit': ['Straight Leg', 'Bootcut'],
    'Skinny': ['High Rise', 'Mid Rise'],
  },
  'Trousers': {
    'Formal': ['Pleated', 'Flat Front'],
    'Casual': ['Chinos', 'Cargos', 'Corduroy'],
  },
  'Shorts': {
    'Casual': ['Denim', 'Chino', 'Athletic'],
    'Formal': ['Bermuda', 'Tailored'],
  },
  'Skirt': {
    'Mini': ['A-Line', 'Pleated', 'Wrap'],
    'Midi': ['A-Line', 'Pencil', 'Wrap'],
    'Maxi': ['Flowy', 'Slit', 'Tiered'],
  },
  'Leggings': {
    'Casual': ['Cotton', 'High Waist'],
    'Athletic': ['Compression', 'Yoga'],
  },
  'Joggers': {
    'Casual': ['Cotton', 'Fleece', 'Cuffed'],
    'Athletic': ['Slim Fit', 'Tapered'],
  },
}

const fullSuitTypes: Record<string, Record<string, string[]>> = {
  'Saree': {
    'Silk': ['Banarasi', 'Kanchipuram'],
    'Cotton': ['Handloom', 'Printed'],
    'Synthetic': ['Georgette', 'Chiffon', 'Crepe'],
  },
  'Dress': {
    'Casual': ['T-Shirt', 'Wrap', 'Shift'],
    'Formal': ['Cocktail', 'Evening Gown', 'Sheath'],
    'Summer': ['Sundress', 'Maxi', 'Floral'],
  },
  'Jumpsuit': {
    'Casual': ['Wide Leg', 'Slim Fit'],
    'Formal': ['Black Tie', 'Structured'],
  },
  'Salwar Kameez': {
    'Traditional': ['Anarkali', 'Straight Cut', 'A-Line'],
    'Modern': ['Palazzo', 'Dhoti', 'Cape Style'],
  },
}

const shoesTypes: Record<string, Record<string, string[]>> = {
  'Sneakers': {
    'Casual': ['Canvas', 'Leather', 'Platform'],
    'Sport': ['Running', 'Training', 'Walking'],
  },
  'Heels': {
    'Low': ['Kitten', 'Block', 'Wedge'],
    'High': ['Stiletto', 'Platform'],
  },
  'Flats': {
    'Casual': ['Ballet', 'Loafer', 'Espadrille'],
    'Formal': ['Pointed', 'Round Toe'],
  },
  'Boots': {
    'Ankle': ['Chelsea', 'Combat', 'Chukka'],
    'Knee-High': ['Riding', 'Lace-up'],
  },
  'Sandals': {
    'Casual': ['Flip Flop', 'Slider', 'Strappy'],
    'Formal': ['Block Heel', 'Wedge'],
  },
}

const accessoryTypes: Record<string, Record<string, string[]>> = {
  'Watch': {
    'Casual': ['Leather Strap', 'Metal Band', 'Digital'],
    'Formal': ['Gold', 'Silver', 'Rose Gold'],
  },
  'Necklace': {
    'Casual': ['Pendant', 'Chain', 'Choker'],
    'Formal': ['Pearl', 'Diamond', 'Statement'],
  },
  'Earrings': {
    'Casual': ['Studs', 'Hoops', 'Drop'],
    'Formal': ['Chandelier', 'Pearl'],
  },
  'Belt': {
    'Casual': ['Canvas', 'Braided'],
    'Formal': ['Leather', 'Reversible'],
  },
  'Bag': {
    'Casual': ['Tote', 'Backpack', 'Crossbody'],
    'Formal': ['Clutch', 'Satchel', 'Briefcase'],
  },
  'Sunglasses': {
    'Casual': ['Aviator', 'Wayfarer', 'Round'],
    'Sport': ['Wraparound', 'Polarized'],
  },
  'Hat': {
    'Casual': ['Baseball Cap', 'Beanie', 'Bucket'],
    'Formal': ['Fedora', 'Wide Brim'],
  },
  'Scarf': {
    'Casual': ['Cotton', 'Silk', 'Wool'],
    'Winter': ['Knit', 'Cashmere', 'Fleece'],
  },
}

// ─── Category options ───
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

// ─── Color palette ───
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

const seasonOccasionTags = ['Casual', 'Formal', 'Semi-Formal', 'Summer', 'Winter', 'All Season']

// ─── Section colors for marquee ───
const sectionColors = [
  'border-rose-400 bg-rose-400/20',
  'border-sky-400 bg-sky-400/20',
  'border-emerald-400 bg-emerald-400/20',
  'border-amber-400 bg-amber-400/20',
  'border-purple-400 bg-purple-400/20',
  'border-pink-400 bg-pink-400/20',
  'border-teal-400 bg-teal-400/20',
  'border-orange-400 bg-orange-400/20',
]

const sectionBadgeColors = [
  'bg-rose-500',
  'bg-sky-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-orange-500',
]

export default function SaveOutfitView() {
  const { setView, addClothingItem } = useStore()
  const [step, setStep] = useState<SaveStep>('capture')
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null)

  // Edit tool state
  const [tool, setTool] = useState<EditTool>('cut')
  const [cutPosition, setCutPosition] = useState(50)
  const [isDraggingCut, setIsDraggingCut] = useState(false)

  // Crop state
  const [isDrawingCrop, setIsDrawingCrop] = useState(false)
  const [cropRect, setCropRect] = useState<DrawRect | null>(null)
  const [cropDrawStart, setCropDrawStart] = useState<{ x: number; y: number } | null>(null)

  // Marquee state
  const [marqueeSections, setMarqueeSections] = useState<MarqueeSection[]>([])
  const [isDrawingMarquee, setIsDrawingMarquee] = useState(false)
  const [marqueeDrawStart, setMarqueeDrawStart] = useState<{ x: number; y: number } | null>(null)
  const [currentMarqueeRect, setCurrentMarqueeRect] = useState<DrawRect | null>(null)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [showTagPanel, setShowTagPanel] = useState(false)

  // Save state
  const [mode, setMode] = useState<'split' | 'full'>('split')
  const [isSaving, setIsSaving] = useState(false)

  // Form fields — top
  const [topType, setTopType] = useState('')
  const [topDetail, setTopDetail] = useState('')
  const [topTags, setTopTags] = useState<string[]>([])
  const [topColor, setTopColor] = useState('')
  const [topImageSrc, setTopImageSrc] = useState<string | null>(null)
  const [bottomImageSrc, setBottomImageSrc] = useState<string | null>(null)

  // Form fields — bottom
  const [bottomType, setBottomType] = useState('')
  const [bottomDetail, setBottomDetail] = useState('')
  const [bottomTags, setBottomTags] = useState<string[]>([])
  const [bottomColor, setBottomColor] = useState('')

  // Form fields — full suit
  const [fullType, setFullType] = useState('')
  const [fullDetail, setFullDetail] = useState('')
  const [fullTags, setFullTags] = useState<string[]>([])
  const [fullColor, setFullColor] = useState('')
  const [outfitName, setOutfitName] = useState('')

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const imageContainerRef = useRef<HTMLDivElement>(null)

  // ─── File select ───
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      setImageSrc(dataUrl)
      setOriginalImageSrc(dataUrl)
      setStep('edit')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [])

  // ─── Cut drag handlers ───
  const handleCutDragMove = useCallback((clientY: number) => {
    if (!imageContainerRef.current || !isDraggingCut) return
    const rect = imageContainerRef.current.getBoundingClientRect()
    const y = clientY - rect.top
    const pct = Math.max(10, Math.min(90, (y / rect.height) * 100))
    setCutPosition(pct)
  }, [isDraggingCut])

  const handleCutDragStart = useCallback(() => setIsDraggingCut(true), [])
  const handleCutDragEnd = useCallback(() => setIsDraggingCut(false), [])

  // ─── Crop drawing handlers ───
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
    const currentX = ((e.clientX - rect.left) / rect.width) * 100
    const currentY = ((e.clientY - rect.top) / rect.height) * 100
    const x = Math.min(cropDrawStart.x, currentX)
    const y = Math.min(cropDrawStart.y, currentY)
    const w = Math.abs(currentX - cropDrawStart.x)
    const h = Math.abs(currentY - cropDrawStart.y)
    setCropRect({ id: 'crop', x, y, w, h })
  }, [isDrawingCrop, cropDrawStart, tool])

  const handleCropPointerUp = useCallback(() => {
    if (isDrawingCrop) {
      setIsDrawingCrop(false)
      setCropDrawStart(null)
    }
  }, [isDrawingCrop])

  // ─── Marquee drawing handlers ───
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
    const newId = `section-${Date.now()}`
    setCurrentMarqueeRect({ id: newId, x, y, w: 0, h: 0 })
  }, [tool])

  const handleMarqueePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawingMarquee || !marqueeDrawStart || tool !== 'marquee') return
    e.preventDefault()
    const container = imageContainerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const currentX = ((e.clientX - rect.left) / rect.width) * 100
    const currentY = ((e.clientY - rect.top) / rect.height) * 100
    const x = Math.min(marqueeDrawStart.x, currentX)
    const y = Math.min(marqueeDrawStart.y, currentY)
    const w = Math.abs(currentX - marqueeDrawStart.x)
    const h = Math.abs(currentY - marqueeDrawStart.y)
    if (currentMarqueeRect) {
      setCurrentMarqueeRect({ ...currentMarqueeRect, x, y, w, h })
    }
  }, [isDrawingMarquee, marqueeDrawStart, tool, currentMarqueeRect])

  const handleMarqueePointerUp = useCallback(() => {
    if (isDrawingMarquee && currentMarqueeRect && currentMarqueeRect.w > 3 && currentMarqueeRect.h > 3) {
      const newSection: MarqueeSection = {
        ...currentMarqueeRect,
        category: null,
        type: '',
        detail: '',
        tags: [],
        color: '',
      }
      setMarqueeSections((prev) => [...prev, newSection])
    }
    setIsDrawingMarquee(false)
    setMarqueeDrawStart(null)
    setCurrentMarqueeRect(null)
  }, [isDrawingMarquee, currentMarqueeRect])

  // ─── Unified pointer handlers ───
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

  // ─── Crop confirm ───
  const handleCropConfirm = useCallback(async () => {
    if (!imageSrc || !cropRect || cropRect.w < 3 || cropRect.h < 3) {
      toast.error('Draw a crop area first')
      return
    }
    try {
      const cropped = await cropImageRegion(imageSrc, {
        x: cropRect.x,
        y: cropRect.y,
        w: cropRect.w,
        h: cropRect.h,
      })
      const optimized = await optimizeDataURL(cropped)
      setImageSrc(optimized)
      setCropRect(null)
      toast.success('Cropped! Now use Cut or Marquee tool')
    } catch {
      toast.error('Crop failed. Try again.')
    }
  }, [imageSrc, cropRect])

  // ─── Cut confirm (split into top/bottom) ───
  const handleCutConfirm = useCallback(async () => {
    if (!imageSrc) return
    const img = new Image()
    img.onload = async () => {
      const cutY = Math.round((cutPosition / 100) * img.height)
      const topCanvas = document.createElement('canvas')
      topCanvas.width = img.width
      topCanvas.height = cutY
      const topCtx = topCanvas.getContext('2d')!
      topCtx.drawImage(img, 0, 0, img.width, cutY, 0, 0, img.width, cutY)

      const bottomCanvas = document.createElement('canvas')
      bottomCanvas.width = img.width
      bottomCanvas.height = img.height - cutY
      const bottomCtx = bottomCanvas.getContext('2d')!
      bottomCtx.drawImage(img, 0, cutY, img.width, img.height - cutY, 0, 0, img.width, img.height - cutY)

      const [optimizedTop, optimizedBottom] = await Promise.all([
        optimizeDataURL(topCanvas.toDataURL('image/png')),
        optimizeDataURL(bottomCanvas.toDataURL('image/png')),
      ])
      setTopImageSrc(optimizedTop)
      setBottomImageSrc(optimizedBottom)
      setMode('split')
      setStep('save')
    }
    img.src = imageSrc
  }, [imageSrc, cutPosition])

  // ─── Full suit confirm ───
  const handleFullSuitConfirm = useCallback(() => {
    setMode('full')
    setStep('save')
  }, [])

  // ─── Marquee: select a section ───
  const handleSelectSection = useCallback((sectionId: string) => {
    setSelectedSectionId(sectionId)
    setShowTagPanel(true)
  }, [])

  // ─── Marquee: update section tags ───
  const updateMarqueeSection = useCallback((id: string, updates: Partial<MarqueeSection>) => {
    setMarqueeSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    )
  }, [])

  // ─── Marquee: delete section ───
  const deleteMarqueeSection = useCallback((id: string) => {
    setMarqueeSections((prev) => prev.filter((s) => s.id !== id))
    if (selectedSectionId === id) {
      setSelectedSectionId(null)
      setShowTagPanel(false)
    }
  }, [selectedSectionId])

  // ─── Marquee: save all sections ───
  const handleSaveMarqueeSections = useCallback(async () => {
    if (!imageSrc || marqueeSections.length === 0) return

    // Validate that all sections have a category
    const untagged = marqueeSections.filter((s) => !s.category)
    if (untagged.length > 0) {
      toast.error(`Please assign a category to section ${marqueeSections.indexOf(untagged[0]) + 1}`)
      return
    }

    setIsSaving(true)
    try {
      let savedCount = 0
      for (const section of marqueeSections) {
        const cropped = await cropImageRegion(imageSrc, {
          x: section.x,
          y: section.y,
          w: section.w,
          h: section.h,
        })
        const optimized = await optimizeDataURL(cropped)
        const file = dataURLToFile(optimized, `section-${savedCount}.jpg`)
        const allTags = [section.detail, ...section.tags].filter(Boolean)

        const success = await addClothingItem({
          category: section.category!,
          subType: section.type || section.category!.toLowerCase(),
          color: section.color,
          size: '',
          tags: allTags,
          isFavorite: false,
          imageUrl: '',
        }, file)

        if (success) savedCount++
      }

      if (savedCount > 0) {
        toast.success(`${savedCount} section${savedCount > 1 ? 's' : ''} saved! ✨`)
        setView('home')
      } else {
        toast.error('Failed to save sections')
      }
    } catch {
      toast.error('Failed to save sections')
    }
    setIsSaving(false)
  }, [imageSrc, marqueeSections, addClothingItem, setView])

  // ─── Save split (top/bottom) ───
  const handleSaveSplit = async () => {
    if (!topImageSrc || !bottomImageSrc) return
    setIsSaving(true)
    try {
      const topFile = dataURLToFile(topImageSrc, 'top.jpg')
      const topAllTags = [topDetail, ...topTags].filter(Boolean)

      const topSuccess = await addClothingItem({
        category: 'TOP',
        subType: topType || 'Top',
        color: topColor,
        size: '',
        tags: topAllTags,
        isFavorite: false,
        imageUrl: '',
      }, topFile)

      const bottomFile = dataURLToFile(bottomImageSrc, 'bottom.jpg')
      const bottomAllTags = [bottomDetail, ...bottomTags].filter(Boolean)

      const bottomSuccess = await addClothingItem({
        category: 'BOTTOM',
        subType: bottomType || 'Bottom',
        color: bottomColor,
        size: '',
        tags: bottomAllTags,
        isFavorite: false,
        imageUrl: '',
      }, bottomFile)

      if (topSuccess && bottomSuccess) {
        toast.success('Top & bottom saved! 👕👖✨')
        setView('home')
      } else {
        toast.error('Failed to save some items')
      }
    } catch {
      toast.error('Failed to save items')
    }
    setIsSaving(false)
  }

  // ─── Save full suit ───
  const handleSaveFull = async () => {
    if (!imageSrc) return
    setIsSaving(true)
    try {
      const optimizedSrc = await optimizeDataURL(imageSrc)
      const file = dataURLToFile(optimizedSrc, 'outfit.jpg')
      const allTags = [fullDetail, ...fullTags].filter(Boolean)

      const success = await addClothingItem({
        category: 'FULL_SUIT',
        subType: fullType || 'Full Outfit',
        color: fullColor,
        size: '',
        tags: allTags,
        isFavorite: false,
        imageUrl: '',
      }, file)

      if (success) {
        toast.success('Full outfit saved! 👗✨')
        setView('home')
      } else {
        toast.error('Failed to save outfit')
      }
    } catch {
      toast.error('Failed to save outfit')
    }
    setIsSaving(false)
  }

  // ─── Reset everything ───
  const resetAll = () => {
    setStep('capture')
    setImageSrc(null)
    setOriginalImageSrc(null)
    setCutPosition(50)
    setTool('cut')
    setCropRect(null)
    setMarqueeSections([])
    setCurrentMarqueeRect(null)
    setSelectedSectionId(null)
    setShowTagPanel(false)
    setMode('split')
    setTopType(''); setTopDetail(''); setTopTags([]); setTopColor('')
    setBottomType(''); setBottomDetail(''); setBottomTags([]); setBottomColor('')
    setFullType(''); setFullDetail(''); setFullTags([]); setFullColor('')
    setTopImageSrc(null); setBottomImageSrc(null)
    setOutfitName('')
  }

  // ─── Render cascading tag selector ───
  const renderCascadingTags = (
    typeTree: Record<string, Record<string, string[]>>,
    selectedType: string,
    setSelectedType: (v: string) => void,
    selectedDetail: string,
    setSelectedDetail: (v: string) => void,
    selectedTags: string[],
    toggleTag: (tag: string) => void,
    accentColor: string = 'rose'
  ) => {
    const types = Object.keys(typeTree)
    const details = selectedType ? Object.keys(typeTree[selectedType] || {}) : []
    const tags = selectedType && selectedDetail ? (typeTree[selectedType][selectedDetail] || []) : []
    const bgActive = accentColor === 'sky' ? 'bg-sky-500' : accentColor === 'emerald' ? 'bg-emerald-500' : 'bg-rose-500'
    const bgInactive = accentColor === 'sky'
      ? 'bg-sky-50 text-sky-700 hover:bg-sky-100'
      : accentColor === 'emerald'
        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
        : 'bg-rose-50 text-rose-700 hover:bg-rose-100'

    return (
      <div className="space-y-3">
        {/* Row 1: Type */}
        <div>
          <p className="text-xs font-semibold mb-1.5">Type</p>
          <div className="flex flex-wrap gap-2">
            {types.map((type) => (
              <button
                key={type}
                onClick={() => { setSelectedType(type); setSelectedDetail('') }}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  selectedType === type ? `${bgActive} text-white shadow-sm` : bgInactive
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Detail */}
        {selectedType && details.length > 0 && (
          <div>
            <p className="text-xs font-semibold mb-1.5">{selectedType} Style</p>
            <div className="flex flex-wrap gap-2">
              {details.map((detail) => (
                <button
                  key={detail}
                  onClick={() => setSelectedDetail(detail)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    selectedDetail === detail ? `${bgActive} text-white shadow-sm` : bgInactive
                  }`}
                >
                  {detail}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Row 3: Specific tags */}
        {selectedDetail && tags.length > 0 && (
          <div>
            <p className="text-xs font-semibold mb-1.5">Details <span className="text-muted-foreground font-normal">(tap to select)</span></p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    selectedTags.includes(tag) ? `${bgActive} text-white shadow-sm` : bgInactive
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Season / Occasion */}
        {selectedType && (
          <div>
            <p className="text-xs font-semibold mb-1.5">Season & Occasion</p>
            <div className="flex flex-wrap gap-2">
              {seasonOccasionTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    selectedTags.includes(tag) ? `${bgActive} text-white shadow-sm` : bgInactive
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─── Render color picker ───
  const renderColorPicker = (
    selectedColor: string,
    setSelectedColor: (v: string) => void
  ) => (
    <div>
      <p className="text-xs font-semibold mb-2">Color</p>
      <div className="flex flex-wrap gap-2.5">
        {colorPalette.map(({ key, label, hex }) => (
          <button
            key={key}
            onClick={() => setSelectedColor(selectedColor === key ? '' : key)}
            className={`w-9 h-9 rounded-full border-2 transition-all relative ${
              selectedColor === key
                ? 'border-rose-500 scale-125 ring-2 ring-rose-200'
                : 'border-gray-200 hover:border-rose-300 hover:scale-110'
            }`}
            style={key === 'multi'
              ? { background: 'linear-gradient(135deg,#f00,#ff0,#0f0,#0ff,#00f)' }
              : { backgroundColor: hex }
            }
            title={label}
          >
            {selectedColor === key && (
              <Check className={`w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
                ['white', 'cream', 'yellow', 'beige', 'peach', 'lavender', 'silver'].includes(key) ? 'text-gray-700' : 'text-white'
              }`} />
            )}
          </button>
        ))}
      </div>
      {selectedColor && (
        <p className="text-xs text-muted-foreground mt-1">Selected: {colorPalette.find(c => c.key === selectedColor)?.label}</p>
      )}
    </div>
  )

  // ─── Selected marquee section for tag panel ───
  const selectedSection = marqueeSections.find((s) => s.id === selectedSectionId)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button
          onClick={() => {
            if (step === 'capture') setView('home')
            else if (step === 'edit') resetAll()
            else setStep('edit')
          }}
          className="text-rose-500 hover:text-rose-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-rose-900">Save an Outfit</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {step === 'capture'
              ? 'Take or upload a photo'
              : step === 'edit'
                ? 'Crop, cut, or select areas'
                : 'Add details & save'}
          </p>
        </div>
        <div className="flex gap-1.5">
          <div className={`w-6 h-1.5 rounded-full ${step === 'capture' ? 'bg-rose-500' : 'bg-rose-200'}`} />
          <div className={`w-6 h-1.5 rounded-full ${step === 'edit' ? 'bg-rose-500' : 'bg-rose-200'}`} />
          <div className={`w-6 h-1.5 rounded-full ${step === 'save' ? 'bg-rose-500' : 'bg-rose-200'}`} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {/* ═══════════════ CAPTURE STEP ═══════════════ */}
          {step === 'capture' && (
            <motion.div
              key="capture"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="px-4 py-8 flex flex-col items-center"
            >
              <div className="w-32 h-32 rounded-full bg-rose-50 flex items-center justify-center mb-6">
                <Camera className="w-14 h-14 text-rose-300" />
              </div>
              <h2 className="text-lg font-semibold text-rose-900 mb-2">Snap Your Outfit</h2>
              <p className="text-sm text-muted-foreground text-center mb-8 max-w-xs">
                Take a full-body photo or upload from gallery. Crop a person, cut into top &amp; bottom, or select multiple areas.
              </p>

              {/* Hidden inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelect}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />

              <div className="flex flex-col gap-3 w-full max-w-xs">
                <Button
                  onClick={() => cameraInputRef.current?.click()}
                  className="h-12 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Take Photo
                </Button>
                <Button
                  variant="outline"
                  onClick={() => galleryInputRef.current?.click()}
                  className="h-12 rounded-xl border-rose-200 text-rose-700 font-semibold"
                >
                  <ImagePlus className="w-5 h-5 mr-2" />
                  Upload from Gallery
                </Button>
              </div>
            </motion.div>
          )}

          {/* ═══════════════ EDIT STEP ═══════════════ */}
          {step === 'edit' && imageSrc && (
            <motion.div
              key="edit"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="px-4 py-4"
            >
              {/* Tool selector */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <button
                  onClick={() => { setTool('crop'); setCropRect(null); setShowTagPanel(false) }}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    tool === 'crop' ? 'bg-rose-500 text-white shadow-sm' : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  <Crop className="w-4 h-4" />
                  Crop
                </button>
                <button
                  onClick={() => { setTool('cut'); setCropRect(null); setShowTagPanel(false) }}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    tool === 'cut' ? 'bg-rose-500 text-white shadow-sm' : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  <Scissors className="w-4 h-4" />
                  Cut
                </button>
                <button
                  onClick={() => { setTool('marquee'); setCropRect(null); setShowTagPanel(false) }}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    tool === 'marquee' ? 'bg-rose-500 text-white shadow-sm' : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  <MousePointer2 className="w-4 h-4" />
                  Marquee
                </button>
              </div>

              {/* Tool hint */}
              <p className="text-xs text-center text-muted-foreground mb-3">
                {tool === 'crop' && '↔ Draw a rectangle to crop a person or area'}
                {tool === 'cut' && '↕ Drag the scissors line to split top & bottom'}
                {tool === 'marquee' && '↔ Draw rectangles on each area, then tap to assign tags'}
              </p>

              {/* Image container with overlays */}
              <div
                ref={imageContainerRef}
                className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden border-2 border-rose-200 bg-rose-50 select-none"
                style={{ touchAction: 'none' }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                // Cut drag handlers
                onMouseMove={tool === 'cut' ? (e) => handleCutDragMove(e.clientY) : undefined}
                onMouseUp={tool === 'cut' ? handleCutDragEnd : undefined}
                onMouseLeave={tool === 'cut' ? handleCutDragEnd : undefined}
                onTouchMove={tool === 'cut' ? (e) => handleCutDragMove(e.touches[0].clientY) : undefined}
                onTouchEnd={tool === 'cut' ? handleCutDragEnd : undefined}
              >
                <img src={imageSrc} alt="Your outfit" className="w-full h-full object-cover" draggable={false} />

                {/* ─── Cut overlay ─── */}
                {tool === 'cut' && (
                  <>
                    <div className="absolute top-0 left-0 right-0 bg-rose-500/10 pointer-events-none transition-all" style={{ height: `${cutPosition}%` }} />
                    <div className="absolute bottom-0 left-0 right-0 bg-sky-500/10 pointer-events-none transition-all" style={{ height: `${100 - cutPosition}%` }} />
                    <div className="absolute top-3 left-3 px-2 py-1 bg-rose-500 text-white text-[10px] font-bold rounded-lg pointer-events-none">👕 TOP</div>
                    <div className="absolute bottom-3 left-3 px-2 py-1 bg-sky-500 text-white text-[10px] font-bold rounded-lg pointer-events-none">👖 BOTTOM</div>
                    <div
                      className="absolute left-0 right-0 flex items-center justify-center cursor-row-resize z-10"
                      style={{ top: `${cutPosition}%`, transform: 'translateY(-50%)' }}
                      onMouseDown={handleCutDragStart}
                      onTouchStart={handleCutDragStart}
                    >
                      <div className="w-full h-1 bg-rose-500 shadow-lg" />
                      <div className="absolute w-10 h-10 rounded-full bg-rose-500 border-4 border-white shadow-lg flex items-center justify-center">
                        <Scissors className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </>
                )}

                {/* ─── Crop overlay ─── */}
                {tool === 'crop' && cropRect && cropRect.w > 0 && cropRect.h > 0 && (
                  <>
                    {/* Dim outside crop area using box-shadow technique */}
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: `${cropRect.x}%`,
                        top: `${cropRect.y}%`,
                        width: `${cropRect.w}%`,
                        height: `${cropRect.h}%`,
                        boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
                        borderRadius: '0.5rem',
                      }}
                    />
                    <div
                      className="absolute border-2 border-white border-dashed rounded-lg pointer-events-none"
                      style={{
                        left: `${cropRect.x}%`,
                        top: `${cropRect.y}%`,
                        width: `${cropRect.w}%`,
                        height: `${cropRect.h}%`,
                      }}
                    >
                      {/* Corner handles */}
                      <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white rounded-full shadow-md" />
                      <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white rounded-full shadow-md" />
                      <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white rounded-full shadow-md" />
                      <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white rounded-full shadow-md" />
                    </div>
                  </>
                )}

                {/* ─── Marquee overlays ─── */}
                {tool === 'marquee' && (
                  <>
                    {/* Existing sections */}
                    {marqueeSections.map((section, idx) => {
                      const colorClass = sectionColors[idx % sectionColors.length]
                      const badgeColor = sectionBadgeColors[idx % sectionBadgeColors.length]
                      const isSelected = selectedSectionId === section.id
                      return (
                        <div
                          key={section.id}
                          className={`absolute border-2 rounded-lg cursor-pointer transition-all ${colorClass} ${
                            isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-transparent' : ''
                          }`}
                          style={{
                            left: `${section.x}%`,
                            top: `${section.y}%`,
                            width: `${section.w}%`,
                            height: `${section.h}%`,
                          }}
                          onPointerDown={(e) => {
                            e.stopPropagation()
                            handleSelectSection(section.id)
                          }}
                        >
                          <span className={`absolute -top-3 -left-1 w-6 h-6 ${badgeColor} text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow`}>
                            {idx + 1}
                          </span>
                          {section.category && (
                            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-white/90 text-[9px] font-medium rounded">
                              {section.category}
                            </span>
                          )}
                        </div>
                      )
                    })}

                    {/* Current drawing rect */}
                    {currentMarqueeRect && currentMarqueeRect.w > 0 && currentMarqueeRect.h > 0 && (
                      <div
                        className="absolute border-2 border-rose-400 border-dashed bg-rose-400/20 rounded-lg pointer-events-none"
                        style={{
                          left: `${currentMarqueeRect.x}%`,
                          top: `${currentMarqueeRect.y}%`,
                          width: `${currentMarqueeRect.w}%`,
                          height: `${currentMarqueeRect.h}%`,
                        }}
                      />
                    )}
                  </>
                )}
              </div>

              {/* ─── Marquee section summary ─── */}
              {tool === 'marquee' && marqueeSections.length > 0 && !showTagPanel && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold text-rose-900">Sections ({marqueeSections.length})</p>
                  <div className="space-y-1.5">
                    {marqueeSections.map((section, idx) => {
                      const badgeColor = sectionBadgeColors[idx % sectionBadgeColors.length]
                      return (
                        <div
                          key={section.id}
                          className="flex items-center gap-2 p-2 bg-white rounded-xl border border-rose-100 cursor-pointer active:bg-rose-50"
                          onClick={() => handleSelectSection(section.id)}
                        >
                          <span className={`w-7 h-7 ${badgeColor} text-white text-xs font-bold rounded-full flex items-center justify-center shrink-0`}>
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            {section.category ? (
                              <p className="text-xs font-medium truncate">
                                {section.category} → {section.type || '...'} {section.color && `• ${section.color}`}
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground italic">Tap to assign tags</p>
                            )}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteMarqueeSection(section.id) }}
                            className="p-1 text-rose-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ─── Marquee tag panel (bottom sheet style) ─── */}
              {tool === 'marquee' && showTagPanel && selectedSection && (
                <div className="mt-3 p-3 rounded-xl border border-rose-200 bg-rose-50/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-rose-700">
                      <Tag className="inline w-4 h-4 mr-1" />
                      Tag Section
                    </p>
                    <button
                      onClick={() => { setShowTagPanel(false); setSelectedSectionId(null) }}
                      className="p-1 text-rose-400 hover:text-rose-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Category */}
                  <div>
                    <p className="text-xs font-semibold mb-1.5">Category</p>
                    <div className="flex flex-wrap gap-2">
                      {categoryOptions.map(({ key, label, icon }) => (
                        <button
                          key={key}
                          onClick={() => {
                            updateMarqueeSection(selectedSection.id, {
                              category: key,
                              type: '',
                              detail: '',
                              tags: [],
                            })
                          }}
                          className={`flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                            selectedSection.category === key
                              ? 'bg-rose-500 text-white shadow-sm'
                              : 'bg-white text-rose-700 hover:bg-rose-100'
                          }`}
                        >
                          <span>{icon}</span>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cascading tags */}
                  {selectedSection.category && renderCascadingTags(
                    getTypeTreeForCategory(selectedSection.category),
                    selectedSection.type,
                    (v) => updateMarqueeSection(selectedSection.id, { type: v, detail: '', tags: [] }),
                    selectedSection.detail,
                    (v) => updateMarqueeSection(selectedSection.id, { detail: v, tags: [] }),
                    selectedSection.tags,
                    (tag) => {
                      const newTags = selectedSection.tags.includes(tag)
                        ? selectedSection.tags.filter((t) => t !== tag)
                        : [...selectedSection.tags, tag]
                      updateMarqueeSection(selectedSection.id, { tags: newTags })
                    },
                    selectedSection.category === 'BOTTOM' ? 'sky' : selectedSection.category === 'SHOES' ? 'emerald' : 'rose'
                  )}

                  {/* Color */}
                  {selectedSection.category && renderColorPicker(
                    selectedSection.color,
                    (v) => updateMarqueeSection(selectedSection.id, { color: v })
                  )}

                  <Button
                    onClick={() => { setShowTagPanel(false); setSelectedSectionId(null) }}
                    className="w-full h-10 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Done
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════════════ SAVE STEP ═══════════════ */}
          {step === 'save' && (
            <motion.div
              key="save"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="px-4 py-4 space-y-4"
            >
              {/* Preview */}
              <div className="flex gap-3">
                {mode === 'split' ? (
                  <>
                    <div className="flex-1 rounded-xl overflow-hidden border border-rose-200 aspect-[3/4]">
                      {topImageSrc && <img src={topImageSrc} alt="Top" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 rounded-xl overflow-hidden border border-sky-200 aspect-[3/4]">
                      {bottomImageSrc && <img src={bottomImageSrc} alt="Bottom" className="w-full h-full object-cover" />}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 rounded-xl overflow-hidden border border-rose-200 aspect-[3/4] max-w-[200px] mx-auto">
                    {imageSrc && <img src={imageSrc} alt="Full outfit" className="w-full h-full object-cover" />}
                  </div>
                )}
              </div>

              {/* Outfit name */}
              <div>
                <p className="text-xs font-medium text-rose-700 mb-1">Outfit Name</p>
                <input
                  type="text"
                  placeholder="e.g., Office Monday"
                  value={outfitName}
                  onChange={(e) => setOutfitName(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-rose-200 text-sm focus:border-rose-400 focus:outline-none"
                />
              </div>

              {mode === 'split' ? (
                <div className="space-y-4">
                  {/* ─── TOP section ─── */}
                  <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/50 space-y-3">
                    <p className="text-sm font-semibold text-rose-700">👕 Top</p>
                    {renderCascadingTags(topTypes, topType, setTopType, topDetail, setTopDetail, topTags, (tag) => setTopTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]), 'rose')}
                    {renderColorPicker(topColor, setTopColor)}
                  </div>

                  {/* ─── BOTTOM section ─── */}
                  <div className="p-3 rounded-xl border border-sky-200 bg-sky-50/50 space-y-3">
                    <p className="text-sm font-semibold text-sky-700">👖 Bottom</p>
                    {renderCascadingTags(bottomTypes, bottomType, setBottomType, bottomDetail, setBottomDetail, bottomTags, (tag) => setBottomTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]), 'sky')}
                    {renderColorPicker(bottomColor, setBottomColor)}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/50 space-y-3">
                  <p className="text-sm font-semibold text-rose-700">👗 Full Suit</p>
                  {renderCascadingTags(fullSuitTypes, fullType, setFullType, fullDetail, setFullDetail, fullTags, (tag) => setFullTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]), 'rose')}
                  {renderColorPicker(fullColor, setFullColor)}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom actions */}
      <div className="px-4 py-3 border-t border-rose-100 bg-white/80 backdrop-blur-sm">
        {step === 'edit' && (
          <div className="space-y-2">
            {/* Crop actions */}
            {tool === 'crop' && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCropRect(null)}
                  className="flex-1 h-11 rounded-xl border-rose-200 text-rose-700"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reset
                </Button>
                <Button
                  onClick={handleCropConfirm}
                  disabled={!cropRect || cropRect.w < 3 || cropRect.h < 3}
                  className="flex-[2] h-11 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold"
                >
                  <Crop className="w-4 h-4 mr-1" />
                  Crop Image
                </Button>
              </div>
            )}

            {/* Cut actions */}
            {tool === 'cut' && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={resetAll}
                  className="flex-1 h-11 rounded-xl border-rose-200 text-rose-700"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Retake
                </Button>
                <Button
                  onClick={handleCutConfirm}
                  className="flex-[2] h-11 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold"
                >
                  <Scissors className="w-4 h-4 mr-1" />
                  Confirm Cut
                </Button>
                <Button
                  onClick={handleFullSuitConfirm}
                  variant="outline"
                  className="h-11 rounded-xl border-rose-200 text-rose-700"
                >
                  <Shirt className="w-4 h-4 mr-1" />
                  Full Suit
                </Button>
              </div>
            )}

            {/* Marquee actions */}
            {tool === 'marquee' && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={resetAll}
                  className="flex-1 h-11 rounded-xl border-rose-200 text-rose-700"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reset
                </Button>
                <Button
                  onClick={handleSaveMarqueeSections}
                  disabled={isSaving || marqueeSections.length === 0}
                  className="flex-[2] h-11 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold"
                >
                  {isSaving ? 'Saving...' : `Save All (${marqueeSections.length})`}
                </Button>
              </div>
            )}
          </div>
        )}

        {step === 'save' && (
          <Button
            onClick={mode === 'split' ? handleSaveSplit : handleSaveFull}
            disabled={isSaving}
            className="w-full h-12 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold"
          >
            {isSaving ? 'Saving...' : 'Save to Wardrobe ✨'}
          </Button>
        )}
      </div>
    </div>
  )
}
