'use client'

import { motion } from 'framer-motion'
import { Tag, QrCode, CalendarDays } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { type Coupon } from '@/lib/store'
import { format } from 'date-fns'

interface CouponCardProps {
  coupon: Coupon
}

export default function CouponCard({ coupon }: CouponCardProps) {
  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: 'Active', color: 'text-green-700', bg: 'bg-green-100' },
    used: { label: 'Used', color: 'text-gray-600', bg: 'bg-gray-100' },
    expired: { label: 'Expired', color: 'text-red-600', bg: 'bg-red-100' },
  }

  const config = statusConfig[coupon.status] || statusConfig.active
  const offer = coupon.storeOffer

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-amber-100 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex gap-3">
            {/* QR Code */}
            <div className="shrink-0 w-20 h-20 bg-white border-2 border-dashed border-amber-200 rounded-lg flex items-center justify-center">
              <img
                src={`/api/coupons/qr/${coupon.id}`}
                alt="QR Code"
                className="w-16 h-16"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-amber-900 truncate">{offer.storeName}</p>
                  <p className="text-xs text-muted-foreground truncate">{offer.title}</p>
                </div>
                <Badge className={`${config.bg} ${config.color} text-[10px] h-5 shrink-0`}>
                  {config.label}
                </Badge>
              </div>

              {/* Coupon code */}
              <div className="mt-1.5">
                <p className="text-lg font-mono font-bold text-amber-800 tracking-wider">
                  {coupon.code}
                </p>
              </div>

              {/* Discount + Valid date */}
              <div className="flex items-center gap-3 mt-1.5">
                {offer.discountPct > 0 && (
                  <span className="flex items-center gap-0.5 text-xs font-medium text-amber-600">
                    <Tag className="w-3 h-3" />
                    {offer.discountPct}% OFF
                  </span>
                )}
                {offer.validUntil && (
                  <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                    <CalendarDays className="w-3 h-3" />
                    Valid until {format(new Date(offer.validUntil), 'MMM d, yyyy')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
