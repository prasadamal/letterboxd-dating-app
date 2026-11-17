const { releaseConfig } = require('./scripts/release-config.cjs')
module.exports = ({ config }) => {
  const release = ['production', 'preview', 'simulator'].includes(process.env.EAS_BUILD_PROFILE) || process.env.REELMATES_RELEASE_CHECK === '1'
  const values = release ? releaseConfig(process.env) : null
  const projectId = values?.projectId || process.env.EXPO_PUBLIC_EAS_PROJECT_ID || config.extra?.eas?.projectId
  return {
    ...config,
    extra: {
      ...config.extra,
      ...(values ? { webUrl: values.web } : {}),
      ...(projectId ? { eas: { ...config.extra?.eas, projectId } } : {})
    }
  }
}
