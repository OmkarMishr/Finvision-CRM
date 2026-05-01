// WhatsApp send service.
//
// Provider is chosen via WHATSAPP_PROVIDER env:
//   - "meta_cloud"  Meta WhatsApp Cloud API (Graph)
//   - "botspace"    BotSpace BSP
//   - "wa_link"     fallback: returns wa.me deep-links the client opens
//
// All providers expose the same shape:
//   sendMessage(to, message) -> { ok, provider, to, link?, response?, error? }
//
// `to` is normalized to digits-only (E.164 without the leading "+") before
// dispatch — every supported provider expects that format.

const META_GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v20.0';

// Strip everything but digits and drop a leading 0. Indian numbers without a
// country code get prefixed with 91. Numbers already in E.164 stay intact.
const normalize = (raw) => {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '').replace(/^0+/, '');
  if (!digits) return null;
  if (digits.length === 10) return `91${digits}`;        // assume India
  return digits;
};

const buildLink = (to, message) =>
  `https://wa.me/${to}?text=${encodeURIComponent(message)}`;

// ─── Provider: wa.me deeplink (no external call) ──────────────────────────────
const sendViaLink = async (to, message) => ({
  ok: true,
  provider: 'wa_link',
  to,
  link: buildLink(to, message),
});

// ─── Provider: Meta WhatsApp Cloud API ────────────────────────────────────────
const sendViaMetaCloud = async (to, message) => {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token   = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_PAGE_ACCESS_TOKEN;
  if (!phoneId || !token) {
    return { ok: false, provider: 'meta_cloud', to, error: 'Missing WHATSAPP_PHONE_NUMBER_ID or access token' };
  }

  const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneId}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: message, preview_url: true },
  };

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return {
        ok: false,
        provider: 'meta_cloud',
        to,
        error: json?.error?.message || `HTTP ${resp.status}`,
        response: json,
      };
    }
    return { ok: true, provider: 'meta_cloud', to, response: json };
  } catch (err) {
    return { ok: false, provider: 'meta_cloud', to, error: err.message };
  }
};

// ─── Provider: BotSpace (BSP that already powers the inbound webhook) ─────────
const sendViaBotspace = async (to, message) => {
  const apiKey = process.env.BOTSPACE_API_KEY;
  const url    = process.env.BOTSPACE_SEND_URL || 'https://api.botspace.io/v1/messages/send';
  if (!apiKey || apiKey === 'your_botspace_api_key') {
    return { ok: false, provider: 'botspace', to, error: 'Missing BOTSPACE_API_KEY' };
  }

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, type: 'text', text: { body: message } }),
    });
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return { ok: false, provider: 'botspace', to, error: json?.error || `HTTP ${resp.status}`, response: json };
    }
    return { ok: true, provider: 'botspace', to, response: json };
  } catch (err) {
    return { ok: false, provider: 'botspace', to, error: err.message };
  }
};

// ─── Public API ───────────────────────────────────────────────────────────────
const sendMessage = async (rawTo, message) => {
  const to = normalize(rawTo);
  if (!to) return { ok: false, to: rawTo, error: 'Invalid phone number' };
  if (!message || !message.trim()) return { ok: false, to, error: 'Empty message' };

  const provider = (process.env.WHATSAPP_PROVIDER || 'wa_link').toLowerCase();
  switch (provider) {
    case 'meta_cloud':  return sendViaMetaCloud(to, message);
    case 'botspace':    return sendViaBotspace(to, message);
    case 'wa_link':
    default:            return sendViaLink(to, message);
  }
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Sequential dispatch with a small inter-message delay so providers don't flag
// the burst as spam. Returns per-recipient results in the same order as input.
const sendBulk = async (recipients, message, { delayMs = 600 } = {}) => {
  const results = [];
  for (let i = 0; i < recipients.length; i++) {
    const r = recipients[i];
    const res = await sendMessage(r.mobile, message);
    results.push({
      leadId:   r.leadId   || null,
      fullName: r.fullName || null,
      mobile:   r.mobile,
      ...res,
    });
    if (i < recipients.length - 1) await sleep(delayMs);
  }
  return results;
};

module.exports = {
  sendMessage,
  sendBulk,
  normalize,
  buildLink,
};
