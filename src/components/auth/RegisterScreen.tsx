'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Phone, Lock, Eye, EyeOff, User, MessageCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useStore } from '@/lib/store'
import { toast } from 'sonner'

export default function RegisterScreen() {
  const { register, setView, isLoading } = useStore()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [agreeOffers, setAgreeOffers] = useState(true)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim()) {
      toast.error('Please enter your phone number')
      return
    }
    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    const success = await register(phone, password, name, agreeOffers)
    if (!success) {
      toast.error('Registration failed. Phone may already be registered.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-rose-50 to-white p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-rose-100 mb-4">
            <Sparkles className="w-10 h-10 text-rose-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-rose-900">DressLog</h1>
          <p className="text-rose-400 mt-1 text-sm">Create your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Phone */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span className="text-xs font-medium">🇱🇰 +94</span>
            </div>
            <Input
              type="tel"
              placeholder="7X XXX XXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ''))}
              className="pl-20 h-12 rounded-xl bg-white border-rose-200 focus:border-rose-400 focus:ring-rose-400"
            />
          </div>

          {/* Name (optional) */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Your name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-10 h-12 rounded-xl bg-white border-rose-200 focus:border-rose-400 focus:ring-rose-400"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 h-12 rounded-xl bg-white border-rose-200 focus:border-rose-400 focus:ring-rose-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-rose-500"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* WhatsApp offers checkbox */}
          <div className="flex items-start gap-3 py-1">
            <Checkbox
              id="offers"
              checked={agreeOffers}
              onCheckedChange={(checked) => setAgreeOffers(checked === true)}
              className="mt-0.5 data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500"
            />
            <Label htmlFor="offers" className="text-sm text-muted-foreground leading-snug cursor-pointer">
              <MessageCircle className="inline w-3.5 h-3.5 mr-1 text-green-500" />
              I agree to receive fashion offers on WhatsApp
            </Label>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-base"
          >
            {isLoading ? 'Creating...' : 'Create Account'}
          </Button>
        </form>

        {/* Switch to login */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <button
              onClick={() => setView('login')}
              className="text-rose-500 font-semibold hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
