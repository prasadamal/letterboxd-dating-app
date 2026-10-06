// ReelMates Plus entitlement. Active while users.plus_until is in the future.

export function isPlusActive(user, now = Date.now()) {
  const until = user?.plus_until ? Date.parse(user.plus_until) : NaN
  return Number.isFinite(until) && until > now
}

export function plusSummary(user, now = Date.now()) {
  const active = isPlusActive(user, now)
  return { active, until: active ? new Date(Date.parse(user.plus_until)).toISOString() : null }
}

// RevenueCat webhook events → new plus_until (ISO string), null to end Plus now, or undefined to leave it.
// Docs: https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields
const GRANTING = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE', 'UNCANCELLATION', 'NON_RENEWING_PURCHASE', 'SUBSCRIPTION_EXTENDED', 'TEMPORARY_ENTITLEMENT_GRANT'])

export function plusUntilFromRevenueCat(event) {
  if (!event?.type) return undefined
  if (GRANTING.has(event.type)) {
    const ms = Number(event.expiration_at_ms)
    // Lifetime purchases have no expiry.
    return Number.isFinite(ms) && ms > 0 ? new Date(ms).toISOString() : '9999-12-31T00:00:00.000Z'
  }
  if (event.type === 'EXPIRATION') return null
  // CANCELLATION / BILLING_ISSUE: access continues until the paid period ends; EXPIRATION follows.
  return undefined
}
