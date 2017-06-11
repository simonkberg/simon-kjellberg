const path = require('path')

const {
  DefinePlugin,
  HotModuleReplacementPlugin,
  optimize: { UglifyJsPlugin },
} = require('webpack')

const paths = {}

paths.config = __dirname
paths.loaders = path.join(paths.config, 'loaders')
paths.root = path.join(paths.config, '..')
paths.build = path.join(paths.root, 'build')
paths.src = path.join(paths.root, 'src')

function getEntry(entry, hot = false) {
  const entries = []

  if (hot) {
    entries.push('react-hot-loader/patch', 'webpack-hot-middleware/client')
  }

  return entries.concat(entry)
}

function getPlugins(opts = {}) {
  const {
    env = process.env.NODE_ENV || 'development',
    gaid = process.env.GA_ID || '',
    browser,
  } = opts

  let plugins = [
    new DefinePlugin({
      'process.env': {
        NODE_ENV: `"${env}"`,
        GA_ID: `"${gaid}"`,
      },
      __DEV__: env !== 'production',
      __BROWSER__: !!browser,
    }),
  ]

  if (env === 'production') {
    plugins.push(
      new UglifyJsPlugin({
        compress: { warnings: false },
        output: { comments: false },
      })
    )
  } else {
    plugins.push(new HotModuleReplacementPlugin())
  }

  return plugins
}

function getLoaders(opts = {}) {
  const { env = process.env.NODE_ENV } = opts
  const isDev = env !== 'production'

  let loaders = [
    {
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
    },
    {
      test: /\.css$/,
      use: [
        'isomorphic-style',
        {
          loader: 'css',
          options: {
            modules: true,
            minimize: !isDev,
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
    },
    {
      test: /\.(png|jpe?g|gif|svg)$/,
      use: [
        {
          loader: 'url',
          options: {
            limit: 10000,
            name: 'static/img/[name].[hash:8].[ext]',
          },
        },
        // 'img',
      ],
    },
    {
      test: /\.(woff2?)$/,
      loader: 'url',
      options: {
        limit: 10000,
        name: 'static/fonts/[name].[hash:8].[ext]',
      },
    },
    {
      test: /emoji\.json$/,
      loader: 'emoji',
    },
  ]

  return loaders
}

module.exports = exports = function sharedConfig(opts = {}) {
  const { env = process.env.NODE_ENV } = opts

  const isDev = env !== 'production'

  const config = {
    devtool: isDev ? 'cheap-module-source-map' : 'hidden-source-map',

    output: {
      path: paths.build,
      filename: 'static/js/[name].[hash:8].js',
      chunkFilename: 'static/js/[name].[chunkhash:8].chunk.js',
      publicPath: '/',
      pathinfo: isDev,
    },

    performance: {
      maxAssetSize: 500000,
      maxEntrypointSize: 500000,
      hints: isDev ? false : 'warning',
    },

    plugins: getPlugins(opts),

    resolve: {
      extensions: ['*', '.js', '.json'],
      modules: [paths.src, 'node_modules'],
    },

    resolveLoader: {
      modules: [paths.loaders, 'node_modules'],
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
