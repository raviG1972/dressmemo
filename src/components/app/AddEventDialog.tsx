'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Briefcase,
  Coffee,
  PartyPopper,
  Building2,
  Heart,
  Trees,
  Church,
  MapPin,
  Plus,
  X,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useStore, getDateKey } from '@/lib/store'
import { toast } from 'sonner'

const EVENT_TYPES = [
  { value: 'formal', label: 'Formal', icon: Briefcase },
  { value: 'casual', label: 'Casual', icon: Coffee },
  { value: 'party', label: 'Party', icon: PartyPopper },
  { value: 'business', label: 'Business', icon: Building2 },
  { value: 'wedding', label: 'Wedding', icon: Heart },
  { value: 'outdoor', label: 'Outdoor', icon: Trees },
  { value: 'religious', label: 'Religious', icon: Church },
  { value: 'date', label: 'Date Night', icon: Heart },
] as const

const FASHION_TAGS = [
  'formal', 'casual', 'white', 'black', 'colorful',
  'traditional', 'western', 'ethnic', 'designer',
  'office-wear', 'evening-wear', 'day-wear', 'summer', 'winter',
]

const CITIES = ['Colombo', 'Kandy', 'Galle', 'Jaffna', 'Negombo', 'Batticaloa']

interface AddEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AddEventDialog({ open, onOpenChange }: AddEventDialogProps) {
  const { selectedDate, addEvent } = useStore()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(getDateKey(selectedDate))
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')
  const [city, setCity] = useState('')
  const [eventType, setEventType] = useState('casual')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const resetForm = () => {
    setTitle('')
    setDate(getDateKey(selectedDate))
    setTime('')
    setLocation('')
    setCity('')
    setEventType('casual')
    setSelectedTags([])
    setNotes('')
    setIsSubmitting(false)
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Please enter an event title')
      return
    }
    setIsSubmitting(true)
    try {
      const success = await addEvent({
        title: title.trim(),
        date,
        time: time || null,
        location: location ? `${location}${city ? `, ${city}` : ''}` : null,
        eventType,
        tags: selectedTags,
        notes: notes || null,
      })
      if (success) {
        toast.success('Event added! 🎉')
        resetForm()
        onOpenChange(false)
      } else {
        toast.error('Failed to add event')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-rose-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-500" />
            Plan an Event
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 px-1 pb-6">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-rose-900">Event Title *</label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Sarah's Wedding"
              className="border-emerald-200 focus:border-emerald-400"
            />
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-rose-900">Date</label>
              <Input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="border-emerald-200 focus:border-emerald-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-rose-900">Time</label>
              <Input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="border-emerald-200 focus:border-emerald-400"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-rose-900 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Location
            </label>
            <div className="grid grid-cols-5 gap-2">
              <Input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Venue name"
                className="col-span-3 border-emerald-200 focus:border-emerald-400"
              />
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="col-span-2 border-emerald-200">
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Event Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-rose-900">Event Type</label>
            <div className="grid grid-cols-4 gap-2">
              {EVENT_TYPES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setEventType(value)}
                  className={`
                    flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all
                    ${eventType === value
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                      : 'border-gray-100 bg-white text-muted-foreground hover:border-emerald-200'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium leading-tight text-center">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-rose-900">Fashion Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {FASHION_TAGS.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                  className={`
                    cursor-pointer select-none transition-all text-xs
                    ${selectedTags.includes(tag)
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500'
                      : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                    }
                  `}
                  onClick={() => toggleTag(tag)}
                >
                  {selectedTags.includes(tag) && <Check className="w-3 h-3 mr-0.5" />}
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-rose-900">Notes</label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any additional details..."
              className="border-emerald-200 focus:border-emerald-400 min-h-[80px]"
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim()}
            className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium"
          >
            {isSubmitting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <>
                <Plus className="w-4 h-4 mr-1" />
                Add Event
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
