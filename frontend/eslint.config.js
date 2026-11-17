import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**']
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    settings: {
      react: {
        version: '18.3'
      }
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-icons',
              message: 'Icons must be imported from lucide-react only (Constitution Principle VI).'
            },
            {
              name: '@heroicons/react',
              message: 'Icons must be imported from lucide-react only (Constitution Principle VI).'
            }
          ],
          patterns: [
            {
              group: ['react-icons/*', '@heroicons/*', '@tabler/*'],
              message: 'Icons must be imported from lucide-react only (Constitution Principle VI).'
            }
          ]
        }
      ]
    }
  }
];
