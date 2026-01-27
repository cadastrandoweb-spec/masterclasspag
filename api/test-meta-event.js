export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    res.status(500).json({ success: false, error: 'Missing META_PIXEL_ID or META_ACCESS_TOKEN' });
    return;
  }

  const payload = {
    data: [
      {
        event_name: 'TestEvent',
        event_time: Math.floor(Date.now() / 1000),
        event_id: 'test-' + Date.now(),
        action_source: 'website',
        event_source_url: process.env.PUBLIC_SITE_URL || 'https://test.example.com',
        user_data: {},
        custom_data: {}
      }
    ]
  };

  if (process.env.META_TEST_EVENT_CODE) {
    payload.test_event_code = process.env.META_TEST_EVENT_CODE;
  }

  const url = `https://graph.facebook.com/v20.0/${encodeURIComponent(String(pixelId))}/events?access_token=${encodeURIComponent(String(accessToken))}`;
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await r.json().catch(() => null);
    res.status(200).json({ success: r.ok, status: r.status, data });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err?.message || err) });
  }
}
