import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  // TypeScript recommended rules
  ...tseslint.configs.recommended,

  // React hooks rules
  {
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },

  // Project-wide overrides
  {
    rules: {
      // Allow 'any' in a few pragmatic cases but warn
      '@typescript-eslint/no-explicit-any': 'warn',
      // Allow unused vars prefixed with _ (common pattern)
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Warn on console.log but allow error/warn for server logging
      'no-console': ['warn', { allow: ['error', 'warn'] }],
    },
  },

  // Ignore build output and generated files
  {
    ignores: ['.next/**', '.robo/**', 'node_modules/**', 'prisma/migrations/**'],
  },
)
