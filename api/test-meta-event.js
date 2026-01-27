 import crypto from 'crypto';

 function getClientIp(req) {
   const candidates = [
     req.headers['x-vercel-forwarded-for'],
     req.headers['x-forwarded-for'],
     req.headers['x-real-ip']
   ];

   for (const c of candidates) {
     if (typeof c === 'string' && c.trim()) {
       return c.split(',')[0].trim();
     }
   }

   return req.socket?.remoteAddress;
 }

 function parseCookies(cookieHeader) {
   if (!cookieHeader || typeof cookieHeader !== 'string') return {};
   const out = {};
   cookieHeader.split(';').forEach((part) => {
     const idx = part.indexOf('=');
     if (idx === -1) return;
     const k = part.slice(0, idx).trim();
     const v = part.slice(idx + 1).trim();
     if (!k) return;
     out[k] = decodeURIComponent(v);
   });
   return out;
 }

 const normalize = (v) => String(v || '').trim().toLowerCase();
 const digitsOnly = (v) => String(v || '').replace(/\D/g, '');
 const sha256 = (v) => crypto.createHash('sha256').update(String(v)).digest('hex');
 const hashIfPresent = (v) => {
   const s = normalize(v);
   if (!s) return undefined;
   return sha256(s);
 };

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

   const cookies = parseCookies(req.headers?.cookie);
   const fbp = cookies?._fbp;
   const fbc = cookies?._fbc;

  const email = req.query?.email ? String(req.query.email) : undefined;
  const phone = req.query?.phone ? String(req.query.phone) : undefined;
  const externalId = req.query?.external_id ? String(req.query.external_id) : undefined;

  const userData = {
    em: hashIfPresent(email),
    ph: (() => {
      const p = digitsOnly(phone);
      return p ? sha256(p) : undefined;
    })(),
    external_id: externalId ? sha256(normalize(externalId)) : undefined,
    fbp: fbp ? String(fbp) : undefined,
    fbc: fbc ? String(fbc) : undefined,
    client_user_agent: req.headers['user-agent'],
    client_ip_address: getClientIp(req)
  };

  Object.keys(userData).forEach((k) => {
    if (userData[k] == null) delete userData[k];
  });

  if (Object.keys(userData).length === 0) {
    res.status(400).json({
      success: false,
      error:
        'Missing user_data. Pass ?email=... (or ?phone=... / ?external_id=...) or call from a browser session that has _fbp/_fbc cookies.'
    });
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
        user_data: userData,
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
