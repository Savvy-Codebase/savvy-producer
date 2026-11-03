# DNS + mailbox setup — pilot domains

Domains (in Savvy Producer's IONOS account): `svmktg.net`, `svprod.org` (svprd.net dropped; confirm svprod.org as the second pilot domain).
Enter records in IONOS: Domains → domain → DNS. Verify every value against the IONOS panel; items marked CHECK come from memory or third-party guides.

## Per-domain records

| Type | Host | Value | Notes |
|---|---|---|---|
| MX | `@` | `mx00.ionos.com` (prio 10), `mx01.ionos.com` (prio 10) | CHECK. Usually created automatically when a mail product is attached to the domain. |
| TXT (SPF) | `@` | `v=spf1 include:_spf-us.ionos.com ~all` | CHECK. IONOS may add its own SPF suggestion; keep one SPF record only. |
| DKIM | selector from panel | value from panel | Copy host + value from IONOS per domain. Confirm DKIM is offered for the chosen mail product before buying more. |
| TXT (DMARC) | `_dmarc` | `v=DMARC1; p=none; rua=mailto:<REPORT_ADDRESS>; adkim=r; aspf=r` | Fill `<REPORT_ADDRESS>` (a mailbox or DMARC-service address, not a sending mailbox). |
| CNAME (tracking) | `track` | `<Smartlead tracking target>` | Get the target from Smartlead → custom tracking domain. |
| Web redirect | `@` / `www` | 301 → `https://savvyleads.io` (outreach brand) | Confirm. Same target for both pilot domains. |

## Mailboxes
- 3 per domain (6 total), real-person names, e.g. `first.last@svprod.org`. Names TBD.
- Max 30 sends/mailbox/day. IONOS hourly caps (account age): 50/h days 0–7, 100/h days 8–14, 400/h days 15–30, 500/h after.

## Order per domain
1. SPF, then DKIM.
2. Send a test message; confirm SPF + DKIM pass (EasyDMARC checker, mail-tester).
3. DMARC at `p=none`.
4. Tracking CNAME.
5. MXToolbox check.
6. Connect to Smartlead (SMTP `smtp.ionos.com`, IMAP `imap.ionos.com` — CHECK ports/security in panel), start warmup.

## Before leaving pilot
- IONOS written answer on cold/bulk email policy.
- Gate A: bounce < 2%, complaints < 0.1%, acceptable seed-test placement, no IONOS throttling/suspension.
