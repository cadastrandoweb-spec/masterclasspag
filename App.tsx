import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle } from 'lucide-react';
import { OrderSummary } from './components/OrderSummary';
import { CheckoutForm } from './components/CheckoutForm';
import { CardPaymentData, PaymentMethod, OrderForm, PaymentState, PixPaymentData } from './types';
import { processCheckout } from './services/mockService';
import { MAIN_PRODUCT, UPSELL_PRODUCT, UPSELL2_PRODUCT, WHATSAPP_NUMBER } from './constants';

const App: React.FC = () => {

  // --- STATE ---
  const [upsellSelected, setUpsellSelected] = useState<boolean>(false);
  const [upsell2Selected, setUpsell2Selected] = useState<boolean>(false);
  const [showTopNotice, setShowTopNotice] = useState<boolean>(true);
  const fbInitiateTrackedRef = useRef(false);
  const initiateCheckoutSentRef = useRef(false);
  const initiateCheckoutEventIdRef = useRef<string | null>(null);
  const gaBeginCheckoutSentRef = useRef(false);
  const gaPurchaseSentRef = useRef(false);

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

  const totalAmount =
    MAIN_PRODUCT.price +
    (upsellSelected ? UPSELL_PRODUCT.price : 0) +
    (upsell2Selected ? UPSELL2_PRODUCT.price : 0);

  const whatsappNumber = String(WHATSAPP_NUMBER || '').replace(/\D/g, '');
  const whatsappLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Oi! Estou com uma dúvida no pagamento. Pode me ajudar?')}`
    : null;

  const trackFbEvent = (eventName: string, params?: Record<string, any>) => {
    const fbq = (window as any)?.fbq;
    if (typeof fbq !== 'function') return;
    try {
      fbq('track', eventName, params);
    } catch {
      // ignore
    }
  };

  const trackGaEvent = (eventName: string, params?: Record<string, any>) => {
    const gtag = (window as any)?.gtag;
    if (typeof gtag !== 'function') return;
    try {
      gtag('event', eventName, params);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    // keep ref for backward compatibility; InitiateCheckout is now fired on submit
    fbInitiateTrackedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      setShowTopNotice(y < 10);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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

    const cleanZip = formData.zipCode.replace(/\D/g, '');
    if (cleanZip.length !== 8) {
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

  const handleSubmit = async (cardPaymentData?: (CardPaymentData & { paymentMethodId?: string })) => {
    setPaymentState(prev => ({ ...prev, error: null }));
    if (!validate()) {
      // Scroll to top or show toast
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!gaBeginCheckoutSentRef.current) {
      gaBeginCheckoutSentRef.current = true;
      const items = [
        {
          item_id: MAIN_PRODUCT.id,
          item_name: MAIN_PRODUCT.name,
          price: Number(MAIN_PRODUCT.price.toFixed(2)),
          quantity: 1,
        },
        ...(upsellSelected
          ? [{
              item_id: UPSELL_PRODUCT.id,
              item_name: UPSELL_PRODUCT.name,
              price: Number(UPSELL_PRODUCT.price.toFixed(2)),
              quantity: 1,
            }]
          : []),
        ...(upsell2Selected
          ? [{
              item_id: UPSELL2_PRODUCT.id,
              item_name: UPSELL2_PRODUCT.name,
              price: Number(UPSELL2_PRODUCT.price.toFixed(2)),
              quantity: 1,
            }]
          : []),
      ];
      trackGaEvent('begin_checkout', {
        currency: 'BRL',
        value: Number(totalAmount.toFixed(2)),
        items,
      });
    }

    try {
      const fbq = (window as any)?.fbq;
      if (typeof fbq === 'function') {
        const em = String(formData.email || '').trim().toLowerCase();
        const ph = String(formData.phone || '').replace(/\D/g, '');
        const userData: Record<string, any> = {};
        if (em) userData.em = em;
        if (ph) userData.ph = ph;
        if (Object.keys(userData).length > 0) {
          fbq('set', 'userData', userData);
        }
      }
    } catch {
      // ignore
    }

    if (!initiateCheckoutSentRef.current) {
      initiateCheckoutSentRef.current = true;

      const eventId = (() => {
        if (initiateCheckoutEventIdRef.current) return initiateCheckoutEventIdRef.current;
        const stored = window.sessionStorage.getItem('meta_initiate_checkout_event_id');
        if (stored) {
          initiateCheckoutEventIdRef.current = stored;
          return stored;
        }
        const generated =
          (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function'
            ? (crypto as any).randomUUID()
            : `ic-${Date.now()}-${Math.random().toString(16).slice(2)}`);
        initiateCheckoutEventIdRef.current = generated;
        window.sessionStorage.setItem('meta_initiate_checkout_event_id', generated);
        return generated;
      })();

      const params = {
        value: Number(totalAmount.toFixed(2)),
        currency: 'BRL'
      };

      try {
        const fbq = (window as any)?.fbq;
        if (typeof fbq === 'function') {
          fbq('track', 'InitiateCheckout', params, { eventID: eventId });
        }
      } catch {
        // ignore
      }

      try {
        await fetch('/api/initiate-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            value: params.value,
            currency: params.currency,
            eventSourceUrl: window.location.href,
            user: {
              email: formData.email,
              phone: formData.phone,
              document: formData.document
            }
          })
        });
      } catch {
        // ignore
      }
    }

    setPaymentState(prev => ({ ...prev, isProcessing: true }));

    try {
      const result = await processCheckout(formData, paymentMethod, upsellSelected, upsell2Selected, cardPaymentData);

      if (result.success) {
        if (paymentMethod === PaymentMethod.PIX && result.paymentId) {
          setPixPayment({
            paymentId: result.paymentId,
            qrCode: result.qrCode,
            qrCodeBase64: result.qrCodeBase64,
            ticketUrl: result.ticketUrl
          });
        }

        if (paymentMethod === PaymentMethod.CREDIT_CARD && result.status === 'approved') {
          try {
            const fbq = (window as any)?.fbq;
            const params = {
              value: Number(totalAmount.toFixed(2)),
              currency: 'BRL'
            };
            const eventId = result.paymentId ? String(result.paymentId) : undefined;
            if (typeof fbq === 'function') {
              fbq('trackSingle', 'Purchase', params, eventId ? { eventID: eventId } : undefined);
            } else {
              trackFbEvent('Purchase', params);
            }
          } catch {
            // ignore
          }

          if (!gaPurchaseSentRef.current) {
            gaPurchaseSentRef.current = true;
            const transactionId = result.paymentId ? String(result.paymentId) : `cc-${Date.now()}`;
            const items = [
              {
                item_id: MAIN_PRODUCT.id,
                item_name: MAIN_PRODUCT.name,
                price: Number(MAIN_PRODUCT.price.toFixed(2)),
                quantity: 1,
              },
              ...(upsellSelected
                ? [{
                    item_id: UPSELL_PRODUCT.id,
                    item_name: UPSELL_PRODUCT.name,
                    price: Number(UPSELL_PRODUCT.price.toFixed(2)),
                    quantity: 1,
                  }]
                : []),
              ...(upsell2Selected
                ? [{
                    item_id: UPSELL2_PRODUCT.id,
                    item_name: UPSELL2_PRODUCT.name,
                    price: Number(UPSELL2_PRODUCT.price.toFixed(2)),
                    quantity: 1,
                  }]
                : []),
            ];
            trackGaEvent('purchase', {
              transaction_id: transactionId,
              currency: 'BRL',
              value: Number(totalAmount.toFixed(2)),
              items,
            });
          }

          window.setTimeout(() => {
            const tid = result.paymentId ? String(result.paymentId) : undefined;
            const url = tid
              ? `https://pagtomasterclassia.mestres.app/obrigado-masterclass-seo?tid=${encodeURIComponent(tid)}`
              : 'https://pagtomasterclassia.mestres.app/obrigado-masterclass-seo';
            window.location.href = url;
          }, 800);
          return;
        }

        if (paymentMethod === PaymentMethod.CREDIT_CARD) {
          const status = result.status ? String(result.status) : 'unknown';
          const statusDetail = result.statusDetail ? String(result.statusDetail) : '';
          const msg = statusDetail ? `Status do pagamento: ${status} - ${statusDetail}` : `Status do pagamento: ${status}`;
          setPaymentState(prev => ({ ...prev, isSuccess: false, error: msg }));
          return;
        }

        setPaymentState(prev => ({ ...prev, isSuccess: true }));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao processar pagamento.';
      setPaymentState(prev => ({ ...prev, error: message }));
    } finally {
      setPaymentState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-200 ${
          showTopNotice ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="text-sm text-amber-900 font-medium text-center">
              Você está no ambiente seguro de pagamento da Xandr – A marca pessoal de Alexandre Ferreira (Criador do Mestres do Tráfego).
            </div>
          </div>
        </div>
      </div>

      {whatsappLink && (
        <div className="fixed bottom-5 right-5 z-50">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3"
            aria-label="Dúvida no pagamento? Fale comigo agora no WhatsApp"
          >
            <div className="hidden sm:block bg-white border border-slate-200 shadow-md rounded-full px-4 py-2 text-sm text-slate-700 group-hover:bg-slate-50 transition-colors">
              Dúvida no pagamento? Fale comigo agora.
            </div>
            <div className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 shadow-lg flex items-center justify-center transition-colors">
              <MessageCircle className="text-white" size={26} />
            </div>
          </a>
        </div>
      )}

      <div className="w-full max-w-6xl pt-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN (Summary) - Takes 4 cols on desktop */}
        <div className="md:col-span-4 order-1 md:order-1">
          <div className="sticky top-8">
             <OrderSummary upsellSelected={upsellSelected} upsell2Selected={upsell2Selected} />
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
            upsell2Selected={upsell2Selected}
            setUpsell2Selected={setUpsell2Selected}
            onSubmit={handleSubmit}
            isProcessing={paymentState.isProcessing}
            errors={errors}
            pixPayment={pixPayment}
          />
          {paymentState.error && (
            <div className="mt-4 bg-red-100 text-red-600 text-sm py-3 px-4 rounded-md text-center font-medium">
              {paymentState.error}
            </div>
          )}
        </div>

        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-12">
          <div className="hidden md:block md:col-span-4" />
          <div className="md:col-span-8 flex justify-center">
            <div className="flex items-center gap-4">
              <a
                href="https://transparencyreport.google.com/safe-browsing/search?url=xandr.com.br&hl=pt_BR"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <img
                  src="/siteseguro.png"
                  alt="Site seguro"
                  className="h-8 w-auto"
                />
              </a>
              <img
                src="/xandr.png"
                alt="Xandr"
                className="h-8 w-auto max-w-[120px] object-contain"
                loading="eager"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
);
};

export default App;