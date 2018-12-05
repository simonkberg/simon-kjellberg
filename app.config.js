'use strict'

const { resolve } = require('path')

module.exports = {
  src: resolve('src'),
  lib: resolve('lib'),
  dest: resolve('.next'),
  title: 'Simon Kjellberg',
  description:
    'Fullstack web developer, specialized in React, Node.js, and GraphQL, ' +
    'with a strong focus on building scalable frontend architecture.',
  gtmId: process.env.GTM_ID,
}
