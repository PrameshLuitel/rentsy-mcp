import React, { useState, useEffect, useCallback, useRef } from 'react'
import gsap from 'gsap'
import { searchProducts, getCategories, getStats } from './api'
import ProductGrid from './components/ProductGrid'
import ProductModal from './components/ProductModal'
import BookingModal from './components/BookingModal'

const CATEGORY_IMG = 'https://s3.us-east-2.amazonaws.com/website.rentsy/uploads/category'

const CATEGORY_IMAGES = {
  'Party + Events': `${CATEGORY_IMG}/RxALCbRZf939Dj4cA6Yj.jpg`,
  'Wedding': `${CATEGORY_IMG}/wSy8JOHlPIZ6eLLm0LPi.jpg`,
  'Kids Parties': `${CATEGORY_IMG}/5XDwDF9vRox3r2FAzdTT.jpg`,
  'Corporate Events': `${CATEGORY_IMG}/9TzHEXvj6TGERGzg8LY3.jpg`,
  'Fashion': `${CATEGORY_IMG}/7Erbf34663T3P1o5xU6b.jpg`,
  'Electronics': `${CATEGORY_IMG}/4diT6EWi0jNhfFQgDHri.jpg`,
  'Tools + Machinery': `${CATEGORY_IMG}/T4C3QOaxfsIbGwPjzXW9n2fNrWkn5maLgCZ5gKjN.jpg`,
  'Sport + Leisure': `${CATEGORY_IMG}/8yewCgr6TehRumBYZJBG.jpg`,
  'Services': `${CATEGORY_IMG}/edjxO9fp81Kb3kv47iAz.jpg`,
  'Automotive': `${CATEGORY_IMG}/Cvn9FBMcIr71z88WrnC9rXZ8t3Hi4YLLlEYtyuwp.jpg`,
  'Baby + Home': `${CATEGORY_IMG}/rLn8uqdFQv02yWEE8huU.jpg`,
  'Watersports': `${CATEGORY_IMG}/YvakcaohWKyjfj6mQlvp.jpg`,
  'Adventure': `${CATEGORY_IMG}/b7QT69ngTCIGZFYgfrk7.jpg`,
  'Venues + Studios': `${CATEGORY_IMG}/HZvvSJMgY4CHl4h1Jrii.jpg`,
  'Entertainment': `${CATEGORY_IMG}/bSTJSlUyz45e6mL8C889.jpg`,
  'Health + Fitness': `${CATEGORY_IMG}/AxhOgvB8lktRHcME82g6.jpg`,
  'Office': `${CATEGORY_IMG}/EyXNiqcozMJHBMqJIWSt.jpg`,
  'Experiences': `${CATEGORY_IMG}/kAtZICTMW6cdDRfwTJhm.jpg`,
}

const QUICK_LINKS = [
  { label: '🎉 Plan a Kids Party', query: 'kids party' },
  { label: '💍 Plan a Wedding', query: 'wedding' },
  { label: '🏡 Backyard Party Setup', query: 'backyard party' },
  { label: '🎂 Birthday Party Ideas', query: 'birthday party' },
  { label: '🎤 Event Setup Essentials', query: 'event setup' },
  { label: '🛠️ Tool Hire Favourites', query: 'tool hire' },
]

const CATEGORY_NAMES = [
  'Party + Events', 'Kids Parties', 'Wedding', 'Tools + Machinery',
  'Automotive', 'Sport + Leisure', 'Watersports', 'Office',
  'Adventure', 'Electronics', 'Fashion', 'Baby + Home',
  'Venues + Studios', 'Services', 'Corporate Events', 'Entertainment',
  'Health + Fitness', 'Experiences',
]

export default function App() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [stats, setStats] = useState(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [bookingProduct, setBookingProduct] = useState(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const heroRef = useRef(null)
  const catRef = useRef(null)
  const gridRef = useRef(null)
  const cardRowRef = useRef(null)

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
    loadProducts()
  }, [])

  useEffect(() => {
    if (heroRef.current) {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.fromTo(heroRef.current.querySelector('.hero-badge'), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 })
        .fromTo(heroRef.current.querySelector('.hero-title'), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, '-=0.3')
        .fromTo(heroRef.current.querySelector('.hero-subtitle'), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, '-=0.3')
        .fromTo(heroRef.current.querySelector('.hero-desc'), { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, '-=0.2')
        .fromTo(heroRef.current.querySelector('.hero-search'), { y: 15, opacity: 0, scale: 0.98 }, { y: 0, opacity: 1, scale: 1, duration: 0.5 }, '-=0.2')
        .fromTo(heroRef.current.querySelector('.hero-quick'), { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, '-=0.2')
    }
  }, [])

  useEffect(() => {
    if (catRef.current) {
      const cards = catRef.current.querySelectorAll('.explore-card')
      gsap.fromTo(cards, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.04, ease: 'power2.out', delay: 0.6 })
    }
  }, [])

  useEffect(() => {
    if (!loading && gridRef.current && products.length > 0) {
      const cards = gridRef.current.querySelectorAll('.product-card')
      gsap.fromTo(cards, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: 'power2.out' })
    }
  }, [loading, products])

  const loadProducts = useCallback(async (params = {}) => {
    setLoading(true)
    try {
      const data = await searchProducts(params)
      setProducts(data.results || data)
    } catch (e) {
      setProducts([])
    }
    setLoading(false)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    loadProducts({ q: query })
  }

  const handleCategoryClick = (name) => {
    loadProducts({ q: name })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Trust Bar */}
      <div className="trust-bar hidden md:block">
        <div className="max-w-[1280px] mx-auto px-6 h-9 flex items-center justify-center gap-6">
          <span className="trust-bar-item">100% Australian Owned and Operated</span>
          <span className="trust-bar-item">Rentsy Booking Guarantee</span>
          <span className="trust-bar-item">Secure Payments</span>
          <span className="trust-bar-item">Live Chat</span>
          <span className="trust-bar-item">Verified Rental Stores Only</span>
        </div>
      </div>

      {/* Main Nav */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E7E8EA]">
        <div className="max-w-[1280px] mx-auto px-4 h-[60px] md:h-[72px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <button className="md:hidden p-1" onClick={() => setShowMobileMenu(!showMobileMenu)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#101B30" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
              </button>
              <img src="https://www.rentsy.com.au/front/assets/images/icons/navbar-logo.png" alt="Rentsy" className="nav-logo" />
            </div>
            {/* Desktop search */}
            <div className="hidden lg:flex items-center bg-[#F4F5F7] rounded-[12px] h-10 w-[320px] px-3 gap-2">
              <span className="search-icon" />
              <input
                placeholder="Search for rental items..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                className="bg-transparent border-none outline-none text-sm text-[#404959] placeholder-[#9FA4AC] w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a href="#" className="hidden md:block text-sm font-medium text-[#404959] hover:text-[#101B30] transition-colors">Become A Rental Partner</a>
            <button className="btn-rentsy-secondary h-10 px-4 text-sm flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D42B65" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Gold Coast
            </button>
            <button className="btn-rentsy-primary h-10 px-4 text-sm">Sign in</button>
          </div>
        </div>

        {/* Secondary Nav - Categories */}
        <div className="hidden md:block border-t border-[#E7E8EA]">
          <div className="max-w-[1280px] mx-auto px-4 h-10 flex items-center gap-1 overflow-x-auto scrollbar-none">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#F4F5F7] text-sm font-medium text-[#101B30] whitespace-nowrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#101B30" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
              All
            </button>
            {['Wedding', 'Party + Events', 'Kids Parties', 'Watersports', 'Automotive', 'Tools + Machinery', 'Entertainment', 'Sport + Leisure', 'Services'].map((cat) => (
              <button key={cat} onClick={() => handleCategoryClick(cat)} className="nav-category-link px-3 py-1.5">{cat}</button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <button className="p-1.5 hover:bg-[#F4F5F7] rounded-[8px]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#404959" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              </button>
              <button className="p-1.5 hover:bg-[#F4F5F7] rounded-[8px]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#404959" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              </button>
              <button className="p-1.5 hover:bg-[#F4F5F7] rounded-[8px]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#404959" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section ref={heroRef} className="hero-section">
        <div className="max-w-[960px] mx-auto px-4 text-center">
          <span className="hero-badge inline-flex items-center px-3 py-1 rounded-full bg-[#FBEAF0] text-[#D42B65] text-xs font-semibold mb-4">
            Australia's fastest growing rental platform
          </span>
          <h1 className="hero-title text-[40px] md:text-[56px] font-bold text-[#101B30] leading-[1.1] mb-1">Find anything to hire</h1>
          <p className="hero-subtitle text-[40px] md:text-[56px] font-bold text-[#101B30] leading-[1.1] mb-4">near you, today.</p>
          <p className="hero-desc text-base md:text-lg text-[#404959] mb-6">Tents, tables, sound systems, jumping castles, if you need it, Rentsy has it.</p>

          {/* Search */}
          <form onSubmit={handleSearch} className="hero-search max-w-[720px] mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="hero-search-container flex-1">
                <div className="flex-1 flex items-center px-4 gap-3">
                  <span className="search-icon" />
                  <input
                    type="text"
                    placeholder="What do you need to hire?"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full border-none outline-none text-sm text-[#101B30] placeholder-[#9FA4AC] bg-transparent"
                  />
                </div>
                <div className="hidden sm:flex items-center gap-2 px-4 border-l border-[#E7E8EA] min-w-[140px]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#404959" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span className="text-sm text-[#101B30] font-medium">Gold Coast, QLD</span>
                </div>
              </div>
              <button type="submit" className="hero-search-btn">
                <span className="search-icon search-icon-white" />
                <span>Search</span>
              </button>
            </div>
          </form>

          {/* Quick links */}
          <div className="hero-quick mt-6">
            <p className="text-sm text-[#404959] mb-3">Start your event:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {QUICK_LINKS.map((item) => (
                <button
                  key={item.label}
                  onClick={() => { setQuery(item.query); loadProducts({ q: item.query }) }}
                  className="hero-popular-badge"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Carousel */}
      <section ref={catRef} className="py-8">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title">Browse Categories</h2>
            <a href="#" className="section-link">Browse All Categories →</a>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-none pb-2">
            {CATEGORY_NAMES.map((name) => (
              <div key={name} className="explore-card" onClick={() => handleCategoryClick(name)}>
                <div className="explore-card-image">
                  <img src={CATEGORY_IMAGES[name] || ''} alt={name} loading="lazy" />
                </div>
                <p className="text-sm font-medium text-[#101B30] text-center">{name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      {stats && (
        <div className="border-t border-b border-[#E7E8EA] py-4">
          <div className="max-w-[1280px] mx-auto px-4 flex items-center justify-center gap-8 md:gap-16">
            {[
              { label: 'Items', value: stats.total_products || 0 },
              { label: 'Stores', value: stats.total_stores || 0 },
              { label: 'Categories', value: stats.total_categories || 0 },
              { label: 'Bookings', value: stats.total_bookings || 0 },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-xl md:text-2xl font-bold text-[#101B30]">{s.value.toLocaleString()}+</div>
                <div className="text-xs text-[#707683] uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Grid */}
      <section className="py-8 md:py-12">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title">Featured Rentals</h2>
            <a href="#" className="section-link">Browse All →</a>
          </div>
          <div ref={gridRef}>
            <ProductGrid
              products={products}
              loading={loading}
              onSelect={setSelectedProduct}
              onBook={setBookingProduct}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-section py-12 md:py-16">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            <div>
              <h3>Top Categories</h3>
              <ul>
                {['Wedding', 'Sport + Leisure', 'Automotive', 'Watersports', 'Party + Events', 'Office'].map((c) => (
                  <li key={c}><a href="#" onClick={() => handleCategoryClick(c)}>{c}</a></li>
                ))}
                <li><a href="#" className="text-[#D42B65] font-medium hover:underline">Browse All Categories →</a></li>
              </ul>
            </div>
            <div>
              <h3>Quick Links</h3>
              <ul>
                {['Locations', 'About Us', 'Terms & Conditions', 'Press & Media', 'Resources', 'Privacy Policy', "FAQ's", 'Contact Us'].map((l) => (
                  <li key={l}><a href="#">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Become a Rental Partner</h3>
              <p className="text-sm text-[#CFD1D6] mb-4">Start earning with your rental items.</p>
              <a href="#" className="btn-rentsy-primary inline-flex items-center h-10 px-5 text-sm">Start Now!</a>
            </div>
            <div>
              <h3>Download the App</h3>
              <div className="space-y-3">
                <a href="#" className="flex items-center gap-3 bg-[#283245] rounded-[12px] px-4 py-3 hover:bg-[#404959] transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                  <div><div className="text-[10px] text-[#CFD1D6]">Download on the</div><div className="text-sm font-medium text-white">App Store</div></div>
                </a>
                <a href="#" className="flex items-center gap-3 bg-[#283245] rounded-[12px] px-4 py-3 hover:bg-[#404959] transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 0 1 0 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/></svg>
                  <div><div className="text-[10px] text-[#CFD1D6]">Get it on</div><div className="text-sm font-medium text-white">Google Play</div></div>
                </a>
              </div>
            </div>
            <div>
              <h3>Follow Us</h3>
              <ul>
                {[
                  { name: 'Facebook', icon: 'f' },
                  { name: 'Instagram', icon: '◻' },
                  { name: 'LinkedIn', icon: 'in' },
                ].map((s) => (
                  <li key={s.name}>
                    <a href="#" className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#283245] flex items-center justify-center text-xs">{s.icon}</span>
                      {s.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </footer>

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 w-11 h-11 rounded-full bg-[#D42B65] text-white flex items-center justify-center shadow-btn hover:bg-[#EE4E86] transition-colors z-30"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowMobileMenu(false)} />
          <div className="absolute left-0 top-0 h-full w-[280px] bg-white shadow-xl p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <img src="https://www.rentsy.com.au/front/assets/images/icons/navbar-logo.png" alt="Rentsy" className="h-8" />
              <button onClick={() => setShowMobileMenu(false)} className="p-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#101B30" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <input
              placeholder="Search for rental items..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setShowMobileMenu(false); handleSearch(e); } }}
              className="w-full h-10 bg-[#F4F5F7] rounded-[8px] px-3 text-sm outline-none mb-4"
            />
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-[#707683] uppercase tracking-wider px-2 mb-2">Categories</p>
              {CATEGORY_NAMES.map((name) => (
                <button
                  key={name}
                  onClick={() => { setShowMobileMenu(false); handleCategoryClick(name) }}
                  className="w-full text-left px-3 py-2 rounded-[8px] text-sm text-[#404959] hover:bg-[#F4F5F7] hover:text-[#101B30] transition-colors"
                >
                  {name}
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
