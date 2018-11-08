'use strict'

const env = process.env.BABEL_ENV || process.env.NODE_ENV

module.exports = {
  presets: [
    [
      'next/babel',
      {
        'preset-env': {
          modules: env === 'test' ? 'cjs' : false,
        },
      },
    ],
    '@babel/preset-flow',
  ],
  plugins: [
    ['@babel/plugin-proposal-optional-chaining', { loose: true }],
    ['@babel/plugin-proposal-nullish-coalescing-operator', { loose: true }],
    'babel-plugin-emotion',
  ],
}
