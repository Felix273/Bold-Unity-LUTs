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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-[#0a0a0a] border border-[#222] shadow-2xl overflow-hidden p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8a8580] hover:text-[#f5f2ed] text-2xl font-bold w-8 h-8 flex items-center justify-center hover:bg-[#181818] transition-colors"
        >
          ×
        </button>

        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="text-xs font-mono uppercase tracking-widest text-[#c8102e] font-bold">
            Unlimited Cinematic Looks
          </span>
          <h2 className="text-3xl font-serif font-bold text-[#f5f2ed]">Choose Your Creator Pass</h2>
          <p className="text-xs text-[#8a8580]">
            Unlock instant access to hundreds of 3D LUT presets for Premiere Pro, DaVinci Resolve, Final Cut Pro, and Lightroom.
          </p>
        </div>

        {/* BILLING TOGGLE */}
        <div className="flex items-center justify-center gap-3">
          <span className={`text-xs uppercase tracking-wider ${billingCycle === 'monthly' ? 'text-[#f5f2ed] font-bold' : 'text-[#8a8580]'}`}>
            Monthly Billing
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
            className="w-12 h-6 rounded-full bg-[#181818] p-1 border border-[#333] relative transition-colors"
          >
            <div
              className={`w-4 h-4 rounded-full bg-[#c8102e] transition-transform ${
                billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-xs uppercase tracking-wider ${billingCycle === 'annual' ? 'text-[#f5f2ed] font-bold' : 'text-[#8a8580]'}`}>
            Annual Billing <span className="text-[#c8102e] font-mono text-[10px] ml-1">(Save 30%)</span>
          </span>
        </div>

        {successMsg && (
          <div className="bg-[#182218] border border-emerald-800 text-emerald-400 p-3 text-center text-xs font-mono uppercase tracking-wider font-bold">
            {successMsg}
          </div>
        )}

        {/* PRICING CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* FREE TIER */}
          <div className="bg-[#111] border border-[#222] p-6 flex flex-col justify-between space-y-6 hover:border-[#444] transition-all">
            <div className="space-y-4">
              <span className="text-xs font-mono text-[#8a8580] uppercase tracking-widest">Free Tier</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-[#f5f2ed]">$0</span>
                <span className="text-xs text-[#8a8580]">/ forever</span>
              </div>
              <p className="text-xs text-[#8a8580]">Perfect for exploring sample cinematic looks.</p>
              <ul className="text-xs text-[#e8e4dd] space-y-2 pt-2">
                <li className="flex items-center gap-2">✓ Free Sample LUT Packs</li>
                <li className="flex items-center gap-2">✓ Personal Project License</li>
                <li className="flex items-center gap-2 text-[#555]">✕ Unlimited Downloads</li>
              </ul>
            </div>
            <button
              onClick={() => handleSelectPlan('Free')}
              disabled={upgrading || profile?.plan === 'Free'}
              className="w-full border border-[#333] hover:border-[#666] text-[#f5f2ed] text-xs font-bold uppercase tracking-widest py-3 disabled:opacity-40 transition-colors"
            >
              {profile?.plan === 'Free' ? 'Current Plan' : 'Select Free Plan'}
            </button>
          </div>

          {/* CREATOR PRO TIER */}
          <div className="bg-[#111] border-2 border-[#c8102e] p-6 flex flex-col justify-between space-y-6 relative shadow-2xl shadow-red-900/20">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#c8102e] text-white font-bold text-[9px] uppercase tracking-widest px-3 py-0.5">
              Most Popular
            </span>
            <div className="space-y-4">
              <span className="text-xs font-mono text-[#c8102e] uppercase tracking-widest font-bold">Creator Pro</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-[#f5f2ed]">
                  {billingCycle === 'annual' ? '$12' : '$18'}
                </span>
                <span className="text-xs text-[#8a8580]">/ month</span>
              </div>
              <p className="text-xs text-[#8a8580]">Full access for video editors & filmmakers.</p>
              <ul className="text-xs text-[#f5f2ed] space-y-2 pt-2">
                <li className="flex items-center gap-2">✓ Unlimited Full Library Downloads</li>
                <li className="flex items-center gap-2">✓ Commercial YouTube & Client License</li>
                <li className="flex items-center gap-2">✓ Premiere Pro & DaVinci Resolve Support</li>
                <li className="flex items-center gap-2">✓ New Monthly Color Presets</li>
              </ul>
            </div>
            <button
              onClick={() => handleSelectPlan('Pro')}
              disabled={upgrading || profile?.plan === 'Pro'}
              className="w-full bg-[#c8102e] hover:bg-[#a00b23] text-white font-bold uppercase tracking-widest text-xs py-3.5 disabled:opacity-40 transition-colors shadow-lg shadow-red-900/20"
            >
              {profile?.plan === 'Pro' ? 'Current Active Plan' : upgrading ? 'Processing...' : 'Upgrade to Creator Pro'}
            </button>
          </div>

          {/* STUDIO TEAM TIER */}
          <div className="bg-[#111] border border-[#222] p-6 flex flex-col justify-between space-y-6 hover:border-[#444] transition-all">
            <div className="space-y-4">
              <span className="text-xs font-mono text-[#8a8580] uppercase tracking-widest">Studio Team</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-[#f5f2ed]">
                  {billingCycle === 'annual' ? '$35' : '$49'}
                </span>
                <span className="text-xs text-[#8a8580]">/ month</span>
              </div>
              <p className="text-xs text-[#8a8580]">Designed for production teams & agencies.</p>
              <ul className="text-xs text-[#e8e4dd] space-y-2 pt-2">
                <li className="flex items-center gap-2">✓ Up to 5 Team Seat Licenses</li>
                <li className="flex items-center gap-2">✓ Broadcast & Feature Film License</li>
                <li className="flex items-center gap-2">✓ Custom Grading Support</li>
              </ul>
            </div>
            <button
              onClick={() => handleSelectPlan('Studio')}
              disabled={upgrading || profile?.plan === 'Studio'}
              className="w-full border border-[#333] hover:border-[#666] text-[#f5f2ed] text-xs font-bold uppercase tracking-widest py-3 disabled:opacity-40 transition-colors"
            >
              {profile?.plan === 'Studio' ? 'Current Active Plan' : 'Select Studio Plan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
