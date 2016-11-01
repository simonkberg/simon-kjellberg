const path = require('path')

module.exports = {
  plugins: {
    'postcss-smart-import': {
      path: [path.join(__dirname, 'src')],
    },
    'postcss-cssnext': {
      browsers: ['last 2 versions'],
    },
  },
}
