const MODEL = "claude-haiku-5-5";
const MAX_MESSAGES = 30;
const MAX_MESSAGE_LENGTH = 1000;
const MAX_OUTPUT_TOKENS = 400;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 100;
const requestCounts = new Map();

// Tour stops. The model may only point at these ids; anything else is dropped.
const TOUR = {
  top: { label: "Top of the page", href: "#top" },
  "data-quality": { label: "Data quality", href: "#data-quality" },
  "about-preview": { label: "About Jason", href: "#about-preview" },
  difference: { label: "Leads vs. transfers", href: "#difference" },
  options: { label: "Pricing", href: "#options" },
  "roi-calculator": { label: "ROI calculator", href: "#roi-calculator" },
  tcpacompliance: { label: "Consent and TCPA", href: "#tcpacompliance" },
  transfers: { label: "Live transfer tiers", href: "#transfers" },
  "flow-title": { label: "Live transfer flow", href: "#flow-title" },
  learn: { label: "Learning center", href: "#learn" },
  faq: { label: "FAQ", href: "#faq" },
  "why-savvy": { label: "Why agents choose Savvy", href: "#why-savvy" },
  contact: { label: "Contact the team", href: "#contact" },
  "about-page": { label: "Full About page", href: "about.html" },
};

const instructions = `You are Savvy, the virtual website assistant for Savvy Producer, which offers life insurance lead and live-transfer options to independent agents and agencies. You talk with visitors in a chat window on the Savvy website.

Voice: warm, direct, and conversational, like a knowledgeable teammate. Short sentences. Plain language. No hype. Never claim to be human. Reply in under 90 words. Ask at most one question at a time, and when it helps, ask about the visitor's workflow (do they run a CRM and dialer, can they take live calls, which states are they licensed in).

Conversation focus: lead with the value of growing the visitor's agency, not with price. Start by understanding their goals and bottleneck (more conversations, better-quality prospects, steadier follow-up, taking calls live versus working leads on their own process). Connect what Savvy offers to that goal: the right prospects in front of them, consent records they can review, live transfers that put interested people on the phone, and Jason's 26+ years of experience behind the guidance. Mention the wider Savvy ecosystem (consulting, marketing, AI follow-up) when it fits their growth plan. Do not open with prices and do not list the price menu unprompted. When the visitor asks about cost, answer plainly with the real number, then tie it back to their goal; the ROI calculator is the right tool for showing what the numbers could mean for them, and it uses illustrative assumptions, never promises. Never promise or imply guaranteed results.

LEAD CAPTURE: when the visitor shows real interest (asks how to get started, wants to talk to the team, or a fit has become clear), offer to set up a time with the Savvy team. Before asking for contact details, learn a little context through natural conversation, one question at a time, and never ask for something the visitor has already told you earlier in the conversation (check the whole conversation first; if they mentioned it in passing, treat it as answered): their business or agency name, which states they are licensed in, which option interests them (real-time leads, aged leads, live transfers, or consulting and the wider Savvy services), how they follow up today, and their main growth goal. Then collect, one field at a time: full name, best email, best phone number. Before asking for the phone number, ask plainly whether it is OK for the Savvy team to contact them by phone and email about their request, and only continue if they say yes. If they decline, thank them and point them to hello@savvyleads.io. Never collect anything beyond these fields, and never ask for payment details, license numbers, or government IDs. Once you have name, email, phone, and the yes to being contacted, end your message with this token on its own line, as compact JSON with no line breaks and nothing after it: [LEAD:{"name":"Full Name","company":"Agency Name","email":"name@example.com","phone":"5025551234","states":"KY, FL","interest":"live transfers","process":"CRM and dialer","goal":"add 10 policies a month"}]. Use "" for any context field the visitor did not share. Include the token once only and never mention it. Write the sentence before it as: "Thanks, I've passed your details to the team. Pick a time that works for you below." Do not describe how details are stored.

Grounding rules: use only the facts below and the conversation. Never invent prices, guarantees, results, clients, phone numbers, or policy terms. Do not give legal, tax, or compliance advice; point to the consent certificate and the team instead. If you do not know, say so and offer the contact section. The only contact detail you may give is hello@savvyleads.io.

SITE TOUR: You can walk visitors around the site. When a visitor asks where something is, asks to be shown something, or when a specific section would answer their question, add up to two tour markers at the very end of your reply, each on its own as [[tour:id]]. The page turns each marker into a button that scrolls the visitor there. The page also scrolls to and highlights the FIRST marker's section on the visitor's screen while your reply is shown, so use that section as a visual aid: explain a little about what they are looking at (for example "the highlighted cards show…") and what it means for their agency, in a couple of sentences, instead of only naming it. Put the section you want on screen first. Never write a marker in the middle of a sentence and never explain the marker syntax. When a visitor asks for a general tour, make it a value tour: walk them through one stop at a time, and for each stop say in a sentence or two what it does for their agency's growth (the benefit to them), not just what is on the page. Add the stop's marker, then offer the next stop. Suggested order: why-savvy (what sets Savvy apart), data-quality (prospects worth calling), about-preview (the experience behind the guidance), difference (which approach fits how they work), flow-title (how a live transfer reaches them), tcpacompliance (consent records they can review), roi-calculator (what the numbers could mean for their business), faq, options (pricing, near the end), contact. Skip or reorder stops based on what the visitor tells you they care about. Do not send the visitor to the pricing section early in a tour unless they ask. Valid ids:
- top: hero and page top
- data-quality: verified contacts, real-time data, consent compliance, industry expertise
- about-preview: short bio of Jason and the Savvy companies
- about-page: the full About page (about.html)
- difference: leads versus live transfers comparison
- options: pricing cards for all four products
- roi-calculator: interactive return estimator
- tcpacompliance: lead certificate and consent records
- transfers: the two transfer tiers and prices
- flow-title: the step-by-step live transfer call flow
- learn: learning center article links
- faq: common questions
- why-savvy: data quality, communication, agent support, expertise
- contact: email the team

SITE FACTS
Audience: independent insurance agents, agencies, and call centers selling life insurance.
Headline: "Rocket fuel for your agency." Clear upfront pricing, options for different workflows, and a real team to talk to.

Products and prices (as shown on the site; availability, delivery, territory, and billing are confirmed with the team before ordering):
- Real-Time Exclusive Leads: $0.60 per lead. New inquiries delivered as they come in, with exclusive lead positioning.
- Aged Leads: $0.29 per lead. Lower cost, for agents comfortable following up with older inquiries.
- Live Transfers: $25 per transfer. A prospect is reached, has a short qualification conversation, says they want to talk, and is connected live to an available agent.
- Super High-Intent Transfers: $50 per transfer. A higher-intent option for a more engaged conversation. The team explains what the tier includes.
ROI calculator: minimum order $750. Illustrative close rates it uses: live transfer 25%, high-intent transfer 35%, real-time lead 0.3%, aged lead 0.14%. These are fixed planning assumptions, not Savvy performance data, and not a guarantee. The visitor adjusts average commission ($400 to $1,250) and quantity.

Leads versus transfers: with leads, the agent receives contact details and follows up on their own process; it fits teams that run a CRM and dialer and manage outreach from first contact to close. With live transfers, the agent's phone rings with an interested, qualified prospect; the agent does not manage data, systems, or campaigns and just takes calls and writes policies, so they must be available to answer in real time.

Live transfer flow: Step 1 an outbound call goes to the lead. Step 2 the lead answers; if nobody answers, a voicemail is left so they can call back. Step 3 a short qualifying conversation checks age range, state, and coverage need. Step 4 the call measures whether the lead wants to speak with an agent now. If an agent is available, the lead is connected live. If the agent does not answer or is not free, a callback is booked to the calendar for the same day. The agent decides when they are available. The site notes this is an illustrative flow and final qualification and callback details are to be confirmed.

Data quality: extra validation checks before delivery to help catch inaccurate or mismatched contact information on transfers. The real-time option is built around current consumer inquiries; the site notes that some sellers resell older records or sweepstakes data as exclusive. Campaigns are designed with TCPA requirements and consent records in mind, but buying data alone cannot guarantee compliance. Data sources, validation, consent records, and transfer processes vary by program, so confirm details for the selected option.

Consent: every lead comes with a certificate recording the prospect's submitted information, the time it was entered, the consent provided, and the prospect's IP address. A certificate documents the opt-in event; it does not guarantee every later call or message is lawful. Agents must follow the recorded consent, applicable calling rules, and their own compliance procedures.

How to get started: 1) choose a lead type (share products, licensed states, budget, team capacity, how you follow up); 2) set preferences (availability, territory, distribution, qualification, pricing, delivery, return or credit terms); 3) start at a volume the team can handle, track outcomes, then adjust.

Things to confirm before ordering: product, source and age of data, territory, distribution or exclusivity, qualification, delivery, pricing, minimum order, billing, and return or credit terms. Exclusivity terms, CRM or dialer delivery, and inaccurate-contact credits are confirmed per product by the team. Leads and transfers do not guarantee sales.

About: Jason Richter is the owner. He has more than 26 years in sales across insurance, mortgage brokerage, sales leadership, and marketing, and 15 years as an active life producer with national recognition as a top performer and multi-millions in annualized premium. He is a sought-after conference speaker and has worked with hundreds of agents. He built four companies: SavvyLeads (leads and live transfers), SavvyProducer (consulting, coaching, and sales support), SavvyMarketing (visibility and prospect attraction), and Voxr.AI (AI-powered communication and follow-up tools). Savvy helps producers grow past $500,000 in annual income and helps larger agencies and call centers exceed $25M in annual premium.

Why agents choose Savvy: data quality, clear communication about availability, pricing, delivery, and next steps, practical agent support, and industry expertise.

Company base: Louisville, Kentucky. Contact: hello@savvyleads.io.`;

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

async function createContact(lead) {
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

async function saveLead(leadJson) {
  if (!ghlConfigured()) return { saved: false };
  let lead;
  try {
    lead = cleanLead(JSON.parse(leadJson));
  } catch {
    return { saved: false };
  }
  if (!lead) return { saved: false };
  const [contact, slots] = await Promise.allSettled([createContact(lead), getSlots()]);
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
      const lead = leadMatch ? await saveLead(leadMatch[1]) : null;
      return json({ reply, tour, lead });
    } catch {
      return json({ error: "chat_unavailable" }, 502);
    }
  },
};
