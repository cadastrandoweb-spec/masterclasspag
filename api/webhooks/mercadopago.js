async function callMemboxWebhook({ customer, productName, orderBumpId }) {
  const url = process.env.MEMBOX_WEBHOOK_URL;
  const credential = process.env.MEMBOX_WEBHOOK_CREDENTIAL;

  if (!url || !credential) {
    throw new Error('Missing MEMBOX_WEBHOOK_URL or MEMBOX_WEBHOOK_CREDENTIAL');
  }

  const payload = {
    type: 'insert',
    customer: {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      document: customer.document
    },
    product: {
      name: productName
    },
    order_bumps: [{ id: orderBumpId }],
    credential
  };

  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const text = await r.text();
  if (!r.ok) {
    throw new Error(`Membox webhook failed: ${r.status} ${text}`);
  }

  return text;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).send('Method not allowed');
    return;
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    res.status(500).json({ error: 'Missing MP_ACCESS_TOKEN' });
    return;
  }

  // Mercado Pago geralmente envia: { action, api_version, data: { id }, date_created, id, live_mode, type, user_id }
  const paymentId = req.body?.data?.id ?? req.body?.data?.payment_id ?? req.query?.id;

  if (!paymentId) {
    res.status(200).json({ ok: true, ignored: true });
    return;
  }

  try {
    const r = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(String(paymentId))}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const payment = await r.json();

    if (!r.ok) {
      res.status(200).json({ ok: true, mp_error: payment });
      return;
    }

    if (payment?.status !== 'approved') {
      res.status(200).json({ ok: true, status: payment?.status });
      return;
    }

    const customer = {
      name: payment?.metadata?.customer_name,
      email: payment?.metadata?.customer_email,
      phone: payment?.metadata?.customer_phone,
      document: payment?.metadata?.customer_document
    };

    // Campos obrigatórios no payload do Membox
    if (!customer.name || !customer.email || !customer.phone || !customer.document) {
      res.status(200).json({ ok: true, status: 'approved', membox_skipped: 'missing_customer_metadata' });
      return;
    }

    const productName = process.env.MEMBOX_PRODUCT_NAME || 'Mestres do Tráfego';
    const orderBumpId = process.env.MEMBOX_ORDER_BUMP_ID || 'main-prod-001';

    const memboxResult = await callMemboxWebhook({ customer, productName, orderBumpId });

    res.status(200).json({ ok: true, status: 'approved', membox: 'sent', memboxResult });
  } catch (e) {
    res.status(200).json({ ok: true, error: String(e?.message || e) });
  }
}
