import React, { useState, useEffect, useRef } from 'react'
import { X, Star, MapPin, Package, ChevronDown, ChevronUp, Heart } from 'lucide-react'
import gsap from 'gsap'
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
  const overlayRef = useRef(null)
  const cardRef = useRef(null)
  const img = imageUrl(fullProduct)

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(cardRef.current,
        { y: 40, opacity: 0, scale: 0.96 },
        { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'power3.out' }
      )
    }
  }, [])

  useEffect(() => {
    if (product.id && !product.description) {
      setLoading(true)
      getProduct(product.id)
        .then((data) => { if (data) setFullProduct(data) })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [product.id])

  const handleClose = () => {
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        y: 30, opacity: 0, scale: 0.96, duration: 0.2, ease: 'power2.in',
        onComplete: onClose
      })
    } else {
      onClose()
    }
  }

  const price = fullProduct.price_per_day ?? fullProduct.price
  const weekly = fullProduct.price_per_week ?? (price ? price * 5 : null)
  const deposit = fullProduct.deposit

  return (
    <div ref={overlayRef} className="modal-overlay" onClick={handleClose}>
      <div ref={cardRef} className="modal-card max-w-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <button onClick={handleClose} className="absolute top-3 left-3 z-10 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors text-ink shadow-sm">
          <X className="w-4 h-4" />
        </button>

        {/* Image */}
        <div className="aspect-video bg-surface-soft relative">
          {img ? (
            <img src={img} alt={fullProduct.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
          )}
          {fullProduct.free_delivery && (
            <span className="absolute top-3 right-3 text-xs font-semibold bg-white/90 backdrop-blur-sm text-ink px-3 py-1 rounded-full shadow-sm">
              Free Delivery
            </span>
          )}
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h2 className="text-xl font-semibold text-ink">{fullProduct.name}</h2>
              {fullProduct.store_name && (
                <p className="text-sm text-muted flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {fullProduct.store_name}{fullProduct.location ? ` · ${fullProduct.location}` : ''}
                </p>
              )}
            </div>
            {fullProduct.rating && (
              <div className="flex items-center gap-1 text-sm text-ink shrink-0">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-semibold">{fullProduct.rating}</span>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="flex flex-wrap gap-2 mb-4">
            {price && (
              <div className="bg-surface-soft rounded-lg px-4 py-2.5 text-center min-w-[90px] border border-hairline">
                <div className="text-base font-bold text-ink">${price}</div>
                <div className="text-[10px] text-muted uppercase tracking-wider">Per {fullProduct.price_method?.replace(/_/g, ' ') || 'day'}</div>
              </div>
            )}
            {weekly && (
              <div className="bg-surface-soft rounded-lg px-4 py-2.5 text-center min-w-[90px] border border-hairline">
                <div className="text-base font-bold text-ink">${weekly}</div>
                <div className="text-[10px] text-muted uppercase tracking-wider">Per week</div>
              </div>
            )}
            {deposit && (
              <div className="bg-surface-soft rounded-lg px-4 py-2.5 text-center min-w-[90px] border border-hairline">
                <div className="text-base font-bold text-ink">${deposit}</div>
                <div className="text-[10px] text-muted uppercase tracking-wider">Deposit</div>
              </div>
            )}
          </div>

          {/* Description */}
          {fullProduct.description && (
            <div className="mb-4">
              <p className={`text-sm text-body leading-relaxed ${!showMore ? 'line-clamp-3' : ''}`}>
                {fullProduct.description}
              </p>
              {fullProduct.description.length > 150 && (
                <button
                  onClick={() => setShowMore(!showMore)}
                  className="text-xs text-muted hover:text-ink underline mt-1 flex items-center gap-0.5"
                >
                  {showMore ? 'Show less' : 'Show more'}
                  {showMore ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>
          )}

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {fullProduct.stock_available > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted">
                <Package className="w-4 h-4" />
                <span>{fullProduct.stock_available} available</span>
              </div>
            )}
            {fullProduct.available_quantity > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted">
                <Package className="w-4 h-4" />
                <span>{fullProduct.available_quantity} available</span>
              </div>
            )}
            {fullProduct.condition && (
              <div className="flex items-center gap-2 text-sm text-muted">
                <span className="w-4 h-4 flex items-center justify-center text-xs">✓</span>
                <span className="capitalize">{fullProduct.condition}</span>
              </div>
            )}
            {fullProduct.free_delivery && (
              <div className="flex items-center gap-2 text-sm text-muted">
                <span className="w-4 h-4 flex items-center justify-center text-xs">🚚</span>
                <span>Free delivery</span>
              </div>
            )}
          </div>

          {/* Book Button */}
          <button
            onClick={() => { handleClose(); setTimeout(() => onBook?.(fullProduct), 300) }}
            className="w-full py-3 rounded-lg font-medium text-base bg-rausch text-white hover:bg-rausch-active transition-colors"
          >
            Reserve now
          </button>
        </div>
      </div>
    </div>
  )
}
