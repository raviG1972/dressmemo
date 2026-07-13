'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Camera, Upload, Scissors, Check, RotateCcw, Shirt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useStore, type ClothingCategory, getDateKey } from '@/lib/store'
import { toast } from 'sonner'
import { format } from 'date-fns'

type SaveStep = 'capture' | 'cut' | 'save'

export default function SaveOutfitView() {
  const { setView, addClothingItem } = useStore()
  const [step, setStep] = useState<SaveStep>('capture')
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [topImageSrc, setTopImageSrc] = useState<string | null>(null)
  const [bottomImageSrc, setBottomImageSrc] = useState<string | null>(null)
  const [cutPosition, setCutPosition] = useState(50) // percentage from top
  const [isDragging, setIsDragging] = useState(false)
  const [mode, setMode] = useState<'split' | 'full'>('split')
  const [isSaving, setIsSaving] = useState(false)

  // Form fields
  const [topColor, setTopColor] = useState('')
  const [bottomColor, setBottomColor] = useState('')
  const [topTags, setTopTags] = useState('')
  const [bottomTags, setBottomTags] = useState('')
  const [outfitName, setOutfitName] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
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
  }, [])

  const handleCutConfirm = useCallback(() => {
    if (!imageSrc) return

    const img = new Image()
    img.onload = () => {
      const cutY = Math.round((cutPosition / 100) * img.height)

      // Create top portion
      const topCanvas = document.createElement('canvas')
      topCanvas.width = img.width
      topCanvas.height = cutY
      const topCtx = topCanvas.getContext('2d')!
      topCtx.drawImage(img, 0, 0, img.width, cutY, 0, 0, img.width, cutY)

      // Create bottom portion
      const bottomCanvas = document.createElement('canvas')
      bottomCanvas.width = img.width
      bottomCanvas.height = img.height - cutY
      const bottomCtx = bottomCanvas.getContext('2d')!
      bottomCtx.drawImage(img, 0, cutY, img.width, img.height - cutY, 0, 0, img.width, img.height - cutY)

      setTopImageSrc(topCanvas.toDataURL('image/png'))
      setBottomImageSrc(bottomCanvas.toDataURL('image/png'))
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
  }

  const handleSaveFull = async () => {
    if (!imageSrc) return
    setIsSaving(true)
    try {
      const res = await fetch(imageSrc)
      const blob = await res.blob()
      const file = new File([blob], 'outfit.png', { type: 'image/png' })

      const success = await addClothingItem({
        category: 'FULL_SUIT',
        subType: outfitName || 'Full Outfit',
        color: topColor || '#000000',
        size: '',
        tags: topTags ? topTags.split(',').map(t => t.trim()) : [],
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
      // Save top
      const topRes = await fetch(topImageSrc)
      const topBlob = await topRes.blob()
      const topFile = new File([topBlob], 'top.png', { type: 'image/png' })

      const topSuccess = await addClothingItem({
        category: 'TOP',
        subType: outfitName ? `${outfitName} Top` : 'Top',
        color: topColor || '#000000',
        size: '',
        tags: topTags ? topTags.split(',').map(t => t.trim()) : [],
        isFavorite: false,
        imageUrl: '',
      }, topFile)

      // Save bottom
      const bottomRes = await fetch(bottomImageSrc)
      const bottomBlob = await bottomRes.blob()
      const bottomFile = new File([bottomBlob], 'bottom.png', { type: 'image/png' })

      const bottomSuccess = await addClothingItem({
        category: 'BOTTOM',
        subType: outfitName ? `${outfitName} Bottom` : 'Bottom',
        color: bottomColor || '#000000',
        size: '',
        tags: bottomTags ? bottomTags.split(',').map(t => t.trim()) : [],
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
        {/* Step indicators */}
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
                Take a full-body photo or upload from gallery. You can split it into top & bottom later.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelect}
              />

              <div className="flex flex-col gap-3 w-full max-w-xs">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="h-12 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Take Photo
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-12 rounded-xl border-rose-200 text-rose-700 font-semibold"
                >
                  <Upload className="w-5 h-5 mr-2" />
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
                    mode === 'split'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  <Scissors className="inline w-4 h-4 mr-1" />
                  Split Top & Bottom
                </button>
                <button
                  onClick={() => setMode('full')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    mode === 'full'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-rose-50 text-rose-700'
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
                <img
                  src={imageSrc}
                  alt="Your outfit"
                  className="w-full h-full object-cover"
                  draggable={false}
                />

                {/* Cut line */}
                {mode === 'split' && (
                  <>
                    {/* Dimming overlays */}
                    <div
                      className="absolute top-0 left-0 right-0 bg-rose-500/10 pointer-events-none transition-all"
                      style={{ height: `${cutPosition}%` }}
                    />
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-sky-500/10 pointer-events-none transition-all"
                      style={{ height: `${100 - cutPosition}%` }}
                    />

                    {/* Labels */}
                    <div className="absolute top-3 left-3 px-2 py-1 bg-rose-500 text-white text-[10px] font-bold rounded-lg">
                      👕 TOP
                    </div>
                    <div className="absolute bottom-3 left-3 px-2 py-1 bg-sky-500 text-white text-[10px] font-bold rounded-lg">
                      👖 BOTTOM
                    </div>

                    {/* The draggable cut line */}
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
                <p className="text-xs text-center text-muted-foreground mt-3">
                  ↔ Drag the scissors line up or down to set the split point
                </p>
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
                      {topImageSrc && (
                        <img src={topImageSrc} alt="Top" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 rounded-xl overflow-hidden border border-sky-200 aspect-[3/4]">
                      {bottomImageSrc && (
                        <img src={bottomImageSrc} alt="Bottom" className="w-full h-full object-cover" />
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 rounded-xl overflow-hidden border border-rose-200 aspect-[3/4] max-w-[200px] mx-auto">
                    {imageSrc && (
                      <img src={imageSrc} alt="Full outfit" className="w-full h-full object-cover" />
                    )}
                  </div>
                )}
              </div>

              {/* Outfit name */}
              <div>
                <label className="text-xs font-medium text-rose-700 mb-1 block">Outfit Name</label>
                <Input
                  placeholder="e.g., Office Monday, Party Night"
                  value={outfitName}
                  onChange={(e) => setOutfitName(e.target.value)}
                  className="h-11 rounded-xl border-rose-200 focus:border-rose-400"
                />
              </div>

              {mode === 'split' ? (
                <div className="grid grid-cols-2 gap-3">
                  {/* Top details */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-rose-700">👕 Top</p>
                    <Input
                      placeholder="Color (e.g., blue)"
                      value={topColor}
                      onChange={(e) => setTopColor(e.target.value)}
                      className="h-10 rounded-xl border-rose-200 text-xs focus:border-rose-400"
                    />
                    <Input
                      placeholder="Tags (formal, silk...)"
                      value={topTags}
                      onChange={(e) => setTopTags(e.target.value)}
                      className="h-10 rounded-xl border-rose-200 text-xs focus:border-rose-400"
                    />
                  </div>
                  {/* Bottom details */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-sky-700">👖 Bottom</p>
                    <Input
                      placeholder="Color (e.g., black)"
                      value={bottomColor}
                      onChange={(e) => setBottomColor(e.target.value)}
                      className="h-10 rounded-xl border-sky-200 text-xs focus:border-sky-400"
                    />
                    <Input
                      placeholder="Tags (casual, denim...)"
                      value={bottomTags}
                      onChange={(e) => setBottomTags(e.target.value)}
                      className="h-10 rounded-xl border-sky-200 text-xs focus:border-sky-400"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder="Color (e.g., blue)"
                    value={topColor}
                    onChange={(e) => setTopColor(e.target.value)}
                    className="h-10 rounded-xl border-rose-200 text-xs focus:border-rose-400"
                  />
                  <Input
                    placeholder="Tags (formal, saree, silk...)"
                    value={topTags}
                    onChange={(e) => setTopTags(e.target.value)}
                    className="h-10 rounded-xl border-rose-200 text-xs focus:border-rose-400"
                  />
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
