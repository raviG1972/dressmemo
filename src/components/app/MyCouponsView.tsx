'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Ticket, Loader2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useStore } from '@/lib/store'
import CouponCard from './CouponCard'

export default function MyCouponsView() {
  const { coupons, fetchCoupons } = useStore()
  const [activeTab, setActiveTab] = useState('active')
  const [isLoading, setIsLoading] = useState(true)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true
      fetchCoupons().finally(() => setIsLoading(false))
    }
  }, [fetchCoupons])

  const activeCoupons = coupons.filter(c => c.status === 'active')
  const usedCoupons = coupons.filter(c => c.status === 'used')
  const expiredCoupons = coupons.filter(c => c.status === 'expired')

  const renderCouponList = (items: typeof coupons, emptyText: string) => {
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-3">
            <Ticket className="w-7 h-7 text-amber-300" />
          </div>
          <p className="text-muted-foreground text-sm">{emptyText}</p>
        </div>
      )
    }
    return (
      <div className="space-y-3">
        {items.map(coupon => (
          <CouponCard key={coupon.id} coupon={coupon} />
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-amber-500" />
          <h1 className="text-xl font-bold text-amber-900">My Coupons</h1>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {coupons.length} coupon{coupons.length !== 1 ? 's' : ''} total
        </p>
      </div>

      <div className="flex-1 px-4 pb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-amber-50 mb-3">
            <TabsTrigger value="active" className="flex-1 text-xs data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              Active ({activeCoupons.length})
            </TabsTrigger>
            <TabsTrigger value="used" className="flex-1 text-xs data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              Used ({usedCoupons.length})
            </TabsTrigger>
            <TabsTrigger value="expired" className="flex-1 text-xs data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              Expired ({expiredCoupons.length})
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              <TabsContent value="active" className="mt-0">
                {renderCouponList(activeCoupons, 'No active coupons')}
              </TabsContent>
              <TabsContent value="used" className="mt-0">
                {renderCouponList(usedCoupons, 'No used coupons')}
              </TabsContent>
              <TabsContent value="expired" className="mt-0">
                {renderCouponList(expiredCoupons, 'No expired coupons')}
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>
    </div>
  )
}
