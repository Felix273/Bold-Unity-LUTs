import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY')
    const paystackBaseUrl = Deno.env.get('PAYSTACK_BASE_URL') || 'https://api.paystack.co'
    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173'

    if (!paystackSecret) return json({ error: 'Paystack is not configured.' }, 503)

    const authHeader = request.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Authentication required.' }, 401)

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return json({ error: 'Authentication required.' }, 401)

    const admin = createClient(supabaseUrl, serviceKey)
    const body = await request.json()
    const product = body.product as {
      type: 'lut' | 'subscription'
      lutId?: string
      plan?: 'Pro' | 'Studio'
      billingCycle?: 'monthly' | 'annual'
    }

    let amount = 0
    let metadata: Record<string, string> = { product_type: product.type }

    if (product.type === 'lut' && product.lutId) {
      const { data: lut, error } = await admin.from('luts').select('id, title, price').eq('id', product.lutId).single()
      if (error || !lut || Number(lut.price) <= 0) return json({ error: 'Premium LUT not found.' }, 400)
      amount = Number(lut.price)
      metadata = { ...metadata, lut_id: lut.id, title: lut.title }
    } else if (product.type === 'subscription' && product.plan) {
      const { data: plan, error } = await admin.from('subscription_plans').select('name, price_monthly, price_yearly').ilike('name', product.plan).single()
      if (error || !plan) return json({ error: 'Subscription plan not found.' }, 400)
      amount = Number(product.billingCycle === 'annual' ? plan.price_yearly : plan.price_monthly)
      metadata = { ...metadata, plan: product.plan, billing_cycle: product.billingCycle || 'monthly' }
    } else {
      return json({ error: 'Invalid payment product.' }, 400)
    }

    const reference = `BU-${crypto.randomUUID()}`
    const response = await fetch(`${paystackBaseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: Math.round(amount * 100),
        currency: Deno.env.get('PAYSTACK_CURRENCY') || 'KES',
        reference,
        callback_url: `${siteUrl}/payment/callback`,
        metadata: { ...metadata, user_id: user.id },
      }),
    })
    const result = await response.json()
    if (!response.ok || !result.status) return json({ error: result.message || 'Paystack checkout failed.' }, 502)

    if (product.type === 'lut' && product.lutId) {
      await admin.from('user_purchases').upsert({
        user_id: user.id,
        lut_id: product.lutId,
        title: metadata.title,
        amount,
        payment_method: 'paystack',
        payment_reference: reference,
        currency: Deno.env.get('PAYSTACK_CURRENCY') || 'KES',
        status: 'pending',
      }, { onConflict: 'user_id,lut_id' })
    }

    return json({ authorizationUrl: result.data.authorization_url, reference })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Checkout failed.' }, 500)
  }
})
