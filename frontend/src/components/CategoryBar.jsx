import React from 'react'

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
  'Photography': '📷',
  'Music': '🎵',
  'Gaming': '🎮',
  'Kitchen & Dining': '🍳',
  'Garden': '🌿',
  'Health & Beauty': '💄',
  'Kids & Baby': '🧸',
  'Books & Education': '📚',
  'Clothing': '👕',
  'Furniture': '🪑',
  'Home & Living': '🏠',
  'Camping & Outdoors': '🏕️',
  'Other': '📦',
}

export default function CategoryBar({ categories, activeCategory, onSelect }) {
  if (!categories.length) return null

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => onSelect(null)}
          className={`category-pill shrink-0 px-4 py-2 rounded-full text-xs font-medium border transition-all ${
            !activeCategory
              ? 'gradient-bg text-white border-transparent'
              : 'text-gray-500 border-border hover:border-primary/30 hover:text-primary'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`category-pill shrink-0 px-4 py-2 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${
              activeCategory === cat.id
                ? 'gradient-bg text-white border-transparent'
                : 'text-gray-500 border-border hover:border-primary/30 hover:text-primary'
            }`}
          >
            <span>{ICONS[cat.name] || '📦'}</span>
            <span>{cat.name}</span>
            {(cat.item_count || cat.product_count) > 0 && (
              <span className={`text-[10px] ml-0.5 ${activeCategory === cat.id ? 'text-white/70' : 'text-gray-400'}`}>
                ({cat.item_count || cat.product_count})
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
