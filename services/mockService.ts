import { OrderForm, PaymentMethod } from '../types';
import { MAIN_PRODUCT, UPSELL_PRODUCT } from '../constants';

// This simulates the behavior of the Node.js backend
export const processCheckout = async (
  formData: OrderForm,
  paymentMethod: PaymentMethod,
  hasUpsell: boolean
): Promise<{ success: boolean; message: string; paymentId?: string; qrCode?: string; qrCodeBase64?: string; ticketUrl?: string }> => {
  const items = [
    { id: MAIN_PRODUCT.id, title: MAIN_PRODUCT.name, price: MAIN_PRODUCT.price },
    ...(hasUpsell ? [{ id: UPSELL_PRODUCT.id, title: UPSELL_PRODUCT.name, price: UPSELL_PRODUCT.price }] : [])
  ];

  const resp = await fetch('/api/create-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone.replace(/\D/g, ''),
        document: formData.document.replace(/\D/g, '')
      },
      items,
      paymentMethod
    })
  });

  if (!resp.ok) {
    let details: any = null;
    try {
      details = await resp.json();
    } catch {
      // ignore
    }
    const msg = details?.error || details?.message || `Payment creation failed (${resp.status})`;
    throw new Error(msg);
  }

  const data = await resp.json();
  return {
    success: Boolean(data?.success),
    message: data?.success ? 'Pagamento iniciado com sucesso!' : 'Falha ao iniciar pagamento.',
    paymentId: data?.paymentId,
    qrCode: data?.qrCode,
    qrCodeBase64: data?.qrCodeBase64,
    ticketUrl: data?.ticketUrl
  };
};