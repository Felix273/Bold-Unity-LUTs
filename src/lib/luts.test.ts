import { describe, expect, it } from 'vitest'

describe('catalog fixture behavior', () => {
  it('resolves known fixture IDs without querying UUID-backed Supabase rows', async () => {
    const { fetchLutById } = await import('./luts')
    await expect(fetchLutById('lut-1')).resolves.toMatchObject({ title: 'Teal & Orange Cinema' })
  })

  it('returns no fixture for an unknown LUT id', async () => {
    const { fetchLutById } = await import('./luts')
    await expect(fetchLutById('missing-lut')).resolves.toBeNull()
  })
})
