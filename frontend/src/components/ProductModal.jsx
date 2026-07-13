import React, { useState, useEffect, useRef } from 'react'
import { X, ChevronDown, ChevronUp } from 'lucide-react'
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
  const cardRef = useRef(null)
  const img = imageUrl(fullProduct)

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(cardRef.current, { y: 30, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.3, ease: 'power3.out' })
    }
  }, [])

  useEffect(() => {
    if (product.id && !product.description) {
      setLoading(true)
      getProduct(product.id).then((d) => { if (d) setFullProduct(d) }).catch(() => {}).finally(() => setLoading(false))
    }
  }, [product.id])

  const handleClose = () => {
    if (cardRef.current) {
      gsap.to(cardRef.current, { y: 20, opacity: 0, scale: 0.97, duration: 0.15, ease: 'power2.in', onComplete: onClose })
    } else { onClose() }
  }

  const price = fullProduct.price_per_day ?? fullProduct.price
  const weekly = fullProduct.price_per_week ?? (price ? price * 5 : null)
  const deposit = fullProduct.deposit

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div ref={cardRef} className="modal-card max-w-[640px]" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <div className="aspect-video bg-[#F4F5F7]">
            {img ? <img src={img} alt={fullProduct.name} className="w-full h-full object-cover" /> : (
              <div className="w-full h-full flex items-center justify-center text-5xl">📦</div>
            )}
          </div>
          <button onClick={handleClose} className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors">
            <X className="w-4 h-4 text-[#101B30]" />
          </button>
          {fullProduct.free_delivery && (
            <span className="absolute top-3 right-3 text-xs font-semibold bg-white/90 text-[#101B30] px-3 py-1 rounded-[8px] shadow-sm">Free Delivery</span>
          )}
        </div>

        <div className="p-5">
          <h2 className="text-lg font-bold text-[#101B30] mb-1">{fullProduct.name}</h2>
          <p className="text-sm text-[#707683] mb-3">{fullProduct.store_name} · {fullProduct.location || `${fullProduct.location_suburb || ''} ${fullProduct.location_city || ''}`.trim() || 'Gold Coast'}</p>

          <div className="flex flex-wrap gap-2 mb-4">
            {price && (
              <div className="bg-[#F4F5F7] rounded-[12px] px-4 py-2.5 text-center min-w-[90px]">
                <div className="text-base font-bold text-[#D42B65]">${price}</div>
                <div className="text-[10px] text-[#707683] uppercase tracking-wider">Per {method}</div>
              </div>
            )}
            {weekly && (
              <div className="bg-[#F4F5F7] rounded-[12px] px-4 py-2.5 text-center min-w-[90px]">
                <div className="text-base font-bold text-[#D42B65]">${weekly}</div>
                <div className="text-[10px] text-[#707683] uppercase tracking-wider">Per week</div>
              </div>
            )}
            {deposit && (
              <div className="bg-[#F4F5F7] rounded-[12px] px-4 py-2.5 text-center min-w-[90px]">
                <div className="text-base font-bold text-[#101B30]">${deposit}</div>
                <div className="text-[10px] text-[#707683] uppercase tracking-wider">Deposit</div>
              </div>
            )}
          </div>

          {fullProduct.description && (
            <div className="mb-4">
              <p className={`text-sm text-[#404959] leading-relaxed ${!showMore ? 'line-clamp-3' : ''}`}>{fullProduct.description}</p>
              {fullProduct.description.length > 150 && (
                <button onClick={() => setShowMore(!showMore)} className="text-xs text-[#D42B65] hover:underline mt-1 flex items-center gap-0.5">
                  {showMore ? 'Show less' : 'Show more'}
                  {showMore ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-5">
            {(fullProduct.stock_available > 0 || fullProduct.available_quantity > 0) && (
              <div className="flex items-center gap-2 text-sm text-[#707683]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#707683" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                <span>{fullProduct.stock_available || fullProduct.available_quantity} available</span>
              </div>
            )}
            {fullProduct.free_delivery && (
              <div className="flex items-center gap-2 text-sm text-[#707683]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#707683" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                <span>Free delivery</span>
              </div>
            )}
          </div>

          <button
            onClick={() => { handleClose(); setTimeout(() => onBook?.(fullProduct), 300) }}
            className="w-full py-3 rounded-[12px] font-medium text-base bg-[#D42B65] text-white hover:bg-[#EE4E86] transition-colors"
          >
            Reserve now
          </button>
        </div>
      </div>
    </div>
  )
}
