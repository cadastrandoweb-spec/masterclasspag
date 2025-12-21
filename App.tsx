import React, { useState } from 'react';
import { OrderSummary } from './components/OrderSummary';
import { CheckoutForm } from './components/CheckoutForm';
import { PaymentMethod, OrderForm, PaymentState, PixPaymentData } from './types';
import { processCheckout } from './services/mockService';

const App: React.FC = () => {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';

  if (pathname === '/obrigado') {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex justify-center">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg border border-slate-100 p-6 md:p-10">
          <h1 className="text-2xl font-bold text-slate-800">Pagamento aprovado!</h1>
          <p className="mt-3 text-slate-600">
            Seu acesso será liberado automaticamente.
          </p>
          <p className="mt-2 text-slate-500 text-sm">
            Você já pode fechar esta página.
          </p>
        </div>
      </div>
    );
  }

  // --- STATE ---
  const [upsellSelected, setUpsellSelected] = useState<boolean>(false);
  
  const [formData, setFormData] = useState<OrderForm>({
    name: '',
    email: '',
    phone: '',
    document: '',
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.PIX);
  
  const [paymentState, setPaymentState] = useState<PaymentState>({
    method: PaymentMethod.PIX,
    isProcessing: false,
    isSuccess: false,
    error: null
  });

  const [pixPayment, setPixPayment] = useState<PixPaymentData | null>(null);

  const [errors, setErrors] = useState<Partial<Record<keyof OrderForm, string>>>({});

  // --- LOGIC ---
  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof OrderForm, string>> = {};
    let isValid = true;

    if (!formData.name.trim() || formData.name.length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres.';
      isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = 'Insira um e-mail válido.';
      isValid = false;
    }

    if (!formData.phone || formData.phone.length < 10) {
      newErrors.phone = 'Telefone inválido.';
      isValid = false;
    }

    // Basic length check for Document (CPF/CNPJ)
    const cleanDoc = formData.document.replace(/\D/g, '');
    if (cleanDoc.length !== 11 && cleanDoc.length !== 14) {
      newErrors.document = 'CPF ou CNPJ inválido.';
      isValid = false;
    }

    if (!formData.zipCode || formData.zipCode.length < 8) {
      newErrors.zipCode = 'CEP inválido.';
      isValid = false;
    }

    if (!formData.street.trim()) {
      newErrors.street = 'Endereço obrigatório.';
      isValid = false;
    }

    if (!formData.number.trim()) {
      newErrors.number = 'Número obrigatório.';
      isValid = false;
    }

    if (!formData.neighborhood.trim()) {
      newErrors.neighborhood = 'Bairro obrigatório.';
      isValid = false;
    }

    if (!formData.city.trim()) {
      newErrors.city = 'Cidade obrigatória.';
      isValid = false;
    }

    if (!formData.state.trim()) {
      newErrors.state = 'Estado obrigatório.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      // Scroll to top or show toast
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setPaymentState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const result = await processCheckout(formData, paymentMethod, upsellSelected);
      
      if (result.success) {
        if (paymentMethod === PaymentMethod.PIX && result.paymentId) {
          setPixPayment({
            paymentId: result.paymentId,
            qrCode: result.qrCode,
            qrCodeBase64: result.qrCodeBase64,
            ticketUrl: result.ticketUrl
          });
        }

        setPaymentState(prev => ({ ...prev, isSuccess: true }));
      }
    } catch (err) {
      setPaymentState(prev => ({ ...prev, error: 'Erro ao processar pagamento.' }));
    } finally {
      setPaymentState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN (Summary) - Takes 4 cols on desktop */}
        <div className="md:col-span-4 order-1 md:order-1">
          <div className="sticky top-8">
             <OrderSummary upsellSelected={upsellSelected} />
          </div>
        </div>

        {/* RIGHT COLUMN (Form) - Takes 8 cols on desktop */}
        <div className="md:col-span-8 order-2 md:order-2">
          <CheckoutForm 
            formData={formData}
            setFormData={setFormData}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            upsellSelected={upsellSelected}
            setUpsellSelected={setUpsellSelected}
            onSubmit={handleSubmit}
            isProcessing={paymentState.isProcessing}
            errors={errors}
            pixPayment={pixPayment}
          />
        </div>

      </div>
    </div>
  );
};

export default App;