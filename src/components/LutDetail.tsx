import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { createEntitledLutDownloadUrl, createLutDownloadUrl, fetchLutById, fetchLuts, downloadFreeLut, type Lut } from '../lib/luts'
import { fetchFavoriteIds } from '../lib/favorites'
import { useAuth } from '../contexts/AuthContext'
import FavoriteButton from './FavoriteButton'
import BeforeAfterSlider from './BeforeAfterSlider'
import ReviewPanel from './ReviewPanel'
import { averageReviewRating, fetchApprovedReviews, type Review } from '../lib/reviews'
import {
  isPaymentDemo,
  recordDemoDownload,
  recordDemoPurchase,
  startPayment,
} from '../lib/payments'

type LutDetailProps = {
  onOpenAuth: () => void
}

export default function LutDetail({ onOpenAuth }: LutDetailProps) {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [lut, setLut] = useState<Lut | null>(null)
  const [relatedLuts, setRelatedLuts] = useState<Lut[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFavorited, setIsFavorited] = useState(false)
  const [activeTab, setActiveTab] = useState<'specs' | 'guide'>('specs')

  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [paymentReference, setPaymentReference] = useState<string | null>(null)
  const [downloaded, setDownloaded] = useState(false)
  const [approvedReviews, setApprovedReviews] = useState<Review[]>([])

  useEffect(() => {
    if (!id) return
    let mounted = true

    async function loadDetail() {
      setLoading(true)
      try {
        const data = await fetchLutById(id!)
        if (!mounted) return
        setLut(data)

        if (data?.category_id) {
          const res = await fetchLuts({ categoryId: data.category_id, pageSize: 4 })
          if (mounted) setRelatedLuts(res.filter((item) => item.id !== id))
        } else {
          const res = await fetchLuts({ pageSize: 4 })
          if (mounted) setRelatedLuts(res.filter((item) => item.id !== id))
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load LUT details')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadDetail()

    return () => {
      mounted = false
    }
  }, [id])

  useEffect(() => {
    let mounted = true

    async function checkFavorite() {
      if (!user || !id) {
        if (mounted) setIsFavorited(false)
        return
      }

      try {
        const ids = await fetchFavoriteIds(user.id)
        if (mounted) setIsFavorited(ids.has(id))
      } catch {
        if (mounted) setIsFavorited(false)
      }
    }

    checkFavorite()

    return () => {
      mounted = false
    }
  }, [user, id])

  useEffect(() => {
    if (!id) return
    let mounted = true

    fetchApprovedReviews(id)
      .then((items) => {
        if (mounted) setApprovedReviews(items)
      })
      .catch(() => {
        if (mounted) setApprovedReviews([])
      })

    return () => {
      mounted = false
    }
  }, [id])

  const handleDownload = async () => {
    if (!lut) return
    setDownloadError(null)
    setPaymentReference(null)

    if (!user) {
      setDownloadError('Sign in to Download')
      return
    }

    setDownloading(true)
    try {
      if (!lut.file_url) {
        throw new Error('This LUT does not have a downloadable asset yet.')
      }

      if (lut.price > 0) {
        const result = await startPayment({
          type: 'lut',
          lutId: lut.id,
          title: lut.title,
          amount: lut.price,
          currency: 'KES',
        })

        if (!isPaymentDemo && result.authorizationUrl) {
          window.location.assign(result.authorizationUrl)
          return
        }

        if (isPaymentDemo) {
          if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(lut.id)) {
            await recordDemoPurchase(
              lut.id,
              lut.title,
              lut.price,
              'KES',
              result.reference,
            )
            await recordDemoDownload(lut.id, lut.title)
          }
          setPaymentReference(result.reference)
        }
      } else {
        if (import.meta.env.VITE_USE_EDGE_DOWNLOADS !== 'true') {
          await downloadFreeLut(lut.id)
        }
      }

      setDownloaded(true)
      setLut({ ...lut, downloads: lut.downloads + 1 })

      const downloadUrl = import.meta.env.VITE_USE_EDGE_DOWNLOADS === 'true'
        ? await createEntitledLutDownloadUrl(lut.id)
        : await createLutDownloadUrl(lut.file_url)
      const element = document.createElement('a')
      element.href = downloadUrl
      element.download = lut.file_url.split('/').pop() || `${lut.title}.cube`
      element.target = '_blank'
      element.rel = 'noreferrer'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    } catch (err: unknown) {
      setDownloadError(err instanceof Error ? err.message : 'Download failed')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return <p className="text-[#8a8580] text-center py-20 uppercase tracking-widest text-xs">Loading LUT details...</p>
  }

  if (error) {
    return <p className="text-[#c8102e] text-center py-20">Failed to load LUT: {error}</p>
  }

  if (!lut) {
    return (
      <div className="text-center py-20">
        <p className="text-[#8a8580] mb-4">LUT not found.</p>
        <Link to="/" className="text-[#c8102e] hover:underline uppercase text-xs tracking-widest font-bold">
          Back to catalog
        </Link>
      </div>
    )
  }

  const isFree = lut.price === 0

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <Link
        to="/"
        className="text-[#8a8580] hover:text-[#f5f2ed] text-xs uppercase tracking-widest mb-8 inline-flex items-center gap-2 transition-colors font-medium"
      >
        ← Back to Catalog
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* LEFT COLUMN: Before/After Interactive Preview */}
        <div className="lg:col-span-7 space-y-6">
          <BeforeAfterSlider
            beforeImage={lut.cover_image}
            afterImage={lut.preview_image || lut.cover_image}
            lutStyle={lut.style}
            alt={lut.title}
          />

          <p className="text-xs text-[#8a8580] text-center italic">
            Drag the slider above to compare the original clip against the color-graded LUT.
          </p>

          {/* TAB SYSTEM: Specs & Installation Guide */}
          <div className="border border-[#222] bg-[#111] p-6 space-y-4">
            <div className="flex border-b border-[#222] pb-3 gap-6 text-xs uppercase tracking-widest font-semibold">
              <button
                className={`pb-2 transition-colors ${
                  activeTab === 'specs'
                    ? 'text-[#f5f2ed] border-b-2 border-[#c8102e]'
                    : 'text-[#8a8580] hover:text-white'
                }`}
                onClick={() => setActiveTab('specs')}
              >
                Specifications & Compatibility
              </button>
              <button
                className={`pb-2 transition-colors ${
                  activeTab === 'guide'
                    ? 'text-[#f5f2ed] border-b-2 border-[#c8102e]'
                    : 'text-[#8a8580] hover:text-white'
                }`}
                onClick={() => setActiveTab('guide')}
              >
                Installation Instructions
              </button>
            </div>

            {activeTab === 'specs' ? (
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-[#0a0a0a] p-3 border border-[#222]">
                  <span className="text-[#8a8580] block uppercase tracking-wider text-[10px]">Format</span>
                  <span className="text-[#f5f2ed] font-mono text-sm mt-0.5 block font-bold">.CUBE (3D LUT)</span>
                </div>
                <div className="bg-[#0a0a0a] p-3 border border-[#222]">
                  <span className="text-[#8a8580] block uppercase tracking-wider text-[10px]">Rec. Target</span>
                  <span className="text-[#f5f2ed] font-mono text-sm mt-0.5 block font-bold">
                    {lut.output_color_space || 'Rec.709 / Standard'}
                  </span>
                </div>
                <div className="bg-[#0a0a0a] p-3 border border-[#222]">
                  <span className="text-[#8a8580] block uppercase tracking-wider text-[10px]">Input Space</span>
                  <span className="text-[#f5f2ed] font-mono text-sm mt-0.5 block font-bold">
                    {lut.input_color_space || 'LOG / Rec.709'}
                  </span>
                </div>
                <div className="bg-[#0a0a0a] p-3 border border-[#222]">
                  <span className="text-[#8a8580] block uppercase tracking-wider text-[10px]">Recommended Opacity</span>
                  <span className="text-[#f5f2ed] font-mono text-sm mt-0.5 block font-bold">
                    {lut.intensity || '80% - 100%'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs text-[#e8e4dd]">
                <div>
                  <h4 className="font-semibold text-[#c8102e] uppercase tracking-wider mb-1">Adobe Premiere Pro</h4>
                  <ol className="list-decimal list-inside space-y-1 text-[#8a8580]">
                    <li>Open Lumetri Color panel → Creative tab.</li>
                    <li>Click the Look dropdown menu and select Browse...</li>
                    <li>Choose your downloaded <code className="text-[#f5f2ed]">.cube</code> file.</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold text-[#c8102e] uppercase tracking-wider mb-1">DaVinci Resolve</h4>
                  <ol className="list-decimal list-inside space-y-1 text-[#8a8580]">
                    <li>Open the Color Page → LUTs sidebar tab.</li>
                    <li>Right click empty area → Open Folder.</li>
                    <li>Paste the downloaded <code className="text-[#f5f2ed]">.cube</code> file and click Refresh.</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Info & Actions */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono tracking-widest text-[#c8102e] uppercase font-semibold">
                {lut.style || 'Cinematic Grade'}
              </span>
              <FavoriteButton lutId={lut.id} isFavorited={isFavorited} size="lg" />
            </div>

            <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#f5f2ed]">{lut.title}</h1>

            <p className="text-xs text-[#8a8580] uppercase tracking-widest">Created by {lut.author || 'Bold Unity Creative'}</p>
          </div>

          <p className="text-sm text-[#e8e4dd] leading-relaxed bg-[#111] p-4 border border-[#222]">
            {lut.description || 'Professional cinematic color preset engineered for modern digital cinema standards.'}
          </p>

          <div className="flex items-center gap-6 py-3 border-y border-[#222] text-sm text-[#8a8580]">
            <div>
              <span className="text-[#f5f2ed] font-bold">★ {averageReviewRating(approvedReviews, lut.rating).toFixed(1)}</span>
              <span className="text-[10px] uppercase tracking-wider text-[#8a8580] block">Rating · {approvedReviews.length} review{approvedReviews.length === 1 ? '' : 's'}</span>
            </div>
            <div className="h-8 w-px bg-[#222]" />
            <div>
              <span className="text-[#f5f2ed] font-bold">{lut.downloads ?? 0}</span>
              <span className="text-[10px] uppercase tracking-wider text-[#8a8580] block">Downloads</span>
            </div>
            <div className="h-8 w-px bg-[#222]" />
            <div>
              <span className="text-[#f5f2ed] font-bold">{lut.compatibility?.length ? lut.compatibility.length : 4}+</span>
              <span className="text-[10px] uppercase tracking-wider text-[#8a8580] block">Host Apps</span>
            </div>
          </div>

          {lut.compatibility && lut.compatibility.length > 0 && (
            <div>
              <span className="text-[10px] text-[#8a8580] block mb-2 font-mono uppercase tracking-widest">
                Compatible Host Applications
              </span>
              <div className="flex flex-wrap gap-2">
                {lut.compatibility.map((app) => (
                  <span
                    key={app}
                    className="text-xs bg-[#181818] text-[#e8e4dd] px-3 py-1 border border-[#333] font-mono"
                  >
                    {app}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* DOWNLOAD / BUY ACTION CARD */}
          <div className="bg-[#111] p-6 border border-[#222] space-y-4 shadow-2xl">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-[#8a8580] uppercase tracking-widest font-mono">License Price</span>
              <span className="text-3xl font-bold text-[#f5f2ed]">
                {isFree ? 'FREE' : `KES ${lut.price.toLocaleString()}`}
              </span>
            </div>

            {isFree ? (
              !user ? (
                <div className="space-y-2">
                  <p className="text-xs text-[#8a8580] text-center">Sign in to claim your free LUT download</p>
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="block w-full text-center bg-[#f5f2ed] hover:bg-white text-black font-bold uppercase tracking-widest py-3.5 text-xs transition-colors"
                  >
                    Sign In to Download
                  </button>
                </div>
              ) : downloaded ? (
                <div className="bg-[#182218] border border-emerald-800 text-emerald-400 p-3 text-center text-xs font-mono uppercase tracking-widest font-bold space-y-1">
                  <div>✓ Demo File Downloaded (.CUBE file saved)</div>
                  {paymentReference && (
                    <div className="text-[10px] normal-case tracking-normal text-emerald-500">
                      Demo reference: {paymentReference}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full bg-[#c8102e] hover:bg-[#a00b23] text-white font-bold uppercase tracking-widest py-4 text-xs disabled:opacity-50 transition-colors shadow-lg shadow-red-900/20"
                >
                  {downloading ? 'Preparing File...' : 'Download .CUBE Pack Now'}
                </button>
              )
            ) : (
              <button
                onClick={handleDownload}
                className="w-full bg-[#c8102e] hover:bg-[#a00b23] text-white font-bold uppercase tracking-widest py-4 text-xs transition-colors shadow-lg shadow-red-900/20"
              >
                Buy & Download (.CUBE)
              </button>
            )}

            {downloadError && <p className="text-[#c8102e] text-xs text-center">{downloadError}</p>}
          </div>
        </div>
      </div>

      {/* RELATED LUTS */}
      {relatedLuts.length > 0 && (
        <div className="mt-20 border-t border-[#222] pt-12">
          <h3 className="text-2xl font-serif font-bold text-[#f5f2ed] mb-6">More Cinematic Look Presets</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {relatedLuts.map((rel) => (
              <Link
                key={rel.id}
                to={`/lut/${rel.id}`}
                className="group bg-[#111] border border-[#222] overflow-hidden hover:border-[#c8102e] transition-all"
              >
                <div className="aspect-video relative overflow-hidden bg-black">
                  {rel.cover_image && (
                    <img
                      src={rel.cover_image}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <span className="absolute top-2 left-2 bg-[#c8102e] text-white text-[9px] font-mono font-bold px-2 py-0.5 uppercase tracking-widest">
                    {rel.price === 0 ? 'FREE' : 'PREMIUM'}
                  </span>
                </div>
                <div className="p-4">
                  <h4 className="text-sm font-serif font-bold text-[#f5f2ed] group-hover:text-[#c8102e] transition-colors">
                    {rel.title}
                  </h4>
                  <p className="text-xs text-[#8a8580] mt-1">by {rel.author || 'Bold Unity'}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <ReviewPanel lutId={lut.id} />
    </div>
  )
}
