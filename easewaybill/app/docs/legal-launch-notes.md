# EaseWaybill Legal Section — Launch Notes

Reference notes for whoever builds the legal pages, footer, cookie banner, and
registration flow. This is a build/implementation reference, not published
legal content — it doesn't go live as a page itself.

---

## A. Site Structure / Navigation

Route structure (Next.js App Router, static folder per document):

```
/legal                          → hub page: intro + links to all policies below
  /legal/privacy-policy
  /legal/refund-policy
  /legal/terms-and-conditions
  /legal/cookie-policy
  /legal/accessibility-statement
  /legal/copyright-ip-policy
  /legal/tracking-analytics
  /legal/fake-reviews-policy
  /legal/third-party-services
  /legal/business-details       → or fold into /contact once real details exist
```

**Hub page (`/legal`) should contain:**

1. A short intro paragraph — what this section covers, where to find each policy.
2. A list/grid of links to each page below, each with a one-line summary.
3. "Last updated" date shown next to each linked document.
4. A contact block at the bottom for legal/privacy questions.

**Not part of the public route tree:**

- The internal regulatory gap-analysis (open CBN/NDPC questions) and the legal
  review checklist stay out of `/legal` entirely — they're planning documents
  for the team and legal advisor, not consumer-facing pages. Keep them in
  `internal-docs/` or wherever internal working docs live, not in `content/legal/`.

---

## B. Footer Legal-Links Structure

Primary row (shown in every page footer):

```
Privacy Policy | Refund Policy | Terms & Conditions | Cookie Policy | Accessibility | Copyright | Contact
```

If footer space is tight, move the less-trafficked pages into a "More" dropdown
or the hub page only:

```
Tracking & Analytics Disclosure · Fake Reviews & User Content Policy · Third-Party Services
```

Implementation: `components/legal/LegalFooterLinks.tsx`.

---

## C. Cookie-Consent Banner Copy

Shown on first visit, dismissible, persisted via a stored preference:

> We use cookies to run EaseWaybill and, with your consent, to understand how
> it's used. See our Cookie Policy for details.
>
> **[Accept All]** **[Reject Non-Essential]** **[Manage Preferences]**

**Implementation notes:**

- "Accept All" / "Reject Non-Essential" must actually gate whether
  non-essential scripts (analytics, etc.) load — a stored preference that
  doesn't control script loading isn't real consent.
- "Manage Preferences" should open a panel listing cookie categories from the
  Cookie Policy (essential, authentication/session, security, analytics,
  preference, third-party), matching that document's category table.
- Component: `components/legal/CookieConsentBanner.tsx`.

---

## D. Email-Verification / Registration Privacy Notice

Short notice to display near the sign-up form and/or in the verification email:

> By creating an account, you agree to EaseWaybill's Terms & Conditions and
> Privacy Policy. We'll send a verification link/code to the email address you
> provide to confirm it's yours. We use your account information to set up
> and secure your EaseWaybill account, process orders, and provide support.
> See our Privacy Policy for details on how we handle your data.

**Implementation notes:**

- Link "Terms & Conditions" and "Privacy Policy" directly to their routes.
- This notice should appear at the point of account creation, not buried in a
  footer — it needs to be seen before the user submits the form.

---

## Open items before this goes live

These come from the fuller legal review checklist — flagging the ones that
directly block building the pages above:

- [ ] Actual effective/last-updated dates for each policy (frontmatter values)
- [ ] Actual analytics tool(s) in use, so the Cookie Policy's category
      descriptions and the "Manage Preferences" panel match reality
- [ ] Actual escrow auto-release window and dispute-submission window
      (referenced in Terms & Conditions / Refund Policy — banner/notice copy
      above doesn't depend on these, but linked pages do)
- [ ] Confirmed business/contact details for the footer's "Contact" link
      target and the verification notice's linked policies

See the full legal review checklist (internal doc) for the complete list,
including the regulatory items that need a Nigerian lawyer's sign-off before
any of this is published.
