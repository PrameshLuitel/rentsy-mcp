import React, { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import gsap from 'gsap'
import { createBooking } from '../api'

export default function BookingModal({ product, onClose }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', location: '', days: 1, message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const cardRef = useRef(null)

  const price = product.price_per_day ?? product.price
  const total = price ? price * form.days : 0
  const deposit = product.deposit || 0

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(cardRef.current, { y: 30, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.3, ease: 'power3.out' })
    }
  }, [])

  const handleClose = () => {
    if (cardRef.current) {
      gsap.to(cardRef.current, { y: 20, opacity: 0, scale: 0.97, duration: 0.15, ease: 'power2.in', onComplete: onClose })
    } else { onClose() }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createBooking({
        product_id: product.id, renter_name: form.name, renter_email: form.email,
        renter_phone: form.phone, location: form.location, rental_days: form.days,
        total_amount: total + deposit, message: form.message,
      })
      setDone(true)
      if (cardRef.current) {
        gsap.fromTo(cardRef.current.querySelector('.check-anim'), { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2)' })
      }
    } catch (err) { alert('Booking failed. Please try again.') }
    setSubmitting(false)
  }

  if (done) {
    return (
      <div className="modal-overlay" onClick={handleClose}>
        <div ref={cardRef} className="modal-card max-w-md p-8 text-center" onClick={(e) => e.stopPropagation()}>
          <div className="check-anim w-14 h-14 rounded-full bg-[#3CD984] flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h3 className="text-lg font-bold text-[#101B30] mb-2">Booking Request Sent!</h3>
          <p className="text-sm text-[#707683] mb-6">The store will confirm your rental shortly.</p>
          <button onClick={handleClose} className="w-full py-3 rounded-[12px] font-medium bg-[#D42B65] text-white hover:bg-[#EE4E86] transition-colors">Done</button>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div ref={cardRef} className="modal-card max-w-[480px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[#E7E8EA]">
          <div>
            <h3 className="text-base font-bold text-[#101B30]">Book this item</h3>
            <p className="text-sm text-[#707683] mt-0.5">{product.name}</p>
          </div>
          <button onClick={handleClose} className="w-7 h-7 rounded-full hover:bg-[#F4F5F7] flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-[#707683]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs text-[#707683] font-medium mb-1 block">Full name</label>
              <input required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                className="w-full h-10 border border-[#CFD1D6] rounded-[8px] px-3 text-sm text-[#101B30] placeholder-[#9FA4AC] outline-none focus:border-[#D42B65] transition-colors" placeholder="John Doe" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs text-[#707683] font-medium mb-1 block">Email</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({...form, email: e.target.value})}
                className="w-full h-10 border border-[#CFD1D6] rounded-[8px] px-3 text-sm text-[#101B30] placeholder-[#9FA4AC] outline-none focus:border-[#D42B65] transition-colors" placeholder="john@email.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#707683] font-medium mb-1 block">Phone</label>
              <input required value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})}
                className="w-full h-10 border border-[#CFD1D6] rounded-[8px] px-3 text-sm text-[#101B30] placeholder-[#9FA4AC] outline-none focus:border-[#D42B65] transition-colors" placeholder="0400 000 000" />
            </div>
            <div>
              <label className="text-xs text-[#707683] font-medium mb-1 block">Location</label>
              <input value={form.location} onChange={(e) => setForm({...form, location: e.target.value})}
                className="w-full h-10 border border-[#CFD1D6] rounded-[8px] px-3 text-sm text-[#101B30] placeholder-[#9FA4AC] outline-none focus:border-[#D42B65] transition-colors" placeholder="Suburb, State" />
            </div>
          </div>
          <div>
            <label className="text-xs text-[#707683] font-medium mb-1 block">Rental duration (days)</label>
            <input type="number" min="1" max="90" value={form.days} onChange={(e) => setForm({...form, days: Math.max(1, parseInt(e.target.value) || 1)})}
              className="w-full h-10 border border-[#CFD1D6] rounded-[8px] px-3 text-sm text-[#101B30] outline-none focus:border-[#D42B65] transition-colors" />
          </div>
          <div>
            <label className="text-xs text-[#707683] font-medium mb-1 block">Special requests</label>
            <textarea rows={2} value={form.message} onChange={(e) => setForm({...form, message: e.target.value})}
              className="w-full border border-[#CFD1D6] rounded-[8px] px-3 py-2 text-sm text-[#101B30] placeholder-[#9FA4AC] outline-none focus:border-[#D42B65] transition-colors resize-none" placeholder="Optional..." />
          </div>

          <div className="bg-[#F9F9F9] rounded-[12px] p-4 space-y-2 border border-[#E7E8EA]">
            <div className="flex justify-between text-sm"><span className="text-[#707683]">${price}/{product.price_method?.replace(/_/g, ' ') || 'day'} × {form.days} day{form.days > 1 ? 's' : ''}</span><span className="text-[#101B30] font-medium">${total}</span></div>
            {deposit > 0 && <div className="flex justify-between text-sm"><span className="text-[#707683]">Security deposit (refundable)</span><span className="text-[#101B30] font-medium">${deposit}</span></div>}
            <div className="border-t border-[#E7E8EA] pt-2 flex justify-between"><span className="text-[#101B30] font-semibold">Total</span><span className="text-lg font-bold text-[#D42B65]">${total + deposit}</span></div>
          </div>

          <button type="submit" disabled={submitting}
            className="w-full py-3 rounded-[12px] font-medium text-base bg-[#D42B65] text-white hover:bg-[#EE4E86] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
            ) : 'Confirm booking'}
          </button>
        </form>
      </div>
    </div>
  )
}
