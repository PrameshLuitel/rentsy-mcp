import React, { useState } from 'react'
import { X, Calendar, User, Mail, Phone, MapPin, CreditCard } from 'lucide-react'
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

  const total = product.price_per_day ? product.price_per_day * form.days : 0
  const deposit = product.deposit || 0

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
    } catch (err) {
      alert('Booking failed. Please try again.')
    }
    setSubmitting(false)
  }

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-md bg-surface rounded-2xl border border-border p-8 text-center shadow-2xl">
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Booking Request Sent!</h3>
          <p className="text-sm text-gray-500 mb-6">The store will confirm your rental shortly.</p>
          <button onClick={onClose} className="gradient-bg text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface rounded-2xl border border-border max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-lg font-bold text-gray-900">Book: {product.name}</h3>
          <button onClick={onClose} className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-colors text-gray-500">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* User Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs text-gray-500 mb-1.5 flex items-center gap-1"><User className="w-3 h-3" /> Full Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full h-10 bg-gray-50 border border-border rounded-xl px-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary" placeholder="John Doe" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs text-gray-500 mb-1.5 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full h-10 bg-gray-50 border border-border rounded-xl px-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary" placeholder="john@email.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</label>
              <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full h-10 bg-gray-50 border border-border rounded-xl px-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary" placeholder="0400 000 000" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 flex items-center gap-1"><MapPin className="w-3 h-3" /> Location</label>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full h-10 bg-gray-50 border border-border rounded-xl px-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary" placeholder="Suburb, State" />
            </div>
          </div>

          {/* Rental Duration */}
          <div>
            <label className="text-xs text-gray-500 mb-1.5 flex items-center gap-1"><Calendar className="w-3 h-3" /> Rental Duration (days)</label>
            <input type="number" min="1" max="90" value={form.days} onChange={(e) => setForm({ ...form, days: Math.max(1, parseInt(e.target.value) || 1) })}
              className="w-full h-10 bg-gray-50 border border-border rounded-xl px-3 text-sm text-gray-900 focus:outline-none focus:border-primary" />
          </div>

          {/* Message */}
          <div>
            <label className="text-xs text-gray-500 mb-1.5">Special requests or notes</label>
            <textarea rows={2} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full bg-gray-50 border border-border rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary resize-none" placeholder="Optional..." />
          </div>

          {/* Pricing Summary */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-border">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">${product.price_per_day}/day × {form.days} day{form.days > 1 ? 's' : ''}</span>
              <span className="text-gray-900 font-medium">${total}</span>
            </div>
            {deposit > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Security deposit (refundable)</span>
                <span className="text-gray-900 font-medium">${deposit}</span>
              </div>
            )}
            <div className="border-t border-border pt-2 flex justify-between text-sm">
              <span className="text-gray-700 font-semibold">Total</span>
              <span className="text-lg font-bold gradient-text">${total + deposit}</span>
            </div>
          </div>

          <button type="submit" disabled={submitting}
            className="w-full py-3 rounded-xl font-semibold gradient-bg text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Confirm Booking
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
