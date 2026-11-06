const GHL = "https://services.leadconnectorhq.com";
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 6;
const requestCounts = new Map();

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

async function validToken(contactId, token) {
  if (typeof token !== "string") return false;
  const [expires, sig] = token.split(".");
  if (!expires || !sig || Number(expires) < Date.now()) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(process.env.GHL_API_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expected = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${contactId}.${expires}`));
  const actual = Buffer.from(expected).toString("hex");
  return actual.length === sig.length && actual === sig;
}

export default {
  async fetch(request) {
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

    const { GHL_API_KEY, GHL_LOCATION_ID, GHL_CALENDAR_ID } = process.env;
    if (!GHL_API_KEY || !GHL_LOCATION_ID || !GHL_CALENDAR_ID) return json({ error: "booking_not_configured" }, 503);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "invalid_request" }, 400);
    }

    const { contactId, token, startTime } = body ?? {};
    const start = new Date(startTime);
    const now = Date.now();
    if (
      typeof contactId !== "string" ||
      !/^[A-Za-z0-9]{10,40}$/.test(contactId) ||
      Number.isNaN(start.getTime()) ||
      start.getTime() < now ||
      start.getTime() > now + 15 * 24 * 60 * 60 * 1000
    ) {
      return json({ error: "invalid_request" }, 400);
    }
    if (!(await validToken(contactId, token))) return json({ error: "invalid_request" }, 403);

    const ip = (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
    const recent = (requestCounts.get(ip) || []).filter((time) => now - time < WINDOW_MS);
    if (recent.length >= MAX_REQUESTS_PER_WINDOW) return json({ error: "rate_limited" }, 429);
    recent.push(now);
    requestCounts.set(ip, recent);

    const tz = process.env.GHL_TIMEZONE || "America/New_York";
    const end = new Date(start.getTime() + 30 * 60 * 1000);

    try {
      const response = await fetch(`${GHL}/calendars/events/appointments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GHL_API_KEY}`,
          Version: "2021-07-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          calendarId: GHL_CALENDAR_ID,
          locationId: GHL_LOCATION_ID,
          contactId,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          title: "Savvy Producer Strategy Call",
          appointmentStatus: "confirmed",
          address: "Phone Call",
          timezone: tz,
        }),
      });
      if (!response.ok) return json({ error: "booking_failed" }, 502);
      const label = start.toLocaleString("en-US", {
        timeZone: tz,
        weekday: "long",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
      return json({ booked: true, label });
    } catch {
      return json({ error: "booking_failed" }, 502);
    }
  },
};
