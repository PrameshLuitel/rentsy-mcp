import React, { useState, useEffect } from 'react'
import { X, Star, MapPin, Package, ChevronDown, ChevronUp } from 'lucide-react'
import { getProduct } from '../api'

const IMG_BASE = 'https://s3.us-east-2.amazonaws.com/website.rentsy/uploads/product_images/cropped'

function imageUrl(product) {
  if (product.image_url) return product.image_url
  if (product.image) return `${IMG_BASE}/${product.image}`
  return null
}

export default function ProductModal({ product, onClose, onBook }) {
  const [fullProduct, setFullProduct] = useState(product)
  const [loading, setLoading] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const img = imageUrl(fullProduct)

  useEffect(() => {
    if (product.id && !product.description) {
      setLoading(true)
      getProduct(product.id)
        .then((data) => { if (data) setFullProduct(data) })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [product.id])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-surface rounded-2xl border border-border overflow-hidden max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Close */}
        <button onClick={onClose} className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-colors text-gray-500 shadow-sm">
          <X className="w-4 h-4" />
        </button>

        {/* Image */}
        <div className="aspect-video bg-gray-100 relative">
          {img ? (
            <img src={img} alt={fullProduct.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
          )}
          {fullProduct.free_delivery && (
            <span className="absolute top-3 left-3 text-xs font-semibold bg-green-500 text-white px-3 py-1 rounded-full">
              Free Delivery
            </span>
          )}
        </div>

        {/* Body */}
        <div className="p-5 md:p-6">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h2 className="text-xl font-bold text-gray-900">{fullProduct.name}</h2>
            {fullProduct.rating && (
              <div className="flex items-center gap-1 text-sm text-yellow-500 shrink-0">
                <Star className="w-4 h-4 fill-current" />
                <span>{fullProduct.rating}</span>
              </div>
            )}
          </div>

          {fullProduct.store_name && (
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
              <MapPin className="w-3.5 h-3.5" />
              <span>{fullProduct.store_name}{fullProduct.location ? ` · ${fullProduct.location}` : ''}</span>
            </div>
          )}

          {/* Pricing */}
          <div className="flex flex-wrap gap-3 mb-4">
            {[
              { label: 'Per Day', value: fullProduct.price_per_day },
              { label: 'Per Week', value: fullProduct.price_per_week },
              { label: 'Deposit', value: fullProduct.deposit },
            ].filter((p) => p.value).map((p) => (
              <div key={p.label} className="bg-gray-50 rounded-xl px-4 py-2.5 text-center min-w-[90px] border border-border">
                <div className="text-sm font-bold gradient-text">${p.value}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wider">{p.label}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          {fullProduct.description && (
            <div className="mb-4">
              <p className={`text-sm text-gray-600 leading-relaxed ${!showMore ? 'line-clamp-3' : ''}`}>
                {fullProduct.description}
              </p>
              {fullProduct.description.length > 150 && (
                <button
                  onClick={() => setShowMore(!showMore)}
                  className="text-xs text-primary hover:underline mt-1 flex items-center gap-0.5"
                >
                  {showMore ? 'Show less' : 'Show more'}
                  {showMore ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>
          )}

          {/* Details */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            {fullProduct.available_quantity > 0 && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Package className="w-3.5 h-3.5" />
                <span>{fullProduct.available_quantity} available</span>
              </div>
            )}
            {fullProduct.condition && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="w-3.5 h-3.5 flex items-center justify-center text-[10px]">✓</span>
                <span className="capitalize">{fullProduct.condition}</span>
              </div>
            )}
          </div>

          {/* Book Button */}
          <button
            onClick={() => { onClose(); onBook?.(fullProduct) }}
            className="w-full py-3 rounded-xl font-semibold gradient-bg text-white hover:opacity-90 transition-opacity"
          >
            Book This Item
          </button>
        </div>
      </div>
    </div>
  )
}
