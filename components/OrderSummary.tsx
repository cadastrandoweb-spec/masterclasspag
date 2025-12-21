import React from 'react';
import { ShieldCheck, ShoppingCart } from 'lucide-react';
import { MAIN_PRODUCT, UPSELL_PRODUCT } from '../constants';

interface OrderSummaryProps {
  upsellSelected: boolean;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({ upsellSelected }) => {
  const total = MAIN_PRODUCT.price + (upsellSelected ? UPSELL_PRODUCT.price : 0);

  return (
    <div className="flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-2">
        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-md flex items-center justify-center text-white text-xs font-bold">
          MT
        </div>
        <span className="font-semibold text-slate-700">Mestres Do Tráfego</span>
      </div>

      {/* Trust Badge */}
      <div className="bg-white rounded-lg py-3 px-4 shadow-sm border border-slate-100 flex items-center justify-center space-x-2 text-slate-600">
        <ShieldCheck size={18} className="text-green-600" />
        <span className="text-sm font-medium tracking-wide">COMPRA SEGURA</span>
      </div>

      {/* Product Image */}
      <div className="relative group -mt-2">
        <div className="aspect-[4/5] w-full max-w-[180px] mx-auto overflow-hidden rounded-xl bg-slate-200 shadow-md">
          <img 
            src={MAIN_PRODUCT.image} 
            alt={MAIN_PRODUCT.name}
            width={560}
            height={700}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover object-center"
          />
        </div>
        <div className="mt-2 text-center">
          <h3 className="text-slate-800 font-medium">{MAIN_PRODUCT.name}</h3>
        </div>
      </div>

      {/* Pricing Summary */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center py-2 text-slate-500 text-sm border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <ShoppingCart size={14} />
            <span>Produto</span>
          </div>
          <span>R$ {MAIN_PRODUCT.price.toFixed(2).replace('.', ',')}</span>
        </div>
        
        {upsellSelected && (
          <div className="flex justify-between items-center py-2 text-slate-500 text-sm border-b border-slate-100 animate-fadeIn">
            <div className="flex items-center space-x-2 text-brand-600">
              <span className="text-xs bg-brand-100 px-2 py-0.5 rounded-full">+ Upsell</span>
            </div>
            <span>R$ {UPSELL_PRODUCT.price.toFixed(2).replace('.', ',')}</span>
          </div>
        )}

        <div className="flex justify-between items-center pt-4">
          <span className="text-slate-600 font-medium">TOTAL</span>
          <span className="text-xl font-bold text-slate-800">
            R$ {total.toFixed(2).replace('.', ',')}
          </span>
        </div>
      </div>
    </div>
  );
};