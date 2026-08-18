import React, { useState, useRef, useCallback, useEffect } from 'react'

interface BeforeAfterSliderProps {
  beforeImage?: string | null
  afterImage?: string | null
  lutStyle?: string | null
  alt?: string
}

export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  lutStyle,
  alt = 'LUT Before and After Comparison',
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [containerWidth, setContainerWidth] = useState(800)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }
    updateWidth()

    const observer = new ResizeObserver(updateWidth)
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPosition(position)
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (isDragging) {
        handleMove(e.touches[0].clientX)
      }
    },
    [isDragging, handleMove]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        handleMove(e.clientX)
      }
    },
    [isDragging, handleMove]
  )

  const handleMouseDown = () => setIsDragging(true)
  const handleMouseUp = () => setIsDragging(false)

  // Use provided image or cinematic default placeholder image
  const defaultBefore = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80'
  const defaultAfter = afterImage || beforeImage || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80'

  const actualBefore = beforeImage || defaultBefore
  const actualAfter = defaultAfter

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video rounded-xl overflow-hidden select-none border border-neutral-800 bg-neutral-900 shadow-2xl cursor-ew-resize group"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      {/* AFTER / GRADED IMAGE (Base Layer) */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src={actualAfter}
          alt={`After - ${alt}`}
          className="w-full h-full object-cover"
          style={
            !afterImage && lutStyle
              ? { filter: 'contrast(125%) saturate(140%) brightness(95%)' }
              : undefined
          }
        />
        <span className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md text-white text-xs font-mono px-2.5 py-1 rounded border border-white/10 uppercase tracking-widest z-10 pointer-events-none">
          AFTER (LUT APPLIED)
        </span>
      </div>

      {/* BEFORE / ORIGINAL IMAGE (Clipped Overlay Layer) */}
      <div
        className="absolute inset-0 h-full overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={actualBefore}
          alt={`Before - ${alt}`}
          className="h-full object-cover"
          style={{
            width: `${containerWidth}px`,
            maxWidth: 'none',
            filter: 'contrast(90%) saturate(75%)',
          }}
        />
        <span className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md text-white text-xs font-mono px-2.5 py-1 rounded border border-white/10 uppercase tracking-widest z-10 pointer-events-none">
          BEFORE (ORIGINAL)
        </span>
      </div>

      {/* SLIDER LINE & HANDLE */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] z-20 pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      >
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white/90 text-black shadow-lg flex items-center justify-center font-bold text-xs pointer-events-auto cursor-grab active:cursor-grabbing border-2 border-black/20 hover:scale-110 transition-transform"
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
        >
          ↔
        </div>
      </div>
    </div>
  )
}
