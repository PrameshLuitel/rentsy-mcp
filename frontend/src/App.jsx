import React, { useState, useEffect, useCallback } from 'react'
import { searchProducts, getCategories, getStats } from './api'
import ProductCard from './components/ProductCard'
import ProductModal from './components/ProductModal'
import BookingModal from './components/BookingModal'

const T = {
  canvas: '#faf9f5',
  surfaceSoft: '#f5f0e8',
  surfaceCard: '#efe9de',
  dark: '#181715',
  darkElevated: '#252320',
  primary: '#cc785c',
  primaryActive: '#a9583e',
  ink: '#141413',
  bodyStrong: '#252523',
  body: '#3d3d3a',
  muted: '#6c6a64',
  mutedSoft: '#8e8b82',
  onDark: '#faf9f5',
  onDarkSoft: '#a09d96',
  hairline: '#e6dfd8',
  success: '#5db872',
  teal: '#5db8a6',
  amber: '#e8a55a',
}

const CAT_IMG = 'https://s3.us-east-2.amazonaws.com/website.rentsy/uploads/category'
const CAT_IMAGES = {
  'Party + Events': `${CAT_IMG}/RxALCbRZf939Dj4cA6Yj.jpg`,
  'Wedding': `${CAT_IMG}/wSy8JOHlPIZ6eLLm0LPi.jpg`,
  'Kids Parties': `${CAT_IMG}/5XDwDF9vRox3r2FAzdTT.jpg`,
  'Corporate Events': `${CAT_IMG}/9TzHEXvj6TGERGzg8LY3.jpg`,
  'Fashion': `${CAT_IMG}/7Erbf34663T3P1o5xU6b.jpg`,
  'Electronics': `${CAT_IMG}/4diT6EWi0jNhfFQgDHri.jpg`,
  'Tools + Machinery': `${CAT_IMG}/T4C3QOaxfsIbGwPjzXW9n2fNrWkn5maLgCZ5gKjN.jpg`,
  'Sport + Leisure': `${CAT_IMG}/8yewCgr6TehRumBYZJBG.jpg`,
  'Services': `${CAT_IMG}/edjxO9fp81Kb3kv47iAz.jpg`,
  'Automotive': `${CAT_IMG}/Cvn9FBMcIr71z88WrnC9rXZ8t3Hi4YLLlEYtyuwp.jpg`,
  'Baby + Home': `${CAT_IMG}/rLn8uqdFQv02yWEE8huU.jpg`,
  'Watersports': `${CAT_IMG}/YvakcaohWKyjfj6mQlvp.jpg`,
  'Adventure': `${CAT_IMG}/b7QT69ngTCIGZFYgfrk7.jpg`,
  'Venues + Studios': `${CAT_IMG}/HZvvSJMgY4CHl4h1Jrii.jpg`,
  'Entertainment': `${CAT_IMG}/bSTJSlUyz45e6mL8C889.jpg`,
  'Health + Fitness': `${CAT_IMG}/AxhOgvB8lktRHcME82g6.jpg`,
  'Office': `${CAT_IMG}/EyXNiqcozMJHBMqJIWSt.jpg`,
  'Experiences': `${CAT_IMG}/kAtZICTMW6cdDRfwTJhm.jpg`,
}
const CAT_NAMES = Object.keys(CAT_IMAGES)
const QUICK_LINKS = [
  { label: 'Plan a Kids Party', q: 'kids party' },
  { label: 'Plan a Wedding', q: 'wedding' },
  { label: 'Backyard Party Setup', q: 'backyard party' },
  { label: 'Birthday Party Ideas', q: 'birthday party' },
  { label: 'Event Setup Essentials', q: 'event setup' },
  { label: 'Tool Hire Favourites', q: 'tool hire' },
]

export default function App() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [stats, setStats] = useState(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [sel, setSel] = useState(null)
  const [booking, setBooking] = useState(null)
  const [mobileCat, setMobileCat] = useState(false)

  useEffect(() => {
    Promise.all([getCategories().catch(() => []), getStats().catch(() => null)])
      .then(([c, s]) => { setCategories(c); setStats(s) })
  }, [])

  const load = useCallback(async (p = {}) => {
    setLoading(true)
    try { const d = await searchProducts(p); setProducts(d.results || d) } catch (e) { setProducts([]) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const doSearch = (e) => { e?.preventDefault(); if (query.trim()) load({ q: query }) }

  const s = {
    btnPrimary: {
      height: 40, padding: '0 20px', borderRadius: 8, border: 'none',
      background: T.primary, color: '#fff', fontSize: 14, fontWeight: 500,
      cursor: 'pointer', fontFamily: 'Inter, sans-serif',
    },
    btnSecondary: {
      height: 40, padding: '0 20px', borderRadius: 8, border: `1px solid ${T.hairline}`,
      background: T.canvas, color: T.ink, fontSize: 14, fontWeight: 500,
      cursor: 'pointer', fontFamily: 'Inter, sans-serif',
    },
    input: {
      height: 40, borderRadius: 8, border: `1px solid ${T.hairline}`,
      background: T.canvas, padding: '0 14px', fontSize: 14, color: T.ink,
      outline: 'none', fontFamily: 'Inter, sans-serif', width: '100%',
    },
  }

  return (
    <div style={{ minHeight: '100vh', background: T.canvas, fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: T.body }}>
      <div style={{ background: T.surfaceSoft, borderBottom: `1px solid ${T.hairline}`, display: 'none' }} className="md-flex">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          {['100% Australian Owned', 'Rentsy Booking Guarantee', 'Secure Payments', 'Live Chat', 'Verified Rental Stores'].map(t => (
            <span key={t} style={{ fontSize: 12, color: T.muted, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              {t}
            </span>
          ))}
        </div>
      </div>

      <header style={{ position: 'sticky', top: 0, zIndex: 990, background: T.canvas, borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="md-hide" onClick={() => setMobileCat(true)} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.ink} strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.primary} strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M6 12h12"/></svg>
                <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 500, color: T.ink, letterSpacing: '-0.02em' }}>Rentsy</span>
              </div>
            </div>
            <div className="lg-flex" style={{ display: 'none', alignItems: 'center', background: T.canvas, borderRadius: 8, height: 40, width: 280, padding: '0 12px', gap: 8, border: `1px solid ${T.hairline}` }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.mutedSoft} strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input placeholder="Search for rental items..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()}
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: T.ink, width: '100%', fontFamily: 'Inter, sans-serif' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="md-show" style={{ display: 'none', fontSize: 14, fontWeight: 500, color: T.primary, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Become A Rental Partner</span>
            <button style={{ ...s.btnSecondary, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.ink} strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Gold Coast
            </button>
            <span style={{ fontSize: 14, fontWeight: 500, color: T.primary, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Sign in</span>
            <button style={s.btnPrimary}>Try Rentsy</button>
          </div>
        </div>

        <div className="md-show" style={{ display: 'none', borderTop: `1px solid ${T.hairline}` }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', height: 40, display: 'flex', alignItems: 'center', gap: 2, overflowX: 'auto' }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: T.surfaceCard, border: 'none', fontSize: 14, fontWeight: 500, color: T.ink, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif' }}>
              All
            </button>
            {['Wedding', 'Party + Events', 'Kids Parties', 'Watersports', 'Automotive', 'Tools + Machinery', 'Entertainment', 'Sport + Leisure', 'Services'].map(c => (
              <button key={c} onClick={() => { setQuery(c); load({ q: c }) }}
                style={{ padding: '8px 14px', border: 'none', background: 'transparent', fontSize: 14, fontWeight: 500, color: T.muted, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif', borderRadius: 8 }}>
                {c}
              </button>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
              {[
                { d: 'M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6' },
                { d: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9' },
                { d: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z' },
              ].map((s, i) => (
                <button key={i} style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${T.hairline}`, background: T.canvas, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="1.5"><path d={s.d}/></svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <section style={{ background: T.canvas, padding: '64px 0 48px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 16px', textAlign: 'center' }}>
          <span style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: 9999, background: T.surfaceCard, color: T.ink, fontSize: 12, fontWeight: 500, marginBottom: 16, fontFamily: 'Inter, sans-serif', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            Australia's fastest growing rental platform
          </span>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 44, fontWeight: 500, color: T.ink, lineHeight: 1.1, letterSpacing: '-0.02em', margin: '0 0 8px' }}>
            Find anything to hire <span style={{ color: T.primary }}>near you</span>
          </h1>
          <p style={{ fontSize: 18, color: T.muted, marginBottom: 32, fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
            Tents, tables, sound systems, jumping castles — if you need it, Rentsy has it.
          </p>

          <form onSubmit={doSearch} style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: 12, flexDirection: window.innerWidth < 640 ? 'column' : 'row' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: T.canvas, borderRadius: 16, border: `1px solid ${T.hairline}`, overflow: 'hidden', boxShadow: '0 1px 3px rgba(20,20,19,0.06)', height: 56 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.mutedSoft} strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  <input placeholder="What do you need to hire?" value={query} onChange={e => setQuery(e.target.value)}
                    style={{ border: 'none', outline: 'none', fontSize: 15, color: T.ink, width: '100%', background: 'transparent', fontFamily: 'Inter, sans-serif' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', borderLeft: `1px solid ${T.hairline}`, minWidth: 140 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.body} strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span style={{ fontSize: 14, fontWeight: 500, color: T.ink, fontFamily: 'Inter, sans-serif' }}>Gold Coast, QLD</span>
                </div>
              </div>
              <button type="submit" style={{ height: 48, padding: '0 24px', borderRadius: 8, border: 'none', background: T.primary, color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Inter, sans-serif', boxShadow: '0 2px 8px rgba(204,120,92,0.3)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                Search
              </button>
            </div>
          </form>

          <div style={{ marginTop: 32 }}>
            <p style={{ fontSize: 13, color: T.muted, marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>Start your event:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
              {QUICK_LINKS.map(l => (
                <button key={l.label} onClick={() => { setQuery(l.q); load({ q: l.q }) }}
                  style={{ padding: '6px 16px', borderRadius: 9999, border: `1px solid ${T.hairline}`, background: T.canvas, color: T.ink, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '48px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 28, fontWeight: 500, color: T.ink, margin: 0, letterSpacing: '-0.02em' }}>Browse Categories</h2>
            <a href="#" style={{ fontSize: 14, fontWeight: 500, color: T.primary, fontFamily: 'Inter, sans-serif' }}>Browse All Categories →</a>
          </div>
          <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
            {CAT_NAMES.map(n => (
              <div key={n} onClick={() => { setQuery(n); load({ q: n }) }} style={{ cursor: 'pointer', flexShrink: 0, width: 140, textAlign: 'center' }}>
                <div style={{ width: 140, height: 140, borderRadius: 16, overflow: 'hidden', marginBottom: 8, border: `1px solid ${T.hairline}` }}>
                  <img src={CAT_IMAGES[n]} alt={n} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 500, color: T.ink, margin: 0, fontFamily: 'Inter, sans-serif' }}>{n}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {stats && (
        <div style={{ background: T.surfaceSoft, borderTop: `1px solid ${T.hairline}`, borderBottom: `1px solid ${T.hairline}`, padding: '20px 0' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', display: 'flex', justifyContent: 'center', gap: 48 }}>
            {[['Items', stats.total_products], ['Stores', stats.total_stores], ['Categories', stats.total_categories], ['Bookings', stats.total_bookings]].map(([l, v]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 28, fontWeight: 500, color: T.ink, letterSpacing: '-0.02em' }}>{(v || 0).toLocaleString()}+</div>
                <div style={{ fontSize: 11, color: T.mutedSoft, textTransform: 'uppercase', letterSpacing: 1.5, fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <section style={{ padding: '48px 0 80px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 28, fontWeight: 500, color: T.ink, margin: 0, letterSpacing: '-0.02em' }}>Featured Rentals</h2>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 80 }}>
              <div style={{ width: 36, height: 36, border: `3px solid ${T.hairline}`, borderTopColor: T.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, color: T.muted, fontFamily: 'Inter, sans-serif' }}>Finding the best rentals...</p>
            </div>
          ) : !products.length ? (
            <div style={{ textAlign: 'center', padding: 80, color: T.muted }}>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 500, color: T.ink, margin: '0 0 8px', letterSpacing: '-0.02em' }}>No rentals found</p>
              <p style={{ fontSize: 14, fontFamily: 'Inter, sans-serif' }}>Try a different category or search term</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {products.map((p, i) => <ProductCard key={p.id || i} product={p} onSelect={setSel} onBook={setBooking} />)}
            </div>
          )}
        </div>
      </section>

      <footer style={{ background: T.dark, padding: '64px 0 48px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.onDark} strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M6 12h12"/></svg>
                <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 500, color: T.onDark, letterSpacing: '-0.02em' }}>Rentsy</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Wedding', 'Sport + Leisure', 'Automotive', 'Watersports', 'Party + Events', 'Office'].map(c => (
                  <li key={c}><a href="#" onClick={e => { e.preventDefault(); setQuery(c); load({ q: c }) }} style={{ color: T.onDarkSoft, fontSize: 14, textDecoration: 'none', fontFamily: 'Inter, sans-serif' }}>{c}</a></li>
                ))}
                <li><a href="#" style={{ color: T.primary, fontSize: 14, fontWeight: 500, textDecoration: 'none', fontFamily: 'Inter, sans-serif' }}>Browse All Categories →</a></li>
              </ul>
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 500, color: T.onDark, marginBottom: 16, marginTop: 0, fontFamily: 'Inter, sans-serif' }}>Quick Links</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Locations', 'About Us', 'Terms & Conditions', 'Press & Media', 'Resources', 'Privacy Policy', "FAQ's", 'Contact Us'].map(l => (
                  <li key={l}><a href="#" style={{ color: T.onDarkSoft, fontSize: 14, textDecoration: 'none', fontFamily: 'Inter, sans-serif' }}>{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 500, color: T.onDark, marginBottom: 16, marginTop: 0, fontFamily: 'Inter, sans-serif' }}>Become a Rental Partner</h3>
              <p style={{ color: T.onDarkSoft, fontSize: 14, marginBottom: 16, fontFamily: 'Inter, sans-serif' }}>Start earning with your rental items.</p>
              <a href="#" style={{ display: 'inline-flex', alignItems: 'center', height: 40, padding: '0 20px', borderRadius: 8, background: T.primary, color: '#fff', fontSize: 14, fontWeight: 500, textDecoration: 'none', fontFamily: 'Inter, sans-serif' }}>Start Now!</a>
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 500, color: T.onDark, marginBottom: 16, marginTop: 0, fontFamily: 'Inter, sans-serif' }}>Download the App</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'App Store', sub: 'Download on the', icon: 'M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09z' },
                  { label: 'Google Play', sub: 'Get it on', icon: 'M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 0 1 0 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z' },
                ].map(a => (
                  <a key={a.label} href="#" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 8, background: T.darkElevated, textDecoration: 'none' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill={T.onDark}><path d={a.icon}/></svg>
                    <div><div style={{ fontSize: 10, color: T.onDarkSoft, fontFamily: 'Inter, sans-serif' }}>{a.sub}</div><div style={{ fontSize: 14, fontWeight: 500, color: T.onDark, fontFamily: 'Inter, sans-serif' }}>{a.label}</div></div>
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 500, color: T.onDark, marginBottom: 16, marginTop: 0, fontFamily: 'Inter, sans-serif' }}>Follow Us</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[{ n: 'Facebook', i: 'f' }, { n: 'Instagram', i: '◻' }, { n: 'LinkedIn', i: 'in' }].map(s => (
                  <li key={s.n}><a href="#" style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.onDarkSoft, fontSize: 14, textDecoration: 'none', fontFamily: 'Inter, sans-serif' }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: T.darkElevated, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: T.onDark }}>{s.i}</span>
                    {s.n}
                  </a></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </footer>

      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        style={{ position: 'fixed', bottom: 24, right: 24, width: 44, height: 44, borderRadius: '50%', background: T.primary, color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(204,120,92,0.3)', zIndex: 30 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
      </button>

      {sel && <ProductModal product={sel} onClose={() => setSel(null)} onBook={setBooking} />}
      {booking && <BookingModal product={booking} onClose={() => setBooking(null)} />}

      {mobileCat && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,20,19,0.3)' }} onClick={() => setMobileCat(false)} />
          <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: 280, background: T.canvas, padding: 16, overflowY: 'auto', boxShadow: '0 0 20px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.primary} strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M6 12h12"/></svg>
                <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 500, color: T.ink, letterSpacing: '-0.02em' }}>Rentsy</span>
              </div>
              <button onClick={() => setMobileCat(false)} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.ink} strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <input placeholder="Search for rental items..." value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { setMobileCat(false); doSearch() } }}
              style={{ ...s.input, marginBottom: 16 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: T.mutedSoft, textTransform: 'uppercase', letterSpacing: 1.5, padding: '0 8px', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>Categories</p>
              {CAT_NAMES.map(n => (
                <button key={n} onClick={() => { setMobileCat(false); setQuery(n); load({ q: n }) }}
                  style={{ textAlign: 'left', padding: '8px 12px', borderRadius: 8, border: 'none', background: 'none', fontSize: 14, color: T.body, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>{n}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 768px) { .md-flex { display: flex !important; } .md-show { display: flex !important; } .md-hide { display: none !important; } }
        @media (min-width: 1024px) { .lg-flex { display: flex !important; } }
      `}</style>
    </div>
  )
}
