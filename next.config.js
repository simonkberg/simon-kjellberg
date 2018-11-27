'use strict'

const path = require('path')
const withOffline = require('next-offline')
const app = require('./app.config')

module.exports = withOffline({
  distDir: path.relative(app.src, app.dest),
  serverRuntimeConfig: {
    gtmId: app.gtmId,
  },
  publicRuntimeConfig: {
    siteTitle: app.title,
    siteDescription: app.description,
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
