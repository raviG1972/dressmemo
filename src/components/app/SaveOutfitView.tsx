'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Camera, ImagePlus, Scissors, Check, RotateCcw, Shirt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore, type ClothingCategory } from '@/lib/store'
import { optimizeDataURL, dataURLToFile } from '@/lib/image-utils'
import { toast } from 'sonner'

type SaveStep = 'capture' | 'cut' | 'save'

// ─── Cascading type tree for SaveOutfitView ───
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

// ─── Color palette ───
const colorPalette = [
  { key: 'black', label: 'Black', hex: '#1a1a1a' },
  { key: 'white', label: 'White', hex: '#FFFFFF' },
  { key: 'red', label: 'Red', hex: '#DC2626' },
  { key: 'maroon', label: 'Maroon', hex: '#800000' },
  { key: 'pink', label: 'Pink', hex: '#EC4899' },
  { key: 'orange', label: 'Orange', hex: '#F97316' },
  { key: 'yellow', label: 'Yellow', hex: '#EAB308' },
  { key: 'beige', label: 'Beige', hex: '#D4A574' },
  { key: 'cream', label: 'Cream', hex: '#FFFDD0' },
  { key: 'green', label: 'Green', hex: '#22C55E' },
  { key: 'olive', label: 'Olive', hex: '#808000' },
  { key: 'teal', label: 'Teal', hex: '#14B8A6' },
  { key: 'blue', label: 'Blue', hex: '#3B82F6' },
  { key: 'navy', label: 'Navy', hex: '#1E3A5F' },
  { key: 'purple', label: 'Purple', hex: '#8B5CF6' },
  { key: 'brown', label: 'Brown', hex: '#92400E' },
  { key: 'grey', label: 'Grey', hex: '#6B7280' },
  { key: 'gold', label: 'Gold', hex: '#DAA520' },
  { key: 'multi', label: 'Multi', hex: 'linear-gradient(135deg,#f00,#ff0,#0f0,#0ff,#00f)' },
]

const seasonOccasionTags = ['Casual', 'Formal', 'Semi-Formal', 'Summer', 'Winter', 'All Season']

export default function SaveOutfitView() {
  const { setView, addClothingItem } = useStore()
  const [step, setStep] = useState<SaveStep>('capture')
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [topImageSrc, setTopImageSrc] = useState<string | null>(null)
  const [bottomImageSrc, setBottomImageSrc] = useState<string | null>(null)
  const [cutPosition, setCutPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [mode, setMode] = useState<'split' | 'full'>('split')
  const [isSaving, setIsSaving] = useState(false)

  // Form fields — top
  const [topType, setTopType] = useState('')
  const [topDetail, setTopDetail] = useState('')
  const [topTags, setTopTags] = useState<string[]>([])
  const [topColor, setTopColor] = useState('')

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

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setImageSrc(ev.target?.result as string)
      setStep('cut')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [])

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
      setStep('save')
    }
    img.src = imageSrc
  }, [imageSrc, cutPosition])

  const handleDragMove = useCallback((clientY: number) => {
    if (!imageContainerRef.current || !isDragging) return
    const rect = imageContainerRef.current.getBoundingClientRect()
    const y = clientY - rect.top
    const pct = Math.max(10, Math.min(90, (y / rect.height) * 100))
    setCutPosition(pct)
  }, [isDragging])

  const handleDragStart = useCallback(() => setIsDragging(true), [])
  const handleDragEnd = useCallback(() => setIsDragging(false), [])

  const resetAll = () => {
    setStep('capture')
    setImageSrc(null)
    setTopImageSrc(null)
    setBottomImageSrc(null)
    setCutPosition(50)
    setMode('split')
    setTopType(''); setTopDetail(''); setTopTags([]); setTopColor('')
    setBottomType(''); setBottomDetail(''); setBottomTags([]); setBottomColor('')
    setFullType(''); setFullDetail(''); setFullTags([]); setFullColor('')
    setOutfitName('')
  }

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

  // Helper: render cascading tag selector
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
    const bgActive = accentColor === 'sky' ? 'bg-sky-500' : 'bg-rose-500'
    const bgInactive = accentColor === 'sky' ? 'bg-sky-50 text-sky-700 hover:bg-sky-100' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'

    return (
      <div className="space-y-3">
        {/* Row 1: Type */}
        <div>
          <p className="text-xs font-semibold mb-1.5">Type</p>
          <div className="flex flex-wrap gap-2">
            {types.map((type) => (
              <button
                key={type}
                onClick={() => { setSelectedType(type); setSelectedDetail(''); /* clear tags */ }}
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

  // Helper: render color picker
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
                ['white', 'cream', 'yellow', 'beige', 'lavender', 'silver'].includes(key) ? 'text-gray-700' : 'text-white'
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button onClick={() => step === 'capture' ? setView('home') : resetAll()} className="text-rose-500 hover:text-rose-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-rose-900">Save an Outfit</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {step === 'capture' ? 'Take or upload a photo' : step === 'cut' ? 'Drag the cut line' : 'Add details & save'}
          </p>
        </div>
        <div className="flex gap-1.5">
          <div className={`w-6 h-1.5 rounded-full ${step === 'capture' ? 'bg-rose-500' : 'bg-rose-200'}`} />
          <div className={`w-6 h-1.5 rounded-full ${step === 'cut' ? 'bg-rose-500' : 'bg-rose-200'}`} />
          <div className={`w-6 h-1.5 rounded-full ${step === 'save' ? 'bg-rose-500' : 'bg-rose-200'}`} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
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
                Take a full-body photo or upload from gallery. You can split it into top &amp; bottom later.
              </p>

              {/* Separate inputs for camera vs gallery */}
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

          {step === 'cut' && imageSrc && (
            <motion.div
              key="cut"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="px-4 py-4"
            >
              {/* Mode switcher */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <button
                  onClick={() => setMode('split')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    mode === 'split' ? 'bg-rose-500 text-white shadow-sm' : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  <Scissors className="inline w-4 h-4 mr-1" />
                  Split Top &amp; Bottom
                </button>
                <button
                  onClick={() => setMode('full')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    mode === 'full' ? 'bg-rose-500 text-white shadow-sm' : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  <Shirt className="inline w-4 h-4 mr-1" />
                  Save as Full Suit
                </button>
              </div>

              {/* Image with cut line */}
              <div
                ref={imageContainerRef}
                className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden border-2 border-rose-200 bg-rose-50 select-none touch-none"
                onMouseMove={(e) => handleDragMove(e.clientY)}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchMove={(e) => handleDragMove(e.touches[0].clientY)}
                onTouchEnd={handleDragEnd}
              >
                <img src={imageSrc} alt="Your outfit" className="w-full h-full object-cover" draggable={false} />
                {mode === 'split' && (
                  <>
                    <div className="absolute top-0 left-0 right-0 bg-rose-500/10 pointer-events-none transition-all" style={{ height: `${cutPosition}%` }} />
                    <div className="absolute bottom-0 left-0 right-0 bg-sky-500/10 pointer-events-none transition-all" style={{ height: `${100 - cutPosition}%` }} />
                    <div className="absolute top-3 left-3 px-2 py-1 bg-rose-500 text-white text-[10px] font-bold rounded-lg">👕 TOP</div>
                    <div className="absolute bottom-3 left-3 px-2 py-1 bg-sky-500 text-white text-[10px] font-bold rounded-lg">👖 BOTTOM</div>
                    <div
                      className="absolute left-0 right-0 flex items-center justify-center cursor-row-resize z-10"
                      style={{ top: `${cutPosition}%`, transform: 'translateY(-50%)' }}
                      onMouseDown={handleDragStart}
                      onTouchStart={handleDragStart}
                    >
                      <div className="w-full h-1 bg-rose-500 shadow-lg" />
                      <div className="absolute w-10 h-10 rounded-full bg-rose-500 border-4 border-white shadow-lg flex items-center justify-center">
                        <Scissors className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </>
                )}
              </div>
              {mode === 'split' && (
                <p className="text-xs text-center text-muted-foreground mt-3">↔ Drag the scissors line up or down to set the split point</p>
              )}
            </motion.div>
          )}

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
        {step === 'cut' && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={resetAll}
              className="flex-1 h-12 rounded-xl border-rose-200 text-rose-700"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Retake
            </Button>
            <Button
              onClick={mode === 'full' ? () => setStep('save') : handleCutConfirm}
              className="flex-[2] h-12 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold"
            >
              <Check className="w-4 h-4 mr-1" />
              {mode === 'full' ? 'Continue' : 'Confirm Cut'}
            </Button>
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
