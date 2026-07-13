import React, { useState, useRef, useEffect } from 'react'
import { X, Calendar, User, Mail, Phone, MapPin, CreditCard, Check } from 'lucide-react'
import gsap from 'gsap'
import { createBooking } from '../api'

export default function BookingModal({ product, onClose }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    days: 1,
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const cardRef = useRef(null)

  const price = product.price_per_day ?? product.price
  const total = price ? price * form.days : 0
  const deposit = product.deposit || 0

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(cardRef.current,
        { y: 40, opacity: 0, scale: 0.96 },
        { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'power3.out' }
      )
    }
  }, [])

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createBooking({
        product_id: product.id,
        renter_name: form.name,
        renter_email: form.email,
        renter_phone: form.phone,
        location: form.location,
        rental_days: form.days,
        total_amount: total + deposit,
        message: form.message,
      })
      setDone(true)
      if (cardRef.current) {
        gsap.fromTo(cardRef.current.querySelector('.success-anim'),
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)' }
        )
      }
    } catch (err) {
      alert('Booking failed. Please try again.')
    }
    setSubmitting(false)
  }

  if (done) {
    return (
      <div className="modal-overlay" onClick={handleClose}>
        <div ref={cardRef} className="modal-card max-w-md p-8 text-center" onClick={(e) => e.stopPropagation()}>
          <div className="success-anim w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-ink mb-2">Booking Request Sent!</h3>
          <p className="text-sm text-muted mb-6">The store will confirm your rental shortly.</p>
          <button onClick={handleClose} className="btn-primary w-full">
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div ref={cardRef} className="modal-card max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-hairline">
          <div>
            <h3 className="text-lg font-semibold text-ink">Book this item</h3>
            <p className="text-sm text-muted mt-0.5">{product.name}</p>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-full hover:bg-surface-soft flex items-center justify-center text-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-medium text-muted mb-1.5 flex items-center gap-1"><User className="w-3 h-3" /> Full name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full h-11 bg-canvas border border-hairline rounded-lg px-3 text-sm text-ink placeholder-muted focus:outline-none focus:border-ink focus:border-2 transition-colors" placeholder="John Doe" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-medium text-muted mb-1.5 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full h-11 bg-canvas border border-hairline rounded-lg px-3 text-sm text-ink placeholder-muted focus:outline-none focus:border-ink focus:border-2 transition-colors" placeholder="john@email.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted mb-1.5 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</label>
              <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full h-11 bg-canvas border border-hairline rounded-lg px-3 text-sm text-ink placeholder-muted focus:outline-none focus:border-ink focus:border-2 transition-colors" placeholder="0400 000 000" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted mb-1.5 flex items-center gap-1"><MapPin className="w-3 h-3" /> Location</label>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full h-11 bg-canvas border border-hairline rounded-lg px-3 text-sm text-ink placeholder-muted focus:outline-none focus:border-ink focus:border-2 transition-colors" placeholder="Suburb, State" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted mb-1.5 flex items-center gap-1"><Calendar className="w-3 h-3" /> Rental duration (days)</label>
            <input type="number" min="1" max="90" value={form.days} onChange={(e) => setForm({ ...form, days: Math.max(1, parseInt(e.target.value) || 1) })}
              className="w-full h-11 bg-canvas border border-hairline rounded-lg px-3 text-sm text-ink focus:outline-none focus:border-ink focus:border-2 transition-colors" />
          </div>

          <div>
            <label className="text-xs font-medium text-muted mb-1.5">Special requests</label>
            <textarea rows={2} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:border-ink focus:border-2 transition-colors resize-none" placeholder="Optional..." />
          </div>

          {/* Pricing Summary */}
          <div className="bg-surface-soft rounded-lg p-4 space-y-2 border border-hairline">
            <div className="flex justify-between text-sm">
              <span className="text-muted">${price}/{product.price_method?.replace(/_/g, ' ') || 'day'} × {form.days} day{form.days > 1 ? 's' : ''}</span>
              <span className="text-ink font-medium">${total}</span>
            </div>
            {deposit > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">Security deposit (refundable)</span>
                <span className="text-ink font-medium">${deposit}</span>
              </div>
            )}
            <div className="border-t border-hairline pt-2 flex justify-between">
              <span className="text-ink font-semibold">Total</span>
              <span className="text-lg font-bold text-rausch">${total + deposit}</span>
            </div>
          </div>

          <button type="submit" disabled={submitting}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Confirm booking
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
