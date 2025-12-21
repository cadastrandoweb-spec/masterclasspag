import { OrderForm, PaymentMethod } from '../types';
import { MAIN_PRODUCT, UPSELL_PRODUCT } from '../constants';

// This simulates the behavior of the Node.js backend
export const processCheckout = async (
  formData: OrderForm,
  paymentMethod: PaymentMethod,
  hasUpsell: boolean
): Promise<{ success: boolean; message: string; redirectUrl?: string }> => {
  const items = [
    { id: MAIN_PRODUCT.id, title: MAIN_PRODUCT.name, price: MAIN_PRODUCT.price },
    ...(hasUpsell ? [{ id: UPSELL_PRODUCT.id, title: UPSELL_PRODUCT.name, price: UPSELL_PRODUCT.price }] : [])
  ];

  const resp = await fetch('/api/create-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user: { name: formData.name, email: formData.email },
      items,
      paymentMethod
    })
  });

  if (!resp.ok) {
    throw new Error('Payment creation failed');
  }

  const data = await resp.json();
  return {
    success: Boolean(data?.success),
    message: data?.success ? 'Pagamento iniciado com sucesso!' : 'Falha ao iniciar pagamento.',
    redirectUrl: data?.paymentUrl
  };
};