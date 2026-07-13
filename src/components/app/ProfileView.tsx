'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LogOut, MessageCircle, Shirt, CalendarDays, Settings, Ticket } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useStore } from '@/lib/store'
import { toast } from 'sonner'
import MyCouponsView from './MyCouponsView'

export default function ProfileView() {
  const { user, logout, clothingItems, outfits, coupons, fetchClothingItems, fetchCoupons } = useStore()
  const [agreeOffers, setAgreeOffers] = useState(user?.agreeOffers ?? true)
  const [couponsDialogOpen, setCouponsDialogOpen] = useState(false)

  // Count total outfits
  const totalOutfits = Object.values(outfits).reduce((sum, dayOutfits) => sum + dayOutfits.length, 0)

  useEffect(() => {
    fetchClothingItems()
  }, [fetchClothingItems])

  // Fetch coupons count
  useEffect(() => {
    fetchCoupons()
  }, [fetchCoupons])

  const activeCoupons = coupons.filter(c => c.status === 'active')

  const handleToggleOffers = async (checked: boolean) => {
    setAgreeOffers(checked)
    try {
      await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agreeOffers: checked }),
      })
      toast.success(checked ? 'WhatsApp offers enabled ✅' : 'WhatsApp offers disabled')
    } catch {
      toast.error('Failed to update preference')
      setAgreeOffers(!checked)
    }
  }

  const handleLogout = () => {
    logout()
    toast.success('Signed out')
  }

  const initials = user?.name
    ? user.name.charAt(0).toUpperCase()
    : user?.phone
    ? user.phone.charAt(0)
    : '?'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-rose-900">Profile</h1>
      </div>

      <div className="flex-1 px-4 pb-4 overflow-y-auto custom-scrollbar">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {/* Avatar & name */}
          <Card className="border-rose-100 overflow-hidden">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Avatar className="w-20 h-20 mb-3">
                <AvatarFallback className="bg-rose-100 text-rose-600 text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-lg font-bold text-rose-900">
                {user?.name || 'Fashion Lover'}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                🇱🇰 +94 {user?.phone}
              </p>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-rose-100">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <Shirt className="w-6 h-6 text-rose-400 mb-2" />
                <p className="text-2xl font-bold text-rose-900">{clothingItems.length}</p>
                <p className="text-xs text-muted-foreground">Items in wardrobe</p>
              </CardContent>
            </Card>
            <Card className="border-rose-100">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <CalendarDays className="w-6 h-6 text-rose-400 mb-2" />
                <p className="text-2xl font-bold text-rose-900">{totalOutfits}</p>
                <p className="text-xs text-muted-foreground">Outfits planned</p>
              </CardContent>
            </Card>
          </div>

          {/* My Coupons */}
          <Card className="border-amber-100 cursor-pointer hover:border-amber-300 transition-colors" onClick={() => setCouponsDialogOpen(true)}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <Ticket className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-900">My Coupons</p>
                <p className="text-xs text-muted-foreground">
                  {activeCoupons.length} active coupon{activeCoupons.length !== 1 ? 's' : ''}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="text-amber-500 hover:text-amber-600">
                View →
              </Button>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="border-rose-100">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-green-500" />
                  <Label htmlFor="offers" className="text-sm text-rose-900 cursor-pointer">
                    Receive WhatsApp offers
                  </Label>
                </div>
                <Switch
                  id="offers"
                  checked={agreeOffers}
                  onCheckedChange={handleToggleOffers}
                  className="data-[state=checked]:bg-rose-500"
                />
              </div>
              <Separator className="bg-rose-100" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Settings className="w-4 h-4" />
                <span>More settings coming soon...</span>
              </div>
            </CardContent>
          </Card>

          {/* Sign out */}
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full h-12 rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 font-medium"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </motion.div>
      </div>

      {/* Coupons Dialog */}
      <Dialog open={couponsDialogOpen} onOpenChange={setCouponsDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto p-0">
          <MyCouponsView />
        </DialogContent>
      </Dialog>
    </div>
  )
}
