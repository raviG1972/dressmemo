'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Camera, ImagePlus, Check, Clock, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore, getDateKey } from '@/lib/store'
import { optimizeImage } from '@/lib/image-utils'
import { toast } from 'sonner'

const reasonTags = [
  'Office', 'School', 'Work', 'Going Out', 'Party', 'Wedding',
  'Casual', 'Date', 'Interview', 'Gym', 'Travel', 'Other',
]

type Step = 'capture' | 'details'

export default function SaveOutfitView() {
  const { selectedDate, setView, addOutfit } = useStore()
  const dateKey = getDateKey(selectedDate)

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('capture')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [time, setTime] = useState('')
  const [reasonTag, setReasonTag] = useState('')
  const [reasonText, setReasonText] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const optimized = await optimizeImage(file)
      setImageFile(optimized)
      const reader = new FileReader()
      reader.onload = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(optimized)
      setStep('details')
    } catch {
      toast.error('Failed to process image')
    }
    e.target.value = ''
  }, [])

  const handleSave = async () => {
    if (!imageFile) {
      toast.error('Please add a photo')
      return
    }

    setIsSaving(true)
    try {
      const success = await addOutfit({
        imageFile,
        date: dateKey,
        caption: caption || undefined,
        time: time || undefined,
        reasonTag: reasonTag || undefined,
        reasonText: reasonText || undefined,
      })

      if (success) {
        toast.success('Outfit saved! ✨')
        setView('day-gallery')
      } else {
        toast.error('Failed to save outfit')
      }
    } catch {
      toast.error('Failed to save outfit')
    }
    setIsSaving(false)
  }

  const resetForm = () => {
    setImageFile(null)
    setImagePreview(null)
    setCaption('')
    setTime('')
    setReasonTag('')
    setReasonText('')
    setStep('capture')
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button
          onClick={() => {
            if (step === 'capture') setView('day-gallery')
            else resetForm()
          }}
          className="text-rose-500 hover:text-rose-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-rose-900">Add Outfit</h1>
          <p className="text-xs text-muted-foreground">For {dateKey}</p>
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
              <div className="w-24 h-24 rounded-full bg-rose-50 flex items-center justify-center mb-6">
                <Camera className="w-12 h-12 text-rose-300" />
              </div>
              <h2 className="text-lg font-semibold text-rose-900 mb-2">Snap Your Outfit</h2>
              <p className="text-sm text-muted-foreground text-center mb-8 max-w-xs">
                Take a photo or upload from gallery. You can crop &amp; add to wardrobe later.
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

          {step === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="px-4 py-4 space-y-4"
            >
              {/* Image preview */}
              <div className="relative w-full max-w-[200px] mx-auto aspect-[3/4] rounded-xl overflow-hidden border-2 border-rose-200">
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                )}
                <button
                  onClick={resetForm}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              {/* Time */}
              <div>
                <p className="text-xs font-semibold text-rose-700 mb-1">
                  <Clock className="inline w-3.5 h-3.5 mr-1" />
                  Time <span className="text-muted-foreground font-normal">(optional)</span>
                </p>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-rose-200 text-sm focus:border-rose-400 focus:outline-none"
                />
              </div>

              {/* Reason / Occasion */}
              <div>
                <p className="text-xs font-semibold text-rose-700 mb-1.5">
                  <Tag className="inline w-3.5 h-3.5 mr-1" />
                  Reason / Occasion <span className="text-muted-foreground font-normal">(optional)</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {reasonTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setReasonTag(reasonTag === tag ? '' : tag)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        reasonTag === tag
                          ? 'bg-rose-500 text-white shadow-sm'
                          : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom reason */}
              <div>
                <p className="text-xs font-semibold text-rose-700 mb-1">Custom reason</p>
                <input
                  type="text"
                  placeholder="e.g., Client presentation"
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-rose-200 text-sm focus:border-rose-400 focus:outline-none"
                />
              </div>

              {/* Caption */}
              <div>
                <p className="text-xs font-semibold text-rose-700 mb-1">Caption</p>
                <input
                  type="text"
                  placeholder="e.g., Favorite blue dress"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-rose-200 text-sm focus:border-rose-400 focus:outline-none"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom action */}
      {step === 'details' && (
        <div className="px-4 py-3 border-t border-rose-100 bg-white/80 backdrop-blur-sm">
          <Button
            onClick={handleSave}
            disabled={isSaving || !imageFile}
            className="w-full h-12 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold"
          >
            {isSaving ? 'Saving...' : (
              <>
                <Check className="w-4 h-4 mr-1" />
                Save Outfit
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
