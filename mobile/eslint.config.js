const { defineConfig } = require('eslint/config')
const expoConfig = require('eslint-config-expo/flat')
module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/*'] },
  {
    // Compiler diagnostics remain visible; this app uses imperative RN Animated
    // refs and initial async fetches in effects, without enabling React Compiler.
    rules: {
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn'
    }
  }
])
