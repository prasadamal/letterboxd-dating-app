# Production backlog (prioritized)

## Done in foundation pass

- [x] Env validation at startup
- [x] Remove committed anon JWT from `.env.example`
- [x] RLS + revoke direct anon DB table access
- [x] Structured logging + request IDs
- [x] Rate limiting + security headers
- [x] Central error handler + route validation (Zod)
- [x] API versioning `/api/v1`
- [x] Health check with DB probe
- [x] Audit logs table + hooks on signup/avatar
- [x] Password reset + email verification (token flow; email via Resend when configured)
- [x] Avatar upload to Supabase Storage
- [x] Profile completeness endpoint
- [x] Discovery prefs on profile update
- [x] CI workflow + Docker + unit tests (validation)

## Next — app features

- [x] Push notification provider (Expo push + device tokens table)
- [x] Message moderation queue + admin review UI (`/admin`)
- [x] Advanced match filters using `discovery_prefs`
- [ ] Inactivity cleanup job (pg_cron or external worker)
- [ ] Age/location verification (manual or vendor)
- [x] Onboarding wizard screens (mobile)
- [x] Premium UI pass (motion, onboarding, chat, deck)

## Next — platform

- [ ] Full OpenAPI spec + Swagger UI
- [ ] Integration tests against test Supabase project
- [x] Staging environment + seed scripts (`STAGING.md`)
- [x] Admin role + RBAC for moderation (`ADMIN_API_KEY`)
- [ ] E2E mobile tests (Detox/Maestro)
