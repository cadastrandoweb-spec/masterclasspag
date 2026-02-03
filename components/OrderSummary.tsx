import React from 'react';
import { ShieldCheck, ShoppingCart } from 'lucide-react';
import { MAIN_PRODUCT, UPSELL_PRODUCT, UPSELL2_PRODUCT } from '../constants';

interface OrderSummaryProps {
  upsellSelected: boolean;
  upsell2Selected: boolean;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({ upsellSelected, upsell2Selected }) => {
  const total =
    MAIN_PRODUCT.price +
    (upsellSelected ? UPSELL_PRODUCT.price : 0) +
    (upsell2Selected ? UPSELL2_PRODUCT.price : 0);
  const supportPhotoUrl = String(import.meta.env.VITE_SUPPORT_PHOTO_URL || '').trim();

  return (
    <div className="flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-2">
        <img
          src="/logo.png"
          alt="Mestres Do Tráfego"
          width={128}
          height={32}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="h-8 w-auto"
        />
      </div>

      {supportPhotoUrl && (
        <div className="bg-white rounded-lg py-3 px-4 shadow-sm border border-slate-100 flex items-center gap-3">
          <img
            src={supportPhotoUrl}
            alt="Suporte"
            width={44}
            height={44}
            loading="eager"
            decoding="async"
            className="w-11 h-11 rounded-full object-cover border border-slate-200"
          />
          <div className="text-sm text-slate-700 font-medium leading-tight">
            Suporte direto com Alexandre e Equipe
          </div>
        </div>
      )}

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

        {upsell2Selected && (
          <div className="flex justify-between items-center py-2 text-slate-500 text-sm border-b border-slate-100 animate-fadeIn">
            <div className="flex items-center space-x-2 text-brand-600">
              <span className="text-xs bg-brand-100 px-2 py-0.5 rounded-full">+ Upsell 2</span>
            </div>
            <span>R$ {UPSELL2_PRODUCT.price.toFixed(2).replace('.', ',')}</span>
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