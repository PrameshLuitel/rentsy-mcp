import React from 'react'

export default function StatsBar({ stats }) {
  return (
    <div className="flex items-center justify-center gap-6 md:gap-10 mt-6">
      {[
        { label: 'Products', value: stats.total_products || 0 },
        { label: 'Stores', value: stats.total_stores || 0 },
        { label: 'Categories', value: stats.total_categories || 0 },
        { label: 'Bookings', value: stats.total_bookings || 0 },
      ].map((s) => (
        <div key={s.label} className="text-center">
          <div className="text-lg md:text-2xl font-bold gradient-text">{s.value.toLocaleString()}+</div>
          <div className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider">{s.label}</div>
        </div>
      ))}
    </div>
  )
}
