# Savvy Producer — cold email outbound

Separate workspace. Work done for Savvy Producer (client/friend's company), not YBRYX. Keep all files, domains, copy and decisions for this engagement in this folder.

## Ownership
- Savvy Producer owns: the IONOS account, the domains, and the Smartlead account.
- The operator works inside their logins. Never store or request their credentials in this folder or in chat. API keys go in environment variables only.
- Company base: Louisville, Kentucky, United States. Region: US. Physical mailing address and opt-out are required in every email (CAN-SPAM). Keep first lists US-only.

## Stack
- Domains and mailboxes: IONOS (US). SPF `v=spf1 include:_spf-us.ionos.com ~all`. SMTP `smtp.ionos.com`, IMAP `imap.ionos.com` (verify in the IONOS panel).
- Sending/warmup: Smartlead (Pro tier covers 30k/month; verify current limits).
- DMARC: start `p=none` with rua reporting, tighten after reports show SPF/DKIM pass.

## Plan (see chat history for detail)
- UPDATE: target volume is now BELOW 500/day (exact number TBD). The 500/day and 30k/month figures below are the earlier ceiling, not the target; wave sizes need resizing once the daily number is set.
- Sequence: 3 emails per recipient. Start at 500 sends/day, ramp to ~1,430/day (30k/month).
- Pilot: 2 domains, 6 mailboxes (3 per domain), 30 sends/mailbox/day max.
- Wave 2: +5 domains / 15 mailboxes (total 7 / 21) for 500/day.
- Wave 3: +11 domains / 33 mailboxes (total 18 / 54) for 30k/month.
- Gate A (pilot review) and Gate B (one stable week at 500/day) before buying each next wave.

## Status
- Domains acquired in Savvy Producer's IONOS account. Record sheet: `dns-setup.md`.

## Open items
- Company domains: `savvyleads.io`, `savvy-marketing.io` (https://savvy-marketing.io/). Outreach brand: Savvy Leads (`savvyleads.io`). Sending domains `svmktg.net` and `svprod.org` (svprod.org: in IONOS, confirm as pilot pair) should 301 to `savvyleads.io` (confirm). Neither name resembles "Savvy Leads"; consider closer lookalikes for later waves.
- Whether `svmktg.net` is a Savvy Producer domain and what it stands for.
- IONOS written answer on cold/bulk email policy and DKIM support for the chosen mail product, before buying beyond the pilot.
- Confirm IONOS mailbox and .com domain pricing from IONOS directly.

## Rules
- Do not buy domains or mailboxes without approval of the specific list.
- Send plain text, no open/link tracking, verified lists only, bounces < 2–3%, complaints < 0.1%.
