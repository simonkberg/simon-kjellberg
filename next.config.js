'use strict'

const withOffline = require('next-offline')

module.exports = withOffline({
  distDir: '../.next',
  serverRuntimeConfig: {
    gtmId: process.env.GTM_ID,
  },
  publicRuntimeConfig: {
    siteTitle: 'Simon Kjellberg',
    siteDescription:
      'Fullstack web developer, specialized in React, Node.js, and GraphQL, with a strong focus on building scalable frontend architecture.',
  },
  workboxOpts: {
    exclude: [/\.woff$/, /\.map$/, /^manifest.*\.js(?:on)?$/],
    runtimeCaching: [{ urlPattern: /\/.*?/, handler: 'networkFirst' }],
  },
  webpack: (config, options) => {
    const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
    const PacktrackerPlugin = require('@packtracker/webpack-plugin')

    return {
      ...config,
      async entry() {
        const entry = await config.entry()
        const urlPolyfill = require.resolve('url-polyfill')
        const mainEntry = entry['main.js']

        if (mainEntry && !mainEntry.includes(urlPolyfill)) {
          mainEntry.unshift(urlPolyfill)
        }

        return entry
      },
      devtool: options.dev ? config.devtool : 'source-map',
      module: {
        ...config.module,
        rules: [
          ...config.module.rules,
          {
            test: /\.css$/,
            loader: require.resolve('raw-loader'),
          },
          {
            test: /\.(woff2?|ico|png)$/,
            loader: require.resolve('url-loader'),
            options: {
              limit: 1000,
              publicPath: '/_next/static/assets/',
              outputPath: 'static/assets/',
              name: '[name].[hash:8].[ext]',
            },
          },
          {
            test: /\.(graphql|gql)$/,
            loader: require.resolve('graphql-tag/loader'),
          },
        ],
      },
      optimization: {
        ...config.optimization,
        minimizer: options.dev
          ? config.optimization.minimizer
          : config.optimization.minimizer &&
            config.optimization.minimizer.map(plugin => {
              if (plugin.constructor.name === 'TerserPlugin') {
                plugin.options.sourceMap = true
              }

              return plugin
            }),
      },
      plugins: [
        ...config.plugins,
        new BundleAnalyzerPlugin({
          reportFilename: 'report.html',
          analyzerMode: 'static',
          openAnalyzer: false,
          logLevel: 'warn',
        }),
        new PacktrackerPlugin({
          project_token: process.env.PACKTRACKER_PROJECT_TOKEN,
          upload:
            process.env.PACKTRACKER_PROJECT_TOKEN != null &&
            process.env.CI === 'true' &&
            options.dev === false &&
            options.isServer === false,
        }),
      ],
      node: {
        ...config.node,
        Buffer: false,
      },
    }
  },
})
