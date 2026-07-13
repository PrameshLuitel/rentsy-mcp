import React from 'react'
import { Heart } from 'lucide-react'

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

  return (
    <div className="product-card group" onClick={() => onSelect?.(product)}>
      {/* Photo plate */}
      <div className="relative aspect-square overflow-hidden bg-surface-soft">
        {img ? (
          <img
            src={img}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
        )}

        {/* Badges */}
        {product.rating && product.rating >= 4.5 && (
          <div className="guest-favorite">
            <span className="mr-1">⭐</span> Guest favorite
          </div>
        )}
        {product.free_delivery && !(product.rating && product.rating >= 4.5) && (
          <div className="guest-favorite">Free delivery</div>
        )}

        {/* Heart */}
        <button
          onClick={(e) => { e.stopPropagation() }}
          className="heart-btn"
        >
          <Heart className="w-4 h-4" />
        </button>
      </div>

      {/* Meta */}
      <div className="pt-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink truncate">{product.name}</p>
            {product.store_name && (
              <p className="text-sm text-muted truncate mt-0.5">{product.store_name}</p>
            )}
          </div>
          {product.rating && (
            <div className="flex items-center gap-0.5 shrink-0">
              <span className="text-xs text-ink font-semibold">★</span>
              <span className="text-xs text-ink font-semibold">{product.rating}</span>
            </div>
          )}
        </div>

        <p className="text-sm text-muted mt-0.5">
          {product.location || `${product.location_suburb || ''} ${product.location_city || ''}`.trim() || 'Gold Coast'}
        </p>

        <p className="text-sm font-semibold text-ink mt-1.5">
          {price ? `$${price} ${method}` : ''}
        </p>
      </div>
    </div>
  )
}
