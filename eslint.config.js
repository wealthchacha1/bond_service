// eslint.config.js
module.exports = [
  {
    files: ['**/*.js'],
    ignores: ['node_modules/**', 'logs/**'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { node: true, es2021: true },
    },
    plugins: {},
    rules: {
      'no-eval': 'error',
      'no-new-func': 'error',
      'no-process-env': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-restricted-modules': [
        'error',
        { paths: ['child_process'], patterns: ['child_process/*'] },
      ],
      'no-deprecated-api': 'warn',
      'no-sync': 'warn',
      'no-buffer-constructor': 'error',
      'no-with': 'error',
    },
  },
];
