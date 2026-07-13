'use client'

import { motion } from 'framer-motion'
import { Briefcase, Coffee, PartyPopper, Building2, Heart, Trees, Church, Shirt, Tag, Percent } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { useStore, type ClothingItem, type StoreOffer } from '@/lib/store'
import { toast } from 'sonner'

const EVENT_TYPE_ICONS: Record<string, typeof Briefcase> = {
  formal: Briefcase,
  casual: Coffee,
  party: PartyPopper,
  business: Building2,
  wedding: Heart,
  outdoor: Trees,
  religious: Church,
  date: Heart,
}

interface SuggestionsPanelProps {
  eventType: string
  tags: string[]
}

export default function SuggestionsPanel({ eventType, tags }: SuggestionsPanelProps) {
  const { suggestedItems, suggestedOffers, setView, claimCoupon } = useStore()
  const EventIcon = EVENT_TYPE_ICONS[eventType] || Coffee

  if (suggestedItems.length === 0 && suggestedOffers.length === 0) {
    return null
  }

  const handleClaim = async (offerId: string) => {
    const success = await claimCoupon(offerId)
    if (success) {
      toast.success('Coupon claimed! 🎫')
    } else {
      toast.error('Failed to claim coupon')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-1.5">
        <EventIcon className="w-4 h-4 text-emerald-500" />
        <h3 className="text-sm font-semibold text-emerald-900">
          Suggested for {eventType}
        </h3>
      </div>

      {/* From Your Wardrobe */}
      {suggestedItems.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">From Your Wardrobe</p>
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              {suggestedItems.map(item => (
                <WardrobeSuggestionCard key={item.id} item={item} />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}

      {/* From Stores */}
      {suggestedOffers.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">From Stores</p>
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              {suggestedOffers.map(offer => (
                <StoreSuggestionCard key={offer.id} offer={offer} onClaim={handleClaim} />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}
    </motion.div>
  )
}

function WardrobeSuggestionCard({ item }: { item: ClothingItem }) {
  const { setView } = useStore()
  return (
    <Card
      className="shrink-0 w-20 border-emerald-100 cursor-pointer hover:border-emerald-300 transition-colors"
      onClick={() => setView('outfit-builder')}
    >
      <CardContent className="p-1.5 flex flex-col items-center gap-1">
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-emerald-50">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.subType} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Shirt className="w-6 h-6 text-emerald-300" />
            </div>
          )}
        </div>
        <span className="text-[10px] font-medium text-emerald-800 truncate w-full text-center">
          {item.subType}
        </span>
        <span className="text-[9px] text-muted-foreground">{item.color}</span>
      </CardContent>
    </Card>
  )
}

function StoreSuggestionCard({ offer, onClaim }: { offer: StoreOffer; onClaim: (id: string) => void }) {
  return (
    <Card className="shrink-0 w-44 border-amber-100 overflow-hidden">
      <div className="relative">
        <div className="w-full h-20 bg-amber-50 flex items-center justify-center">
          {offer.imageUrl ? (
            <img src={offer.imageUrl} alt={offer.title} className="w-full h-full object-cover" />
          ) : (
            <Tag className="w-8 h-8 text-amber-300" />
          )}
        </div>
        {offer.discountPct > 0 && (
          <Badge className="absolute top-1 right-1 bg-amber-500 text-white text-[9px] h-5">
            -{offer.discountPct}%
          </Badge>
        )}
      </div>
      <CardContent className="p-2">
        <p className="text-[10px] text-muted-foreground truncate">{offer.storeName}</p>
        <p className="text-xs font-medium text-amber-900 truncate">{offer.title}</p>
        {offer.discountedPrice != null && offer.originalPrice != null && (
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[10px] text-muted-foreground line-through">
              Rs. {offer.originalPrice.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-amber-600">
              Rs. {offer.discountedPrice.toLocaleString()}
            </span>
          </div>
        )}
        <Button
          size="sm"
          onClick={(e) => { e.stopPropagation(); onClaim(offer.id) }}
          className="w-full mt-1.5 h-7 text-[10px] bg-amber-500 hover:bg-amber-600 text-white rounded-lg"
        >
          Get Coupon
        </Button>
      </CardContent>
    </Card>
  )
}
