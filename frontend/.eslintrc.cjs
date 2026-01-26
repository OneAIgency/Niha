module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  plugins: ['react-refresh', 'react'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    // Prevent duplicate JSX attributes (e.g., duplicate className)
    'react/jsx-no-duplicate-props': 'error',
    // React is in scope with new JSX transform, so we can disable this
    'react/react-in-jsx-scope': 'off',
    // Design system color enforcement
    'no-restricted-syntax': [
      'error',
      {
        selector: 'Literal[value=/slate-/]',
        message: 'Hardcoded slate-* colors not allowed. Use navy-* from design system instead. See docs/DESIGN_TOKENS_MIGRATION.md'
      },
      {
        selector: 'Literal[value=/gray-/]',
        message: 'Hardcoded gray-* colors not allowed. Use navy-* from design system instead.'
      },
      {
        selector: 'Literal[value=/^#[0-9a-fA-F]{3,8}$/]',
        message: 'Hardcoded hex colors not allowed. Use Tailwind classes or CSS variables from design system. See .claude/claude.md'
      },
      {
        selector: 'TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}/]',
        message: 'Hardcoded hex colors not allowed. Use Tailwind classes or CSS variables from design system.'
      }
    ]
  },
}
