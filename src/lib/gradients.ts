// Simulated "cover art" gradients per LUT style, standing in for real preview
// footage/images. Keyed loosely off the `style` field on each LUT.
const GRADIENTS: Record<string, string> = {
  Warm: 'linear-gradient(135deg, #f59e0b, #dc2626)',
  Cool: 'linear-gradient(135deg, #0891b2, #1e3a8a)',
  Film: 'linear-gradient(135deg, #92400e, #d97706)',
  Urban: 'linear-gradient(135deg, #4c1d95, #db2777)',
  Monochrome: 'linear-gradient(135deg, #27272a, #71717a)',
  Natural: 'linear-gradient(135deg, #166534, #65a30d)',
  Vibrant: 'linear-gradient(135deg, #db2777, #7c3aed)',
  Vintage: 'linear-gradient(135deg, #a16207, #78350f)',
}

const FALLBACK = 'linear-gradient(135deg, #18181b, #3f3f46)'

export function gradientForStyle(style: string | null): string {
  if (!style) return FALLBACK
  return GRADIENTS[style] ?? FALLBACK
}
