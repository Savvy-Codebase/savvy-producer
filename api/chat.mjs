const MODEL = "claude-haiku-5-5";
const MAX_MESSAGES = 30;
const MAX_MESSAGE_LENGTH = 1000;
const MAX_OUTPUT_TOKENS = 400;
const MAX_TRANSCRIPT_LENGTH = 4500;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 100;
const requestCounts = new Map();

// Tour stops. The model may only point at these ids; anything else is dropped.
const TOUR = {
  top: { label: "Savvy Producer", href: "#top" },
  "growth-pillars": { label: "Agency growth", href: "#growth-pillars" },
  "about-preview": { label: "About Savvy Producer", href: "#about-preview" },
  "why-savvy": { label: "The Savvy perspective", href: "#why-savvy" },
  contact: { label: "Book an agency growth call", href: "#contact" },
  socials: { label: "Stay connected", href: "#socials" },
  "about-page": { label: "About Savvy Producer", href: "about.html" },
};

const instructions = `You are Savvy, the virtual guide for Savvy Producer. Savvy Producer is the umbrella brand for a connected group of companies, and this website is about helping agents and agencies think about the business they want to build.

Voice: warm, direct, and conversational. Use plain language and short sentences. Never claim to be human. Reply in under 90 words. Ask at most one question at a time.

Conversation focus: keep the conversation centered on the visitor's agency goals, current stage, challenges, and ambitions. Do not present a product catalog or describe specialized products, pricing, or operational processes. If asked for those details, explain briefly that this website focuses on the visitor's agency growth and offer to arrange a conversation with the Savvy Producer team. Do not promise results or imply guaranteed outcomes.

BOOKING: When the visitor wants help building their agency or asks to talk with the team, offer to arrange a growth conversation. Learn only what helps the team prepare: the agency or business name, the visitor's current stage or main challenge, and what they hope to build. Ask one question at a time; skip anything already shared. Then collect, one field at a time, the visitor's full name, best email, and best phone number. Before asking for a phone number, ask plainly whether it is okay for the Savvy Producer team to contact them by phone and email about their request. Continue only if they agree. If they decline, thank them and point them to hello@savvyleads.io. Do not ask for payment details, license numbers, government IDs, or unrelated personal information. For the lead token, use company for the agency name, interest as "agency growth conversation", process for their current stage or challenge, and goal for what they want to build. Leave states blank unless the visitor volunteers a relevant location. Once you have the name, email, phone, and consent, end your reply with this token alone on its own line, as compact JSON: [LEAD:{"name":"Full Name","company":"Agency Name","email":"name@example.com","phone":"5025551234","states":"","interest":"agency growth conversation","process":"current stage or challenge","goal":"what they want to build"}]. Never show or explain the token. Write this sentence before it: "Thanks, I've passed your details to the team. Pick a time that works for you below." After the lead is saved, do not offer times again. If an earlier assistant message says the visitor already booked, acknowledge that briefly and do not start another booking.

Grounding: use only the facts below and the conversation. Do not invent results, clients, or guarantees. You may say Jason has more than 26 years of sales experience, 15 years as an active life insurance producer, and founded four companies in the life insurance space that now sit within a connected Savvy ecosystem. The contact email is hello@savvyleads.io. Do not give legal, tax, or compliance advice.

SITE TOUR: When a visitor asks to see the site or asks where something is, add up to two markers at the end of your reply in the form [[tour:id]]. Briefly explain what the highlighted section means for their agency; do not just name it. For a general tour, walk through one section at a time and focus on the visitor's growth. Valid IDs:
- top: the Savvy Producer homepage and growth-call invitation
- growth-pillars: broad principles for building an agency
- about-preview: Jason's experience and the connected Savvy ecosystem
- about-page: the full About page
- why-savvy: why the umbrella brand brings an experienced perspective
- contact: arrange a conversation about agency goals
- socials: Savvy Producer social links

SITE CONTEXT: Savvy Producer is positioned above SavvyProducer, SavvyMarketing, SavvyLeads, and Voxr AI. This homepage keeps the focus on the visitor's agency and invites them to book a growth conversation. It does not explain subsidiary products or their operating processes.`;

const GHL = "https://services.leadconnectorhq.com";

function ghlConfigured() {
  return Boolean(process.env.GHL_API_KEY && process.env.GHL_LOCATION_ID);
}

function ghlHeaders() {
  return {
    Authorization: `Bearer ${process.env.GHL_API_KEY}`,
    Version: "2021-07-28",
    "Content-Type": "application/json",
  };
}

// Signed so /api/book-slot only books for a contact this endpoint just created.
async function signContact(contactId) {
  const expires = Date.now() + 60 * 60 * 1000;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(process.env.GHL_API_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${contactId}.${expires}`));
  return `${expires}.${Buffer.from(sig).toString("hex")}`;
}

function cleanLead(raw) {
  const text = (value, max = 200) => (typeof value === "string" ? value.trim().slice(0, max) : "");
  const lead = {
    name: text(raw?.name, 100),
    company: text(raw?.company, 150),
    email: text(raw?.email, 200).toLowerCase(),
    phone: text(raw?.phone, 30).replace(/[^\d+]/g, ""),
    states: text(raw?.states),
    interest: text(raw?.interest),
    process: text(raw?.process),
    goal: text(raw?.goal, 400),
  };
  const phoneDigits = lead.phone.replace(/\D/g, "");
  if (!lead.name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(lead.email)) return null;
  if (phoneDigits.length < 10 || phoneDigits.length > 15) return null;
  return lead;
}

async function createContact(lead, transcript) {
  const parts = lead.name.split(/\s+/);
  const res = await fetch(`${GHL}/contacts/`, {
    method: "POST",
    headers: ghlHeaders(),
    body: JSON.stringify({
      firstName: parts[0],
      lastName: parts.slice(1).join(" ") || undefined,
      email: lead.email,
      phone: lead.phone,
      companyName: lead.company || undefined,
      locationId: process.env.GHL_LOCATION_ID,
      source: "savvy-website-chat",
      tags: ["savvy-website-lead", "chat-consented"],
    }),
  });
  const data = await res.json().catch(() => ({}));
  // A duplicate comes back with the existing contact's id in meta.
  const contactId = data?.contact?.id ?? data?.meta?.contactId ?? null;
  if (!contactId) return null;

  const note = [
    "Lead from Savvy website chat. Visitor agreed to be contacted by phone and email by the Savvy team.",
    lead.company && `Business: ${lead.company}`,
    lead.states && `Licensed states: ${lead.states}`,
    lead.interest && `Interested in: ${lead.interest}`,
    lead.process && `Follow-up process: ${lead.process}`,
    lead.goal && `Goal: ${lead.goal}`,
    `Captured: ${new Date().toISOString()}`,
  ]
    .filter(Boolean)
    .join("\n");
  await fetch(`${GHL}/contacts/${contactId}/notes`, {
    method: "POST",
    headers: ghlHeaders(),
    body: JSON.stringify({ body: note }),
  }).catch(() => {});
  if (transcript) {
    await fetch(`${GHL}/contacts/${contactId}/notes`, {
      method: "POST",
      headers: ghlHeaders(),
      body: JSON.stringify({ body: `Chat transcript (Savvy website chat):\n${transcript}` }),
    }).catch(() => {});
  }
  return contactId;
}

async function getSlots(daysOut = 3) {
  const calendarId = process.env.GHL_CALENDAR_ID;
  if (!calendarId) return [];
  const tz = process.env.GHL_TIMEZONE || "America/New_York";
  const start = Date.now();
  const end = start + daysOut * 24 * 60 * 60 * 1000;
  const res = await fetch(
    `${GHL}/calendars/${calendarId}/free-slots?startDate=${start}&endDate=${end}&timezone=${encodeURIComponent(tz)}`,
    { headers: ghlHeaders() },
  );
  if (!res.ok) return [];
  const data = await res.json();
  const slots = [];
  for (const [key, val] of Object.entries(data)) {
    if (key === "traceId" || !Array.isArray(val?.slots)) continue;
    for (const slot of val.slots) {
      if (slots.length >= 6) return slots;
      const startTime = typeof slot === "object" ? slot.startTime : slot;
      const label = new Date(startTime).toLocaleString("en-US", {
        timeZone: tz,
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
      slots.push({ startTime, label });
    }
  }
  return slots;
}

async function saveLead(leadJson, transcript) {
  if (!ghlConfigured()) return { saved: false };
  let lead;
  try {
    lead = cleanLead(JSON.parse(leadJson));
  } catch {
    return { saved: false };
  }
  if (!lead) return { saved: false };
  const [contact, slots] = await Promise.allSettled([createContact(lead, transcript), getSlots()]);
  const contactId = contact.status === "fulfilled" ? contact.value : null;
  if (!contactId) return { saved: false };
  return {
    saved: true,
    contactId,
    token: await signContact(contactId),
    slots: slots.status === "fulfilled" ? slots.value : [],
  };
}

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function splitTour(text) {
  const tour = [];
  const reply = text
    .replace(/\[\[tour:([a-z-]+)\]\]/g, (_, id) => {
      if (TOUR[id] && !tour.some((stop) => stop.id === id) && tour.length < 2) {
        tour.push({ id, ...TOUR[id] });
      }
      return "";
    })
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { reply, tour };
}

export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return json({ error: "method_not_allowed" }, 405);
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return json({ error: "chat_not_configured" }, 503);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "invalid_request" }, 400);
    }

    const messages = body?.messages;
    if (!Array.isArray(messages) || messages.length < 1 || messages.length > MAX_MESSAGES) {
      return json({ error: "invalid_request" }, 400);
    }

    const input = [];
    for (const message of messages) {
      if (!message || !["user", "assistant"].includes(message.role) || typeof message.content !== "string") {
        return json({ error: "invalid_request" }, 400);
      }
      const content = message.content.trim();
      if (!content || content.length > MAX_MESSAGE_LENGTH) return json({ error: "invalid_request" }, 400);
      // The Messages API requires the first turn to be the user's; skip the client greeting.
      if (!input.length && message.role === "assistant") continue;
      input.push({ role: message.role, content });
    }
    if (!input.length || input.at(-1).role !== "user") return json({ error: "invalid_request" }, 400);

    const now = Date.now();
    const ip = (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
    const recent = (requestCounts.get(ip) || []).filter((time) => now - time < WINDOW_MS);
    if (recent.length >= MAX_REQUESTS_PER_WINDOW) return json({ error: "rate_limited" }, 429);
    recent.push(now);
    requestCounts.set(ip, recent);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: MAX_OUTPUT_TOKENS,
          system: instructions,
          messages: input,
        }),
      });

      if (!response.ok) return json({ error: "chat_unavailable" }, 502);
      const result = await response.json();
      const text = result.content?.find((block) => block.type === "text")?.text;
      if (typeof text !== "string" || !text.trim()) return json({ error: "chat_unavailable" }, 502);
      const leadMatch = text.match(/\[LEAD:(\{[\s\S]*?\})\]/);
      const { reply, tour } = splitTour(text.replace(/\[LEAD:\{[\s\S]*?\}\]/g, ""));
      if (!reply) return json({ error: "chat_unavailable" }, 502);
      const transcript = leadMatch
        ? [...input, { role: "assistant", content: reply }]
            .map((m) => `${m.role === "user" ? "Visitor" : "Savvy"}: ${m.content}`)
            .join("\n\n")
            .slice(-MAX_TRANSCRIPT_LENGTH)
        : "";
      const alreadySaved = input.some((m) => m.role === "assistant" && /passed your details to the team/i.test(m.content));
      const lead = leadMatch && !alreadySaved ? await saveLead(leadMatch[1], transcript) : null;
      return json({ reply, tour, lead });
    } catch {
      return json({ error: "chat_unavailable" }, 502);
    }
  },
};
