import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import supabase from '../lib/supabase'

interface PricingModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const { user, profile, refreshProfile } = useAuth()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual')
  const [upgrading, setUpgrading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSelectPlan = async (planName: string) => {
    if (!user) {
      alert('Please sign in first to subscribe or upgrade your plan.')
      return
    }

    setUpgrading(true)
    setSuccessMsg(null)

    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          email: user.email,
          plan: planName,
          status: 'active',
          billing_cycle: billingCycle,
          downloads_used: profile?.downloads_used ?? 0,
          downloads_limit: planName === 'Free' ? 10 : 99999,
        })

      if (error) {
        console.error('Failed to update plan profile:', error)
      } else {
        await refreshProfile()
        setSuccessMsg(`Successfully subscribed to ${planName} Plan!`)
        setTimeout(() => {
          setSuccessMsg(null)
          onClose()
        }, 1500)
      }
    } catch (err) {
      console.error('Plan upgrade error:', err)
    } finally {
      setUpgrading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-800 transition-colors"
        >
          ×
        </button>

        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="text-xs font-mono uppercase tracking-widest text-amber-500">
            Unlimited Cinematic Looks
          </span>
          <h2 className="text-3xl font-serif text-white">Choose Your Creator Pass</h2>
          <p className="text-xs text-neutral-400">
            Unlock instant access to hundreds of 3D LUT presets for Premiere Pro, DaVinci Resolve, Final Cut Pro, and Lightroom.
          </p>
        </div>

        {/* BILLING TOGGLE */}
        <div className="flex items-center justify-center gap-3">
          <span className={`text-xs ${billingCycle === 'monthly' ? 'text-white font-medium' : 'text-neutral-500'}`}>
            Monthly Billing
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
            className="w-12 h-6 rounded-full bg-neutral-800 p-1 border border-neutral-700 relative transition-colors"
          >
            <div
              className={`w-4 h-4 rounded-full bg-amber-500 transition-transform ${
                billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-xs ${billingCycle === 'annual' ? 'text-white font-medium' : 'text-neutral-500'}`}>
            Annual Billing <span className="text-emerald-400 font-mono text-[10px] ml-1">(Save 30%)</span>
          </span>
        </div>

        {successMsg && (
          <div className="bg-emerald-950 border border-emerald-800 text-emerald-300 p-3 rounded-xl text-center text-xs font-medium">
            {successMsg}
          </div>
        )}

        {/* PRICING CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* FREE TIER */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 flex flex-col justify-between space-y-6 hover:border-neutral-700 transition-all">
            <div className="space-y-4">
              <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Free Tier</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">$0</span>
                <span className="text-xs text-neutral-500">/ forever</span>
              </div>
              <p className="text-xs text-neutral-400">Perfect for exploring sample cinematic looks.</p>
              <ul className="text-xs text-neutral-300 space-y-2 pt-2">
                <li className="flex items-center gap-2">✓ Free Sample LUT Packs</li>
                <li className="flex items-center gap-2">✓ Personal Project License</li>
                <li className="flex items-center gap-2 text-neutral-600">✕ Unlimited Downloads</li>
              </ul>
            </div>
            <button
              onClick={() => handleSelectPlan('Free')}
              disabled={upgrading || profile?.plan === 'Free'}
              className="w-full border border-neutral-700 hover:border-neutral-500 text-white text-xs font-medium py-2.5 rounded-xl disabled:opacity-40 transition-colors"
            >
              {profile?.plan === 'Free' ? 'Current Plan' : 'Select Free Plan'}
            </button>
          </div>

          {/* CREATOR PRO TIER */}
          <div className="bg-neutral-950 border-2 border-amber-500/80 rounded-xl p-6 flex flex-col justify-between space-y-6 relative shadow-xl shadow-amber-500/10">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black font-semibold text-[10px] uppercase tracking-widest px-3 py-0.5 rounded-full">
              Most Popular
            </span>
            <div className="space-y-4">
              <span className="text-xs font-mono text-amber-400 uppercase tracking-widest">Creator Pro</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">
                  {billingCycle === 'annual' ? '$12' : '$18'}
                </span>
                <span className="text-xs text-neutral-500">/ month</span>
              </div>
              <p className="text-xs text-neutral-400">Full access for video editors & filmmakers.</p>
              <ul className="text-xs text-neutral-200 space-y-2 pt-2">
                <li className="flex items-center gap-2">✓ Unlimited Full Library Downloads</li>
                <li className="flex items-center gap-2">✓ Commercial YouTube & Client License</li>
                <li className="flex items-center gap-2">✓ Premiere Pro & DaVinci Resolve Support</li>
                <li className="flex items-center gap-2">✓ New Monthly Color Presets</li>
              </ul>
            </div>
            <button
              onClick={() => handleSelectPlan('Pro')}
              disabled={upgrading || profile?.plan === 'Pro'}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs py-2.5 rounded-xl disabled:opacity-40 transition-colors shadow-md shadow-amber-500/20"
            >
              {profile?.plan === 'Pro' ? 'Current Active Plan' : upgrading ? 'Processing...' : 'Upgrade to Creator Pro'}
            </button>
          </div>

          {/* STUDIO TEAM TIER */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 flex flex-col justify-between space-y-6 hover:border-neutral-700 transition-all">
            <div className="space-y-4">
              <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Studio Team</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">
                  {billingCycle === 'annual' ? '$35' : '$49'}
                </span>
                <span className="text-xs text-neutral-500">/ month</span>
              </div>
              <p className="text-xs text-neutral-400">Designed for production teams & agencies.</p>
              <ul className="text-xs text-neutral-300 space-y-2 pt-2">
                <li className="flex items-center gap-2">✓ Up to 5 Team Seat Licenses</li>
                <li className="flex items-center gap-2">✓ Broadcast & Feature Film License</li>
                <li className="flex items-center gap-2">✓ Custom Grading Support</li>
              </ul>
            </div>
            <button
              onClick={() => handleSelectPlan('Studio')}
              disabled={upgrading || profile?.plan === 'Studio'}
              className="w-full border border-neutral-700 hover:border-neutral-500 text-white text-xs font-medium py-2.5 rounded-xl disabled:opacity-40 transition-colors"
            >
              {profile?.plan === 'Studio' ? 'Current Active Plan' : 'Select Studio Plan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
