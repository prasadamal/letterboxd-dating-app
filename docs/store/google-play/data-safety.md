# Google Play — Data safety (draft answers)

Use these when filling the Data safety form. Re-check them whenever the app starts collecting something new.

| Question | Answer |
|----------|--------|
| Collects or shares user data? | Collects: yes. Shares with third parties: **no** (processors acting for us don't count as sharing) |
| Data encrypted in transit | Yes (HTTPS) |
| Users can request deletion | Yes — **in the app** (Profile → Delete account) and by emailing support |
| Account deletion URL (required by Play) | Link to the "Retention" section of `docs/legal/PRIVACY_POLICY.md`, or a page on your domain explaining in-app deletion |

### Data types

| Play category → type | Collected | Optional? | Purpose |
|------|-----------|-----------|---------|
| Personal info → Email address | Yes | Required | Account management |
| Personal info → Name | Yes | Required | App functionality (profile) |
| Personal info → Other info (age, gender, country, bio) | Yes | Required | App functionality (matching) |
| Personal info → User IDs | Yes | Required | Account management |
| Photos and videos → Photos | Yes | Optional (needed for dating) | App functionality (profile photo) |
| Messages → Other in-app messages | Yes | Optional | App functionality (chat) |
| App activity → App interactions (ratings, likes, passes) | Yes | Required | App functionality (matching) |
| App activity → Other user-generated content (reports) | Yes | Optional | Fraud prevention, security |
| Device or other IDs (push token) | Yes | Optional | App functionality (notifications) |
| App info and performance → Crash logs | Only if `SENTRY_DSN` is set | — | Analytics / diagnostics |

Not collected: location, contacts, financial info, health, browsing history, advertising IDs.

### Security practices
- Data encrypted in transit
- Users can delete their account and data in the app
- Follows Play's Families policy: not applicable (18+ only)
