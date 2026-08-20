import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import supabase from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { fetchSubscriptionPlans, type SubscriptionPlan } from '../lib/plans'

type PlanForm = {
  id: string
  name: string
  price_monthly: string
  price_yearly: string
  download_limit: string
}

const blankPlan: PlanForm = {
  id: '',
  name: '',
  price_monthly: '0',
  price_yearly: '0',
  download_limit: '0',
}

export default function AdminPlans() {
  const { profile } = useAuth()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [form, setForm] = useState<PlanForm>(blankPlan)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!profile?.is_admin) return

    let mounted = true
    async function loadPlans() {
      const rows = await fetchSubscriptionPlans()
      if (mounted) setPlans(rows)
    }

    void loadPlans()
    return () => {
      mounted = false
    }
  }, [profile?.is_admin])

  const loadPlans = async () => {
    const rows = await fetchSubscriptionPlans()
    setPlans(rows)
  }

  if (!profile?.is_admin) {
    return <p className="text-center py-20 text-[#8a8580]">Admin access required.</p>
  }

  const update = (field: keyof PlanForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const edit = (plan: SubscriptionPlan) => {
    setEditingId(plan.id)
    setForm({
      id: plan.id,
      name: plan.name,
      price_monthly: String(plan.price_monthly),
      price_yearly: String(plan.price_yearly),
      download_limit: String(plan.download_limit),
    })
  }

  const reset = () => {
    setEditingId(null)
    setForm(blankPlan)
    setMessage(null)
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setMessage(null)

    const payload = {
      id: form.id.trim(),
      name: form.name.trim(),
      price_monthly: Number(form.price_monthly),
      price_yearly: Number(form.price_yearly),
      download_limit: Number(form.download_limit),
    }

    if (!payload.id || !payload.name || [payload.price_monthly, payload.price_yearly, payload.download_limit].some((value) => !Number.isFinite(value) || value < 0)) {
      setMessage('Enter a plan name, ID, and non-negative numeric values.')
      setSaving(false)
      return
    }

    const result = editingId
      ? await supabase.from('subscription_plans').update(payload).eq('id', editingId)
      : await supabase.from('subscription_plans').insert(payload)

    if (result.error) setMessage(result.error.message)
    else {
      setMessage(editingId ? 'Plan updated.' : 'Plan created.')
      reset()
      await loadPlans()
    }
    setSaving(false)
  }

  const remove = async (id: string) => {
    if (!window.confirm('Delete this subscription plan?')) return
    const { error } = await supabase.from('subscription_plans').delete().eq('id', id)
    setMessage(error?.message ?? 'Plan deleted.')
    if (!error) await loadPlans()
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-8">
      <div>
        <span className="marketplace-kicker">BOLD UNITY / ADMIN</span>
        <h1 className="text-4xl font-serif theme-primary">Subscription plans</h1>
        <p className="text-sm text-[#8a8580] mt-2">Set what customers pay monthly or yearly. Annual prices are shown as the full yearly charge.</p>
      </div>

      <nav className="flex flex-wrap gap-2 border-b border-[#222] pb-3" aria-label="Admin sections">
        <Link to="/admin/luts" className="border border-[#333] px-4 py-2 text-xs uppercase tracking-widest theme-primary hover:border-[#c8102e]">
          LUT Library
        </Link>
        <Link to="/admin/plans" className="bg-[#c8102e] text-white px-4 py-2 text-xs uppercase tracking-widest">
          Subscription Plans
        </Link>
        <Link to="/admin/reviews" className="border border-[#333] px-4 py-2 text-xs uppercase tracking-widest theme-primary hover:border-[#c8102e]">
          Reviews
        </Link>
      </nav>

      <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#111] border border-[#222] p-6">
        {(['id', 'name', 'price_monthly', 'price_yearly', 'download_limit'] as const).map((field) => (
          <label key={field} className="space-y-1 text-xs text-[#8a8580] uppercase tracking-wider">
            {field === 'price_monthly' ? 'Monthly price (KES)' : field === 'price_yearly' ? 'Yearly price (KES)' : field.replace('_', ' ')}
            <input
              required
              type={field.includes('price') || field === 'download_limit' ? 'number' : 'text'}
              min={field.includes('price') || field === 'download_limit' ? 0 : undefined}
              value={form[field]}
              onChange={(event) => update(field, event.target.value)}
              disabled={field === 'id' && Boolean(editingId)}
              className="w-full bg-[#0a0a0a] border border-[#333] px-3 py-2 text-sm normal-case tracking-normal text-[#f5f2ed]"
            />
          </label>
        ))}
        <div className="md:col-span-2 flex justify-end gap-3">
          {editingId && <button type="button" onClick={reset} className="border border-[#333] px-4 py-2 text-xs uppercase tracking-widest text-[#8a8580]">Cancel</button>}
          <button disabled={saving} className="bg-[#c8102e] px-5 py-2 text-xs uppercase tracking-widest text-white disabled:opacity-50">{saving ? 'Saving...' : editingId ? 'Update plan' : 'Create plan'}</button>
        </div>
        {message && <p className="md:col-span-2 text-xs text-[#c8102e]">{message}</p>}
      </form>

      <div className="space-y-3">
        {plans.map((plan) => (
          <div key={plan.id} className="flex flex-wrap items-center justify-between gap-4 border border-[#222] bg-[#111] p-4">
            <div>
              <p className="font-serif text-lg theme-primary">{plan.name}</p>
              <p className="text-xs text-[#8a8580]">KES {Number(plan.price_monthly).toLocaleString()} / month · KES {Number(plan.price_yearly).toLocaleString()} / year · {plan.download_limit.toLocaleString()} downloads</p>
            </div>
            <div className="flex gap-2"><button onClick={() => edit(plan)} className="border border-[#333] px-3 py-2 text-xs theme-primary">Edit</button><button onClick={() => remove(plan.id)} className="border border-[#5b1825] px-3 py-2 text-xs text-[#c8102e]">Delete</button></div>
          </div>
        ))}
      </div>
    </div>
  )
}
