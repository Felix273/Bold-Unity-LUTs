import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchLuts, type Lut, type LutFilters } from '../lib/luts'
import { fetchCategories, type Category } from '../lib/categories'
import { fetchFavoriteIds } from '../lib/favorites'
import { gradientForStyle } from '../lib/gradients'
import { useAuth } from '../contexts/AuthContext'
import FavoriteButton from './FavoriteButton'

type SortKey =
  | 'popular'
  | 'newest'
  | 'rating'
  | 'price-low'
  | 'price-high'

export default function LutGrid() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [luts, setLuts] = useState<Lut[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(
    new Set()
  )

  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState(() => searchParams.get('q') ?? '')
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '')

  const [categoryId, setCategoryId] = useState(() => searchParams.get('category') ?? '')
  const [software, setSoftware] = useState(() => searchParams.get('software') ?? '')
  const [priceType, setPriceType] = useState<
    'all' | 'free' | 'premium'
  >(() => {
    const value = searchParams.get('price')
    return value === 'free' || value === 'premium' ? value : 'all'
  })

  const [sort, setSort] = useState<SortKey>(() => {
    const value = searchParams.get('sort')
    return value === 'newest' || value === 'rating' || value === 'price-low' || value === 'price-high'
      ? value
      : 'popular'
  })

  const [mobileFiltersOpen, setMobileFiltersOpen] =
    useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim())
    }, 300)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    const nextParams = new URLSearchParams()
    if (search) nextParams.set('q', search)
    if (categoryId) nextParams.set('category', categoryId)
    if (software) nextParams.set('software', software)
    if (priceType !== 'all') nextParams.set('price', priceType)
    if (sort !== 'popular') nextParams.set('sort', sort)

    setSearchParams(nextParams, { replace: true })
  }, [search, categoryId, software, priceType, sort, setSearchParams])

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    let mounted = true

    async function loadFavorites() {
      if (!user) {
        if (mounted) setFavoriteIds(new Set())
        return
      }

      try {
        const ids = await fetchFavoriteIds(user.id)
        if (mounted) setFavoriteIds(ids)
      } catch {
        if (mounted) setFavoriteIds(new Set())
      }
    }

    loadFavorites()

    return () => {
      mounted = false
    }
  }, [user])

  useEffect(() => {
    let mounted = true

    async function loadLuts() {
      setLoading(true)
      setError(null)

      const filters: LutFilters = {
        search: search || undefined,
        categoryId: categoryId || undefined,
        software: software || undefined,
        priceType,
        sort,
        page: 1,
        pageSize: 40,
      }

      try {
        const data = await fetchLuts(filters)

        if (mounted) {
          setLuts(data)
          setPage(1)
          setHasMore(data.length === 40)
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load LUTs.'
          )
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadLuts()

    return () => {
      mounted = false
    }
  }, [search, categoryId, software, priceType, sort])

  const loadMore = async () => {
    setLoadingMore(true)

    try {
      const nextPage = page + 1
      const data = await fetchLuts({
        search: search || undefined,
        categoryId: categoryId || undefined,
        software: software || undefined,
        priceType,
        sort,
        page: nextPage,
        pageSize: 40,
      })

      setLuts((current) => [...current, ...data])
      setPage(nextPage)
      setHasMore(data.length === 40)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load more LUTs.')
    } finally {
      setLoadingMore(false)
    }
  }

  const activeCategory = categories.find(
    (category) => category.id === categoryId
  )

  const clearFilters = () => {
    setSearchInput('')
    setSearch('')
    setCategoryId('')
    setSoftware('')
    setPriceType('all')
    setSort('popular')
  }

  return (
    <section className="lut-marketplace">
      <div className="lut-toolbar">
        <div className="lut-search">
          <span className="lut-search-icon">⌕</span>

          <input
            type="search"
            value={searchInput}
            onChange={(event) =>
              setSearchInput(event.target.value)
            }
            placeholder="Search LUTs, styles, creators..."
            aria-label="Search LUTs"
          />

          {searchInput && (
            <button
              type="button"
              className="lut-search-clear"
              onClick={() => setSearchInput('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <button
          type="button"
          className="mobile-filter-button"
          onClick={() =>
            setMobileFiltersOpen(!mobileFiltersOpen)
          }
        >
          Filters
        </button>
      </div>

      <div className="lut-marketplace-layout">
        <aside
          className={`lut-filter-sidebar ${
            mobileFiltersOpen
              ? 'lut-filter-sidebar-open'
              : ''
          }`}
        >
          <div className="filter-header">
            <h2>Filters</h2>

            <button
              type="button"
              onClick={clearFilters}
            >
              Clear all
            </button>
          </div>

          <div className="filter-section">
            <h3>Software</h3>

            {[
              { label: 'All Software', value: '' },
              { label: 'Premiere Pro', value: 'Premiere Pro' },
              { label: 'DaVinci Resolve', value: 'DaVinci Resolve' },
              { label: 'Final Cut Pro', value: 'Final Cut Pro' },
              { label: 'Photoshop / Lightroom', value: 'Photoshop' },
            ].map((sw) => (
              <button
                key={sw.value}
                type="button"
                className={`filter-option ${
                  software === sw.value ? 'filter-option-active' : ''
                }`}
                onClick={() => setSoftware(sw.value)}
              >
                <span>{sw.label}</span>
              </button>
            ))}
          </div>

          <div className="filter-section">
            <h3>Category</h3>

            <button
              type="button"
              className={`filter-option ${
                categoryId === ''
                  ? 'filter-option-active'
                  : ''
              }`}
              onClick={() => setCategoryId('')}
            >
              <span>All LUTs</span>
            </button>

            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={`filter-option ${
                  categoryId === category.id
                    ? 'filter-option-active'
                    : ''
                }`}
                onClick={() =>
                  setCategoryId(category.id)
                }
              >
                <span>{category.name}</span>
              </button>
            ))}
          </div>

          <div className="filter-section">
            <h3>Price</h3>

            <button
              type="button"
              className={`filter-option ${
                priceType === 'all'
                  ? 'filter-option-active'
                  : ''
              }`}
              onClick={() => setPriceType('all')}
            >
              <span>All</span>
            </button>

            <button
              type="button"
              className={`filter-option ${
                priceType === 'free'
                  ? 'filter-option-active'
                  : ''
              }`}
              onClick={() => setPriceType('free')}
            >
              <span>Free</span>
            </button>

            <button
              type="button"
              className={`filter-option ${
                priceType === 'premium'
                  ? 'filter-option-active'
                  : ''
              }`}
              onClick={() =>
                setPriceType('premium')
              }
            >
              <span>Premium</span>
            </button>
          </div>

          <div className="filter-section">
            <h3>Sort</h3>

            <button
              type="button"
              className={`filter-option ${
                sort === 'popular'
                  ? 'filter-option-active'
                  : ''
              }`}
              onClick={() => setSort('popular')}
            >
              Most popular
            </button>

            <button
              type="button"
              className={`filter-option ${
                sort === 'newest'
                  ? 'filter-option-active'
                  : ''
              }`}
              onClick={() => setSort('newest')}
            >
              Newest
            </button>

            <button
              type="button"
              className={`filter-option ${
                sort === 'rating'
                  ? 'filter-option-active'
                  : ''
              }`}
              onClick={() => setSort('rating')}
            >
              Top rated
            </button>

            <button
              type="button"
              className={`filter-option ${
                sort === 'price-low'
                  ? 'filter-option-active'
                  : ''
              }`}
              onClick={() => setSort('price-low')}
            >
              Price: low to high
            </button>

            <button
              type="button"
              className={`filter-option ${
                sort === 'price-high'
                  ? 'filter-option-active'
                  : ''
              }`}
              onClick={() =>
                setSort('price-high')
              }
            >
              Price: high to low
            </button>
          </div>
        </aside>

        <div className="lut-results">
          <div className="results-header">
            <div>
              <p className="results-count">
                {loading
                  ? 'Loading LUTs...'
                  : `${luts.length} LUT${
                      luts.length === 1 ? '' : 's'
                    }`}
              </p>

              {activeCategory && (
                <span className="active-filter" style={{ marginRight: '6px' }}>
                  {activeCategory.name}
                </span>
              )}
              {software && (
                <span className="active-filter">
                  {software}
                </span>
              )}
            </div>

            <div className="results-sort">
              <label htmlFor="desktop-sort">
                Sort by
              </label>

              <select
                id="desktop-sort"
                value={sort}
                onChange={(event) =>
                  setSort(
                    event.target.value as SortKey
                  )
                }
              >
                <option value="popular">
                  Most popular
                </option>
                <option value="newest">
                  Newest
                </option>
                <option value="rating">
                  Top rated
                </option>
                <option value="price-low">
                  Price: low to high
                </option>
                <option value="price-high">
                  Price: high to low
                </option>
              </select>
            </div>
          </div>

          {error && (
            <div className="lut-error">
              <strong>Something went wrong.</strong>
              <span>{error}</span>
            </div>
          )}

          {loading && (
            <div className="lut-grid">
              {Array.from({ length: 8 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="lut-card lut-card-skeleton"
                  >
                    <div className="lut-card-image" />
                    <div className="lut-card-info">
                      <div />
                      <div />
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {!loading &&
            !error &&
            luts.length === 0 && (
              <div className="lut-empty">
                <div className="lut-empty-symbol">
                  ○
                </div>

                <h3>No LUTs found</h3>

                <p>
                  Try changing your search or filters.
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              </div>
            )}

          {!loading &&
            !error &&
            luts.length > 0 && (
              <>
                <div className="lut-grid">
                  {luts.map((lut) => (
  <article
    key={lut.id}
    className="lut-card"
  >
    <Link
      to={`/lut/${lut.id}`}
      className="lut-card-preview"
    >
      <div
        className="lut-card-image"
        style={{
          background: gradientForStyle(lut.style),
        }}
      >
        {lut.preview_video ? (
          <video
            src={lut.preview_video}
            muted
            loop
            autoPlay
            playsInline
            preload="metadata"
            className="lut-card-media"
          />
        ) : lut.preview_image ? (
          <img
            src={lut.preview_image}
            alt={lut.title}
            loading="lazy"
            className="lut-card-media"
          />
        ) : lut.cover_image ? (
          <img
            src={lut.cover_image}
            alt={lut.title}
            loading="lazy"
            className="lut-card-media"
          />
        ) : null}

        <div className="lut-card-overlay" />

        <div className="lut-card-badge">
          {lut.price === 0 ? 'FREE' : 'PREMIUM'}
        </div>

        <div className="lut-card-view">
          View LUT
        </div>
      </div>
    </Link>

    <div className="lut-card-content">
      <div className="lut-card-title-row">
        <Link
          to={`/lut/${lut.id}`}
          className="lut-card-title"
        >
          {lut.title}
        </Link>

        {user && (
          <FavoriteButton
            lutId={lut.id}
            isFavorited={favoriteIds.has(lut.id)}
          />
        )}
      </div>

      <div className="lut-card-meta">
        <span>
          {lut.author || 'Bold Unity'}
        </span>

        <span>·</span>

        <span style={{ color: '#e8e4dd', fontWeight: 600 }}>
          ★ {lut.rating?.toFixed(1) ?? '0.0'}
        </span>
      </div>

      {lut.compatibility && lut.compatibility.length > 0 && (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '8px' }}>
          {lut.compatibility.slice(0, 3).map((app) => (
            <span
              key={app}
              style={{
                fontSize: '9px',
                background: '#1a1a1a',
                color: '#8a8580',
                padding: '2px 6px',
                border: '1px solid #2a2a2a',
                fontFamily: 'DM Mono, monospace',
              }}
            >
              {app}
            </span>
          ))}
        </div>
      )}

      <div className="lut-card-bottom">
        <span className="lut-card-downloads">
          {lut.downloads ?? 0} downloads
        </span>

        <span className="lut-card-price">
          {lut.price === 0
            ? 'FREE'
            : `KES ${lut.price.toLocaleString()}`}
        </span>
      </div>
    </div>
  </article>
                  ))}
                </div>

                {hasMore && (
                  <div className="flex justify-center mt-10">
                    <button
                      type="button"
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="border border-[#333] px-6 py-3 text-xs uppercase tracking-widest text-[#f5f2ed] hover:border-[#c8102e] disabled:opacity-50 transition-colors"
                    >
                      {loadingMore ? 'Loading...' : 'Load more LUTs'}
                    </button>
                  </div>
                )}
              </>
            )}
        </div>
      </div>
    </section>
  )
}