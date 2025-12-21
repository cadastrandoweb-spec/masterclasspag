import React, { useState } from 'react';
import { CreditCard, QrCode, CheckSquare, Square, AlertCircle, Lock, MapPin } from 'lucide-react';
import { PaymentMethod, OrderForm } from '../types';
import { Input } from './ui/Input';
import { UPSELL_PRODUCT } from '../constants';

interface CheckoutFormProps {
  formData: OrderForm;
  setFormData: React.Dispatch<React.SetStateAction<OrderForm>>;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  upsellSelected: boolean;
  setUpsellSelected: (selected: boolean) => void;
  onSubmit: () => void;
  isProcessing: boolean;
  errors: Partial<Record<keyof OrderForm, string>>;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({
  formData,
  setFormData,
  paymentMethod,
  setPaymentMethod,
  upsellSelected,
  setUpsellSelected,
  onSubmit,
  isProcessing,
  errors
}) => {
  const [loadingCep, setLoadingCep] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length === 8) {
      setLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf,
            // Clear address number if it was set, or keep it? usually keep blank to force entry
          }));
        } else {
            // Handle CEP not found if needed
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 md:p-8">
      
      {/* SECTION 1: USER DATA */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center">
          OS SEUS DADOS
        </h2>
        
        <div className="space-y-5">
          <Input 
            label="Nome e sobrenome" 
            name="name" 
            required 
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Digite seu nome completo"
            error={!!errors.name}
            errorMessage={errors.name}
          />
          
          <Input 
            label="E-mail" 
            name="email" 
            type="email" 
            required 
            value={formData.email}
            onChange={handleInputChange}
            placeholder="seu@email.com"
            error={!!errors.email}
            errorMessage={errors.email}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="relative">
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Celular <span className="text-brand-600">*</span>
              </label>
              <div className="flex border-b-2 border-slate-200 focus-within:border-brand-600 transition-colors">
                 <div className="flex items-center pr-2 border-r border-slate-200">
                    {/* Simple flag representation */}
                    <span role="img" aria-label="Brasil" className="text-lg mr-1">🇧🇷</span>
                    <span className="text-slate-500 text-sm">+55</span>
                 </div>
                 <input 
                    name="phone"
                    className="w-full bg-transparent py-2 pl-3 text-slate-800 focus:outline-none placeholder-slate-400"
                    placeholder="(00) 00000-0000"
                    value={formData.phone}
                    onChange={handleInputChange}
                 />
              </div>
               {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
            </div>

            <Input 
              label="CPF / CNPJ" 
              name="document" 
              required 
              value={formData.document}
              onChange={handleInputChange}
              placeholder="000.000.000-00"
              error={!!errors.document}
              errorMessage={errors.document}
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: ADDRESS */}
      <div className="mb-8 border-t border-slate-100 pt-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
           <MapPin size={20} className="text-brand-600" />
           ENDEREÇO
        </h2>
        
        <div className="space-y-5">
           <div className="w-full md:w-1/2">
             <Input 
               label="CEP" 
               name="zipCode" 
               required 
               value={formData.zipCode}
               onChange={handleInputChange}
               onBlur={handleCepBlur}
               placeholder="00000-000"
               error={!!errors.zipCode}
               errorMessage={errors.zipCode}
             />
             {loadingCep && <p className="text-xs text-brand-600 mt-1">Buscando endereço...</p>}
           </div>

           {/* Address Fields - displayed only if CEP has value (or always, but auto-filled) */}
           <div className="grid grid-cols-1 md:grid-cols-12 gap-5 animate-fadeIn">
              <div className="md:col-span-8">
                 <Input 
                   label="Endereço" 
                   name="street" 
                   required 
                   value={formData.street}
                   onChange={handleInputChange}
                   placeholder="Rua, Avenida, etc."
                   error={!!errors.street}
                   errorMessage={errors.street}
                 />
              </div>
              <div className="md:col-span-4">
                 <Input 
                   label="Número" 
                   name="number" 
                   required 
                   value={formData.number}
                   onChange={handleInputChange}
                   placeholder="123"
                   error={!!errors.number}
                   errorMessage={errors.number}
                 />
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input 
                label="Complemento" 
                name="complement" 
                value={formData.complement}
                onChange={handleInputChange}
                placeholder="Apto, Bloco, etc. (Opcional)"
              />
              <Input 
                label="Bairro" 
                name="neighborhood" 
                required 
                value={formData.neighborhood}
                onChange={handleInputChange}
                placeholder="Bairro"
                error={!!errors.neighborhood}
                errorMessage={errors.neighborhood}
              />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input 
                label="Cidade" 
                name="city" 
                required 
                value={formData.city}
                onChange={handleInputChange}
                placeholder="Cidade"
                error={!!errors.city}
                errorMessage={errors.city}
                readOnly // Usually easier if read-only from API, but can be editable
                className="bg-slate-50 opacity-90"
              />
              <Input 
                label="Estado" 
                name="state" 
                required 
                value={formData.state}
                onChange={handleInputChange}
                placeholder="UF"
                error={!!errors.state}
                errorMessage={errors.state}
                readOnly
                className="bg-slate-50 opacity-90"
              />
           </div>
        </div>
      </div>

      {/* SECTION 3: PAYMENT METHOD */}
      <div className="mb-8 border-t border-slate-100 pt-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          MÉTODO DE PAGAMENTO
        </h2>

        <div className="space-y-4">
          {/* PIX Option */}
          <div 
            onClick={() => setPaymentMethod(PaymentMethod.PIX)}
            className={`cursor-pointer rounded-lg p-0 transition-all duration-200 ${paymentMethod === PaymentMethod.PIX ? '' : 'opacity-70 hover:opacity-100'}`}
          >
            <div className="flex items-center space-x-3 mb-2">
               <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === PaymentMethod.PIX ? 'border-brand-600' : 'border-slate-300'}`}>
                  {paymentMethod === PaymentMethod.PIX && <div className="w-2.5 h-2.5 rounded-full bg-brand-600" />}
               </div>
               <div className="flex items-center space-x-2 text-brand-600 font-bold">
                 <QrCode size={20} />
                 <span>PIX</span>
               </div>
            </div>

            {paymentMethod === PaymentMethod.PIX && (
              <div className="ml-8 border border-slate-200 rounded-lg p-4 bg-slate-50 text-sm text-slate-600">
                <div className="flex items-start space-x-2 mb-2 text-brand-600 font-semibold">
                  <AlertCircle size={16} className="mt-0.5" />
                  <span>ATENÇÃO A ESTES DETALHES:</span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-slate-500 text-xs">
                  <li>Somente à vista;</li>
                  <li>O(s) produto(s) será(ão) liberado(s) somente após recebermos a confirmação de pagamento;</li>
                  <li>Fique atento(a) à data de vencimento. Após a expiração, será necessário refazer seu pedido.</li>
                </ul>
              </div>
            )}
          </div>

          {/* Credit Card Option */}
          <div 
            onClick={() => setPaymentMethod(PaymentMethod.CREDIT_CARD)}
            className={`cursor-pointer flex items-center space-x-3 ${paymentMethod === PaymentMethod.CREDIT_CARD ? '' : 'opacity-70 hover:opacity-100'}`}
          >
             <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === PaymentMethod.CREDIT_CARD ? 'border-brand-600' : 'border-slate-300'}`}>
                  {paymentMethod === PaymentMethod.CREDIT_CARD && <div className="w-2.5 h-2.5 rounded-full bg-brand-600" />}
             </div>
             <div className="flex items-center space-x-2 text-slate-700 font-medium">
               <CreditCard size={20} />
               <span>Cartão de Crédito</span>
             </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: UPSELL / ORDER BUMP */}
      <div className="mb-8">
         <div className="bg-brand-50 border-2 border-dashed border-brand-200 rounded-xl p-4 relative overflow-hidden">
            {/* Decorative background circle */}
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-brand-100 rounded-full opacity-50 pointer-events-none"></div>

            <p className="font-bold text-slate-800 text-sm mb-3 relative z-10">
              ACEITO ESSA OFERTA! Aprenda deixar a Home Page do seu site turbinada e super otimizada!
            </p>

            <div className="flex items-start space-x-3 relative z-10">
              <button 
                onClick={() => setUpsellSelected(!upsellSelected)}
                className="mt-1 text-brand-600 hover:text-brand-700 transition-colors focus:outline-none"
              >
                {upsellSelected ? <CheckSquare size={24} /> : <Square size={24} />}
              </button>

              <div className="flex space-x-3 flex-1">
                 <div className="w-16 h-16 bg-black rounded-md overflow-hidden shrink-0">
                    <img src={UPSELL_PRODUCT.image} alt="Upsell" className="w-full h-full object-cover" />
                 </div>
                 <div>
                    <h4 className="font-semibold text-slate-700 text-sm">{UPSELL_PRODUCT.name}</h4>
                    <span className="font-bold text-slate-900 text-sm">R$ {UPSELL_PRODUCT.price.toFixed(2).replace('.', ',')}</span>
                 </div>
              </div>
            </div>
         </div>
      </div>

      {/* SUBMIT */}
      <div>
        {hasErrors && (
          <div className="mb-4 bg-red-100 text-red-600 text-sm py-2 px-3 rounded-md text-center font-medium">
            *Existem campos inválidos ou não preenchidos
          </div>
        )}
        
        <button
          onClick={onSubmit}
          disabled={isProcessing}
          className={`
            w-full py-4 rounded-lg shadow-lg text-white font-bold text-lg uppercase tracking-wide
            flex items-center justify-center space-x-2
            transition-all duration-200
            ${isProcessing 
              ? 'bg-slate-400 cursor-not-allowed' 
              : 'bg-brand-500 hover:bg-brand-600 hover:shadow-xl hover:-translate-y-0.5'
            }
          `}
        >
          {isProcessing ? (
             <span>Processando...</span>
          ) : (
             <>
               <Lock size={20} />
               <span>Comprar Agora</span>
             </>
          )}
        </button>
        
        <p className="mt-4 text-center text-xs text-slate-400 italic">
          Ao seguir para o processo de pagamento declaro estar de acordo com os <a href="#" className="underline hover:text-slate-500">termos de uso</a>.
        </p>
      </div>

    </div>
  );
};