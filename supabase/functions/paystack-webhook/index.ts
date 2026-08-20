import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const encoder = new TextEncoder()

async function hmacSha512(secret: string, payload: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const rawBody = await request.text()
  const secret = Deno.env.get('PAYSTACK_SECRET_KEY')
  const signature = request.headers.get('x-paystack-signature')
  if (!secret || !signature || signature !== await hmacSha512(secret, rawBody)) {
    return new Response('Invalid signature', { status: 401 })
  }

  try {
    const event = JSON.parse(rawBody)
    const data = event.data
    const metadata = data.metadata || {}
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const eventName = String(event.event || '')
    const paymentStatus = eventName === 'charge.success'
      ? 'paid'
      : eventName === 'charge.refunded' || eventName === 'refund.processed'
        ? 'refunded'
        : eventName === 'charge.failed'
          ? 'failed'
          : null

    if (metadata.product_type === 'lut' && metadata.lut_id && metadata.user_id && paymentStatus) {
      await supabase.from('user_purchases').update({
        status: paymentStatus,
        payment_method: 'paystack',
        amount: Number(data.amount) / 100,
        currency: data.currency,
      }).eq('payment_reference', data.reference).eq('user_id', metadata.user_id)
    }

    const subscriptionEvents = new Set(['subscription.create', 'subscription.enable', 'invoice.create', 'invoice.update'])
    const failedSubscriptionEvents = new Set(['subscription.disable', 'subscription.not_renew', 'invoice.payment_failed'])
    const userId = metadata.user_id as string | undefined
    const planName = metadata.plan as string | undefined

    if (subscriptionEvents.has(eventName) && userId && planName) {
      const { data: plan } = await supabase.from('subscription_plans').select('download_limit').ilike('name', planName).single()
      await supabase.from('user_profiles').update({
        plan: String(planName).toLowerCase(),
        billing_cycle: metadata.billing_cycle || 'monthly',
        status: 'active',
        downloads_limit: plan?.download_limit || 0,
        subscription_reference: data.reference,
        payment_provider: 'paystack',
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId)
    }

    if (failedSubscriptionEvents.has(eventName) && userId) {
      await supabase.from('user_profiles').update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId)
    }

    return new Response('ok', { headers: corsHeaders })
  } catch {
    return new Response('Webhook processing failed', { status: 500 })
  }
})
