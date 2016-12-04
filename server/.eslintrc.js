module.exports = {
  extends: '../.eslintrc.js',
  rules: {
    'comma-dangle': [2, {
      arrays: 'always-multiline',
      objects: 'always-multiline',
      imports: 'always-multiline',
      exports: 'always-multiline',
      functions: 'never',
    }],
  },
  env: {
    browser: false,
  },
}
