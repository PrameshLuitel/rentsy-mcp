import React from 'react'
import { Loader2 } from 'lucide-react'
import ProductCard from './ProductCard'

export default function ProductGrid({ products, loading, onSelect, onBook }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
        <p className="text-sm text-gray-400">Finding the best rentals for you...</p>
      </div>
    )
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="text-4xl mb-3">🔍</div>
        <p className="text-gray-600 font-medium">No rentals found</p>
        <p className="text-sm text-gray-400 mt-1">Try a different category or search term</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onSelect={onSelect}
          onBook={onBook}
        />
      ))}
    </div>
  )
}
