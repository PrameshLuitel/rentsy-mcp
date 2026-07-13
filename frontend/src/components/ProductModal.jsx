import React, { useState, useEffect, useRef } from 'react'
import { getProduct } from '../api'

const B = 'https://s3.us-east-2.amazonaws.com/website.rentsy/uploads/product_images/cropped'
function img(p) { return p.image_url ? p.image_url : p.image ? `${B}/${p.image}` : null }

const T = {
  canvas: '#faf9f5',
  surfaceCard: '#efe9de',
  surfaceSoft: '#f5f0e8',
  primary: '#cc785c',
  ink: '#141413',
  body: '#3d3d3a',
  muted: '#6c6a64',
  mutedSoft: '#8e8b82',
  hairline: '#e6dfd8',
}

export default function ProductModal({ product, onClose, onBook }) {
  const [fp, setFp] = useState(product)
  const [more, setMore] = useState(false)
  const r = useRef(null)
  const i = img(fp)

  useEffect(() => {
    if (product.id && !product.description) {
      getProduct(product.id).then(d => { if (d) setFp(d) }).catch(() => {})
    }
  }, [product.id])

  const price = fp.price_per_day ?? fp.price
  const weekly = fp.price_per_week ?? (price ? price * 5 : null)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(20,20,19,0.45)' }} onClick={onClose}>
      <div ref={r} style={{ position: 'relative', background: T.canvas, borderRadius: 16, maxHeight: '90vh', overflowY: 'auto', width: '100%', maxWidth: 600, boxShadow: '0 4px 24px rgba(20,20,19,0.12)' }} onClick={e => e.stopPropagation()}>
        <div style={{ position: 'relative', aspectRatio: '16/9', background: T.surfaceCard }}>
          {i ? <img src={i} alt={fp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: T.muted }}>📦</div>}
          <button onClick={onClose} style={{ position: 'absolute', top: 12, left: 12, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.85)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.ink} strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div style={{ padding: 24 }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 500, color: T.ink, margin: '0 0 4px', letterSpacing: '-0.02em' }}>{fp.name}</h2>
          <p style={{ fontSize: 14, color: T.muted, margin: '0 0 20px', fontFamily: 'Inter, sans-serif' }}>{fp.store_name} · {fp.location || 'Gold Coast'}</p>

          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {price && (
              <div style={{ background: T.surfaceSoft, borderRadius: 12, padding: '10px 16px', textAlign: 'center', minWidth: 90 }}>
                <div style={{ fontSize: 16, fontWeight: 500, color: T.primary, fontFamily: 'Inter, sans-serif' }}>${price}</div>
                <div style={{ fontSize: 10, color: T.mutedSoft, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>Per {(fp.price_method || 'day').replace(/_/g, ' ')}</div>
              </div>
            )}
            {weekly && (
              <div style={{ background: T.surfaceSoft, borderRadius: 12, padding: '10px 16px', textAlign: 'center', minWidth: 90 }}>
                <div style={{ fontSize: 16, fontWeight: 500, color: T.primary, fontFamily: 'Inter, sans-serif' }}>${weekly}</div>
                <div style={{ fontSize: 10, color: T.mutedSoft, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>Per week</div>
              </div>
            )}
            {fp.deposit && (
              <div style={{ background: T.surfaceSoft, borderRadius: 12, padding: '10px 16px', textAlign: 'center', minWidth: 90 }}>
                <div style={{ fontSize: 16, fontWeight: 500, color: T.ink, fontFamily: 'Inter, sans-serif' }}>${fp.deposit}</div>
                <div style={{ fontSize: 10, color: T.mutedSoft, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>Deposit</div>
              </div>
            )}
          </div>

          {fp.description && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 14, color: T.body, lineHeight: 1.6, margin: 0, fontFamily: 'Inter, sans-serif' }}>{more ? fp.description : fp.description.slice(0, 200)}{!more && fp.description.length > 200 ? '...' : ''}</p>
              {fp.description.length > 200 && (
                <button onClick={() => setMore(!more)} style={{ fontSize: 12, color: T.primary, border: 'none', background: 'none', cursor: 'pointer', padding: 0, marginTop: 4, fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
                  {more ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            {(fp.stock_available > 0 || fp.available_quantity > 0) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: T.muted, fontFamily: 'Inter, sans-serif' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                {fp.stock_available || fp.available_quantity} available
              </div>
            )}
            {fp.free_delivery && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: T.muted, fontFamily: 'Inter, sans-serif' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                Free delivery
              </div>
            )}
          </div>

          <button onClick={() => { onClose(); setTimeout(() => onBook?.(fp), 300) }}
            style={{ width: '100%', padding: '12px 20px', borderRadius: 8, border: 'none', background: T.primary, color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            Reserve now
          </button>
        </div>
      </div>
    </div>
  )
}
