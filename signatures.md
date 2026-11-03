---
status: DRAFT — not applied to Smartlead
---

# Sender signatures + footer

Plain text. No images, no tracking links. Applied per mailbox in Smartlead (Email Accounts → mailbox → Signature).

## Signature block (one per mailbox)

```
{First Last}
Savvy Producer
2200 Envoy Circle, Louisville, KY 40299
```

## Footer (opt-out)

Uses Smartlead's `%unsubscribe-text%` placeholder. The unsubscribe text itself is set in the campaign setting "Add unsubscribe message in all emails".

```
%unsubscribe-text%
```

Suggested unsubscribe text: `Not interested? Reply "unsubscribe" or click here to opt out.`

## Per-mailbox sheet

| Mailbox | Name | Signature applied |
|---|---|---|
| amanda@svmktg.net | Amanda Kaye | no |
| joshua@svmktg.net | Joshua Paul | no |
| paul@svmktg.net | Paul Phillips | no |
| jm@svmktg.net | Jason Michael | no |
| jp@svprod.org | Josh Phelps | no |
| jr@svprod.org | Jason Richter | no |
| justin@svprod.org | Justin Richter | no |
| angie@svprod.org | Angie Laracuente | no |

Source: ~/Desktop/emails_savvy.txt (8 mailboxes; pilot plan says 6 — pending decision).

## Open
- `%unsubscribe-text%` is the documented Smartlead tag (not `{{unsubscribe_link}}`). Confirm it renders in a real send; it does not appear in test emails.
- Smartlead's "Optimize Email Delivery" setting disables HTML, which removes the unsubscribe link. Plain-text sending and the link conflict if that setting is on — decide before launch.
- Create all 8 or only 6 in Smartlead (pilot plan = 6)?
