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

async function sendMetaInitiateCheckoutEvent({
  eventId,
  value,
  currency,
  eventSourceUrl,
  user,
  meta,
  clientUserAgent,
  clientIpAddress
}) {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!pixelId || !accessToken) return { skipped: true, reason: 'missing_meta_env' };

  const userData = {
    em: hashIfPresent(user?.email),
    ph: (() => {
      const p = digitsOnly(user?.phone);
      return p ? sha256(p) : undefined;
    })(),
    external_id: (() => {
      const doc = digitsOnly(user?.document);
      return doc ? sha256(doc) : undefined;
    })(),
    fbp: meta?.fbp ? String(meta.fbp) : undefined,
    fbc: meta?.fbc ? String(meta.fbc) : undefined,
    client_user_agent: clientUserAgent ? String(clientUserAgent) : undefined,
    client_ip_address: clientIpAddress ? String(clientIpAddress) : undefined
  };

  Object.keys(userData).forEach((k) => {
    if (userData[k] == null) delete userData[k];
  });

  const payload = {
    data: [
      {
        event_name: 'InitiateCheckout',
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId ? String(eventId) : undefined,
        action_source: 'website',
        event_source_url: eventSourceUrl,
        user_data: userData,
        custom_data: {
          currency,
          value: Number(value)
        }
      }
    ]
  };

  if (process.env.META_TEST_EVENT_CODE) {
    payload.test_event_code = process.env.META_TEST_EVENT_CODE;
  }

  const url = `https://graph.facebook.com/v20.0/${encodeURIComponent(String(pixelId))}/events?access_token=${encodeURIComponent(String(accessToken))}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await r.json().catch(() => null);
  return { ok: r.ok, status: r.status, data };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};

    const eventId = body?.eventId ? String(body.eventId) : undefined;
    const value = Number(body?.value);
    const currency = body?.currency ? String(body.currency) : 'BRL';

    const cookies = parseCookies(req.headers?.cookie);
    const meta = {
      fbp: cookies?._fbp,
      fbc: cookies?._fbc
    };

    const user = body?.user && typeof body.user === 'object' ? body.user : undefined;

    const eventSourceUrl =
      (body?.eventSourceUrl ? String(body.eventSourceUrl) : null) ||
      process.env.PUBLIC_SITE_URL ||
      'https://test.example.com';

    const result = await sendMetaInitiateCheckoutEvent({
      eventId,
      value,
      currency,
      eventSourceUrl,
      user,
      meta,
      clientUserAgent: req.headers['user-agent'],
      clientIpAddress: getClientIp(req)
    });

    res.status(200).json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err?.message || err) });
  }
}
