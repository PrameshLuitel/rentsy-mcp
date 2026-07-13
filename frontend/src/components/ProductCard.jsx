import React from 'react'

const IMG_BASE = 'https://s3.us-east-2.amazonaws.com/website.rentsy/uploads/product_images/cropped'

function imageUrl(product) {
  if (product.image_url) return product.image_url
  if (product.image) return `${IMG_BASE}/${product.image}`
  return null
}

export default function ProductCard({ product, onSelect, onBook }) {
  const img = imageUrl(product)
  const price = product.price_per_day ?? product.price
  const method = product.price_method?.replace(/_/g, ' ') || 'day'

  let badge = null
  if (product.free_delivery) badge = { type: 'Free Delivery', cls: 'badge-free-delivery' }
  else if (product.stock_available > 0 || product.available_quantity > 0) badge = { type: 'Available Today', cls: 'badge-available-today' }

  return (
    <div className="product-card" onClick={() => onSelect?.(product)}>
      <div className="product-img-wrapper">
        {img ? (
          <img src={img} alt={product.name} loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl bg-[#F4F5F7]">📦</div>
        )}
        {badge && (
          <span className={`preview-badge ${badge.cls}`}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
            {badge.type}
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation() }}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#404959" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
      </div>
      <div className="p-3 flex flex-col gap-1.5">
        <div>
          <h3 className="text-sm font-medium text-[#101B30] truncate leading-tight">{product.name}</h3>
          <p className="text-xs text-[#404959] truncate">{product.store_name || product.category_name || ''}</p>
        </div>
        <div className="flex items-center gap-1">
          <span className="location-icon" />
          <span className="text-xs text-[#707683] truncate">
            {product.location || `${product.location_suburb || ''} ${product.location_city || ''}`.trim() || 'Gold Coast'}
          </span>
        </div>
        <div className="price-tag">
          from ${price} / {method}
        </div>
      </div>
    </div>
  )
}
