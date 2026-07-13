import React from 'react'
import ProductCard from './ProductCard'

export default function ProductGrid({ products, loading, onSelect, onBook }) {
  if (loading) {
    return (
      <div className="text-center py-24">
        <div className="w-10 h-10 border-2 border-[#D42B65] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-[#707683]">Finding the best rentals for you...</p>
      </div>
    )
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="text-4xl mb-3">🔍</div>
        <p className="text-[#101B30] font-medium">No rentals found</p>
        <p className="text-sm text-[#707683] mt-1">Try a different category or search term</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
      {products.map((product, i) => (
        <ProductCard
          key={product.id || i}
          product={product}
          onSelect={onSelect}
          onBook={onBook}
        />
      ))}
    </div>
  )
}
