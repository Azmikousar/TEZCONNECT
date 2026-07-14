// /api/send-event-whatsapp.js
// Sends a WhatsApp template message with the Zoom link after a user registers
// (free or paid). No-ops silently if the event has no zoom_link set.
//
// Env vars required:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY   (service role — server only, never expose to client)
//   META_WA_PHONE_NUMBER_ID     (from Meta Business Manager > WhatsApp > API Setup)
//   META_WA_ACCESS_TOKEN        (permanent token, not the 24h test token)
//   META_WA_TEMPLATE_NAME       (default: event_registration_confirmed)
//
// Meta template setup (do this once in Business Manager > WhatsApp Manager > Message Templates):
//   Name: event_registration_confirmed   Category: Utility   Language: English
//   Body: "Hi {{1}}, you're registered for *{{2}}* on {{3}}. Join the meeting here: {{4}}"
//   Submit for approval — usually approved within minutes to a few hours.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WA_PHONE_ID = process.env.META_WA_PHONE_NUMBER_ID;
const WA_TOKEN = process.env.META_WA_ACCESS_TOKEN;
const WA_TEMPLATE = process.env.META_WA_TEMPLATE_NAME || "event_registration_confirmed";

function toE164Digits(mobile) {
  if (!mobile) return null;
  let digits = String(mobile).replace(/[^\d]/g, "");
  if (digits.length === 10) digits = "91" + digits; // default to India if no country code
  return digits;
}

async function sbFetch(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...opts.headers,
    },
  });
  if (!res.ok) throw new Error(`Supabase ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function sendWhatsAppTemplate({ to, name, eventTitle, eventDateText, zoomLink }) {
  const url = `https://graph.facebook.com/v20.0/${WA_PHONE_ID}/messages`;
  const body = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: WA_TEMPLATE,
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: name || "there" },
            { type: "text", text: eventTitle },
            { type: "text", text: eventDateText },
            { type: "text", text: zoomLink },
          ],
        },
      ],
    },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${WA_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`WhatsApp send failed: ${JSON.stringify(data)}`);
  return data;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { eventId, userId } = req.body;
    if (!eventId || !userId) return res.status(400).json({ error: "eventId and userId are required" });

    const events = await sbFetch(`events?id=eq.${eventId}&select=title,event_date,zoom_link`);
    const event = events[0];
    if (!event) return res.status(404).json({ error: "Event not found" });

    // Nothing to send for offline events with no meeting link — not an error.
    if (!event.zoom_link) return res.status(200).json({ skipped: true, reason: "no zoom_link on event" });

    const profiles = await sbFetch(`profiles?id=eq.${userId}&select=name,mobile`);
    const profile = profiles[0];
    const to = toE164Digits(profile?.mobile);
    if (!to) return res.status(200).json({ skipped: true, reason: "no mobile number on profile" });

    const eventDateText = new Date(event.event_date).toLocaleString("en-IN", {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });

    const result = await sendWhatsAppTemplate({
      to, name: profile?.name, eventTitle: event.title, eventDateText, zoomLink: event.zoom_link,
    });

    return res.status(200).json({ sent: true, result });
  } catch (err) {
    console.error("[send-event-whatsapp]", err);
    return res.status(500).json({ error: err.message });
  }
}
