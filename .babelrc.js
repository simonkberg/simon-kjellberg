'use strict'

module.exports = {
  compact: false,
  presets: [
    [
      'env',
      {
        targets: {
          node: 'current',
          browsers: 'last 2 versions',
          uglify: true,
        },
        modules: false,
        useBuiltIns: true,
      },
    ],
    'react',
    'stage-0',
  ],
  env: {
    production: {
      presets: ['react-optimize'],
      plugins: ['transform-react-remove-prop-types'],
    },
  },
  plugins: ['react-hot-loader/babel'],
}
