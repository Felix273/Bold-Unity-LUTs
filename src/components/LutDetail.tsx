import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchLutById, fetchLuts, downloadFreeLut, type Lut } from '../lib/luts'
import { fetchFavoriteIds } from '../lib/favorites'
import { useAuth } from '../contexts/AuthContext'
import FavoriteButton from './FavoriteButton'
import BeforeAfterSlider from './BeforeAfterSlider'

export default function LutDetail() {
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
  const [downloaded, setDownloaded] = useState(false)

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

  const handleDownload = async () => {
    if (!lut) return
    setDownloadError(null)
    setDownloading(true)
    try {
      await downloadFreeLut(lut.id)
      setDownloaded(true)
      setLut({ ...lut, downloads: lut.downloads + 1 })

      // Trigger actual sample .cube file download simulation
      const element = document.createElement('a')
      const fileContent = `# Bold Unity Cinematic LUT\n# Title: ${lut.title}\nLUT_3D_SIZE 33\n0.0 0.0 0.0\n1.0 1.0 1.0\n`
      const blob = new Blob([fileContent], { type: 'text/plain' })
      element.href = URL.createObjectURL(blob)
      element.download = `${lut.title.toLowerCase().replace(/\s+/g, '_')}_lut.cube`
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
    return <p className="text-neutral-400 text-center py-20">Loading LUT details...</p>
  }

  if (error) {
    return <p className="text-red-500 text-center py-20">Failed to load LUT: {error}</p>
  }

  if (!lut) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-500 mb-4">LUT not found.</p>
        <Link to="/" className="text-amber-500 hover:text-amber-400 underline">
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
        className="text-neutral-400 hover:text-white text-sm mb-8 inline-flex items-center gap-2 transition-colors"
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

          <p className="text-xs text-neutral-400 text-center italic">
            Drag the slider above to compare the original clip against the color-graded LUT.
          </p>

          {/* TAB SYSTEM: Specs & Installation Guide */}
          <div className="border border-neutral-800 rounded-xl bg-neutral-900/60 p-6 space-y-4">
            <div className="flex border-b border-neutral-800 pb-3 gap-6 text-sm font-medium">
              <button
                className={`pb-2 transition-colors ${
                  activeTab === 'specs'
                    ? 'text-white border-b-2 border-amber-500'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                onClick={() => setActiveTab('specs')}
              >
                Specifications & Compatibility
              </button>
              <button
                className={`pb-2 transition-colors ${
                  activeTab === 'guide'
                    ? 'text-white border-b-2 border-amber-500'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                onClick={() => setActiveTab('guide')}
              >
                Installation Instructions
              </button>
            </div>

            {activeTab === 'specs' ? (
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/60">
                  <span className="text-neutral-500 block uppercase tracking-wider">Format</span>
                  <span className="text-neutral-200 font-mono text-sm mt-0.5 block">.CUBE (3D LUT)</span>
                </div>
                <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/60">
                  <span className="text-neutral-500 block uppercase tracking-wider">Rec. Target</span>
                  <span className="text-neutral-200 font-mono text-sm mt-0.5 block">
                    {lut.output_color_space || 'Rec.709 / Standard'}
                  </span>
                </div>
                <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/60">
                  <span className="text-neutral-500 block uppercase tracking-wider">Input Space</span>
                  <span className="text-neutral-200 font-mono text-sm mt-0.5 block">
                    {lut.input_color_space || 'LOG / Rec.709'}
                  </span>
                </div>
                <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/60">
                  <span className="text-neutral-500 block uppercase tracking-wider">Recommended Opacity</span>
                  <span className="text-neutral-200 font-mono text-sm mt-0.5 block">
                    {lut.intensity || '80% - 100%'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs text-neutral-300">
                <div>
                  <h4 className="font-semibold text-amber-400 mb-1">Adobe Premiere Pro</h4>
                  <ol className="list-decimal list-inside space-y-1 text-neutral-400">
                    <li>Open Lumetri Color panel → Creative tab.</li>
                    <li>Click the Look dropdown menu and select Browse...</li>
                    <li>Choose your downloaded <code className="text-neutral-200">.cube</code> file.</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold text-amber-400 mb-1">DaVinci Resolve</h4>
                  <ol className="list-decimal list-inside space-y-1 text-neutral-400">
                    <li>Open the Color Page → LUTs sidebar tab.</li>
                    <li>Right click empty area → Open Folder.</li>
                    <li>Paste the downloaded <code className="text-neutral-200">.cube</code> file and click Refresh.</li>
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
              <span className="text-xs font-mono tracking-widest text-neutral-500 uppercase">
                {lut.style || 'Cinematic Grade'}
              </span>
              <FavoriteButton lutId={lut.id} isFavorited={isFavorited} size="lg" />
            </div>

            <h1 className="text-3xl font-serif text-white">{lut.title}</h1>

            <p className="text-sm text-neutral-400">Created by {lut.author || 'Bold Unity Master Lab'}</p>
          </div>

          <p className="text-sm text-neutral-300 leading-relaxed bg-neutral-900/40 p-4 rounded-xl border border-neutral-800">
            {lut.description || 'Professional cinematic color preset engineered for modern digital cinema standards.'}
          </p>

          <div className="flex items-center gap-6 py-2 border-y border-neutral-800 text-sm text-neutral-400">
            <div>
              <span className="text-amber-400 font-bold">★ {lut.rating?.toFixed(1) ?? '4.9'}</span>
              <span className="text-xs text-neutral-500 block">Rating</span>
            </div>
            <div className="h-8 w-px bg-neutral-800" />
            <div>
              <span className="text-white font-semibold">{lut.downloads ?? 0}</span>
              <span className="text-xs text-neutral-500 block">Downloads</span>
            </div>
            <div className="h-8 w-px bg-neutral-800" />
            <div>
              <span className="text-white font-semibold">{lut.compatibility?.length ? lut.compatibility.length : 4}+</span>
              <span className="text-xs text-neutral-500 block">Host Apps</span>
            </div>
          </div>

          {lut.compatibility && lut.compatibility.length > 0 && (
            <div>
              <span className="text-xs text-neutral-500 block mb-2 font-mono uppercase tracking-wider">
                Compatible Host Applications
              </span>
              <div className="flex flex-wrap gap-2">
                {lut.compatibility.map((app) => (
                  <span
                    key={app}
                    className="text-xs bg-neutral-800/80 text-neutral-300 px-3 py-1 rounded-md border border-neutral-700/50"
                  >
                    {app}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* DOWNLOAD / BUY ACTION CARD */}
          <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 space-y-4 shadow-xl">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-neutral-400 uppercase tracking-widest font-mono">License Price</span>
              <span className="text-3xl font-bold text-white">
                {isFree ? 'FREE' : `KES ${lut.price.toLocaleString()}`}
              </span>
            </div>

            {isFree ? (
              !user ? (
                <div className="space-y-2">
                  <p className="text-xs text-neutral-400 text-center">Sign in to claim your free LUT download</p>
                  <Link
                    to="/"
                    className="block w-full text-center bg-white hover:bg-neutral-200 text-black font-semibold rounded-xl py-3 text-sm transition-colors"
                  >
                    Sign In to Download
                  </Link>
                </div>
              ) : downloaded ? (
                <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-300 p-3 rounded-xl text-center text-sm font-medium">
                  ✓ File Downloaded (.CUBE file saved)
                </div>
              ) : (
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl py-3.5 text-sm disabled:opacity-50 transition-colors shadow-lg shadow-amber-500/20"
                >
                  {downloading ? 'Preparing File...' : 'Download .CUBE Pack Now'}
                </button>
              )
            ) : (
              <button
                onClick={handleDownload}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl py-3.5 text-sm transition-colors shadow-lg shadow-amber-500/20"
              >
                Buy & Download (.CUBE)
              </button>
            )}

            {downloadError && <p className="text-red-500 text-xs text-center">{downloadError}</p>}
          </div>
        </div>
      </div>

      {/* RELATED LUTS */}
      {relatedLuts.length > 0 && (
        <div className="mt-20 border-t border-neutral-800 pt-12">
          <h3 className="text-xl font-serif text-white mb-6">More Cinematic Look Presets</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {relatedLuts.map((rel) => (
              <Link
                key={rel.id}
                to={`/lut/${rel.id}`}
                className="group bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden hover:border-neutral-700 transition-all"
              >
                <div className="aspect-video relative overflow-hidden bg-neutral-950">
                  {rel.cover_image && (
                    <img
                      src={rel.cover_image}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-mono px-2 py-0.5 rounded border border-white/10">
                    {rel.price === 0 ? 'FREE' : 'PREMIUM'}
                  </span>
                </div>
                <div className="p-4">
                  <h4 className="text-sm font-medium text-white group-hover:text-amber-400 transition-colors">
                    {rel.title}
                  </h4>
                  <p className="text-xs text-neutral-500 mt-1">{rel.author || 'Bold Unity'}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
