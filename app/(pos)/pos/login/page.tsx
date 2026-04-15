"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Delete } from 'lucide-react'
import { db } from '@/lib/db'
import { toast } from 'sonner'
import bcrypt from 'bcryptjs'

export default function POSLoginPage() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if device is configured
    async function checkDevice() {
      const deviceToken = await db.configStore.get('device_token')
      if (!deviceToken) {
        // Just a warning; ideally the PWA is useless if not provisioned while online
        toast.warning('Warning: Device not registered with backend. Sales will queue but cannot sync.')
      }
    }
    checkDevice()
  }, [])

  async function handleSubmit() {
    if (pin.length !== 4) {
      setError('Please enter 4-digit PIN')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Offline-first Authentication Check
      // We scan local staffProfiles instead of pinging Supabase
      const profiles = await db.staffProfiles.toArray()

      if (profiles.length === 0) {
        setError('No staff profiles synced. Please connect to internet to initial sync.')
        setLoading(false)
        setPin('')
        return
      }

      let authenticatedUser = null

      for (const profile of profiles) {
        const isMatch = await bcrypt.compare(pin, profile.pin_code)
        if (isMatch) {
          authenticatedUser = profile
          break
        }
      }

      if (authenticatedUser) {
        // Create local POS session
        await db.configStore.put({ key: 'active_session_user_id', value: authenticatedUser.id })
        await db.configStore.put({ key: 'active_session_role', value: authenticatedUser.role })
        await db.configStore.put({ key: 'active_session_permissions', value: JSON.stringify(authenticatedUser.permissions || {}) })
        
        toast.success(`Welcome back, ${authenticatedUser.full_name}`)
        router.push('/pos')
      } else {
        setError('Invalid PIN')
        setPin('')
      }
    } catch (err: any) {
      console.error(err)
      setError('Login failed due to an error.')
      setPin('')
    } finally {
      setLoading(false)
    }
  }

  function handleNumberClick(num: string) {
    if (pin.length < 4) {
      setPin(pin + num)
    }
  }

  function handleDelete() {
    setPin(pin.slice(0, -1))
  }

  useEffect(() => {
    let timeout: NodeJS.Timeout
    
    function handleKeyDown(e: KeyboardEvent) {
      if (loading) return
      if (e.key >= '0' && e.key <= '9') {
        setActiveKey(e.key)
        handleNumberClick(e.key)
      } else if (e.key === 'Backspace') {
        setActiveKey('Backspace')
        handleDelete()
      }
      
      // Auto clear the active key so the UI flashes and returns to normal
      clearTimeout(timeout)
      timeout = setTimeout(() => setActiveKey(null), 150)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(timeout)
    }
  }, [pin, loading])
  useEffect(() => {
    if (pin.length === 4) {
      handleSubmit()
    }
  }, [pin])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-zinc-950">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-lg shadow-lg border dark:border-zinc-800 max-w-sm w-full mx-4">
        <div className="flex flex-col items-center justify-center mb-6">
          <Image 
            src="/orvex-horizontal.png" 
            alt="Orvex Logo" 
            width={200} 
            height={60} 
            className="mb-1 dark:invert opacity-90 object-contain"
            priority
          />
        </div>
        <p className="text-center text-muted-foreground mb-8">
          Enter your 4-digit PIN
        </p>

        {/* PIN Display */}
        <div className="flex justify-center gap-3 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-14 h-14 border-2 rounded-xl flex items-center justify-center text-3xl font-mono ${
                pin.length > i
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-muted-foreground/30 text-transparent'
              }`}
            >
              {pin.length > i ? '•' : ''}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 px-4 py-2 rounded-md mb-6 text-center text-sm font-medium">
            {error}
          </div>
        )}

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <Button
              key={num}
              onClick={() => handleNumberClick(num.toString())}
              variant="outline"
              className={`h-16 text-2xl font-semibold shadow-sm hover:bg-primary/5 active:scale-95 transition-all ${
                activeKey === num.toString() ? 'bg-primary/15 border-primary scale-95' : ''
              }`}
              disabled={loading}
            >
              {num}
            </Button>
          ))}

          <div /> {/* Empty space */}

          <Button
            onClick={() => handleNumberClick('0')}
            variant="outline"
            className={`h-16 text-2xl font-semibold shadow-sm hover:bg-primary/5 active:scale-95 transition-all ${
              activeKey === '0' ? 'bg-primary/15 border-primary scale-95' : ''
            }`}
            disabled={loading}
          >
            0
          </Button>

          <Button
            onClick={handleDelete}
            variant="outline"
            className={`h-16 shadow-sm active:scale-95 transition-all text-muted-foreground hover:text-foreground ${
              activeKey === 'Backspace' ? 'bg-primary/15 border-primary scale-95' : ''
            }`}
            disabled={loading || pin.length === 0}
          >
            <Delete className="w-5 h-5" />
          </Button>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          Need help? Contact your manager
        </div>
      </div>
    </div>
  )
}

