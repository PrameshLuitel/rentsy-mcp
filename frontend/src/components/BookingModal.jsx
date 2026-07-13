import React, { useState, useRef } from 'react'
import { createBooking } from '../api'

const T = {
  canvas: '#faf9f5',
  surfaceCard: '#efe9de',
  surfaceSoft: '#f5f0e8',
  primary: '#cc785c',
  ink: '#141413',
  body: '#3d3d3a',
  muted: '#6c6a64',
  mutedSoft: '#8e8b82',
  hairline: '#e6dfd8',
  success: '#5db872',
}

export default function BookingModal({ product, onClose }) {
  const [f, setF] = useState({ name: '', email: '', phone: '', location: '', days: 1, msg: '' })
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const r = useRef(null)

  const price = product.price_per_day ?? product.price
  const total = price ? price * f.days : 0
  const deposit = product.deposit || 0

  const submit = async (e) => {
    e.preventDefault(); setBusy(true)
    try {
      await createBooking({ product_id: product.id, renter_name: f.name, renter_email: f.email, renter_phone: f.phone, location: f.location, rental_days: f.days, total_amount: total + deposit, message: f.msg })
      setDone(true)
    } catch (err) { alert('Booking failed') }
    setBusy(false)
  }

  if (done) return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(20,20,19,0.45)' }} onClick={onClose}>
      <div ref={r} style={{ background: T.canvas, borderRadius: 16, padding: 40, maxWidth: 400, width: '100%', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: T.success, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 500, color: T.ink, margin: '0 0 8px', letterSpacing: '-0.02em' }}>Booking Request Sent!</h3>
        <p style={{ fontSize: 14, color: T.muted, margin: '0 0 24px', fontFamily: 'Inter, sans-serif' }}>The store will confirm your rental shortly.</p>
        <button onClick={onClose} style={{ width: '100%', padding: '12px 20px', borderRadius: 8, border: 'none', background: T.primary, color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Done</button>
      </div>
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(20,20,19,0.45)' }} onClick={onClose}>
      <div ref={r} style={{ background: T.canvas, borderRadius: 16, maxHeight: '90vh', overflowY: 'auto', width: '100%', maxWidth: 480, boxShadow: '0 4px 24px rgba(20,20,19,0.12)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${T.hairline}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 500, color: T.ink, margin: 0, letterSpacing: '-0.02em' }}>Book this item</h3>
            <p style={{ fontSize: 13, color: T.muted, margin: '2px 0 0', fontFamily: 'Inter, sans-serif' }}>{product.name}</p>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={submit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: 12, color: T.muted, marginBottom: 4, display: 'block', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>Full name</label>
              <input required value={f.name} onChange={e => setF({...f, name: e.target.value})} placeholder="John Doe"
                style={{ width: '100%', height: 40, borderRadius: 8, border: `1px solid ${T.hairline}`, padding: '0 12px', fontSize: 14, color: T.ink, outline: 'none', background: T.canvas, fontFamily: 'Inter, sans-serif' }} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: 12, color: T.muted, marginBottom: 4, display: 'block', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>Email</label>
              <input type="email" required value={f.email} onChange={e => setF({...f, email: e.target.value})} placeholder="john@email.com"
                style={{ width: '100%', height: 40, borderRadius: 8, border: `1px solid ${T.hairline}`, padding: '0 12px', fontSize: 14, color: T.ink, outline: 'none', background: T.canvas, fontFamily: 'Inter, sans-serif' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: T.muted, marginBottom: 4, display: 'block', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>Phone</label>
              <input required value={f.phone} onChange={e => setF({...f, phone: e.target.value})} placeholder="0400 000 000"
                style={{ width: '100%', height: 40, borderRadius: 8, border: `1px solid ${T.hairline}`, padding: '0 12px', fontSize: 14, color: T.ink, outline: 'none', background: T.canvas, fontFamily: 'Inter, sans-serif' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: T.muted, marginBottom: 4, display: 'block', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>Location</label>
              <input value={f.location} onChange={e => setF({...f, location: e.target.value})} placeholder="Suburb, State"
                style={{ width: '100%', height: 40, borderRadius: 8, border: `1px solid ${T.hairline}`, padding: '0 12px', fontSize: 14, color: T.ink, outline: 'none', background: T.canvas, fontFamily: 'Inter, sans-serif' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: T.muted, marginBottom: 4, display: 'block', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>Rental duration (days)</label>
            <input type="number" min="1" max="90" value={f.days} onChange={e => setF({...f, days: Math.max(1, parseInt(e.target.value) || 1)})}
              style={{ width: '100%', height: 40, borderRadius: 8, border: `1px solid ${T.hairline}`, padding: '0 12px', fontSize: 14, color: T.ink, outline: 'none', background: T.canvas, fontFamily: 'Inter, sans-serif' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: T.muted, marginBottom: 4, display: 'block', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>Special requests</label>
            <textarea rows={2} value={f.msg} onChange={e => setF({...f, msg: e.target.value})} placeholder="Optional..."
              style={{ width: '100%', borderRadius: 8, border: `1px solid ${T.hairline}`, padding: 8, fontSize: 14, color: T.ink, outline: 'none', resize: 'none', background: T.canvas, fontFamily: 'Inter, sans-serif' }} />
          </div>
          <div style={{ background: T.surfaceSoft, borderRadius: 12, padding: 16, border: `1px solid ${T.hairline}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>
              <span style={{ color: T.muted }}>${price}/day × {f.days} day{f.days > 1 ? 's' : ''}</span>
              <span style={{ color: T.ink, fontWeight: 500 }}>${total}</span>
            </div>
            {deposit > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>
              <span style={{ color: T.muted }}>Security deposit</span>
              <span style={{ color: T.ink, fontWeight: 500 }}>${deposit}</span>
            </div>}
            <div style={{ borderTop: `1px solid ${T.hairline}`, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontFamily: 'Inter, sans-serif' }}>
              <span style={{ fontWeight: 600, color: T.ink }}>Total</span>
              <span style={{ fontSize: 18, fontWeight: 500, color: T.primary }}>${total + deposit}</span>
            </div>
          </div>
          <button type="submit" disabled={busy}
            style={{ width: '100%', padding: '12px 20px', borderRadius: 8, border: 'none', background: T.primary, color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', opacity: busy ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'Inter, sans-serif' }}>
            {busy ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Submitting...</> : 'Confirm booking'}
          </button>
        </form>
      </div>
    </div>
  )
}
