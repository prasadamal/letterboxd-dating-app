export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'ReelMates API',
    version: '1.0.0',
    description: 'Movie-taste dating platform API (v1). Authenticate with Bearer JWT from /auth/login or /auth/signup.'
  },
  servers: [{ url: '/api/v1' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    }
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/health': { get: { summary: 'Health + DB probe', security: [] } },
    '/health/db': { get: { summary: 'Database health', security: [] } },
    '/health/storage': { get: { summary: 'Storage health', security: [] } },
    '/platform/status': { get: { summary: 'Launch counters', security: [] } },
    '/auth/signup': { post: { summary: 'Register', security: [] } },
    '/auth/login': { post: { summary: 'Login', security: [] } },
    '/auth/refresh': { post: { summary: 'Rotate refresh token', security: [] } },
    '/auth/logout': { post: { summary: 'Revoke refresh token' } },
    '/auth/me': { get: { summary: 'Current user + platform' } },
    '/movies/daily': { get: { summary: 'Daily taste game films' } },
    '/movies/{id}/rate': { post: { summary: 'Rate film love/hate/skip' } },
    '/dating/deck': { get: { summary: 'Next dating profile + meta' } },
    '/dating/swipe': { post: { summary: 'Like or pass profile' } },
    '/dating/matches': { get: { summary: 'Mutual matches' } },
    '/dating/referral': { get: { summary: 'Referral code' } },
    '/messages/conversations': { get: { summary: 'Inbox list' } },
    '/messages/{userId}': { get: { summary: 'Thread messages (optional ?since=ISO)' } },
    '/messages/{userId}/read': { post: { summary: 'Mark peer messages read' } },
    '/messages': { post: { summary: 'Send message' } },
    '/users/profile': { get: { summary: 'Profile' }, put: { summary: 'Update profile + discovery prefs' } },
    '/users/profile/completeness': { get: { summary: 'Profile completion gate' } },
    '/users/avatar': { post: { summary: 'Upload avatar (base64)' } },
    '/users/verification/request': { post: { summary: 'Request manual age/location verification' } },
    '/notifications/register': { post: { summary: 'Register Expo push token' } },
    '/safety/block': { post: { summary: 'Block user' } },
    '/safety/report': { post: { summary: 'Report user' } },
    '/safety/account': { delete: { summary: 'Delete account' } },
    '/admin/moderation/queue': { get: { summary: 'Moderation queue (x-admin-key)' } },
    '/admin/moderation/{id}': { patch: { summary: 'Update moderation item' } },
    '/admin/users/{userId}/verification': { patch: { summary: 'Set verification status' } },
    '/internal/daily-reminders': { post: { summary: 'Cron: daily game push (x-cron-secret)' } },
    '/internal/inactivity-cleanup': { post: { summary: 'Cron: pause inactive matchmaking (x-cron-secret)' } }
  }
}
