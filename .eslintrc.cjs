/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-prettier/skip-formatting'
  ],
  // rules: {
  //   'vue/max-attributes-per-line': [
  //     'warn',
  //     {
  //       singleline: {
  //         max: 10
  //       },
  //       multiline: {
  //         max: 10
  //       }
  //     }
  //   ],
  //   'vue/first-attribute-linebreak': ['off'],
  //   'vue/html-indent': ['off'],
  //   'vue/html-closing-bracket-newline': ['off'],
  //   'vue/singleline-html-element-content-newline': ['off']
  // },
  parserOptions: {
    ecmaVersion: 'latest'
  }
}
