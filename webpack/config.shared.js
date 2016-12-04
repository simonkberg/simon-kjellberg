const path = require('path')
const webpack = require('webpack')

const paths = {}

paths.config = __dirname
paths.root = path.join(paths.config, '..')
paths.build = path.join(paths.root, 'build')
paths.src = path.join(paths.root, 'src')

function getEntry (entry, hot = false) {
  const entries = []

  if (hot) {
    entries.push(
      'react-hot-loader/patch',
      'webpack-hot-middleware/client'
    )
  }

  return entries.concat(entry)
}

function getPlugins (opts = {}) {
  const {
    env = process.env.NODE_ENV,
    gaid = process.env.GA_ID,
    browser,
  } = opts

  let plugins = [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: `"${env || 'development'}"`,
        GA_ID: `"${gaid || ''}"`,
      },
      '__DEV__': env !== 'production',
      '__BROWSER__': !!browser,
    }),
    new webpack.optimize.CommonsChunkPlugin({
      children: true,
      async: true,
    }),
    // new webpack.LoaderOptionsPlugin({
    //   options: {
    //     context: paths.src,
    //   },
    // }),
  ]

  if (env === 'production') {
    plugins.push(...[
      new webpack.LoaderOptionsPlugin({
        minimize: true,
        debug: false,
      }),
      new webpack.optimize.UglifyJsPlugin({
        compress: {
          warnings: false,
          drop_console: true,
        },
        output: { comments: false },
      }),
    ])
  } else {
    plugins.push(...[
      new webpack.LoaderOptionsPlugin({ debug: true }),
      new webpack.HotModuleReplacementPlugin(),
    ])
  }

  return plugins
}

function getLoaders (opts = {}) {
  const { env = process.env.NODE_ENV } = opts
  const isDev = env !== 'production'

  let loaders = [{
    test: /\.js$/,
    use: [
      {
        loader: 'babel-loader',
        options: { cacheDirectory: true },
      },
      'eslint-loader',
    ],
    exclude: /node_modules/,
    include: paths.src,
  }, {
    test: /\.css$/,
    use: [
      'isomorphic-style',
      {
        loader: 'css',
        options: {
          modules: true,
          sourceMap: isDev,
          importLoaders: 1,
          localIdentName: isDev
            ? '[name]__[local]__[hash:base64:5]'
            : '[hash:base64]',
        },
      },
      {
        loader: 'postcss',
        options: { sourceMap: isDev },
      },
    ],
  }, {
    test: /\.(json)$/,
    loader: 'json',
  }, {
    test: /\.(png|jpe?g|gif|svg)$/,
    use: [
      {
        loader: 'url',
        options: {
          limit: 10000,
          name: '[name]-[hash].[ext]',
        },
      },
      'img',
    ],
  }, {
    test: /\.(woff2?)$/,
    loader: 'url',
    options: {
      limit: 10000,
      name: '[name]-[hash].[ext]',
    },
  }]

  return loaders
}

module.exports = exports = function sharedConfig (opts = {}) {
  const { env = process.env.NODE_ENV } = opts

  const config = {
    devtool: env !== 'production'
      ? 'cheap-module-source-map'
      : 'hidden-source-map',

    output: {
      path: paths.build,
      filename: '[name].[hash].js',
      chunkFilename: '[name].[chunkhash].js',
      publicPath: '/',
    },

    plugins: getPlugins(opts),

    resolve: {
      extensions: ['*', '.js', '.json'],
      modules: [paths.src, 'node_modules'],
    },

    resolveLoader: {
      moduleExtensions: ['-loader'],
    },

    module: {
      rules: getLoaders(opts),
    },
  }

  return config
}

exports.paths = paths
exports.getEntry = getEntry
exports.getPlugins = getPlugins
exports.getLoaders = getLoaders
