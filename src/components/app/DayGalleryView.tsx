'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Plus, Clock, Tag, Trash2, Edit3, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore, getDateKey, type Outfit } from '@/lib/store'
import { toast } from 'sonner'

const reasonTags = [
  'Office', 'School', 'Work', 'Going Out', 'Party', 'Wedding',
  'Casual', 'Date', 'Interview', 'Gym', 'Travel', 'Religious',
  'Meeting', 'Beach', 'Concert', 'Other',
]

export default function DayGalleryView() {
  const { selectedDate, outfits, setView, fetchOutfitsByDate, deleteOutfit, addOutfit } = useStore()
  const dateKey = getDateKey(selectedDate)
  const dayOutfits = outfits[dateKey] || []

  const [editingOutfit, setEditingOutfit] = useState<string | null>(null)
  const [editCaption, setEditCaption] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editReasonTag, setEditReasonTag] = useState('')
  const [editReasonText, setEditReasonText] = useState('')
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchOutfitsByDate(dateKey)
  }, [dateKey, fetchOutfitsByDate])

  const isToday = (() => {
    const now = new Date()
    return format(now, 'yyyy-MM-dd') === dateKey
  })()

  const isFuture = selectedDate > new Date()

  const handleAddOutfit = () => {
    setView('save-outfit')
  }

  const handleDelete = async (outfitId: string) => {
    setIsDeleting(outfitId)
    await deleteOutfit(outfitId, dateKey)
    setIsDeleting(null)
    toast.success('Outfit removed')
  }

  const startEdit = (outfit: Outfit) => {
    setEditingOutfit(outfit.id)
    setEditCaption(outfit.caption || '')
    setEditTime(outfit.time || '')
    setEditReasonTag(outfit.reasonTag || '')
    setEditReasonText(outfit.reasonText || '')
  }

  const saveEdit = async (outfitId: string) => {
    try {
      const res = await fetch(`/api/outfits/${outfitId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption: editCaption,
          time: editTime,
          reasonTag: editReasonTag,
          reasonText: editReasonText,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        // Update local state
        const { outfits } = useStore.getState()
        const dayOutfits = outfits[dateKey] || []
        useStore.setState({
          outfits: {
            ...outfits,
            [dateKey]: dayOutfits.map((o) =>
              o.id === outfitId
                ? {
                    ...o,
                    caption: editCaption,
                    time: editTime,
                    reasonTag: editReasonTag,
                    reasonText: editReasonText,
                  }
                : o
            ),
          },
        })
        setEditingOutfit(null)
        toast.success('Outfit updated')
      }
    } catch {
      toast.error('Failed to update')
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3 bg-gradient-to-b from-rose-50/80 to-transparent">
        <button onClick={() => setView('home')} className="text-rose-500 hover:text-rose-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-rose-900">
            {format(selectedDate, 'EEEE, MMMM d')}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isFuture ? 'Plan your outfit' : isToday ? "Today's outfits" : 'What you wore'}
          </p>
        </div>
      </div>

      {/* Gallery */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto custom-scrollbar">
        {dayOutfits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-24 h-24 rounded-full bg-rose-50 flex items-center justify-center mb-4">
              <Plus className="w-10 h-10 text-rose-300" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {isFuture ? 'Plan an outfit for this day' : 'No outfits recorded for this day'}
            </p>
            <Button
              onClick={handleAddOutfit}
              className="rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Outfit
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {/* Add outfit card */}
            <button
              onClick={handleAddOutfit}
              className="aspect-[3/4] rounded-xl border-2 border-dashed border-rose-200 bg-rose-50/50 flex flex-col items-center justify-center gap-2 hover:border-rose-400 hover:bg-rose-50 transition-colors active:scale-95"
            >
              <Plus className="w-8 h-8 text-rose-300" />
              <span className="text-xs text-rose-400 font-medium">Add Outfit</span>
            </button>

            {/* Outfit cards */}
            {dayOutfits.map((outfit, idx) => (
              <motion.div
                key={outfit.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="relative aspect-[3/4] rounded-xl overflow-hidden border border-rose-100 bg-white shadow-sm group"
              >
                {/* Outfit photo */}
                {outfit.imageUrl && (
                  <img
                    src={outfit.imageUrl}
                    alt={`Outfit ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Overlay info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2 pt-8">
                  {/* Time */}
                  {outfit.time && (
                    <div className="flex items-center gap-1 mb-0.5">
                      <Clock className="w-3 h-3 text-white/80" />
                      <span className="text-[10px] text-white/90 font-medium">{outfit.time}</span>
                    </div>
                  )}

                  {/* Reason tag */}
                  {outfit.reasonTag && (
                    <div className="flex items-center gap-1 mb-0.5">
                      <Tag className="w-3 h-3 text-white/80" />
                      <span className="text-[10px] text-white/90 font-medium">{outfit.reasonTag}</span>
                    </div>
                  )}

                  {/* Caption */}
                  {outfit.caption && (
                    <p className="text-[10px] text-white/80 line-clamp-2">{outfit.caption}</p>
                  )}

                  {/* No info - show placeholder */}
                  {!outfit.time && !outfit.reasonTag && !outfit.caption && (
                    <p className="text-[10px] text-white/50 italic">Tap to add details</p>
                  )}
                </div>

                {/* Processed indicator */}
                {outfit.processed && (
                  <span className="absolute top-1.5 right-1.5 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                    ✓ In Wardrobe
                  </span>
                )}

                {/* Action buttons on hover/long-press */}
                <div className="absolute top-1.5 left-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(outfit)}
                    className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:bg-white"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-rose-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(outfit.id)}
                    disabled={isDeleting === outfit.id}
                    className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:bg-white"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>

                {/* Number badge */}
                <span className="absolute top-1.5 left-1.5 group-hover:hidden w-6 h-6 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                  {idx + 1}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Edit modal */}
      <AnimatePresence>
        {editingOutfit && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
            onClick={() => setEditingOutfit(null)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="w-full max-w-lg bg-white rounded-t-2xl p-4 pb-8 space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-rose-900">Edit Outfit</h3>
                <button onClick={() => setEditingOutfit(null)} className="p-1 text-rose-400 hover:text-rose-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Time */}
              <div>
                <p className="text-xs font-semibold text-rose-700 mb-1">Time</p>
                <input
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-rose-200 text-sm focus:border-rose-400 focus:outline-none"
                />
              </div>

              {/* Reason tag */}
              <div>
                <p className="text-xs font-semibold text-rose-700 mb-1">Reason / Occasion</p>
                <div className="flex flex-wrap gap-1.5">
                  {reasonTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setEditReasonTag(editReasonTag === tag ? '' : tag)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        editReasonTag === tag
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
                  value={editReasonText}
                  onChange={(e) => setEditReasonText(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-rose-200 text-sm focus:border-rose-400 focus:outline-none"
                />
              </div>

              {/* Caption */}
              <div>
                <p className="text-xs font-semibold text-rose-700 mb-1">Caption</p>
                <input
                  type="text"
                  placeholder="e.g., Favorite blue dress"
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-rose-200 text-sm focus:border-rose-400 focus:outline-none"
                />
              </div>

              <Button
                onClick={() => saveEdit(editingOutfit)}
                className="w-full h-11 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold"
              >
                <Check className="w-4 h-4 mr-1" />
                Save
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
