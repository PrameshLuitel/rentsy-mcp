import React, { useRef, useEffect } from 'react'
import gsap from 'gsap'

const ICONS = {
  'Party + Events': '🎉',
  'Wedding': '💍',
  'Kids Parties': '🎈',
  'Corporate Events': '💼',
  'Fashion': '👗',
  'Electronics': '📱',
  'Tools + Machinery': '🔧',
  'Sport + Leisure': '⚽',
  'Services': '🛠️',
  'Automotive': '🚗',
  'Baby + Home': '🏠',
  'Watersports': '🏄',
  'Adventure': '🏔️',
  'Venues + Studios': '🏢',
  'Entertainment': '🎵',
  'Health + Fitness': '💪',
  'Office': '📋',
  'Experiences': '🌟',
}

export default function CategoryStrip({ categories, activeCategory, onSelect }) {
  const stripRef = useRef(null)

  useEffect(() => {
    if (stripRef.current) {
      const pills = stripRef.current.querySelectorAll('.category-pill')
      gsap.fromTo(pills,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.03, ease: 'power2.out', delay: 0.8 }
      )
    }
  }, [categories])

  if (!categories.length) return null

  return (
    <div ref={stripRef} className="mt-8">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => onSelect(null)}
          className={`category-pill ${!activeCategory ? 'active' : ''}`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
          >
            <span className="mr-1.5">{ICONS[cat.name] || '📦'}</span>
            <span>{cat.name}</span>
            {(cat.item_count || cat.product_count) > 0 && (
              <span className={`text-xs ml-1 ${activeCategory === cat.id ? 'text-white/70' : 'text-muted-soft'}`}>
                ({cat.item_count || cat.product_count})
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
