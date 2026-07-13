'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Phone, Lock, Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useStore } from '@/lib/store'
import { toast } from 'sonner'

export default function LoginScreen() {
  const { login, setView, isLoading } = useStore()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim()) {
      toast.error('Please enter your phone number')
      return
    }
    if (!password) {
      toast.error('Please enter your password')
      return
    }
    const success = await login(phone, password)
    if (!success) {
      toast.error('Invalid phone or password')
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
        {/* Banner / Brand */}
        <div className="text-center mb-8">
          <div className="relative w-full h-40 rounded-2xl overflow-hidden mb-4 shadow-md">
            <Image
              src="/banner.png"
              alt="DressMemo - Weekly outfit planner"
              fill
              sizes="(max-width: 384px) 100vw, 384px"
              className="object-cover object-top"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-rose-900">DressMemo</h1>
          <p className="text-rose-400 mt-1 text-sm">Never forget a look</p>
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

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
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

          {/* Submit */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-base"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        {/* Switch to register */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            New here?{' '}
            <button
              onClick={() => setView('register')}
              className="text-rose-500 font-semibold hover:underline"
            >
              Create account
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
