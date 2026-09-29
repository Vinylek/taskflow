const js = require('@eslint/js');
const globals = require('globals');
const prettier = require('eslint-config-prettier');

module.exports = [
  { ignores: ['node_modules/', 'coverage/', 'dist/', '.vscode'] },
  js.configs.recommended,
  {
    // Backend Node.js (CommonJS)
    files: [
      'server.js',
      'src/**/*.js',
      'lib/**/*.js',
      'test/**/*.js',
      'eslint.config.js',
      'commitlint.config.js',
    ],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
  },
  {
    // Frontend (navigateur)
    files: ['public/**/*.js'],
    languageOptions: { sourceType: 'script', globals: globals.browser },
  },
  prettier, // toujours en dernier : désactive les règles de style en conflit
];
