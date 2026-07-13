import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Search, ShoppingBag, MapPin, Menu, X, Globe, User, ChevronDown } from 'lucide-react'
import gsap from 'gsap'
import { searchProducts, getCategories, getStores, getStats } from './api'
import CategoryStrip from './components/CategoryStrip'
import ProductGrid from './components/ProductGrid'
import ProductModal from './components/ProductModal'
import BookingModal from './components/BookingModal'
import Footer from './components/Footer'

export default function App() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [stats, setStats] = useState(null)
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [bookingProduct, setBookingProduct] = useState(null)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('rent')

  const heroRef = useRef(null)
  const searchRef = useRef(null)
  const gridRef = useRef(null)

  useEffect(() => {
    Promise.all([
      getCategories().catch(() => []),
      getStats().catch(() => null),
    ]).then(([cats, st]) => {
      setCategories(cats)
      setStats(st)
    })
  }, [])

  useEffect(() => {
    if (heroRef.current) {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.fromTo(heroRef.current.querySelector('.hero-title'),
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 }
      )
      tl.fromTo(heroRef.current.querySelector('.hero-subtitle'),
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        '-=0.4'
      )
      tl.fromTo(searchRef.current,
        { y: 20, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6 },
        '-=0.3'
      )
      tl.fromTo(heroRef.current.querySelector('.hero-quick-links'),
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 },
        '-=0.2'
      )
    }
  }, [])

  const loadProducts = useCallback(async (params = {}) => {
    setLoading(true)
    setError(null)
    try {
      const data = await searchProducts(params)
      setProducts(data.results || data)
    } catch (e) {
      console.error('Search failed:', e)
      setProducts([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  useEffect(() => {
    if (!loading && gridRef.current && products.length > 0) {
      const cards = gridRef.current.querySelectorAll('.product-card')
      gsap.fromTo(cards,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: 'power2.out' }
      )
    }
  }, [loading, products])

  const handleSearch = (e) => {
    e.preventDefault()
    const params = {}
    if (query) params.q = query
    if (activeCategory) params.category_id = activeCategory
    loadProducts(params)
  }

  const handleCategoryClick = (catId) => {
    const next = catId === activeCategory ? null : catId
    setActiveCategory(next)
    const params = {}
    if (query) params.q = query
    if (next) params.category_id = next
    loadProducts(params)
  }

  const quickSearches = [
    { label: '🎉 Kids Party', query: 'kids party' },
    { label: '💍 Wedding', query: 'wedding' },
    { label: '🏡 Backyard Party', query: 'backyard party' },
    { label: '🛠️ Tool Hire', query: 'tools' },
    { label: '🎤 Event Setup', query: 'event' },
    { label: '🎪 Party Lighting', query: 'party lighting' },
  ]

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-canvas border-b border-hairline">
        <div className="max-w-[1440px] mx-auto px-6 h-20 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-full bg-rausch flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-rausch hidden sm:block tracking-tight">rentsy</span>
          </div>

          {/* Center Nav */}
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {['Rent', 'Experiences', 'Services'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={`top-nav-link ${activeTab === tab.toLowerCase() ? 'active' : ''}`}
              >
                {tab}
                {tab !== 'Rent' && (
                  <span className="ml-1 text-[8px] font-bold uppercase tracking-widest text-muted align-super">NEW</span>
                )}
              </button>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-2">
            <button className="hidden sm:block btn-ghost text-sm">Become a Host</button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-soft transition-colors text-muted hover:text-ink">
              <Globe className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="flex items-center gap-2 border border-hairline rounded-full px-3 py-1.5 hover:shadow-airbnb transition-shadow"
            >
              <Menu className="w-4 h-4 text-ink" />
              <User className="w-6 h-6 text-muted" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section ref={heroRef} className="relative overflow-hidden pb-8">
        <div className="max-w-[1440px] mx-auto px-6 pt-12 md:pt-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="hero-title text-3xl md:text-5xl font-bold text-ink mb-3 leading-tight">
              Find anything to rent near you
            </h1>
            <p className="hero-subtitle text-base md:text-lg text-muted mb-8">
              Australia's largest rental marketplace — 4500+ items from local stores
            </p>

            {/* Pill Search */}
            <form ref={searchRef} onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="search-pill">
                <div className="flex-1 flex items-center divide-x divide-hairline h-full">
                  <div className="flex-1 px-6 h-full flex flex-col justify-center text-left hover:bg-surface-soft rounded-l-full transition-colors">
                    <label className="text-[10px] font-semibold text-muted uppercase tracking-wider leading-none mb-0.5">Where</label>
                    <input
                      type="text"
                      placeholder="Search rentals..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full bg-transparent text-sm text-ink placeholder-muted focus:outline-none"
                    />
                  </div>
                  <div className="w-32 px-6 h-full flex flex-col justify-center text-left hover:bg-surface-soft transition-colors">
                    <label className="text-[10px] font-semibold text-muted uppercase tracking-wider leading-none mb-0.5">When</label>
                    <span className="text-sm text-muted">Any time</span>
                  </div>
                  <div className="w-28 px-6 h-full flex flex-col justify-center text-left hover:bg-surface-soft transition-colors">
                    <label className="text-[10px] font-semibold text-muted uppercase tracking-wider leading-none mb-0.5">Who</label>
                    <span className="text-sm text-muted">Add guests</span>
                  </div>
                </div>
                <button type="submit" className="mr-2 search-orb">
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Quick links */}
            <div className="hero-quick-links flex flex-wrap justify-center gap-2 mt-6">
              {quickSearches.map((item) => (
                <button
                  key={item.label}
                  onClick={() => { setQuery(item.query); loadProducts({ q: item.query }) }}
                  className="px-4 py-2 rounded-full border border-hairline text-sm text-muted hover:border-muted hover:text-ink transition-all duration-200"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stats bar */}
          {stats && (
            <div className="flex items-center justify-center gap-8 md:gap-12 mt-8">
              {[
                { label: 'Products', value: stats.total_products || 0 },
                { label: 'Stores', value: stats.total_stores || 0 },
                { label: 'Categories', value: stats.total_categories || 0 },
                { label: 'Bookings', value: stats.total_bookings || 0 },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-ink">{s.value.toLocaleString()}+</div>
                  <div className="text-[11px] text-muted uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Categories */}
          <CategoryStrip
            categories={categories}
            activeCategory={activeCategory}
            onSelect={handleCategoryClick}
          />
        </div>
      </section>

      {/* Product Grid */}
      <section className="max-w-[1440px] mx-auto px-6 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-ink">
            {activeCategory
              ? categories.find(c => c.id === activeCategory)?.name || 'Rentals'
              : 'Featured Rentals'}
          </h2>
          <button className="text-sm text-muted hover:text-ink underline transition-colors">Show all</button>
        </div>

        {error && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-muted font-medium">No rentals found</p>
            <p className="text-sm text-muted-soft mt-1">Try a different category or search term</p>
          </div>
        )}

        <div ref={gridRef}>
          <ProductGrid
            products={products}
            loading={loading}
            onSelect={setSelectedProduct}
            onBook={setBookingProduct}
          />
        </div>
      </section>

      {/* Mobile Menu Overlay */}
      {mobileMenu && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenu(false)} />
          <div className="absolute right-0 top-0 h-full w-80 bg-canvas border-l border-hairline p-6 overflow-y-auto shadow-airbnb">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-ink">Menu</h3>
              <button onClick={() => setMobileMenu(false)} className="w-8 h-8 rounded-full hover:bg-surface-soft flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-soft cursor-pointer">
                <User className="w-5 h-5 text-muted" />
                <span className="text-sm text-ink">Sign up</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-soft cursor-pointer">
                <span className="w-5 h-5 flex items-center justify-center text-muted text-sm">🔑</span>
                <span className="text-sm text-ink">Log in</span>
              </div>
              <hr className="my-3 border-hairline" />
              <p className="text-xs font-semibold text-muted uppercase tracking-wider px-3 mb-2">Categories</p>
              <button
                onClick={() => { setActiveCategory(null); setMobileMenu(false); loadProducts() }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!activeCategory ? 'bg-ink text-white' : 'text-muted hover:text-ink hover:bg-surface-soft'}`}
              >
                All Items
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.id); setMobileMenu(false); loadProducts({ category_id: cat.id }) }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeCategory === cat.id ? 'bg-ink text-white' : 'text-muted hover:text-ink hover:bg-surface-soft'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />

      {/* Modals */}
      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onBook={setBookingProduct} />
      )}
      {bookingProduct && (
        <BookingModal product={bookingProduct} onClose={() => setBookingProduct(null)} />
      )}
    </div>
  )
}
