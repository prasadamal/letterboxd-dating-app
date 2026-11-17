function publicHttps(value, name) {
  let url
  try { url = new URL(value) } catch { throw new Error(`${name} must be a public HTTPS URL`) }
  if (url.protocol !== 'https:' || url.username || url.password || /YOUR_|example\.|localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(url.hostname) || url.search || url.hash) {
    throw new Error(`${name} must be a public HTTPS URL without placeholders or credentials`)
  }
  return url.toString().replace(/\/$/, '')
}
function releaseConfig(env) {
  const api = publicHttps(env.EXPO_PUBLIC_API_URL, 'EXPO_PUBLIC_API_URL')
  if (!/\/api(?:\/v1)?$/.test(api)) throw new Error('EXPO_PUBLIC_API_URL must end in /api or /api/v1')
  const web = publicHttps(env.EXPO_PUBLIC_WEB_URL, 'EXPO_PUBLIC_WEB_URL')
  if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(env.EXPO_PUBLIC_EAS_PROJECT_ID || '')) throw new Error('Set EXPO_PUBLIC_EAS_PROJECT_ID to your Expo project UUID')
  return { api, web, projectId: env.EXPO_PUBLIC_EAS_PROJECT_ID }
}
module.exports = { releaseConfig, publicHttps }
