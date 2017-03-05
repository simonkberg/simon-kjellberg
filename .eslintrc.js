module.exports = {
  extends: '@simonkberg/eslint-config-react',
  rules: {
    'object-curly-spacing': [0, 'always'],
    'no-mixed-operators': 0,
  },
  globals: {
    __DEV__: false,
    __BROWSER__: false,
  },
}
