import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    res.status(500).json({ success: false, error: 'Missing MP_ACCESS_TOKEN' });
    return;
  }

  const { user, items, paymentMethod, card } = req.body ?? {};

  if (!user?.email || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ success: false, error: 'Invalid payload' });
    return;
  }

  if (paymentMethod !== 'pix' && paymentMethod !== 'credit_card') {
    res.status(400).json({ success: false, error: 'Invalid payment method' });
    return;
  }

  if (paymentMethod === 'credit_card') {
    if (!card?.token || !card?.paymentMethodId) {
      res.status(400).json({ success: false, error: 'Missing card token or payment method' });
      return;
    }
  }

  const total = items.reduce((acc, it) => acc + Number(it?.price || 0), 0);
  if (!Number.isFinite(total) || total <= 0) {
    res.status(400).json({ success: false, error: 'Invalid items total' });
    return;
  }

  const siteUrl = process.env.PUBLIC_SITE_URL;
  const notificationUrl = siteUrl ? `${siteUrl.replace(/\/$/, '')}/api/webhooks/mercadopago` : undefined;

  const basePayload = {
    transaction_amount: Number(total.toFixed(2)),
    description: items.map(i => i?.title).filter(Boolean).join(' + ').slice(0, 240) || 'Compra',
    payer: {
      email: user.email
    },
    notification_url: notificationUrl,
    metadata: {
      customer_name: user?.name,
      customer_email: user?.email,
      customer_phone: user?.phone,
      customer_document: user?.document,
      items
    }
  };

  const payload =
    paymentMethod === 'pix'
      ? {
          ...basePayload,
          payment_method_id: 'pix'
        }
      : {
          ...basePayload,
          token: card?.token,
          installments: Number(card?.installments || 1),
          payment_method_id: card?.paymentMethodId,
          issuer_id: card?.issuerId,
          payer: {
            ...basePayload.payer,
            identification: {
              type: 'CPF',
              number: String(user?.document || '')
            }
          }
        };

  try {
    const idempotencyKey = crypto.randomUUID();
    const r = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(payload)
    });

    const data = await r.json();

    if (!r.ok) {
      const causeText = Array.isArray(data?.cause)
        ? data.cause
            .map(c => {
              const code = c?.code ? String(c.code) : '';
              const desc = c?.description ? String(c.description) : '';
              const detail = c?.detail ? String(c.detail) : '';
              return [code, desc, detail].filter(Boolean).join(' - ');
            })
            .filter(Boolean)
            .join(' | ')
        : '';

      const mpMessage =
        data?.message ||
        data?.error ||
        data?.status ||
        (causeText ? `Mercado Pago: ${causeText}` : null) ||
        'Mercado Pago error';

      res.status(r.status).json({ success: false, error: String(mpMessage), details: data });
      return;
    }

    const tx = data?.point_of_interaction?.transaction_data;
    res.status(200).json({
      success: true,
      paymentId: data?.id,
      status: data?.status,
      qrCode: tx?.qr_code,
      qrCodeBase64: tx?.qr_code_base64,
      ticketUrl: tx?.ticket_url,
      received: { user, items, paymentMethod }
    });
  } catch {
    res.status(500).json({ success: false, error: 'Payment creation failed' });
  }
}
