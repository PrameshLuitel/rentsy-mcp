import React from 'react'
import { Heart, Star } from 'lucide-react'

const IMG_BASE = 'https://s3.us-east-2.amazonaws.com/website.rentsy/uploads/product_images/cropped'

function imageUrl(product) {
  if (product.image_url) return product.image_url
  if (product.image) return `${IMG_BASE}/${product.image}`
  return null
}

export default function ProductCard({ product, onSelect, onBook }) {
  const img = imageUrl(product)

  return (
    <div className="product-card bg-card rounded-2xl border border-border overflow-hidden group cursor-pointer shadow-sm hover:shadow-lg"
      onClick={() => onSelect?.(product)}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {img ? (
          <img
            src={img}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-4xl">📦</div>
          </div>
        )}
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.free_delivery && (
            <span className="text-[10px] font-semibold bg-green-500 text-white px-2 py-0.5 rounded-full">
              Free Delivery
            </span>
          )}
          {product.rating && product.rating >= 4.5 && (
            <span className="text-[10px] font-semibold bg-primary text-white px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <Star className="w-2.5 h-2.5 fill-current" /> {product.rating}
            </span>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation() }}
          className="absolute top-2 right-2 w-7 h-7 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-colors text-gray-400"
        >
          <Heart className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Info */}
      <div className="p-3.5">
        <h3 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-1 mb-1">{product.name}</h3>

        {product.store_name && (
          <p className="text-xs text-gray-500 mb-2">{product.store_name}</p>
        )}

        <div className="flex items-center gap-2 mb-2.5">
          {product.price_per_day && (
            <span className="text-lg font-bold gradient-text">
              from ${product.price_per_day}
            </span>
          )}
          <span className="text-xs text-gray-400">/ day</span>
        </div>

        {product.available_quantity > 0 ? (
          <span className="text-[11px] text-green-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Available
          </span>
        ) : (
          <span className="text-[11px] text-red-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Currently Rented
          </span>
        )}

        {/* Book button */}
        <button
          onClick={(e) => { e.stopPropagation(); onBook?.(product) }}
          className="mt-3 w-full py-2 rounded-xl text-xs font-semibold gradient-bg text-white hover:opacity-90 transition-opacity"
        >
          Book Now
        </button>
      </div>
    </div>
  )
}
