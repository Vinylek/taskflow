const js = require('@eslint/js');
const globals = require('globals');
const prettier = require('eslint-config-prettier');
const security = require('eslint-plugin-security');

module.exports = [
  { ignores: ['node_modules/', 'coverage/', 'dist/', '.vscode'] },
  js.configs.recommended,
  // SAST : détection des patterns dangereux (eval, regex ReDoS, injection d'objet…)
  security.configs.recommended,
  {
    // Backend Node.js (CommonJS)
    files: ['server.js', 'src/**/*.js', 'test/**/*.js', 'eslint.config.js', 'commitlint.config.js'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
  },
  {
    // Frontend (navigateur)
    files: ['public/**/*.js'],
    languageOptions: { sourceType: 'script', globals: globals.browser },
    rules: {
      // XSS : interdit innerHTML / outerHTML / insertAdjacentHTML / document.write
      'no-restricted-properties': [
        'error',
        { property: 'innerHTML', message: 'XSS : utiliser textContent ou createElement.' },
        { property: 'outerHTML', message: 'XSS : utiliser textContent ou createElement.' },
        { property: 'insertAdjacentHTML', message: 'XSS : utiliser createElement.' },
        { object: 'document', property: 'write', message: 'XSS : utiliser createElement.' },
      ],
    },
  },
  {
    rules: {
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
    },
  },
  prettier, // toujours en dernier : désactive les règles de style en conflit
];
