import React from 'react';
import { Product } from '@/types/shipt';

interface ProductListProps {
  products: Product[];
}

const ProductList: React.FC<ProductListProps> = ({ products }) => {
  if (products.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">Found Products</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product, index) => (
          <div 
            key={index}
            className="flex flex-col bg-white rounded-lg shadow overflow-hidden"
          >
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-4 space-y-2">
              <h4 className="font-semibold text-lg">{product.name}</h4>
              <p className="text-sm text-gray-600">{product.description}</p>
              <div className="flex justify-between items-center pt-2">
                <span className="font-bold text-lg">
                  ${product.price.toFixed(2)}
                </span>
                <span className="text-sm text-gray-500">
                  Qty: {product.quantity}
                </span>
              </div>
            </div>
          </div>
        ))}
        <div className="col-span-full mt-4 p-4 bg-white rounded-lg shadow">
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>
              ${products.reduce((sum, p) => sum + p.price, 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductList;