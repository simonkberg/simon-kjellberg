'use strict'

const path = require('path')
const withOffline = require('next-offline')
const app = require('./app.config')
const bsconfig = require('./bsconfig')

module.exports = withOffline({
  distDir: path.relative(app.src, app.dest),
  pageExtensions: ['js', 'bs.js'],
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
    const resolve = require('resolve')
    const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
    const PacktrackerPlugin = require('@packtracker/webpack-plugin')

    const bsDependencies = bsconfig['bs-dependencies'].map(
      name => new RegExp(`node_modules/${name}`)
    )

    bsDependencies.push(/node_modules\/bs-platform/)

    return {
      ...config,
      devtool: options.dev ? config.devtool : 'source-map',
      externals: options.isServer
        ? (context, request, callback) => {
            const [nextExternals] = config.externals

            resolve(
              request,
              { basedir: options.dir, preserveSymlinks: true },
              (err, res) => {
                if (err) {
                  return callback()
                }

                if (bsDependencies.some(dep => res.match(dep))) {
                  return callback()
                }

                return nextExternals(context, request, callback)
              }
            )
          }
        : config.externals,
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
  experimental: {
    modern: true,
  },
})
