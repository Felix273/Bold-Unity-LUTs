import { describe, expect, it } from 'vitest'
import { isPaymentDemo, startPayment } from './payments'

describe('payment demo mode', () => {
  it('is enabled without live payment configuration', () => {
    expect(isPaymentDemo).toBe(true)
  })

  it('returns a recognizable demo reference', async () => {
    const result = await startPayment({
      type: 'lut',
      lutId: 'test-lut',
      title: 'Test LUT',
      amount: 1200,
      currency: 'KES',
    })
    expect(result.status).toBe('success')
    expect(result.demo).toBe(true)
    expect(result.reference).toMatch(/^DEMO-LUT-/)
  })
})
