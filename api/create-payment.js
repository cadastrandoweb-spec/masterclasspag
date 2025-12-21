export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  const { user, items, paymentMethod } = req.body ?? {};

  if (!user?.email || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ success: false, error: 'Invalid payload' });
    return;
  }

  res.status(200).json({
    success: true,
    preferenceId: 'pref_vercel_123',
    paymentUrl: 'https://example.com/checkout',
    received: { user, items, paymentMethod }
  });
}
