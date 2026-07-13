'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Tag, MapPin, Loader2, QrCode, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useStore, type StoreOffer, type Coupon } from '@/lib/store'
import { toast } from 'sonner'

const CITIES = ['All Cities', 'Colombo', 'Kandy', 'Galle', 'Jaffna', 'Negombo', 'Batticaloa']
const CATEGORIES = ['All', 'Tops', 'Bottoms', 'Dresses', 'Shoes', 'Accessories']

export default function OffersView() {
  const { storeOffers, fetchStoreOffers, claimCoupon } = useStore()
  const [selectedCity, setSelectedCity] = useState('All Cities')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [claimedCoupon, setClaimedCoupon] = useState<Coupon | null>(null)
  const [showQrDialog, setShowQrDialog] = useState(false)

  // Fetch offers on mount and when filters change
  useEffect(() => {
    const city = selectedCity === 'All Cities' ? undefined : selectedCity
    const tags = selectedCategory === 'All' ? undefined : [selectedCategory.toLowerCase()]
    fetchStoreOffers(tags, city)
  }, [selectedCity, selectedCategory, fetchStoreOffers])

  // Filter offers by category client-side for the pill UI
  const filteredOffers = selectedCategory === 'All'
    ? storeOffers
    : storeOffers.filter(o =>
        o.category.toLowerCase() === selectedCategory.toLowerCase() ||
        o.tags.some(t => t.toLowerCase() === selectedCategory.toLowerCase())
      )

  const handleClaim = async (offerId: string) => {
    setClaimingId(offerId)
    const success = await claimCoupon(offerId)
    setClaimingId(null)
    if (success) {
      toast.success('Coupon claimed! 🎫')
      // Find the claimed coupon from the store
      const { coupons } = useStore.getState()
      const coupon = coupons.find(c => c.storeOfferId === offerId)
      if (coupon) {
        setClaimedCoupon(coupon)
        setShowQrDialog(true)
      }
    } else {
      toast.error('Failed to claim coupon. It may be sold out.')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-amber-500" />
          <h1 className="text-xl font-bold text-amber-900">Fashion Offers</h1>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Exclusive deals from top stores</p>
      </div>

      {/* Filters */}
      <div className="px-4 pb-3 space-y-2">
        {/* City selector */}
        <Select value={selectedCity} onValueChange={setSelectedCity}>
          <SelectTrigger className="w-full border-amber-200 h-9">
            <MapPin className="w-3.5 h-3.5 mr-1 text-amber-500" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CITIES.map(city => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`
                shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${selectedCategory === cat
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-100'
                }
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Offer Grid */}
      <div className="flex-1 px-4 pb-2 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {filteredOffers.length > 0 ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-2 md:grid-cols-3 gap-3"
            >
              {filteredOffers.map((offer, idx) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  onClaim={handleClaim}
                  isClaiming={claimingId === offer.id}
                  index={idx}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                <Tag className="w-8 h-8 text-amber-300" />
              </div>
              <p className="text-muted-foreground text-sm">No offers available right now</p>
              <p className="text-xs text-muted-foreground mt-1">Check back later for new deals</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-amber-900">Your Coupon 🎫</DialogTitle>
          </DialogHeader>
          {claimedCoupon && (
            <div className="flex flex-col items-center gap-4 py-4">
              {/* QR Code image */}
              <div className="w-48 h-48 bg-white border-2 border-dashed border-amber-200 rounded-xl flex items-center justify-center">
                <img
                  src={`/api/coupons/qr/${claimedCoupon.id}`}
                  alt="QR Code"
                  className="w-44 h-44"
                />
              </div>
              {/* Coupon code */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Coupon Code</p>
                <p className="text-2xl font-bold font-mono text-amber-900 tracking-wider">
                  {claimedCoupon.code}
                </p>
              </div>
              <div className="text-center w-full">
                <p className="text-sm font-medium text-amber-800">{claimedCoupon.storeOffer.storeName}</p>
                <p className="text-xs text-muted-foreground">{claimedCoupon.storeOffer.title}</p>
                {claimedCoupon.storeOffer.discountPct > 0 && (
                  <Badge className="mt-1 bg-amber-500 text-white">
                    {claimedCoupon.storeOffer.discountPct}% OFF
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Show this QR code at the store to redeem your discount
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function OfferCard({
  offer,
  onClaim,
  isClaiming,
  index,
}: {
  offer: StoreOffer
  onClaim: (id: string) => void
  isClaiming: boolean
  index: number
}) {
  const isSoldOut = offer.maxCoupons > 0 && offer.couponsClaimed >= offer.maxCoupons

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
    >
      <Card className="border-amber-100 overflow-hidden h-full flex flex-col">
        {/* Image */}
        <div className="relative w-full aspect-square bg-amber-50">
          {offer.imageUrl ? (
            <img src={offer.imageUrl} alt={offer.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Tag className="w-10 h-10 text-amber-200" />
            </div>
          )}
          {/* Discount badge */}
          {offer.discountPct > 0 && (
            <Badge className="absolute top-2 right-2 bg-amber-500 text-white text-xs h-6 px-2">
              -{offer.discountPct}%
            </Badge>
          )}
          {isSoldOut && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white font-bold text-sm bg-black/60 px-3 py-1 rounded-full">Sold Out</span>
            </div>
          )}
        </div>

        <CardContent className="p-3 flex-1 flex flex-col">
          {/* Store info */}
          <p className="text-[10px] text-muted-foreground truncate">{offer.storeName} · {offer.storeCity}</p>
          {/* Title */}
          <p className="text-xs font-medium text-amber-900 truncate mt-0.5">{offer.title}</p>
          {/* Price */}
          {offer.discountedPrice != null && offer.originalPrice != null && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] text-muted-foreground line-through">
                Rs. {offer.originalPrice.toLocaleString()}
              </span>
              <span className="text-sm font-bold text-amber-600">
                Rs. {offer.discountedPrice.toLocaleString()}
              </span>
            </div>
          )}
          {/* Claim button */}
          <Button
            size="sm"
            disabled={isClaiming || isSoldOut}
            onClick={() => onClaim(offer.id)}
            className="w-full mt-auto pt-2 h-8 text-[11px] bg-amber-500 hover:bg-amber-600 text-white rounded-lg disabled:opacity-50"
          >
            {isClaiming ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : isSoldOut ? (
              'Sold Out'
            ) : (
              <>
                <QrCode className="w-3 h-3 mr-1" />
                Get Coupon
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
