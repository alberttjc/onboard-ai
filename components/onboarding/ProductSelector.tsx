/**
 * Product Selection Component - Choose which product to onboard
 */

'use client';

import React, { memo } from 'react';
import { OnboardingProduct } from '@/lib/types/onboarding.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Zap } from 'lucide-react';

interface ProductCardProps {
  product: OnboardingProduct;
  onSelect: (productId: string) => void;
  isSelected?: boolean;
}

const ProductCard = memo(({ product, onSelect, isSelected = false }: ProductCardProps) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'hard': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div 
      className={`
        relative p-6 rounded-xl border-2 transition-all duration-300 cursor-pointer
        hover:scale-[1.02] hover:shadow-xl
        ${isSelected 
          ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20' 
          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
        }
      `}
      onClick={() => onSelect(product.id)}
    >
      {/* Product Icon and Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${product.color}20` }}
          >
            {product.icon}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{product.name}</h3>
            <p className="text-sm text-gray-400">{product.category}</p>
          </div>
        </div>
        
        {isSelected && (
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white"></div>
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-gray-300 mb-4 leading-relaxed">
        {product.description}
      </p>

      {/* Metadata Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant="secondary" className="bg-gray-700 text-gray-300">
          <Clock className="w-3 h-3 mr-1" />
          {product.estimatedTime} min
        </Badge>
        
        <Badge variant="secondary" className={getDifficultyColor(product.difficulty)}>
          <Zap className="w-3 h-3 mr-1" />
          {product.difficulty.charAt(0).toUpperCase() + product.difficulty.slice(1)}
        </Badge>
      </div>

      {/* Action Button */}
      <Button 
        className={`
          w-full transition-all duration-300
          ${isSelected 
            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
            : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
          }
        `}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(product.id);
        }}
      >
        {isSelected ? 'Selected ✓' : 'Select'}
      </Button>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute inset-0 rounded-xl border-2 border-blue-500 pointer-events-none">
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </div>
      )}
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

interface ProductSelectorProps {
  products: OnboardingProduct[];
  selectedProductId?: string;
  onProductSelect: (productId: string) => void;
  isLoading?: boolean;
}

const ProductSelector = memo(({ 
  products, 
  selectedProductId, 
  onProductSelect, 
  isLoading = false 
}: ProductSelectorProps) => {
  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">
          Choose Your Experience
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
          Start a free-form conversation or get personalized, voice-guided setup assistance for specific products.
        </p>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onSelect={onProductSelect}
            isSelected={product.id === selectedProductId}
          />
        ))}
      </div>

      {/* Start Button */}
      {selectedProduct && (
        <div className="text-center">

          <p className="text-sm text-gray-400">
            💡 <strong>Tip:</strong> Make sure your microphone is enabled for the best voice experience
          </p>
        </div>
      )}
    </div>
  );
});

ProductSelector.displayName = 'ProductSelector';

export default ProductSelector;
