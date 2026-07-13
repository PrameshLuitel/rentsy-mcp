import React, { useState, useEffect, useCallback } from 'react'
import { Search, ShoppingBag, MapPin, Menu, X } from 'lucide-react'
import { searchProducts, getCategories, getStores, getStats } from './api'
import CategoryBar from './components/CategoryBar'
import ProductGrid from './components/ProductGrid'
import ProductModal from './components/ProductModal'
import BookingModal from './components/BookingModal'
import StatsBar from './components/StatsBar'

export default function App() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [stores, setStores] = useState([])
  const [stats, setStats] = useState(null)
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [bookingProduct, setBookingProduct] = useState(null)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      getCategories().catch(() => []),
      getStores().catch(() => []),
      getStats().catch(() => null),
    ]).then(([cats, sts, st]) => {
      setCategories(cats)
      setStores(sts)
      setStats(st)
    })
  }, [])

  const loadProducts = useCallback(async (params = {}) => {
    setLoading(true)
    setError(null)
    try {
      const data = await searchProducts(params)
      setProducts(data.results || data)
    } catch (e) {
      setError('Could not connect to server. Is the backend running?')
      setProducts([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text hidden sm:block">Rentsy</span>
          </div>

          <form onSubmit={handleSearch} className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search anything to rent..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-10 bg-gray-50 border border-border rounded-xl pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>
          </form>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
              <MapPin className="w-3 h-3" />
              <span>Australia</span>
            </div>
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-600"
            >
              {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 relative">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-bold mb-3">
              <span className="gradient-text">Rent Anything,</span>
              <br />
              <span className="text-gray-800">Rent Anywhere</span>
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              Australia's largest rental marketplace — 4500+ items from 400+ stores near you
            </p>
          </div>

          {/* Stats */}
          {stats && <StatsBar stats={stats} />}

          {/* Categories */}
          <CategoryBar
            categories={categories}
            activeCategory={activeCategory}
            onSelect={handleCategoryClick}
          />
        </div>
      </section>

      {/* Product Grid */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        {error && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">{error}</p>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Backend not connected
            </div>
          </div>
        )}
        <ProductGrid
          products={products}
          loading={loading}
          onSelect={setSelectedProduct}
          onBook={setBookingProduct}
        />
      </section>

      {/* Mobile Categories */}
      {mobileMenu && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileMenu(false)} />
          <div className="absolute right-0 top-0 h-full w-72 bg-surface border-l border-border p-6 overflow-y-auto shadow-xl">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Categories</h3>
            <div className="space-y-1">
              <button
                onClick={() => { setActiveCategory(null); setMobileMenu(false); loadProducts() }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                  !activeCategory ? 'gradient-bg text-white' : 'text-gray-600 hover:text-white hover:bg-primary/80'
                }`}
              >
                All Items
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.id); setMobileMenu(false); loadProducts({ category_id: cat.id }) }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    activeCategory === cat.id ? 'gradient-bg text-white' : 'text-gray-600 hover:text-white hover:bg-primary/80'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
