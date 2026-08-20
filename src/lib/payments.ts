import supabase from './supabase'

export type PaymentProduct =
  | {
      type: 'lut'
      lutId: string
      title: string
      amount: number
      currency: string
    }
  | {
      type: 'subscription'
      plan: 'Pro' | 'Studio'
      billingCycle: 'monthly' | 'annual'
    }

export type PaymentResult = {
  reference: string
  status: 'success'
  demo: boolean
  authorizationUrl?: string
}

const paymentMode = import.meta.env.VITE_PAYMENT_MODE || 'demo'

export const isPaymentDemo = paymentMode !== 'live'

export async function startPayment(product: PaymentProduct): Promise<PaymentResult> {
  if (!isPaymentDemo) {
    const { data, error } = await supabase.functions.invoke('paystack-checkout', {
      body: { product },
    })
    if (error || !data?.authorizationUrl) {
      throw new Error(error?.message || data?.error || 'Unable to start Paystack checkout.')
    }
    return {
      reference: data.reference,
      status: 'success',
      demo: false,
      authorizationUrl: data.authorizationUrl,
    }
  }

  const suffix = Math.random().toString(36).slice(2, 10).toUpperCase()
  const reference = `DEMO-${product.type.toUpperCase()}-${suffix}`

  return {
    reference,
    status: 'success',
    demo: true,
  }
}

export async function recordDemoPurchase(
  lutId: string,
  title: string,
  amount: number,
  currency: string,
  reference: string,
) {
  const { error } = await supabase.rpc('record_demo_purchase', {
    p_lut_id: lutId,
    p_title: title,
    p_amount: amount,
    p_currency: currency,
    p_reference: reference,
  })

  if (error) throw error
}

export async function recordDemoSubscription(
  plan: 'Pro' | 'Studio',
  billingCycle: 'monthly' | 'annual',
  reference: string,
) {
  const { error } = await supabase.rpc('record_demo_subscription', {
    p_plan: plan,
    p_billing_cycle: billingCycle,
    p_reference: reference,
  })

  if (error) throw error
}

export async function recordDemoDownload(lutId: string, title: string) {
  const { error } = await supabase.rpc('record_demo_download', {
    p_lut_id: lutId,
    p_title: title,
  })

  if (error) throw error
}
