import React from 'react'

const B = 'https://s3.us-east-2.amazonaws.com/website.rentsy/uploads/product_images/cropped'

const T = {
  canvas: '#faf9f5',
  surfaceCard: '#efe9de',
  primary: '#cc785c',
  ink: '#141413',
  body: '#3d3d3a',
  muted: '#6c6a64',
  hairline: '#e6dfd8',
  success: '#5db872',
}

function img(p) {
  if (p.image_url) return p.image_url
  if (p.image) return `${B}/${p.image}`
  return null
}

export default function ProductCard({ product, onSelect, onBook }) {
  const i = img(product)
  const price = product.price_per_day ?? product.price
  const method = (product.price_method || 'day').replace(/_/g, ' ')
  const badge = product.free_delivery
    ? { t: 'Free Delivery', c: T.primary }
    : (product.stock_available > 0 || product.available_quantity > 0)
      ? { t: 'Available Today', c: T.success }
      : null

  return (
    <div onClick={() => onSelect?.(product)}
      style={{ borderRadius: 12, overflow: 'hidden', background: T.canvas, border: `1px solid ${T.hairline}`, cursor: 'pointer', transition: 'box-shadow 0.25s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(20,20,19,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>

      <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', overflow: 'hidden', background: T.surfaceCard }}>
        {i ? <img src={i} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: T.muted }}>📦</div>
        )}
        {badge && (
          <span style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 9999, background: badge.c, color: '#fff', fontSize: 11, fontWeight: 500, zIndex: 2, fontFamily: 'Inter, sans-serif' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
            {badge.t}
          </span>
        )}
        <button onClick={e => { e.stopPropagation() }}
          style={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.85)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
      </div>

      <div style={{ padding: '12px 14px 14px' }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: T.ink, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif' }}>{product.name}</p>
        <p style={{ fontSize: 12, color: T.muted, margin: '2px 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif' }}>{product.store_name || product.category_name || ''}</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span style={{ fontSize: 12, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif' }}>
            {product.location || `${product.location_suburb || ''} ${product.location_city || ''}`.trim() || 'Gold Coast'}
          </span>
        </div>

        <p style={{ fontSize: 14, fontWeight: 500, color: T.primary, margin: 0, fontFamily: 'Inter, sans-serif' }}>
          {price ? `from $${price} / ${method}` : ''}
        </p>
      </div>
    </div>
  )
}
